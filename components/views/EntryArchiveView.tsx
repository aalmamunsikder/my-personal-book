'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Feather,
  PenTool,
  Plus,
  Quote,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import {
  ENTRY_MOODS,
  filterAndSortEntries,
  getLocalTodayDateString,
  groupEntriesByMonth,
} from '../../lib/entry-utils';
import type { EntryMood, EntryType, JournalEntry } from '../../types/entry';
import { EntryRowItem } from '../common/EntryRowItem';

export function EntryArchiveView() {
  const {
    entries,
    collections,
    activeSection,
    activeCollectionId,
    globalSearchQuery,
    setGlobalSearchQuery,
    navigateTo,
    createNewEntry,
    permanentlyDeleteEntry,
  } = useJournal();

  const [localQuery, setLocalQuery] = useState(globalSearchQuery);
  const [prevGlobalQuery, setPrevGlobalQuery] = useState(globalSearchQuery);
  if (prevGlobalQuery !== globalSearchQuery) {
    setPrevGlobalQuery(globalSearchQuery);
    setLocalQuery(globalSearchQuery);
  }
  const [debouncedQuery, setDebouncedQuery] = useState(globalSearchQuery);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedMood, setSelectedMood] = useState<EntryMood | 'all'>('all');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<EntryType | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [visibleLimit, setVisibleLimit] = useState<number>(12);
  const [entryToConfirmDelete, setEntryToConfirmDelete] = useState<JournalEntry | null>(null);

  // 280ms debounce for Bangla & English search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(localQuery);
      setGlobalSearchQuery(localQuery);
    }, 280);
    return () => clearTimeout(timer);
  }, [localQuery, setGlobalSearchQuery]);

  const collectionsMap = useMemo(
    () => Object.fromEntries(collections.map((c) => [c.id, c])),
    [collections]
  );

  const activeCollection = useMemo(
    () => (activeCollectionId ? collectionsMap[activeCollectionId] : undefined),
    [activeCollectionId, collectionsMap]
  );

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    for (const e of entries) {
      if (/^\d{4}/.test(e.entryDate)) {
        years.add(e.entryDate.slice(0, 4));
      }
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  // Determine section-specific filter constraints
  const sectionConfig = useMemo(() => {
    switch (activeSection) {
      case 'poems':
        return {
          title: 'Poems · কবিতা',
          subtitle: 'Literary verses preserved with exact stanza and line breaks.',
          forcedType: 'poem' as const,
          status: 'active' as const,
          onlyFavorites: false,
          onlyTrashed: false,
          defaultNewType: 'poem' as EntryType,
          ctaLabel: 'Write a Poem',
        };
      case 'quotes':
        return {
          title: 'Quotes & Aphorisms · উদ্ধৃতি',
          subtitle: 'Lines, passages, and aphorisms worth keeping.',
          forcedType: 'quote' as const,
          status: 'active' as const,
          onlyFavorites: false,
          onlyTrashed: false,
          defaultNewType: 'quote' as EntryType,
          ctaLabel: 'Save a Quote',
        };
      case 'fragments':
        return {
          title: 'Fragments · টুকরো ভাবনা',
          subtitle: 'Unfinished lines, fleeting observations, and seeds for future writing.',
          forcedType: 'fragment' as const,
          status: 'active' as const,
          onlyFavorites: false,
          onlyTrashed: false,
          defaultNewType: 'fragment' as EntryType,
          ctaLabel: 'Capture Fragment',
        };
      case 'favorites':
        return {
          title: 'Favorites',
          subtitle: 'Diary pages, poems, and quotes marked for revisiting.',
          forcedType: 'all' as const,
          status: 'active' as const,
          onlyFavorites: true,
          onlyTrashed: false,
          defaultNewType: 'diary' as EntryType,
          ctaLabel: 'New Entry',
        };
      case 'archive':
        return {
          title: 'Archived Pages',
          subtitle: 'Older entries tucked away from the active journal timeline.',
          forcedType: 'all' as const,
          status: 'archived' as const,
          onlyFavorites: false,
          onlyTrashed: false,
          defaultNewType: 'diary' as EntryType,
          ctaLabel: 'New Entry',
        };
      case 'trash':
        return {
          title: 'Trash',
          subtitle: 'Soft-deleted pages. Restore them to your journal or permanently remove them.',
          forcedType: 'all' as const,
          status: 'all' as const,
          onlyFavorites: false,
          onlyTrashed: true,
          defaultNewType: 'diary' as EntryType,
          ctaLabel: 'New Entry',
        };
      case 'collection-detail':
        return {
          title: activeCollection ? activeCollection.name : 'Collection Notebook',
          subtitle:
            activeCollection?.description ||
            'Thematic notebook grouping diary entries, poems, and reflections.',
          forcedType: 'all' as const,
          status: 'active' as const,
          onlyFavorites: false,
          onlyTrashed: false,
          defaultNewType: 'diary' as EntryType,
          ctaLabel: 'Write in this notebook',
        };
      default:
        return {
          title: 'Daily Entries · দিনলিপি',
          subtitle: 'Chronological timeline of diary pages, poems, quotes, fragments, and prose.',
          forcedType: 'all' as const,
          status: 'active' as const,
          onlyFavorites: false,
          onlyTrashed: false,
          defaultNewType: 'diary' as EntryType,
          ctaLabel: 'Write today’s entry',
        };
    }
  }, [activeCollection, activeSection]);

  const filteredEntries = useMemo(() => {
    const effectiveType =
      sectionConfig.forcedType !== 'all' ? sectionConfig.forcedType : selectedTypeFilter;
    const effectiveCollection =
      activeSection === 'collection-detail' && activeCollectionId
        ? activeCollectionId
        : selectedCollection;

    return filterAndSortEntries(entries, {
      query: debouncedQuery,
      type: effectiveType,
      mood: selectedMood,
      collectionId: effectiveCollection,
      year: selectedYear,
      month: selectedMonth,
      status: sectionConfig.status,
      onlyFavorites: sectionConfig.onlyFavorites,
      onlyTrashed: sectionConfig.onlyTrashed,
      sortOrder,
      collectionsMap,
    });
  }, [
    activeCollectionId,
    activeSection,
    collectionsMap,
    debouncedQuery,
    entries,
    sectionConfig,
    selectedCollection,
    selectedMonth,
    selectedMood,
    selectedTypeFilter,
    selectedYear,
    sortOrder,
  ]);

  const visibleEntries = useMemo(
    () => filteredEntries.slice(0, visibleLimit),
    [filteredEntries, visibleLimit]
  );

  const groupedByMonth = useMemo(
    () => groupEntriesByMonth(visibleEntries),
    [visibleEntries]
  );

  const hasActiveFilters =
    Boolean(localQuery.trim()) ||
    selectedYear !== 'all' ||
    selectedMonth !== 'all' ||
    selectedMood !== 'all' ||
    selectedCollection !== 'all' ||
    selectedTypeFilter !== 'all';

  const handleResetFilters = () => {
    setLocalQuery('');
    setDebouncedQuery('');
    setGlobalSearchQuery('');
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedMood('all');
    setSelectedCollection('all');
    setSelectedTypeFilter('all');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Section Header */}
      <header className="border-b border-[var(--line)] pb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          {activeSection === 'collection-detail' && (
            <button
              type="button"
              onClick={() => navigateTo('collections')}
              className="inline-flex items-center gap-1 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Collections
            </button>
          )}
          <h1 className="text-2xl sm:text-3xl font-literary font-normal text-[var(--ink)] tracking-tight font-bangla">
            {sectionConfig.title}
          </h1>
          <p className="text-sm text-[var(--ink-soft)] font-bangla">{sectionConfig.subtitle}</p>
        </div>

        {activeSection !== 'trash' && (
          <button
            type="button"
            onClick={() =>
              createNewEntry({
                type: sectionConfig.defaultNewType,
                entryDate: getLocalTodayDateString(),
                collectionId:
                  activeSection === 'collection-detail' && activeCollectionId
                    ? activeCollectionId
                    : '',
              })
            }
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#FFFCF5] bg-[var(--accent)] rounded-md hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {sectionConfig.ctaLabel}
          </button>
        )}
      </header>

      {/* Search & Filter Controls Bar */}
      <section
        aria-label="Search and filter entries"
        className="bg-[var(--page)] border border-[var(--line)] rounded-lg p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--ink-soft)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search titles, Bangla or English lines, tags, or quote sources…"
              aria-label="Search entries"
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-[var(--paper)] border border-[var(--line)] rounded-md text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:border-[var(--accent)] font-bangla"
            />
            {localQuery && (
              <button
                type="button"
                onClick={() => {
                  setLocalQuery('');
                  setDebouncedQuery('');
                  setGlobalSearchQuery('');
                }}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="archive-sort-select" className="text-xs text-[var(--ink-soft)]">
              Sort:
            </label>
            <select
              id="archive-sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="px-3 py-2 text-xs bg-[var(--paper)] border border-[var(--line)] rounded-md text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {/* Filter Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {sectionConfig.forcedType === 'all' && (
            <div>
              <label htmlFor="filter-type" className="block text-[11px] text-[var(--ink-soft)] mb-1">
                Category
              </label>
              <select
                id="filter-type"
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value as EntryType | 'all')}
                className="w-full px-2.5 py-1.5 text-xs bg-[var(--paper)] border border-[var(--line)] rounded text-[var(--ink)]"
              >
                <option value="all">All categories</option>
                <option value="diary">Diary</option>
                <option value="poem">Poems</option>
                <option value="quote">Quotes</option>
                <option value="fragment">Fragments</option>
                <option value="prose">Prose</option>
              </select>
            </div>
          )}

          <div>
            <label htmlFor="filter-year" className="block text-[11px] text-[var(--ink-soft)] mb-1">
              Year
            </label>
            <select
              id="filter-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[var(--paper)] border border-[var(--line)] rounded text-[var(--ink)] tabular-nums"
            >
              <option value="all">All years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-month" className="block text-[11px] text-[var(--ink-soft)] mb-1">
              Month
            </label>
            <select
              id="filter-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[var(--paper)] border border-[var(--line)] rounded text-[var(--ink)]"
            >
              <option value="all">All months</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-mood" className="block text-[11px] text-[var(--ink-soft)] mb-1">
              Mood
            </label>
            <select
              id="filter-mood"
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value as EntryMood | 'all')}
              className="w-full px-2.5 py-1.5 text-xs bg-[var(--paper)] border border-[var(--line)] rounded text-[var(--ink)]"
            >
              <option value="all">Any mood</option>
              {ENTRY_MOODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.value}
                </option>
              ))}
            </select>
          </div>

          {activeSection !== 'collection-detail' && sectionConfig.forcedType !== 'all' && (
            <div>
              <label htmlFor="filter-collection" className="block text-[11px] text-[var(--ink-soft)] mb-1">
                Collection
              </label>
              <select
                id="filter-collection"
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[var(--paper)] border border-[var(--line)] rounded text-[var(--ink)] font-bangla"
              >
                <option value="all">All collections</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Summary & Reset Filters line */}
        <div className="flex items-center justify-between text-xs text-[var(--ink-soft)] pt-1">
          <span className="tabular-nums">
            Showing {visibleEntries.length} of {filteredEntries.length}{' '}
            {filteredEntries.length === 1 ? 'page' : 'pages'}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[var(--accent)] hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      </section>

      {/* Results Timeline Grouped by Month */}
      {filteredEntries.length === 0 ? (
        <div className="bg-[var(--page)] border border-[var(--line)] rounded-lg p-12 text-center space-y-3">
          {activeSection === 'poems' ? (
            <Feather className="w-7 h-7 text-[var(--accent)] mx-auto stroke-[1.5]" />
          ) : activeSection === 'quotes' ? (
            <Quote className="w-7 h-7 text-[var(--accent)] mx-auto stroke-[1.5]" />
          ) : activeSection === 'fragments' ? (
            <Sparkles className="w-7 h-7 text-[var(--accent)] mx-auto stroke-[1.5]" />
          ) : (
            <BookOpen className="w-7 h-7 text-[var(--accent)] mx-auto stroke-[1.5]" />
          )}
          <h2 className="text-lg font-literary text-[var(--ink)]">
            {hasActiveFilters ? 'No pages match your current filter.' : 'No pages in this section yet.'}
          </h2>
          <p className="text-xs text-[var(--ink-soft)] max-w-md mx-auto">
            {hasActiveFilters
              ? 'Try clearing your search query or choosing a broader date or mood filter.'
              : 'When you write and save entries here, they will appear in chronological order.'}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-medium bg-[var(--page-muted)] text-[var(--ink)] rounded-md hover:bg-[var(--accent-soft)] transition-colors"
            >
              Clear filters
            </button>
          ) : (
            activeSection !== 'trash' && (
              <button
                type="button"
                onClick={() => createNewEntry({ type: sectionConfig.defaultNewType })}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#FFFCF5] bg-[var(--accent)] rounded-md hover:opacity-95 transition-opacity"
              >
                <PenTool className="w-3.5 h-3.5" />
                {sectionConfig.ctaLabel}
              </button>
            )
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {groupedByMonth.map((group) => (
            <section key={group.monthLabel} className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                <h2 className="text-base font-literary font-medium text-[var(--ink)]">
                  {group.monthLabel}
                </h2>
                <span className="text-xs text-[var(--ink-soft)] tabular-nums">
                  {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <div className="space-y-4">
                {group.entries.map((entry) => (
                  <EntryRowItem
                    key={entry.id}
                    entry={entry}
                    collection={entry.collectionId ? collectionsMap[entry.collectionId] : undefined}
                    showConvertActions={activeSection === 'fragments' || entry.type === 'fragment'}
                    onRequestPermanentDelete={(item) => setEntryToConfirmDelete(item)}
                  />
                ))}
              </div>
            </section>
          ))}

          {visibleEntries.length < filteredEntries.length && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => setVisibleLimit((l) => l + 12)}
                className="px-5 py-2.5 text-xs font-medium bg-[var(--page)] border border-[var(--line)] rounded-md text-[var(--ink)] hover:border-[var(--accent)] transition-colors"
              >
                Load older pages ({filteredEntries.length - visibleEntries.length} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Second Confirmation Modal for Permanent Deletion in Trash */}
      {entryToConfirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-permanent-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <div className="bg-[var(--page)] border border-[var(--line)] rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-[var(--danger)]">
              <Trash2 className="w-5 h-5" />
              <h3 id="confirm-permanent-delete-title" className="text-base font-semibold">
                Permanently delete this page?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              You are about to permanently erase{' '}
              <strong className="text-[var(--ink)] font-bangla">
                {entryToConfirmDelete.title || `Untitled ${entryToConfirmDelete.type}`}
              </strong>
              . This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEntryToConfirmDelete(null)}
                className="px-4 py-2 text-xs font-medium bg-[var(--page-muted)] text-[var(--ink)] rounded-md hover:bg-[var(--line)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  permanentlyDeleteEntry(entryToConfirmDelete.id);
                  setEntryToConfirmDelete(null);
                }}
                className="px-4 py-2 text-xs font-medium bg-[var(--danger)] text-[#FFFCF5] rounded-md hover:opacity-95 transition-opacity"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
