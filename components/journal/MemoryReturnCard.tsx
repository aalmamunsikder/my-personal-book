'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, RefreshCw, Sparkles } from 'lucide-react';
import type { JournalEntry } from '../../types/entry';
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
    <div
      style={{
        background: 'var(--vv-card-bg)',
        borderColor: 'var(--vv-card-border)',
      }}
      className="relative rounded-[7px] border p-3.5 space-y-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_2px_6px_rgba(40,24,10,0.08)] transition-all duration-300"
    >
      {/* Corner filigree ticks */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1 left-1.5 text-[9px] text-[var(--accent)] opacity-70 select-none"
      >
        ⌜
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1 right-1.5 text-[9px] text-[var(--accent)] opacity-70 select-none"
      >
        ⌝
      </span>
      <div
        style={{ borderColor: 'var(--vv-card-border)' }}
        className="flex items-center justify-between text-[11px] text-[var(--accent)] border-b border-dashed pb-1.5"
      >
        <span className="inline-flex items-center gap-1.5 font-bangla font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
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
            style={{
              background: 'var(--vv-secondary-btn-bg)',
              borderColor: 'var(--vv-card-border)',
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border hover:brightness-95 text-[var(--ink)] font-bangla text-[10.5px] cursor-pointer"
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
        <span className="inline-flex items-center gap-1 text-[11px] font-bangla font-medium text-[var(--accent)] pt-0.5 group-hover:underline">
          <BookOpen className="w-3 h-3" />
          <span>পাতাটি খুলুন →</span>
        </span>
      </button>
    </div>
  );
}
