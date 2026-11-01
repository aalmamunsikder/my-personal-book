'use client';

import React, { useMemo, useState } from 'react';
import {
  Archive,
  BookMarked,
  BookOpen,
  Calendar as CalendarIcon,
  Feather,
  FileText,
  FolderHeart,
  Heart,
  Lock,
  Menu,
  Palette,
  PenTool,
  Quote,
  Search,
  Settings,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { ActiveNavSection } from '../../types/entry';
import { useJournal } from '../../context/JournalContext';
import { formatEditorialDate, getLocalTodayDateString } from '../../lib/entry-utils';
import { MiniCalendarWidget } from '../calendar/MiniCalendarWidget';
import { AppearanceStudioModal } from '../appearance/AppearanceStudioModal';

interface NavItem {
  id: ActiveNavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: 'journal', label: 'My Journal', icon: BookOpen },
  { id: 'entries', label: 'Daily Entries', icon: FileText },
  { id: 'poems', label: 'Poems', icon: Feather },
  { id: 'quotes', label: 'Quotes', icon: Quote },
  { id: 'fragments', label: 'Fragments', icon: Sparkles },
  { id: 'collections', label: 'Collections', icon: FolderHeart },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'settings', label: 'Settings & Backup', icon: Settings },
];

export function JournalShell({ children }: { children: React.ReactNode }) {
  const {
    entries,
    collections,
    activeSection,
    activeCollectionId,
    selectedCalendarDate,
    globalSearchQuery,
    setGlobalSearchQuery,
    navigateTo,
    createNewEntry,
    setVaultLocked,
    user,
    appearanceStudioOpen,
    setAppearanceStudioOpen,
    updateAppearanceConfig,
    setCollectionAppearanceOverride,
  } = useJournal();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const todayFormatted = useMemo(() => formatEditorialDate(getLocalTodayDateString(), false), []);

  const activeEntries = useMemo(
    () => entries.filter((e) => !e.isTrashed && e.status !== 'archived'),
    [entries]
  );

  const trashedCount = useMemo(
    () => entries.filter((e) => e.isTrashed).length,
    [entries]
  );

  const handleNavClick = (section: ActiveNavSection) => {
    navigateTo(section);
    setMobileMenuOpen(false);
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      activeSection !== 'entries' &&
      activeSection !== 'poems' &&
      activeSection !== 'quotes' &&
      activeSection !== 'fragments'
    ) {
      navigateTo('entries');
    }
  };

  const handleCalendarWidgetSelect = (dateStr: string) => {
    navigateTo('calendar', { date: dateStr });
  };

  const showRightContextPanel =
    activeSection === 'journal' || activeSection === 'entries' || activeSection === 'poems';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)]">
      {/* Top Bar following the strict 3-zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5 bg-[var(--paper)]/95 backdrop-blur-sm border-b border-[var(--line)]">
        {/* Zone 1: Single text element wordmark (plus mobile menu toggle on small screens) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle journal navigation"
            className="lg:hidden p-1.5 rounded text-[var(--ink)] hover:bg-[var(--page-muted)] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => navigateTo('journal')}
            className="text-lg font-bold tracking-tight text-[var(--ink)] font-literary whitespace-nowrap shrink-0 focus:outline-none"
          >
            VerseVault
          </button>
        </div>

        {/* Zone 2: Concise single-line navigation links + quiet inline search */}
        <div className="hidden md:flex items-center gap-6 text-sm text-[var(--ink-soft)] flex-1 justify-center max-w-2xl">
          <nav aria-label="Quick sections" className="hidden xl:flex items-center gap-5">
            <button
              type="button"
              onClick={() => navigateTo('journal')}
              className={`hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'journal' ? 'text-[var(--ink)] font-medium underline underline-offset-4' : ''
              }`}
            >
              My Journal
            </button>
            <button
              type="button"
              onClick={() => navigateTo('entries')}
              className={`hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'entries' ? 'text-[var(--ink)] font-medium underline underline-offset-4' : ''
              }`}
            >
              Daily Entries
            </button>
            <button
              type="button"
              onClick={() => navigateTo('poems')}
              className={`hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'poems' ? 'text-[var(--ink)] font-medium underline underline-offset-4' : ''
              }`}
            >
              Poems
            </button>
            <button
              type="button"
              onClick={() => navigateTo('calendar')}
              className={`hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0 ${
                activeSection === 'calendar' ? 'text-[var(--ink)] font-medium underline underline-offset-4' : ''
              }`}
            >
              Calendar
            </button>
          </nav>

          <form onSubmit={handleGlobalSearchSubmit} className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-[var(--ink-soft)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={globalSearchQuery}
              onChange={(e) => {
                setGlobalSearchQuery(e.target.value);
                if (
                  e.target.value.trim() &&
                  activeSection !== 'entries' &&
                  activeSection !== 'poems' &&
                  activeSection !== 'quotes' &&
                  activeSection !== 'fragments'
                ) {
                  navigateTo('entries');
                }
              }}
              placeholder="Search Bangla or English…"
              aria-label="Search diary entries, poems, quotes, and tags"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--page)] border border-[var(--line)] rounded-md text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:border-[var(--accent)]"
            />
          </form>
        </div>

        {/* Zone 3: 1 primary action + Appearance Studio trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setAppearanceStudioOpen(true)}
            aria-label="Open Book Appearance Studio"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--ink)] bg-[var(--page)] border border-[var(--line)] hover:border-[var(--accent)] rounded-md transition-colors whitespace-nowrap shrink-0 shadow-xs"
            title="Appearance Studio (Themes, Paper, Templates, Typography)"
          >
            <Palette className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">Appearance Studio</span>
          </button>

          <button
            type="button"
            onClick={() => createNewEntry({ type: 'diary', entryDate: getLocalTodayDateString() })}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#FFFCF5] bg-[var(--accent)] rounded-md hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
          >
            <PenTool className="w-3.5 h-3.5" />
            Write today&apos;s entry
          </button>
        </div>
      </header>

      {/* Main 3-part Journal Workspace Layout */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        {/* Left Navigation Rail (Desktop 236px) */}
        <aside
          aria-label="Journal Sections"
          className="hidden lg:flex flex-col w-[236px] shrink-0 border-r border-[var(--line)] bg-[var(--paper)] px-4 py-6 justify-between"
        >
          <div className="space-y-6">
            <div>
              <button
                type="button"
                onClick={() => createNewEntry()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium bg-[var(--page)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--accent)] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <PenTool className="w-4 h-4 text-[var(--accent)]" />
                Write an entry
              </button>
            </div>

            <nav className="space-y-1">
              {PRIMARY_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[var(--accent-soft)] text-[var(--ink)] font-medium'
                        : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--page-muted)]/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleNavClick('trash')}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left whitespace-nowrap shrink-0 ${
                  activeSection === 'trash'
                    ? 'bg-[var(--accent-soft)] text-[var(--ink)] font-medium'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--page-muted)]/60'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span>Trash</span>
                </span>
                {trashedCount > 0 && (
                  <span className="text-xs text-[var(--ink-soft)] tabular-nums">{trashedCount}</span>
                )}
              </button>
            </nav>

            {/* Collections Quick List */}
            {collections.length > 0 && (
              <div className="pt-4 border-t border-[var(--line)]">
                <div className="px-3 mb-2 flex items-center justify-between text-xs font-medium text-[var(--ink-soft)]">
                  <span>Notebooks</span>
                  <button
                    type="button"
                    onClick={() => navigateTo('collections')}
                    className="hover:text-[var(--ink)] transition-colors"
                  >
                    All
                  </button>
                </div>
                <div className="space-y-0.5">
                  {collections.slice(0, 5).map((col) => {
                    const isColActive =
                      activeSection === 'collection-detail' && col.id === activeCollectionId;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => navigateTo('collection-detail', { collectionId: col.id })}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs rounded-md transition-colors text-left font-bangla ${
                          isColActive
                            ? 'bg-[var(--accent-soft)] text-[var(--ink)] font-medium'
                            : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--page-muted)]/50'
                        }`}
                      >
                        <BookMarked className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />
                        <span className="truncate">{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quiet owner privacy status & lock control at bottom of sidebar */}
          <div className="pt-4 pb-12 border-t border-[var(--line)] space-y-2 text-xs text-[var(--ink-soft)]">
            <div className="px-2">
              <p className="font-medium text-[var(--ink)] truncate">
                {user ? user.displayName || user.email : 'Private Owner Vault'}
              </p>
              <p className="text-[11px] text-[var(--ink-soft)]">
                {user ? 'Cloud & Local Synced' : 'Saved on this device'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVaultLocked(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--page-muted)] transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Owner Lock / Sign In</span>
            </button>
          </div>
        </aside>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <nav
              aria-label="Mobile Journal Navigation"
              className="relative z-50 w-72 max-w-[82vw] bg-[var(--paper)] border-r border-[var(--line)] p-5 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                  <span className="font-literary font-bold text-base text-[var(--ink)]">
                    VerseVault
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close navigation menu"
                    className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Search */}
                <form onSubmit={handleGlobalSearchSubmit} className="relative">
                  <Search className="w-3.5 h-3.5 text-[var(--ink-soft)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    placeholder="Search journal…"
                    aria-label="Search journal on mobile"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-[var(--page)] border border-[var(--line)] rounded-md text-[var(--ink)]"
                  />
                </form>

                <div className="space-y-1">
                  {PRIMARY_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors text-left ${
                          isActive
                            ? 'bg-[var(--accent-soft)] text-[var(--ink)] font-medium'
                            : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handleNavClick('trash')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-md transition-colors text-left ${
                      activeSection === 'trash'
                        ? 'bg-[var(--accent-soft)] text-[var(--ink)] font-medium'
                        : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Trash2 className="w-4 h-4 shrink-0" />
                      <span>Trash</span>
                    </span>
                    {trashedCount > 0 && <span className="text-xs tabular-nums">{trashedCount}</span>}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setVaultLocked(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-[var(--ink-soft)] hover:text-[var(--ink)]"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Owner Lock / Sign In</span>
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Central Journal Canvas */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
          <div className="max-w-[880px] mx-auto">{children}</div>
        </main>

        {/* Optional Right Context Panel (visible on wide desktop screens for Home & Timeline) */}
        {showRightContextPanel && (
          <aside
            aria-label="Journal Calendar and Archive Context"
            className="hidden xl:block w-[256px] shrink-0 border-l border-[var(--line)] px-5 py-8 space-y-6"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                  Calendar
                </h2>
                <button
                  type="button"
                  onClick={() => navigateTo('calendar')}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Full view
                </button>
              </div>
              <MiniCalendarWidget
                entries={entries}
                selectedDate={selectedCalendarDate}
                onSelectDate={handleCalendarWidgetSelect}
                compact
              />
            </div>

            {/* Quiet Archive Summary (unboxed text, no SaaS metric cards) */}
            <div className="pt-5 border-t border-[var(--line)] space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                In This Journal
              </h2>
              <p className="text-xs text-[var(--ink-soft)] leading-relaxed tabular-nums">
                {activeEntries.length} total pages ·{' '}
                {activeEntries.filter((e) => e.type === 'diary').length} diary entries ·{' '}
                {activeEntries.filter((e) => e.type === 'poem').length} poems ·{' '}
                {activeEntries.filter((e) => e.type === 'quote').length} quotes ·{' '}
                {activeEntries.filter((e) => e.type === 'fragment').length} fragments
              </p>
            </div>

            {/* Recent Moods filter shortcut */}
            <div className="pt-5 border-t border-[var(--line)] space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                Today
              </h2>
              <p className="text-xs text-[var(--ink)] font-literary italic">
                {todayFormatted}
              </p>
              <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                Every entry is saved privately. Line breaks and Bangla or English script are preserved verbatim.
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* Flagship Appearance Studio Modal */}
      <AppearanceStudioModal
        open={appearanceStudioOpen}
        onClose={() => setAppearanceStudioOpen(false)}
        collections={collections}
        onApplyGlobal={updateAppearanceConfig}
        onApplyCollection={setCollectionAppearanceOverride}
      />
    </div>
  );
}
