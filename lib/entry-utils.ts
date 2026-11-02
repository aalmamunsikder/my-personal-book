import type { EntryLanguage, EntryMood, EntryStatus, EntryType, FontPreference, JournalCollection, JournalEntry } from '../types/entry';

export const ENTRY_TYPES: { value: EntryType; label: string; banglaLabel: string; description: string }[] = [
  { value: 'diary', label: 'Diary', banglaLabel: 'দিনলিপি', description: 'Daily life, personal experiences, feelings, reflections' },
  { value: 'poem', label: 'Poem', banglaLabel: 'কবিতা', description: 'Multi-line literary writing preserving stanza breaks' },
  { value: 'quote', label: 'Quote', banglaLabel: 'উদ্ধৃতি', description: 'Short statement, passage, or aphorism' },
  { value: 'fragment', label: 'Fragment', banglaLabel: 'টুকরো ভাবনা', description: 'An unfinished thought, line, or fleeting idea' },
  { value: 'prose', label: 'Prose', banglaLabel: 'গদ্য', description: 'Longer reflective or literary essay writing' },
];

export const ENTRY_MOODS: { value: Exclude<EntryMood, ''>; bangla: string }[] = [
  { value: 'Reflective', bangla: 'চিন্তামগ্ন' },
  { value: 'Peaceful', bangla: 'শান্ত' },
  { value: 'Melancholic', bangla: 'বিষাদময়' },
  { value: 'Hopeful', bangla: 'আশাবাদী' },
  { value: 'Grateful', bangla: 'কৃতজ্ঞ' },
  { value: 'Nostalgic', bangla: 'স্মৃতিকাতর' },
  { value: 'Anxious', bangla: 'উদ্বিগ্ন' },
  { value: 'Romantic', bangla: 'প্রেমময়' },
  { value: 'Frustrated', bangla: 'অস্থির' },
  { value: 'Inspired', bangla: 'অনুপ্রাণিত' },
  { value: 'Other', bangla: 'অন্যান্য' },
];

export const COLLECTION_ACCENTS: { value: string; label: string; colorHex: string }[] = [
  { value: 'walnut', label: 'Open Book & Blossoms', colorHex: '#795548' },
  { value: 'slate', label: 'Misty Mountains', colorHex: '#5C666C' },
  { value: 'ochre', label: 'Solitary Sunset Tree', colorHex: '#8E6D3B' },
  { value: 'terracotta', label: 'Rain & Warm Lantern', colorHex: '#9A5B47' },
  { value: 'olive', label: 'Moonlit River', colorHex: '#74785A' },
  { value: 'autumn', label: 'Autumn Branch', colorHex: '#8C583A' },
];

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const BANGLA_WEEKDAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

const BANGLA_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

/**
 * Converts English numerals in a string or number into Bangla numerals (০-৯).
 */
export function toBanglaDigits(input: number | string): string {
  return String(input).replace(/\d/g, (d) => BANGLA_DIGITS[Number(d)] || d);
}

/**
 * Formats a YYYY-MM-DD date into full Bangla editorial format:
 * e.g., "মঙ্গলবার, ২৮ জানুয়ারি ২০২৫"
 */
export function formatBanglaFullDate(dateStr: string, includeWeekday = true): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = BANGLA_WEEKDAYS[dt.getDay()];
  const monthName = BANGLA_MONTHS[m - 1] || '';
  const dayBn = toBanglaDigits(d);
  const yearBn = toBanglaDigits(y);
  return includeWeekday ? `${weekday}, ${dayBn} ${monthName} ${yearBn}` : `${dayBn} ${monthName} ${yearBn}`;
}

/**
 * Formats a YYYY-MM-DD string into day and short month for the square parchment date badge:
 * e.g. { day: "28", month: "Jan" }
 */
export function formatDayMonthBadge(dateStr: string): { day: string; month: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { day: '--', month: '---' };
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return {
    day: String(d).padStart(2, '0'),
    month: dt.toLocaleDateString('en-US', { month: 'short' }),
  };
}

/**
 * Counts words accurately across Bangla, English, and mixed Unicode scripts
 * without altering the stored content.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Counts characters accurately using Unicode code points.
 */
export function countCharacters(text: string): number {
  if (!text) return 0;
  return Array.from(text).length;
}

/**
 * Counts lines preserving blank stanza breaks.
 */
export function countLines(text: string): number {
  if (!text) return 0;
  return text.split('\n').length;
}

/**
 * Detects whether text is primarily Bangla ('bn'), English ('en'), mixed ('mixed'), or 'other'.
 */
export function detectScriptLanguage(text: string): EntryLanguage {
  if (!text) return 'en';
  const banglaRegex = /[\u0980-\u09FF]/g;
  const latinRegex = /[a-zA-Z]/g;
  const banglaMatches = text.match(banglaRegex)?.length ?? 0;
  const latinMatches = text.match(latinRegex)?.length ?? 0;

  if (banglaMatches > 0 && latinMatches > 0) {
    const total = banglaMatches + latinMatches;
    if (banglaMatches / total > 0.85) return 'bn';
    if (latinMatches / total > 0.85) return 'en';
    return 'mixed';
  }
  if (banglaMatches > 0) return 'bn';
  if (latinMatches > 0) return 'en';
  return 'other';
}

/**
 * Resolves effective font script ('bn' | 'serif' | 'sans') from fontPreference and content language.
 */
export function resolveContentFontScript(
  fontPreference: FontPreference,
  language: EntryLanguage,
  defaultFont: FontPreference = 'auto'
): 'bn' | 'serif' | 'sans' {
  const effectivePref = fontPreference === 'auto' ? defaultFont : fontPreference;
  if (effectivePref === 'bangla') return 'bn';
  if (effectivePref === 'serif') return language === 'bn' ? 'bn' : 'serif';
  if (effectivePref === 'sans') return language === 'bn' ? 'bn' : 'sans';
  if (language === 'bn' || language === 'mixed') return 'bn';
  return 'serif';
}

export const BANGLADESH_TIMEZONE = 'Asia/Dhaka';

export interface BangladeshDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/**
 * Extracts exact calendar and clock components in Bangladesh Standard Time (Asia/Dhaka, UTC+6).
 */
export function getBangladeshDateParts(now: Date = new Date()): BangladeshDateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BANGLADESH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(now);
  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = Number(part.value);
    }
  }
  return {
    year: map.year || now.getUTCFullYear(),
    month: map.month || now.getUTCMonth() + 1,
    day: map.day || now.getUTCDate(),
    hour: map.hour ?? 0,
    minute: map.minute ?? 0,
    second: map.second ?? 0,
  };
}

/**
 * Returns today's date in Bangladesh Standard Time (Asia/Dhaka) YYYY-MM-DD format.
 */
export function getLocalTodayDateString(now: Date = new Date()): string {
  const { year, month, day } = getBangladeshDateParts(now);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Returns the authentic Bangla time-of-day greeting according to Bangladesh Standard Time (Asia/Dhaka).
 */
export function getBangladeshGreeting(now: Date = new Date()): {
  bangla: string;
  english: string;
  periodBn: string;
} {
  const { hour } = getBangladeshDateParts(now);
  if (hour >= 5 && hour < 12) {
    return { bangla: 'শুভ সকাল', english: 'Good Morning', periodBn: 'সকাল' };
  }
  if (hour >= 12 && hour < 15) {
    return { bangla: 'শুভ দুপুর', english: 'Good Noon', periodBn: 'দুপুর' };
  }
  if (hour >= 15 && hour < 18) {
    return { bangla: 'শুভ বিকেল', english: 'Good Afternoon', periodBn: 'বিকেল' };
  }
  if (hour >= 18 && hour < 21) {
    return { bangla: 'শুভ সন্ধ্যা', english: 'Good Evening', periodBn: 'সন্ধ্যা' };
  }
  return { bangla: 'শুভ রাত্রি', english: 'Good Night', periodBn: 'রাত' };
}

/**
 * Formats the current time in Bangladesh Standard Time (Asia/Dhaka) using Bangla digits.
 */
export function formatBangladeshTime(now: Date = new Date()): string {
  const { hour, minute } = getBangladeshDateParts(now);
  const { periodBn } = getBangladeshGreeting(now);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minStr = String(minute).padStart(2, '0');
  return `${periodBn} ${toBanglaDigits(hour12)}:${toBanglaDigits(minStr)}`;
}

/**
 * Formats a YYYY-MM-DD string into an editorial heading (e.g., "Saturday, October 31, 2026").
 */
export function formatEditorialDate(dateStr: string, includeYear = true): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Formats a YYYY-MM-DD string into a concise date stamp (e.g., "Oct 31, 2026").
 */
export function formatShortDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a YYYY-MM-DD string into Month Year group heading (e.g., "January 2025").
 */
export function formatMonthYearGroup(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'Undated';
  const [y, m] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Extracts the first N lines of an entry's content while preserving exact line breaks.
 */
export function getEntryExcerptLines(content: string, maxLines = 4, maxChars = 280): string {
  if (!content) return '';
  const lines = content.split('\n');
  const slicedLines = lines.slice(0, maxLines).join('\n');
  if (slicedLines.length <= maxChars && lines.length <= maxLines) {
    return slicedLines;
  }
  const clipped = slicedLines.slice(0, maxChars);
  return `${clipped}…`;
}

/**
 * Extracts a clean 1-line summary for compact book-index rows.
 */
export function getSingleLinePreview(content: string, maxChars = 42): string {
  if (!content) return '';
  const firstNonEmpty = content
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0) || '';
  if (firstNonEmpty.length <= maxChars) return firstNonEmpty;
  return `${firstNonEmpty.slice(0, maxChars)}...`;
}

export interface EntryFilterOptions {
  query?: string;
  type?: EntryType | 'all';
  mood?: EntryMood | 'all';
  collectionId?: string | 'all';
  tag?: string | 'all';
  year?: string | 'all';
  month?: string | 'all';
  status?: EntryStatus | 'active' | 'all';
  onlyFavorites?: boolean;
  onlyArchived?: boolean;
  includeTrashed?: boolean;
  onlyTrashed?: boolean;
  sortOrder?: 'newest' | 'oldest';
  sortBy?: 'date-desc' | 'date-asc' | 'updated-desc' | 'title-asc';
  collectionsMap?: Record<string, JournalCollection>;
}

export function filterAndSortEntries(
  entries: JournalEntry[],
  options: EntryFilterOptions = {}
): JournalEntry[] {
  const {
    query = '',
    type = 'all',
    mood = 'all',
    collectionId = 'all',
    tag = 'all',
    year = 'all',
    month = 'all',
    status = 'active',
    onlyFavorites = false,
    onlyArchived = false,
    includeTrashed = false,
    onlyTrashed = false,
    sortOrder = 'newest',
    sortBy,
    collectionsMap = {},
  } = options;

  const normalizedQuery = query.trim().toLocaleLowerCase();

  const filtered = entries.filter((entry) => {
    if (onlyTrashed) {
      if (!entry.isTrashed) return false;
    } else if (!includeTrashed && entry.isTrashed) {
      return false;
    }

    if (onlyArchived) {
      if (entry.status !== 'archived') return false;
    } else if (status === 'active') {
      if (entry.status === 'archived') return false;
    } else if (status !== 'all') {
      if (entry.status !== status) return false;
    }

    if (onlyFavorites && !entry.isFavorite) {
      return false;
    }

    if (type !== 'all' && entry.type !== type) {
      return false;
    }

    if (mood !== 'all' && entry.mood !== mood) {
      return false;
    }

    if (collectionId !== 'all' && entry.collectionId !== collectionId) {
      return false;
    }

    if (tag !== 'all' && !entry.tags.some((t) => t.toLocaleLowerCase() === tag.toLocaleLowerCase())) {
      return false;
    }

    if (year !== 'all' && !entry.entryDate.startsWith(`${year}-`)) {
      return false;
    }

    if (month !== 'all') {
      const entryMonth = entry.entryDate.slice(5, 7);
      if (entryMonth !== month) return false;
    }

    if (normalizedQuery) {
      const collectionName = entry.collectionId && collectionsMap[entry.collectionId]
        ? collectionsMap[entry.collectionId].name.toLocaleLowerCase()
        : '';
      const inTitle = entry.title.toLocaleLowerCase().includes(normalizedQuery);
      const inSubtitle = entry.subtitle.toLocaleLowerCase().includes(normalizedQuery);
      const inContent = entry.content.toLocaleLowerCase().includes(normalizedQuery);
      const inAttribution = entry.attribution.toLocaleLowerCase().includes(normalizedQuery);
      const inTags = entry.tags.some((t) => t.toLocaleLowerCase().includes(normalizedQuery));
      const inCollection = collectionName.includes(normalizedQuery);

      if (!inTitle && !inSubtitle && !inContent && !inAttribution && !inTags && !inCollection) {
        return false;
      }
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (sortBy === 'updated-desc') {
      return b.updatedAt.localeCompare(a.updatedAt);
    }
    if (sortBy === 'title-asc') {
      return (a.title || '').localeCompare(b.title || '');
    }
    const effectiveOrder =
      sortBy === 'date-asc' ? 'oldest' : sortBy === 'date-desc' ? 'newest' : sortOrder;
    const dateCompare = a.entryDate.localeCompare(b.entryDate);
    if (dateCompare !== 0) {
      return effectiveOrder === 'newest' ? -dateCompare : dateCompare;
    }
    const createdCompare = a.createdAt.localeCompare(b.createdAt);
    return effectiveOrder === 'newest' ? -createdCompare : createdCompare;
  });
}

export function groupEntriesByMonth(entries: JournalEntry[]): { monthLabel: string; entries: JournalEntry[] }[] {
  const groups: { monthLabel: string; entries: JournalEntry[] }[] = [];
  for (const entry of entries) {
    const label = formatMonthYearGroup(entry.entryDate);
    const existingGroup = groups.find((g) => g.monthLabel === label);
    if (existingGroup) {
      existingGroup.entries.push(entry);
    } else {
      groups.push({ monthLabel: label, entries: [entry] });
    }
  }
  return groups;
}

export function toSafeFilenameSlug(title: string, fallback = 'untitled'): string {
  if (!title || !title.trim()) return fallback;
  const cleaned = title
    .trim()
    .toLowerCase()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return cleaned || fallback;
}

export function formatEntryAsMarkdown(
  entry: JournalEntry,
  collectionName?: string
): string {
  const frontmatterLines = [
    '---',
    `title: ${JSON.stringify(entry.title || 'Untitled')}`,
    ...(entry.subtitle ? [`subtitle: ${JSON.stringify(entry.subtitle)}`] : []),
    `date: "${entry.entryDate}"`,
    `type: "${entry.type}"`,
    `status: "${entry.status}"`,
    ...(entry.mood ? [`mood: "${entry.mood}"`] : []),
    ...(collectionName ? [`collection: ${JSON.stringify(collectionName)}`] : []),
    ...(entry.attribution ? [`attribution: ${JSON.stringify(entry.attribution)}`] : []),
    ...(entry.tags.length > 0 ? [`tags: [${entry.tags.map((t) => JSON.stringify(t)).join(', ')}]`] : []),
    `favorite: ${entry.isFavorite}`,
    `created_at: "${entry.createdAt}"`,
    `updated_at: "${entry.updatedAt}"`,
    '---',
    '',
  ];

  const headerLines: string[] = [];
  if (entry.title) {
    headerLines.push(`# ${entry.title}`);
    if (entry.subtitle) {
      headerLines.push(`*${entry.subtitle}*`);
    }
    headerLines.push('');
  }

  const body = entry.content;

  const footerLines: string[] = [];
  if (entry.type === 'quote' && entry.attribution) {
    footerLines.push('', `— ${entry.attribution}`);
  }

  return [...frontmatterLines, ...headerLines, body, ...footerLines].join('\n');
}

export function formatEntryAsPlainText(
  entry: JournalEntry,
  collectionName?: string
): string {
  const lines: string[] = [
    entry.title || `Untitled ${entry.type}`,
    ...(entry.subtitle ? [entry.subtitle] : []),
    `Date: ${entry.entryDate} | Type: ${entry.type}${collectionName ? ` | Collection: ${collectionName}` : ''}`,
    '----------------------------------------',
    '',
    entry.content,
  ];
  if (entry.type === 'quote' && entry.attribution) {
    lines.push('', `— ${entry.attribution}`);
  }
  if (entry.tags.length > 0) {
    lines.push('', `Tags: ${entry.tags.map((t) => `#${t}`).join(' ')}`);
  }
  return lines.join('\n');
}

