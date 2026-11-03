'use client';

import React, { useMemo } from 'react';
import { Edit3, Feather } from 'lucide-react';
import type { JournalEntry } from '../../types/entry';
import { formatDayMonthBadge, getSingleLinePreview, toBanglaDigits } from '../../lib/entry-utils';
import { bookSound } from '../../lib/book-sound-engine';

interface ContinueWritingCardProps {
  entries: JournalEntry[];
  onResumeDraft: (entryId: string) => void;
}

export function ContinueWritingCard({ entries, onResumeDraft }: ContinueWritingCardProps) {
  const drafts = useMemo(
    () => entries.filter((e) => !e.isTrashed && e.status === 'draft'),
    [entries]
  );

  if (drafts.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--vv-card-bg)',
        borderColor: 'var(--vv-card-border)',
      }}
      className="relative rounded-[7px] border p-3 space-y-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_2px_5px_rgba(42,26,12,0.08)] transition-all duration-300"
    >
      {/* Top brass pin stud */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#F2D39E] to-[#8C6230] border border-[#5B3D1B] shadow-xs"
      />
      <div
        style={{ borderColor: 'var(--vv-card-border)' }}
        className="flex items-center justify-between text-[11px] text-[var(--accent)] border-b border-dashed pb-1.5"
      >
        <span className="inline-flex items-center gap-1.5 font-bangla font-semibold">
          <Feather className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>অসমাপ্ত খসড়া পাতা (Unfinished Drafts · {toBanglaDigits(drafts.length)})</span>
        </span>
        <span className="text-[10px] tracking-widest opacity-60">✦</span>
      </div>

      <div className="space-y-1.5">
        {drafts.slice(0, 2).map((draft) => {
          const badge = formatDayMonthBadge(draft.entryDate);
          return (
            <button
              key={draft.id}
              type="button"
              onClick={() => {
                bookSound.playPageTurnSound('next');
                onResumeDraft(draft.id);
              }}
              style={{
                background: 'var(--vv-secondary-btn-bg)',
                borderColor: 'var(--vv-card-border)',
              }}
              className="w-full text-left flex items-center justify-between gap-2 p-2 rounded-[5px] hover:brightness-97 border transition-all group cursor-pointer"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    style={{ borderColor: 'var(--vv-card-border)' }}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] border bg-black/5 dark:bg-white/5 text-[var(--ink)] tabular-nums"
                  >
                    {badge.day} {badge.month}
                  </span>
                  <h4 className="text-xs font-bold font-bangla text-[var(--ink)] truncate">
                    {draft.title || 'অসমাপ্ত পাতা (Untitled Draft)'}
                  </h4>
                </div>
                <p className="text-[11px] font-bangla text-[var(--ink-soft)] truncate mt-0.5">
                  {getSingleLinePreview(draft.content, 52)}
                </p>
              </div>
              <span
                style={{
                  background: 'var(--vv-primary-btn-bg)',
                  borderColor: 'var(--vv-primary-btn-border)',
                  color: 'var(--vv-primary-btn-text)',
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] border text-[10px] font-bangla shrink-0 group-hover:translate-x-0.5 transition-transform shadow-2xs"
              >
                <Edit3 className="w-3 h-3" />
                <span>লিখুন</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
