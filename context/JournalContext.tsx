'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import {
  ActiveNavSection,
  EntryMood,
  EntryType,
  JournalCollection,
  JournalEntry,
  JournalSettings,
  JournalTag,
  PageVariation,
  SaveState,
} from '../types/entry';
import { AppearanceConfig } from '../types/appearance';
import { getStoredAppearanceConfig, saveStoredAppearanceConfig } from '../lib/appearance-storage';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../lib/firebase';
import {
  DEFAULT_OWNER_ID,
  INITIAL_COLLECTIONS,
  INITIAL_ENTRIES,
  INITIAL_SETTINGS,
  INITIAL_TAGS,
} from '../lib/seed-data';
import { countWords, detectScriptLanguage, getLocalTodayDateString } from '../lib/entry-utils';
import {
  sanitizeCollectionPayload,
  sanitizeEntryPayload,
  sanitizeSettingsPayload,
  sanitizeTagPayload,
} from '../lib/validations';

export const ADMIN_EMAIL = 'aalmamunsikder@gmail.com';

const STORAGE_KEYS = {
  entries: 'versevault_entries_v4',
  collections: 'versevault_collections_v4',
  tags: 'versevault_tags_v4',
  settings: 'versevault_settings_v4',
  initialized: 'versevault_initialized_v4',
  adminSession: 'versevault_admin_session_v4',
  unlockedEntries: 'versevault_unlocked_entries_v4',
};

export interface CreateEntryOptions {
  type?: EntryType;
  entryDate?: string;
  collectionId?: string;
  initialTitle?: string;
  initialSubtitle?: string;
  initialContent?: string;
  attribution?: string;
  mood?: EntryMood;
  tags?: string[];
  pageVariation?: PageVariation;
  isLocked?: boolean;
  lockPassword?: string;
  lockHint?: string;
}

interface JournalContextValue {
  user: User | null;
  isAdmin: boolean;
  adminEmail: string;
  authReady: boolean;
  authError: string | null;
  clearAuthError: () => void;
  adminLoginModalOpen: boolean;
  setAdminLoginModalOpen: (open: boolean) => void;
  isVaultLocked: boolean;
  setVaultLocked: (locked: boolean) => void;
  signInOwner: () => Promise<boolean>;
  verifyAdminWithPasskey: (email: string, passkey: string) => { ok: boolean; error?: string };
  signOutOwner: () => Promise<void>;

  unlockedEntryIds: string[];
  isEntryUnlockedForViewer: (entry: JournalEntry) => boolean;
  unlockEntryWithPassword: (entryId: string, passwordAttempt: string) => boolean;
  lockEntryAgain: (entryId: string) => void;
  setEntryPasswordLock: (entryId: string, isLocked: boolean, password?: string, hint?: string) => void;

  entries: JournalEntry[];
  collections: JournalCollection[];
  tags: JournalTag[];
  settings: JournalSettings;

  activeSection: ActiveNavSection;
  previousSection: ActiveNavSection;
  activeEntryId: string | null;
  activeCollectionId: string | null;
  selectedCalendarDate: string;
  globalSearchQuery: string;
  saveState: SaveState;
  lastSavedAt: string | null;

  navigateTo: (section: ActiveNavSection, options?: { entryId?: string; collectionId?: string; date?: string }) => void;
  setGlobalSearchQuery: (q: string) => void;
  setSelectedCalendarDate: (date: string) => void;

  createNewEntry: (options?: CreateEntryOptions) => JournalEntry;
  openEntryForEdit: (entryId: string) => void;
  openEntryForReading: (entryId: string) => void;
  updateEntry: (id: string, patch: Partial<JournalEntry>, immediateSave?: boolean) => void;
  retryFailedSave: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  archiveEntry: (id: string) => void;
  restoreFromArchive: (id: string) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  permanentlyDeleteEntry: (id: string) => void;

  createCollection: (name: string, description: string, accent: string) => JournalCollection;
  updateCollection: (id: string, patch: Partial<JournalCollection>) => void;
  deleteCollection: (id: string) => void;
  reorderCollection: (id: string, direction: 'up' | 'down') => void;

  ensureTagExists: (tagName: string) => void;
  deleteTag: (tagId: string) => void;

  updateSettings: (patch: Partial<JournalSettings>) => void;
  recordManualBackup: () => void;
  resetToSampleArchive: () => void;
  clearToBlankJournal: () => void;

  appearanceConfig: AppearanceConfig;
  appearanceStudioOpen: boolean;
  setAppearanceStudioOpen: (open: boolean) => void;
  updateAppearanceConfig: (patch: Partial<AppearanceConfig>) => void;
  setCollectionAppearanceOverride: (collectionId: string, override: Partial<AppearanceConfig>) => void;
}

const JournalContext = createContext<JournalContextValue | undefined>(undefined);

function timestampToIso(val: unknown, fallback: string): string {
  if (!val) return fallback;
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return fallback;
}

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [localAdminEmail, setLocalAdminEmail] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.adminSession);
      return saved === ADMIN_EMAIL ? ADMIN_EMAIL : null;
    } catch {
      return null;
    }
  });
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminLoginModalOpen, setAdminLoginModalOpen] = useState<boolean>(false);
  const [isVaultLocked, setVaultLocked] = useState<boolean>(false);
  const [unlockedEntryIds, setUnlockedEntryIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.unlockedEntries);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore
    }
    return [];
  });

  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    if (typeof window === 'undefined') return INITIAL_ENTRIES;
    try {
      const isInit = localStorage.getItem(STORAGE_KEYS.initialized);
      const savedEntries = localStorage.getItem(STORAGE_KEYS.entries);
      if (isInit && savedEntries) {
        const parsed = JSON.parse(savedEntries);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return INITIAL_ENTRIES;
  });
  const [collections, setCollections] = useState<JournalCollection[]>(() => {
    if (typeof window === 'undefined') return INITIAL_COLLECTIONS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.collections);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return INITIAL_COLLECTIONS;
  });
  const [tags, setTags] = useState<JournalTag[]>(() => {
    if (typeof window === 'undefined') return INITIAL_TAGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.tags);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return INITIAL_TAGS;
  });
  const [settings, setSettings] = useState<JournalSettings>(() => {
    if (typeof window === 'undefined') return INITIAL_SETTINGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.settings);
      if (saved) {
        return { ...INITIAL_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore
    }
    return INITIAL_SETTINGS;
  });
  const [appearanceConfig, setAppearanceConfigState] = useState<AppearanceConfig>(() => getStoredAppearanceConfig());
  const [appearanceStudioOpen, setAppearanceStudioOpen] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(true);

  // Sync theme attribute to document root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', appearanceConfig.appThemeId);
    }
  }, [appearanceConfig.appThemeId]);

  const [activeSection, setActiveSection] = useState<ActiveNavSection>('journal');
  const [previousSection, setPreviousSection] = useState<ActiveNavSection>('journal');
  const [activeEntryId, setActiveEntryId] = useState<string | null>('entry-2025-01-28-obhiman');
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('2025-01-28');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestVersionRef = useRef<Record<string, number>>({});

  const isFirebaseAdmin = Boolean(
    user &&
      user.email &&
      user.email.toLowerCase() === ADMIN_EMAIL &&
      user.emailVerified !== false
  );
  const isAdmin = isFirebaseAdmin || localAdminEmail === ADMIN_EMAIL;

  // Hydrate seed storage on client mount if first visit & test connection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    testFirestoreConnection();

    try {
      const isInit = localStorage.getItem(STORAGE_KEYS.initialized);
      if (!isInit) {
        localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(INITIAL_ENTRIES));
        localStorage.setItem(STORAGE_KEYS.collections, JSON.stringify(INITIAL_COLLECTIONS));
        localStorage.setItem(STORAGE_KEYS.tags, JSON.stringify(INITIAL_TAGS));
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(INITIAL_SETTINGS));
        localStorage.setItem(STORAGE_KEYS.initialized, 'true');
      }
    } catch (e) {
      console.error('Failed to write initial local journal cache:', e);
    }
  }, []);

  // Sync theme class on <html>
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const applyTheme = (mode: 'light' | 'dark') => {
      if (mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches ? 'dark' : 'light');
      const listener = (ev: MediaQueryListEvent) => applyTheme(ev.matches ? 'dark' : 'light');
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    } else {
      applyTheme(settings.theme);
    }
  }, [settings.theme]);

  // Persist to localStorage whenever local state updates
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed saving entries to localStorage:', e);
    }
  }, [entries, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.collections, JSON.stringify(collections));
    } catch (e) {
      console.error('Failed saving collections to localStorage:', e);
    }
  }, [collections, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.tags, JSON.stringify(tags));
    } catch (e) {
      console.error('Failed saving tags to localStorage:', e);
    }
  }, [tags, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed saving settings to localStorage:', e);
    }
  }, [settings, hydrated]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currUser) => {
      if (currUser && currUser.email && currUser.email.toLowerCase() !== ADMIN_EMAIL) {
        setAuthError(
          `শুধুমাত্র অ্যাডমিন (${ADMIN_EMAIL}) লেখা যোগ বা সম্পাদনা করতে পারবেন। (Signed-in email ${currUser.email} is not the Admin.)`
        );
        await signOut(auth);
        setUser(null);
        setAuthReady(true);
        return;
      }

      setUser(currUser);
      setAuthReady(true);
      if (currUser && currUser.email?.toLowerCase() === ADMIN_EMAIL) {
        setVaultLocked(false);
        setAdminLoginModalOpen(false);
        try {
          await setDoc(
            doc(db, 'profiles', currUser.uid),
            {
              userId: currUser.uid,
              displayName: (currUser.displayName || currUser.email || 'Journal Admin').slice(0, 120),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch {
          // Ignore if profile already exists with immutable createdAt
        }
      }
    });
    return () => unsub();
  }, []);

  // Attach Firestore listeners (Public non-trashed entries for visitors; all entries for Admin)
  useEffect(() => {
    if (!authReady) return;

    const entriesQuery = isFirebaseAdmin && user
      ? query(collection(db, 'entries'), where('userId', '==', user.uid))
      : query(collection(db, 'entries'), where('isTrashed', '==', false));

    const unsubEntries = onSnapshot(
      entriesQuery,
      (snap) => {
        if (snap.empty) return;
        const remoteEntries: JournalEntry[] = snap.docs.map((d) => {
          const data = d.data();
          const nowIso = new Date().toISOString();
          return {
            id: d.id,
            userId: data.userId,
            title: data.title ?? '',
            subtitle: data.subtitle ?? '',
            content: data.content ?? '',
            type: data.type ?? 'diary',
            status: data.status ?? 'draft',
            entryDate: data.entryDate ?? nowIso.slice(0, 10),
            mood: data.mood ?? '',
            language: data.language ?? 'en',
            isFavorite: Boolean(data.isFavorite),
            attribution: data.attribution ?? '',
            fontPreference: data.fontPreference ?? 'auto',
            pageVariation: data.pageVariation ?? 'vintage-parchment',
            wordCount: Number(data.wordCount ?? 0),
            collectionId: data.collectionId ?? '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            isLocked: Boolean(data.isLocked),
            lockPassword: data.lockPassword ?? '',
            lockHint: data.lockHint ?? '',
            isTrashed: Boolean(data.isTrashed),
            deletedAtIso: data.deletedAtIso ?? '',
            createdAt: timestampToIso(data.createdAt, nowIso),
            updatedAt: timestampToIso(data.updatedAt, nowIso),
          };
        });
        setEntries((prev) => {
          const map = new Map<string, JournalEntry>();
          for (const item of prev) map.set(item.id, item);
          for (const remote of remoteEntries) {
            const local = map.get(remote.id);
            if (!local || remote.updatedAt >= local.updatedAt) {
              map.set(remote.id, remote);
            }
          }
          return Array.from(map.values());
        });
      },
      (err) => {
        // Only log error if authenticated as Admin; unauthenticated visitors fall back to local archive seamlessly
        if (isFirebaseAdmin) {
          handleFirestoreError(err, OperationType.LIST, 'entries');
        }
      }
    );

    const colsQuery = isFirebaseAdmin && user
      ? query(collection(db, 'collections'), where('userId', '==', user.uid))
      : query(collection(db, 'collections'), where('sortOrder', '>=', 0));

    const unsubCols = onSnapshot(
      colsQuery,
      (snap) => {
        if (snap.empty) return;
        const remoteCols: JournalCollection[] = snap.docs.map((d) => {
          const data = d.data();
          const nowIso = new Date().toISOString();
          return {
            id: d.id,
            userId: data.userId,
            name: data.name ?? 'Untitled',
            description: data.description ?? '',
            accent: data.accent ?? 'walnut',
            sortOrder: Number(data.sortOrder ?? 0),
            createdAt: timestampToIso(data.createdAt, nowIso),
            updatedAt: timestampToIso(data.updatedAt, nowIso),
          };
        });
        setCollections(remoteCols.sort((a, b) => a.sortOrder - b.sortOrder));
      },
      (err) => {
        if (isFirebaseAdmin) {
          handleFirestoreError(err, OperationType.LIST, 'collections');
        }
      }
    );

    return () => {
      unsubEntries();
      unsubCols();
    };
  }, [authReady, isFirebaseAdmin, user]);

  // Persist a single entry to Firestore if authenticated as Firebase Admin
  const syncEntryToCloud = useCallback(
    async (entry: JournalEntry) => {
      if (!isFirebaseAdmin || !user) {
        setSaveState('saved');
        setLastSavedAt(new Date().toISOString());
        return;
      }
      const version = (latestVersionRef.current[entry.id] || 0) + 1;
      latestVersionRef.current[entry.id] = version;
      setSaveState('saving');

      const sanitized = sanitizeEntryPayload(entry, user.uid);
      const docRef = doc(db, 'entries', sanitized.id);

      try {
        await setDoc(docRef, {
          userId: user.uid,
          title: sanitized.title,
          subtitle: sanitized.subtitle,
          content: sanitized.content,
          type: sanitized.type,
          status: sanitized.status,
          entryDate: sanitized.entryDate,
          mood: sanitized.mood,
          language: sanitized.language,
          isFavorite: sanitized.isFavorite,
          attribution: sanitized.attribution,
          fontPreference: sanitized.fontPreference,
          pageVariation: sanitized.pageVariation || 'vintage-parchment',
          wordCount: sanitized.wordCount,
          collectionId: sanitized.collectionId,
          tags: sanitized.tags,
          isLocked: Boolean(sanitized.isLocked),
          lockPassword: sanitized.lockPassword || '',
          lockHint: sanitized.lockHint || '',
          isTrashed: sanitized.isTrashed,
          deletedAtIso: sanitized.deletedAtIso,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (latestVersionRef.current[entry.id] === version) {
          setSaveState('saved');
          setLastSavedAt(new Date().toISOString());
        }
      } catch (err) {
        console.error('Cloud autosave error (preserved locally):', err);
        if (latestVersionRef.current[entry.id] === version) {
          setSaveState('failed');
        }
      }
    },
    [isFirebaseAdmin, user]
  );

  const navigateTo = useCallback(
    (
      section: ActiveNavSection,
      options?: { entryId?: string; collectionId?: string; date?: string }
    ) => {
      setPreviousSection(activeSection);
      setActiveSection(section);
      if (options?.entryId !== undefined) setActiveEntryId(options.entryId);
      if (options?.collectionId !== undefined) setActiveCollectionId(options.collectionId);
      if (options?.date !== undefined) setSelectedCalendarDate(options.date);
    },
    [activeSection]
  );

  const createNewEntry = useCallback(
    (options?: CreateEntryOptions): JournalEntry => {
      const nowIso = new Date().toISOString();
      const ownerId = user?.uid || DEFAULT_OWNER_ID;
      const type = options?.type || settings.defaultEntryType || 'diary';
      const entryDate = options?.entryDate || getLocalTodayDateString();
      const initialContent = options?.initialContent ?? '';
      const initialTitle = options?.initialTitle ?? '';
      const initialSubtitle = options?.initialSubtitle ?? '';

      const newEntry: JournalEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: ownerId,
        title: initialTitle,
        subtitle: initialSubtitle,
        content: initialContent,
        type,
        status: 'draft',
        entryDate,
        mood: options?.mood ?? settings.defaultMood ?? '',
        language: detectScriptLanguage(initialContent || initialTitle),
        isFavorite: false,
        attribution: options?.attribution ?? '',
        fontPreference: settings.defaultFont || 'auto',
        pageVariation: options?.pageVariation ?? 'vintage-parchment',
        wordCount: countWords(initialContent),
        collectionId: options?.collectionId ?? '',
        tags: options?.tags ?? [],
        isLocked: Boolean(options?.isLocked),
        lockPassword: options?.lockPassword ?? '',
        lockHint: options?.lockHint ?? '',
        isTrashed: false,
        deletedAtIso: '',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      setEntries((prev) => [newEntry, ...prev]);
      setActiveEntryId(newEntry.id);
      setPreviousSection(activeSection);
      setActiveSection('editor');
      setSaveState('saved');
      setLastSavedAt(nowIso);

      // Register any initial template tags
      if (newEntry.tags.length > 0) {
        setTags((prevTags) => {
          const existingNormalized = new Set(prevTags.map((t) => t.normalizedName));
          const additions: JournalTag[] = [];
          for (const rawTag of newEntry.tags) {
            const norm = rawTag.trim().toLocaleLowerCase();
            if (norm && !existingNormalized.has(norm)) {
              existingNormalized.add(norm);
              additions.push({
                id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                userId: ownerId,
                name: rawTag.trim(),
                normalizedName: norm,
                createdAt: nowIso,
              });
            }
          }
          return additions.length > 0 ? [...prevTags, ...additions] : prevTags;
        });
      }

      if (isFirebaseAdmin && user) {
        void syncEntryToCloud(newEntry);
      }

      return newEntry;
    },
    [activeSection, isFirebaseAdmin, settings.defaultEntryType, settings.defaultFont, settings.defaultMood, syncEntryToCloud, user]
  );

  const openEntryForEdit = useCallback(
    (entryId: string) => {
      setPreviousSection(activeSection);
      setActiveEntryId(entryId);
      setActiveSection('editor');
      setSaveState('saved');
    },
    [activeSection]
  );

  const openEntryForReading = useCallback(
    (entryId: string) => {
      setPreviousSection(activeSection);
      setActiveEntryId(entryId);
      setActiveSection('reading');
    },
    [activeSection]
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<JournalEntry>, immediateSave = false) => {
      const nowIso = new Date().toISOString();
      let updatedRecord: JournalEntry | null = null;

      setEntries((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const nextContent = patch.content !== undefined ? patch.content : item.content;
          const nextTitle = patch.title !== undefined ? patch.title : item.title;
          const nextLang =
            patch.language !== undefined
              ? patch.language
              : detectScriptLanguage(nextContent || nextTitle);

          updatedRecord = {
            ...item,
            ...patch,
            language: nextLang,
            wordCount: countWords(nextContent),
            updatedAt: nowIso,
          };
          return updatedRecord;
        })
      );

      // Register any newly added tags
      if (patch.tags && patch.tags.length > 0) {
        setTags((prevTags) => {
          const existingNormalized = new Set(prevTags.map((t) => t.normalizedName));
          const additions: JournalTag[] = [];
          for (const rawTag of patch.tags!) {
            const norm = rawTag.trim().toLocaleLowerCase();
            if (norm && !existingNormalized.has(norm)) {
              existingNormalized.add(norm);
              additions.push({
                id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                userId: user?.uid || DEFAULT_OWNER_ID,
                name: rawTag.trim(),
                normalizedName: norm,
                createdAt: nowIso,
              });
            }
          }
          return additions.length > 0 ? [...prevTags, ...additions] : prevTags;
        });
      }

      if (!settings.autosaveEnabled && !immediateSave) {
        setSaveState('dirty');
        return;
      }

      setSaveState('saving');
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      const delay = immediateSave ? 50 : 650;
      saveTimerRef.current = setTimeout(() => {
        if (updatedRecord) {
          void syncEntryToCloud(updatedRecord);
        } else {
          setSaveState('saved');
          setLastSavedAt(new Date().toISOString());
        }
      }, delay);
    },
    [settings.autosaveEnabled, syncEntryToCloud, user]
  );

  const retryFailedSave = useCallback(
    async (id: string) => {
      const target = entries.find((e) => e.id === id);
      if (!target) return;
      await syncEntryToCloud(target);
    },
    [entries, syncEntryToCloud]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const target = entries.find((e) => e.id === id);
      if (!target) return;
      updateEntry(id, { isFavorite: !target.isFavorite }, true);
    },
    [entries, updateEntry]
  );

  const archiveEntry = useCallback(
    (id: string) => {
      updateEntry(id, { status: 'archived' }, true);
    },
    [updateEntry]
  );

  const restoreFromArchive = useCallback(
    (id: string) => {
      updateEntry(id, { status: 'complete' }, true);
    },
    [updateEntry]
  );

  const moveToTrash = useCallback(
    (id: string) => {
      updateEntry(id, { isTrashed: true, deletedAtIso: new Date().toISOString() }, true);
      if (activeEntryId === id && (activeSection === 'editor' || activeSection === 'reading')) {
        setActiveSection('journal');
      }
    },
    [activeEntryId, activeSection, updateEntry]
  );

  const restoreFromTrash = useCallback(
    (id: string) => {
      updateEntry(id, { isTrashed: false, deletedAtIso: '' }, true);
    },
    [updateEntry]
  );

  const permanentlyDeleteEntry = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (activeEntryId === id) {
        setActiveEntryId(null);
      }
      if (isFirebaseAdmin && user) {
        deleteDoc(doc(db, 'entries', id)).catch((err) => {
          console.error('Failed deleting entry from cloud:', err);
        });
      }
    },
    [activeEntryId, isFirebaseAdmin, user]
  );

  const isEntryUnlockedForViewer = useCallback(
    (entry: JournalEntry): boolean => {
      if (!entry.isLocked) return true;
      if (isAdmin) return true;
      return unlockedEntryIds.includes(entry.id);
    },
    [isAdmin, unlockedEntryIds]
  );

  const unlockEntryWithPassword = useCallback(
    (entryId: string, passwordAttempt: string): boolean => {
      const target = entries.find((e) => e.id === entryId);
      if (!target) return false;
      if (!target.isLocked) return true;
      const expected = (target.lockPassword || '').trim();
      const attempt = passwordAttempt.trim();
      if (expected && attempt === expected) {
        setUnlockedEntryIds((prev) => {
          const next = prev.includes(entryId) ? prev : [...prev, entryId];
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(STORAGE_KEYS.unlockedEntries, JSON.stringify(next));
          }
          return next;
        });
        return true;
      }
      return false;
    },
    [entries]
  );

  const lockEntryAgain = useCallback((entryId: string) => {
    setUnlockedEntryIds((prev) => {
      const next = prev.filter((id) => id !== entryId);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEYS.unlockedEntries, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const setEntryPasswordLock = useCallback(
    (entryId: string, isLocked: boolean, password?: string, hint?: string) => {
      const cleanPass = isLocked ? (password || '').trim() : '';
      const cleanHint = isLocked ? (hint || '').trim() : '';
      updateEntry(
        entryId,
        {
          isLocked: Boolean(isLocked && cleanPass.length > 0),
          lockPassword: cleanPass,
          lockHint: cleanHint,
        },
        true
      );
    },
    [updateEntry]
  );

  const createCollection = useCallback(
    (name: string, description: string, accent: string): JournalCollection => {
      const nowIso = new Date().toISOString();
      const ownerId = user?.uid || DEFAULT_OWNER_ID;
      const newCol = sanitizeCollectionPayload(
        {
          id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: ownerId,
          name,
          description,
          accent,
          sortOrder: collections.length + 1,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        ownerId
      );

      setCollections((prev) => [...prev, newCol]);

      if (isFirebaseAdmin && user) {
        setDoc(doc(db, 'collections', newCol.id), {
          userId: user.uid,
          name: newCol.name,
          description: newCol.description,
          accent: newCol.accent,
          sortOrder: newCol.sortOrder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) => console.error('Failed syncing collection:', err));
      }

      return newCol;
    },
    [collections.length, isFirebaseAdmin, user]
  );

  const updateCollection = useCallback(
    (id: string, patch: Partial<JournalCollection>) => {
      const nowIso = new Date().toISOString();
      setCollections((prev) =>
        prev.map((col) => (col.id === id ? { ...col, ...patch, updatedAt: nowIso } : col))
      );
    },
    []
  );

  const deleteCollection = useCallback(
    (id: string) => {
      setCollections((prev) => prev.filter((col) => col.id !== id));
      setEntries((prev) =>
        prev.map((e) => (e.collectionId === id ? { ...e, collectionId: '' } : e))
      );
      if (activeCollectionId === id) {
        setActiveCollectionId(null);
        if (activeSection === 'collection-detail') {
          setActiveSection('collections');
        }
      }
      if (isFirebaseAdmin && user) {
        deleteDoc(doc(db, 'collections', id)).catch((err) =>
          console.error('Failed deleting collection from cloud:', err)
        );
      }
    },
    [activeCollectionId, activeSection, isFirebaseAdmin, user]
  );

  const reorderCollection = useCallback((id: string, direction: 'up' | 'down') => {
    setCollections((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      return copy.map((c, i) => ({ ...c, sortOrder: i + 1 }));
    });
  }, []);

  const ensureTagExists = useCallback(
    (tagName: string) => {
      const clean = tagName.trim();
      if (!clean) return;
      const norm = clean.toLocaleLowerCase();
      setTags((prev) => {
        if (prev.some((t) => t.normalizedName === norm)) return prev;
        const newTag = sanitizeTagPayload(
          {
            id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            userId: user?.uid || DEFAULT_OWNER_ID,
            name: clean,
            normalizedName: norm,
            createdAt: new Date().toISOString(),
          },
          user?.uid || DEFAULT_OWNER_ID
        );
        return [...prev, newTag];
      });
    },
    [user]
  );

  const deleteTag = useCallback((tagId: string) => {
    setTags((prev) => {
      const target = prev.find((t) => t.id === tagId);
      if (target) {
        setEntries((entriesPrev) =>
          entriesPrev.map((e) => ({
            ...e,
            tags: e.tags.filter((t) => t.toLocaleLowerCase() !== target.normalizedName),
          }))
        );
      }
      return prev.filter((t) => t.id !== tagId);
    });
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<JournalSettings>) => {
      const nowIso = new Date().toISOString();
      setSettings((prev) => {
        const next = sanitizeSettingsPayload(
          { ...prev, ...patch, updatedAt: nowIso },
          user?.uid || DEFAULT_OWNER_ID
        );
        if (isFirebaseAdmin && user) {
          setDoc(doc(db, 'settings', user.uid), {
            ...next,
            updatedAt: serverTimestamp(),
          }).catch((err) => console.error('Failed syncing settings:', err));
        }
        return next;
      });
    },
    [isFirebaseAdmin, user]
  );

  const recordManualBackup = useCallback(() => {
    updateSettings({ lastBackupAt: new Date().toISOString() });
  }, [updateSettings]);

  const resetToSampleArchive = useCallback(() => {
    setEntries(INITIAL_ENTRIES);
    setCollections(INITIAL_COLLECTIONS);
    setTags(INITIAL_TAGS);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(INITIAL_ENTRIES));
      localStorage.setItem(STORAGE_KEYS.collections, JSON.stringify(INITIAL_COLLECTIONS));
      localStorage.setItem(STORAGE_KEYS.tags, JSON.stringify(INITIAL_TAGS));
    }
  }, []);

  const clearToBlankJournal = useCallback(() => {
    setEntries([]);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify([]));
    }
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const signInOwner = useCallback(async (): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const signedEmail = res.user?.email?.toLowerCase() || '';
      if (signedEmail !== ADMIN_EMAIL) {
        await signOut(auth);
        setAuthError(
          `অ্যাক্সেস অনুমোদিত নয়। শুধুমাত্র ${ADMIN_EMAIL} অ্যাকাউন্ট দিয়ে অ্যাডমিন লগইন করা যাবে।`
        );
        return false;
      }
      setVaultLocked(false);
      setAdminLoginModalOpen(false);
      if (activeSection === 'login') {
        setActiveSection('journal');
      }
      return true;
    } catch (err: any) {
      const msg =
        err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request'
          ? 'পপআপ ব্লক হয়েছে। নিচে আপনার অ্যাডমিন ইমেইল (aalmamunsikder@gmail.com) ও পাসকি দিয়ে প্রবেশ করুন।'
          : err?.message || 'Google লগইন সম্পন্ন করা যায়নি।';
      setAuthError(msg);
      return false;
    }
  }, [activeSection]);

  const verifyAdminWithPasskey = useCallback(
    (email: string, passkey: string): { ok: boolean; error?: string } => {
      setAuthError(null);
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== ADMIN_EMAIL) {
        const error = `শুধুমাত্র অ্যাডমিন ইমেইল (${ADMIN_EMAIL}) অনুমোদিত।`;
        setAuthError(error);
        return { ok: false, error };
      }
      const cleanPass = passkey.trim();
      if (!cleanPass || cleanPass.length < 4) {
        const error = 'সঠিক অ্যাডমিন পাসকি দিন (ন্যূনতম ৪ অক্ষর)।';
        setAuthError(error);
        return { ok: false, error };
      }
      setLocalAdminEmail(ADMIN_EMAIL);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.adminSession, ADMIN_EMAIL);
      }
      setVaultLocked(false);
      setAdminLoginModalOpen(false);
      if (activeSection === 'login') {
        setActiveSection('journal');
      }
      return { ok: true };
    },
    [activeSection]
  );

  const signOutOwner = useCallback(async () => {
    setAuthError(null);
    setLocalAdminEmail(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.adminSession);
    }
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  }, []);

  const updateAppearanceConfig = useCallback((patch: Partial<AppearanceConfig>) => {
    setAppearanceConfigState((prev) => {
      const next: AppearanceConfig = {
        ...prev,
        ...patch,
        colors: {
          ...prev.colors,
          ...(patch.colors || {}),
        },
        typography: {
          ...prev.typography,
          ...(patch.typography || {}),
        },
        decorations: {
          ...prev.decorations,
          ...(patch.decorations || {}),
        },
      };
      saveStoredAppearanceConfig(next);
      return next;
    });
  }, []);

  const setCollectionAppearanceOverride = useCallback((collectionId: string, override: Partial<AppearanceConfig>) => {
    setCollections((prev) => {
      const updated = prev.map((c) => {
        if (c.id === collectionId) {
          return {
            ...c,
            appearanceConfig: {
              ...(c.appearanceConfig || {}),
              ...override,
            },
          };
        }
        return c;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.collections, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const value = useMemo<JournalContextValue>(
    () => ({
      user,
      isAdmin,
      adminEmail: ADMIN_EMAIL,
      authReady,
      authError,
      clearAuthError,
      adminLoginModalOpen,
      setAdminLoginModalOpen,
      isVaultLocked,
      setVaultLocked,
      signInOwner,
      verifyAdminWithPasskey,
      signOutOwner,
      unlockedEntryIds,
      isEntryUnlockedForViewer,
      unlockEntryWithPassword,
      lockEntryAgain,
      setEntryPasswordLock,
      entries,
      collections,
      tags,
      settings,
      activeSection,
      previousSection,
      activeEntryId,
      activeCollectionId,
      selectedCalendarDate,
      globalSearchQuery,
      saveState,
      lastSavedAt,
      navigateTo,
      setGlobalSearchQuery,
      setSelectedCalendarDate,
      createNewEntry,
      openEntryForEdit,
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
      updateCollection,
      deleteCollection,
      reorderCollection,
      ensureTagExists,
      deleteTag,
      updateSettings,
      recordManualBackup,
      resetToSampleArchive,
      clearToBlankJournal,
      appearanceConfig,
      appearanceStudioOpen,
      setAppearanceStudioOpen,
      updateAppearanceConfig,
      setCollectionAppearanceOverride,
    }),
    [
      user,
      isAdmin,
      authReady,
      authError,
      clearAuthError,
      adminLoginModalOpen,
      isVaultLocked,
      signInOwner,
      verifyAdminWithPasskey,
      signOutOwner,
      unlockedEntryIds,
      isEntryUnlockedForViewer,
      unlockEntryWithPassword,
      lockEntryAgain,
      setEntryPasswordLock,
      entries,
      collections,
      tags,
      settings,
      activeSection,
      previousSection,
      activeEntryId,
      activeCollectionId,
      selectedCalendarDate,
      globalSearchQuery,
      saveState,
      lastSavedAt,
      navigateTo,
      createNewEntry,
      openEntryForEdit,
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
      updateCollection,
      deleteCollection,
      reorderCollection,
      ensureTagExists,
      deleteTag,
      updateSettings,
      recordManualBackup,
      resetToSampleArchive,
      clearToBlankJournal,
      appearanceConfig,
      appearanceStudioOpen,
      updateAppearanceConfig,
      setCollectionAppearanceOverride,
    ]
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal(): JournalContextValue {
  const ctx = useContext(JournalContext);
  if (!ctx) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return ctx;
}
