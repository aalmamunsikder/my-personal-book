'use client';

import React from 'react';
import { Book, Feather, Moon, Sparkles, Wind } from 'lucide-react';
import { COVER_STYLES } from '../../lib/themes';
import type { CoverStyleId } from '../../types/appearance';
import type { JournalCollection } from '../../types/entry';

interface CollectionCoverCardProps {
  collection: JournalCollection;
  coverId?: CoverStyleId;
  customBg?: string;
  customText?: string;
  entryCount?: number;
  onClick?: () => void;
  onDesignClick?: () => void;
  compact?: boolean;
}

export function CollectionCoverCard({
  collection,
  coverId = 'heritage-leather',
  customBg,
  customText,
  entryCount,
  onClick,
  onDesignClick,
  compact = false,
}: CollectionCoverCardProps) {
  const styleDef = COVER_STYLES[coverId] || COVER_STYLES['heritage-leather'];
  const bgColor = customBg || styleDef.defaultBg;
  const textColor = customText || styleDef.defaultText;
  const borderColor = styleDef.defaultBorder;

  const renderCoverMotif = () => {
    switch (styleDef.motif) {
      case 'leaf':
        return (
          <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center opacity-70">
            <Wind className="w-4 h-4" />
          </div>
        );
      case 'star':
        return (
          <div className="flex items-center gap-1 opacity-75">
            <Moon className="w-4 h-4" />
            <Sparkles className="w-3 h-3" />
          </div>
        );
      case 'quill':
        return (
          <div className="w-7 h-7 rounded border border-current/40 flex items-center justify-center opacity-80">
            <Feather className="w-3.5 h-3.5" />
          </div>
        );
      case 'book':
        return (
          <div className="w-7 h-7 rounded border border-current/40 flex items-center justify-center opacity-80">
            <Book className="w-3.5 h-3.5" />
          </div>
        );
      case 'wave':
        return (
          <div className="flex items-center gap-1 tracking-widest text-xs opacity-75 font-serif select-none">
            ~~~
          </div>
        );
      case 'flower':
        return (
          <div className="text-xs opacity-75 select-none font-serif">
            ❦
          </div>
        );
      case 'minimal':
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative group rounded-md cursor-pointer transition-all duration-200 overflow-hidden select-none text-left flex flex-col justify-between ${
        compact ? 'h-48 p-4' : 'h-64 p-6'
      } shadow-[0_4px_16px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:-translate-y-0.5`}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* Authentic Notebook Spine Emboss (left border highlight) */}
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-3.5 bg-black/15 border-r border-white/10 pointer-events-none"
      />

      {/* Top Header & Motif */}
      <div className="flex items-start justify-between gap-2 pl-3">
        <div className="text-[10px] tracking-widest uppercase opacity-75 font-mono">
          Vol. {styleDef.name}
        </div>
        <div>{renderCoverMotif()}</div>
      </div>

      {/* Center Collection Title */}
      <div className="pl-3 my-auto">
        <h3 className="font-bangla font-semibold text-lg sm:text-xl leading-tight line-clamp-2">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="text-xs opacity-75 line-clamp-2 mt-1.5 font-light">
            {collection.description}
          </p>
        )}
      </div>

      {/* Bottom Metadata & Design Button */}
      <div className="flex items-center justify-between text-xs opacity-80 pt-2 border-t border-current/20 pl-3">
        <span>{typeof entryCount === 'number' ? `${entryCount} pages` : 'Notebook'}</span>
        {onDesignClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDesignClick();
            }}
            aria-label={`Design appearance for ${collection.name}`}
            className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-black/20 hover:bg-black/35 transition-colors"
          >
            Design
          </button>
        )}
      </div>
    </div>
  );
}
