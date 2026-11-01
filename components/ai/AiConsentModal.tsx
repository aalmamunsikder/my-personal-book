'use client';

import React from 'react';
import { ShieldCheck, Sparkles, Check, Lock, BookOpen } from 'lucide-react';
import { BookDialogFrame } from '../common/BookDialogFrame';

interface AiConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentAndEnable: () => void;
}

export function AiConsentModal({ isOpen, onClose, onConsentAndEnable }: AiConsentModalProps) {
  if (!isOpen) return null;

  return (
    <BookDialogFrame
      open={isOpen}
      title="AI Companion Privacy & Consent"
      ariaLabelledBy="ai-consent-title"
      onClose={onClose}
      closeLabel="Close dialog"
      widthClassName="max-w-lg"
      footer={
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 w-full">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-lg transition-colors text-center"
          >
            Keep AI Disabled
          </button>
          <button
            type="button"
            onClick={onConsentAndEnable}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium bg-[#8B6343] hover:bg-[#725035] text-[#FFFCF5] rounded-lg shadow-md transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            Enable AI Companion
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Identity lockup: the frame header has no slot for the icon or the Bangla tagline. */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#8B6343]/15 border border-[#8B6343]/30 flex items-center justify-center text-[#8B6343] dark:text-[#DFB578]">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs text-[var(--ink-soft)] font-bangla">
            আপনার সাহিত্যের গোপনীয়তা আমাদের প্রথম অগ্রাধিকার
          </p>
        </div>

        {/* Body content */}
        <div className="space-y-3.5 text-xs text-[var(--ink-soft)] leading-relaxed">
          <p className="text-[var(--ink)] font-medium">
            VerseVault includes an optional AI writing companion designed to suggest titles, explain poetic metaphors, proofread in Bangla & English, and help explore themes.
          </p>

          <div className="space-y-2.5 bg-[#EFE8D8] dark:bg-[#251D17] p-3.5 rounded-xl border border-[#8B6343]/20">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#4A6741] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--ink)]">User-Initiated Only:</strong> AI is never triggered automatically during typing, opening, or autosaving. It runs strictly when you click an action.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-[#8B6343] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--ink)]">Minimal Context:</strong> Only the current entry or explicitly selected text is sent to the server. Your entire archive is never scanned without explicit confirmation.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-[#8B6343] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[var(--ink)]">Original Writing is Sacred:</strong> AI suggestions are purely consultative. The AI can never overwrite, delete, publish, or alter your journal entries on its own.
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[var(--ink-soft)]">
            Requests are processed securely server-side using Google Gemini (<span className="font-mono">gemini-3.8-flash</span>). We do not store your prompts or private writing in any database. You can disable AI anytime in Settings.
          </p>
        </div>
      </div>
    </BookDialogFrame>
  );
}
