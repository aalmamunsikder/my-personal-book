import JSZip from 'jszip';
import { JournalCollection, JournalEntry, JournalTag } from '../types/entry';
import { formatEntryAsMarkdown, toSafeFilenameSlug } from './entry-utils';

export interface ExportOptions {
  includeTrashed?: boolean;
  collectionId?: string | 'all';
}

export interface JsonBackupPayload {
  schemaVersion: string;
  exportedAt: string;
  application: string;
  includeTrashed: boolean;
  collectionFilter: string;
  stats: {
    entriesCount: number;
    collectionsCount: number;
    tagsCount: number;
  };
  collections: JournalCollection[];
  tags: JournalTag[];
  entries: JournalEntry[];
  relationships: {
    entryCollections: { entryId: string; collectionId: string }[];
    entryTags: { entryId: string; tagName: string }[];
  };
}

/**
 * Builds a complete, sanitized JSON backup object excluding any auth tokens or secrets.
 */
export function buildJsonBackup(
  entries: JournalEntry[],
  collections: JournalCollection[],
  tags: JournalTag[],
  options: ExportOptions = {}
): JsonBackupPayload {
  const { includeTrashed = false, collectionId = 'all' } = options;

  const filteredEntries = entries.filter((entry) => {
    if (!includeTrashed && entry.isTrashed) return false;
    if (collectionId !== 'all' && entry.collectionId !== collectionId) return false;
    return true;
  });

  const entryCollections = filteredEntries
    .filter((e) => Boolean(e.collectionId))
    .map((e) => ({ entryId: e.id, collectionId: e.collectionId }));

  const entryTags = filteredEntries.flatMap((e) =>
    e.tags.map((tagName) => ({ entryId: e.id, tagName }))
  );

  return {
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    application: 'VerseVault — Personal Diary & Literary Archive',
    includeTrashed,
    collectionFilter: collectionId,
    stats: {
      entriesCount: filteredEntries.length,
      collectionsCount: collections.length,
      tagsCount: tags.length,
    },
    collections: collections.map((c) => ({ ...c })),
    tags: tags.map((t) => ({ ...t })),
    entries: filteredEntries.map((e) => ({ ...e })),
    relationships: {
      entryCollections,
      entryTags,
    },
  };
}

/**
 * Generates a Markdown ZIP archive buffer/blob containing:
 * - VerseVault-Backup/README.md
 * - VerseVault-Backup/<Year>/<YYYY-MM-DD>-<slug>.md
 * - VerseVault-Backup/Poems/<YYYY-MM-DD>-<slug>.md
 * - VerseVault-Backup/Quotes/<YYYY-MM-DD>-<slug>.md
 * - VerseVault-Backup/Collections/<CollectionName>/<YYYY-MM-DD>-<slug>.md
 */
export async function generateMarkdownZipBlob(
  entries: JournalEntry[],
  collections: JournalCollection[],
  options: ExportOptions = {}
): Promise<Blob> {
  const { includeTrashed = false, collectionId = 'all' } = options;
  const zip = new JSZip();
  const root = zip.folder('VerseVault-Backup');
  if (!root) {
    throw new Error('Failed to initialize ZIP archive folder');
  }

  const collectionsMap: Record<string, JournalCollection> = {};
  for (const col of collections) {
    collectionsMap[col.id] = col;
  }

  const filteredEntries = entries.filter((entry) => {
    if (!includeTrashed && entry.isTrashed) return false;
    if (collectionId !== 'all' && entry.collectionId !== collectionId) return false;
    return true;
  });

  const readmeContent = [
    '# VerseVault — Personal Diary & Literary Archive Backup',
    '',
    `Exported on: ${new Date().toISOString()}`,
    `Total entries exported: ${filteredEntries.length}`,
    `Includes trashed entries: ${includeTrashed ? 'Yes' : 'No'}`,
    '',
    '## Archive Structure',
    '',
    '- `YYYY/` — Chronological archive of all entries grouped by diary year.',
    '- `Poems/` — Dedicated folder for all literary poems.',
    '- `Quotes/` — Dedicated folder for all saved quotes and aphorisms.',
    '- `Collections/` — Entries organized by their thematic notebook.',
    '',
    'Every file is plain UTF-8 Markdown with YAML frontmatter and preserves your original Bangla and English text, stanza spacing, and line breaks.',
  ].join('\n');

  root.file('README.md', readmeContent);

  const usedFilenames = new Set<string>();
  const getUniqueFilename = (folderPrefix: string, baseName: string): string => {
    let candidate = `${folderPrefix}/${baseName}.md`;
    let counter = 2;
    while (usedFilenames.has(candidate)) {
      candidate = `${folderPrefix}/${baseName}-${counter}.md`;
      counter += 1;
    }
    usedFilenames.add(candidate);
    return candidate;
  };

  for (const entry of filteredEntries) {
    const year = /^\d{4}/.test(entry.entryDate) ? entry.entryDate.slice(0, 4) : 'Undated';
    const slug = toSafeFilenameSlug(entry.title, `untitled-${entry.type}`);
    const baseName = `${entry.entryDate}-${slug}`;
    const colName = entry.collectionId && collectionsMap[entry.collectionId]
      ? collectionsMap[entry.collectionId].name
      : undefined;

    const markdown = formatEntryAsMarkdown(entry, colName);

    // 1. Chronological Year folder
    const yearPath = getUniqueFilename(year, baseName);
    root.file(yearPath, markdown);

    // 2. Type-specific folders for Poems and Quotes
    if (entry.type === 'poem') {
      const poemPath = getUniqueFilename('Poems', baseName);
      root.file(poemPath, markdown);
    } else if (entry.type === 'quote') {
      const quotePath = getUniqueFilename('Quotes', baseName);
      root.file(quotePath, markdown);
    }

    // 3. Collection folder if assigned
    if (colName) {
      const safeColFolder = toSafeFilenameSlug(colName, 'collection');
      const colPath = getUniqueFilename(`Collections/${safeColFolder}`, baseName);
      root.file(colPath, markdown);
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Triggers a browser file download for a Blob.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

/**
 * Triggers a browser file download for plain text or markdown strings.
 */
export function triggerTextDownload(
  filename: string,
  content: string,
  mimeType = 'text/plain;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mimeType });
  triggerBlobDownload(blob, filename);
}

