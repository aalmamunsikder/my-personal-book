'use client';

import React from 'react';
import { formatEditorialDate } from '../../lib/entry-utils';
import { TemplateProps } from './ClassicJournalTemplate';

export function QuoteFolioTemplate({
  entry,
  config,
  fontScript,
  children,
}: TemplateProps) {
  const showDate = config.decorations?.dateStamp !== false;

  return (
    <article
      className="relative mx-auto rounded-lg border border-[var(--border)] px-8 sm:px-14 py-16 transition-all max-w-[680px] shadow-[0_4px_24px_rgba(0,0,0,0.03)]"
      style={{
        backgroundColor: config.colors?.page || 'var(--surface)',
      }}
    >
      {/* Decorative Quotation Mark Motif */}
      <div
        aria-hidden="true"
        className="text-5xl font-serif leading-none select-none text-[var(--accent)] opacity-25 mb-4"
      >
        “
      </div>

      {entry.title && (
        <h2 className="text-xs uppercase tracking-widest text-[var(--ink-muted)] mb-6 font-medium">
          {entry.title}
        </h2>
      )}

      {/* Main Quote Text */}
      <blockquote
        className="journal-content font-literary italic"
        data-script={fontScript}
        style={{
          color: config.colors?.ink || 'var(--ink)',
          fontSize: `${
            (fontScript === 'bn'
              ? config.typography?.banglaFontSize || 19
              : config.typography?.englishFontSize || 18) + 3
          }px`,
          lineHeight: 1.8,
          textAlign: config.typography?.alignment || 'left',
        }}
      >
        {children || entry.content}
      </blockquote>

      {/* Attribution Block */}
      {entry.attribution && (
        <div className="mt-8 pt-4 border-t border-[var(--border)]/50 flex items-center justify-between gap-4 text-sm text-[var(--ink-secondary)]">
          <cite className="not-italic font-medium font-literary tracking-wide">
            — {entry.attribution}
          </cite>
          {showDate && (
            <time dateTime={entry.entryDate} className="text-xs text-[var(--ink-muted)]">
              {formatEditorialDate(entry.entryDate, false)}
            </time>
          )}
        </div>
      )}
    </article>
  );
}
