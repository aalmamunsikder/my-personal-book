'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Edit3,
  Feather,
  PenTool,
  Quote,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import {
  formatEditorialDate,
  formatShortDate,
  getEntryExcerptLines,
  getLocalTodayDateString,
  resolveContentFontScript,
} from '../../lib/entry-utils';
import { EntryRowItem } from '../common/EntryRowItem';
import { MiniCalendarWidget } from '../calendar/MiniCalendarWidget';

export function JournalHomeView() {
  const {
    entries,
    collections,
    settings,
    selectedCalendarDate,
    createNewEntry,
    openEntryForEdit,
    openEntryForReading,
    navigateTo,
  } = useJournal();

  const [quickPromptText, setQuickPromptText] = useState('');
  const [memoryIndex, setMemoryIndex] = useState(0);

  const todayDateStr = useMemo(() => getLocalTodayDateString(), []);
  const todayHeading = useMemo(() => formatEditorialDate(todayDateStr, true), [todayDateStr]);

  const collectionsMap = useMemo(
    () => Object.fromEntries(collections.map((c) => [c.id, c])),
    [collections]
  );

  const activeEntries = useMemo(
    () =>
      entries
        .filter((e) => !e.isTrashed && e.status !== 'archived')
        .sort((a, b) => b.entryDate.localeCompare(a.entryDate) || b.createdAt.localeCompare(a.createdAt)),
    [entries]
  );

  const unfinishedDrafts = useMemo(
    () => activeEntries.filter((e) => e.status === 'draft'),
    [activeEntries]
  );

  const recentEntries = useMemo(() => activeEntries.slice(0, 6), [activeEntries]);

  const memoryPool = useMemo(
    () => activeEntries.filter((e) => e.entryDate !== todayDateStr && e.content.trim().length > 0),
    [activeEntries, todayDateStr]
  );

  const currentMemory = useMemo(() => {
    if (memoryPool.length === 0) return null;
    return memoryPool[memoryIndex % memoryPool.length];
  }, [memoryIndex, memoryPool]);

  const countsLine = useMemo(() => {
    const pages = activeEntries.length;
    const poems = activeEntries.filter((e) => e.type === 'poem').length;
    const quotes = activeEntries.filter((e) => e.type === 'quote').length;
    const fragments = activeEntries.filter((e) => e.type === 'fragment').length;
    return `${pages} pages · ${poems} poems · ${quotes} quotes · ${fragments} fragments`;
  }, [activeEntries]);

  const handleStartFromPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    createNewEntry({
      type: 'diary',
      entryDate: todayDateStr,
      initialContent: quickPromptText,
    });
    setQuickPromptText('');
  };

  return (
    <div className="space-y-10 pb-12">
      {/* 1. Editorial Date Heading & Welcome Line */}
      <section className="border-b border-[var(--line)] pb-6">
        <p className="text-xs uppercase tracking-widest text-[var(--ink-soft)] mb-2">
          Personal Literary Journal
        </p>
        <h1 className="text-3xl sm:text-4xl font-literary font-normal text-[var(--ink)] tracking-tight text-balance">
          {todayHeading}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--ink-soft)]">
          <p className="font-literary italic">A place for the thoughts worth keeping.</p>
          <span className="text-xs tabular-nums">{countsLine}</span>
        </div>
      </section>

      {/* 2. Prominent Paper-Like Writing Prompt */}
      <section
        aria-label="Write today's entry"
        className="bg-[var(--page)] border border-[var(--line)] rounded-lg p-6 sm:p-8 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-literary font-medium text-[var(--ink)]">
              What is on your mind today?
            </h2>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5 font-bangla">
              আজকের দিনলিপি, কবিতা বা না-বলা কোনো কথা লিখে রাখুন…
            </p>
          </div>
          <button
            type="button"
            onClick={() => createNewEntry({ type: 'diary', entryDate: todayDateStr })}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#FFFCF5] bg-[var(--accent)] rounded-md hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
          >
            <PenTool className="w-3.5 h-3.5" />
            Open blank page
          </button>
        </div>

        <form onSubmit={handleStartFromPrompt} className="space-y-4">
          <textarea
            rows={3}
            value={quickPromptText}
            onChange={(e) => setQuickPromptText(e.target.value)}
            placeholder="Begin writing here in Bangla or English, or open a full page…"
            aria-label="Quick journal prompt input"
            className="w-full p-3.5 bg-[var(--paper)]/50 border border-[var(--line)] rounded-md text-sm sm:text-base text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:border-[var(--accent)] journal-content resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => createNewEntry({ type: 'poem', entryDate: todayDateStr })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--ink)] bg-[var(--page-muted)] hover:bg-[var(--accent-soft)] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <Feather className="w-3.5 h-3.5 text-[var(--accent)]" />
                New Poem
              </button>
              <button
                type="button"
                onClick={() => createNewEntry({ type: 'quote', entryDate: todayDateStr })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--ink)] bg-[var(--page-muted)] hover:bg-[var(--accent-soft)] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <Quote className="w-3.5 h-3.5 text-[var(--accent)]" />
                Save a Quote
              </button>
              <button
                type="button"
                onClick={() => createNewEntry({ type: 'fragment', entryDate: todayDateStr })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--ink)] bg-[var(--page-muted)] hover:bg-[var(--accent-soft)] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                Capture Fragment
              </button>
            </div>

            {quickPromptText.trim().length > 0 && (
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#FFFCF5] bg-[var(--accent)] rounded-md hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
              >
                Continue in editor
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>
      </section>

      {/* First-use Empty State when no entries exist */}
      {activeEntries.length === 0 ? (
        <section className="bg-[var(--page)] border border-[var(--line)] rounded-lg p-12 text-center space-y-4">
          <BookOpen className="w-8 h-8 text-[var(--accent)] mx-auto stroke-[1.5]" />
          <h2 className="text-xl font-literary text-[var(--ink)]">
            Every journal begins with a first page.
          </h2>
          <p className="text-sm text-[var(--ink-soft)] max-w-md mx-auto">
            Your private diary is empty. Write about today, preserve a Bangla or English poem, or keep a fragment of thought.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => createNewEntry({ type: 'diary', entryDate: todayDateStr })}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#FFFCF5] bg-[var(--accent)] rounded-md hover:opacity-95 transition-opacity"
            >
              <PenTool className="w-4 h-4" />
              Write your first entry
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* 3. Continue Writing Section for Unfinished Drafts */}
          {unfinishedDrafts.length > 0 && (
            <section aria-label="Continue writing drafts" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-literary font-medium text-[var(--ink)]">
                  Continue writing
                </h2>
                <span className="text-xs text-[var(--ink-soft)] tabular-nums">
                  {unfinishedDrafts.length} unfinished {unfinishedDrafts.length === 1 ? 'draft' : 'drafts'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unfinishedDrafts.slice(0, 2).map((draft) => {
                  const script = resolveContentFontScript(
                    draft.fontPreference,
                    draft.language,
                    settings.defaultFont
                  );
                  return (
                    <div
                      key={draft.id}
                      className="bg-[var(--page)] border border-[var(--line)] rounded-lg p-5 flex flex-col justify-between gap-4 hover:border-[var(--accent)]/60 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="text-xs text-[var(--ink-soft)] flex items-center gap-1.5">
                          <span className="tabular-nums">{formatShortDate(draft.entryDate)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{draft.type}</span>
                          <span aria-hidden="true">·</span>
                          <span className="italic text-[var(--accent)]">Draft</span>
                        </div>
                        <h3
                          className="text-base font-semibold text-[var(--ink)] journal-content"
                          data-script={script}
                        >
                          {draft.title || `Untitled ${draft.type}`}
                        </h3>
                        <p
                          className="text-sm text-[var(--ink)]/85 journal-content line-clamp-3"
                          data-script={script}
                        >
                          {getEntryExcerptLines(draft.content, 3, 180)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[var(--line)]/60">
                        <span className="text-xs text-[var(--ink-soft)] tabular-nums">
                          {draft.wordCount} words
                        </span>
                        <button
                          type="button"
                          onClick={() => openEntryForEdit(draft.id)}
                          aria-label={`Continue writing '${draft.title || draft.type}'`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline whitespace-nowrap shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Resume draft
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 4. Return to a Memory & Compact Calendar (visible inline on smaller screens) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {currentMemory && (
              <section
                aria-label="Return to a memory"
                className="lg:col-span-12 bg-[var(--page-muted)]/65 border border-[var(--line)] rounded-lg p-6 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-[var(--ink-soft)] flex items-center gap-1.5">
                    <span className="font-medium text-[var(--ink)]">Return to a memory</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{formatShortDate(currentMemory.entryDate)}</span>
                    {currentMemory.mood && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{currentMemory.mood}</span>
                      </>
                    )}
                  </div>
                  {memoryPool.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setMemoryIndex((i) => i + 1)}
                      aria-label="Turn to another memory"
                      className="inline-flex items-center gap-1 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Another page
                    </button>
                  )}
                </div>

                {currentMemory.title && (
                  <h3
                    className="text-lg font-medium text-[var(--ink)] journal-content"
                    data-script={resolveContentFontScript(
                      currentMemory.fontPreference,
                      currentMemory.language,
                      settings.defaultFont
                    )}
                  >
                    {currentMemory.title}
                  </h3>
                )}

                <p
                  className="text-sm sm:text-base text-[var(--ink)]/90 journal-content"
                  data-script={resolveContentFontScript(
                    currentMemory.fontPreference,
                    currentMemory.language,
                    settings.defaultFont
                  )}
                >
                  {getEntryExcerptLines(currentMemory.content, 4, 260)}
                </p>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => openEntryForReading(currentMemory.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    Revisit this page
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </section>
            )}

            {/* Compact calendar preview on tablet/mobile where right rail is hidden */}
            <div className="xl:hidden lg:col-span-12">
              <MiniCalendarWidget
                entries={entries}
                selectedDate={selectedCalendarDate}
                onSelectDate={(dateStr) => navigateTo('calendar', { date: dateStr })}
                compact
              />
            </div>
          </div>

          {/* 5. Chronological Recently Written Timeline */}
          <section aria-label="Recently written entries" className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h2 className="text-xl font-literary font-normal text-[var(--ink)]">
                Recently written
              </h2>
              <button
                type="button"
                onClick={() => navigateTo('entries')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline whitespace-nowrap shrink-0"
              >
                Browse full timeline
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {recentEntries.map((entry) => (
                <EntryRowItem
                  key={entry.id}
                  entry={entry}
                  collection={entry.collectionId ? collectionsMap[entry.collectionId] : undefined}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
