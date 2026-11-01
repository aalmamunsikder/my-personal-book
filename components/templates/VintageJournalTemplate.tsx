'use client';

import React from 'react';
import { formatEditorialDate } from '../../lib/entry-utils';
import { TemplateProps } from './ClassicJournalTemplate';

export function VintageJournalTemplate({
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
      className={`relative mx-auto rounded-lg border-2 border-[var(--border)] p-8 sm:p-12 transition-all ${containerWidth} shadow-[0_6px_24px_rgba(40,24,10,0.06)]`}
      style={{
        backgroundColor: config.colors?.page || 'var(--surface)',
      }}
    >
      {/* Antique Brass Corner Ornaments */}
      <div
        aria-hidden="true"
        className="absolute top-2 left-2 text-sm text-[var(--accent)] opacity-40 select-none font-serif"
      >
        ╔
      </div>
      <div
        aria-hidden="true"
        className="absolute top-2 right-2 text-sm text-[var(--accent)] opacity-40 select-none font-serif"
      >
        ╗
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-2 left-2 text-sm text-[var(--accent)] opacity-40 select-none font-serif"
      >
        ╚
      </div>
      <div
        aria-hidden="true"
        className="absolute bottom-2 right-2 text-sm text-[var(--accent)] opacity-40 select-none font-serif"
      >
        ╝
      </div>

      {/* Vintage Header */}
      <header className="text-center mb-8 pb-4 border-b border-[var(--border)]/70">
        {showDate && (
          <div className="inline-block px-3 py-1 border border-[var(--border)] rounded text-xs font-serif italic text-[var(--ink-secondary)] mb-3">
            {formatEditorialDate(entry.entryDate, true)}
          </div>
        )}

        {entry.title && (
          <h1
            className="text-2xl sm:text-3xl font-serif font-bold tracking-wide text-[var(--ink)] journal-content"
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
      </header>

      {/* Main Vintage Journal Text */}
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

      {collection && (
        <footer className="mt-10 pt-4 border-t border-[var(--border)]/50 text-center text-xs text-[var(--ink-muted)]">
          <span className="font-bangla italic">{collection.name}</span>
        </footer>
      )}
    </article>
  );
}
