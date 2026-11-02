'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Archive,
  ArrowLeft,
  BookMarked,
  Bookmark,
  BookOpen,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Edit3,
  Feather,
  Folder,
  Heart,
  KeyRound,
  Layers,
  Lock,
  LogIn,
  LogOut,
  Maximize2,
  Menu,
  Minimize2,
  Moon,
  MoreHorizontal,
  Plus,
  Quote,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Unlock,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import {
  countCharacters,
  countWords,
  ENTRY_MOODS,
  filterAndSortEntries,
  formatBangladeshTime,
  formatBanglaFullDate,
  formatDayMonthBadge,
  formatEditorialDate,
  formatEntryAsMarkdown,
  formatEntryAsPlainText,
  getBangladeshGreeting,
  getLocalTodayDateString,
  getSingleLinePreview,
  resolveContentFontScript,
  toBanglaDigits,
  toSafeFilenameSlug,
} from '../../lib/entry-utils';
import { triggerTextDownload } from '../../lib/export-utils';
import {
  DESK_BACKGROUNDS,
  getDeskBackground,
  getInkColorPreset,
  getWritingStylePreset,
  INK_COLOR_PRESETS,
  JOURNAL_TEMPLATES,
  JournalTemplate,
  resolveEffectivePageVariation,
  WRITING_STYLE_PRESETS,
} from '../../lib/journal-templates';
import { useBookSound } from '../../lib/book-sound-engine';
import type {
  DeskBackgroundId,
  EntryMood,
  EntryStatus,
  EntryType,
  InkColorId,
  PageVariation,
  ReadingBookmark,
  WritingStyleId,
} from '../../types/entry';
import {
  BotanicalSprigOrnament,
  CollectionCardIllustration,
  EpistolaryWaxSealStamp,
  FountainPenBlossomsCorner,
  GoldenQuillEmblem,
  LeatherMountainMoonArtwork,
  MistySunriseHeaderArtwork,
  PlumBlossomMoonCorner,
  VintageTitleFlourish,
} from '../common/JournalArtwork';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { BookDialogFrame, BOOK_DIALOG_ROOT_ID } from '../common/BookDialogFrame';
import { SaveStateIndicator } from '../common/SaveStateIndicator';
import { ContinueWritingCard } from '../journal/ContinueWritingCard';
import { MemoryReturnCard } from '../journal/MemoryReturnCard';
import { PageVariationSwitcher } from '../journal/PageVariationSwitcher';
import { TemplatePickerModal } from '../journal/TemplatePickerModal';
import {
  ArchivalSelect,
  BrassCornerOrnament,
  CurledPageCorner,
  LeatherClaspButton,
  ParchmentPlateButton,
  SpineCordHubs,
} from '../ui/VerseVaultUI';
import { ClosedLeatherBookCover } from './ClosedLeatherBookCover';
import { SettingsBackupView } from '../views/SettingsBackupView';
import { AskMyArchiveModal } from '../ai/AskMyArchiveModal';

type LeftPageMode =
  | 'overview'
  | 'list'
  | 'calendar'
  | 'collections'
  | 'collection-entries'
  | 'trash'
  | 'settings';

type MobileActiveView = 'left-page' | 'right-page';

const BANGLA_WEEKDAY_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

const DESK_BG_STORAGE_KEY = 'versevault_desk_bg_v1';
const DEFAULT_WRITING_STYLE_KEY = 'versevault_writing_style_v1';
const DEFAULT_INK_COLOR_KEY = 'versevault_ink_color_v1';
const READING_BOOKMARK_KEY = 'versevault_reading_place_v1';
const LAST_SESSION_PLACE_KEY = 'versevault_last_session_v1';

export function OpenLeatherJournalSpread() {
  const {
    user,
    isAdmin,
    authError,
    clearAuthError,
    adminLoginModalOpen,
    setAdminLoginModalOpen,
    signInOwner,
    signOutOwner,
    isEntryUnlockedForViewer,
    unlockEntryWithPassword,
    lockEntryAgain,
    setEntryPasswordLock,
    entries,
    collections,
    tags,
    settings,
    activeSection,
    activeEntryId,
    activeCollectionId,
    selectedCalendarDate,
    setSelectedCalendarDate,
    globalSearchQuery,
    setGlobalSearchQuery,
    saveState,
    navigateTo,
    createNewEntry,
    openEntryForReading,
    updateEntry,
    retryFailedSave,
    toggleFavorite,
    archiveEntry,
    restoreFromArchive,
    moveToTrash,
    restoreFromTrash,
    permanentlyDeleteEntry,
    createCollection,
    updateSettings,
    setVaultLocked,
  } = useJournal();

  const {
    soundEnabled,
    toggleSound,
    playPageTurn,
    playBookOpen,
    playBookClose,
    playPenScratch,
    playInkStamp,
    playRibbonSlide,
    playBrassClick,
  } = useBookSound();

  // Closed Leather Cover state (starts closed on the front leather cover) & 3D Page Turn Animation state
  const [isBookClosed, setIsBookClosed] = useState<boolean>(true);
  const [pageTurnAnim, setPageTurnAnim] = useState<{
    key: number;
    direction: 'next' | 'prev';
  } | null>(null);

  // Left page mode on desktop (and left-pane mode on mobile)
  const [leftPageMode, setLeftPageMode] = useState<LeftPageMode>('list');
  // Mobile single-page focus ('left-page' shows Hub/List/Calendar/Collections; 'right-page' shows active Reader/Editor)
  const [mobileView, setMobileView] = useState<MobileActiveView>('left-page');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // Filters & sorting
  const [typeDropdown, setTypeDropdown] = useState<EntryType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'updated-desc' | 'title-asc'>('date-desc');
  const [activeTagFilter, setActiveTagFilter] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  // Right page reader/editor states
  const [isEditingOnRightPage, setIsEditingOnRightPage] = useState<boolean>(false);
  const [zenFullSpreadEditor, setZenFullSpreadEditor] = useState<boolean>(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [trashedUndoEntry, setTrashedUndoEntry] = useState<{ id: string; title: string } | null>(null);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [inlineTagAdderOpen, setInlineTagAdderOpen] = useState<boolean>(false);

  // Modals & Password Lock states
  const [templateModalOpen, setTemplateModalOpen] = useState<boolean>(false);
  const [newCollectionModalOpen, setNewCollectionModalOpen] = useState<boolean>(false);
  const [newColName, setNewColName] = useState<string>('');
  const [newColDesc, setNewColDesc] = useState<string>('');
  const [newColAccent, setNewColAccent] = useState<string>('walnut');
  const [unlockAttemptInput, setUnlockAttemptInput] = useState<string>('');
  const [unlockErrorMsg, setUnlockErrorMsg] = useState<string>('');
  const [entryLockModalOpen, setEntryLockModalOpen] = useState<boolean>(false);
  const [entryLockPasswordDraft, setEntryLockPasswordDraft] = useState<string>('');
  const [entryLockHintDraft, setEntryLockHintDraft] = useState<string>('');
  const [askArchiveModalOpen, setAskArchiveModalOpen] = useState<boolean>(false);
  const [confirmDialogState, setConfirmDialogState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  // Calendar month/year state (defaults to Jan 2025 where seed entries live)
  const [calYear, setCalYear] = useState<number>(2025);
  const [calMonth, setCalMonth] = useState<number>(0);

  // Writer's Desk Background, Writing Style & Fountain Pen Ink states
  const [deskBackground, setDeskBackground] = useState<DeskBackgroundId>(() => {
    if (typeof window === 'undefined') return 'mahogany-study';
    const saved = window.localStorage.getItem(DESK_BG_STORAGE_KEY);
    return (saved as DeskBackgroundId) || 'mahogany-study';
  });
  const [defaultWritingStyle, setDefaultWritingStyle] = useState<WritingStyleId>(() => {
    if (typeof window === 'undefined') return 'classic-book';
    const saved = window.localStorage.getItem(DEFAULT_WRITING_STYLE_KEY);
    return (saved as WritingStyleId) || 'classic-book';
  });
  const [defaultInkColor, setDefaultInkColor] = useState<InkColorId>(() => {
    if (typeof window === 'undefined') return 'sepia-walnut';
    const saved = window.localStorage.getItem(DEFAULT_INK_COLOR_KEY);
    return (saved as InkColorId) || 'sepia-walnut';
  });

  // Reading / Writing Bookmark ("Mark when leaving & start from there when opening again")
  const [readingBookmark, setReadingBookmark] = useState<ReadingBookmark | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(READING_BOOKMARK_KEY);
      return raw ? (JSON.parse(raw) as ReadingBookmark) : null;
    } catch {
      return null;
    }
  });
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [bookmarkToast, setBookmarkToast] = useState<string>('');
  const [styleBarOpen, setStyleBarOpen] = useState<boolean>(false);
  const [editorDetailsOpen, setEditorDetailsOpen] = useState<boolean>(false);

  // Dynamic Bangladesh Time & Time-of-day Greeting (Asia/Dhaka, UTC+6)
  const bdGreeting = useMemo(() => getBangladeshGreeting(), []);
  const bdTimeStr = useMemo(() => formatBangladeshTime(), []);

  const editorTitleRef = useRef<HTMLInputElement | null>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const manuscriptScrollRef = useRef<HTMLDivElement | null>(null);
  const hasRestoredInitialPlaceRef = useRef<boolean>(false);
  const pendingScrollRestoreRef = useRef<number | null>(null);

  // Sync external activeSection changes
  const [prevActiveSection, setPrevActiveSection] = useState(activeSection);
  if (prevActiveSection !== activeSection) {
    setPrevActiveSection(activeSection);
    if (activeSection === 'editor') {
      if (isAdmin) {
        setIsEditingOnRightPage(true);
        setMobileView('right-page');
      } else {
        setAdminLoginModalOpen(true);
      }
    } else if (activeSection === 'reading') {
      setIsEditingOnRightPage(false);
    } else if (activeSection === 'calendar') {
      setLeftPageMode('calendar');
      setMobileView('left-page');
    } else if (activeSection === 'collections') {
      setLeftPageMode('collections');
      setMobileView('left-page');
    } else if (activeSection === 'collection-detail') {
      setLeftPageMode('collection-entries');
      setMobileView('left-page');
    } else if (activeSection === 'trash') {
      setLeftPageMode('trash');
      setMobileView('left-page');
    } else if (activeSection === 'settings') {
      setLeftPageMode('settings');
      setMobileView('left-page');
    } else if (activeSection === 'poems') {
      setLeftPageMode('list');
      setTypeDropdown('poem');
    } else if (activeSection === 'quotes') {
      setLeftPageMode('list');
      setTypeDropdown('quote');
    } else if (activeSection === 'fragments') {
      setLeftPageMode('list');
      setTypeDropdown('fragment');
    }
  }

  const collectionsMap = useMemo(
    () => Object.fromEntries(collections.map((c) => [c.id, c])),
    [collections]
  );

  // Active non-trashed, non-archived entries
  const activeEntries = useMemo(
    () => entries.filter((e) => !e.isTrashed && e.status !== 'archived'),
    [entries]
  );

  // 100% Real Category Counts in Bangla Digits
  const categoryStats = useMemo(() => {
    const poemsCount = activeEntries.filter((e) => e.type === 'poem').length;
    const quotesCount = activeEntries.filter((e) => e.type === 'quote').length;
    const diaryCount = activeEntries.filter((e) => e.type === 'diary').length;
    const fragmentsCount = activeEntries.filter(
      (e) => e.type === 'fragment' || e.type === 'prose'
    ).length;
    return [
      {
        type: 'poem' as const,
        label: 'Poems',
        labelBn: 'কবিতা',
        count: poemsCount,
        countBn: toBanglaDigits(poemsCount),
        icon: Feather,
      },
      {
        type: 'quote' as const,
        label: 'Quotes',
        labelBn: 'উদ্ধৃতি',
        count: quotesCount,
        countBn: toBanglaDigits(quotesCount),
        icon: Quote,
      },
      {
        type: 'diary' as const,
        label: 'Diary',
        labelBn: 'দিনলিপি',
        count: diaryCount,
        countBn: toBanglaDigits(diaryCount),
        icon: BookOpen,
      },
      {
        type: 'fragment' as const,
        label: 'Fragments',
        labelBn: 'টুকরো ভাবনা',
        count: fragmentsCount,
        countBn: toBanglaDigits(fragmentsCount),
        icon: Layers,
      },
    ];
  }, [activeEntries]);

  // 100% Real Collection Counts in Bangla Digits
  const collectionsWithCounts = useMemo(() => {
    return collections.map((col) => {
      const realCount = activeEntries.filter((e) => e.collectionId === col.id).length;
      return {
        ...col,
        realCount,
        countBn: toBanglaDigits(realCount),
      };
    });
  }, [collections, activeEntries]);

  // Filtered entries for the current Left Page list context
  const bookIndexEntries = useMemo(() => {
    if (leftPageMode === 'trash') {
      return filterAndSortEntries(entries, {
        query: globalSearchQuery,
        onlyTrashed: true,
        sortBy: 'updated-desc',
        collectionsMap,
      });
    }
    const isFavoritesView = activeSection === 'favorites';
    const isArchiveView = activeSection === 'archive';
    const isCollectionDetail =
      leftPageMode === 'collection-entries' && Boolean(activeCollectionId);

    return filterAndSortEntries(entries, {
      query: globalSearchQuery,
      type: typeDropdown,
      tag: activeTagFilter || undefined,
      onlyFavorites: isFavoritesView,
      onlyArchived: isArchiveView,
      collectionId: isCollectionDetail ? activeCollectionId || undefined : undefined,
      sortBy,
      collectionsMap,
    });
  }, [
    entries,
    leftPageMode,
    activeSection,
    activeCollectionId,
    globalSearchQuery,
    typeDropdown,
    activeTagFilter,
    sortBy,
    collectionsMap,
  ]);

  // Currently open entry on the Right Page
  const selectedEntry = useMemo(() => {
    if (activeEntryId) {
      const found = entries.find((e) => e.id === activeEntryId);
      if (found && (!found.isTrashed || leftPageMode === 'trash')) return found;
    }
    if (bookIndexEntries.length > 0) {
      return bookIndexEntries[0];
    }
    return activeEntries[0] || null;
  }, [entries, activeEntryId, bookIndexEntries, activeEntries, leftPageMode]);

  // Effective Page Variation of the currently open entry
  const activePageVariation: PageVariation = useMemo(() => {
    if (!selectedEntry) return 'vintage-parchment';
    return resolveEffectivePageVariation(
      selectedEntry.type,
      selectedEntry.pageVariation,
      settings.defaultPageVariation
    );
  }, [selectedEntry, settings.defaultPageVariation]);

  // Current page index for sequential book page-turning
  const currentEntryPageIndex = useMemo(() => {
    if (!selectedEntry || bookIndexEntries.length === 0) return -1;
    return bookIndexEntries.findIndex((e) => e.id === selectedEntry.id);
  }, [selectedEntry, bookIndexEntries]);

  const trigger3DPageFlip = (direction: 'prev' | 'next' = 'next') => {
    playPageTurn(direction);
    setPageTurnAnim({ key: Date.now(), direction });
  };

  const handleTurnPage = (direction: 'prev' | 'next') => {
    if (bookIndexEntries.length === 0) return;
    const idx = currentEntryPageIndex >= 0 ? currentEntryPageIndex : 0;
    const nextIdx =
      direction === 'prev'
        ? Math.max(0, idx - 1)
        : Math.min(bookIndexEntries.length - 1, idx + 1);
    const target = bookIndexEntries[nextIdx];
    if (target) {
      trigger3DPageFlip(direction);
      openEntryForReading(target.id);
      setIsEditingOnRightPage(false);
      setMobileView('right-page');
    }
  };

  // Real Calendar Dates with Entries
  const datesWithEntriesMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of activeEntries) {
      map.set(e.entryDate, (map.get(e.entryDate) || 0) + 1);
    }
    return map;
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
    return activeEntries.filter((e) => e.entryDate === selectedCalendarDate);
  }, [activeEntries, selectedCalendarDate]);

  // Write/edit/delete are gated on the signed-in owner account (isAdmin)
  const handleStartNewEntry = (options?: {
    type?: EntryType;
    entryDate?: string;
    collectionId?: string;
    pageVariation?: PageVariation;
    initialTitle?: string;
    initialSubtitle?: string;
    initialContent?: string;
    attribution?: string;
    mood?: EntryMood;
    tags?: string[];
  }) => {
    if (!isAdmin) {
      setAdminLoginModalOpen(true);
      return;
    }
    trigger3DPageFlip('next');
    const defaultType =
      options?.type ||
      (typeDropdown !== 'all' ? typeDropdown : settings.defaultEntryType);
    const defaultCol =
      options?.collectionId !== undefined
        ? options.collectionId
        : leftPageMode === 'collection-entries' && activeCollectionId
        ? activeCollectionId
        : '';
    const defaultDate =
      options?.entryDate ||
      (leftPageMode === 'calendar' && selectedCalendarDate
        ? selectedCalendarDate
        : getLocalTodayDateString());

    // Ensure the Left Page index filter does not hide the newly created entry
    if (typeDropdown !== 'all' && typeDropdown !== defaultType) {
      setTypeDropdown('all');
    }
    if (activeTagFilter) {
      setActiveTagFilter('');
    }
    if (globalSearchQuery) {
      setGlobalSearchQuery('');
    }
    if (leftPageMode === 'overview' || leftPageMode === 'trash') {
      setLeftPageMode('list');
    }

    createNewEntry({
      type: defaultType,
      entryDate: defaultDate,
      collectionId: defaultCol,
      pageVariation: options?.pageVariation,
      initialTitle: options?.initialTitle,
      initialSubtitle: options?.initialSubtitle,
      initialContent: options?.initialContent,
      attribution: options?.attribution,
      mood: options?.mood,
      tags: options?.tags,
    });
    setIsEditingOnRightPage(true);
    setMobileView('right-page');
    setTimeout(() => {
      editorTitleRef.current?.focus();
    }, 60);
  };

  const handleApplyTemplate = (
    tpl: JournalTemplate,
    mode: 'new' | 'current' = 'new'
  ) => {
    if (!isAdmin) {
      setAdminLoginModalOpen(true);
      return;
    }

    if (mode === 'current' && selectedEntry) {
      trigger3DPageFlip('next');
      const mergedTags = Array.from(
        new Set([...selectedEntry.tags, ...(tpl.tags || [])])
      ).slice(0, 10);
      const isCurrentBlank =
        !selectedEntry.content.trim() && !selectedEntry.title.trim();

      updateEntry(
        selectedEntry.id,
        {
          type: tpl.type,
          pageVariation: tpl.pageVariation,
          mood: tpl.mood || selectedEntry.mood,
          collectionId: tpl.collectionId || selectedEntry.collectionId,
          attribution: tpl.defaultAttribution ?? selectedEntry.attribution,
          tags: mergedTags,
          title: isCurrentBlank ? tpl.defaultTitle : selectedEntry.title,
          subtitle:
            isCurrentBlank || !selectedEntry.subtitle
              ? tpl.defaultSubtitle
              : selectedEntry.subtitle,
          content: isCurrentBlank
            ? tpl.defaultContent
            : `${selectedEntry.content}\n\n${tpl.defaultContent}`,
        },
        true
      );
      setIsEditingOnRightPage(true);
      setMobileView('right-page');
      return;
    }

    // Mode === 'new': Reset filters so the newly created template page is immediately visible at top of index
    setTypeDropdown('all');
    setActiveTagFilter('');
    setGlobalSearchQuery('');
    setLeftPageMode('list');

    handleStartNewEntry({
      type: tpl.type,
      collectionId: tpl.collectionId,
      pageVariation: tpl.pageVariation,
      initialTitle: tpl.defaultTitle,
      initialSubtitle: tpl.defaultSubtitle,
      initialContent: tpl.defaultContent,
      attribution: tpl.defaultAttribution,
      mood: tpl.mood,
      tags: tpl.tags,
    });
  };

  const handleSelectBlankVariation = (
    variation: PageVariation,
    mode: 'new' | 'current' = 'new'
  ) => {
    if (!isAdmin) {
      setAdminLoginModalOpen(true);
      return;
    }
    if (mode === 'current' && selectedEntry) {
      trigger3DPageFlip('next');
      updateEntry(selectedEntry.id, { pageVariation: variation }, true);
      setMobileView('right-page');
      return;
    }
    handleStartNewEntry({ pageVariation: variation });
  };

  const handleSelectEntryFromList = (entryId: string, openInEditor = false) => {
    if (selectedEntry?.id !== entryId) {
      trigger3DPageFlip('next');
    }
    setUnlockAttemptInput('');
    setUnlockErrorMsg('');
    openEntryForReading(entryId);
    if (openInEditor) {
      if (isAdmin) {
        setIsEditingOnRightPage(true);
      } else {
        setIsEditingOnRightPage(false);
        setAdminLoginModalOpen(true);
      }
    } else {
      setIsEditingOnRightPage(false);
    }
    setMoreMenuOpen(false);
    setMobileView('right-page');
  };

  const handleOpenEntryLockModal = () => {
    if (!selectedEntry) return;
    if (!isAdmin) {
      setAdminLoginModalOpen(true);
      return;
    }
    // The passphrase is never readable back, so the draft always starts empty.
    setEntryLockPasswordDraft('');
    setEntryLockHintDraft(selectedEntry.lockHint || '');
    setEntryLockModalOpen(true);
  };

  const handleSaveEntryPasswordLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry || !isAdmin) return;
    const cleanPass = entryLockPasswordDraft.trim();
    if (!cleanPass) {
      await setEntryPasswordLock(selectedEntry.id, false, '', '');
    } else {
      await setEntryPasswordLock(
        selectedEntry.id,
        true,
        cleanPass,
        entryLockHintDraft.trim()
      );
    }
    playBrassClick();
    setEntryLockModalOpen(false);
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;
    const ok = await unlockEntryWithPassword(selectedEntry.id, unlockAttemptInput);
    if (ok) {
      playPageTurn('next');
      setUnlockAttemptInput('');
      setUnlockErrorMsg('');
    } else {
      setUnlockErrorMsg('পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন। (Incorrect password)');
    }
  };

  const handleCopyContent = async () => {
    if (!selectedEntry) return;
    try {
      await navigator.clipboard.writeText(selectedEntry.content);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch {
      // Ignore clipboard errors in restricted frames
    }
  };

  const handleTrashCurrentEntry = (entryId: string, title: string) => {
    if (!isAdmin) {
      setAdminLoginModalOpen(true);
      return;
    }
    moveToTrash(entryId);
    setIsEditingOnRightPage(false);
    setMoreMenuOpen(false);
    setTrashedUndoEntry({ id: entryId, title: title || 'Untitled entry' });
    setTimeout(() => {
      setTrashedUndoEntry((prev) => (prev?.id === entryId ? null : prev));
    }, 6000);
  };

  const handleDuplicateEntry = () => {
    if (!selectedEntry) return;
    if (!isAdmin) {
      setAdminLoginModalOpen(true);
      return;
    }
    handleStartNewEntry({
      type: selectedEntry.type,
      collectionId: selectedEntry.collectionId,
      pageVariation: selectedEntry.pageVariation,
      initialTitle: `${selectedEntry.title} (প্রতিলিপি)`,
      initialSubtitle: selectedEntry.subtitle,
      initialContent: selectedEntry.content,
      attribution: selectedEntry.attribution,
      mood: selectedEntry.mood,
      tags: selectedEntry.tags,
    });
    setMoreMenuOpen(false);
  };

  const handleAddTagToSelected = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry || !isAdmin) return;
    const cleaned = newTagInput.trim().replace(/^#/, '');
    if (!cleaned) return;
    if (!selectedEntry.tags.includes(cleaned) && selectedEntry.tags.length < 10) {
      playInkStamp();
      updateEntry(selectedEntry.id, { tags: [...selectedEntry.tags, cleaned] }, true);
    }
    setNewTagInput('');
    setInlineTagAdderOpen(false);
  };

  const handleRemoveTagFromSelected = (tagToRemove: string) => {
    if (!selectedEntry || !isAdmin) return;
    updateEntry(
      selectedEntry.id,
      { tags: selectedEntry.tags.filter((t) => t !== tagToRemove) },
      true
    );
  };

  const insertTextAtCursor = (snippet: string) => {
    if (!selectedEntry || !isAdmin) return;
    playPenScratch();
    const textarea = editorTextareaRef.current;
    if (!textarea) {
      updateEntry(selectedEntry.id, { content: `${selectedEntry.content}${snippet}` });
      return;
    }
    const start = textarea.selectionStart ?? selectedEntry.content.length;
    const end = textarea.selectionEnd ?? selectedEntry.content.length;
    const nextContent =
      selectedEntry.content.slice(0, start) +
      snippet +
      selectedEntry.content.slice(end);
    updateEntry(selectedEntry.id, { content: nextContent });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 20);
  };

  const handleCreateNewCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setAdminLoginModalOpen(true);
      return;
    }
    if (!newColName.trim()) return;
    playInkStamp();
    const col = createCollection(newColName.trim(), newColDesc.trim(), newColAccent);
    setNewColName('');
    setNewColDesc('');
    setNewCollectionModalOpen(false);
    if (isEditingOnRightPage && selectedEntry) {
      updateEntry(selectedEntry.id, { collectionId: col.id }, true);
    }
  };

  const fontScript = selectedEntry
    ? resolveContentFontScript(
        selectedEntry.fontPreference,
        selectedEntry.language,
        settings.defaultFont
      )
    : 'bn';

  const selectedCollection = selectedEntry?.collectionId
    ? collectionsMap[selectedEntry.collectionId]
    : undefined;

  const activeCollectionObj = activeCollectionId
    ? collectionsMap[activeCollectionId]
    : undefined;

  const trashedCount = useMemo(
    () => entries.filter((e) => e.isTrashed).length,
    [entries]
  );

  const isDarkTheme = settings.theme === 'dark';
  const isNocturnalPage =
    activePageVariation === 'nocturnal-vellum' || isDarkTheme;

  const activeDeskBg = useMemo(
    () => getDeskBackground(deskBackground),
    [deskBackground]
  );

  const activeWritingStyleId: WritingStyleId = useMemo(() => {
    const override = selectedEntry?.appearanceOverride?.writingStyle as
      | WritingStyleId
      | undefined;
    return override || defaultWritingStyle;
  }, [selectedEntry, defaultWritingStyle]);

  const activeInkColorId: InkColorId = useMemo(() => {
    const override = selectedEntry?.appearanceOverride?.inkColor as
      | InkColorId
      | undefined;
    return override || defaultInkColor;
  }, [selectedEntry, defaultInkColor]);

  const activeWritingStyle = useMemo(
    () => getWritingStylePreset(activeWritingStyleId),
    [activeWritingStyleId]
  );

  const activeInkPreset = useMemo(
    () => getInkColorPreset(activeInkColorId),
    [activeInkColorId]
  );

  const resolvedManuscriptInkColor = isNocturnalPage
    ? activeInkPreset.darkColorHex
    : activeInkPreset.lightColorHex;

  const handleChangeDeskBackground = (bgId: DeskBackgroundId) => {
    playBrassClick();
    setDeskBackground(bgId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DESK_BG_STORAGE_KEY, bgId);
    }
    const bgMeta = getDeskBackground(bgId);
    if (bgMeta) {
      setDefaultInkColor(bgMeta.recommendedInkId);
      setDefaultWritingStyle(bgMeta.recommendedWritingStyleId);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DEFAULT_INK_COLOR_KEY, bgMeta.recommendedInkId);
        window.localStorage.setItem(DEFAULT_WRITING_STYLE_KEY, bgMeta.recommendedWritingStyleId);
      }
    }
  };

  const handleChangeWritingStyle = (styleId: WritingStyleId) => {
    playBrassClick();
    setDefaultWritingStyle(styleId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEFAULT_WRITING_STYLE_KEY, styleId);
    }
    if (selectedEntry && isAdmin) {
      updateEntry(
        selectedEntry.id,
        {
          appearanceOverride: {
            ...(selectedEntry.appearanceOverride || {}),
            writingStyle: styleId,
            inkColor: activeInkColorId,
          },
        },
        true
      );
    }
  };

  const handleChangeInkColor = (inkId: InkColorId) => {
    playInkStamp();
    setDefaultInkColor(inkId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEFAULT_INK_COLOR_KEY, inkId);
    }
    if (selectedEntry && isAdmin) {
      updateEntry(
        selectedEntry.id,
        {
          appearanceOverride: {
            ...(selectedEntry.appearanceOverride || {}),
            writingStyle: activeWritingStyleId,
            inkColor: inkId,
          },
        },
        true
      );
    }
  };

  // Mark current reading/writing place so user can start from here next time they open the book
  const handleMarkReadingPlace = () => {
    if (!selectedEntry) return;
    playRibbonSlide();
    const scrollEl = isEditingOnRightPage
      ? editorTextareaRef.current
      : manuscriptScrollRef.current;
    const currentScrollTop = scrollEl ? Math.round(scrollEl.scrollTop) : 0;
    const maxScroll = scrollEl
      ? Math.max(1, scrollEl.scrollHeight - scrollEl.clientHeight)
      : 1;
    const pct = scrollEl
      ? Math.min(100, Math.max(0, Math.round((currentScrollTop / maxScroll) * 100)))
      : 0;
    const cursorOffset =
      isEditingOnRightPage && editorTextareaRef.current
        ? editorTextareaRef.current.selectionStart || 0
        : 0;

    const cleanLines = selectedEntry.content
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const approxLineIdx =
      cleanLines.length > 0
        ? Math.min(
            cleanLines.length - 1,
            Math.floor((pct / 100) * cleanLines.length)
          )
        : 0;
    const excerpt =
      cleanLines[approxLineIdx]?.slice(0, 65) ||
      getSingleLinePreview(selectedEntry.content, 65) ||
      selectedEntry.title ||
      'চিহ্নিত পাতা';

    const bookmark: ReadingBookmark = {
      entryId: selectedEntry.id,
      entryTitle: selectedEntry.title || `Untitled ${selectedEntry.type}`,
      entryDate: selectedEntry.entryDate,
      scrollTop: currentScrollTop,
      scrollProgress: pct,
      cursorOffset,
      excerpt,
      updatedAtIso: new Date().toISOString(),
      isEditing: isEditingOnRightPage,
    };

    setReadingBookmark(bookmark);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(READING_BOOKMARK_KEY, JSON.stringify(bookmark));
      window.localStorage.setItem(LAST_SESSION_PLACE_KEY, JSON.stringify(bookmark));
    }
    setBookmarkToast(
      `🔖 রেশমি ফিতা রাখা হয়েছে: “${bookmark.entryTitle}” (${toBanglaDigits(pct)}%)`
    );
    setTimeout(() => setBookmarkToast(''), 3400);
  };

  const handleClearReadingPlace = () => {
    playBrassClick();
    setReadingBookmark(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(READING_BOOKMARK_KEY);
    }
  };

  const handleResumeReadingPlace = (targetBookmark?: ReadingBookmark | null) => {
    const bm = targetBookmark || readingBookmark;
    if (!bm) return;
    const found = entries.find((e) => e.id === bm.entryId && !e.isTrashed);
    if (!found) return;

    playRibbonSlide();
    if (selectedEntry?.id !== found.id) {
      trigger3DPageFlip('next');
      openEntryForReading(found.id);
    }
    if (bm.isEditing && isAdmin) {
      setIsEditingOnRightPage(true);
    } else {
      setIsEditingOnRightPage(false);
    }
    setMobileView('right-page');
    const desiredTop = bm.scrollTop || 0;
    pendingScrollRestoreRef.current = desiredTop;

    const applySavedScroll = () => {
      const targetEl =
        bm.isEditing && isAdmin
          ? editorTextareaRef.current
          : manuscriptScrollRef.current;
      if (targetEl) {
        targetEl.scrollTop = desiredTop;
      }
    };
    setTimeout(applySavedScroll, 60);
    setTimeout(() => {
      applySavedScroll();
      pendingScrollRestoreRef.current = null;
    }, 200);
  };

  const attachManuscriptScrollRef = (node: HTMLDivElement | null) => {
    manuscriptScrollRef.current = node;
    if (
      node &&
      pendingScrollRestoreRef.current !== null &&
      pendingScrollRestoreRef.current > 0
    ) {
      node.scrollTop = pendingScrollRestoreRef.current;
    }
  };

  // Auto-restore marked reading place (or last session place) when opening the book
  useEffect(() => {
    if (hasRestoredInitialPlaceRef.current || entries.length === 0) return;
    if (typeof window === 'undefined') return;

    try {
      const explicitRaw = window.localStorage.getItem(READING_BOOKMARK_KEY);
      const sessionRaw = window.localStorage.getItem(LAST_SESSION_PLACE_KEY);
      const target: ReadingBookmark | null = explicitRaw
        ? JSON.parse(explicitRaw)
        : sessionRaw
        ? JSON.parse(sessionRaw)
        : null;
      if (!target || !target.entryId) {
        hasRestoredInitialPlaceRef.current = true;
        return;
      }

      const exists = entries.find((e) => e.id === target.entryId && !e.isTrashed);
      if (!exists) return;

      hasRestoredInitialPlaceRef.current = true;
      openEntryForReading(exists.id);
      const desiredTop = target.scrollTop || 0;
      pendingScrollRestoreRef.current = desiredTop;

      const applyInitialScroll = () => {
        if (target.isEditing && isAdmin) {
          setIsEditingOnRightPage(true);
        }
        const el =
          target.isEditing && isAdmin
            ? editorTextareaRef.current
            : manuscriptScrollRef.current;
        if (el) {
          el.scrollTop = desiredTop;
          const max = Math.max(1, el.scrollHeight - el.clientHeight);
          const pct =
            el.scrollHeight <= el.clientHeight + 4
              ? 100
              : Math.min(100, Math.max(0, Math.round((desiredTop / max) * 100)));
          setScrollProgress(pct);
        }
      };

      setTimeout(applyInitialScroll, 40);
      setTimeout(applyInitialScroll, 140);
      setTimeout(applyInitialScroll, 280);
      setTimeout(() => {
        applyInitialScroll();
        pendingScrollRestoreRef.current = null;
      }, 480);
    } catch {
      // Ignore malformed storage
    }
  }, [entries, isAdmin, openEntryForReading]);

  // Track manuscript scroll progress and auto-save last session position
  const handleManuscriptScroll = (
    e: React.UIEvent<HTMLDivElement | HTMLTextAreaElement>
  ) => {
    const el = e.currentTarget;
    if (
      pendingScrollRestoreRef.current !== null &&
      pendingScrollRestoreRef.current > 0 &&
      el.scrollTop < pendingScrollRestoreRef.current
    ) {
      el.scrollTop = pendingScrollRestoreRef.current;
    }
    const top = Math.round(el.scrollTop);
    const max = Math.max(1, el.scrollHeight - el.clientHeight);
    const pct =
      el.scrollHeight <= el.clientHeight + 4
        ? 100
        : Math.min(100, Math.max(0, Math.round((top / max) * 100)));
    setScrollProgress(pct);

    if (selectedEntry && typeof window !== 'undefined') {
      try {
        const sessionSnap: ReadingBookmark = {
          entryId: selectedEntry.id,
          entryTitle: selectedEntry.title || `Untitled ${selectedEntry.type}`,
          entryDate: selectedEntry.entryDate,
          scrollTop: top,
          scrollProgress: pct,
          cursorOffset: 0,
          excerpt: getSingleLinePreview(selectedEntry.content, 55),
          updatedAtIso: new Date().toISOString(),
          isEditing: isEditingOnRightPage,
        };
        window.localStorage.setItem(
          LAST_SESSION_PLACE_KEY,
          JSON.stringify(sessionSnap)
        );
      } catch {
        // Ignore quota errors
      }
    }
  };

  // Compute physical surface styling for all 10 Page Variations on the Right Page (optimized for both Light & Dark Mode)
  const rightPageSurfaceStyle = useMemo((): React.CSSProperties => {
    if (activePageVariation === 'nocturnal-vellum') {
      return {
        background:
          'radial-gradient(circle at 80% 18%, #2B221B 0%, #1C1612 65%, #14100D 100%)',
        color: '#F2E3CC',
      };
    }
    if (activePageVariation === 'ruled-notebook') {
      return {
        backgroundImage: isDarkTheme
          ? 'repeating-linear-gradient(to bottom, transparent 0px, transparent 34px, rgba(216, 166, 104, 0.16) 35px)'
          : 'repeating-linear-gradient(to bottom, transparent 0px, transparent 34px, rgba(164, 134, 98, 0.28) 35px)',
        backgroundPosition: '0 92px',
      };
    }
    if (activePageVariation === 'dot-commonplace') {
      return {
        backgroundImage: isDarkTheme
          ? 'radial-gradient(rgba(216, 166, 104, 0.24) 1.15px, transparent 1.15px)'
          : 'radial-gradient(rgba(138, 110, 78, 0.35) 1.15px, transparent 1.15px)',
        backgroundSize: '20px 20px',
      };
    }
    if (activePageVariation === 'botanical-herbarium') {
      return {
        background: isDarkTheme
          ? 'radial-gradient(circle at 88% 12%, rgba(56, 78, 52, 0.32) 0%, rgba(28, 34, 26, 0.92) 70%)'
          : 'radial-gradient(circle at 88% 12%, #E5EFE0 0%, #F4F7EF 58%, #EBF1E4 100%)',
      };
    }
    if (activePageVariation === 'royal-illuminated') {
      return {
        background: isDarkTheme
          ? 'radial-gradient(circle at 50% 15%, #2D2118 0%, #1E1610 75%)'
          : 'radial-gradient(circle at 50% 12%, #FFFDF7 0%, #F9EFE0 68%, #F2E2C9 100%)',
      };
    }
    if (activePageVariation === 'deckle-handmade') {
      return {
        backgroundColor: isDarkTheme ? '#25201A' : '#EFE2CE',
        backgroundImage: isDarkTheme
          ? 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(216,166,104,0.04) 3px, rgba(216,166,104,0.04) 4px), repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(216,166,104,0.03) 5px, rgba(216,166,104,0.03) 6px)'
          : 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(110,78,46,0.045) 3px, rgba(110,78,46,0.045) 4px), repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(110,78,46,0.03) 5px, rgba(110,78,46,0.03) 6px)',
      };
    }
    if (activePageVariation === 'ledger-chronicle') {
      return {
        backgroundColor: isDarkTheme ? '#211E1A' : '#F8F2E4',
        backgroundImage: isDarkTheme
          ? 'linear-gradient(90deg, transparent 52px, rgba(196, 109, 94, 0.32) 52px, rgba(196, 109, 94, 0.32) 53.5px, transparent 53.5px), repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, rgba(140, 175, 195, 0.14) 32px)'
          : 'linear-gradient(90deg, transparent 52px, rgba(196, 90, 78, 0.38) 52px, rgba(196, 90, 78, 0.38) 53.5px, transparent 53.5px), repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, rgba(112, 148, 172, 0.24) 32px)',
      };
    }
    return {};
  }, [activePageVariation, isDarkTheme]);

  const readingMetrics = useMemo(() => {
    if (!selectedEntry) return { words: 0, lines: 0, readMinsBn: '১' };
    const words = countWords(selectedEntry.content);
    const lines = selectedEntry.content
      ? selectedEntry.content.split('\n').filter((l) => l.trim().length > 0).length
      : 0;
    const mins = Math.max(1, Math.ceil(words / 130));
    return {
      words,
      lines,
      readMinsBn: toBanglaDigits(mins),
    };
  }, [selectedEntry]);

  // Navigation helper shared by Desktop Sidebar and Mobile Drawer
  const selectNavMode = (
    mode: LeftPageMode,
    navSection: typeof activeSection,
    filter: EntryType | 'all' = 'all'
  ) => {
    playRibbonSlide();
    setTypeDropdown(filter);
    setActiveTagFilter('');
    setLeftPageMode(mode);
    navigateTo(navSection);
    setMobileView('left-page');
    setMobileDrawerOpen(false);
    setUnlockAttemptInput('');
    setUnlockErrorMsg('');

    if (navSection === 'favorites') {
      const firstFav = activeEntries.find((e) => e.isFavorite);
      if (firstFav) {
        openEntryForReading(firstFav.id);
        setIsEditingOnRightPage(false);
      }
    } else if (navSection === 'archive') {
      const firstArchived = entries.find(
        (e) => !e.isTrashed && e.status === 'archived'
      );
      if (firstArchived) {
        openEntryForReading(firstArchived.id);
        setIsEditingOnRightPage(false);
      }
    } else if (filter !== 'all') {
      const firstMatch = activeEntries.find((e) =>
        filter === 'fragment'
          ? e.type === 'fragment' || e.type === 'prose'
          : e.type === filter
      );
      if (firstMatch) {
        openEntryForReading(firstMatch.id);
        setIsEditingOnRightPage(false);
      }
    }
  };

  // Closed Hand-Tooled Leather Book Cover View (100% self-contained on the cover)
  if (isBookClosed) {
    return (
      <ClosedLeatherBookCover
        onOpenBook={() => {
          playBookOpen();
          setIsBookClosed(false);
          trigger3DPageFlip('next');
        }}
        readingBookmark={readingBookmark}
        onResumeBookmark={() => {
          if (readingBookmark) {
            playBookOpen();
            setIsBookClosed(false);
            handleResumeReadingPlace(readingBookmark);
          }
        }}
        bookThemeNameBn={activeDeskBg.nameBn}
        coverBackgroundCss={activeDeskBg.backgroundCss}
        coverBorderHex={activeDeskBg.accentHex}
        ribbonGradient={activeDeskBg.ribbonGradient}
        ribbonBorder={activeDeskBg.ribbonBorder}
        totalEntries={activeEntries.length}
        poemsCount={categoryStats[0].count}
        collectionsCount={collections.length}
        favoritesCount={activeEntries.filter((e) => e.isFavorite).length}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
    );
  }

  return (
    <section
      aria-label="Open Leather Journal Workspace"
      className="relative w-full max-w-[1440px] mx-auto pb-16 lg:pb-4 px-1.5 sm:px-4"
    >
      {/* ========================================================================
          OUTER STITCHED LEATHER BOOK COVER (With Brass Corners, Spine Hubs & Book Theme)
          Everything in the application — including all theme colors — lives strictly inside this physical book binding.
         ======================================================================== */}
      <motion.div
        data-testid="writers-desk-backdrop"
        data-desk-id={deskBackground}
        initial={{ opacity: 0.92, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          background: activeDeskBg.backgroundCss,
          borderColor: activeDeskBg.accentHex,
        }}
        className="relative rounded-[22px] p-2 sm:p-3.5 lg:p-4 shadow-[0_32px_80px_rgba(12,6,2,0.72),inset_0_1px_1px_rgba(255,225,190,0.22)] border-2 overflow-hidden transition-all duration-500"
      >
        {/* 4 Antique Brass Corner Filigree Protectors on Outer Leather Binding */}
        <BrassCornerOrnament position="tl" className="w-7 h-7 top-2 left-2" />
        <BrassCornerOrnament position="tr" className="w-7 h-7 top-2 right-2" />
        <BrassCornerOrnament position="bl" className="w-7 h-7 bottom-2 left-2" />
        <BrassCornerOrnament position="br" className="w-7 h-7 bottom-2 right-2" />

        {/* 5 Raised 3D Stitched Spine Cord Hubs along the Left Leather Hinge */}
        <SpineCordHubs />

        {/* Portal target for every dialog: they are laid into the spread, not over the desk. */}
        <div id={BOOK_DIALOG_ROOT_ID} />

        {/* ========================================================================
            MOBILE TOP BAR (< lg): Custom Stitched Leather & Brass Header Inside Book
           ======================================================================== */}
        <div className="flex lg:hidden items-center justify-between px-3 py-2 mb-2 rounded-[10px] bg-gradient-to-r from-[#2D1D13] via-[#24160E] to-[#2D1D13] text-[#F5E9D7] border border-[#6E4E35] shadow-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open journal navigation menu"
              className="p-1.5 rounded-[5px] bg-[#3D281A] text-[#D8A668] border border-[#8B6343]/50"
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => selectNavMode('overview', 'journal', 'all')}
              className="flex items-center gap-2 text-left"
            >
              <span className="text-base font-literary font-semibold tracking-tight text-[#F5E9D7]">
                VerseVault
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundEnabled ? 'Mute book sounds' : 'Enable book sounds'}
              title={soundEnabled ? 'Sound FX On' : 'Sound FX Muted'}
              className="p-1.5 rounded-[5px] bg-[#3D281A] text-[#D8A668] border border-[#8B6343]/40"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 opacity-60" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                playBookClose();
                setIsBookClosed(true);
              }}
              aria-label="Close leather book cover"
              className="px-2 py-1 rounded-[5px] bg-[#3D281A] text-[#E6CFAF] text-[11px] font-bangla border border-[#8B6343]/40 flex items-center gap-1"
            >
              <BookMarked className="w-3 h-3 text-[#D8A668]" />
              <span>প্রচ্ছদ</span>
            </button>
            <button
              type="button"
              onClick={() => handleStartNewEntry()}
              className="px-2.5 py-1 rounded-[5px] bg-gradient-to-b from-[#745138] to-[#563A26] text-[#FDF8F0] text-xs font-bangla font-medium border border-[#9E7755] flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>লিখুন</span>
            </button>
            <button
              type="button"
              onClick={() =>
                updateSettings({
                  theme: settings.theme === 'dark' ? 'light' : 'dark',
                })
              }
              aria-label="Toggle theme"
              className="p-1.5 rounded-[5px] bg-[#3D281A] text-[#D8A668] border border-[#8B6343]/40"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isAdmin) {
                  signOutOwner();
                } else {
                  setAdminLoginModalOpen(true);
                }
              }}
              aria-label={isAdmin ? 'Sign out admin' : 'Admin login'}
              title={isAdmin ? `${user?.email ?? 'মালিক'} (ক্লিক করে লগআউট)` : 'মালিক লগইন'}
              className="p-1.5 rounded-[5px] bg-[#3D281A] text-[#D8A668] border border-[#8B6343]/40"
            >
              {isAdmin ? (
                <ShieldCheck className="w-3.5 h-3.5 text-[#7EB865]" />
              ) : (
                <KeyRound className="w-3.5 h-3.5 text-[#D8A668]" />
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================
            MOBILE SLIDE-OVER LEATHER NAVIGATION DRAWER (< lg, Inside Book Cover)
           ======================================================================== */}
        {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
          className="absolute inset-0 z-50 lg:hidden flex rounded-[18px] overflow-hidden"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[82vw] h-full bg-gradient-to-b from-[#2E1E14] via-[#23150D] to-[#1A100A] border-r-2 border-[#6E4E35] p-4 flex flex-col justify-between text-[#E8D8C3] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#4E3422]">
                <div className="flex items-center gap-2.5">
                  <GoldenQuillEmblem className="w-9 h-9" />
                  <div>
                    <span className="block text-lg font-literary font-semibold text-[#F5E9D7]">
                      VerseVault
                    </span>
                    <span className="block text-[11px] text-[#B89F82]">
                      My Personal Diary
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close drawer"
                  className="p-1.5 rounded-lg text-[#CDB89E] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {isAdmin ? (
                  <div className="px-3 py-2 rounded-lg bg-[#3A2417] border border-[#7D5638] flex items-center justify-between text-xs mb-2">
                    <span className="flex items-center gap-1.5 text-[#EAD5BE] truncate">
                      <ShieldCheck className="w-4 h-4 text-[#7EB865] shrink-0" />
                      <span className="truncate">{user?.email ?? 'মালিক'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => signOutOwner()}
                      title="Sign out"
                      className="text-[#D8A668] hover:text-white p-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      setAdminLoginModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-[#3A2518]/90 border border-[#8B6343]/60 text-[#F3DEC3] mb-2"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-[#D8A668]" />
                      <span>মালিক লগইন</span>
                    </span>
                    <LogIn className="w-3.5 h-3.5 text-[#D8A668]" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    playBookClose();
                    setIsBookClosed(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm bg-[#3A2518]/80 border border-[#7E5A3C]/50 text-[#F3DEC3]"
                >
                  <span className="flex items-center gap-3">
                    <BookMarked className="w-4 h-4 text-[#D8A668]" />
                    <span className="font-bangla">প্রচ্ছদ দেখুন (Close Book Cover)</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectNavMode('overview', 'journal', 'all')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-[#3A2518]"
                >
                  <span className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-[#D8A668]" />
                    <span className="font-bangla">{bdGreeting.bangla} (নীড়)</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectNavMode('list', 'journal', 'all')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-[#3A2518]"
                >
                  <span className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-[#D8A668]" />
                    <span>All Diary Pages</span>
                  </span>
                  <span className="text-xs font-bangla text-[#B89F82]">
                    {toBanglaDigits(activeEntries.length)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectNavMode('list', 'poems', 'poem')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-[#3A2518]"
                >
                  <span className="flex items-center gap-3">
                    <Feather className="w-4 h-4 text-[#D8A668]" />
                    <span>Poems (কবিতা)</span>
                  </span>
                  <span className="text-xs font-bangla text-[#B89F82]">
                    {categoryStats[0].countBn}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectNavMode('list', 'quotes', 'quote')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-[#3A2518]"
                >
                  <span className="flex items-center gap-3">
                    <Quote className="w-4 h-4 text-[#D8A668]" />
                    <span>Quotes (উদ্ধৃতি)</span>
                  </span>
                  <span className="text-xs font-bangla text-[#B89F82]">
                    {categoryStats[1].countBn}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectNavMode('list', 'fragments', 'fragment')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-[#3A2518]"
                >
                  <span className="flex items-center gap-3">
                    <Layers className="w-4 h-4 text-[#D8A668]" />
                    <span>Fragments (টুকরো ভাবনা)</span>
                  </span>
                  <span className="text-xs font-bangla text-[#B89F82]">
                    {categoryStats[3].countBn}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectNavMode('collections', 'collections', 'all')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-[#3A2518]"
                >
                  <span className="flex items-center gap-3">
                    <Folder className="w-4 h-4 text-[#D8A668]" />
                    <span>Collections (সংকলন)</span>
                  </span>
                  <span className="text-xs font-bangla text-[#B89F82]">
                    {toBanglaDigits(collections.length)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectNavMode('calendar', 'calendar', 'all')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-[#3A2518]"
                >
                  <span className="flex items-center gap-3">
                    <CalendarIcon className="w-4 h-4 text-[#D8A668]" />
                    <span>Calendar (ক্যালেন্ডার)</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectNavMode('list', 'favorites', 'all')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-[#3A2518]"
                >
                  <span className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-[#D8A668]" />
                    <span>Favorites (প্রিয় পাতা)</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectNavMode('list', 'archive', 'all')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-[#3A2518]"
                >
                  <span className="flex items-center gap-3">
                    <Archive className="w-4 h-4 text-[#D8A668]" />
                    <span>Archive (আর্কাইভ)</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectNavMode('trash', 'trash', 'all')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-[#3A2518]"
                >
                  <span className="flex items-center gap-3">
                    <Trash2 className="w-4 h-4 text-[#D8A668]" />
                    <span>Trash (ট্র্যাশ)</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    setAskArchiveModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-[#3A2518]"
                >
                  <span className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-[#D8A668]" />
                    <span>Ask My Archive</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#8B6343]/30 text-[#E8CFAF]">
                    AI
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => selectNavMode('settings', 'settings', 'all')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-[#3A2518]"
                >
                  <span className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-[#D8A668]" />
                    <span>Settings &amp; Backup</span>
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#4E3422]">
              <LeatherMountainMoonArtwork />
            </div>
          </div>
        </div>
        )}

        {/* Inner Gold-Brown Stitched Leather Seam */}
        <div className="rounded-[16px] border border-dashed border-[#A67B54]/60 p-1 sm:p-2 flex flex-col lg:flex-row gap-0">
          {/* ====================================================================
              LEFT LEATHER FLAP SIDEBAR (Desktop lg+)
             ==================================================================== */}
          <aside
            aria-label="Journal Sections"
            style={{
              background: activeDeskBg.flapBackgroundCss,
              borderColor: activeDeskBg.flapBorderHex,
            }}
            className="hidden lg:flex lg:w-[238px] shrink-0 pl-4 pr-3.5 py-3 flex-col justify-between text-[#E8D8C3] select-none rounded-[12px] border transition-all duration-500 shadow-inner"
          >
            <div className="space-y-2.5">
              {/* Brand Lockup with Authentic Golden Feather Quill */}
              <div className="flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => selectNavMode('list', 'journal', 'all')}
                  className="flex items-center gap-2 text-left group focus:outline-none cursor-pointer min-w-0"
                >
                  <GoldenQuillEmblem className="w-8 h-8 shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="min-w-0">
                    <span className="block text-[18px] leading-tight font-literary font-semibold tracking-tight text-[#F5E9D7] truncate">
                      VerseVault
                    </span>
                    <span className="block text-[10.5px] text-[#B89F82] truncate">
                      My Personal Diary
                    </span>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={toggleSound}
                    aria-label={soundEnabled ? 'Mute book sounds' : 'Enable book sounds'}
                    title={
                      soundEnabled
                        ? 'পাতা উল্টানোর ধ্বনি চালু (Book Sound FX On)'
                        : 'ধ্বনি বন্ধ (Book Sound FX Muted)'
                    }
                    className="p-1.5 rounded-[5px] bg-[#382417] hover:bg-[#4B3120] text-[#D8A668] border border-[#8B6343]/60 transition-colors cursor-pointer"
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSettings({
                        theme: settings.theme === 'dark' ? 'light' : 'dark',
                      })
                    }
                    aria-label="Toggle parchment or nocturnal ink theme"
                    title={
                      settings.theme === 'dark'
                        ? 'Switch to Warm Parchment'
                        : 'Switch to Nocturnal Ink'
                    }
                    className="p-1.5 rounded-[5px] bg-[#382417] hover:bg-[#4B3120] text-[#D8A668] border border-[#8B6343]/60 transition-colors cursor-pointer"
                  >
                    {settings.theme === 'dark' ? (
                      <Sun className="w-3.5 h-3.5" />
                    ) : (
                      <Moon className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Brass Action Pair: Templates & Close Book Cover */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  data-testid="open-book-studio-btn"
                  onClick={() => setTemplateModalOpen(true)}
                  className="py-1.5 px-2.5 rounded-[6px] bg-gradient-to-b from-[#4E3523] to-[#382416] hover:from-[#5D402B] hover:to-[#452D1D] text-[#F5E4CC] border border-[#966D4B]/60 text-[11px] font-bangla font-medium flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#D8A668] shrink-0" />
                  <span>সাজসজ্জা ও টেমপ্লেট</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playBookClose();
                    setIsBookClosed(true);
                  }}
                  title="ডায়েরির চামড়ার প্রচ্ছদ বন্ধ করুন (View Closed Leather Book Cover)"
                  className="py-1.5 px-2.5 rounded-[6px] bg-gradient-to-b from-[#3E291A] to-[#2B1B10] hover:from-[#4E3422] hover:to-[#382416] text-[#E8CFAF] border border-[#845E3E]/60 text-[11px] font-bangla font-medium flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <BookMarked className="w-3 h-3 text-[#D8A668] shrink-0" />
                  <span>প্রচ্ছদ (Cover)</span>
                </button>
              </div>

              {/* Stitched Leather Book Theme Medallions (Inside Left Book Flap) */}
              <div className="px-2.5 py-1.5 rounded-[8px] bg-[#1A0F09]/55 border border-[#DFB578]/30 space-y-1">
                <div className="flex items-center justify-between text-[10.5px] font-bangla text-[#D8A668]">
                  <span>বইয়ের আবহ:</span>
                  <span className="text-[#E8D5BC] truncate max-w-[115px]">
                    {activeDeskBg.nameBn}
                  </span>
                </div>
                <p className="text-[9.5px] font-bangla text-[#C8B196]/80 leading-tight">
                  {activeDeskBg.conceptSubtitleBn}
                </p>
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  {DESK_BACKGROUNDS.map((bg) => {
                    const isActive = deskBackground === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => handleChangeDeskBackground(bg.id)}
                        data-testid={`desk-bg-pill-${bg.id}`}
                        title={`${bg.nameBn} (${bg.nameEn})`}
                        aria-label={`Select ${bg.nameEn} desk atmosphere`}
                        className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                          isActive
                            ? 'scale-125 ring-2 ring-[#DFB578] border-white'
                            : 'border-white/30 hover:scale-110 opacity-85 hover:opacity-100'
                        }`}
                        style={{ background: bg.accentHex }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Primary Literary Navigation & Compact Secondary Tools */}
              <nav aria-label="Diary Navigation" className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => selectNavMode('list', 'journal', 'all')}
                  className={`flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-[7px] text-xs sm:text-[13px] transition-all cursor-pointer ${
                    leftPageMode === 'list' &&
                    typeDropdown === 'all' &&
                    activeSection !== 'favorites' &&
                    activeSection !== 'archive'
                      ? 'bg-[#4E3422]/90 text-[#FFF8EE] font-medium border border-[#9E7551]/50'
                      : 'text-[#CDB89E] hover:text-[#FFF8EE] hover:bg-[#362317]/55'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#D8A668] shrink-0" />
                    <span>Diary (সব পাতা)</span>
                  </span>
                  <span className="text-[11px] font-bangla text-[#B89F82]">
                    {toBanglaDigits(activeEntries.length)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => selectNavMode('overview', 'journal', 'all')}
                  className={`flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-[7px] text-xs sm:text-[13px] transition-all cursor-pointer ${
                    leftPageMode === 'overview'
                      ? 'bg-[#4E3422]/90 text-[#FFF8EE] font-medium border border-[#9E7551]/50'
                      : 'text-[#CDB89E] hover:text-[#FFF8EE] hover:bg-[#362317]/55'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#D8A668] shrink-0" />
                    <span className="font-bangla">{bdGreeting.bangla} (হাব)</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => selectNavMode('list', 'poems', 'poem')}
                  className={`flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-[7px] text-xs sm:text-[13px] transition-all cursor-pointer ${
                    leftPageMode === 'list' && typeDropdown === 'poem'
                      ? 'bg-[#4E3422]/90 text-[#FFF8EE] font-medium border border-[#9E7551]/50'
                      : 'text-[#CDB89E] hover:text-[#FFF8EE] hover:bg-[#362317]/55'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Feather className="w-3.5 h-3.5 text-[#D8A668] shrink-0" />
                    <span>Poems (কবিতা)</span>
                  </span>
                  <span className="text-[11px] font-bangla text-[#B89F82]">
                    {categoryStats[0].countBn}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => selectNavMode('list', 'quotes', 'quote')}
                  className={`flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-[7px] text-xs sm:text-[13px] transition-all cursor-pointer ${
                    leftPageMode === 'list' && typeDropdown === 'quote'
                      ? 'bg-[#4E3422]/90 text-[#FFF8EE] font-medium border border-[#9E7551]/50'
                      : 'text-[#CDB89E] hover:text-[#FFF8EE] hover:bg-[#362317]/55'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Quote className="w-3.5 h-3.5 text-[#D8A668] shrink-0" />
                    <span>Quotes (উদ্ধৃতি)</span>
                  </span>
                  <span className="text-[11px] font-bangla text-[#B89F82]">
                    {categoryStats[1].countBn}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => selectNavMode('list', 'fragments', 'fragment')}
                  className={`flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-[7px] text-xs sm:text-[13px] transition-all cursor-pointer ${
                    leftPageMode === 'list' && typeDropdown === 'fragment'
                      ? 'bg-[#4E3422]/90 text-[#FFF8EE] font-medium border border-[#9E7551]/50'
                      : 'text-[#CDB89E] hover:text-[#FFF8EE] hover:bg-[#362317]/55'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Layers className="w-3.5 h-3.5 text-[#D8A668] shrink-0" />
                    <span>Fragments</span>
                  </span>
                  <span className="text-[11px] font-bangla text-[#B89F82]">
                    {categoryStats[3].countBn}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => selectNavMode('collections', 'collections', 'all')}
                  className={`flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-[7px] text-xs sm:text-[13px] transition-all cursor-pointer ${
                    leftPageMode === 'collections' || leftPageMode === 'collection-entries'
                      ? 'bg-[#4E3422]/90 text-[#FFF8EE] font-medium border border-[#9E7551]/50'
                      : 'text-[#CDB89E] hover:text-[#FFF8EE] hover:bg-[#362317]/55'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Folder className="w-3.5 h-3.5 text-[#D8A668] shrink-0" />
                    <span>Collections</span>
                  </span>
                  <span className="text-[11px] font-bangla text-[#B89F82]">
                    {toBanglaDigits(collections.length)}
                  </span>
                </button>

                {/* Compact 2x2 Grid for Secondary Tools (Calendar, Favorites, Archive, Ask Archive) */}
                <div className="grid grid-cols-2 gap-1 pt-2 mt-1.5 border-t border-[#4E3422]/50">
                  <button
                    type="button"
                    onClick={() => selectNavMode('calendar', 'calendar', 'all')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs transition-all cursor-pointer ${
                      leftPageMode === 'calendar'
                        ? 'bg-[#4E3422]/90 text-[#FFF8EE] font-medium border border-[#9E7551]/50'
                        : 'text-[#CDB89E] hover:text-[#FFF8EE] hover:bg-[#362317]/55'
                    }`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-[#D8A668] shrink-0" />
                    <span className="truncate">Calendar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectNavMode('list', 'favorites', 'all')}
                    className={`flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-[6px] text-xs transition-all cursor-pointer ${
                      leftPageMode === 'list' && activeSection === 'favorites'
                        ? 'bg-[#4E3422]/90 text-[#FFF8EE] font-medium border border-[#9E7551]/50'
                        : 'text-[#CDB89E] hover:text-[#FFF8EE] hover:bg-[#362317]/55'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Heart className="w-3.5 h-3.5 text-[#D8A668] shrink-0" />
                      <span className="truncate">Favorites</span>
                    </span>
                    <span className="text-[10px] font-bangla text-[#B89F82]">
                      {toBanglaDigits(activeEntries.filter((e) => e.isFavorite).length)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectNavMode('list', 'archive', 'all')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs transition-all cursor-pointer ${
                      leftPageMode === 'list' && activeSection === 'archive'
                        ? 'bg-[#4E3422]/90 text-[#FFF8EE] font-medium border border-[#9E7551]/50'
                        : 'text-[#CDB89E] hover:text-[#FFF8EE] hover:bg-[#362317]/55'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5 text-[#D8A668] shrink-0" />
                    <span className="truncate">Archive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAskArchiveModalOpen(true)}
                    title="Ask My Archive"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-xs text-[#CDB89E] hover:text-[#FFF8EE] hover:bg-[#362317]/55 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D8A668] shrink-0" />
                    <span className="truncate">Ask Archive</span>
                  </button>
                </div>
              </nav>
            </div>

            {/* Bottom Utility Controls & Embossed Mountain-Moon Leather Artwork */}
            <div className="pt-3 space-y-2 border-t border-[#4E3422]/60 mt-3">
              <div className="flex items-center justify-between px-2 text-xs text-[#B89F82]">
                <button
                  type="button"
                  onClick={() => selectNavMode('settings', 'settings', 'all')}
                  className={`inline-flex items-center gap-1.5 hover:text-[#FFF8EE] transition-colors cursor-pointer ${
                    leftPageMode === 'settings' ? 'text-[#FFF8EE] font-medium underline' : ''
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 text-[#D8A668]" />
                  <span>Settings &amp; Backup</span>
                </button>
                <button
                  type="button"
                  onClick={() => selectNavMode('trash', 'trash', 'all')}
                  aria-label="Open Trash"
                  className={`inline-flex items-center gap-1 hover:text-[#FFF8EE] transition-colors cursor-pointer ${
                    leftPageMode === 'trash' ? 'text-[#FFF8EE] font-medium underline' : ''
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Trash {trashedCount > 0 ? `(${toBanglaDigits(trashedCount)})` : ''}</span>
                </button>
              </div>

              <div className="px-2 space-y-1.5">
                {isAdmin ? (
                  <div className="p-2 rounded-lg bg-[#3A2417] border border-[#7D5638] flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-[#EAD5BE] truncate" title={user?.email ?? 'মালিক'}>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#7EB865] shrink-0" />
                      <span className="truncate">{user?.email ?? 'মালিক'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => signOutOwner()}
                      title="Sign out Admin"
                      className="text-[#D8A668] hover:text-white p-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdminLoginModalOpen(true)}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-[#3A2518] hover:bg-[#4E3220] border border-[#8B6343]/60 text-xs text-[#E8D8C3] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#D8A668]" />
                    <span>মালিক লগইন</span>
                  </button>
                )}
              </div>

              <LeatherMountainMoonArtwork />
            </div>
          </aside>

          {/* ====================================================================
              3D STACKED PARCHMENT BOOK BLOCK (Multi-Layer Page Edges + Spine Ribbon)
             ==================================================================== */}
          <div
            style={{ backgroundColor: activeDeskBg.paperEdgeGiltHex }}
            className="flex-1 min-w-0 relative rounded-[15px] p-[3px] sm:p-[6px] shadow-[inset_0_0_0_1px_rgba(65,42,22,0.55),0_12px_28px_rgba(12,6,2,0.45)] transition-colors duration-500"
          >
            {/* Second Stacked Page Layer (Simulated gilt deckled edges) */}
            <div className="rounded-[12px] bg-[#D6BFA0] dark:bg-[#3A3226] p-[3px] sm:p-[5px] border border-[#AE926F] dark:border-[#4C4436] shadow-inner">
              {/* Third Stacked Page Layer */}
              <div className="rounded-[10px] bg-[#E6D5BA] dark:bg-[#2E2820] p-[2px] sm:p-[4px] border border-[#C3A987] dark:border-[#443C30]">
                {/* Settings & Backup Full View */}
                {leftPageMode === 'settings' ? (
                  <div className="bg-[var(--page)] rounded-[8px] p-4 sm:p-8 h-[690px] sm:h-[720px] max-h-[720px] flex flex-col overflow-hidden border border-[var(--line)]">
                    <div className="mb-4 pb-3 border-b border-[var(--line)] flex items-center justify-between shrink-0">
                      <ParchmentPlateButton
                        onClick={() => selectNavMode('list', 'journal', 'all')}
                        size="sm"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>ডায়েরির পাতায় ফিরে যান (Return to Open Diary)</span>
                      </ParchmentPlateButton>
                      <span className="text-xs text-[var(--ink-soft)] font-literary italic">
                        VerseVault Literary Archive &amp; Backup
                      </span>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                      <SettingsBackupView />
                    </div>
                  </div>
                ) : (
                  /* TWO-PAGE OPEN BOOK SPREAD (Desktop: 2 Pages Side-by-Side | Mobile: Active Single Page) */
                  <div
                    style={{
                      perspective: 2200,
                      background: isDarkTheme
                        ? activeDeskBg.pageSpreadDarkCss
                        : activeDeskBg.pageSpreadLightCss,
                    }}
                    data-testid="book-spread-container"
                    data-book-theme={deskBackground}
                    className="relative grid grid-cols-1 lg:grid-cols-12 grid-rows-[minmax(0,1fr)] rounded-[8px] overflow-hidden border border-[#C8B294] dark:border-[#3A342B] h-[690px] sm:h-[720px] max-h-[720px] shadow-[inset_0_0_40px_rgba(120,88,52,0.09)] transition-all duration-500"
                  >
                    {/* In-Book Atmospheric Paper Pattern & Candle/Ambient Glow Layers (Strictly Inside the Open Spread) */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-0 opacity-90 transition-all duration-500"
                      style={{ backgroundImage: activeDeskBg.patternCss }}
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-0 transition-all duration-500"
                      style={{ background: activeDeskBg.ambientGlowCss }}
                    />

                    {/* In-Book Bookmark & Undo Notifications (Strictly Inside the Open Spread) */}
                    {bookmarkToast && (
                      <div
                        role="status"
                        aria-live="polite"
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#2B1D12]/95 text-[#F7EBD9] border border-[#D8A668]/80 shadow-xl text-xs font-bangla whitespace-nowrap"
                      >
                        <span>{bookmarkToast}</span>
                      </div>
                    )}
                    {trashedUndoEntry && (
                      <div
                        role="status"
                        aria-live="polite"
                        className="absolute bottom-3 right-4 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#2B1D12]/95 text-[#F7EBD9] border border-[#8B6343] shadow-xl text-xs font-bangla"
                      >
                        <span>“{trashedUndoEntry.title}” ট্র্যাশে সরানো হয়েছে।</span>
                        <button
                          type="button"
                          onClick={() => {
                            restoreFromTrash(trashedUndoEntry.id);
                            openEntryForReading(trashedUndoEntry.id);
                            setTrashedUndoEntry(null);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#D8A668] text-[#1F140C] font-semibold hover:opacity-90"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Undo
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrashedUndoEntry(null)}
                          aria-label="Dismiss notification"
                          className="text-[#B89F82] hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* 3D Animated Turning Parchment Leaf Overlay */}
                    <AnimatePresence>
                      {pageTurnAnim && (
                        <motion.div
                          key={pageTurnAnim.key}
                          initial={{
                            rotateY: pageTurnAnim.direction === 'next' ? 0 : -155,
                            opacity: 0.92,
                          }}
                          animate={{
                            rotateY: pageTurnAnim.direction === 'next' ? -155 : 0,
                            opacity: [0.95, 0.92, 0],
                          }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 0.56,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          onAnimationComplete={() => setPageTurnAnim(null)}
                          style={{
                            transformOrigin: 'left center',
                            transformStyle: 'preserve-3d',
                          }}
                          aria-hidden="true"
                          className="hidden lg:block pointer-events-none absolute inset-y-0 left-[41.666%] right-0 z-40 rounded-r-[8px] bg-gradient-to-r from-[#DFCCB0] via-[#F7EFE2] to-[#EAD9BF] dark:from-[#3A3226] dark:via-[#2E2820] dark:to-[#372F26] border-y border-r border-[#BDA380] dark:border-[#57493A] shadow-[-18px_0_38px_rgba(32,18,8,0.34),12px_0_28px_rgba(32,18,8,0.22)]"
                        >
                          {/* Subtle simulated ink lines on turning page leaf */}
                          <div className="p-10 space-y-4 opacity-25">
                            <div className="w-1/3 h-3 rounded bg-[#6E5239]" />
                            <div className="w-2/3 h-6 rounded bg-[#4A3525]" />
                            <div className="space-y-2.5 pt-4">
                              <div className="w-full h-2.5 rounded bg-[#6E5239]" />
                              <div className="w-5/6 h-2.5 rounded bg-[#6E5239]" />
                              <div className="w-4/6 h-2.5 rounded bg-[#6E5239]" />
                              <div className="w-full h-2.5 rounded bg-[#6E5239]" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Interactive Curled Page Corners on Bottom-Left & Bottom-Right */}
                    <CurledPageCorner
                      side="left"
                      disabled={currentEntryPageIndex <= 0}
                      onClick={() => handleTurnPage('prev')}
                      label="পূর্ববর্তী পাতা উল্টান (Turn to Previous Page)"
                    />
                    <CurledPageCorner
                      side="right"
                      disabled={
                        currentEntryPageIndex < 0 ||
                        currentEntryPageIndex >= bookIndexEntries.length - 1
                      }
                      onClick={() => handleTurnPage('next')}
                      label="পরবর্তী পাতা উল্টান (Turn to Next Page)"
                    />

                    {/* Central Book Spine Shadow Crease & Interactive Silk Bookmark Ribbon (Desktop) */}
                    {!zenFullSpreadEditor && (
                      <div
                        className="hidden lg:flex pointer-events-none absolute inset-y-0 left-[41.666%] -translate-x-1/2 w-16 z-20 flex-col items-center justify-between"
                        style={{
                          background:
                            'linear-gradient(90deg, rgba(60,38,20,0) 0%, rgba(60,38,20,0.09) 30%, rgba(22,11,4,0.38) 50%, rgba(60,38,20,0.11) 70%, rgba(60,38,20,0) 100%)',
                        }}
                      >
                        {/* Hanging Crimson-Gold Silk Bookmark Ribbon with Swallowtail Notch (Click to Mark or Jump to Saved Place) */}
                        <motion.button
                          type="button"
                          key={selectedEntry?.id || 'ribbon'}
                          onClick={() => {
                            if (
                              readingBookmark &&
                              selectedEntry &&
                              readingBookmark.entryId !== selectedEntry.id
                            ) {
                              handleResumeReadingPlace(readingBookmark);
                            } else {
                              handleMarkReadingPlace();
                            }
                          }}
                          title={
                            readingBookmark &&
                            selectedEntry &&
                            readingBookmark.entryId !== selectedEntry.id
                              ? `শেষ যেখানে রেখেছিলেন (“${readingBookmark.entryTitle}”) সেখানে ফিরে যান`
                              : 'এই পাতায় রেশমি ফিতা রাখুন (Mark Current Reading Place)'
                          }
                          aria-label="Silk bookmark ribbon — click to mark or resume reading place"
                          initial={{ rotate: -4 }}
                          animate={{ rotate: [0, 3, -1.5, 0] }}
                          transition={{ duration: 0.65, ease: 'easeOut' }}
                          style={{
                            transformOrigin: 'top center',
                            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)',
                            background: activeDeskBg.ribbonGradient,
                            borderColor: activeDeskBg.ribbonBorder,
                          }}
                          className={`pointer-events-auto cursor-pointer w-5 ${
                            readingBookmark?.entryId === selectedEntry?.id
                              ? 'h-28 ring-1 ring-white/40'
                              : 'h-20 opacity-90'
                          } shadow-[0_6px_14px_rgba(25,10,5,0.55)] border-x transition-all duration-300 hover:h-28`}
                        />
                        {/* Authentic Kettle-Stitch Bookbinding Thread Marks */}
                        <div className="space-y-24 opacity-45">
                          <div className="w-2.5 h-[1.5px] bg-[#4A301D]" />
                          <div className="w-2.5 h-[1.5px] bg-[#4A301D]" />
                          <div className="w-2.5 h-[1.5px] bg-[#4A301D]" />
                          <div className="w-2.5 h-[1.5px] bg-[#4A301D]" />
                        </div>
                        <div className="h-4" />
                      </div>
                    )}

                    {/* ==================================================================
                        LEFT PARCHMENT PAGE (5 of 12 cols on desktop; visible on mobile when mobileView === 'left-page')
                       ================================================================== */}
                    {!zenFullSpreadEditor && (
                      <div
                        className={`${
                          mobileView === 'right-page' ? 'hidden lg:flex' : 'flex'
                        } lg:col-span-5 relative h-full min-h-0 overflow-hidden p-4 sm:p-6 flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#D5C1A5]/80 dark:border-[#353028] shadow-[inset_-24px_0_36px_rgba(48,28,12,0.08)]`}
                      >
                        {/* Tucked Silk Bookmark Slip Inside Left Parchment Page */}
                        {readingBookmark && (
                          <div
                            data-testid="resume-bookmark-banner"
                            style={{
                              background: activeDeskBg.ribbonGradient,
                              borderColor: activeDeskBg.ribbonBorder,
                            }}
                            className="mb-2.5 flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-[7px] border text-[#FCEFD9] text-[11px] font-bangla shadow-xs shrink-0"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Bookmark
                                className="w-3.5 h-3.5 shrink-0"
                                style={{
                                  color: activeDeskBg.ribbonBorder,
                                  fill: activeDeskBg.ribbonBorder,
                                }}
                              />
                              <span className="truncate">
                                শেষ যেখানে রেখেছিলেন: “{readingBookmark.entryTitle}”
                                {(readingBookmark.scrollProgress ?? 0) > 0
                                  ? ` (${toBanglaDigits(readingBookmark.scrollProgress)}%)`
                                  : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                data-testid="resume-bookmark-btn"
                                onClick={() => handleResumeReadingPlace(readingBookmark)}
                                className="px-2 py-0.5 rounded-[4px] bg-[#DFB578] text-[#23140B] font-semibold hover:bg-[#ECC892] transition-colors cursor-pointer whitespace-nowrap"
                              >
                                ফিরে যান →
                              </button>
                              <button
                                type="button"
                                onClick={handleClearReadingPlace}
                                title="রেশমি ফিতা সরান (Clear saved bookmark)"
                                aria-label="Clear saved reading bookmark"
                                className="text-[#E6C79C] hover:text-white p-0.5 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* LEFT MODE A: OVERVIEW HUB ("শুভ সন্ধ্যা 🌿 / আজ কী লিখবে?") */}
                        {leftPageMode === 'overview' && (
                          <div className="flex flex-col justify-between h-full min-h-0 space-y-3.5">
                            <div className="space-y-3.5 flex-1 min-h-0 overflow-y-auto pr-1">
                              {/* Authentic Misty Sunrise Watercolor Header Card */}
                              <div className="relative rounded-2xl overflow-hidden border border-[#CBB699] dark:border-[#3A342B] shadow-xs">
                                <MistySunriseHeaderArtwork />
                                <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[#3A281B]">
                                  <span className="text-sm font-literary font-semibold">
                                    VerseVault
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLeftPageMode('list');
                                        setSearchOpen(true);
                                      }}
                                      aria-label="Search entries"
                                      className="p-1.5 rounded-full bg-white/45 hover:bg-white/65 transition-colors"
                                    >
                                      <Search className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <div className="absolute bottom-3 left-4 right-4 text-[#2B1E16]">
                                  <h2 className="text-2xl font-bold font-bangla flex items-center gap-2">
                                    <span>{bdGreeting.bangla}</span>
                                    <span className="text-lg" aria-hidden="true">
                                      🌿
                                    </span>
                                  </h2>
                                  <p className="text-xs sm:text-sm font-bangla text-[#4A382B]">
                                    বাংলাদেশ সময়: {bdTimeStr} · আজ কী লিখবে?
                                  </p>
                                </div>
                              </div>

                              {/* 4 Interactive Category Tiles with 100% Real Bangla Counts */}
                              <div className="grid grid-cols-4 gap-2">
                                {categoryStats.map((stat) => {
                                  const Icon = stat.icon;
                                  return (
                                    <button
                                      key={stat.type}
                                      type="button"
                                      onClick={() => {
                                        setTypeDropdown(stat.type);
                                        setLeftPageMode('list');
                                      }}
                                      className="bg-[#F7EFE2] dark:bg-[#2C2620] hover:bg-[#E8D7BF] dark:hover:bg-[#3A3226] border border-[#D6C2A7] dark:border-[#423A30] rounded-xl py-2.5 px-1.5 flex flex-col items-center justify-center gap-1 transition-all shadow-2xs group"
                                    >
                                      <Icon className="w-4 h-4 text-[#6B4E37] dark:text-[#C8A882] group-hover:scale-110 transition-transform" />
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

                              {/* Quick Write & Template Buttons */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleStartNewEntry({ type: 'diary' })}
                                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#6E4F3A] hover:bg-[#5D412F] text-[#FDF8F0] text-xs font-bangla font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>আজকের পাতা লিখুন</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTemplateModalOpen(true)}
                                  className="py-2.5 px-3 rounded-xl bg-[#E5D2B5] dark:bg-[#322B23] hover:bg-[#DBC29E] dark:hover:bg-[#3E3529] text-[var(--ink)] text-xs font-bangla font-medium flex items-center justify-center gap-1.5 border border-[#C8B193] dark:border-[#4F4336] transition-colors"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-[#6E4F3A] dark:text-[#C8A882]" />
                                  <span>টেমপ্লেট</span>
                                </button>
                              </div>

                              {/* Custom Component 1: Continue Writing Unfinished Drafts */}
                              <ContinueWritingCard
                                entries={entries}
                                onResumeDraft={(id) => handleSelectEntryFromList(id, true)}
                              />

                              {/* Custom Component 2: Return to a Memory Card */}
                              <MemoryReturnCard
                                entries={entries}
                                onSelectEntry={(id) => handleSelectEntryFromList(id, false)}
                              />
                            </div>

                            {/* Signature Literary Quote Footer for Active Atmosphere */}
                            <div className="relative pt-3 border-t border-[#D8C5AA]/80 dark:border-[#353028] text-center pr-10 shrink-0">
                              <blockquote className="text-sm font-bangla font-medium text-[var(--ink)] leading-relaxed italic">
                                {activeDeskBg.conceptQuoteBn}
                              </blockquote>
                              <BotanicalSprigOrnament className="w-12 h-12 absolute bottom-0 right-0" />
                            </div>
                          </div>
                        )}

                        {/* LEFT MODE B: ILLUSTRATED BANGLA & ENGLISH CALENDAR */}
                        {leftPageMode === 'calendar' && (
                          <div className="flex flex-col justify-between h-full min-h-0 space-y-4 overflow-y-auto pr-1">
                            <div className="space-y-3.5">
                              {/* Top Calendar Bar */}
                              <div className="flex items-center justify-between pb-2 border-b border-[#D8C5AA] dark:border-[#353028]">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setLeftPageMode('list')}
                                    aria-label="Back to diary list"
                                    className="p-1 rounded hover:bg-black/5 text-[var(--ink)]"
                                  >
                                    <ArrowLeft className="w-4 h-4" />
                                  </button>
                                  <h2 className="text-base font-literary font-semibold text-[var(--ink)]">
                                    Calendar
                                  </h2>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCalYear(2025);
                                      setCalMonth(0);
                                      setSelectedCalendarDate('2025-01-28');
                                    }}
                                    className="text-[11px] px-2 py-0.5 rounded bg-[#E3D1B8] dark:bg-[#332C24] text-[var(--ink)] hover:opacity-85"
                                  >
                                    Jan 2025
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const today = getLocalTodayDateString();
                                      const [y, m] = today.split('-').map(Number);
                                      setCalYear(y);
                                      setCalMonth(m - 1);
                                      setSelectedCalendarDate(today);
                                    }}
                                    className="text-[11px] px-2 py-0.5 rounded bg-[#6E4F3A] text-[#FDF8F0] hover:opacity-90"
                                  >
                                    Today
                                  </button>
                                </div>
                              </div>

                              {/* Month Switcher */}
                              <div className="flex items-center justify-between px-2 py-1 bg-[#EAE0D0]/60 dark:bg-[#2B251F] rounded-xl">
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
                                  className="p-1.5 rounded-lg hover:bg-black/5 text-[var(--ink)]"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-medium text-[var(--ink)]">
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
                                  className="p-1.5 rounded-lg hover:bg-black/5 text-[var(--ink)]"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Bangla Weekday Headers */}
                              <div className="grid grid-cols-7 text-center text-[11px] font-bangla text-[var(--ink-soft)] pt-1">
                                {BANGLA_WEEKDAY_SHORT.map((dayName) => (
                                  <span key={dayName}>{dayName}</span>
                                ))}
                              </div>

                              {/* Days Grid with 100% Real Entry Dots */}
                              <div className="grid grid-cols-7 gap-y-1.5 text-center text-xs">
                                {calendarCells.map((cell, idx) => {
                                  if (!cell.day || !cell.dateStr) {
                                    return <div key={`empty-${idx}`} className="h-8" />;
                                  }
                                  const entryCountOnDate =
                                    datesWithEntriesMap.get(cell.dateStr) || 0;
                                  const isSelectedDate =
                                    selectedCalendarDate === cell.dateStr;

                                  return (
                                    <button
                                      key={cell.dateStr}
                                      type="button"
                                      onClick={() => {
                                        setSelectedCalendarDate(cell.dateStr!);
                                        const matching = activeEntries.find(
                                          (e) => e.entryDate === cell.dateStr
                                        );
                                        if (matching) {
                                          openEntryForReading(matching.id);
                                          setIsEditingOnRightPage(false);
                                        }
                                      }}
                                      className="relative h-8 flex flex-col items-center justify-center group focus:outline-none"
                                    >
                                      <span
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors tabular-nums ${
                                          isSelectedDate
                                            ? 'bg-[#4E3624] text-[#FDF8F0] font-bold shadow-xs'
                                            : entryCountOnDate > 0
                                            ? 'text-[var(--ink)] font-semibold bg-[#E5D3B8]/60 dark:bg-[#332C23] group-hover:bg-[#DBC3A0] dark:group-hover:bg-[#3F3629]'
                                            : 'text-[var(--ink-soft)] group-hover:bg-[#E5D4BC]/50 dark:group-hover:bg-[#332C23]/70'
                                        }`}
                                      >
                                        {cell.day}
                                      </span>
                                      {entryCountOnDate > 0 && !isSelectedDate && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#6E4F3A] dark:bg-[#C8A882] absolute -bottom-0.5" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Selected Date Entries List & "+ এই দিনে লিখুন" */}
                            <div className="pt-3 border-t border-[#D8C5AA] dark:border-[#353028] space-y-2.5 shrink-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold font-bangla text-[var(--ink)]">
                                  {formatBanglaFullDate(selectedCalendarDate, false)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStartNewEntry({ entryDate: selectedCalendarDate })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#6E4F3A] text-[#FDF8F0] text-[11px] font-bangla hover:opacity-95"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>এই দিনে লিখুন</span>
                                </button>
                              </div>

                              {selectedDayEntries.length === 0 ? (
                                <div className="p-4 rounded-xl bg-[#F7EFE2]/70 dark:bg-[#2C2620] border border-dashed border-[#CBB699] dark:border-[#4A3E32] text-center space-y-1.5">
                                  <p className="text-xs font-bangla text-[var(--ink-soft)]">
                                    এই তারিখে এখনো কোনো পাতা লেখা হয়নি।
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStartNewEntry({
                                        entryDate: selectedCalendarDate,
                                      })
                                    }
                                    className="text-xs font-bangla font-semibold text-[#6E4F3A] dark:text-[#C8A882] underline"
                                  >
                                    + নতুন লেখা শুরু করুন
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-[165px] overflow-y-auto pr-1">
                                  {selectedDayEntries.map((entry) => {
                                    const isSelected = selectedEntry?.id === entry.id;
                                    return (
                                      <div
                                        key={entry.id}
                                        onClick={() =>
                                          handleSelectEntryFromList(entry.id, false)
                                        }
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleSelectEntryFromList(entry.id, false);
                                          }
                                        }}
                                        className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                          isSelected
                                            ? 'bg-[#E5D2B5] dark:bg-[#322B23] border-[#C4AA87]'
                                            : 'bg-[#F8F1E5] dark:bg-[#2C2620] border-[#D6C2A7] hover:bg-[#EFE2CE] dark:hover:bg-[#383128]'
                                        }`}
                                      >
                                        <div className="min-w-0">
                                          <h4 className="text-sm font-bold font-bangla text-[var(--ink)] truncate">
                                            {entry.title || 'Untitled'}
                                          </h4>
                                          <p className="text-xs font-bangla text-[var(--ink-soft)] truncate mt-0.5">
                                            {entry.content.split('\n')[0]}
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectEntryFromList(entry.id, true);
                                          }}
                                          aria-label={`Edit ${entry.title}`}
                                          className="p-1.5 rounded-full bg-[#E6D4BC] dark:bg-[#3A3229] text-[#5C422E] dark:text-[#D8C3A5] shrink-0 hover:scale-105"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* LEFT MODE C: ILLUSTRATED 2x3 COLLECTIONS GRID (With Real Hand-Painted Art) */}
                        {leftPageMode === 'collections' && (
                          <div className="flex flex-col justify-between h-full min-h-0 space-y-4">
                            <div className="space-y-3.5 flex-1 min-h-0 flex flex-col overflow-hidden">
                              <div className="flex items-center justify-between pb-2 border-b border-[#D8C5AA] dark:border-[#353028] shrink-0">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setLeftPageMode('list')}
                                    aria-label="Back to diary list"
                                    className="p-1 rounded hover:bg-black/5 text-[var(--ink)]"
                                  >
                                    <ArrowLeft className="w-4 h-4" />
                                  </button>
                                  <h2 className="text-base font-literary font-semibold text-[var(--ink)]">
                                    Collections
                                  </h2>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setNewCollectionModalOpen(true)}
                                  aria-label="Create new collection"
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#6E4F3A] text-[#FDF8F0] text-xs font-bangla hover:opacity-95"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>নতুন সংকলন</span>
                                </button>
                              </div>

                              {/* 2-Column Hand-Painted Watercolor Collection Cards */}
                              <div className="grid grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto pr-1 content-start">
                                {collectionsWithCounts.map((col, idx) => (
                                  <button
                                    key={col.id}
                                    type="button"
                                    onClick={() => {
                                      navigateTo('collection-detail', {
                                        collectionId: col.id,
                                      });
                                      setLeftPageMode('collection-entries');
                                      const firstInCol = activeEntries.find(
                                        (e) => e.collectionId === col.id
                                      );
                                      if (firstInCol) {
                                        openEntryForReading(firstInCol.id);
                                        setIsEditingOnRightPage(false);
                                      }
                                    }}
                                    className="group rounded-xl overflow-hidden bg-[#F8F1E5] dark:bg-[#2C2620] border border-[#D4C0A3] dark:border-[#423A30] shadow-xs hover:shadow-md transition-all text-center flex flex-col"
                                  >
                                    <div className="h-[78px] w-full overflow-hidden">
                                      <CollectionCardIllustration
                                        accent={col.accent}
                                        index={idx}
                                      />
                                    </div>
                                    <div className="py-2 px-2">
                                      <h3 className="text-sm font-bold font-bangla text-[var(--ink)] group-hover:text-[var(--accent)] truncate">
                                        {col.name}
                                      </h3>
                                      <p className="text-[11px] font-bangla text-[var(--ink-soft)]">
                                        {col.countBn}টি লেখা
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-[#D8C5AA]/70 dark:border-[#353028] flex items-center justify-between text-xs text-[var(--ink-soft)] font-bangla shrink-0">
                              <span>মোট {toBanglaDigits(collections.length)}টি সংকলন</span>
                              <button
                                type="button"
                                onClick={() => setLeftPageMode('list')}
                                className="text-[var(--accent)] hover:underline"
                              >
                                সব লেখা দেখুন →
                              </button>
                            </div>
                          </div>
                        )}

                        {/* LEFT MODE D: DATED ENTRY LIST (Diary, Poems, Quotes, Fragments, Favorites, Archive, Collection Detail, Trash) */}
                        {(leftPageMode === 'list' ||
                          leftPageMode === 'collection-entries' ||
                          leftPageMode === 'trash') && (
                          <div className="flex flex-col justify-between h-full min-h-0 space-y-3.5">
                            <div className="space-y-3 flex-1 min-h-0 flex flex-col overflow-hidden">
                              {/* Top Action Row */}
                              {leftPageMode === 'collection-entries' &&
                              activeCollectionObj ? (
                                <div className="space-y-2 pb-2 border-b border-[#D8C5AA] dark:border-[#353028] shrink-0">
                                  <div className="flex items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() => setLeftPageMode('collections')}
                                      className="inline-flex items-center gap-1 text-xs font-bangla text-[var(--accent)] hover:underline"
                                    >
                                      <ArrowLeft className="w-3.5 h-3.5" />
                                      <span>সব সংকলন (Collections)</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStartNewEntry({
                                          collectionId: activeCollectionObj.id,
                                        })
                                      }
                                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#6E4F3A] text-[#FDF8F0] text-xs font-bangla"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>এই সংকলনে লিখুন</span>
                                    </button>
                                  </div>
                                  <div>
                                    <h2 className="text-lg font-bold font-bangla text-[var(--ink)]">
                                      {activeCollectionObj.name}
                                    </h2>
                                    {activeCollectionObj.description && (
                                      <p className="text-xs font-bangla text-[var(--ink-soft)] line-clamp-1">
                                        {activeCollectionObj.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : leftPageMode === 'trash' ? (
                                <div className="flex items-center justify-between pb-2 border-b border-[#D8C5AA] dark:border-[#353028] shrink-0">
                                  <div className="flex items-center gap-2">
                                    <Trash2 className="w-4 h-4 text-[var(--danger)]" />
                                    <h2 className="text-base font-literary font-semibold text-[var(--ink)]">
                                      Trash ({toBanglaDigits(bookIndexEntries.length)})
                                    </h2>
                                  </div>
                                  {bookIndexEntries.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setConfirmDialogState({
                                          open: true,
                                          title: 'ট্র্যাশ খালি করার নিশ্চিতকরণ (Empty Trash?)',
                                          description:
                                            'আপনি কি নিশ্চিত যে ট্র্যাশের সব লেখা স্থায়ীভাবে মুছে ফেলতে চান? এই কাজটি আর ফিরিয়ে আনা যাবে না।',
                                          onConfirm: () => {
                                            bookIndexEntries.forEach((item) =>
                                              permanentlyDeleteEntry(item.id)
                                            );
                                          },
                                        })
                                      }
                                      className="px-2.5 py-1 rounded-md bg-[var(--danger)] text-white text-xs font-medium hover:opacity-90"
                                    >
                                      Empty Trash
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-2 shrink-0">
                                  <div className="flex items-center gap-2">
                                    <LeatherClaspButton
                                      variant="walnut"
                                      size="md"
                                      onClick={() => handleStartNewEntry()}
                                    >
                                      <Plus className="w-4 h-4 text-[#DFB578]" />
                                      <span>New Entry</span>
                                    </LeatherClaspButton>
                                    <ParchmentPlateButton
                                      size="md"
                                      onClick={() => setTemplateModalOpen(true)}
                                      title="Choose a Writing Template or Page Variation"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 text-[#8A5A36]" />
                                      <span>টেমপ্লেট</span>
                                    </ParchmentPlateButton>
                                  </div>

                                  {activeTagFilter && (
                                    <ParchmentPlateButton
                                      size="xs"
                                      active
                                      onClick={() => setActiveTagFilter('')}
                                    >
                                      <span>#{activeTagFilter}</span>
                                      <X className="w-3 h-3" />
                                    </ParchmentPlateButton>
                                  )}
                                </div>
                              )}

                              {/* Custom Archival Filter Dropdown ("All Entries v"), Sort & Inline Search */}
                              <div className="flex items-center justify-between gap-2 pt-1 pb-2 border-b border-dashed border-[#CBB494] dark:border-[#3A3228] shrink-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <ArchivalSelect<EntryType | 'all'>
                                    ariaLabel="Filter journal entries by category"
                                    value={typeDropdown}
                                    onChange={(nextVal) => {
                                      playRibbonSlide();
                                      setTypeDropdown(nextVal);
                                      setIsEditingOnRightPage(false);
                                    }}
                                    options={[
                                      {
                                        value: 'all',
                                        label: 'All Entries (সব লেখা)',
                                        badge: toBanglaDigits(activeEntries.length),
                                      },
                                      {
                                        value: 'diary',
                                        label: 'Diary (দিনলিপি)',
                                        badge: categoryStats[2].countBn,
                                      },
                                      {
                                        value: 'poem',
                                        label: 'Poems (কবিতা)',
                                        badge: categoryStats[0].countBn,
                                      },
                                      {
                                        value: 'quote',
                                        label: 'Quotes (উদ্ধৃতি)',
                                        badge: categoryStats[1].countBn,
                                      },
                                      {
                                        value: 'fragment',
                                        label: 'Fragments (টুকরো ভাবনা)',
                                        badge: categoryStats[3].countBn,
                                      },
                                      {
                                        value: 'prose',
                                        label: 'Prose (গদ্য)',
                                      },
                                    ]}
                                    size="sm"
                                  />

                                  <ArchivalSelect<
                                    'date-desc' | 'date-asc' | 'updated-desc' | 'title-asc'
                                  >
                                    ariaLabel="Sort entries"
                                    variant="minimal"
                                    size="sm"
                                    value={sortBy}
                                    onChange={(nextSort) => {
                                      playRibbonSlide();
                                      setSortBy(nextSort);
                                    }}
                                    options={[
                                      { value: 'date-desc', label: 'Newest (নতুন আগে)' },
                                      { value: 'date-asc', label: 'Oldest (পুরাতন আগে)' },
                                      {
                                        value: 'updated-desc',
                                        label: 'Recently Edited',
                                      },
                                      { value: 'title-asc', label: 'Title A–Z' },
                                    ]}
                                  />
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {searchOpen || globalSearchQuery ? (
                                    <div className="flex items-center bg-[#FAF3E8] dark:bg-[#2B2620] border border-[#BDA380] dark:border-[#4A3F32] rounded-[5px] px-2.5 py-1 shadow-inner">
                                      <Search className="w-3.5 h-3.5 text-[var(--ink-soft)] mr-1.5 shrink-0" />
                                      <input
                                        type="search"
                                        value={globalSearchQuery}
                                        onChange={(e) =>
                                          setGlobalSearchQuery(e.target.value)
                                        }
                                        placeholder="খুঁজুন / Search…"
                                        aria-label="Search entries in book index"
                                        className="w-24 sm:w-32 bg-transparent text-xs text-[var(--ink)] focus:outline-none font-bangla"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setGlobalSearchQuery('');
                                          setSearchOpen(false);
                                        }}
                                        aria-label="Close search"
                                        className="text-[var(--ink-soft)] hover:text-[var(--ink)] ml-1 cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <ParchmentPlateButton
                                      size="xs"
                                      onClick={() => setSearchOpen(true)}
                                      aria-label="Search entries"
                                      title="সূচিপত্রে খুঁজুন (Search Index)"
                                      className="p-1.5"
                                    >
                                      <Search className="w-3.5 h-3.5" />
                                    </ParchmentPlateButton>
                                  )}
                                </div>
                              </div>

                              {/* Scrollable Entry Index List: Custom Tipped-In Archival Manuscript Slips */}
                              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                                {bookIndexEntries.length === 0 ? (
                                  <div className="py-12 text-center space-y-3 rounded-[8px] border border-dashed border-[#CBB494] dark:border-[#4A3E32] bg-[#FBF5E9]/50 dark:bg-[#241F1A]/70">
                                    <p className="text-sm text-[var(--ink-soft)] font-bangla">
                                      {leftPageMode === 'trash'
                                        ? 'ট্র্যাশ বক্স খালি।'
                                        : 'কোনো লেখা পাওয়া যায়নি। নতুন একটি পাতা শুরু করুন।'}
                                    </p>
                                    {leftPageMode !== 'trash' && (
                                      <LeatherClaspButton
                                        variant="walnut"
                                        size="sm"
                                        onClick={() => handleStartNewEntry()}
                                      >
                                        <span>+ নতুন লেখা শুরু করুন</span>
                                      </LeatherClaspButton>
                                    )}
                                  </div>
                                ) : (
                                  bookIndexEntries.map((item) => {
                                    const badge = formatDayMonthBadge(item.entryDate);
                                    const isSelected = selectedEntry?.id === item.id;
                                    const displayTitle =
                                      item.title || `Untitled ${item.type}`;
                                    const previewLine = getSingleLinePreview(
                                      item.content,
                                      42
                                    );

                                    return (
                                      <div
                                        key={item.id}
                                        onClick={() =>
                                          handleSelectEntryFromList(item.id, false)
                                        }
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleSelectEntryFromList(item.id, false);
                                          }
                                        }}
                                        className={`group relative flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-[7px] transition-all cursor-pointer border ${
                                          isSelected
                                            ? 'bg-gradient-to-r from-[#E6D3B5] via-[#EFE0C8] to-[#E6D3B5] dark:from-[#352D24] dark:via-[#312A21] dark:to-[#2D261E] border-[#AD8B63] dark:border-[#665441] shadow-[0_3px_10px_rgba(45,28,12,0.12),inset_0_1px_0_rgba(255,252,245,0.75)]'
                                            : 'bg-[#FAF3E6]/55 dark:bg-[#27211B]/55 border-[#DFCBB0]/80 dark:border-[#393027] hover:bg-[#EFE1C9]/85 dark:hover:bg-[#302820] hover:border-[#C5AB88]'
                                        }`}
                                      >
                                        {/* Active Brass Index Tab Bar on Left Edge */}
                                        {isSelected && (
                                          <span
                                            aria-hidden="true"
                                            className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-gradient-to-b from-[#C89B5E] via-[#8B5E34] to-[#5A3A1E]"
                                          />
                                        )}

                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                          {/* Perforated Archival Postage Date Stamp Badge ("28 Jan") */}
                                          <div
                                            className={`w-12 h-12 rounded-[5px] border flex flex-col items-center justify-center shrink-0 transition-colors ${
                                              isSelected
                                                ? 'bg-gradient-to-b from-[#5A3E28] to-[#422C1B] text-[#FAF2E4] border-[#8C6747] shadow-xs'
                                                : 'bg-gradient-to-b from-[#EFE2CC] to-[#DFCCB0] dark:from-[#3A3229] dark:to-[#2E2720] text-[var(--ink)] border-[#C4AC89] dark:border-[#4F4336]'
                                            }`}
                                          >
                                            <span className="text-base font-bold leading-none tabular-nums">
                                              {badge.day}
                                            </span>
                                            <span
                                              className={`text-[10.5px] uppercase tracking-wider mt-0.5 ${
                                                isSelected
                                                  ? 'text-[#DFC4A2]'
                                                  : 'text-[var(--ink-soft)]'
                                              }`}
                                            >
                                              {badge.month}
                                            </span>
                                          </div>

                                          {/* Entry Title, Dotted Fountain-Pen Leader & Excerpt */}
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                              <h3 className="text-[15px] sm:text-base font-bold text-[var(--ink)] truncate font-bangla">
                                                {displayTitle}
                                              </h3>
                                              <span
                                                aria-hidden="true"
                                                className="flex-1 border-b border-dotted border-[#BDA382]/60 dark:border-[#4A3F32] mx-1 hidden sm:block"
                                              />
                                              {item.status === 'draft' && (
                                                <span className="text-[10px] px-1.5 py-0.2 rounded-[3px] border border-[#BEA482] bg-[#E5D3B8] dark:bg-[#3D3429] text-[var(--ink-soft)]">
                                                  খসড়া
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs text-[var(--ink-soft)] truncate font-bangla mt-0.5">
                                              {previewLine || 'খালি পাতা...'}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Right Action: Restore/Delete in Trash mode, or Bookmark Ribbon */}
                                        {leftPageMode === 'trash' ? (
                                          <div className="flex items-center gap-1 shrink-0">
                                            <ParchmentPlateButton
                                              size="xs"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                restoreFromTrash(item.id);
                                              }}
                                              title="Restore entry"
                                            >
                                              Restore
                                            </ParchmentPlateButton>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmDialogState({
                                                  open: true,
                                                  title:
                                                    'স্থায়ীভাবে মুছে ফেলার নিশ্চিতকরণ (Delete Permanently?)',
                                                  description: `আপনি কি নিশ্চিত যে “${displayTitle}” পাতাটি চিরতরে মুছে ফেলতে চান?`,
                                                  onConfirm: () =>
                                                    permanentlyDeleteEntry(item.id),
                                                });
                                              }}
                                              title="Delete permanently"
                                              className="p-1 text-[var(--danger)] hover:opacity-80 cursor-pointer"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              playInkStamp();
                                              toggleFavorite(item.id);
                                            }}
                                            aria-label={
                                              item.isFavorite
                                                ? `Remove bookmark from '${displayTitle}'`
                                                : `Bookmark '${displayTitle}'`
                                            }
                                            className="p-1.5 text-[#6E533B] dark:text-[#C8A882] hover:scale-110 transition-transform shrink-0 cursor-pointer"
                                          >
                                            <Bookmark
                                              className={`w-4 h-4 ${
                                                item.isFavorite
                                                  ? 'fill-[#8B3A32] text-[#8B3A32] dark:fill-[#D8A668] dark:text-[#D8A668]'
                                                  : ''
                                              }`}
                                            />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            {/* Left Page Subtle Footer Count & Mode Switcher */}
                            <div className="pt-3 mt-2 border-t border-dashed border-[#CBB494] dark:border-[#353028] flex items-center justify-between text-[11px] text-[var(--ink-soft)] shrink-0">
                              <span className="font-bangla">
                                মোট {toBanglaDigits(bookIndexEntries.length)}টি পাতা
                              </span>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    playRibbonSlide();
                                    setLeftPageMode('overview');
                                  }}
                                  className="hover:underline text-[var(--accent)] font-bangla cursor-pointer"
                                >
                                  {bdGreeting.bangla} হাব
                                </button>
                                <span>·</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    playRibbonSlide();
                                    setLeftPageMode('settings');
                                  }}
                                  className="hover:underline text-[var(--accent)] cursor-pointer"
                                >
                                  Backup &amp; Export
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ==================================================================
                        RIGHT OPEN PARCHMENT PAGE (7 of 12 cols on desktop; visible on mobile when mobileView === 'right-page')
                       ================================================================== */}
                    <div
                      data-testid="right-parchment-page"
                      className={`${
                        mobileView === 'left-page' ? 'hidden lg:flex' : 'flex'
                      } ${
                        zenFullSpreadEditor ? 'lg:col-span-12' : 'lg:col-span-7'
                      } relative p-5 sm:p-8 lg:p-10 flex-col justify-between h-full min-h-0 overflow-hidden transition-colors duration-300 shadow-[inset_28px_0_42px_rgba(45,26,10,0.09),inset_-8px_0_18px_rgba(45,26,10,0.05)]`}
                      style={rightPageSurfaceStyle}
                    >
                      {/* Top Gilded Reading Progress Hairline */}
                      {selectedEntry && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute top-0 left-0 right-0 h-[3px] bg-[#D8C5AA]/30 dark:bg-[#3A3226]/40 z-20 overflow-hidden"
                        >
                          <div
                            className="h-full bg-gradient-to-r from-[#8B2626] via-[#D8A668] to-[#754832] transition-all duration-200"
                            style={{ width: `${Math.max(4, scrollProgress)}%` }}
                          />
                        </div>
                      )}

                      {/* Page Variation Frame Overlays (All 10 Surfaces) */}
                      {activePageVariation === 'ruled-notebook' && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 left-7 sm:left-10 w-[1.5px] bg-[#C46D5E]/40 z-0"
                        />
                      )}
                      {activePageVariation === 'poetry-scroll' && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-3 sm:inset-4 rounded-lg border-4 border-double border-[#B8976C]/50 z-0"
                        />
                      )}
                      {activePageVariation === 'epistolary-letter' && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-3 sm:inset-4 rounded-sm border border-[#A88967]/50 z-0"
                        />
                      )}
                      {activePageVariation === 'botanical-herbarium' && (
                        <>
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-3 sm:inset-4 rounded-md border border-[#7D9A74]/45 z-0"
                          />
                          <BotanicalSprigOrnament className="pointer-events-none w-16 h-16 absolute top-3 right-4 opacity-55 z-0" />
                        </>
                      )}
                      {activePageVariation === 'royal-illuminated' && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-2.5 sm:inset-3.5 rounded-[10px] border-4 border-double border-[#C6923A]/65 shadow-[inset_0_0_0_2px_rgba(142,42,34,0.22)] z-0"
                        />
                      )}
                      {activePageVariation === 'deckle-handmade' && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-2 sm:inset-3 rounded-[12px] border border-dashed border-[#A68963]/50 shadow-[inset_0_0_24px_rgba(92,64,36,0.12)] z-0"
                        />
                      )}
                      {activePageVariation === 'ledger-chronicle' && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 right-12 w-[1px] bg-[#7094AC]/30 z-0"
                        />
                      )}

                      {!selectedEntry ? (
                        <div className="my-auto text-center space-y-4 py-16 z-10">
                          <Feather className="w-8 h-8 text-[var(--accent)] mx-auto stroke-[1.5]" />
                          <h2 className="text-xl font-literary text-[var(--ink)]">
                            Every journal begins with a first page.
                          </h2>
                          <div className="flex items-center justify-center gap-2">
                            <LeatherClaspButton
                              variant="walnut"
                              size="md"
                              onClick={() => handleStartNewEntry()}
                            >
                              <span>Write your first entry</span>
                            </LeatherClaspButton>
                            <ParchmentPlateButton
                              size="md"
                              onClick={() => setTemplateModalOpen(true)}
                            >
                              <span>টেমপ্লেট বেছে নিন</span>
                            </ParchmentPlateButton>
                          </div>
                        </div>
                      ) : isEditingOnRightPage ? (
                        /* ==============================================================
                           INLINE PARCHMENT PAGE EDITOR (Writing & Editing Mode)
                           ============================================================== */
                        <div className="space-y-3 z-10 flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
                          <div className="space-y-2.5 flex-1 min-h-0 flex flex-col overflow-hidden">
                            {/* Mobile Back Button inside Editor */}
                            <div className="flex lg:hidden items-center justify-between pb-2 border-b border-[#D8C5AA]/60 dark:border-[#3F372C]/60 shrink-0">
                              <ParchmentPlateButton
                                size="xs"
                                onClick={() => {
                                  setIsEditingOnRightPage(false);
                                  setMobileView('left-page');
                                }}
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>সূচিপত্রে ফিরে যান (Back to List)</span>
                              </ParchmentPlateButton>
                            </div>

                            {/* Single Clean Top Editor Bar (with Unified Page/Style/Ink Popover) */}
                            <div className="relative flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-dashed border-[#CBB494] dark:border-[#353028] shrink-0">
                              <div className="flex items-center gap-2 text-xs">
                                <input
                                  type="date"
                                  value={selectedEntry.entryDate}
                                  onChange={(e) =>
                                    updateEntry(
                                      selectedEntry.id,
                                      { entryDate: e.target.value },
                                      true
                                    )
                                  }
                                  aria-label="Entry Date"
                                  className="bg-[#FAF3E6] dark:bg-[#2C2620] px-2 py-0.5 rounded-[5px] border border-[#C4AC89] dark:border-[#423A30] font-medium text-[var(--ink)] focus:outline-none tabular-nums shadow-inner"
                                />
                                <span
                                  className={`hidden sm:inline font-bangla text-xs ${
                                    isNocturnalPage
                                      ? 'text-[#D8C3A5]'
                                      : 'text-[var(--ink-soft)]'
                                  }`}
                                >
                                  {formatBanglaFullDate(selectedEntry.entryDate, true)}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <SaveStateIndicator
                                  saveState={saveState}
                                  className="text-[var(--ink-soft)]"
                                  onSaveNow={() => updateEntry(selectedEntry.id, {}, true)}
                                  onRetry={() => retryFailedSave(selectedEntry.id)}
                                />

                                <button
                                  type="button"
                                  data-testid="toggle-writing-style-bar"
                                  onClick={() => setStyleBarOpen((v) => !v)}
                                  title="পাতার কাগজ, হাতের লেখা ও কালি পরিবর্তন করুন"
                                  className="px-2 py-1 rounded-[5px] bg-[#E6D4BA]/85 dark:bg-[#322A21] border border-[#BEA37E] dark:border-[#4F4234] text-[11px] font-bangla text-[var(--ink)] flex items-center gap-1 shrink-0 cursor-pointer hover:bg-[#DEC6A4]"
                                >
                                  <Feather className="w-3 h-3 text-[#754832] dark:text-[#D8A668]" />
                                  <span>পাতা ও কালি</span>
                                </button>

                                <ParchmentPlateButton
                                  size="xs"
                                  onClick={handleMarkReadingPlace}
                                  title="পড়া বা লেখা এখানেই চিহ্নিত করে রাখুন (Mark Place)"
                                >
                                  <BookMarked className="w-3 h-3 text-[#8B2626] dark:text-[#D8A668]" />
                                  <span>ফিতা রাখুন</span>
                                </ParchmentPlateButton>

                                <ParchmentPlateButton
                                  size="xs"
                                  onClick={() => setZenFullSpreadEditor((z) => !z)}
                                  title={
                                    zenFullSpreadEditor
                                      ? 'Restore two-page book view'
                                      : 'Expand editor across full book'
                                  }
                                  className="hidden lg:inline-flex p-1.5"
                                >
                                  {zenFullSpreadEditor ? (
                                    <Minimize2 className="w-3.5 h-3.5" />
                                  ) : (
                                    <Maximize2 className="w-3.5 h-3.5" />
                                  )}
                                </ParchmentPlateButton>

                                <LeatherClaspButton
                                  variant="walnut"
                                  size="sm"
                                  onClick={() => {
                                    playInkStamp();
                                    updateEntry(selectedEntry.id, {}, true);
                                    setIsEditingOnRightPage(false);
                                    setZenFullSpreadEditor(false);
                                  }}
                                >
                                  <span>✓ সম্পন্ন (Done)</span>
                                </LeatherClaspButton>
                              </div>

                              {/* Unified Floating Page Surface, Writing Style & Ink Popover */}
                              {styleBarOpen && (
                                <div
                                  data-testid="writing-style-ink-bar"
                                  className="absolute left-0 right-0 top-full mt-1.5 z-30 p-3 rounded-[8px] bg-[#FAF1E0] dark:bg-[#231D16] border border-[#BEA37E] dark:border-[#4F4234] shadow-[0_14px_32px_rgba(20,10,4,0.34)] space-y-2.5 text-[11px]"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bangla font-semibold text-[var(--ink)]">
                                      পাতার কাগজ (১০টি রূপ):
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStyleBarOpen(false);
                                        setTemplateModalOpen(true);
                                      }}
                                      className="text-[11px] font-bangla text-[var(--accent)] hover:underline cursor-pointer"
                                    >
                                      সব টেমপ্লেট ও আবহ স্টুডিও →
                                    </button>
                                  </div>
                                  <PageVariationSwitcher
                                    value={activePageVariation}
                                    onChange={(nextVar) =>
                                      updateEntry(
                                        selectedEntry.id,
                                        { pageVariation: nextVar },
                                        true
                                      )
                                    }
                                    compact
                                  />
                                  <div className="pt-2 border-t border-dashed border-[#D5C0A1] dark:border-[#3A3025] flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1">
                                      <span className="font-bangla text-[var(--ink-soft)] mr-1">
                                        হাতের লেখা:
                                      </span>
                                      {WRITING_STYLE_PRESETS.map((ws) => (
                                        <button
                                          key={ws.id}
                                          type="button"
                                          data-testid={`writing-style-pill-${ws.id}`}
                                          onClick={() => handleChangeWritingStyle(ws.id)}
                                          className={`px-2 py-0.5 rounded-[4px] font-bangla border cursor-pointer ${
                                            activeWritingStyleId === ws.id
                                              ? 'bg-[#5B3D28] text-[#FDF8F0] border-[#D8A668]'
                                              : 'bg-[#FAF3E6] dark:bg-[#1E1913] text-[var(--ink)] border-[#CBB494] dark:border-[#3D3328]'
                                          }`}
                                        >
                                          {ws.nameBn}
                                        </button>
                                      ))}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bangla text-[var(--ink-soft)]">
                                        কালি:
                                      </span>
                                      {INK_COLOR_PRESETS.map((ink) => (
                                        <button
                                          key={ink.id}
                                          type="button"
                                          data-testid={`ink-color-pill-${ink.id}`}
                                          onClick={() => handleChangeInkColor(ink.id)}
                                          title={`${ink.nameBn} (${ink.nameEn})`}
                                          aria-label={`Select ${ink.nameEn} ink`}
                                          className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                                            activeInkColorId === ink.id
                                              ? 'scale-125 ring-2 ring-[#D8A668] border-white'
                                              : 'border-black/25 hover:scale-110'
                                          }`}
                                          style={{ backgroundColor: ink.swatchHex }}
                                        />
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => setStyleBarOpen(false)}
                                        aria-label="Close writing style bar"
                                        className="ml-1 p-0.5 text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Title Input with Fountain-Pen Scratch Acoustics */}
                            <input
                              ref={editorTitleRef}
                              type="text"
                              value={selectedEntry.title}
                              onKeyDown={() => playPenScratch()}
                              onChange={(e) =>
                                updateEntry(selectedEntry.id, { title: e.target.value })
                              }
                              onBlur={() => updateEntry(selectedEntry.id, {}, true)}
                              placeholder="শিরোনাম লিখুন / Give this page a title…"
                              aria-label="Entry title"
                              className={`w-full bg-transparent text-2xl sm:text-3xl font-bold focus:outline-none font-bangla shrink-0 ${
                                isNocturnalPage
                                  ? 'text-[#F5E9D7] placeholder:text-[#9E8C78]'
                                  : 'text-[var(--ink)] placeholder:text-[var(--ink-soft)]/50'
                              }`}
                            />

                            {/* Optional Subtitle Input */}
                            <input
                              type="text"
                              value={selectedEntry.subtitle}
                              onKeyDown={() => playPenScratch()}
                              onChange={(e) =>
                                updateEntry(selectedEntry.id, {
                                  subtitle: e.target.value,
                                })
                              }
                              onBlur={() => updateEntry(selectedEntry.id, {}, true)}
                              placeholder="উপশিরোনাম বা উৎসর্গ (ঐচ্ছিক) / Optional subtitle…"
                              aria-label="Entry subtitle"
                              className={`w-full bg-transparent text-xs sm:text-sm italic focus:outline-none font-bangla shrink-0 ${
                                isNocturnalPage
                                  ? 'text-[#C8B299] placeholder:text-[#8A7968]'
                                  : 'text-[var(--ink-soft)] placeholder:text-[var(--ink-soft)]/45'
                              }`}
                            />

                            <div className="shrink-0">
                              <VintageTitleFlourish />
                            </div>

                            {/* Main Plain-Text Writing Area preserving exact Bangla/English newlines & stanza breaks */}
                            <textarea
                              ref={editorTextareaRef}
                              value={selectedEntry.content}
                              onScroll={handleManuscriptScroll}
                              onKeyDown={() => playPenScratch()}
                              onChange={(e) =>
                                updateEntry(selectedEntry.id, {
                                  content: e.target.value,
                                })
                              }
                              onBlur={() => updateEntry(selectedEntry.id, {}, true)}
                              placeholder="আপনার মনের কথা, কবিতা বা দিনলিপি এখানে লিখুন… / Begin wherever your thoughts take you…"
                              aria-label="Journal writing content"
                              data-script={fontScript}
                              style={{
                                color: resolvedManuscriptInkColor,
                              }}
                              className={`w-full flex-1 min-h-[160px] bg-transparent ${activeWritingStyle.fontSizeClass} ${activeWritingStyle.lineHeightClass} ${activeWritingStyle.alignClass} ${activeWritingStyle.indentClass} ${
                                activeWritingStyle.letterSpacingClass || ''
                              } focus:outline-none resize-none overflow-y-auto pr-2 journal-content ${
                                isNocturnalPage
                                  ? 'placeholder:text-[#8E7D6B]'
                                  : 'placeholder:text-[var(--ink-soft)]/55'
                              }`}
                            />

                            {selectedEntry.type === 'quote' && (
                              <input
                                type="text"
                                value={selectedEntry.attribution}
                                onKeyDown={() => playPenScratch()}
                                onChange={(e) =>
                                  updateEntry(selectedEntry.id, {
                                    attribution: e.target.value,
                                  })
                                }
                                placeholder="— উৎস বা লেখকের নাম / Attribution…"
                                aria-label="Quote attribution"
                                className="w-full bg-transparent text-sm italic text-[var(--ink-soft)] border-b border-[#D8C5AA] dark:border-[#4A3E32] pb-1.5 focus:outline-none font-bangla shrink-0"
                              />
                            )}
                          </div>

                          {/* Clean Single-Line Editor Bottom Bar with Collapsible Metadata/Tag Drawer */}
                          <div className="relative pt-2 border-t border-[#D8C5AA] dark:border-[#353028] shrink-0">
                            {editorDetailsOpen && (
                              <div className="absolute left-0 right-0 bottom-full mb-2 z-30 p-3.5 rounded-[10px] bg-[#FAF1E0] dark:bg-[#231D16] border border-[#BEA37E] dark:border-[#4F4234] shadow-[0_14px_34px_rgba(20,10,4,0.38)] space-y-3">
                                <div className="flex items-center justify-between text-xs font-bangla">
                                  <span className="font-semibold text-[var(--ink)]">
                                    পাতার ধরন, সংকলন, অনুভব ও ট্যাগ
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditorDetailsOpen(false)}
                                    aria-label="Close page details"
                                    className="text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                  <div className="space-y-1">
                                    <span className="text-[11px] font-bangla text-[var(--ink-soft)] block">
                                      Category (ধরন)
                                    </span>
                                    <ArchivalSelect
                                      value={selectedEntry.type}
                                      onChange={(val) =>
                                        updateEntry(
                                          selectedEntry.id,
                                          { type: val as EntryType },
                                          true
                                        )
                                      }
                                      ariaLabel="Category (ধরন)"
                                      compact
                                      className="w-full"
                                      options={[
                                        { value: 'diary', label: 'Diary (দিনলিপি)' },
                                        { value: 'poem', label: 'Poem (কবিতা)' },
                                        { value: 'quote', label: 'Quote (উদ্ধৃতি)' },
                                        { value: 'fragment', label: 'Fragment (টুকরো ভাবনা)' },
                                        { value: 'prose', label: 'Prose (গদ্য)' },
                                      ]}
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[11px] font-bangla text-[var(--ink-soft)] block">
                                      Collection (সংকলন)
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <ArchivalSelect
                                        value={selectedEntry.collectionId}
                                        onChange={(val) =>
                                          updateEntry(
                                            selectedEntry.id,
                                            { collectionId: val },
                                            true
                                          )
                                        }
                                        ariaLabel="Collection (সংকলন)"
                                        compact
                                        className="w-full flex-1 min-w-0"
                                        options={[
                                          { value: '', label: 'সংকলন নেই' },
                                          ...collections.map((c) => ({
                                            value: c.id,
                                            label: c.name,
                                          })),
                                        ]}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setNewCollectionModalOpen(true)}
                                        title="Create new collection"
                                        aria-label="Create new collection"
                                        className="p-1.5 rounded-[5px] bg-[#E5D3B8] dark:bg-[#332C23] border border-[#BEA37E] text-[#2B1E16] dark:text-[#EAE4D7] shrink-0 hover:bg-[#DAC2A0]"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[11px] font-bangla text-[var(--ink-soft)] block">
                                      Mood (অনুভব)
                                    </span>
                                    <ArchivalSelect
                                      value={selectedEntry.mood}
                                      onChange={(val) =>
                                        updateEntry(
                                          selectedEntry.id,
                                          { mood: val as EntryMood },
                                          true
                                        )
                                      }
                                      ariaLabel="Mood (অনুভব)"
                                      compact
                                      className="w-full"
                                      options={[
                                        { value: '', label: 'No mood (নিরপেক্ষ)' },
                                        ...ENTRY_MOODS.map((m) => ({
                                          value: m.value,
                                          label: `${m.value} (${m.bangla})`,
                                        })),
                                      ]}
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-[11px] font-bangla text-[var(--ink-soft)] block">
                                      Status (অবস্থা)
                                    </span>
                                    <ArchivalSelect
                                      value={selectedEntry.status}
                                      onChange={(val) =>
                                        updateEntry(
                                          selectedEntry.id,
                                          { status: val as EntryStatus },
                                          true
                                        )
                                      }
                                      ariaLabel="Status (অবস্থা)"
                                      compact
                                      className="w-full"
                                      options={[
                                        { value: 'complete', label: 'Complete (সম্পূর্ণ)' },
                                        { value: 'draft', label: 'Draft (খসড়া)' },
                                        { value: 'archived', label: 'Archived (আর্কাইভ)' },
                                      ]}
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-dashed border-[#D5C0A1] dark:border-[#3A3025]">
                                  {selectedEntry.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[5px] bg-[#E5D3BA] dark:bg-[#332C24] border border-[#C5AB89] dark:border-[#4A3E32] text-xs text-[#2B1E16] dark:text-[#EAE4D7] font-bangla"
                                    >
                                      #{tag}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTagFromSelected(tag)}
                                        aria-label={`Remove tag ${tag}`}
                                        className="hover:text-[var(--danger)]"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                  <form
                                    onSubmit={handleAddTagToSelected}
                                    className="inline-flex"
                                  >
                                    <input
                                      type="text"
                                      value={newTagInput}
                                      onChange={(e) => setNewTagInput(e.target.value)}
                                      placeholder="+ ট্যাগ যোগ করুন…"
                                      aria-label="Add tag"
                                      list="versevault-tags-datalist"
                                      className="px-2.5 py-0.5 text-xs bg-[#FAF3E8] dark:bg-[#2B2620] border border-[#C5AB89] dark:border-[#423B31] rounded-[5px] text-[#2B1E16] dark:text-[#EAE4D7] w-32 focus:outline-none font-bangla"
                                    />
                                    <datalist id="versevault-tags-datalist">
                                      {tags.map((t) => (
                                        <option key={t.id} value={t.name} />
                                      ))}
                                    </datalist>
                                  </form>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  data-testid="toggle-editor-details"
                                  onClick={() => setEditorDetailsOpen((v) => !v)}
                                  className="px-2.5 py-1 rounded-[5px] bg-[#E6D4BA]/85 dark:bg-[#322A21] border border-[#BEA37E] dark:border-[#4F4234] text-[11px] font-bangla text-[var(--ink)] flex items-center gap-1.5 cursor-pointer hover:bg-[#DEC6A4]"
                                >
                                  <span>
                                    পাতার তথ্য ও ট্যাগ ({selectedEntry.type}
                                    {selectedEntry.tags.length > 0
                                      ? ` · #${toBanglaDigits(selectedEntry.tags.length)}`
                                      : ''}
                                    )
                                  </span>
                                </button>

                                {/* Poetic & Literary Quick-Insert Helpers */}
                                <ParchmentPlateButton
                                  size="xs"
                                  onClick={() => insertTextAtCursor('। ')}
                                  title="Insert Bangla Dari (।)"
                                >
                                  ।
                                </ParchmentPlateButton>
                                <ParchmentPlateButton
                                  size="xs"
                                  onClick={() => insertTextAtCursor(' — ')}
                                  title="Insert Em-Dash (—)"
                                >
                                  —
                                </ParchmentPlateButton>
                                <ParchmentPlateButton
                                  size="xs"
                                  onClick={() => insertTextAtCursor('\n\n❖\n\n')}
                                  title="Insert Stanza Divider (❖)"
                                >
                                  ❖ স্তবক
                                </ParchmentPlateButton>
                              </div>

                              {settings.showWordCount && (
                                <span className="text-[11px] text-[var(--ink-soft)] tabular-nums font-bangla">
                                  {toBanglaDigits(countWords(selectedEntry.content))}{' '}
                                  শব্দ ·{' '}
                                  {toBanglaDigits(
                                    countCharacters(selectedEntry.content)
                                  )}{' '}
                                  অক্ষর
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* ==============================================================
                           RIGHT PAGE READING VIEW (Clean Book Typography & Unified Controls)
                           ============================================================== */
                        <>
                          {/* Top-Right Plum-Blossom Branch & Full Moon Watercolor when on Poetry Scroll */}
                          {activePageVariation === 'poetry-scroll' && (
                            <PlumBlossomMoonCorner />
                          )}

                          <div className="space-y-3 z-10 flex-1 min-h-0 flex flex-col overflow-hidden">
                            {/* Mobile Back Header (`← Poems / Back to List`) */}
                            <div className="flex lg:hidden items-center justify-between pb-2 border-b border-[#D8C5AA]/60 dark:border-[#3F372C]/60 shrink-0">
                              <button
                                type="button"
                                onClick={() => setMobileView('left-page')}
                                className="inline-flex items-center gap-1.5 text-sm font-literary font-semibold text-[var(--ink)]"
                              >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="capitalize">
                                  {selectedEntry.type === 'poem'
                                    ? 'Poems'
                                    : selectedEntry.type === 'quote'
                                    ? 'Quotes'
                                    : 'Diary'}
                                </span>
                              </button>
                              <span className="text-xs font-bangla text-[var(--ink-soft)]">
                                পাতা{' '}
                                {toBanglaDigits(
                                  currentEntryPageIndex >= 0
                                    ? currentEntryPageIndex + 1
                                    : 1
                                )}{' '}
                                / {toBanglaDigits(Math.max(1, bookIndexEntries.length))}
                              </span>
                            </div>

                            {/* Single Clean Top Date & Action Row (with Unified Page/Style/Ink Popover) */}
                            <div className="relative flex items-center justify-between gap-2 text-xs sm:text-sm shrink-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <time
                                  dateTime={selectedEntry.entryDate}
                                  className={`font-bangla font-medium ${
                                    isNocturnalPage
                                      ? 'text-[#D8C3A5]'
                                      : 'text-[#5A4636] dark:text-[#B8A896]'
                                  }`}
                                >
                                  {selectedEntry.language === 'en'
                                    ? formatEditorialDate(selectedEntry.entryDate)
                                    : formatBanglaFullDate(
                                        selectedEntry.entryDate,
                                        true
                                      )}
                                </time>
                                {selectedCollection && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigateTo('collection-detail', {
                                        collectionId: selectedCollection.id,
                                      });
                                      setLeftPageMode('collection-entries');
                                      setMobileView('left-page');
                                    }}
                                    className="text-xs font-bangla text-[var(--accent)] hover:underline cursor-pointer"
                                  >
                                    · {selectedCollection.name}
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 relative">
                                {activePageVariation === 'epistolary-letter' && (
                                  <div className="hidden sm:block mr-1">
                                    <EpistolaryWaxSealStamp />
                                  </div>
                                )}

                                <button
                                  type="button"
                                  data-testid="mark-leaving-place-btn"
                                  onClick={handleMarkReadingPlace}
                                  title="পড়া বা লেখা এখানেই চিহ্নিত করে রাখুন যেন পরেরবার এখান থেকেই শুরু হয়"
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-[5px] text-[11px] font-bangla border transition-all cursor-pointer ${
                                    readingBookmark?.entryId === selectedEntry.id
                                      ? 'bg-[#6E1F19] text-[#FCEFD9] border-[#DFB578]'
                                      : 'bg-[#E6D4BA]/85 dark:bg-[#322A21] hover:bg-[#DEC6A4] text-[var(--ink)] border-[#BEA37E] dark:border-[#4F4234]'
                                  }`}
                                >
                                  <BookMarked className="w-3 h-3 text-[#8B2626] dark:text-[#D8A668]" />
                                  <span>
                                    {readingBookmark?.entryId === selectedEntry.id
                                      ? 'ফিতা হালনাগাদ'
                                      : 'ফিতা রাখুন'}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  data-testid="toggle-writing-style-bar"
                                  onClick={() => setStyleBarOpen((v) => !v)}
                                  title="পাতার কাগজ, হাতের লেখার ধরন ও ফাউন্টেন পেনের কালি পরিবর্তন করুন"
                                  className="px-2 py-1 rounded-[5px] bg-[#E6D4BA]/85 dark:bg-[#322A21] border border-[#BEA37E] dark:border-[#4F4234] text-[11px] font-bangla text-[var(--ink)] flex items-center gap-1 shrink-0 cursor-pointer hover:bg-[#DEC6A4]"
                                >
                                  <Feather className="w-3 h-3 text-[#754832] dark:text-[#D8A668]" />
                                  <span>পাতা ও কালি</span>
                                </button>

                                <ParchmentPlateButton
                                  onClick={() => {
                                    if (!isAdmin) {
                                      setAdminLoginModalOpen(true);
                                    } else {
                                      setIsEditingOnRightPage(true);
                                    }
                                  }}
                                  ariaLabel="Edit this entry"
                                  title="Edit on page (সম্পাদনা)"
                                  compact
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>সম্পাদনা</span>
                                </ParchmentPlateButton>

                                {isAdmin ? (
                                  <button
                                    type="button"
                                    onClick={handleOpenEntryLockModal}
                                    aria-label={selectedEntry.isLocked ? 'Change entry lock' : 'Set password lock'}
                                    title={selectedEntry.isLocked ? 'পাতা তালাবদ্ধ (Password protected)' : 'পাসওয়ার্ড লক সেট করুন'}
                                    className="p-1.5 rounded-[5px] border border-transparent hover:border-[#C4AA87] dark:hover:border-[#5A4A38] hover:bg-[#E5D3B8]/70 dark:hover:bg-[#3A3226]/80 transition-colors text-[#4A3728] dark:text-[#D8C3A5] cursor-pointer"
                                  >
                                    {selectedEntry.isLocked ? (
                                      <Lock className="w-3.5 h-3.5 text-[#8B3A32] dark:text-[#E08D85]" />
                                    ) : (
                                      <Unlock className="w-3.5 h-3.5 text-[var(--ink-soft)]" />
                                    )}
                                  </button>
                                ) : selectedEntry.isLocked && isEntryUnlockedForViewer(selectedEntry) ? (
                                  <button
                                    type="button"
                                    onClick={() => lockEntryAgain(selectedEntry.id)}
                                    title="পুনরায় তালাবদ্ধ করুন (Re-lock this page)"
                                    className="p-1.5 rounded-[5px] border border-[#B8976C] text-[#8B3A32] dark:text-[#D8A668] cursor-pointer"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </button>
                                ) : null}

                                <button
                                  type="button"
                                  onClick={() => setMoreMenuOpen((v) => !v)}
                                  aria-label="More entry options"
                                  className="p-1.5 rounded-[5px] border border-transparent hover:border-[#C4AA87] dark:hover:border-[#5A4A38] hover:bg-[#E5D3B8]/70 dark:hover:bg-[#3A3226]/80 transition-colors text-[#4A3728] dark:text-[#D8C3A5] cursor-pointer"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {moreMenuOpen && (
                                  <div className="absolute right-0 top-9 z-30 w-56 rounded-[8px] bg-gradient-to-b from-[#FAF3E6] to-[#EFE1CA] dark:from-[#262019] dark:to-[#1E1913] border border-[#B89B74] dark:border-[#4A3D2E] shadow-[0_14px_30px_rgba(24,14,7,0.38)] py-1.5 text-xs text-[var(--ink)]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleCopyContent();
                                        setMoreMenuOpen(false);
                                      }}
                                      className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-[#E4D1B5]/70 dark:hover:bg-[#322920]"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy exact text</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const md = formatEntryAsMarkdown(
                                          selectedEntry,
                                          selectedCollection?.name
                                        );
                                        triggerTextDownload(
                                          `${selectedEntry.entryDate}-${toSafeFilenameSlug(
                                            selectedEntry.title || 'entry'
                                          )}.md`,
                                          md,
                                          'text/markdown;charset=utf-8'
                                        );
                                        setMoreMenuOpen(false);
                                      }}
                                      className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-[#E4D1B5]/70 dark:hover:bg-[#322920]"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Export as Markdown (.md)</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const txt = formatEntryAsPlainText(
                                          selectedEntry,
                                          selectedCollection?.name
                                        );
                                        triggerTextDownload(
                                          `${selectedEntry.entryDate}-${toSafeFilenameSlug(
                                            selectedEntry.title || 'entry'
                                          )}.txt`,
                                          txt,
                                          'text/plain;charset=utf-8'
                                        );
                                        setMoreMenuOpen(false);
                                      }}
                                      className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-[#E4D1B5]/70 dark:hover:bg-[#322920]"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Export as Plain Text (.txt)</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleDuplicateEntry}
                                      className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-[#E4D1B5]/70 dark:hover:bg-[#322920]"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Duplicate page</span>
                                    </button>
                                    {selectedEntry.status === 'archived' ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          restoreFromArchive(selectedEntry.id);
                                          setMoreMenuOpen(false);
                                        }}
                                        className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-[#E4D1B5]/70 dark:hover:bg-[#322920]"
                                      >
                                        <Archive className="w-3.5 h-3.5" />
                                        <span>Restore from Archive</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          archiveEntry(selectedEntry.id);
                                          setMoreMenuOpen(false);
                                        }}
                                        className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-[#E4D1B5]/70 dark:hover:bg-[#322920]"
                                      >
                                        <Archive className="w-3.5 h-3.5" />
                                        <span>Archive entry</span>
                                      </button>
                                    )}
                                    <div className="my-1 border-t border-[#D8C5AA]/70 dark:border-[#3A3127]" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMoreMenuOpen(false);
                                        handleTrashCurrentEntry(
                                          selectedEntry.id,
                                          selectedEntry.title
                                        );
                                      }}
                                      aria-label="Move entry to trash"
                                      className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-[var(--danger)] hover:bg-[#E4D1B5]/70 dark:hover:bg-[#322920]"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Move to trash (ট্র্যাশে সরান)</span>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Unified Floating Page Surface, Writing Style & Ink Popover */}
                              {styleBarOpen && (
                                <div
                                  data-testid="writing-style-ink-bar"
                                  className="absolute left-0 right-0 top-full mt-1.5 z-30 p-3 rounded-[8px] bg-[#FAF1E0] dark:bg-[#231D16] border border-[#BEA37E] dark:border-[#4F4234] shadow-[0_14px_32px_rgba(20,10,4,0.34)] space-y-2.5 text-[11px]"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bangla font-semibold text-[var(--ink)]">
                                      পাতার কাগজ (১০টি রূপ):
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStyleBarOpen(false);
                                        setTemplateModalOpen(true);
                                      }}
                                      className="text-[11px] font-bangla text-[var(--accent)] hover:underline cursor-pointer"
                                    >
                                      সব টেমপ্লেট ও আবহ স্টুডিও →
                                    </button>
                                  </div>
                                  <PageVariationSwitcher
                                    value={activePageVariation}
                                    onChange={(nextVar) =>
                                      updateEntry(
                                        selectedEntry.id,
                                        { pageVariation: nextVar },
                                        true
                                      )
                                    }
                                    compact
                                  />
                                  <div className="pt-2 border-t border-dashed border-[#D5C0A1] dark:border-[#3A3025] flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1">
                                      <span className="font-bangla text-[var(--ink-soft)] mr-1">
                                        হাতের লেখা:
                                      </span>
                                      {WRITING_STYLE_PRESETS.map((ws) => (
                                        <button
                                          key={ws.id}
                                          type="button"
                                          data-testid={`writing-style-pill-${ws.id}`}
                                          onClick={() => handleChangeWritingStyle(ws.id)}
                                          className={`px-2 py-0.5 rounded-[4px] font-bangla border cursor-pointer ${
                                            activeWritingStyleId === ws.id
                                              ? 'bg-[#5B3D28] text-[#FDF8F0] border-[#D8A668]'
                                              : 'bg-[#FAF3E6] dark:bg-[#1E1913] text-[var(--ink)] border-[#CBB494] dark:border-[#3D3328]'
                                          }`}
                                        >
                                          {ws.nameBn}
                                        </button>
                                      ))}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bangla text-[var(--ink-soft)]">
                                        কালি:
                                      </span>
                                      {INK_COLOR_PRESETS.map((ink) => (
                                        <button
                                          key={ink.id}
                                          type="button"
                                          data-testid={`ink-color-pill-${ink.id}`}
                                          onClick={() => handleChangeInkColor(ink.id)}
                                          title={`${ink.nameBn} (${ink.nameEn})`}
                                          aria-label={`Select ${ink.nameEn} ink`}
                                          className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                                            activeInkColorId === ink.id
                                              ? 'scale-125 ring-2 ring-[#D8A668] border-white'
                                              : 'border-black/25 hover:scale-110'
                                          }`}
                                          style={{ backgroundColor: ink.swatchHex }}
                                        />
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => setStyleBarOpen(false)}
                                        aria-label="Close writing style bar"
                                        className="ml-1 p-0.5 text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {copiedToast && (
                              <p className="text-xs text-[#556B45] flex items-center gap-1 shrink-0">
                                <Check className="w-3.5 h-3.5" />
                                Copied exact original text to clipboard.
                              </p>
                            )}

                            {/* Scrollable Manuscript Body Container — keeps page height fixed on long entries */}
                            <div
                              ref={attachManuscriptScrollRef}
                              onScroll={handleManuscriptScroll}
                              data-testid="right-page-manuscript-scroll"
                              className="flex-1 min-h-0 overflow-y-auto pr-2 sm:pr-4 space-y-3"
                            >
                              {/* Title Row */}
                              <div className="pt-1">
                                <h1
                                  onDoubleClick={() => setIsEditingOnRightPage(true)}
                                  title="Double-click to edit title"
                                  className={`text-2xl sm:text-[30px] font-bold tracking-tight leading-snug journal-content cursor-text ${
                                    isNocturnalPage
                                      ? 'text-[#F7EBD9]'
                                      : 'text-[#2B1E16] dark:text-[#EAE4D7]'
                                  }`}
                                  data-script={fontScript}
                                >
                                  {selectedEntry.title ||
                                    `Untitled ${selectedEntry.type}`}
                                </h1>
                                {selectedEntry.subtitle && (
                                  <p
                                    className={`text-sm italic mt-1 journal-content ${
                                      isNocturnalPage
                                        ? 'text-[#C8B299]'
                                        : 'text-[var(--ink-soft)]'
                                    }`}
                                    data-script={fontScript}
                                  >
                                    {selectedEntry.subtitle}
                                  </p>
                                )}
                                <VintageTitleFlourish />
                              </div>
                              {selectedEntry.isLocked &&
                              !isEntryUnlockedForViewer(selectedEntry) &&
                              !isAdmin ? (
                                <div className="my-4 sm:my-6 py-6 px-5 max-w-md mx-auto text-center rounded-[14px] bg-[#FAF3E6]/90 dark:bg-[#231C16]/90 border-2 border-[#8E6544]/70 shadow-[0_12px_28px_rgba(20,10,4,0.15)] space-y-4">
                                  <div className="w-14 h-14 mx-auto rounded-full bg-[#E8D7BE] dark:bg-[#32281F] border border-[#A8824C] flex items-center justify-center shadow-inner">
                                    <Lock className="w-7 h-7 text-[#8C5A36] dark:text-[#E2B77B]" />
                                  </div>
                                  <div className="space-y-1">
                                    <h3 className="text-lg font-bold font-bangla text-[var(--ink)]">
                                      তালাবদ্ধ ব্যক্তিগত পাতা
                                    </h3>
                                    <p className="text-xs text-[var(--ink-soft)] font-bangla">
                                      এই পাতার অন্তর্লীন কথাগুলো পড়ার জন্য গোপন পাসওয়ার্ড প্রয়োজন।
                                    </p>
                                    {selectedEntry.lockHint && (
                                      <div className="inline-block mt-1 px-3 py-1 rounded-[6px] bg-[#EADECE] dark:bg-[#2F261E] border border-[#C5AA87] dark:border-[#4A3E32] text-xs font-bangla text-[#5A3F2A] dark:text-[#E2C79E]">
                                        <span className="font-semibold">ইঙ্গিত (Hint):</span> {selectedEntry.lockHint}
                                      </div>
                                    )}
                                  </div>

                                  <form onSubmit={handleUnlockSubmit} className="space-y-3 pt-2">
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                      <input
                                        type="password"
                                        value={unlockAttemptInput}
                                        onChange={(e) => {
                                          setUnlockAttemptInput(e.target.value);
                                          setUnlockErrorMsg('');
                                        }}
                                        placeholder="পাসওয়ার্ড লিখুন…"
                                        aria-label="Unlock password"
                                        className="w-full sm:w-56 px-3 py-2 text-center text-sm bg-[#FFFDF8] dark:bg-[#18130E] border-2 border-[#BEA37E] rounded-[6px] text-[var(--ink)] focus:outline-none focus:border-[#7E5A3C]"
                                        autoFocus
                                      />
                                      <LeatherClaspButton type="submit" compact>
                                        <KeyRound className="w-3.5 h-3.5 text-[#DFB578]" />
                                        <span>আনলক করুন</span>
                                      </LeatherClaspButton>
                                    </div>

                                    {unlockErrorMsg && (
                                      <p className="text-xs text-[var(--danger)] font-bangla font-medium">
                                        {unlockErrorMsg}
                                      </p>
                                    )}
                                  </form>

                                  <div className="pt-3 border-t border-dashed border-[#CBB393] dark:border-[#3D342A] text-xs">
                                    <button
                                      type="button"
                                      onClick={() => setAdminLoginModalOpen(true)}
                                      className="text-[var(--ink-soft)] hover:text-[var(--accent)] underline font-bangla cursor-pointer"
                                    >
                                      আপনি কি এই ডায়েরির মালিক? Google দিয়ে লগইন করুন
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Main Poem / Diary Content preserving every stanza & newline */}
                                  <div
                                    onDoubleClick={() => {
                                      if (isAdmin) {
                                        setIsEditingOnRightPage(true);
                                      } else {
                                        setAdminLoginModalOpen(true);
                                      }
                                    }}
                                    title={isAdmin ? 'Double-click anywhere on the page to edit' : undefined}
                                    style={{
                                      color: resolvedManuscriptInkColor,
                                    }}
                                    className={`pt-1 pr-2 sm:pr-12 ${activeWritingStyle.fontSizeClass} ${activeWritingStyle.lineHeightClass} ${activeWritingStyle.alignClass} ${activeWritingStyle.indentClass} ${
                                      activeWritingStyle.letterSpacingClass || ''
                                    } ${
                                      activeWritingStyle.dropCap ? 'drop-cap-manuscript' : ''
                                    } journal-content ${isAdmin ? 'cursor-text' : 'cursor-default'}`}
                                    data-script={fontScript}
                                    data-writing-style={activeWritingStyleId}
                                    data-ink-color={activeInkColorId}
                                  >
                                    {selectedEntry.content}
                                  </div>

                                  {selectedEntry.type === 'quote' &&
                                    selectedEntry.attribution && (
                                      <p className="pt-2 text-sm italic text-[#5E4937] dark:text-[#B89F82] font-bangla">
                                        — {selectedEntry.attribution}
                                      </p>
                                    )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Quiet Literary Bottom Margin (Tags, Favorite & Classic Page-Turner Footer) */}
                          <div className="pt-2 mt-1.5 space-y-2 z-10 shrink-0">
                            <div className="flex items-center justify-between gap-3 pr-2 sm:pr-20">
                              <div className="flex flex-wrap items-center gap-1.5 font-bangla text-xs">
                                {selectedEntry.tags.map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                      playBrassClick();
                                      setActiveTagFilter(
                                        activeTagFilter === tag ? '' : tag
                                      );
                                      setLeftPageMode('list');
                                      setMobileView('left-page');
                                    }}
                                    className={`px-2 py-0.5 rounded-[4px] text-[11px] transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                                      activeTagFilter === tag
                                        ? 'bg-[#5B3D28] text-[#FDF8F0]'
                                        : 'text-[#5A412C] dark:text-[#D8C3A5] hover:underline'
                                    }`}
                                  >
                                    #{tag}
                                  </button>
                                ))}

                                {inlineTagAdderOpen ? (
                                  <form
                                    onSubmit={handleAddTagToSelected}
                                    className="inline-flex items-center"
                                  >
                                    <input
                                      type="text"
                                      value={newTagInput}
                                      onChange={(e) => setNewTagInput(e.target.value)}
                                      onBlur={() => setInlineTagAdderOpen(false)}
                                      placeholder="#ট্যাগ…"
                                      aria-label="New tag name"
                                      className="w-24 px-2 py-0.5 rounded-[4px] bg-[#FAF3E8] dark:bg-[#2B2620] border border-[#CBB699] dark:border-[#4A3E32] text-xs text-[#2B1E16] dark:text-[#EAE4D7] focus:outline-none font-bangla"
                                      autoFocus
                                    />
                                  </form>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setInlineTagAdderOpen(true)}
                                    className="text-[11px] text-[var(--ink-soft)] hover:text-[var(--ink)] font-bangla cursor-pointer"
                                  >
                                    + ট্যাগ
                                  </button>
                                )}

                                {selectedEntry.mood && (
                                  <span className="text-[11px] text-[var(--ink-soft)] italic">
                                    · {selectedEntry.mood}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  playInkStamp();
                                  toggleFavorite(selectedEntry.id);
                                }}
                                aria-label={
                                  selectedEntry.isFavorite
                                    ? 'Unfavorite this entry'
                                    : 'Love this entry'
                                }
                                className="p-1.5 rounded-full text-[#5E4937] dark:text-[#D8C3A5] hover:scale-110 transition-transform cursor-pointer"
                              >
                                <Heart
                                  className={`w-4 h-4 ${
                                    selectedEntry.isFavorite
                                      ? 'fill-[#8B3A32] text-[#8B3A32]'
                                      : ''
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Classic Book Page-Turner Footer */}
                            <div className="pt-2 border-t border-[#D8C5AA]/70 dark:border-[#353028] flex items-center justify-between gap-2 text-xs text-[var(--ink-soft)] pr-2 sm:pr-20">
                              <button
                                type="button"
                                disabled={currentEntryPageIndex <= 0}
                                onClick={() => handleTurnPage('prev')}
                                className="inline-flex items-center gap-1 py-0.5 font-bangla hover:text-[var(--ink)] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>পূর্ববর্তী পাতা</span>
                              </button>

                              <div className="flex items-center gap-1.5 font-bangla text-[11px] text-[var(--ink-soft)]">
                                <span className="font-medium text-[var(--ink)]">
                                  পাতা{' '}
                                  {toBanglaDigits(
                                    currentEntryPageIndex >= 0
                                      ? currentEntryPageIndex + 1
                                      : 1
                                  )}{' '}
                                  / {toBanglaDigits(Math.max(1, bookIndexEntries.length))}
                                </span>
                                <span className="hidden sm:inline">
                                  · {toBanglaDigits(readingMetrics.lines)} পঙক্তি · ~{readingMetrics.readMinsBn} মিনিট পাঠ
                                </span>
                              </div>

                              <button
                                type="button"
                                disabled={
                                  currentEntryPageIndex < 0 ||
                                  currentEntryPageIndex >= bookIndexEntries.length - 1
                                }
                                onClick={() => handleTurnPage('next')}
                                className="inline-flex items-center gap-1 py-0.5 font-bangla hover:text-[var(--ink)] disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
                              >
                                <span>পরবর্তী পাতা</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Authentic Fountain Pen Nib on Vintage Parchment */}
                          {activePageVariation === 'vintage-parchment' && (
                            <FountainPenBlossomsCorner />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================
            MOBILE BOTTOM NAVIGATION BAR (< lg, Inside Outer Leather Book Cover)
           ======================================================================== */}
        <nav
          aria-label="Mobile Quick Navigation"
          className="mt-2 rounded-[10px] lg:hidden bg-[#26180F]/95 border border-[#6E4E35] px-2 py-1.5 flex items-center justify-around text-[#CDB89E]"
        >
          <button
            type="button"
            onClick={() => selectNavMode('overview', 'journal', 'all')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-bangla ${
              leftPageMode === 'overview' && mobileView === 'left-page'
                ? 'text-[#D8A668] font-bold'
                : ''
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{bdGreeting.bangla}</span>
          </button>

          <button
            type="button"
            onClick={() => selectNavMode('list', 'journal', 'all')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-bangla ${
              leftPageMode === 'list' && mobileView === 'left-page'
                ? 'text-[#D8A668] font-bold'
                : ''
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>ডায়েরি</span>
          </button>

          <button
            type="button"
            onClick={() => handleStartNewEntry()}
            className="flex items-center justify-center w-10 h-10 -mt-3 rounded-full bg-gradient-to-b from-[#8B6343] to-[#5E4029] text-[#FFF8EE] shadow-lg border border-[#D8A668]/50"
            aria-label="Create new entry"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => selectNavMode('calendar', 'calendar', 'all')}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-bangla ${
              leftPageMode === 'calendar' && mobileView === 'left-page'
                ? 'text-[#D8A668] font-bold'
                : ''
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>ক্যালেন্ডার</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileView('right-page')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bangla ${
              mobileView === 'right-page' ? 'text-[#D8A668] font-bold' : ''
            }`}
          >
            <Feather className="w-4 h-4" />
            <span>পাতা</span>
          </button>

          <button
            type="button"
            onClick={() => selectNavMode('collections', 'collections', 'all')}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bangla ${
              leftPageMode === 'collections' && mobileView === 'left-page'
                ? 'text-[#D8A668] font-bold'
                : ''
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>সংকলন</span>
          </button>
        </nav>
      </motion.div>

      {/* Template, Page Variation, Desk Background & Writing Style Picker Modal */}
      <TemplatePickerModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSelectTemplate={handleApplyTemplate}
        onSelectBlankVariation={handleSelectBlankVariation}
        deskBackground={deskBackground}
        onChangeDeskBackground={handleChangeDeskBackground}
        writingStyle={activeWritingStyleId}
        onChangeWritingStyle={handleChangeWritingStyle}
        inkColor={activeInkColorId}
        onChangeInkColor={handleChangeInkColor}
      />

      {/* Custom Confirmation Dialog for Destructive Actions */}
      <ConfirmDialog
        open={confirmDialogState.open}
        title={confirmDialogState.title}
        description={confirmDialogState.description}
        onConfirm={confirmDialogState.onConfirm}
        onCancel={() =>
          setConfirmDialogState((prev) => ({ ...prev, open: false }))
        }
      />

      {/* Custom VerseVault Create Collection Modal */}
      <BookDialogFrame
        open={newCollectionModalOpen}
        ariaLabelledBy="create-collection-modal-title"
        eyebrow="Collections"
        title="নতুন সংকলন তৈরি করুন (New Collection)"
        onClose={() => setNewCollectionModalOpen(false)}
        closeLabel="Close new collection dialog"
        footer={
          <>
            <ParchmentPlateButton onClick={() => setNewCollectionModalOpen(false)}>
              বাতিল (Cancel)
            </ParchmentPlateButton>
            <LeatherClaspButton type="submit" form="create-collection-form" compact>
              <span>সংকলন তৈরি করুন</span>
            </LeatherClaspButton>
          </>
        }
      >
        <form id="create-collection-form" onSubmit={handleCreateNewCollection} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-bangla text-[var(--ink-soft)]">
              সংকলনের নাম (Name)
            </span>
            <input
              type="text"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              placeholder="যেমন: নিঃসঙ্গতার দিনলিপি…"
              aria-label="Collection name"
              className="w-full px-3 py-2 text-sm bg-[#FFFDF8] dark:bg-[#181410] border border-[#BEA37E] dark:border-[#4A3D2F] rounded-[6px] text-[var(--ink)] font-bangla focus:outline-none"
              autoFocus
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bangla text-[var(--ink-soft)]">
              সংক্ষিপ্ত বিবরণ (Description)
            </span>
            <textarea
              rows={2}
              value={newColDesc}
              onChange={(e) => setNewColDesc(e.target.value)}
              placeholder="এই সংকলনের বিষয়বস্তু…"
              aria-label="Collection description"
              className="w-full px-3 py-2 text-sm bg-[#FFFDF8] dark:bg-[#181410] border border-[#BEA37E] dark:border-[#4A3D2F] rounded-[6px] text-[var(--ink)] font-bangla focus:outline-none"
            />
          </label>

          <div className="block space-y-1">
            <span className="text-xs font-bangla text-[var(--ink-soft)] block">
              প্রচ্ছদ চিত্র (Cover Illustration Style)
            </span>
            <ArchivalSelect
              value={newColAccent}
              onChange={(val) => setNewColAccent(val)}
              ariaLabel="Cover Illustration Style"
              className="w-full"
              options={[
                {
                  value: 'walnut',
                  label: 'Open Book & Dried Blossoms (দাম্পত্য)',
                },
                {
                  value: 'slate',
                  label: 'Misty Mountain Ridges (পরিবার)',
                },
                {
                  value: 'ochre',
                  label: 'Solitary Sunset Tree (জীবনদর্শন)',
                },
                {
                  value: 'terracotta',
                  label: 'Rainy Evening Lantern (অভিমান)',
                },
                {
                  value: 'olive',
                  label: 'Moonlit Night Lake (নৈঃশব্দ্য)',
                },
                {
                  value: 'autumn',
                  label: 'Autumn Botanical Branch (খেরোখাতা)',
                },
              ]}
            />
          </div>
        </form>
      </BookDialogFrame>

      {/* Admin Login Modal — gated on the signed-in owner account */}
      <BookDialogFrame
        open={adminLoginModalOpen}
        ariaLabelledBy="admin-login-modal-title"
        eyebrow="Sign in"
        title="অ্যাডমিন প্রবেশ (Author Sign In)"
        onClose={() => {
          clearAuthError();
          setAdminLoginModalOpen(false);
        }}
        closeLabel="Close sign in dialog"
        footer={
          <ParchmentPlateButton
            onClick={() => {
              clearAuthError();
              setAdminLoginModalOpen(false);
            }}
          >
            পাঠক হিসেবে পড়ুন (Cancel / Read)
          </ParchmentPlateButton>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-[#8C5A36] dark:text-[#D8A668]" />
            <p className="text-xs text-[var(--ink-soft)] font-bangla leading-relaxed">
              এটি একটি ব্যক্তিগত ডায়েরি। লেখা যোগ, সম্পাদনা বা পাসওয়ার্ড লক সেট করতে মালিকের Google অ্যাকাউন্ট দিয়ে সাইন-ইন করুন।
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-[6px] bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-xs text-[var(--danger)] font-bangla">
              {authError}
            </div>
          )}

          <LeatherClaspButton
            onClick={() => void signInOwner()}
            variant="walnut"
            size="md"
            className="w-full"
          >
            <LogIn className="w-4 h-4 text-[#DFB578]" />
            <span>Google দিয়ে সাইন-ইন</span>
          </LeatherClaspButton>
        </div>
      </BookDialogFrame>

      {/* Entry Password Lock Configuration Modal */}
      <BookDialogFrame
        open={entryLockModalOpen && !!selectedEntry}
        ariaLabelledBy="entry-lock-modal-title"
        eyebrow="Security"
        title="পাতার পাসওয়ার্ড সুরক্ষা (Password Lock)"
        onClose={() => setEntryLockModalOpen(false)}
        closeLabel="Close password lock dialog"
        footer={
          <>
            <ParchmentPlateButton onClick={() => setEntryLockModalOpen(false)}>
              বাতিল (Cancel)
            </ParchmentPlateButton>
            <LeatherClaspButton type="submit" form="entry-lock-form" compact>
              <span>{entryLockPasswordDraft.trim() ? 'লক সেভ করুন' : 'উন্মুক্ত (Unlock) করুন'}</span>
            </LeatherClaspButton>
          </>
        }
      >
        <form id="entry-lock-form" onSubmit={handleSaveEntryPasswordLock} className="space-y-4">
          <div className="flex items-start gap-2.5">
            <Lock className="w-5 h-5 shrink-0 mt-0.5 text-[#8C5A36] dark:text-[#D8A668]" />
            <p className="text-xs text-[var(--ink-soft)] font-bangla leading-relaxed">
              পাসওয়ার্ড সেট করলে এই পাতা খুলতে আপনাকেও পাসওয়ার্ড দিতে হবে। ফিল্ড খালি রেখে সেভ করলে লক সরে যাবে। পাসওয়ার্ড সংরক্ষিত হয় না — শুধুমাত্র একটি derived hash ও salt Firestore-এ যায়।
            </p>
          </div>

          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-bangla text-[var(--ink-soft)]">
                গোপন পাসওয়ার্ড (Password — খালি রাখলে আনলক হবে)
              </span>
              <input
                type="password"
                value={entryLockPasswordDraft}
                onChange={(e) => setEntryLockPasswordDraft(e.target.value)}
                placeholder="যেমন: 1234 বা কোনো গোপন শব্দ…"
                aria-label="Entry password"
                className="w-full px-3 py-2 text-sm bg-[#FFFDF8] dark:bg-[#181410] border border-[#BEA37E] dark:border-[#4A3D2F] rounded-[6px] text-[var(--ink)] font-bangla focus:outline-none"
                autoFocus
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bangla text-[var(--ink-soft)]">
                পাসওয়ার্ডের ইঙ্গিত (Optional Hint for Readers)
              </span>
              <input
                type="text"
                value={entryLockHintDraft}
                onChange={(e) => setEntryLockHintDraft(e.target.value)}
                placeholder="যেমন: প্রথম পাতার তারিখ"
                aria-label="Password hint"
                className="w-full px-3 py-2 text-sm bg-[#FFFDF8] dark:bg-[#181410] border border-[#BEA37E] dark:border-[#4A3D2F] rounded-[6px] text-[var(--ink)] font-bangla focus:outline-none"
              />
            </label>
          </div>
        </form>
      </BookDialogFrame>

      {/* Ask My Archive Modal */}
      <AskMyArchiveModal
        isOpen={askArchiveModalOpen}
        onClose={() => setAskArchiveModalOpen(false)}
        entries={entries}
        collections={collections}
        onSelectEntry={(entryId) => {
          openEntryForReading(entryId);
          setMobileView('right-page');
        }}
      />
    </section>
  );
}
