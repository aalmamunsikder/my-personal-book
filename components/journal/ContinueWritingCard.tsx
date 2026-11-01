'use client';

import React, { useMemo } from 'react';
import { Edit3, Feather } from 'lucide-react';
import { JournalEntry } from '../../types/entry';
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
    <div className="relative rounded-[7px] bg-gradient-to-b from-[#FAF3E6] to-[#EDE0C9] dark:from-[#2C251E] dark:to-[#231D17] border border-[#C5AD8B] dark:border-[#4A3F32] p-3 space-y-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_2px_5px_rgba(42,26,12,0.08)]">
      {/* Top brass pin stud */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#F2D39E] to-[#8C6230] border border-[#5B3D1B] shadow-xs"
      />
      <div className="flex items-center justify-between text-[11px] text-[#6E4F3A] dark:text-[#C8A882] border-b border-dashed border-[#D3BD9D] dark:border-[#3E342A] pb-1.5">
        <span className="inline-flex items-center gap-1.5 font-bangla font-semibold">
          <Feather className="w-3.5 h-3.5 text-[#8C583A]" />
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
              className="w-full text-left flex items-center justify-between gap-2 p-2 rounded-[5px] bg-[#F4E9D8]/85 dark:bg-[#312A22] hover:bg-[#EAD8BD] border border-[#D4BF9F]/80 dark:border-[#453B30] transition-all group cursor-pointer"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] border border-[#C6AE8C] bg-[#E5D3B8] dark:bg-[#433A2F] text-[var(--ink)] tabular-nums">
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
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-gradient-to-b from-[#694932] to-[#4E3422] border border-[#8E694A] text-[#FDF8F0] text-[10px] font-bangla shrink-0 group-hover:translate-x-0.5 transition-transform shadow-2xs">
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
