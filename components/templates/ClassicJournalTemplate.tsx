'use client';

import React from 'react';
import { formatEditorialDate } from '../../lib/entry-utils';
import type { AppearanceConfig } from '../../types/appearance';
import type { JournalCollection, JournalEntry } from '../../types/entry';

export interface TemplateProps {
  entry: JournalEntry;
  collection?: JournalCollection | null;
  config: AppearanceConfig;
  fontScript: 'serif' | 'bn' | 'sans';
  children?: React.ReactNode;
}

export function ClassicJournalTemplate({
  entry,
  collection,
  config,
  fontScript,
  children,
}: TemplateProps) {
  const showDate = config.decorations?.dateStamp !== false;
  const isNarrow = config.typography?.readingWidth === 'narrow';
  const isWide = config.typography?.readingWidth === 'wide';

  const containerWidth = isNarrow
    ? 'max-w-[620px]'
    : isWide
    ? 'max-w-[840px]'
    : 'max-w-[720px]';

  return (
    <article
      className={`relative mx-auto rounded-lg border border-[var(--border)] p-6 sm:p-10 lg:p-12 transition-all ${containerWidth} ${
        config.decorations?.pageEdge ? 'shadow-[0_4px_16px_rgba(0,0,0,0.04)]' : ''
      }`}
      style={{
        backgroundColor: config.colors?.page || 'var(--surface)',
        borderColor: config.colors?.accent ? `${config.colors.accent}33` : 'var(--border)',
      }}
    >
      {/* Top Editorial Header */}
      <header className="mb-6 pb-4 border-b border-[var(--border)]/70 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
        {showDate && (
          <time dateTime={entry.entryDate} className="font-medium tracking-wide">
            {formatEditorialDate(entry.entryDate, true)}
          </time>
        )}
        <div className="flex items-center gap-2">
          {entry.mood && <span className="italic">Mood: {entry.mood}</span>}
          {collection && (
            <span className="font-bangla px-2 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--ink)]">
              {collection.name}
            </span>
          )}
        </div>
      </header>

      {/* Entry Title */}
      {entry.title && (
        <h1
          className="text-2xl sm:text-3xl font-semibold mb-4 text-[var(--ink)] tracking-tight journal-content"
          data-script={fontScript}
          style={{
            color: config.colors?.ink || 'var(--ink)',
          }}
        >
          {entry.title}
        </h1>
      )}

      {entry.subtitle && (
        <p
          className="text-sm sm:text-base italic mb-6 text-[var(--ink-secondary)] journal-content"
          data-script={fontScript}
        >
          {entry.subtitle}
        </p>
      )}

      {/* Main Content Area */}
      <div
        className="journal-content"
        data-script={fontScript}
        style={{
          color: config.colors?.ink || 'var(--ink)',
          fontSize: `${
            fontScript === 'bn'
              ? config.typography?.banglaFontSize || 19
              : config.typography?.englishFontSize || 18
          }px`,
          lineHeight: config.typography?.lineHeight || 1.85,
          textAlign: config.typography?.alignment || 'left',
        }}
      >
        {children || entry.content}
      </div>

      {/* Subtle Botanical corner ornament if enabled */}
      {config.decorations?.cornerAccent && (
        <div
          aria-hidden="true"
          className="absolute bottom-3 right-3 text-xs opacity-25 pointer-events-none select-none text-[var(--accent)]"
        >
          ❦
        </div>
      )}
    </article>
  );
}
