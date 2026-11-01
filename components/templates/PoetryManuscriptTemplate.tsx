'use client';

import React from 'react';
import { formatEditorialDate } from '../../lib/entry-utils';
import { TemplateProps } from './ClassicJournalTemplate';

export function PoetryManuscriptTemplate({
  entry,
  collection,
  config,
  fontScript,
  children,
}: TemplateProps) {
  const showDate = config.decorations?.dateStamp !== false;
  const isWide = config.typography?.readingWidth === 'wide';

  const containerWidth = isWide ? 'max-w-[700px]' : 'max-w-[580px]';

  return (
    <article
      className={`relative mx-auto rounded-lg border border-[var(--border)] px-6 sm:px-12 py-12 transition-all ${containerWidth} ${
        config.decorations?.pageEdge ? 'shadow-[0_4px_20px_rgba(0,0,0,0.03)]' : ''
      }`}
      style={{
        backgroundColor: config.colors?.page || 'var(--surface)',
      }}
    >
      {/* Centered Ornamental Header */}
      <header className="text-center mb-8 pb-4">
        {showDate && (
          <p className="text-[11px] uppercase tracking-widest text-[var(--ink-muted)] mb-2 font-serif">
            {formatEditorialDate(entry.entryDate, false)}
          </p>
        )}

        {entry.title && (
          <h1
            className="text-2xl sm:text-3xl font-serif font-medium text-[var(--ink)] tracking-tight journal-content"
            data-script={fontScript}
            style={{ color: config.colors?.ink || 'var(--ink)' }}
          >
            {entry.title}
          </h1>
        )}

        {entry.subtitle && (
          <p className="text-sm italic text-[var(--ink-secondary)] mt-1.5 font-serif">
            {entry.subtitle}
          </p>
        )}

        {/* Small Poetry Divider Motif */}
        {config.decorations?.divider && (
          <div className="flex items-center justify-center gap-2 mt-4 text-[var(--accent)] opacity-40 select-none">
            <span className="h-[1px] w-8 bg-current" />
            <span className="text-xs">✦</span>
            <span className="h-[1px] w-8 bg-current" />
          </div>
        )}
      </header>

      {/* Poetry Stanzas */}
      <div
        className="journal-content poem-stanza mx-auto"
        data-script={fontScript}
        style={{
          color: config.colors?.ink || 'var(--ink)',
          fontSize: `${
            fontScript === 'bn'
              ? config.typography?.banglaFontSize || 19
              : config.typography?.englishFontSize || 18
          }px`,
          lineHeight: (config.typography?.lineHeight || 1.85) * 1.08,
          textAlign: config.typography?.alignment === 'center' ? 'center' : 'left',
        }}
      >
        {children || entry.content}
      </div>

      {collection && (
        <footer className="mt-10 pt-4 border-t border-[var(--border)]/40 text-center text-xs text-[var(--ink-muted)]">
          <span className="font-bangla">{collection.name}</span>
        </footer>
      )}
    </article>
  );
}
