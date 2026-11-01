import type { JournalSettings } from '../types/entry';

// These two constants are the only things `lib/seed-data.ts` was imported for at runtime. They live
// here because importing them from that module pulled the prototype diary fixtures — the owner's
// sample poems and prose — into the public browser bundle, where terser cannot prove `countWords`
// is side-effect-free and therefore cannot drop the arrays derived from it.
export const DEFAULT_OWNER_ID = 'local-owner-vault';

export const INITIAL_SETTINGS: JournalSettings = {
  userId: DEFAULT_OWNER_ID,
  theme: 'light',
  readingWidth: 'standard',
  density: 'comfortable',
  defaultEntryType: 'diary',
  defaultFont: 'auto',
  showWordCount: true,
  defaultMood: '',
  autosaveEnabled: true,
  lastBackupAt: '',
  updatedAt: '2025-01-28T08:00:00.000Z',
};
