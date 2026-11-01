import { AiRequestPayload, AiResponsePayload, AiSettings } from '../types/ai';

const AI_SETTINGS_STORAGE_KEY = 'versevault_ai_settings';
const DEFAULT_DAILY_LIMIT = 40;

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
    return updated;
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function checkDailyAiBudget(): { allowed: boolean; count: number; limit: number } {
  const settings = getStoredAiSettings();
  const allowed = settings.dailyRequestCount < settings.dailyLimit;
  return {
    allowed,
    count: settings.dailyRequestCount,
    limit: settings.dailyLimit,
  };
}

export async function requestAiAssist(
  payload: AiRequestPayload,
  token?: string
): Promise<AiResponsePayload> {
  const settings = getStoredAiSettings();

  if (!settings.enabled || !settings.hasConsented) {
    return {
      requestId: `err-${Date.now()}`,
      task: payload.task,
      status: 'error',
      error: 'AI Companion is currently disabled. Please enable AI features and review privacy terms first.',
      errorCode: !settings.hasConsented ? 'CONSENT_REQUIRED' : 'AI_DISABLED',
      provider: { label: 'Google Gemini', model: 'gemini-3.8-flash' },
    };
  }

  const budget = checkDailyAiBudget();
  if (!budget.allowed) {
    return {
      requestId: `err-${Date.now()}`,
      task: payload.task,
      status: 'error',
      error: `Daily AI usage limit reached (${budget.limit} requests per day). Resets tomorrow at midnight.`,
      errorCode: 'BUDGET_EXCEEDED',
      provider: { label: 'Google Gemini', model: 'gemini-3.8-flash' },
    };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch('/api/ai-assist', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data: AiResponsePayload = await response.json();

  if (response.ok && data.status === 'complete') {
    // Increment daily usage count and update timestamp
    saveStoredAiSettings({
      dailyRequestCount: settings.dailyRequestCount + 1,
      lastUsedAt: new Date().toISOString(),
    });
  }

  return data;
}
