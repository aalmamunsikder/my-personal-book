'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import type {
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
import type { AppearanceConfig } from '../types/appearance';
import { getStoredAppearanceConfig, saveStoredAppearanceConfig } from '../lib/appearance-storage';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { DEFAULT_OWNER_ID, INITIAL_SETTINGS } from '../lib/journal-defaults';
import { mergeArchive } from '../lib/archive-merge';
import { countWords, detectScriptLanguage, getLocalTodayDateString } from '../lib/entry-utils';
import { NO_LOCK_SECRET, setLockSecret, verifyLockSecret } from '../lib/entry-lock';
import {
  collectionFromFirestore,
  collectionToFirestoreFields,
  entryFromFirestore,
  entryToFirestoreFields,
  sanitizeCollectionPayload,
  sanitizeEntryPayload,
  sanitizeSettingsPayload,
  sanitizeTagPayload,
} from '../lib/validations';

// Gating only. This address must never be interpolated into user-visible text: a wrong-account
// visitor can otherwise read it straight off the login screen, and it is baked into the bundle.
const ADMIN_EMAIL = 'aalmamunsikder@gmail.com';

// Features guide 2.3 / 8.2 requires server saves to be debounced by roughly 900-1200ms.
const AUTOSAVE_DEBOUNCE_MS = 1000;

const STORAGE_KEYS = {
  entries: 'versevault_entries_v5',
  collections: 'versevault_collections_v5',
  tags: 'versevault_tags_v5',
  settings: 'versevault_settings_v5',
  initialized: 'versevault_initialized_v5',
  unlockedEntries: 'versevault_unlocked_entries_v5',
  pendingDeletes: 'versevault_pending_deletes_v5',
  serverVersions: 'versevault_server_versions_v5',
  legacyEntries: 'versevault_entries_v4',
};

interface PendingDeletes {
  entries: Set<string>;
  collections: Set<string>;
}

/**
 * The last version the server confirmed, per document id. This is what lets the merge tell "the server
 * deleted it" from "it was never uploaded", so it has to survive a reload like the delete queue does.
 */
function readServerVersions(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.serverVersions);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [id, version] of Object.entries(parsed)) {
      if (typeof version === 'number' && Number.isFinite(version) && version >= 1) out[id] = version;
    }
    return out;
  } catch {
    return {};
  }
}

function writeServerVersions(versions: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.serverVersions, JSON.stringify(versions));
  } catch {
    // A full or unavailable store loses the confirmation record; the merge then keeps local writing,
    // which is the safe direction.
  }
}

function forgetServerVersion(versions: Record<string, number>, id: string): void {
  if (!(id in versions)) return;
  delete versions[id];
  writeServerVersions(versions);
}

/**
 * Seeds the confirmation record for a browser that stored the archive before that record existed. The
 * client never raises a document's `version` — only a confirmed server write does — so a local copy at
 * version 2 or higher is proof the server held it at least once, which is exactly what the merge needs
 * to tell "deleted on the server" apart from "never uploaded". Without this, an archive written by an
 * older build is treated as unsent forever and re-uploads anything removed by hand.
 */
function seedConfirmedVersions(versions: Record<string, number>, items: unknown): boolean {
  if (!Array.isArray(items)) return false;
  let changed = false;
  for (const item of items) {
    const version = typeof item?.version === 'number' ? item.version : 0;
    const id = typeof item?.id === 'string' ? item.id : '';
    if (version >= 2 && id && !(id in versions)) {
      versions[id] = version;
      changed = true;
    }
  }
  return changed;
}

/**
 * A deletion made while signed out has no way to reach Firestore, and the archive would otherwise
 * hand it back on the next sync. Queuing the id keeps that promise across a reload.
 */
function readPendingDeletes(): PendingDeletes {
  const empty: PendingDeletes = { entries: new Set(), collections: new Set() };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.pendingDeletes);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as { entries?: unknown; collections?: unknown };
    return {
      entries: new Set(Array.isArray(parsed.entries) ? (parsed.entries as string[]) : []),
      collections: new Set(Array.isArray(parsed.collections) ? (parsed.collections as string[]) : []),
    };
  } catch {
    return empty;
  }
}

function writePendingDeletes(pending: PendingDeletes): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.pendingDeletes,
      JSON.stringify({ entries: [...pending.entries], collections: [...pending.collections] })
    );
  } catch {
    // A full or unavailable store loses the replay queue, never the archive itself.
  }
}

/**
 * v4 kept a per-entry passphrase in plaintext and mirrored it into Firestore. Reading it back
 * without rewriting would leave the plaintext in localStorage, so the first load hashes it and
 * drops the original key.
 */
async function migrateLegacyEntries(raw: string): Promise<JournalEntry[]> {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  const migrated: JournalEntry[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const legacy = item as JournalEntry & { lockPassword?: string };
    const { lockPassword: legacyPlaintext, ...rest } = legacy;
    const plaintext = typeof legacyPlaintext === 'string' ? legacyPlaintext : '';
    let secret = { lockPasswordHash: rest.lockPasswordHash ?? '', lockSalt: rest.lockSalt ?? '' };
    if (rest.isLocked && plaintext) {
      secret = await setLockSecret(plaintext);
    }
    migrated.push({
      ...rest,
      version: Math.max(1, Math.floor(Number(rest.version) || 1)),
      isLocked: Boolean(rest.isLocked) && Boolean(secret.lockPasswordHash),
      lockPasswordHash: secret.lockPasswordHash,
      lockSalt: secret.lockSalt,
      lockHint: rest.lockHint ?? '',
    });
  }
  return migrated;
}

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
  lockHint?: string;
}

interface JournalContextValue {
  user: User | null;
  isAdmin: boolean;
  authReady: boolean;
  authError: string | null;
  clearAuthError: () => void;
  adminLoginModalOpen: boolean;
  setAdminLoginModalOpen: (open: boolean) => void;
  isVaultLocked: boolean;
  setVaultLocked: (locked: boolean) => void;
  signInOwner: () => Promise<boolean>;
  signOutOwner: () => Promise<void>;

  unlockedEntryIds: string[];
  isEntryUnlockedForViewer: (entry: JournalEntry) => boolean;
  unlockEntryWithPassword: (entryId: string, passwordAttempt: string) => Promise<boolean>;
  lockEntryAgain: (entryId: string) => void;
  setEntryPasswordLock: (entryId: string, isLocked: boolean, password?: string, hint?: string) => Promise<void>;

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

  appearanceConfig: AppearanceConfig;
  appearanceStudioOpen: boolean;
  setAppearanceStudioOpen: (open: boolean) => void;
  updateAppearanceConfig: (patch: Partial<AppearanceConfig>) => void;
  setCollectionAppearanceOverride: (collectionId: string, override: Partial<AppearanceConfig>) => void;
  setEntryAppearance: (entryId: string, patch: { pageTemplateId?: string; appearanceOverride?: Partial<AppearanceConfig> | null }) => void;
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

  // The archive starts empty. Mock writing is never a fallback for a real first visit.
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [collections, setCollections] = useState<JournalCollection[]>([]);
  const [tags, setTags] = useState<JournalTag[]>([]);
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
  const [hydrated, setHydrated] = useState<boolean>(false);

  // Sync theme attribute to document root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', appearanceConfig.appThemeId);
    }
  }, [appearanceConfig.appThemeId]);

  const [activeSection, setActiveSection] = useState<ActiveNavSection>('journal');
  const [previousSection, setPreviousSection] = useState<ActiveNavSection>('journal');
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(getLocalTodayDateString());
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestWriteRef = useRef<Record<string, number>>({});
  const inFlightWriteRef = useRef<Record<string, Promise<unknown>>>({});
  const serverVersionRef = useRef<Record<string, number>>({});
  // Local changes no server write has confirmed, and deletions that could not be sent. Both decide
  // whether a snapshot may replace, keep or drop what the author holds.
  const dirtyIdsRef = useRef<{ entries: Set<string>; collections: Set<string> }>({
    entries: new Set(),
    collections: new Set(),
  });
  const pendingDeletesRef = useRef<PendingDeletes>({ entries: new Set(), collections: new Set() });

  // The Firebase session is the only thing that grants write access. Hiding UI is not security,
  // so there is no locally-faked admin session.
  const isFirebaseAdmin = Boolean(
    user &&
      user.email &&
      user.email.toLowerCase() === ADMIN_EMAIL &&
      user.emailVerified === true
  );
  const isAdmin = isFirebaseAdmin;

  // Hydrate the local cache on first client mount, migrating any pre-v5 archive.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const hydrate = async () => {
      try {
        pendingDeletesRef.current = readPendingDeletes();
        // A snapshot may already have landed while this effect was queued; never roll the record back.
        if (Object.keys(serverVersionRef.current).length === 0) {
          serverVersionRef.current = readServerVersions();
        }
        const savedEntries = localStorage.getItem(STORAGE_KEYS.entries);
        if (savedEntries) {
          const parsed = JSON.parse(savedEntries);
          if (Array.isArray(parsed) && !cancelled) setEntries(parsed);
          if (seedConfirmedVersions(serverVersionRef.current, parsed)) {
            writeServerVersions(serverVersionRef.current);
          }
        } else {
          const legacy = localStorage.getItem(STORAGE_KEYS.legacyEntries);
          if (legacy) {
            const migrated = await migrateLegacyEntries(legacy);
            if (!cancelled) setEntries(migrated);
          }
        }

        const savedCols = localStorage.getItem(STORAGE_KEYS.collections);
        if (savedCols && !cancelled) {
          const parsed = JSON.parse(savedCols);
          if (Array.isArray(parsed)) setCollections(parsed);
          if (seedConfirmedVersions(serverVersionRef.current, parsed)) {
            writeServerVersions(serverVersionRef.current);
          }
        }

        const savedTags = localStorage.getItem(STORAGE_KEYS.tags);
        if (savedTags && !cancelled) {
          const parsed = JSON.parse(savedTags);
          if (Array.isArray(parsed)) setTags(parsed);
        }

        localStorage.setItem(STORAGE_KEYS.initialized, 'true');
      } catch (e) {
        console.error('Failed to hydrate local journal cache:', e);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
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
        setAuthError('শুধুমাত্র এই আর্কাইভের মালিকের অ্যাকাউন্ট লেখা যোগ বা সম্পাদনা করতে পারবেন।');
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
          const profileRef = doc(db, 'profiles', currUser.uid);
          const displayName = (currUser.displayName || currUser.email || 'Journal Admin').slice(0, 120);
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(profileRef);
            if (!snap.exists()) {
              tx.set(profileRef, {
                userId: currUser.uid,
                displayName,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } else if (snap.data()?.displayName !== displayName) {
              tx.update(profileRef, {
                displayName,
                updatedAt: serverTimestamp(),
              });
            }
          });
        } catch {
          // Ignore if profile already exists with immutable createdAt
        }
      }
    });
    return () => unsub();
  }, []);

  // Attach Firestore listeners. Only the verified owner ever subscribes: there is no anonymous
  // read path in the client or in firestore.rules, so an unauthenticated visitor sees no archive.
  useEffect(() => {
    if (!authReady || !isFirebaseAdmin || !user) return;

    // Deletions queued while signed out go first, so the snapshot below arrives without them.
    const replayDeletes = (kind: keyof PendingDeletes, path: 'entries' | 'collections') => {
      for (const id of Array.from(pendingDeletesRef.current[kind])) {
        void deleteDoc(doc(db, path, id))
          .then(() => {
            pendingDeletesRef.current[kind].delete(id);
            writePendingDeletes(pendingDeletesRef.current);
            forgetServerVersion(serverVersionRef.current, id);
          })
          .catch((err) => {
            console.error(`Failed replaying a queued ${path} deletion:`, err);
          });
      }
    };
    replayDeletes('entries', 'entries');
    replayDeletes('collections', 'collections');

    const entriesQuery = query(collection(db, 'entries'), where('userId', '==', user.uid));

    const unsubEntries = onSnapshot(
      entriesQuery,
      (snap) => {
        const remoteEntries = snap.docs.map((d) => {
          const entry = entryFromFirestore(d.id, d.data());
          return {
            ...entry,
            createdAt: timestampToIso(d.data().createdAt, entry.createdAt),
            updatedAt: timestampToIso(d.data().updatedAt, entry.updatedAt),
          };
        });
        // Recorded outside the state updater so a StrictMode double-invoke cannot write the wrong set,
        // and so the confirmation survives a reload (the merge needs it to decide what "absent" means).
        for (const remote of remoteEntries) {
          serverVersionRef.current[remote.id] = remote.version;
        }
        writeServerVersions(serverVersionRef.current);
        setEntries((prev) => {
          return mergeArchive({
            local: prev,
            remote: remoteEntries,
            serverKnownIds: Object.keys(serverVersionRef.current),
            dirtyIds: dirtyIdsRef.current.entries,
            pendingDeleteIds: pendingDeletesRef.current.entries,
          });
        });
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'entries');
      }
    );

    const colsQuery = query(collection(db, 'collections'), where('userId', '==', user.uid));

    const unsubCols = onSnapshot(
      colsQuery,
      (snap) => {
        const remoteCols = snap.docs
          .map((d) => {
            const col = collectionFromFirestore(d.id, d.data());
            return {
              ...col,
              createdAt: timestampToIso(d.data().createdAt, col.createdAt),
              updatedAt: timestampToIso(d.data().updatedAt, col.updatedAt),
            };
          })
          .sort((a, b) => a.sortOrder - b.sortOrder);
        for (const remote of remoteCols) serverVersionRef.current[remote.id] = remote.version;
        writeServerVersions(serverVersionRef.current);
        setCollections((prev) => {
          return mergeArchive({
            local: prev,
            remote: remoteCols,
            serverKnownIds: Object.keys(serverVersionRef.current),
            dirtyIds: dirtyIdsRef.current.collections,
            pendingDeleteIds: pendingDeletesRef.current.collections,
          }).sort((a, b) => a.sortOrder - b.sortOrder);
        });
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'collections');
      }
    );

    const tagsQuery = query(collection(db, 'tags'), where('userId', '==', user.uid));
    const unsubTags = onSnapshot(
      tagsQuery,
      (snap) => {
        const remoteTags: JournalTag[] = snap.docs.map((d) => ({
          id: d.id,
          userId: d.data().userId ?? user.uid,
          name: d.data().name ?? '',
          normalizedName: d.data().normalizedName ?? '',
          createdAt: timestampToIso(d.data().createdAt, new Date().toISOString()),
        }));
        setTags(remoteTags);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'tags');
      }
    );

    return () => {
      unsubEntries();
      unsubCols();
      unsubTags();
    };
  }, [authReady, isFirebaseAdmin, user]);

  // Persist a single entry to Firestore. Status only becomes 'saved' after the write commits.
  const syncEntryToCloud = useCallback(
    async (entry: JournalEntry) => {
      if (!isFirebaseAdmin || !user) {
        dirtyIdsRef.current.entries.add(entry.id);
        setSaveState('local');
        setLastSavedAt(new Date().toISOString());
        return;
      }
      const token = (latestWriteRef.current[entry.id] || 0) + 1;
      latestWriteRef.current[entry.id] = token;
      setSaveState('saving');

      const sanitized = sanitizeEntryPayload(entry, user.uid);
      const fields = entryToFirestoreFields(sanitized, user.uid);
      const docRef = doc(db, 'entries', sanitized.id);

      const previousWrite = inFlightWriteRef.current[sanitized.id] ?? Promise.resolve();
      const runSave = async () => {
        await previousWrite.catch(() => undefined);
        // If a newer edit for the same entry has already been queued, let the latest one win.
        if (latestWriteRef.current[entry.id] !== token) return;

        let attemptedBaseVersion = serverVersionRef.current[sanitized.id] ?? sanitized.version;
        try {
          const writtenVersion = await runTransaction(db, async (tx) => {
            const snap = await tx.get(docRef);
            if (!snap.exists()) {
              tx.set(docRef, {
                ...fields,
                version: 1,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              return 1;
            }
            const current = snap.data() ?? {};
            const currentVersion = Number(current.version ?? 0);
            attemptedBaseVersion = serverVersionRef.current[sanitized.id] ?? sanitized.version;
            if (currentVersion !== attemptedBaseVersion) {
              throw { __conflict: true, serverVersion: currentVersion };
            }
            const nextVersion = currentVersion + 1;
            // A full replace, not a merge: documents written before the passphrase was hashed still
            // carry a plaintext `lockPassword`, and only a replace can drop it from the archive.
            tx.set(docRef, {
              ...fields,
              version: nextVersion,
              createdAt: current.createdAt ?? serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            return nextVersion;
          });

          serverVersionRef.current[sanitized.id] = writtenVersion;
          writeServerVersions(serverVersionRef.current);
          dirtyIdsRef.current.entries.delete(sanitized.id);
          setEntries((prev) =>
            prev.map((e) => (e.id === sanitized.id ? { ...e, version: writtenVersion } : e))
          );
          if (latestWriteRef.current[entry.id] === token) {
            setSaveState('saved');
            setLastSavedAt(new Date().toISOString());
          }
        } catch (err) {
          const conflict = Boolean((err as { __conflict?: boolean })?.__conflict);
          // Nothing is confirmed by a failed write, so the change stays dirty and a later snapshot
          // must not replace it.
          dirtyIdsRef.current.entries.add(entry.id);
          if (latestWriteRef.current[entry.id] === token) {
            setSaveState(conflict ? 'conflict' : 'failed');
          }
          if (conflict) {
            console.error(
              `Autosave conflict on ${sanitized.id}: archive is at v${(err as { serverVersion?: number }).serverVersion}, ` +
                `local draft was based on v${attemptedBaseVersion}. The newer local draft is preserved, not overwritten.`
            );
          } else {
            console.error('Cloud autosave error (preserved locally):', err);
          }
        }
      };

      const task = runSave();
      inFlightWriteRef.current[sanitized.id] = task;
      await task;
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

  const syncTagToCloud = useCallback(
    async (tag: JournalTag) => {
      if (!isFirebaseAdmin || !user) return;
      const docRef = doc(db, 'tags', tag.id);
      try {
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(docRef);
          if (!snap.exists()) {
            tx.set(docRef, {
              userId: user.uid,
              name: tag.name,
              normalizedName: tag.normalizedName,
              createdAt: serverTimestamp(),
            });
          } else {
            tx.update(docRef, { name: tag.name, normalizedName: tag.normalizedName });
          }
        });
      } catch (err) {
        console.error('Failed syncing tag to archive:', err);
      }
    },
    [isFirebaseAdmin, user]
  );

  const registerTagNames = useCallback(
    (names: string[], ownerId: string, nowIso: string) => {
      if (!Array.isArray(names) || names.length === 0) return;
      const existingNormalized = new Set(tags.map((t) => t.normalizedName));
      const additions: JournalTag[] = [];
      for (const rawTag of names) {
        const norm = rawTag.trim().toLocaleLowerCase();
        if (!norm || existingNormalized.has(norm)) continue;
        existingNormalized.add(norm);
        additions.push(
          sanitizeTagPayload(
            {
              id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              userId: ownerId,
              name: rawTag.trim(),
              normalizedName: norm,
              createdAt: nowIso,
            },
            ownerId
          )
        );
      }
      if (additions.length === 0) return;
      setTags((prev) => [...prev, ...additions]);
      for (const tag of additions) void syncTagToCloud(tag);
    },
    [syncTagToCloud, tags]
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
        isLocked: false,
        lockPasswordHash: '',
        lockSalt: '',
        lockHint: options?.lockHint ?? '',
        isTrashed: false,
        deletedAtIso: '',
        version: 1,
        pageTemplateId: '',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      setEntries((prev) => [newEntry, ...prev]);
      setActiveEntryId(newEntry.id);
      setPreviousSection(activeSection);
      setActiveSection('editor');
      setSaveState(isFirebaseAdmin ? 'saving' : 'local');

      // Register any initial template tags
      registerTagNames(newEntry.tags, ownerId, nowIso);

      if (isFirebaseAdmin && user) {
        void syncEntryToCloud(newEntry);
      }

      return newEntry;
    },
    [activeSection, isFirebaseAdmin, registerTagNames, settings.defaultEntryType, settings.defaultFont, settings.defaultMood, syncEntryToCloud, user]
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
        registerTagNames(patch.tags, user?.uid || DEFAULT_OWNER_ID, nowIso);
      }

      if (!settings.autosaveEnabled && !immediateSave) {
        dirtyIdsRef.current.entries.add(id);
        setSaveState(isFirebaseAdmin ? 'dirty' : 'local');
        return;
      }

      setSaveState(isFirebaseAdmin ? 'saving' : 'local');
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      const delay = immediateSave ? 50 : AUTOSAVE_DEBOUNCE_MS;
      saveTimerRef.current = setTimeout(() => {
        if (updatedRecord) {
          void syncEntryToCloud(updatedRecord);
        } else {
          setSaveState('idle');
        }
      }, delay);
    },
    [registerTagNames, settings.autosaveEnabled, syncEntryToCloud, user, isFirebaseAdmin]
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
      // Queued first, before any state change: without it a document still held by Firestore would be
      // handed back by the next snapshot, which is the opposite of what deleting means.
      pendingDeletesRef.current.entries.add(id);
      writePendingDeletes(pendingDeletesRef.current);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      dirtyIdsRef.current.entries.delete(id);
      if (activeEntryId === id) {
        setActiveEntryId(null);
      }
      if (isFirebaseAdmin && user) {
        deleteDoc(doc(db, 'entries', id))
          .then(() => {
            pendingDeletesRef.current.entries.delete(id);
            writePendingDeletes(pendingDeletesRef.current);
            forgetServerVersion(serverVersionRef.current, id);
          })
          .catch((err) => {
            console.error('Failed deleting entry from cloud:', err);
          });
      }
    },
    [activeEntryId, isFirebaseAdmin, user]
  );

  // A locked page stays locked for everyone, including the signed-in owner. Skipping the check
  // for admins would make the lock decorative, which is not what the brass plate promises.
  const isEntryUnlockedForViewer = useCallback(
    (entry: JournalEntry): boolean => {
      if (!entry.isLocked) return true;
      return unlockedEntryIds.includes(entry.id);
    },
    [unlockedEntryIds]
  );

  const unlockEntryWithPassword = useCallback(
    async (entryId: string, passwordAttempt: string): Promise<boolean> => {
      const target = entries.find((e) => e.id === entryId);
      if (!target) return false;
      if (!target.isLocked) return true;
      const ok = await verifyLockSecret(passwordAttempt, target);
      if (ok) {
        setUnlockedEntryIds((prev) => {
          const next = prev.includes(entryId) ? prev : [...prev, entryId];
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(STORAGE_KEYS.unlockedEntries, JSON.stringify(next));
          }
          return next;
        });
      }
      return ok;
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
    async (entryId: string, isLocked: boolean, password?: string, hint?: string): Promise<void> => {
      const cleanPass = isLocked ? (password || '').trim() : '';
      const cleanHint = isLocked ? (hint || '').trim() : '';
      if (isLocked && cleanPass.length < 4) {
        setAuthError('পাসওয়ার্ড লক সেট করতে অন্তত ৪ অক্ষরের পাসওয়ার্ড দরকার।');
        return;
      }
      const secret = cleanPass ? await setLockSecret(cleanPass) : NO_LOCK_SECRET;
      const nextLocked = Boolean(isLocked && secret.lockPasswordHash);
      updateEntry(
        entryId,
        {
          isLocked: nextLocked,
          lockPasswordHash: secret.lockPasswordHash,
          lockSalt: secret.lockSalt,
          lockHint: cleanHint,
        },
        true
      );
      if (!nextLocked) {
        lockEntryAgain(entryId);
      } else {
        setUnlockedEntryIds((prev) => {
          const next = prev.filter((id) => id !== entryId);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(STORAGE_KEYS.unlockedEntries, JSON.stringify(next));
          }
          return next;
        });
      }
    },
    [lockEntryAgain, updateEntry]
  );

  const syncCollectionToCloud = useCallback(
    async (col: JournalCollection) => {
      if (!isFirebaseAdmin || !user) return;
      const sanitized = sanitizeCollectionPayload(col, user.uid);
      const fields = collectionToFirestoreFields(sanitized, user.uid);
      const docRef = doc(db, 'collections', sanitized.id);
      const baseVersion = serverVersionRef.current[sanitized.id] ?? sanitized.version;
      try {
        const writtenVersion = await runTransaction(db, async (tx) => {
          const snap = await tx.get(docRef);
          if (!snap.exists()) {
            tx.set(docRef, {
              ...fields,
              version: 1,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            return 1;
          }
          const currentVersion = Number(snap.data()?.version ?? 0);
          if (currentVersion !== baseVersion) {
            throw { __conflict: true, serverVersion: currentVersion };
          }
          const nextVersion = currentVersion + 1;
          tx.update(docRef, { ...fields, version: nextVersion, updatedAt: serverTimestamp() });
          return nextVersion;
        });
        serverVersionRef.current[sanitized.id] = writtenVersion;
        writeServerVersions(serverVersionRef.current);
        setCollections((prev) =>
          prev.map((c) => (c.id === sanitized.id ? { ...c, version: writtenVersion } : c))
        );
      } catch (err) {
        console.error('Failed syncing collection to archive:', err);
      }
    },
    [isFirebaseAdmin, user]
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
          version: 1,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
        ownerId
      );

      setCollections((prev) => [...prev, newCol]);

      if (isFirebaseAdmin && user) {
        void syncCollectionToCloud(newCol);
      }

      return newCol;
    },
    [collections.length, isFirebaseAdmin, syncCollectionToCloud, user]
  );

  const updateCollection = useCallback(
    (id: string, patch: Partial<JournalCollection>) => {
      const nowIso = new Date().toISOString();
      setCollections((prev) => {
        const updated = prev.map((col) => {
          if (col.id !== id) return col;
          return { ...col, ...patch, updatedAt: nowIso };
        });
        const changed = updated.find((col) => col.id === id);
        if (changed) void syncCollectionToCloud(changed);
        return updated;
      });
    },
    [syncCollectionToCloud]
  );

  const deleteCollection = useCallback(
    (id: string) => {
      pendingDeletesRef.current.collections.add(id);
      writePendingDeletes(pendingDeletesRef.current);
      setCollections((prev) => prev.filter((col) => col.id !== id));
      setEntries((prev) =>
        prev.map((e) => {
          if (e.collectionId !== id) return e;
          // Detaching an entry is an unsent edit, so it must survive the next snapshot.
          dirtyIdsRef.current.entries.add(e.id);
          return { ...e, collectionId: '' };
        })
      );
      if (activeCollectionId === id) {
        setActiveCollectionId(null);
        if (activeSection === 'collection-detail') {
          setActiveSection('collections');
        }
      }
      dirtyIdsRef.current.collections.delete(id);
      if (isFirebaseAdmin && user) {
        deleteDoc(doc(db, 'collections', id))
          .then(() => {
            pendingDeletesRef.current.collections.delete(id);
            writePendingDeletes(pendingDeletesRef.current);
            forgetServerVersion(serverVersionRef.current, id);
          })
          .catch((err) => console.error('Failed deleting collection from cloud:', err));
      }
    },
    [activeCollectionId, activeSection, isFirebaseAdmin, user]
  );

  const reorderCollection = useCallback(
    (id: string, direction: 'up' | 'down') => {
      setCollections((prev) => {
        const idx = prev.findIndex((c) => c.id === id);
        if (idx === -1) return prev;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= prev.length) return prev;
        const copy = [...prev];
        const [moved] = copy.splice(idx, 1);
        copy.splice(targetIdx, 0, moved);
        const nowIso = new Date().toISOString();
        const reordered = copy.map((c, i) => ({ ...c, sortOrder: i + 1, updatedAt: nowIso }));
        if (isFirebaseAdmin && user) {
          for (const c of reordered) {
            if (c.sortOrder !== prev.find((p) => p.id === c.id)?.sortOrder) {
              void syncCollectionToCloud(c);
            }
          }
        }
        return reordered;
      });
    },
    [isFirebaseAdmin, syncCollectionToCloud, user]
  );

  const ensureTagExists = useCallback(
    (tagName: string) => {
      registerTagNames([tagName], user?.uid || DEFAULT_OWNER_ID, new Date().toISOString());
    },
    [registerTagNames, user]
  );

  const deleteTag = useCallback(
    (tagId: string) => {
      const target = tags.find((t) => t.id === tagId);
      if (!target) return;
      const stripTag = (e: JournalEntry) => ({
        ...e,
        tags: e.tags.filter((t) => t.toLocaleLowerCase() !== target.normalizedName),
      });
      const affected = entries.filter((e) => e.tags.some((t) => t.toLocaleLowerCase() === target.normalizedName));
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      setEntries((prev) => prev.map((e) => (e.tags.some((t) => t.toLocaleLowerCase() === target.normalizedName) ? stripTag(e) : e)));
      if (isFirebaseAdmin && user) {
        deleteDoc(doc(db, 'tags', tagId)).catch((err) =>
          console.error('Failed deleting tag from archive:', err)
        );
        // Each entry still carrying the tag must be rewritten, or the archive and the UI diverge.
        for (const e of affected) void syncEntryToCloud(stripTag(e));
      }
    },
    [entries, isFirebaseAdmin, syncEntryToCloud, tags, user]
  );

  const updateSettings = useCallback(
    (patch: Partial<JournalSettings>) => {
      const nowIso = new Date().toISOString();
      const next = sanitizeSettingsPayload(
        { ...settings, ...patch, updatedAt: nowIso },
        user?.uid || DEFAULT_OWNER_ID
      );
      setSettings(next);
      if (isFirebaseAdmin && user) {
        setDoc(doc(db, 'settings', user.uid), {
          ...next,
          updatedAt: serverTimestamp(),
        }).catch((err) => console.error('Failed syncing settings:', err));
      }
    },
    [isFirebaseAdmin, settings, user]
  );

  const recordManualBackup = useCallback(() => {
    updateSettings({ lastBackupAt: new Date().toISOString() });
  }, [updateSettings]);

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
        setAuthError('অ্যাক্সেস অনুমোদিত নয়। এই আর্কাইভের মালিকের Google অ্যাকাউন্ট দিয়েই শুধু লগইন করা যাবে।');
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
          ? 'পপআপ ব্লক হয়েছে। ব্রাউজারে এই সাইটের পপআপ অনুমতি দিয়ে আবার “Google দিয়ে সাইন-ইন” চাপুন.'
          : err?.message || 'Google লগইন সম্পন্ন করা যায়নি।';
      setAuthError(msg);
      return false;
    }
  }, [activeSection]);

  const signOutOwner = useCallback(async () => {
    setAuthError(null);
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

  const setCollectionAppearanceOverride = useCallback(
    (collectionId: string, override: Partial<AppearanceConfig>) => {
      const target = collections.find((c) => c.id === collectionId);
      if (!target) return;
      updateCollection(collectionId, {
        appearanceConfig: { ...(target.appearanceConfig || {}), ...override },
      });
    },
    [collections, updateCollection]
  );

  const setEntryAppearance = useCallback(
    (entryId: string, patch: { pageTemplateId?: string; appearanceOverride?: Partial<AppearanceConfig> | null }) => {
      const target = entries.find((e) => e.id === entryId);
      if (!target) return;
      const next: Partial<JournalEntry> = {};
      if (patch.pageTemplateId !== undefined) next.pageTemplateId = patch.pageTemplateId;
      if (patch.appearanceOverride !== undefined) {
        next.appearanceOverride =
          patch.appearanceOverride === null
            ? undefined
            : { ...(target.appearanceOverride || {}), ...patch.appearanceOverride };
      }
      updateEntry(entryId, next, true);
    },
    [entries, updateEntry]
  );

  const value = useMemo<JournalContextValue>(
    () => ({
      user,
      isAdmin,
      authReady,
      authError,
      clearAuthError,
      adminLoginModalOpen,
      setAdminLoginModalOpen,
      isVaultLocked,
      setVaultLocked,
      signInOwner,
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
      appearanceConfig,
      appearanceStudioOpen,
      setAppearanceStudioOpen,
      updateAppearanceConfig,
      setCollectionAppearanceOverride,
      setEntryAppearance,
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
      appearanceConfig,
      appearanceStudioOpen,
      updateAppearanceConfig,
      setCollectionAppearanceOverride,
      setEntryAppearance,
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
