'use client';

import React from 'react';
import { formatEditorialDate } from '../../lib/entry-utils';
import { TemplateProps } from './ClassicJournalTemplate';

export function MarginaliaTemplate({
  entry,
  collection,
  config,
  fontScript,
  children,
}: TemplateProps) {
  const showDate = config.decorations?.dateStamp !== false;

  return (
    <article
      className="relative mx-auto rounded-lg border border-[var(--border)] p-6 sm:p-10 transition-all max-w-[860px]"
      style={{
        backgroundColor: config.colors?.page || 'var(--surface)',
      }}
    >
      <header className="mb-6 pb-4 border-b border-[var(--border)]/60 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
        {showDate && (
          <time dateTime={entry.entryDate} className="font-serif font-medium">
            {formatEditorialDate(entry.entryDate, true)}
          </time>
        )}
        {collection && <span className="font-bangla">{collection.name}</span>}
      </header>

      {/* Grid: Main Column (70%) + Side Margin (30%) on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {entry.title && (
            <h1
              className="text-2xl font-serif text-[var(--ink)] mb-4 journal-content"
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
            }}
          >
            {children || entry.content}
          </div>
        </div>

        {/* Marginalia Side Column */}
        <aside className="lg:col-span-4 lg:border-l border-[var(--border)]/70 lg:pl-6 space-y-4 pt-4 lg:pt-0">
          <div className="text-[11px] uppercase tracking-wider text-[var(--ink-muted)] font-mono border-b border-[var(--border)]/40 pb-1">
            Marginalia / Annotations
          </div>
          <div className="p-3 bg-[var(--surface-secondary)]/60 rounded text-xs text-[var(--ink-secondary)] font-serif italic space-y-2">
            <p>
              &ldquo;Annotations live safely in this margin without altering the primary text or poem stanzas.&rdquo;
            </p>
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {entry.tags.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-[var(--surface)] text-[10px] text-[var(--ink)]">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
