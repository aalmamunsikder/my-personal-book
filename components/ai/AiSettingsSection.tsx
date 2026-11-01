'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Shield, RefreshCw, Trash2, Check, Lock, Cpu } from 'lucide-react';
import { getStoredAiSettings, hydrateAiSettingsFromCloud, saveStoredAiSettings } from '../../lib/ai-client';
import type { AiSettings } from '../../types/ai';

interface AiSettingsSectionProps {
  onOpenConsentModal: () => void;
}

export function AiSettingsSection({ onOpenConsentModal }: AiSettingsSectionProps) {
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => getStoredAiSettings());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // The server holds the consent state that actually gates a request, so show that copy, not the cache.
  useEffect(() => {
    let cancelled = false;
    void hydrateAiSettingsFromCloud().then((latest) => {
      if (!cancelled) setAiSettings(latest);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleAi = () => {
    if (!aiSettings.hasConsented && !aiSettings.enabled) {
      onOpenConsentModal();
      return;
    }

    const nextState = !aiSettings.enabled;
    const updated = saveStoredAiSettings({ enabled: nextState });
    setAiSettings(updated);
    setFeedbackMsg(nextState ? 'AI Companion enabled.' : 'AI Companion disabled.');
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleRevokeConsent = () => {
    const updated = saveStoredAiSettings({
      enabled: false,
      hasConsented: false,
      consentAt: null,
      dailyRequestCount: 0,
    });
    setAiSettings(updated);
    setFeedbackMsg('AI consent revoked and cache cleared.');
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[var(--page)] border border-[var(--line)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#8B6343]/15 border border-[#8B6343]/30 flex items-center justify-center text-[#8B6343] dark:text-[#DFB578]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-literary font-semibold text-[var(--ink)]">
              AI Writing Companion & Privacy
            </h4>
            <p className="text-xs text-[var(--ink-soft)] font-bangla">
              সাহিত্যিক সঙ্গী ও গোপনীয়তা নিয়ন্ত্রণ
            </p>
          </div>
        </div>

        {/* Enable / Disable Toggle Switch */}
        <button
          type="button"
          onClick={handleToggleAi}
          aria-checked={aiSettings.enabled}
          role="switch"
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            aiSettings.enabled ? 'bg-[#8B6343]' : 'bg-[var(--line)]'
          }`}
        >
          <span className="sr-only">Toggle AI Companion</span>
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              aiSettings.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-2.5 rounded-lg bg-[#8B6343]/10 text-xs text-[var(--ink)] flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Transparency Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
        <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
            <Cpu className="w-3.5 h-3.5 text-[#8B6343]" />
            <span>AI Provider & Model</span>
          </div>
          <p className="text-[11px] text-[var(--ink-soft)] font-mono">
            Google Gemini · gemini-3.8-flash
          </p>
          <p className="text-[10px] text-[var(--ink-soft)]">
            Server-side execution · Zero client API keys
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--line)] space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
            <Shield className="w-3.5 h-3.5 text-[#4A6741]" />
            <span>Daily Usage Ceiling</span>
          </div>
          <p className="text-[11px] text-[var(--ink-soft)]">
            <span className="font-semibold text-[var(--ink)] font-mono">
              {aiSettings.dailyRequestCount}
            </span>{' '}
            / {aiSettings.dailyLimit} requests used today
          </p>
          <p className="text-[10px] text-[var(--ink-soft)]">
            Resets automatically at midnight
          </p>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-[var(--paper)] border border-[var(--line)] text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#8B6343]" />
            <span className="text-[var(--ink)] font-medium">Privacy Status:</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
              aiSettings.hasConsented
                ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
          >
            {aiSettings.hasConsented ? 'Consent Recorded (v1.0.0)' : 'Consent Pending'}
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-soft)] leading-relaxed">
          VerseVault never trains models on your writing and never persists prompt or response text in any database. AI is strictly user-initiated.
        </p>

        {aiSettings.hasConsented && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleRevokeConsent}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Revoke Consent & Reset AI Cache
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
