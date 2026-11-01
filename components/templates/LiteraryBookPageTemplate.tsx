'use client';

import React from 'react';
import { formatEditorialDate } from '../../lib/entry-utils';
import { TemplateProps } from './ClassicJournalTemplate';

export function LiteraryBookPageTemplate({
  entry,
  collection,
  config,
  fontScript,
  children,
}: TemplateProps) {
  const showDate = config.decorations?.dateStamp !== false;

  return (
    <article
      className="relative mx-auto rounded-sm border border-[var(--border)] px-8 sm:px-16 py-14 transition-all max-w-[680px] shadow-[0_6px_28px_rgba(0,0,0,0.05),-6px_0_12px_rgba(0,0,0,0.02)]"
      style={{
        backgroundColor: config.colors?.page || 'var(--surface)',
      }}
    >
      {/* Running Book Header */}
      <div className="flex items-center justify-between text-xs text-[var(--ink-muted)] mb-10 pb-3 border-b border-[var(--border)]/50 font-serif">
        <span className="italic">VerseVault Archive</span>
        {collection && <span className="font-bangla font-medium">{collection.name}</span>}
      </div>

      {/* Centered Chapter/Entry Header */}
      <header className="text-center mb-8">
        {showDate && (
          <p className="text-[11px] uppercase tracking-widest text-[var(--ink-muted)] mb-2 font-serif">
            {formatEditorialDate(entry.entryDate, false)}
          </p>
        )}
        {entry.title && (
          <h1
            className="text-2xl sm:text-3xl font-serif text-[var(--ink)] tracking-tight journal-content"
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

      {/* Novel Body */}
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

      {/* Subtle Book Pagination Motif */}
      <footer className="mt-12 pt-4 text-center text-xs text-[var(--ink-muted)] font-serif border-t border-[var(--border)]/40">
        <span className="select-none">~ ❦ ~</span>
      </footer>
    </article>
  );
}
