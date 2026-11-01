'use client';

import React from 'react';
import { formatEditorialDate } from '../../lib/entry-utils';
import { TemplateProps } from './ClassicJournalTemplate';

export function CleanLetterTemplate({
  entry,
  config,
  fontScript,
  children,
}: TemplateProps) {
  const showDate = config.decorations?.dateStamp !== false;
  const isNarrow = config.typography?.readingWidth === 'narrow';
  const isWide = config.typography?.readingWidth === 'wide';

  const containerWidth = isNarrow
    ? 'max-w-[640px]'
    : isWide
    ? 'max-w-[860px]'
    : 'max-w-[760px]';

  return (
    <article
      className={`relative mx-auto rounded-lg border border-[var(--border)]/70 px-8 sm:px-14 py-12 transition-all ${containerWidth}`}
      style={{
        backgroundColor: config.colors?.page || 'var(--surface)',
      }}
    >
      {/* Postal Header */}
      <div className="flex justify-between items-start mb-8 text-xs text-[var(--ink-secondary)]">
        <div>
          {entry.title && (
            <h1
              className="text-xl sm:text-2xl font-serif text-[var(--ink)] tracking-tight journal-content"
              data-script={fontScript}
              style={{ color: config.colors?.ink || 'var(--ink)' }}
            >
              {entry.title}
            </h1>
          )}
          {entry.subtitle && (
            <p className="text-sm italic text-[var(--ink-secondary)] mt-1">{entry.subtitle}</p>
          )}
        </div>
        {showDate && (
          <div className="text-right shrink-0">
            <time dateTime={entry.entryDate} className="font-serif italic tracking-wide">
              {formatEditorialDate(entry.entryDate, true)}
            </time>
          </div>
        )}
      </div>

      {/* Epistolary Body */}
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

      {/* Epistolary Sign-off */}
      {entry.attribution && (
        <div className="mt-10 pt-6 text-right font-literary italic text-[var(--ink-secondary)]">
          — {entry.attribution}
        </div>
      )}
    </article>
  );
}
