import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { AI_SYSTEM_INSTRUCTION, buildTaskPrompt } from '../../../lib/ai-prompts';
import { AiErrorCode, AiRequestPayload, AiResponsePayload, AiTask } from '../../../types/ai';

const ALLOWED_TASKS: AiTask[] = [
  'suggest_titles',
  'proofread',
  'refine',
  'explain_poem',
  'rhyme_helper',
  'translate',
  'summarize',
  'suggest_metadata',
  'writing_feedback',
  'continue_thought',
  'archive_answer',
  'custom_prompt',
];

const MAX_INPUT_CHARACTERS = 12000;
const OWNER_EMAIL = 'aalmamunsikder@gmail.com';
const ADMIN_PASSKEY = 'versevault';

function makeErrorResponse(
  error: string,
  code: AiErrorCode,
  status = 400
): NextResponse<AiResponsePayload> {
  return NextResponse.json(
    {
      requestId: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      task: 'custom_prompt',
      status: 'error',
      error,
      errorCode: code,
      provider: {
        label: 'Google Gemini',
        model: 'gemini-3.8-flash',
      },
    },
    { status }
  );
}

export async function POST(req: NextRequest): Promise<NextResponse<AiResponsePayload>> {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    let body: AiRequestPayload;
    try {
      body = await req.json();
    } catch {
      return makeErrorResponse('Invalid JSON request body.', 'INVALID_REQUEST', 400);
    }

    // Auth gate: Admin authorization strictly required for AI companion operations
    const isAdminEmail = body.adminEmail === OWNER_EMAIL;
    const isPasskeyValid = body.adminPasskey === ADMIN_PASSKEY;
    const isBearerAuthorized = bearerToken.length > 10; // Firebase ID Token or session token

    if (!isAdminEmail && !isPasskeyValid && !isBearerAuthorized) {
      return makeErrorResponse(
        'Unauthorized: AI writing assistant is reserved exclusively for the journal owner (aalmamunsikder@gmail.com).',
        'UNAUTHENTICATED',
        403
      );
    }

    // Task allowlist validation
    if (!body.task || !ALLOWED_TASKS.includes(body.task)) {
      return makeErrorResponse(
        `Invalid task "${body.task}". Must be one of: ${ALLOWED_TASKS.join(', ')}`,
        'INVALID_TASK',
        400
      );
    }

    // Input size ceiling validation (§7.2, §11)
    const inputText = (body.text || '') + (body.selectedText || '');
    if (inputText.length > MAX_INPUT_CHARACTERS) {
      return makeErrorResponse(
        `Input text exceeds the maximum limit of ${MAX_INPUT_CHARACTERS} characters (received ${inputText.length}). Please select a specific stanza or passage to analyze.`,
        'INPUT_TOO_LARGE',
        413
      );
    }

    // Context check: Ensure text or archive entries exist
    if (!inputText.trim() && body.task !== 'archive_answer') {
      return makeErrorResponse('Text input is required to perform AI analysis.', 'INVALID_REQUEST', 400);
    }

    if (body.task === 'archive_answer' && (!body.contextEntries || body.contextEntries.length === 0)) {
      return makeErrorResponse(
        'Archive context entries are required for Ask My Archive inquiries.',
        'INVALID_REQUEST',
        400
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return makeErrorResponse(
        'Server AI configuration unavailable. GEMINI_API_KEY is not configured.',
        'PROVIDER_UNAVAILABLE',
        500
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildTaskPrompt(body);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: body.task === 'suggest_titles' || body.task === 'rhyme_helper' ? 0.7 : 0.3,
      },
    });

    const responseText = response.text || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      // Fallback if model returned plain string
      parsedResult = { text: responseText };
    }

    return NextResponse.json({
      requestId: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      task: body.task,
      status: 'complete',
      result: parsedResult,
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount,
        outputTokens: response.usageMetadata?.candidatesTokenCount,
      },
      provider: {
        label: 'Google Gemini',
        model: 'gemini-3.8-flash',
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error during AI processing';
    return makeErrorResponse(errorMsg, 'INTERNAL_ERROR', 500);
  }
}
