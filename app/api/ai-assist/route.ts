import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AI_SYSTEM_INSTRUCTION, buildTaskPrompt } from '../../../lib/ai-prompts';
import { parseAiResult, aiRequestSchema } from '../../../lib/ai-contracts';
import {
  decideBudget,
  decideRequestShape,
  validationSummary,
  type GuardOutcome,
} from '../../../lib/ai-guards';
import {
  FirestoreRestError,
  createDocumentWithToken,
  readDocumentWithToken,
  writeDocumentFields,
} from '../../../lib/firestore-rest';
import firebaseConfig from '../../../firebase-applet-config.json' with { type: 'json' };
import type { AiErrorCode, AiResponsePayload, AiTask } from '../../../types/ai';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const OWNER_EMAIL = (process.env.VERSEVAULT_OWNER_EMAIL || 'aalmamunsikder@gmail.com').toLowerCase();
const PROVIDER_LABEL = 'Google Gemini';
// The model id is server-owned: the browser never gets to choose what the key is billed against.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const PROMPT_VERSION = '1.0.0';
const PROVIDER_TIMEOUT_MS = 30000;

const firebaseJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

class GuardRejection extends Error {
  readonly code: AiErrorCode;
  readonly status: number;
  // Explicit assignments rather than constructor parameter properties: `node --test` runs this module
  // through TypeScript strip-only mode, which rejects the shorthand. Next's build accepts either.
  constructor(code: AiErrorCode, status: number, message: string) {
    super(message);
    this.name = 'GuardRejection';
    this.code = code;
    this.status = status;
  }

  static from(outcome: GuardOutcome): GuardRejection {
    return new GuardRejection(outcome.code, outcome.status, outcome.message);
  }
}

function newRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeErrorResponse(
  requestId: string,
  task: AiTask,
  error: string,
  code: AiErrorCode,
  status: number
): NextResponse<AiResponsePayload> {
  return NextResponse.json(
    { requestId, task, status: 'error', error, errorCode: code, provider: { label: PROVIDER_LABEL, model: MODEL } },
    { status }
  );
}

/**
 * Verifies the caller's Firebase ID token against Google's JWKS. Everything after this point is
 * gated on `uid`, which came out of a signed claim rather than the request body.
 */
async function verifyOwnerSession(req: NextRequest): Promise<{ uid: string; idToken: string }> {
  const header = req.headers.get('authorization') || '';
  const idToken = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!idToken) {
    throw new GuardRejection('UNAUTHENTICATED', 401, 'Sign in as the journal owner to use the AI companion.');
  }

  let claims: Awaited<ReturnType<typeof jwtVerify>>['payload'];
  try {
    ({ payload: claims } = await jwtVerify(idToken, firebaseJwks, {
      issuer: [
        `https://securetoken.googleapis.com/v1/token/projects/${PROJECT_ID}`,
        `https://securetoken.googleapis.com/v1/token/${PROJECT_ID}`,
      ],
      audience: PROJECT_ID,
    }));
  } catch {
    throw new GuardRejection(
      'UNAUTHENTICATED',
      401,
      'Your session could not be verified. Please sign in again.'
    );
  }

  const email = typeof claims.email === 'string' ? claims.email.toLowerCase() : '';
  const uid = typeof claims.sub === 'string' ? claims.sub : '';
  if (!uid || claims.email_verified !== true || email !== OWNER_EMAIL) {
    throw new GuardRejection(
      'UNAUTHENTICATED',
      403,
      'The AI companion is available only to the verified owner of this journal.'
    );
  }
  return { uid, idToken };
}

function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Consent and budget are read from Firestore with the caller's own token, so the rules decide
 * visibility and a tampered localStorage copy cannot unlock a request or raise a limit. The decision
 * itself is pure (`decideBudget`); this function only performs the reads and the reserve write.
 */
async function reserveBudget(caller: { uid: string; idToken: string }): Promise<number> {
  // One day stamp for the read, the decision, and the write: a request that crosses midnight UTC
  // must not compare yesterday's counter against today's limit.
  const day = utcDay();
  let settings: Record<string, unknown> | null;
  let usage: Record<string, unknown> | null;
  try {
    settings = await readDocumentWithToken('aiSettings', caller.uid, caller.idToken);
    usage = await readDocumentWithToken('aiUsage', caller.uid, caller.idToken);
  } catch {
    throw new GuardRejection(
      'UNAUTHENTICATED',
      401,
      'Your session could not be checked against the archive. Please sign in again.'
    );
  }

  const decision = decideBudget({ settings, usage, day });
  if (!decision.ok) throw GuardRejection.from(decision.failure);

  try {
    await writeDocumentFields(
      'aiUsage',
      caller.uid,
      { userId: caller.uid, day, count: decision.reserved },
      caller.idToken
    );
  } catch {
    // If the meter cannot be written, the request cannot be spent.
    throw new GuardRejection(
      'INTERNAL_ERROR',
      503,
      'Usage metering is unavailable right now, so the request was not sent. Please try again shortly.'
    );
  }
  return decision.reserved;
}

async function recordUsageEvent(args: {
  requestId: string;
  uid: string;
  idToken: string;
  task: AiTask;
  status: 'complete' | 'error';
  inputTokens?: number | null;
  outputTokens?: number | null;
  durationMs: number;
}): Promise<void> {
  try {
    await createDocumentWithToken(
      'aiUsageEvents',
      args.requestId,
      {
        userId: args.uid,
        requestId: args.requestId,
        task: args.task,
        provider: PROVIDER_LABEL,
        model: MODEL,
        promptVersion: PROMPT_VERSION,
        status: args.status,
        inputTokens: args.inputTokens ?? null,
        outputTokens: args.outputTokens ?? null,
        durationMs: args.durationMs,
      },
      args.idToken
    );
  } catch {
    // Usage metadata is the least important part of the request and must never surface as an error.
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('provider-timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export async function POST(req: NextRequest): Promise<NextResponse<AiResponsePayload>> {
  const requestId = newRequestId();
  let task: AiTask = 'custom_prompt';
  const startedAt = Date.now();

  try {
    const caller = await verifyOwnerSession(req);

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      throw new GuardRejection('INVALID_REQUEST', 400, 'Invalid JSON request body.');
    }

    const parsed = aiRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new GuardRejection(
        'INVALID_REQUEST',
        400,
        `Request failed validation (${validationSummary(parsed.error)}).`
      );
    }
    const body = parsed.data;
    task = body.task;

    const shapeFailure = decideRequestShape(body);
    if (shapeFailure) throw GuardRejection.from(shapeFailure);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new GuardRejection(
        'PROVIDER_UNAVAILABLE',
        503,
        'Server AI configuration is unavailable. GEMINI_API_KEY is not set.'
      );
    }

    await reserveBudget(caller);

    const ai = new GoogleGenAI({ apiKey });
    const temperature = task === 'suggest_titles' || task === 'rhyme_helper' ? 0.7 : 0.3;

    let providerResponse;
    try {
      providerResponse = await withTimeout(
        ai.models.generateContent({
          model: MODEL,
          contents: buildTaskPrompt(body),
          config: {
            systemInstruction: AI_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            temperature,
          },
        }),
        PROVIDER_TIMEOUT_MS
      );
    } catch (err) {
      const timedOut = err instanceof Error && err.message === 'provider-timeout';
      await recordUsageEvent({
        requestId,
        uid: caller.uid,
        idToken: caller.idToken,
        task,
        status: 'error',
        durationMs: Date.now() - startedAt,
      });
      throw new GuardRejection(
        timedOut ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
        timedOut ? 504 : 502,
        timedOut
          ? 'The AI provider took too long to respond. Your entry was not changed — please try again.'
          : 'The AI provider could not be reached. Your entry was not changed — please try again shortly.'
      );
    }

    const responseText = providerResponse.text ?? '';
    let candidate: unknown;
    try {
      candidate = responseText.trim() ? JSON.parse(responseText) : {};
    } catch {
      // Some tasks legitimately answer in prose, so plain text is wrapped rather than rejected.
      candidate = { text: responseText };
    }

    const result = parseAiResult(candidate);
    if (!result) {
      await recordUsageEvent({
        requestId,
        uid: caller.uid,
        idToken: caller.idToken,
        task,
        status: 'error',
        durationMs: Date.now() - startedAt,
      });
      throw new GuardRejection(
        'INVALID_MODEL_OUTPUT',
        502,
        'The AI provider returned a response this app could not understand. Nothing was inserted into your entry.'
      );
    }

    const durationMs = Date.now() - startedAt;
    await recordUsageEvent({
      requestId,
      uid: caller.uid,
      idToken: caller.idToken,
      task,
      status: 'complete',
      inputTokens: providerResponse.usageMetadata?.promptTokenCount ?? null,
      outputTokens: providerResponse.usageMetadata?.candidatesTokenCount ?? null,
      durationMs,
    });

    // Deliberate: the prompt and the completion are never written to logs, only their shape.
    console.info(
      JSON.stringify({
        scope: 'versevault-ai',
        requestId,
        task,
        model: MODEL,
        durationMs,
      })
    );

    return NextResponse.json({
      requestId,
      task,
      status: 'complete',
      result,
      usage: {
        inputTokens: providerResponse.usageMetadata?.promptTokenCount,
        outputTokens: providerResponse.usageMetadata?.candidatesTokenCount,
      },
      provider: { label: PROVIDER_LABEL, model: MODEL },
    });
  } catch (err) {
    if (err instanceof GuardRejection) {
      return makeErrorResponse(requestId, task, err.message, err.code, err.status);
    }
    if (err instanceof FirestoreRestError) {
      return makeErrorResponse(
        requestId,
        task,
        'The archive could not be reached for this request. Please try again.',
        'INTERNAL_ERROR',
        503
      );
    }
    return makeErrorResponse(
      requestId,
      task,
      'The AI companion could not complete this request.',
      'INTERNAL_ERROR',
      500
    );
  }
}

export async function GET(): Promise<NextResponse<AiResponsePayload>> {
  return makeErrorResponse(
    newRequestId(),
    'custom_prompt',
    'Only POST is accepted.',
    'INVALID_REQUEST',
    405
  );
}
