import { Timestamp, doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { AiRequestPayload, AiResponsePayload, AiSettings } from '../types/ai';

const AI_SETTINGS_STORAGE_KEY = 'versevault_ai_settings';
const DEFAULT_DAILY_LIMIT = 40;
const PROVIDER_LABEL = 'Google Gemini';
// The model id is owned by the server, so a client-side rejection must not invent one.
const UNSPECIFIED_MODEL = 'server-configured';

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: false,
  hasConsented: false,
  consentVersion: '1.0.0',
  consentAt: null,
  defaultContextScope: 'selection',
  dailyRequestCount: 0,
  dailyLimit: DEFAULT_DAILY_LIMIT,
  lastResetDate: new Date().toISOString().slice(0, 10),
  lastUsedAt: null,
};

/**
 * Only these fields are mirrored to Firestore. The counters stay local because the route handler
 * meters from its own `aiUsage` document, and a client-reported count is not a meter.
 */
const CLOUD_SYNCED_KEYS: Array<keyof AiSettings> = [
  'enabled',
  'hasConsented',
  'consentVersion',
  'consentAt',
  'defaultContextScope',
  'dailyLimit',
];

function localError(
  task: AiRequestPayload['task'],
  error: string,
  errorCode: NonNullable<AiResponsePayload['errorCode']>
): AiResponsePayload {
  return {
    requestId: `local-${Date.now()}`,
    task,
    status: 'error',
    error,
    errorCode,
    provider: { label: PROVIDER_LABEL, model: UNSPECIFIED_MODEL },
  };
}

export function getStoredAiSettings(): AiSettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;
  try {
    const raw = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;
    const parsed = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    // Reset daily counter if a new day has arrived
    if (parsed.lastResetDate !== today) {
      parsed.dailyRequestCount = 0;
      parsed.lastResetDate = today;
      localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(parsed));
    }
    return { ...DEFAULT_AI_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveStoredAiSettings(patch: Partial<AiSettings>): AiSettings {
  if (typeof window === 'undefined') return DEFAULT_AI_SETTINGS;
  try {
    const current = getStoredAiSettings();
    const updated: AiSettings = { ...current, ...patch };
    localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    if (CLOUD_SYNCED_KEYS.some((key) => key in patch)) {
      void syncAiSettingsToCloud(updated);
    }
    return updated;
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

/**
 * Copies the consent + enable state to `aiSettings/{uid}` so /api/ai-assist can verify it without
 * trusting this browser. `createdAt` is immutable, so the write runs inside a transaction.
 */
export async function syncAiSettingsToCloud(settings: AiSettings): Promise<void> {
  const user = auth.currentUser;
  if (!user || user.emailVerified !== true) return;

  const ref = doc(db, 'aiSettings', user.uid);
  const fields = {
    userId: user.uid,
    enabled: settings.enabled === true,
    hasConsented: settings.hasConsented === true,
    consentVersion: String(settings.consentVersion || '1.0.0').slice(0, 40),
    consentAt: settings.consentAt ? Timestamp.fromDate(new Date(settings.consentAt)) : null,
    defaultContextScope: settings.defaultContextScope,
    dailyLimit: Math.min(100, Math.max(1, Math.trunc(settings.dailyLimit) || DEFAULT_DAILY_LIMIT)),
    updatedAt: serverTimestamp(),
  };

  try {
    await runTransaction(db, async (tx) => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) {
        tx.set(ref, { ...fields, createdAt: serverTimestamp() });
        return;
      }
      const existingCreatedAt = snapshot.data()?.createdAt;
      tx.set(ref, {
        ...fields,
        createdAt: existingCreatedAt instanceof Timestamp ? existingCreatedAt : new Date(),
      });
    });
  } catch {
    // The local copy stays usable; requests are refused server-side until consent is mirrored.
  }
}

/**
 * Reads the cloud copy so another device reports the consent state the server actually enforces.
 * Falls back to the local cache when nobody is signed in or the read is refused.
 */
export async function hydrateAiSettingsFromCloud(): Promise<AiSettings> {
  const user = auth.currentUser;
  if (!user || user.emailVerified !== true) return getStoredAiSettings();
  try {
    const snapshot = await getDocFromServer(doc(db, 'aiSettings', user.uid));
    if (!snapshot.exists()) return getStoredAiSettings();
    const data = snapshot.data();
    const merged: AiSettings = {
      ...getStoredAiSettings(),
      enabled: data?.enabled === true,
      hasConsented: data?.hasConsented === true,
      consentVersion:
        typeof data?.consentVersion === 'string' ? data.consentVersion : DEFAULT_AI_SETTINGS.consentVersion,
      defaultContextScope: data?.defaultContextScope ?? DEFAULT_AI_SETTINGS.defaultContextScope,
      dailyLimit: typeof data?.dailyLimit === 'number' ? data.dailyLimit : DEFAULT_AI_SETTINGS.dailyLimit,
    };
    localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return getStoredAiSettings();
  }
}

/**
 * A convenience pre-check that lets the UI gray itself out early. It is not a boundary: the route
 * handler meters from its own document and is the only authority on what has been spent.
 */
export function checkDailyAiBudget(): { allowed: boolean; count: number; limit: number } {
  const settings = getStoredAiSettings();
  const allowed = settings.dailyRequestCount < settings.dailyLimit;
  return {
    allowed,
    count: settings.dailyRequestCount,
    limit: settings.dailyLimit,
  };
}

export async function requestAiAssist(payload: AiRequestPayload): Promise<AiResponsePayload> {
  const settings = getStoredAiSettings();

  if (!settings.enabled || !settings.hasConsented) {
    return localError(
      payload.task,
      'AI Companion is currently disabled. Please enable AI features and review privacy terms first.',
      settings.hasConsented ? 'AI_DISABLED' : 'CONSENT_REQUIRED'
    );
  }

  const budget = checkDailyAiBudget();
  if (!budget.allowed) {
    return localError(
      payload.task,
      `Daily AI usage limit reached (${budget.limit} requests per day). Resets tomorrow at midnight.`,
      'BUDGET_EXCEEDED'
    );
  }

  const user = auth.currentUser;
  if (!user) {
    return localError(payload.task, 'Sign in as the journal owner to use the AI companion.', 'UNAUTHENTICATED');
  }

  let idToken: string;
  try {
    idToken = await user.getIdToken();
  } catch {
    return localError(payload.task, 'Your session could not be verified. Please sign in again.', 'UNAUTHENTICATED');
  }

  let response: Response;
  try {
    response = await fetch('/api/ai-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(payload),
    });
  } catch {
    return localError(
      payload.task,
      'Could not reach the AI service. Your entry was not changed.',
      'PROVIDER_UNAVAILABLE'
    );
  }

  let data: AiResponsePayload | null = null;
  try {
    data = (await response.json()) as AiResponsePayload;
  } catch {
    data = null;
  }

  if (!data) {
    return localError(
      payload.task,
      response.ok
        ? 'The AI service returned an unreadable response.'
        : `The AI service failed (${response.status}).`,
      'INTERNAL_ERROR'
    );
  }

  if (response.ok && data.status === 'complete') {
    saveStoredAiSettings({
      dailyRequestCount: settings.dailyRequestCount + 1,
      lastUsedAt: new Date().toISOString(),
    });
  }

  return data;
}
