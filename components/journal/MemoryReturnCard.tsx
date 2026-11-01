'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, RefreshCw, Sparkles } from 'lucide-react';
import { JournalEntry } from '../../types/entry';
import { formatBanglaFullDate, getSingleLinePreview } from '../../lib/entry-utils';
import { bookSound } from '../../lib/book-sound-engine';

interface MemoryReturnCardProps {
  entries: JournalEntry[];
  onSelectEntry: (entryId: string) => void;
}

export function MemoryReturnCard({ entries, onSelectEntry }: MemoryReturnCardProps) {
  const [shuffleIndex, setShuffleIndex] = useState<number>(0);

  const memoryPool = useMemo(() => {
    const favorites = entries.filter((e) => !e.isTrashed && e.isFavorite);
    if (favorites.length > 0) return favorites;
    return entries.filter((e) => !e.isTrashed);
  }, [entries]);

  if (memoryPool.length === 0) return null;

  const memory = memoryPool[shuffleIndex % memoryPool.length];

  return (
    <div className="relative rounded-[7px] bg-gradient-to-b from-[#F9F1E2] to-[#EBDEC7] dark:from-[#2B251E] dark:to-[#221D17] border border-[#C5AD8B] dark:border-[#42392E] p-3.5 space-y-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_2px_6px_rgba(40,24,10,0.08)]">
      {/* Corner filigree ticks */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1 left-1.5 text-[9px] text-[#9E7B56]/70 select-none"
      >
        ⌜
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1 right-1.5 text-[9px] text-[#9E7B56]/70 select-none"
      >
        ⌝
      </span>
      <div className="flex items-center justify-between text-[11px] text-[#6E5239] dark:text-[#C8A882] border-b border-dashed border-[#D3BE9E] dark:border-[#3D342A] pb-1.5">
        <span className="inline-flex items-center gap-1.5 font-bangla font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#9C6B3B]" />
          <span>স্মৃতির পাতা থেকে (Archival Memory Leaf)</span>
        </span>
        {memoryPool.length > 1 && (
          <button
            type="button"
            onClick={() => {
              bookSound.playPageTurnSound('prev');
              setShuffleIndex((i) => i + 1);
            }}
            aria-label="Show another memory"
            title="অন্য একটি স্মৃতি দেখুন"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#E5D3B8]/80 dark:bg-[#362E25] border border-[#C4AC89] dark:border-[#4B3F33] hover:bg-[#DBC4A2] font-bangla text-[10.5px] cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>পাল্টান</span>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          bookSound.playPageTurnSound('next');
          onSelectEntry(memory.id);
        }}
        className="w-full text-left group space-y-1 focus:outline-none cursor-pointer"
      >
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-bold font-bangla text-[var(--ink)] group-hover:text-[var(--accent)] truncate">
            {memory.title || 'Untitled memory'}
          </h4>
          <span className="text-[10px] font-bangla text-[var(--ink-soft)] shrink-0">
            {formatBanglaFullDate(memory.entryDate, false)}
          </span>
        </div>
        <p className="text-xs font-bangla text-[var(--ink-soft)] line-clamp-2 leading-relaxed italic">
          “{getSingleLinePreview(memory.content, 85)}”
        </p>
        <span className="inline-flex items-center gap-1 text-[11px] font-bangla font-medium text-[#6E4F3A] dark:text-[#C8A882] pt-0.5 group-hover:underline">
          <BookOpen className="w-3 h-3" />
          <span>পাতাটি খুলুন →</span>
        </span>
      </button>
    </div>
  );
}
