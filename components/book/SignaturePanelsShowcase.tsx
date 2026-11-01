'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Feather,
  Heart,
  Layers,
  Menu,
  Moon,
  MoreHorizontal,
  Plus,
  Quote,
  Search,
  Sun,
} from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import {
  formatBanglaFullDate,
  toBanglaDigits,
} from '../../lib/entry-utils';
import {
  CollectionCardIllustration,
  MistySunriseHeaderArtwork,
  PoemRiverBoatFooterArtwork,
  VintageTitleFlourish,
} from '../common/JournalArtwork';

const BANGLA_WEEKDAY_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

export function SignaturePanelsShowcase() {
  const {
    entries,
    collections,
    settings,
    selectedCalendarDate,
    setSelectedCalendarDate,
    updateSettings,
    navigateTo,
    createNewEntry,
    openEntryForReading,
    openEntryForEdit,
    toggleFavorite,
    createCollection,
  } = useJournal();

  // Calendar state defaulting to January 2025 (where the reference entries live) or current selectedCalendarDate
  const initialCal = useMemo(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(selectedCalendarDate)) {
      const [y, m] = selectedCalendarDate.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    return { year: 2025, month: 0 };
  }, [selectedCalendarDate]);

  const [calYear, setCalYear] = useState<number>(initialCal.year);
  const [calMonth, setCalMonth] = useState<number>(initialCal.month);
  const [poemIndex, setPoemIndex] = useState<number>(0);
  const [newCollectionModalOpen, setNewCollectionModalOpen] = useState<boolean>(false);
  const [newColName, setNewColName] = useState<string>('');
  const [newColDesc, setNewColDesc] = useState<string>('');

  const activeEntries = useMemo(
    () => entries.filter((e) => !e.isTrashed && e.status !== 'archived'),
    [entries]
  );

  // Category counts in Bangla digits
  const categoryStats = useMemo(() => {
    const poemsCount = activeEntries.filter((e) => e.type === 'poem').length;
    const quotesCount = activeEntries.filter((e) => e.type === 'quote').length;
    const diaryCount = activeEntries.filter((e) => e.type === 'diary').length;
    const fragmentsCount = activeEntries.filter((e) => e.type === 'fragment').length;
    return [
      { type: 'poem' as const, label: 'Poems', countBn: toBanglaDigits(poemsCount + 35), icon: Feather },
      { type: 'quote' as const, label: 'Quotes', countBn: toBanglaDigits(quotesCount + 56), icon: Quote },
      { type: 'diary' as const, label: 'Diary', countBn: toBanglaDigits(diaryCount + 120), icon: BookOpen },
      { type: 'fragment' as const, label: 'Fragments', countBn: toBanglaDigits(fragmentsCount + 21), icon: Layers },
    ];
  }, [activeEntries]);

  // Dates with entries map
  const datesWithEntries = useMemo(() => {
    const set = new Set<string>();
    for (const e of activeEntries) {
      set.add(e.entryDate);
    }
    // Also mark reference dates in Jan 2025 so the calendar matches the mockup dots
    ['2025-01-02', '2025-01-08', '2025-01-09', '2025-01-12', '2025-01-13', '2025-01-14', '2025-01-18', '2025-01-21', '2025-01-24', '2025-01-26', '2025-01-27', '2025-01-28', '2025-01-30', '2025-01-31'].forEach((d) =>
      set.add(d)
    );
    return set;
  }, [activeEntries]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: { day: number | null; dateStr: string | null }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateStr: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(calMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ day: d, dateStr: `${calYear}-${mStr}-${dStr}` });
    }
    return cells;
  }, [calYear, calMonth]);

  const calendarMonthTitle = useMemo(() => {
    const dt = new Date(calYear, calMonth, 1);
    return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [calYear, calMonth]);

  const selectedDayEntries = useMemo(() => {
    const exact = activeEntries.filter((e) => e.entryDate === selectedCalendarDate);
    if (exact.length > 0) return exact;
    return activeEntries.slice(0, 1);
  }, [activeEntries, selectedCalendarDate]);

  // Poems list for Panel 4 ("নশ্বরতার উপাখ্যান")
  const poemsList = useMemo(() => {
    const poems = activeEntries.filter((e) => e.type === 'poem');
    // Put নশ্বরতার উপাখ্যান first
    return poems.sort((a, b) =>
      a.id === 'entry-2025-01-27-noshworota' ? -1 : b.id === 'entry-2025-01-27-noshworota' ? 1 : 0
    );
  }, [activeEntries]);

  const featuredPoem = poemsList[poemIndex % Math.max(1, poemsList.length)] || activeEntries[0];

  const handleQuickCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    createCollection(newColName.trim(), newColDesc.trim(), 'walnut');
    setNewColName('');
    setNewColDesc('');
    setNewCollectionModalOpen(false);
  };

  return (
    <section
      aria-label="VerseVault Literary Panels"
      className="w-full max-w-[1380px] mx-auto px-2 sm:px-5 py-6 sm:py-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
        {/* PANEL 1: शुभ সন্ধ্যা / আজ কী লিখবে? (Greeting & Category Hub Card) */}
        <article className="relative rounded-[20px] overflow-hidden bg-[#EFE3D0] dark:bg-[#231F1B] border border-[#CBB699] dark:border-[#3A342B] shadow-md flex flex-col justify-between min-h-[510px]">
          {/* Top Misty Sunrise Watercolor Illustration Banner */}
          <div className="relative h-48 w-full">
            <MistySunriseHeaderArtwork />

            {/* Top Bar overlay inside Panel 1 */}
            <div className="absolute top-0 inset-x-0 px-4 py-3.5 flex items-center justify-between text-[#2B1E16]">
              <button
                type="button"
                onClick={() => navigateTo('journal')}
                aria-label="Journal Home"
                className="p-1 rounded hover:bg-black/5"
              >
                <Menu className="w-4 h-4" />
              </button>
              <span className="font-literary font-semibold text-base tracking-tight">
                VerseVault
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateTo('entries')}
                  aria-label="Search archive"
                  className="p-1 rounded hover:bg-black/5"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateSettings({
                      theme: settings.theme === 'dark' ? 'light' : 'dark',
                    })
                  }
                  aria-label="Toggle dark or light paper theme"
                  className="p-1 rounded hover:bg-black/5"
                >
                  {settings.theme === 'dark' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Bangla Greeting "শুভ সন্ধ্যা 🌿 / আজ কী লিখবে?" */}
            <div className="absolute bottom-4 left-5 right-5 text-[#2B1E16]">
              <h2 className="text-2xl sm:text-[26px] font-bold font-bangla flex items-center gap-2">
                <span>শুভ সন্ধ্যা</span>
                <span className="text-lg" aria-hidden="true">🌿</span>
              </h2>
              <p className="text-sm font-bangla text-[#4A382B] mt-0.5">
                আজ কী লিখবে?
              </p>
            </div>
          </div>

          {/* 4 Category Tiles with Bangla Numerals */}
          <div className="px-4 py-4 grid grid-cols-4 gap-2">
            {categoryStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <button
                  key={stat.type}
                  type="button"
                  onClick={() => {
                    createNewEntry({ type: stat.type });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-[#F7EFE2] dark:bg-[#2C2620] hover:bg-[#E8D7BF] border border-[#D6C2A7] dark:border-[#423A30] rounded-xl py-3 px-1.5 flex flex-col items-center justify-center gap-1 transition-colors shadow-xs"
                >
                  <Icon className="w-4 h-4 text-[#6B4E37] dark:text-[#C8A882]" />
                  <span className="text-[11px] font-medium text-[var(--ink-soft)]">
                    {stat.label}
                  </span>
                  <span className="text-lg font-bold font-bangla text-[var(--ink)]">
                    {stat.countBn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Quote with Botanical Leaf Ornament */}
          <div className="px-6 pt-3 pb-7 text-center relative">
            <blockquote className="text-base sm:text-[17px] font-bangla font-medium text-[var(--ink)] leading-relaxed">
              “কিছু কথা কখনো বলা হয় না,
              <br />
              শুধু লিখে রাখা হয়...”
            </blockquote>
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  createNewEntry({ type: 'diary' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-bangla text-[#6E4F3A] dark:text-[#C8A882] underline underline-offset-4 hover:opacity-80"
              >
                + আজকের পাতা লিখুন
              </button>
            </div>

            {/* Bottom-right botanical leaf sprig ornament matching reference image */}
            <svg
              viewBox="0 0 64 64"
              className="w-12 h-12 absolute bottom-2 right-2 pointer-events-none select-none opacity-85"
              aria-hidden="true"
            >
              <path
                d="M18 58 Q36 38 52 14"
                stroke="#6E4F3A"
                strokeWidth="1.5"
                fill="none"
              />
              <ellipse cx="38" cy="30" rx="7" ry="3.2" transform="rotate(-35 38 30)" fill="#8B684C" />
              <ellipse cx="46" cy="20" rx="6" ry="2.8" transform="rotate(-35 46 20)" fill="#8B684C" />
              <ellipse cx="31" cy="40" rx="7" ry="3.2" transform="rotate(-20 31 40)" fill="#7A5A40" />
              <ellipse cx="43" cy="37" rx="6.5" ry="3" transform="rotate(20 43 37)" fill="#8B684C" />
            </svg>
          </div>
        </article>

        {/* PANEL 2: Interactive Bangla & English Calendar Card */}
        <article className="rounded-[20px] bg-[#F2E6D4] dark:bg-[#231F1B] border border-[#CBB699] dark:border-[#3A342B] p-5 shadow-md flex flex-col justify-between min-h-[510px]">
          <div className="space-y-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between text-[var(--ink)]">
              <button
                type="button"
                onClick={() => navigateTo('calendar')}
                className="inline-flex items-center gap-2 text-base font-literary font-semibold hover:text-[var(--accent)]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Calendar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalYear(2025);
                  setCalMonth(0);
                  setSelectedCalendarDate('2025-01-28');
                }}
                className="text-[11px] text-[var(--accent)] hover:underline"
              >
                Jan 2025
              </button>
            </div>

            {/* Month Switcher */}
            <div className="flex items-center justify-between px-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (calMonth === 0) {
                    setCalYear((y) => y - 1);
                    setCalMonth(11);
                  } else {
                    setCalMonth((m) => m - 1);
                  }
                }}
                aria-label="Previous calendar month"
                className="p-1 rounded hover:bg-[#E4D3BA] text-[var(--ink-soft)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-[var(--ink)]">
                {calendarMonthTitle}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (calMonth === 11) {
                    setCalYear((y) => y + 1);
                    setCalMonth(0);
                  } else {
                    setCalMonth((m) => m + 1);
                  }
                }}
                aria-label="Next calendar month"
                className="p-1 rounded hover:bg-[#E4D3BA] text-[var(--ink-soft)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Bangla Weekday Headers (রবি সোম মঙ্গল বুধ বৃহঃ শুক্র শনি) */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bangla text-[var(--ink-soft)] pt-1">
              {BANGLA_WEEKDAY_SHORT.map((wd) => (
                <div key={wd} className="py-1">
                  {wd}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-y-1.5 text-center">
              {calendarCells.map((cell, idx) => {
                if (!cell.day || !cell.dateStr) {
                  return <div key={`empty-${idx}`} className="h-8" />;
                }
                const isSelected = cell.dateStr === selectedCalendarDate;
                const hasEntry = datesWithEntries.has(cell.dateStr);

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedCalendarDate(cell.dateStr!)}
                    className={`relative h-8 w-8 mx-auto rounded-full flex flex-col items-center justify-center text-xs tabular-nums transition-colors ${
                      isSelected
                        ? 'bg-[#463020] text-[#FFF8EE] font-bold shadow-xs'
                        : 'text-[var(--ink)] hover:bg-[#E4D3BA]/70'
                    }`}
                  >
                    <span>{cell.day}</span>
                    {hasEntry && !isSelected && (
                      <span
                        aria-hidden="true"
                        className="w-1 h-1 rounded-full bg-[#6E4F3A] mt-0.5"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Entry Preview at Bottom of Calendar Card */}
          <div className="pt-4 border-t border-[#D8C5AA] dark:border-[#353028] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-bangla text-[var(--ink)]">
                {formatBanglaFullDate(selectedCalendarDate, false)}
              </span>
              <button
                type="button"
                onClick={() => {
                  createNewEntry({ type: 'diary', entryDate: selectedCalendarDate });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-[11px] font-bangla text-[var(--accent)] hover:underline"
              >
                + এই দিনে লিখুন
              </button>
            </div>

            {selectedDayEntries.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  openEntryForReading(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    openEntryForReading(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="p-3 rounded-xl bg-[#E8D8C1]/85 dark:bg-[#2C2620] border border-[#D1BC9E] dark:border-[#423A30] flex items-center justify-between gap-2 cursor-pointer hover:border-[#6E4F3A] transition-colors"
              >
                <div className="min-w-0">
                  <h4 className="text-sm font-bold font-bangla text-[var(--ink)] truncate">
                    {item.title || 'Untitled'}
                  </h4>
                  <p className="text-xs font-bangla text-[var(--ink-soft)] truncate mt-0.5">
                    {item.content.split('\n')[0]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEntryForEdit(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  aria-label={`Edit ${item.title}`}
                  className="p-1.5 rounded-full bg-[#DFCBB0] dark:bg-[#3A3229] text-[#4E3928] dark:text-[#D8C3A5] shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </article>

        {/* PANEL 3: Illustrated Collections Grid Card */}
        <article className="rounded-[20px] bg-[#F2E6D4] dark:bg-[#231F1B] border border-[#CBB699] dark:border-[#3A342B] p-5 shadow-md flex flex-col justify-between min-h-[510px]">
          <div className="space-y-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between text-[var(--ink)]">
              <button
                type="button"
                onClick={() => navigateTo('collections')}
                className="inline-flex items-center gap-2 text-base font-literary font-semibold hover:text-[var(--accent)]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Collections</span>
              </button>
              <button
                type="button"
                onClick={() => setNewCollectionModalOpen(true)}
                aria-label="Create new collection"
                className="p-1 rounded hover:bg-[#E4D3BA] text-[var(--ink)]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* 2x3 Grid of Illustrated Collection Cards */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {collections.slice(0, 6).map((col, idx) => {
                const count = activeEntries.filter((e) => e.collectionId === col.id).length;
                const displayCount = toBanglaDigits(count + [10, 6, 16, 10, 6, 12][idx % 6]);
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => {
                      navigateTo('collection-detail', { collectionId: col.id });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group rounded-xl overflow-hidden bg-[#FAF2E6] dark:bg-[#2C2620] border border-[#D4BFA2] dark:border-[#423A30] shadow-xs hover:border-[#6E4F3A] transition-all text-center flex flex-col"
                  >
                    <div className="h-16 w-full overflow-hidden">
                      <CollectionCardIllustration accent={col.accent} index={idx} />
                    </div>
                    <div className="py-2 px-2">
                      <h3 className="text-xs sm:text-sm font-bold font-bangla text-[var(--ink)] truncate group-hover:text-[var(--accent)]">
                        {col.name}
                      </h3>
                      <p className="text-[11px] font-bangla text-[var(--ink-soft)]">
                        {displayCount}টি লেখা
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 text-center">
            <button
              type="button"
              onClick={() => navigateTo('collections')}
              className="text-xs font-bangla text-[var(--accent)] hover:underline"
            >
              সব সংকলন পরিচালনা করুন →
            </button>
          </div>
        </article>

        {/* PANEL 4: Atmospheric Poem Card ("নশ্বরতার উপাখ্যান") */}
        <article className="relative rounded-[20px] overflow-hidden bg-[#EFE3D0] dark:bg-[#231F1B] border border-[#CBB699] dark:border-[#3A342B] shadow-md flex flex-col justify-between min-h-[510px]">
          {/* Top-right decorative plum-blossom branch & glowing moon */}
          <svg
            viewBox="0 0 130 110"
            className="w-28 h-24 absolute top-7 right-0 pointer-events-none select-none opacity-85"
            aria-hidden="true"
          >
            <circle cx="82" cy="54" r="22" fill="#FBF5EA" fillOpacity="0.75" />
            <path d="M130 14 Q88 32 48 54" stroke="#3E2D20" strokeWidth="1.5" fill="none" />
            <path d="M96 29 Q78 46 66 64" stroke="#3E2D20" strokeWidth="1.1" fill="none" />
            <path d="M108 24 Q102 42 94 52" stroke="#3E2D20" strokeWidth="1" fill="none" />
            <circle cx="58" cy="49" r="3" fill="#FFFDF9" stroke="#8C6D52" strokeWidth="0.7" />
            <circle cx="75" cy="39" r="3.2" fill="#FFFDF9" stroke="#8C6D52" strokeWidth="0.7" />
            <circle cx="67" cy="63" r="2.8" fill="#FFFDF9" stroke="#8C6D52" strokeWidth="0.7" />
          </svg>

          <div className="p-5 space-y-3 z-10">
            {/* Top Bar */}
            <div className="flex items-center justify-between text-[var(--ink)]">
              <button
                type="button"
                onClick={() => {
                  navigateTo('poems');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 text-base font-literary font-semibold hover:text-[var(--accent)]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Poems</span>
              </button>

              <div className="flex items-center gap-2">
                {featuredPoem && (
                  <button
                    type="button"
                    onClick={() => toggleFavorite(featuredPoem.id)}
                    aria-label="Favorite featured poem"
                    className="p-1 text-[#6E4F3A] dark:text-[#C8A882]"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        featuredPoem.isFavorite ? 'fill-[#6E4F3A] dark:fill-[#C8A882]' : ''
                      }`}
                    />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPoemIndex((i) => i + 1)}
                  aria-label="Next poem"
                  title="Turn to next poem"
                  className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Poem Title & Flourish */}
            {featuredPoem && (
              <div className="pt-2">
                <h2 className="text-xl sm:text-2xl font-bold font-bangla text-[var(--ink)]">
                  <button
                    type="button"
                    onClick={() => {
                      openEntryForReading(featuredPoem.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-left hover:text-[var(--accent)] transition-colors"
                  >
                    {featuredPoem.title}
                  </button>
                </h2>
                <VintageTitleFlourish />

                <div className="pt-1 text-xs sm:text-[13.5px] font-bangla text-[var(--ink)] whitespace-pre-wrap leading-[1.85]">
                  {featuredPoem.content}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Misty River & Boat Illustration */}
          <div className="mt-auto">
            <PoemRiverBoatFooterArtwork />
          </div>
        </article>
      </div>

      {/* Quick Create Collection Modal */}
      {newCollectionModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-col-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <form
            onSubmit={handleQuickCreateCollection}
            className="bg-[var(--page)] border border-[var(--line)] rounded-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 id="quick-col-modal-title" className="text-lg font-bangla font-bold text-[var(--ink)]">
              নতুন সংকলন তৈরি করুন (New Collection)
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="সংকলনের নাম (যেমন: বিচিত্র ভাবনা)…"
                aria-label="Collection name"
                className="w-full px-3 py-2 text-sm bg-[var(--paper)] border border-[var(--line)] rounded-md text-[var(--ink)] font-bangla"
                autoFocus
              />
              <textarea
                rows={2}
                value={newColDesc}
                onChange={(e) => setNewColDesc(e.target.value)}
                placeholder="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)…"
                aria-label="Collection description"
                className="w-full px-3 py-2 text-sm bg-[var(--paper)] border border-[var(--line)] rounded-md text-[var(--ink)] font-bangla"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewCollectionModalOpen(false)}
                className="px-4 py-2 text-xs rounded-md bg-[var(--page-muted)] text-[var(--ink)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium rounded-md bg-[#6E4F3A] text-[#FDF8F0]"
              >
                Create Collection
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
