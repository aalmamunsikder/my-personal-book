'use client';

import React, { useMemo, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Edit3,
  Heart,
  Palette,
  Trash2,
} from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import {
  ENTRY_TYPES,
  formatEditorialDate,
  formatShortDate,
  resolveContentFontScript,
} from '../../lib/entry-utils';
import { resolveEffectiveAppearance } from '../../lib/themes';
import type { PageTemplateId } from '../../types/appearance';
import { TemplateDispatcher } from '../templates/TemplateDispatcher';

export function ReadingView() {
  const {
    entries,
    collections,
    settings,
    activeEntryId,
    previousSection,
    navigateTo,
    openEntryForEdit,
    openEntryForReading,
    toggleFavorite,
    archiveEntry,
    restoreFromArchive,
    moveToTrash,
    appearanceConfig,
    setAppearanceStudioOpen,
  } = useJournal();

  const [copied, setCopied] = useState(false);

  const readableEntries = useMemo(
    () =>
      entries
        .filter((e) => !e.isTrashed)
        .sort((a, b) => b.entryDate.localeCompare(a.entryDate) || b.createdAt.localeCompare(a.createdAt)),
    [entries]
  );

  const currentIndex = useMemo(
    () => readableEntries.findIndex((e) => e.id === activeEntryId),
    [readableEntries, activeEntryId]
  );

  const currentEntry = useMemo(
    () => (currentIndex >= 0 ? readableEntries[currentIndex] : readableEntries[0] || null),
    [readableEntries, currentIndex]
  );

  // Hooks run on every render, including the "could not be found" render below, so the effective
  // appearance has to be resolved before the early return rather than after it.
  const collectionObj = collections.find((c) => c.id === currentEntry?.collectionId);
  const effectiveConfig = useMemo(
    () =>
      resolveEffectiveAppearance(
        appearanceConfig,
        collectionObj?.appearanceConfig,
        (currentEntry?.pageTemplateId as PageTemplateId | undefined) ?? null
      ),
    [appearanceConfig, collectionObj?.appearanceConfig, currentEntry?.pageTemplateId]
  );

  if (!currentEntry) {
    return (
      <div className="p-8 text-center bg-[var(--page)] border border-[var(--line)] rounded-lg space-y-4">
        <p className="text-sm text-[var(--ink-soft)]">This page could not be found.</p>
        <button
          type="button"
          onClick={() => navigateTo('journal')}
          className="px-4 py-2 text-xs font-medium bg-[var(--accent)] text-[#FFFCF5] rounded-md"
        >
          Back to My Journal
        </button>
      </div>
    );
  }

  const prevEntry = currentIndex > 0 ? readableEntries[currentIndex - 1] : null;
  const nextEntry =
    currentIndex >= 0 && currentIndex < readableEntries.length - 1
      ? readableEntries[currentIndex + 1]
      : null;

  const typeInfo = ENTRY_TYPES.find((t) => t.value === currentEntry.type);
  const fontScript = resolveContentFontScript(
    currentEntry.fontPreference,
    currentEntry.language,
    settings.defaultFont
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentEntry.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const backTarget =
    previousSection && previousSection !== 'reading' && previousSection !== 'editor'
      ? previousSection
      : 'journal';

  return (
    <div className="space-y-8 pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
        <button
          type="button"
          onClick={() => navigateTo(backTarget)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to archive
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAppearanceStudioOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--page)] border border-[var(--line)] rounded hover:border-[var(--accent)] text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
            title="Customize themes, templates, paper, and typography"
          >
            <Palette className="w-3.5 h-3.5 text-[var(--accent)]" />
            Page Style
          </button>

          <button
            type="button"
            onClick={() => openEntryForEdit(currentEntry.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--page)] border border-[var(--line)] rounded hover:border-[var(--accent)] text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5 text-[var(--accent)]" />
            Edit Page
          </button>

          <button
            type="button"
            onClick={() => toggleFavorite(currentEntry.id)}
            aria-label={currentEntry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--page)] border border-[var(--line)] rounded transition-colors whitespace-nowrap shrink-0 ${
              currentEntry.isFavorite ? 'text-[var(--accent)] border-[var(--accent)]/50' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${currentEntry.isFavorite ? 'fill-current' : ''}`} />
            {currentEntry.isFavorite ? 'Favorited' : 'Favorite'}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--page)] border border-[var(--line)] rounded text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[var(--olive)]" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Text
              </>
            )}
          </button>

          {currentEntry.status === 'archived' ? (
            <button
              type="button"
              onClick={() => restoreFromArchive(currentEntry.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--page)] border border-[var(--line)] rounded text-[var(--accent)] hover:bg-[var(--accent-soft)]/50 transition-colors whitespace-nowrap shrink-0"
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={() => archiveEntry(currentEntry.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--page)] border border-[var(--line)] rounded text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive
            </button>
          )}

          <button
            type="button"
            onClick={() => moveToTrash(currentEntry.id)}
            aria-label="Move page to trash"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--page)] border border-[var(--line)] rounded text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Render Entry with Active Effective Template & Paper Surface */}
      <TemplateDispatcher
        entry={currentEntry}
        collection={collectionObj}
        config={effectiveConfig}
        fontScript={fontScript}
      />

      {/* Previous / Next Page Navigation */}
      <nav
        aria-label="Adjacent journal pages"
        className={`mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 ${
          settings.readingWidth === 'wide' ? 'max-w-[840px]' : 'max-w-[720px]'
        }`}
      >
        {prevEntry ? (
          <button
            type="button"
            onClick={() => openEntryForReading(prevEntry.id)}
            className="flex flex-col items-start p-4 bg-[var(--page)] border border-[var(--line)] rounded-lg hover:border-[var(--accent)] transition-colors text-left"
          >
            <span className="inline-flex items-center gap-1 text-xs text-[var(--ink-soft)] mb-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Newer page · {formatShortDate(prevEntry.entryDate)}
            </span>
            <span className="text-sm font-medium text-[var(--ink)] truncate w-full font-bangla">
              {prevEntry.title || `Untitled ${prevEntry.type}`}
            </span>
          </button>
        ) : (
          <div />
        )}

        {nextEntry ? (
          <button
            type="button"
            onClick={() => openEntryForReading(nextEntry.id)}
            className="flex flex-col items-end p-4 bg-[var(--page)] border border-[var(--line)] rounded-lg hover:border-[var(--accent)] transition-colors text-right"
          >
            <span className="inline-flex items-center gap-1 text-xs text-[var(--ink-soft)] mb-1">
              Older page · {formatShortDate(nextEntry.entryDate)}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm font-medium text-[var(--ink)] truncate w-full font-bangla">
              {nextEntry.title || `Untitled ${nextEntry.type}`}
            </span>
          </button>
        ) : (
          <div />
        )}
      </nav>
    </div>
  );
}
