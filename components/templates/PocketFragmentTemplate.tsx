'use client';

import React from 'react';
import { formatEditorialDate } from '../../lib/entry-utils';
import { TemplateProps } from './ClassicJournalTemplate';

export function PocketFragmentTemplate({
  entry,
  config,
  fontScript,
  children,
}: TemplateProps) {
  const showDate = config.decorations?.dateStamp !== false;

  return (
    <article
      className="relative mx-auto rounded-md border border-[var(--border)] p-6 sm:p-8 transition-all max-w-[540px] shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
      style={{
        backgroundColor: config.colors?.page || 'var(--surface)',
      }}
    >
      {/* Discreet micro header */}
      <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)] mb-4">
        <span className="uppercase tracking-wider font-mono">Fragment</span>
        {showDate && (
          <time dateTime={entry.entryDate}>
            {formatEditorialDate(entry.entryDate, false)}
          </time>
        )}
      </div>

      {entry.title && (
        <h2
          className="text-lg font-medium text-[var(--ink)] mb-3 journal-content"
          data-script={fontScript}
          style={{ color: config.colors?.ink || 'var(--ink)' }}
        >
          {entry.title}
        </h2>
      )}

      {/* Main Fragment Body */}
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
          lineHeight: config.typography?.lineHeight || 1.8,
        }}
      >
        {children || entry.content}
      </div>
    </article>
  );
}
