'use client';

import React, { useState } from 'react';
import {
  Archive,
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Edit3,
  Heart,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { EntryType, JournalCollection, JournalEntry } from '../../types/entry';
import {
  ENTRY_TYPES,
  formatShortDate,
  getEntryExcerptLines,
  resolveContentFontScript,
} from '../../lib/entry-utils';
import { useJournal } from '../../context/JournalContext';

interface EntryRowItemProps {
  entry: JournalEntry;
  collection?: JournalCollection;
  compact?: boolean;
  showConvertActions?: boolean;
  onRequestPermanentDelete?: (entry: JournalEntry) => void;
}

export function EntryRowItem({
  entry,
  collection,
  compact = false,
  showConvertActions = false,
  onRequestPermanentDelete,
}: EntryRowItemProps) {
  const {
    settings,
    openEntryForReading,
    openEntryForEdit,
    toggleFavorite,
    updateEntry,
    archiveEntry,
    restoreFromArchive,
    moveToTrash,
    restoreFromTrash,
  } = useJournal();

  const [copied, setCopied] = useState(false);

  const fontScript = resolveContentFontScript(
    entry.fontPreference,
    entry.language,
    settings.defaultFont
  );

  const typeInfo = ENTRY_TYPES.find((t) => t.value === entry.type);
  const excerpt = getEntryExcerptLines(
    entry.content,
    entry.type === 'poem' ? 6 : compact ? 3 : 4,
    entry.type === 'poem' ? 340 : compact ? 200 : 300
  );

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(entry.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
    }
  };

  const handleQuickConvert = (e: React.MouseEvent, targetType: EntryType) => {
    e.stopPropagation();
    updateEntry(entry.id, { type: targetType }, true);
  };

  const displayTitle =
    entry.title ||
    (entry.type === 'diary'
      ? `Journal Entry — ${formatShortDate(entry.entryDate)}`
      : `Untitled ${typeInfo?.label || 'Entry'}`);

  return (
    <article
      className={`group relative bg-[var(--page)] border border-[var(--line)] rounded-lg transition-colors hover:border-[var(--accent)]/50 ${
        settings.density === 'compact' || compact ? 'p-5' : 'p-6 sm:p-7'
      }`}
    >
      {/* Top quiet inline metadata line (Zero-Pill discipline: unboxed text with · separators) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-soft)] mb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <time dateTime={entry.entryDate} className="font-medium text-[var(--ink)] tabular-nums">
            {formatShortDate(entry.entryDate)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{typeInfo?.label || entry.type}</span>
          {entry.status === 'draft' && (
            <>
              <span aria-hidden="true">·</span>
              <span className="italic text-[var(--accent)]">Unfinished draft</span>
            </>
          )}
          {entry.mood && (
            <>
              <span aria-hidden="true">·</span>
              <span>{entry.mood}</span>
            </>
          )}
          {collection && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-bangla">{collection.name}</span>
            </>
          )}
          {settings.showWordCount && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{entry.wordCount} words</span>
            </>
          )}
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1">
          {!entry.isTrashed && (
            <>
              <button
                type="button"
                onClick={() => toggleFavorite(entry.id)}
                aria-label={
                  entry.isFavorite
                    ? `Remove '${displayTitle}' from favorites`
                    : `Mark '${displayTitle}' as favorite`
                }
                className={`p-1.5 rounded transition-colors ${
                  entry.isFavorite
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                <Heart className={`w-4 h-4 ${entry.isFavorite ? 'fill-current' : ''}`} />
              </button>

              {entry.type === 'quote' && (
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={`Copy quote '${displayTitle}'`}
                  className="p-1.5 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-[var(--olive)]" /> : <Copy className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => openEntryForEdit(entry.id)}
                aria-label={`Edit '${displayTitle}'`}
                className="p-1.5 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {entry.status === 'archived' ? (
                <button
                  type="button"
                  onClick={() => restoreFromArchive(entry.id)}
                  aria-label={`Restore '${displayTitle}' from archive`}
                  className="px-2 py-1 text-xs rounded text-[var(--accent)] hover:bg-[var(--accent-soft)]/50 transition-colors whitespace-nowrap shrink-0"
                >
                  Restore
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => archiveEntry(entry.id)}
                  aria-label={`Archive '${displayTitle}'`}
                  className="p-1.5 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
                >
                  <Archive className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => moveToTrash(entry.id)}
                aria-label={`Move '${displayTitle}' to trash`}
                className="p-1.5 rounded text-[var(--ink-soft)] hover:text-[var(--danger)] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {entry.isTrashed && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => restoreFromTrash(entry.id)}
                aria-label={`Restore '${displayTitle}' from trash`}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-[var(--page-muted)] text-[var(--ink)] hover:bg-[var(--accent-soft)] transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restore
              </button>
              {onRequestPermanentDelete && (
                <button
                  type="button"
                  onClick={() => onRequestPermanentDelete(entry)}
                  aria-label={`Permanently delete '${displayTitle}'`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Forever
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main clickable title + excerpt body */}
      <div className={entry.type === 'poem' ? 'max-w-xl' : ''}>
        {entry.title && (
          <h3
            className="text-lg sm:text-xl font-semibold text-[var(--ink)] mb-1.5 tracking-tight journal-content"
            data-script={fontScript}
          >
            <button
              type="button"
              onClick={() => openEntryForReading(entry.id)}
              className="text-left hover:text-[var(--accent)] transition-colors focus:outline-none focus-visible:underline"
            >
              {entry.title}
            </button>
          </h3>
        )}

        {entry.subtitle && (
          <p className="text-sm italic text-[var(--ink-soft)] mb-2 journal-content" data-script={fontScript}>
            {entry.subtitle}
          </p>
        )}

        <div
          className={`text-[15px] sm:text-base text-[var(--ink)]/90 journal-content ${
            entry.type === 'quote' ? 'italic text-lg' : ''
          }`}
          data-script={fontScript}
        >
          {excerpt || <span className="italic text-[var(--ink-soft)]">Empty page…</span>}
        </div>

        {entry.type === 'quote' && entry.attribution && (
          <p className="mt-2.5 text-sm text-[var(--ink-soft)] font-literary">
            — {entry.attribution}
          </p>
        )}
      </div>

      {/* Footer row: unboxed tags + Read open page action + Fragment conversion */}
      <div className="mt-4 pt-3 border-t border-[var(--line)]/60 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ink-soft)]">
        <div className="flex flex-wrap items-center gap-1.5">
          {entry.tags.length > 0 && (
            <span>
              Tags: {entry.tags.join(' · ')}
            </span>
          )}
          {showConvertActions && entry.type === 'fragment' && !entry.isTrashed && (
            <div className="flex flex-wrap items-center gap-1.5 ml-auto sm:ml-0">
              <span>Convert fragment to:</span>
              {(['poem', 'diary', 'quote', 'prose'] as EntryType[]).map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={(e) => handleQuickConvert(e, target)}
                  className="underline hover:text-[var(--accent)] capitalize transition-colors whitespace-nowrap shrink-0"
                >
                  {target}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => openEntryForReading(entry.id)}
          aria-label={`Read full page for '${displayTitle}'`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline whitespace-nowrap shrink-0 ml-auto"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Open page
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </article>
  );
}
