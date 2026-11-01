'use client';

import React from 'react';
import {
  AlignJustify,
  BookOpen,
  Feather,
  Grid,
  Mail,
  Moon,
  Sparkles,
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
      className="inline-flex items-center gap-0.5 bg-gradient-to-b from-[#EDE0CB] to-[#DFCEB3] dark:from-[#2C261F] dark:to-[#221D17] p-1 rounded-[6px] border border-[#BEA482] dark:border-[#493E32] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_2px_rgba(40,24,10,0.08)] max-w-full overflow-x-auto"
    >
      <span className="hidden xl:inline-flex items-center gap-1 px-2 text-[10px] font-bangla text-[#5E4735] dark:text-[#B89F82] shrink-0">
        <Sparkles className="w-3 h-3 text-[#9B6B43]" />
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
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10.5px] font-bangla transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-gradient-to-b from-[#5F412C] to-[#462E1D] text-[#FDF8F0] font-medium border border-[#8E694A] shadow-[0_1px_3px_rgba(30,16,7,0.28),inset_0_1px_0_rgba(255,235,205,0.25)]'
                : 'text-[#4E3929] dark:text-[#CDB89E] bg-[#EADFC8]/70 dark:bg-[#2A231C] border border-transparent hover:bg-[#D9C3A3]/65 dark:hover:bg-[#383027]'
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
