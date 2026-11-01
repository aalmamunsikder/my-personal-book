import blueprint from '../firebase-blueprint.json';
import { JournalCollection, JournalEntry, JournalSettings, JournalTag } from '../types/entry';
import { countWords, detectScriptLanguage } from './entry-utils';

// Verbatim constants extracted from firebase-blueprint.json
export const ID_MAX_LENGTH = blueprint.entities.Entry.properties.userId.maxLength; // 128
export const ID_PATTERN = new RegExp(blueprint.entities.Entry.properties.userId.pattern); // ^[a-zA-Z0-9_\-]+$
export const ENTRY_TITLE_MAX_LENGTH = blueprint.entities.Entry.properties.title.maxLength; // 300
export const ENTRY_SUBTITLE_MAX_LENGTH = blueprint.entities.Entry.properties.subtitle.maxLength; // 300
export const ENTRY_CONTENT_MAX_LENGTH = blueprint.entities.Entry.properties.content.maxLength; // 200000
export const ENTRY_DATE_PATTERN = new RegExp(blueprint.entities.Entry.properties.entryDate.pattern); // ^\d{4}-\d{2}-\d{2}$
export const ENTRY_MOOD_MAX_LENGTH = blueprint.entities.Entry.properties.mood.maxLength; // 40
export const ENTRY_ATTRIBUTION_MAX_LENGTH = blueprint.entities.Entry.properties.attribution.maxLength; // 240
export const ENTRY_TAGS_MAX_COUNT = blueprint.entities.Entry.properties.tags.maxLength; // 10
export const ENTRY_LOCK_PASSWORD_MAX_LENGTH = blueprint.entities.Entry.properties.lockPassword.maxLength; // 120
export const ENTRY_LOCK_HINT_MAX_LENGTH = blueprint.entities.Entry.properties.lockHint.maxLength; // 160
export const TAG_NAME_MAX_LENGTH = blueprint.entities.Tag.properties.name.maxLength; // 60
export const COLLECTION_NAME_MAX_LENGTH = blueprint.entities.Collection.properties.name.maxLength; // 120
export const COLLECTION_DESC_MAX_LENGTH = blueprint.entities.Collection.properties.description.maxLength; // 500

export const ALLOWED_ENTRY_TYPES = blueprint.entities.Entry.properties.type.enum as string[];
export const ALLOWED_ENTRY_STATUSES = blueprint.entities.Entry.properties.status.enum as string[];
export const ALLOWED_LANGUAGES = blueprint.entities.Entry.properties.language.enum as string[];
export const ALLOWED_FONT_PREFS = blueprint.entities.Entry.properties.fontPreference.enum as string[];
export const ALLOWED_PAGE_VARIATIONS = blueprint.entities.Entry.properties.pageVariation.enum as string[];

export function isValidDocumentId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= ID_MAX_LENGTH && ID_PATTERN.test(id);
}

/**
 * Sanitizes an entry payload so it strictly conforms to firebase-blueprint.json and firestore.rules
 * while NEVER trimming or mutating the user's original newlines, stanza breaks, or Bangla/English text.
 */
export function sanitizeEntryPayload(entry: JournalEntry, ownerUid: string): JournalEntry {
  const safeTags = (Array.isArray(entry.tags) ? entry.tags : [])
    .map((t) => String(t).trim().slice(0, TAG_NAME_MAX_LENGTH))
    .filter((t) => t.length > 0)
    .slice(0, ENTRY_TAGS_MAX_COUNT);

  const safeContent = typeof entry.content === 'string'
    ? entry.content.slice(0, ENTRY_CONTENT_MAX_LENGTH)
    : '';

  const safeDate = ENTRY_DATE_PATTERN.test(entry.entryDate)
    ? entry.entryDate
    : new Date().toISOString().slice(0, 10);

  const detectedLang = ALLOWED_LANGUAGES.includes(entry.language)
    ? entry.language
    : detectScriptLanguage(safeContent || entry.title);

  const safeLockPassword = (entry.lockPassword ?? '').slice(0, ENTRY_LOCK_PASSWORD_MAX_LENGTH);
  const safeIsLocked = Boolean(entry.isLocked) && safeLockPassword.length > 0;
  const safeVariation =
    entry.pageVariation && ALLOWED_PAGE_VARIATIONS.includes(entry.pageVariation)
      ? entry.pageVariation
      : 'vintage-parchment';

  return {
    id: isValidDocumentId(entry.id) ? entry.id : `entry-${Date.now()}`,
    userId: ownerUid,
    title: (entry.title ?? '').slice(0, ENTRY_TITLE_MAX_LENGTH),
    subtitle: (entry.subtitle ?? '').slice(0, ENTRY_SUBTITLE_MAX_LENGTH),
    content: safeContent,
    type: (ALLOWED_ENTRY_TYPES.includes(entry.type) ? entry.type : 'diary') as JournalEntry['type'],
    status: (ALLOWED_ENTRY_STATUSES.includes(entry.status) ? entry.status : 'draft') as JournalEntry['status'],
    entryDate: safeDate,
    mood: (entry.mood ?? '').slice(0, ENTRY_MOOD_MAX_LENGTH) as JournalEntry['mood'],
    language: detectedLang as JournalEntry['language'],
    isFavorite: Boolean(entry.isFavorite),
    attribution: (entry.attribution ?? '').slice(0, ENTRY_ATTRIBUTION_MAX_LENGTH),
    fontPreference: (ALLOWED_FONT_PREFS.includes(entry.fontPreference) ? entry.fontPreference : 'auto') as JournalEntry['fontPreference'],
    pageVariation: safeVariation as JournalEntry['pageVariation'],
    wordCount: Math.min(100000, Math.max(0, countWords(safeContent))),
    collectionId: (entry.collectionId ?? '').slice(0, ID_MAX_LENGTH),
    tags: safeTags,
    isLocked: safeIsLocked,
    lockPassword: safeIsLocked ? safeLockPassword : '',
    lockHint: safeIsLocked ? (entry.lockHint ?? '').slice(0, ENTRY_LOCK_HINT_MAX_LENGTH) : '',
    isTrashed: Boolean(entry.isTrashed),
    deletedAtIso: (entry.deletedAtIso ?? '').slice(0, 40),
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || new Date().toISOString(),
  };
}

export function sanitizeCollectionPayload(col: JournalCollection, ownerUid: string): JournalCollection {
  return {
    id: isValidDocumentId(col.id) ? col.id : `col-${Date.now()}`,
    userId: ownerUid,
    name: (col.name ?? '').trim().slice(0, COLLECTION_NAME_MAX_LENGTH) || 'Untitled Collection',
    description: (col.description ?? '').slice(0, COLLECTION_DESC_MAX_LENGTH),
    accent: (col.accent ?? 'walnut').slice(0, 40),
    sortOrder: Math.min(10000, Math.max(0, Math.floor(Number(col.sortOrder) || 0))),
    createdAt: col.createdAt || new Date().toISOString(),
    updatedAt: col.updatedAt || new Date().toISOString(),
  };
}

export function sanitizeTagPayload(tag: JournalTag, ownerUid: string): JournalTag {
  const cleanName = (tag.name ?? '').trim().slice(0, TAG_NAME_MAX_LENGTH) || 'tag';
  return {
    id: isValidDocumentId(tag.id) ? tag.id : `tag-${Date.now()}`,
    userId: ownerUid,
    name: cleanName,
    normalizedName: cleanName.toLocaleLowerCase().slice(0, TAG_NAME_MAX_LENGTH),
    createdAt: tag.createdAt || new Date().toISOString(),
  };
}

export function sanitizeSettingsPayload(settings: JournalSettings, ownerUid: string): JournalSettings {
  return {
    userId: ownerUid,
    theme: ['light', 'dark', 'system'].includes(settings.theme) ? settings.theme : 'light',
    readingWidth: ['standard', 'wide'].includes(settings.readingWidth) ? settings.readingWidth : 'standard',
    density: ['comfortable', 'compact'].includes(settings.density) ? settings.density : 'comfortable',
    defaultEntryType: (ALLOWED_ENTRY_TYPES.includes(settings.defaultEntryType) ? settings.defaultEntryType : 'diary') as JournalSettings['defaultEntryType'],
    defaultFont: (ALLOWED_FONT_PREFS.includes(settings.defaultFont) ? settings.defaultFont : 'auto') as JournalSettings['defaultFont'],
    showWordCount: Boolean(settings.showWordCount),
    defaultMood: (settings.defaultMood ?? '').slice(0, ENTRY_MOOD_MAX_LENGTH) as JournalSettings['defaultMood'],
    autosaveEnabled: Boolean(settings.autosaveEnabled),
    lastBackupAt: (settings.lastBackupAt ?? '').slice(0, 40),
    updatedAt: settings.updatedAt || new Date().toISOString(),
  };
}
