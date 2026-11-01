export type EntryType = 'diary' | 'poem' | 'quote' | 'fragment' | 'prose';

export type EntryStatus = 'draft' | 'complete' | 'archived';

export type PageVariation =
  | 'vintage-parchment'
  | 'ruled-notebook'
  | 'poetry-scroll'
  | 'epistolary-letter'
  | 'dot-commonplace'
  | 'nocturnal-vellum';

export type EntryMood =
  | ''
  | 'Reflective'
  | 'Peaceful'
  | 'Melancholic'
  | 'Hopeful'
  | 'Grateful'
  | 'Nostalgic'
  | 'Anxious'
  | 'Romantic'
  | 'Frustrated'
  | 'Inspired'
  | 'Other';

export type EntryLanguage = 'bn' | 'en' | 'mixed' | 'other';

export type FontPreference = 'auto' | 'bangla' | 'serif' | 'sans';

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'local' | 'failed';

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  subtitle: string;
  content: string;
  type: EntryType;
  status: EntryStatus;
  entryDate: string; // YYYY-MM-DD
  mood: EntryMood;
  language: EntryLanguage;
  isFavorite: boolean;
  attribution: string;
  fontPreference: FontPreference;
  pageVariation?: PageVariation;
  wordCount: number;
  collectionId: string;
  tags: string[];
  isLocked?: boolean;
  lockPassword?: string;
  lockHint?: string;
  isTrashed: boolean;
  deletedAtIso: string;
  pageTemplateId?: string;
  appearanceOverride?: Record<string, any>;
  createdAt: string; // ISO string in local memory
  updatedAt: string; // ISO string in local memory
}

export interface JournalCollection {
  id: string;
  userId: string;
  name: string;
  description: string;
  accent: string;
  sortOrder: number;
  appearanceConfig?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface JournalTag {
  id: string;
  userId: string;
  name: string;
  normalizedName: string;
  createdAt: string;
}

export interface JournalSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  readingWidth: 'standard' | 'wide';
  density: 'comfortable' | 'compact';
  defaultEntryType: EntryType;
  defaultFont: FontPreference;
  defaultPageVariation?: PageVariation;
  showWordCount: boolean;
  defaultMood: EntryMood;
  autosaveEnabled: boolean;
  lastBackupAt: string;
  updatedAt: string;
}

export type ActiveNavSection =
  | 'journal'
  | 'entries'
  | 'poems'
  | 'quotes'
  | 'fragments'
  | 'collections'
  | 'collection-detail'
  | 'calendar'
  | 'favorites'
  | 'archive'
  | 'trash'
  | 'settings'
  | 'editor'
  | 'reading'
  | 'login';
