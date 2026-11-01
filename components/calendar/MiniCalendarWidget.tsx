'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { JournalEntry } from '../../types/entry';
import { getLocalTodayDateString } from '../../lib/entry-utils';

interface MiniCalendarWidgetProps {
  entries: JournalEntry[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  compact?: boolean;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function MiniCalendarWidget({
  entries,
  selectedDate,
  onSelectDate,
  compact = false,
}: MiniCalendarWidgetProps) {
  const todayStr = useMemo(() => getLocalTodayDateString(), []);

  const initialYearMonth = useMemo(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m] = selectedDate.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [selectedDate]);

  const [viewYear, setViewYear] = useState<number>(initialYearMonth.year);
  const [viewMonth, setViewMonth] = useState<number>(initialYearMonth.month);

  // Map YYYY-MM-DD -> entry count (excluding trashed)
  const dateCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of entries) {
      if (entry.isTrashed) continue;
      map[entry.entryDate] = (map[entry.entryDate] || 0) + 1;
    }
    return map;
  }, [entries]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: { day: number | null; dateStr: string | null }[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ day: d, dateStr: `${viewYear}-${mStr}-${dStr}` });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const monthLabel = useMemo(() => {
    const dt = new Date(viewYear, viewMonth, 1);
    return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className={`bg-[var(--page)] border border-[var(--line)] rounded-lg ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-[var(--ink)] font-literary">
          {monthLabel}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--page-muted)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--page-muted)] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-[11px] font-medium text-[var(--ink-soft)] py-1">
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, idx) => {
          if (!cell.day || !cell.dateStr) {
            return <div key={`empty-${idx}`} className={compact ? 'h-8' : 'h-10'} />;
          }
          const count = dateCounts[cell.dateStr] || 0;
          const isSelected = cell.dateStr === selectedDate;
          const isToday = cell.dateStr === todayStr;

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onSelectDate(cell.dateStr!)}
              aria-label={`Select date ${cell.dateStr}${count > 0 ? ` (${count} entries)` : ''}`}
              className={`relative flex flex-col items-center justify-center rounded transition-colors tabular-nums ${
                compact ? 'h-8 text-xs' : 'h-10 text-sm'
              } ${
                isSelected
                  ? 'bg-[var(--accent)] text-[#FFFCF5] font-semibold'
                  : isToday
                  ? 'bg-[var(--accent-soft)] text-[var(--ink)] font-medium'
                  : 'text-[var(--ink)] hover:bg-[var(--page-muted)]'
              }`}
            >
              <span>{cell.day}</span>
              {count > 0 && (
                <span
                  aria-hidden="true"
                  className={`w-1 h-1 rounded-full mt-0.5 ${
                    isSelected ? 'bg-[#FFFCF5]' : 'bg-[var(--accent)]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
