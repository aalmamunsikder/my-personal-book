'use client';

import React from 'react';
import {
  AlignJustify,
  BookOpen,
  Crown,
  Feather,
  Grid,
  Leaf,
  Mail,
  Moon,
  Scroll,
  Sparkles,
  Table2,
} from 'lucide-react';
import type { PageVariation } from '../../types/entry';
import { PAGE_VARIATIONS } from '../../lib/journal-templates';
import { bookSound } from '../../lib/book-sound-engine';

interface PageVariationSwitcherProps {
  value: PageVariation;
  onChange: (next: PageVariation) => void;
  compact?: boolean;
}

const VARIATION_ICONS: Record<PageVariation, React.ComponentType<{ className?: string }>> = {
  'vintage-parchment': BookOpen,
  'ruled-notebook': AlignJustify,
  'poetry-scroll': Feather,
  'epistolary-letter': Mail,
  'dot-commonplace': Grid,
  'nocturnal-vellum': Moon,
  'botanical-herbarium': Leaf,
  'royal-illuminated': Crown,
  'deckle-handmade': Scroll,
  'ledger-chronicle': Table2,
};

export function PageVariationSwitcher({
  value,
  onChange,
  compact = false,
}: PageVariationSwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Page Paper Style Variation"
      style={{
        background: 'var(--vv-secondary-btn-bg)',
        borderColor: 'var(--vv-card-border)',
      }}
      className="inline-flex items-center gap-0.5 p-1 rounded-[6px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_1px_2px_rgba(40,24,10,0.08)] max-w-full overflow-x-auto"
    >
      <span className="hidden xl:inline-flex items-center gap-1 px-2 text-[10px] font-bangla text-[var(--ink-soft)] shrink-0">
        <Sparkles className="w-3 h-3 text-[var(--accent)]" />
        <span>পাতার ধরন:</span>
      </span>
      {PAGE_VARIATIONS.map((pv) => {
        const Icon = VARIATION_ICONS[pv.id];
        const isActive = value === pv.id;
        return (
          <button
            key={pv.id}
            type="button"
            onClick={() => {
              bookSound.playPageTurnSound('next');
              onChange(pv.id);
            }}
            title={`${pv.nameBn} (${pv.nameEn}) — ${pv.description}`}
            style={
              isActive
                ? {
                    background: 'var(--vv-primary-btn-bg)',
                    borderColor: 'var(--vv-primary-btn-border)',
                    color: 'var(--vv-primary-btn-text)',
                  }
                : undefined
            }
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10.5px] font-bangla transition-all shrink-0 whitespace-nowrap cursor-pointer border ${
              isActive
                ? 'font-medium shadow-[0_1px_3px_rgba(30,16,7,0.28),inset_0_1px_0_rgba(255,235,205,0.25)]'
                : 'text-[var(--ink)] bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 dark:hover:bg-white/10'
            }`}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span>{compact ? pv.shortLabel : pv.nameBn}</span>
          </button>
        );
      })}
    </div>
  );
}
