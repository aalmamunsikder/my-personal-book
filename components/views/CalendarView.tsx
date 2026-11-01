'use client';

import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, PenTool } from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import {
  formatEditorialDate,
  getLocalTodayDateString,
} from '../../lib/entry-utils';
import { MiniCalendarWidget } from '../calendar/MiniCalendarWidget';
import { EntryRowItem } from '../common/EntryRowItem';

export function CalendarView() {
  const {
    entries,
    collections,
    selectedCalendarDate,
    setSelectedCalendarDate,
    createNewEntry,
  } = useJournal();

  const todayStr = useMemo(() => getLocalTodayDateString(), []);

  const collectionsMap = useMemo(
    () => Object.fromEntries(collections.map((c) => [c.id, c])),
    [collections]
  );

  const entriesForSelectedDate = useMemo(
    () =>
      entries
        .filter((e) => !e.isTrashed && e.entryDate === selectedCalendarDate)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [entries, selectedCalendarDate]
  );

  const selectedDateHeading = useMemo(
    () => formatEditorialDate(selectedCalendarDate, true),
    [selectedCalendarDate]
  );

  return (
    <div className="space-y-8 pb-16">
      <header className="border-b border-[var(--line)] pb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-literary font-normal text-[var(--ink)] tracking-tight">
            Journal Calendar
          </h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Browse your diary by date, revisit past days, or write a backdated entry.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedCalendarDate !== todayStr && (
            <button
              type="button"
              onClick={() => setSelectedCalendarDate(todayStr)}
              className="px-3 py-2 text-xs font-medium bg-[var(--page)] border border-[var(--line)] rounded-md text-[var(--ink)] hover:border-[var(--accent)] transition-colors whitespace-nowrap shrink-0"
            >
              Jump to Today
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              createNewEntry({ type: 'diary', entryDate: selectedCalendarDate })
            }
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#FFFCF5] bg-[var(--accent)] rounded-md hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
          >
            <PenTool className="w-3.5 h-3.5" />
            Write for this day
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Monthly Calendar Column */}
        <div className="lg:col-span-5">
          <MiniCalendarWidget
            entries={entries}
            selectedDate={selectedCalendarDate}
            onSelectDate={setSelectedCalendarDate}
          />
          <p className="mt-3 text-xs text-[var(--ink-soft)] px-1">
            Dates marked with a dot contain one or more journal entries, poems, or fragments.
          </p>
        </div>

        {/* Selected Date Entries Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <div>
              <h2 className="text-lg font-literary font-medium text-[var(--ink)]">
                {selectedDateHeading}
              </h2>
              <p className="text-xs text-[var(--ink-soft)] tabular-nums">
                {entriesForSelectedDate.length}{' '}
                {entriesForSelectedDate.length === 1 ? 'page written' : 'pages written'} on this date
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                createNewEntry({ type: 'diary', entryDate: selectedCalendarDate })
              }
              className="text-xs font-medium text-[var(--accent)] hover:underline whitespace-nowrap shrink-0"
            >
              + Add entry for {selectedCalendarDate}
            </button>
          </div>

          {entriesForSelectedDate.length === 0 ? (
            <div className="bg-[var(--page)] border border-[var(--line)] rounded-lg p-10 text-center space-y-3">
              <CalendarIcon className="w-7 h-7 text-[var(--accent)] mx-auto stroke-[1.5]" />
              <h3 className="text-base font-literary text-[var(--ink)]">
                No entries recorded on {selectedDateHeading}.
              </h3>
              <p className="text-xs text-[var(--ink-soft)] max-w-sm mx-auto">
                You can write a new entry or backdated reflection specifically for this day.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() =>
                    createNewEntry({ type: 'diary', entryDate: selectedCalendarDate })
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#FFFCF5] bg-[var(--accent)] rounded-md hover:opacity-95 transition-opacity"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Write for this day
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {entriesForSelectedDate.map((entry) => (
                <EntryRowItem
                  key={entry.id}
                  entry={entry}
                  collection={
                    entry.collectionId ? collectionsMap[entry.collectionId] : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
