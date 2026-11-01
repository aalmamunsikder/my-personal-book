'use client';

import React from 'react';
import { formatEditorialDate } from '../../lib/entry-utils';
import { TemplateProps } from './ClassicJournalTemplate';

export function DistractionFreeTemplate({
  entry,
  config,
  fontScript,
  children,
}: TemplateProps) {
  const isNarrow = config.typography?.readingWidth === 'narrow';
  const isWide = config.typography?.readingWidth === 'wide';

  const containerWidth = isNarrow
    ? 'max-w-[620px]'
    : isWide
    ? 'max-w-[860px]'
    : 'max-w-[740px]';

  return (
    <article
      className={`mx-auto px-4 sm:px-8 py-10 transition-all ${containerWidth}`}
      style={{
        backgroundColor: 'transparent',
      }}
    >
      <div className="text-[11px] text-[var(--ink-muted)] mb-6 tracking-widest font-mono">
        {formatEditorialDate(entry.entryDate, false)}
      </div>

      {entry.title && (
        <h1
          className="text-2xl sm:text-3xl font-normal mb-6 text-[var(--ink)] tracking-tight journal-content"
          data-script={fontScript}
          style={{ color: config.colors?.ink || 'var(--ink)' }}
        >
          {entry.title}
        </h1>
      )}

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
    </article>
  );
}
