'use client';

import React from 'react';
import { formatEditorialDate } from '../../lib/entry-utils';
import { TemplateProps } from './ClassicJournalTemplate';

export function DailyReflectionTemplate({
  entry,
  config,
  fontScript,
  children,
}: TemplateProps) {
  const showDate = config.decorations?.dateStamp !== false;

  return (
    <article
      className="relative mx-auto rounded-lg border border-[var(--border)] p-6 sm:p-10 transition-all max-w-[720px] shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
      style={{
        backgroundColor: config.colors?.page || 'var(--surface)',
      }}
    >
      {/* Reflection Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[var(--border)]/70">
        {showDate && (
          <time dateTime={entry.entryDate} className="text-xs font-serif font-medium text-[var(--ink)]">
            {formatEditorialDate(entry.entryDate, true)}
          </time>
        )}
        {entry.mood && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--ink)] font-medium">
            Mood: {entry.mood}
          </span>
        )}
      </div>

      {entry.title && (
        <h1
          className="text-2xl font-serif text-[var(--ink)] mb-4 journal-content"
          data-script={fontScript}
          style={{ color: config.colors?.ink || 'var(--ink)' }}
        >
          {entry.title}
        </h1>
      )}

      {/* Main Journal Entry Body */}
      <div
        className="journal-content mb-8"
        data-script={fontScript}
        style={{
          color: config.colors?.ink || 'var(--ink)',
          fontSize: `${
            fontScript === 'bn'
              ? config.typography?.banglaFontSize || 19
              : config.typography?.englishFontSize || 18
          }px`,
          lineHeight: config.typography?.lineHeight || 1.85,
        }}
      >
        {children || entry.content}
      </div>

      {/* Structured Reflection Callout Footer (Clean presentation layer only, outside entry content) */}
      <div className="mt-8 pt-6 border-t border-[var(--border)]/60 bg-[var(--surface-secondary)]/50 rounded p-4 text-xs space-y-1 text-[var(--ink-secondary)]">
        <p className="font-semibold text-[var(--ink)] uppercase tracking-wider text-[10px]">
          Self-Reflection Note
        </p>
        <p className="italic">
          &ldquo;What remained silent today will find its voice in tomorrow’s peace.&rdquo;
        </p>
      </div>
    </article>
  );
}
