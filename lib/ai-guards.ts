import type { AiErrorCode } from '../types/ai';
import { MAX_ARCHIVE_CONTEXT_ITEMS, MAX_INPUT_CHARACTERS } from './ai-contracts';

/**
 * The parts of the AI request boundary that are pure decisions. Keeping them free of I/O means the
 * consent gate, the budget arithmetic, and the "never echo the rejected value" rule are all covered
 * by `ai-features.test.ts` instead of living only inside a route handler nobody can call from a test.
 */

export const DEFAULT_DAILY_LIMIT = 40;
export const MAX_DAILY_LIMIT = 100;

export interface GuardOutcome {
  code: AiErrorCode;
  status: number;
  message: string;
}

export function clampLimit(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_DAILY_LIMIT;
  return Math.min(MAX_DAILY_LIMIT, Math.max(1, Math.trunc(parsed)));
}

export type BudgetDecision =
  | { ok: true; limit: number; reserved: number }
  | { ok: false; failure: GuardOutcome };

/**
 * `settings` and `usage` are the documents as the Firestore rules allowed *this* caller to read them,
 * so a tampered localStorage copy never reaches here. Consent is checked before enablement: a switched-on
 * toggle with no recorded consent is a broken state and must be refused, not trusted.
 */
export function decideBudget(args: {
  settings: Record<string, unknown> | null;
  usage: Record<string, unknown> | null;
  day: string;
}): BudgetDecision {
  const { settings, usage, day } = args;

  if (!settings) {
    return {
      ok: false,
      failure: {
        code: 'CONSENT_REQUIRED',
        status: 403,
        message: 'AI features have not been enabled on this account. Review the privacy terms in Settings first.',
      },
    };
  }
  if (settings.hasConsented !== true) {
    return {
      ok: false,
      failure: { code: 'CONSENT_REQUIRED', status: 403, message: 'AI features require your explicit consent in Settings.' },
    };
  }
  if (settings.enabled !== true) {
    return {
      ok: false,
      failure: { code: 'AI_DISABLED', status: 403, message: 'AI features are currently switched off in Settings.' },
    };
  }

  const usedToday = usage && usage.day === day && typeof usage.count === 'number' ? usage.count : 0;
  const limit = clampLimit(settings.dailyLimit);
  if (usedToday >= limit) {
    return {
      ok: false,
      failure: {
        code: 'BUDGET_EXCEEDED',
        status: 429,
        message: `Daily AI usage limit reached (${limit} requests). The count resets at midnight UTC.`,
      },
    };
  }
  return { ok: true, limit, reserved: usedToday + 1 };
}

export interface RequestShapeInput {
  task: string;
  text: string;
  selectedText?: string;
  contextEntries?: unknown[];
}

/** Order matters: an oversized payload is refused before anything is sent to the provider. */
export function decideRequestShape(body: RequestShapeInput): GuardOutcome | null {
  if ((body.text + (body.selectedText ?? '')).length > MAX_INPUT_CHARACTERS) {
    return {
      code: 'INPUT_TOO_LARGE',
      status: 413,
      message: `Input exceeds ${MAX_INPUT_CHARACTERS} characters. Select a stanza or passage instead of sending the whole entry.`,
    };
  }
  const hasInput = (body.text + (body.selectedText ?? '')).trim().length > 0;
  if (!hasInput && body.task !== 'archive_answer') {
    return { code: 'INVALID_REQUEST', status: 400, message: 'Text input is required to perform AI analysis.' };
  }
  if (body.task === 'archive_answer') {
    if (!body.contextEntries || body.contextEntries.length === 0) {
      return {
        code: 'INVALID_REQUEST',
        status: 400,
        message: 'Archive context entries are required for Ask My Archive inquiries.',
      };
    }
    if (body.contextEntries.length > MAX_ARCHIVE_CONTEXT_ITEMS) {
      return {
        code: 'INVALID_REQUEST',
        status: 400,
        message: `Archive context is capped at ${MAX_ARCHIVE_CONTEXT_ITEMS} entries. Narrow the question or the selection.`,
      };
    }
  }
  return null;
}

/**
 * Paths and codes only — never the rejected value, which may be a line from the diary.
 */
export function validationSummary(error: unknown): string {
  const issues = (error as { issues?: Array<{ path: PropertyKey[]; code: string }> }).issues ?? [];
  return issues.map((issue) => `${issue.path.join('.') || 'body'}:${issue.code}`).join(', ');
}
