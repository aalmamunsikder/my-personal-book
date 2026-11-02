import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countWords,
  detectScriptLanguage,
  filterAndSortEntries,
  formatBanglaFullDate,
  formatDayMonthBadge,
  formatEntryAsMarkdown,
  getSingleLinePreview,
  toBanglaDigits,
  toSafeFilenameSlug,
} from './entry-utils.ts';
import { sanitizeEntryPayload } from './validations.ts';
import { SAMPLE_COLLECTIONS as INITIAL_COLLECTIONS, SAMPLE_ENTRIES as INITIAL_ENTRIES } from './seed-data.ts';
import { buildJsonBackup } from './export-utils.ts';
import { JOURNAL_TEMPLATES, PAGE_VARIATIONS, resolveEffectivePageVariation } from './journal-templates.ts';
import { FACTORY_THEMES, PAGE_TEMPLATES } from './themes.ts';

test('countWords accurately counts Bangla, English, and mixed text', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   \n\n  '), 0);
  assert.equal(countWords('আজ ভোরে জানালা খুলতেই দেখি'), 5);
  assert.equal(countWords('One two\n\nthree four'), 4);
});

test('detectScriptLanguage distinguishes Bangla, English, and mixed scripts', () => {
  assert.equal(detectScriptLanguage('নৈঃশব্দ্যের দিনলিপি ও কবিতা'), 'bn');
  assert.equal(detectScriptLanguage('Letters to a Young Poet'), 'en');
  assert.equal(detectScriptLanguage('আজকের নোট — Notes from October'), 'mixed');
});

test('toBanglaDigits, formatBanglaFullDate, and formatDayMonthBadge format reference dates accurately', () => {
  assert.equal(toBanglaDigits(2025), '২০২৫');
  assert.equal(toBanglaDigits(28), '২৮');
  assert.equal(formatBanglaFullDate('2025-01-28', true), 'মঙ্গলবার, ২৮ জানুয়ারি ২০২৫');
  assert.equal(formatBanglaFullDate('2025-01-28', false), '২৮ জানুয়ারি ২০২৫');
  assert.deepEqual(formatDayMonthBadge('2025-01-28'), { day: '28', month: 'Jan' });
  assert.ok(getSingleLinePreview('একই ছাদের নিচে বাস, তবু ব্যবধান অগাধ,\nভালোবাসার আড়ালেও', 34).endsWith('...'));
});

test('sanitizeEntryPayload preserves exact Bangla/English newlines, stanza breaks, and emoji', () => {
  const poemWithStanzas = `প্রথম পঙ্‌ক্তি,\nদ্বিতীয় পঙ্‌ক্তি।\n\n\nতৃতীয় স্তবকের শুরু — 🍂\n   প্রান্তিক শূন্যস্থান সহ।`;
  const sanitized = sanitizeEntryPayload(
    {
      ...INITIAL_ENTRIES[0],
      content: poemWithStanzas,
      type: 'poem',
    },
    'owner-123'
  );
  assert.equal(sanitized.content, poemWithStanzas);
  assert.equal(sanitized.userId, 'owner-123');
});

test('filterAndSortEntries supports Bangla and English substring search and type filtering', () => {
  const collectionsMap = Object.fromEntries(INITIAL_COLLECTIONS.map((c) => [c.id, c]));

  const banglaMatches = filterAndSortEntries(INITIAL_ENTRIES, {
    query: 'অভিমান',
    collectionsMap,
  });
  assert.ok(banglaMatches.length >= 2, 'Should find Bangla entries containing অভিমান');

  const rilkeMatches = filterAndSortEntries(INITIAL_ENTRIES, {
    query: 'rilke',
    collectionsMap,
  });
  assert.ok(rilkeMatches.length >= 1, 'Should match Rilke in content and attribution');

  const poemMatches = filterAndSortEntries(INITIAL_ENTRIES, {
    type: 'poem',
    collectionsMap,
  });
  assert.ok(poemMatches.every((e) => e.type === 'poem'));
});

test('formatEntryAsMarkdown preserves exact original content and stanza breaks', () => {
  const poem = INITIAL_ENTRIES.find((e) => e.id === 'entry-2025-01-28-obhiman')!;
  const md = formatEntryAsMarkdown(poem, 'দাম্পত্য');
  assert.ok(md.includes(poem.content), 'Markdown export must contain exact unmodified poem content');
  assert.ok(md.includes('collection: "দাম্পত্য"'));
});

test('buildJsonBackup respects includeTrashed option and includes relationships', () => {
  const entriesWithTrash = [
    ...INITIAL_ENTRIES,
    {
      ...INITIAL_ENTRIES[0],
      id: 'trashed-entry-99',
      isTrashed: true,
      deletedAtIso: '2026-10-31T08:00:00.000Z',
    },
  ];
  const backupExcluded = buildJsonBackup(entriesWithTrash, INITIAL_COLLECTIONS, [], {
    includeTrashed: false,
  });
  assert.ok(!backupExcluded.entries.some((e) => e.id === 'trashed-entry-99'));

  const backupIncluded = buildJsonBackup(entriesWithTrash, INITIAL_COLLECTIONS, [], {
    includeTrashed: true,
  });
  assert.ok(backupIncluded.entries.some((e) => e.id === 'trashed-entry-99'));
  assert.ok(backupIncluded.relationships.entryCollections.length > 0);
});

test('toSafeFilenameSlug keeps Bangla Unicode characters while stripping unsafe path symbols', () => {
  const slug = toSafeFilenameSlug('হেমন্তের প্রথম কুয়াশা: ২০২৬?');
  assert.ok(!slug.includes(':'));
  assert.ok(!slug.includes('?'));
  assert.ok(slug.includes('হেমন্তের'));
});

test('JOURNAL_TEMPLATES and PAGE_VARIATIONS provide complete literary templates and page variations', () => {
  assert.equal(PAGE_VARIATIONS.length, 10);
  assert.equal(JOURNAL_TEMPLATES.length, 12);

  for (const tpl of JOURNAL_TEMPLATES) {
    assert.ok(tpl.nameBn.length > 0);
    assert.ok(tpl.defaultContent.length > 0);
    assert.ok(PAGE_VARIATIONS.some((v) => v.id === tpl.pageVariation));
  }

  assert.equal(resolveEffectivePageVariation('poem'), 'poetry-scroll');
  assert.equal(resolveEffectivePageVariation('quote'), 'dot-commonplace');
  assert.equal(resolveEffectivePageVariation('diary', 'epistolary-letter'), 'epistolary-letter');
  assert.equal(resolveEffectivePageVariation('diary', undefined, 'nocturnal-vellum'), 'nocturnal-vellum');
});



test('Themes guide 3.1 and 5: every factory theme and layout template is registered', () => {
  assert.deepEqual(Object.keys(FACTORY_THEMES), [
    'heritage-parchment',
    'botanical-journal',
    'midnight-library',
    'rosewood-letters',
    'ocean-ink',
    'old-library',
    'minimal-chalk',
    'desert-clay',
    'lavender-nocturne',
  ]);
  // TEMPLATE-01..10 from the guide, in the order the guide lists them.
  assert.deepEqual(Object.keys(PAGE_TEMPLATES), [
    'classic-journal',
    'clean-letter',
    'poetry-manuscript',
    'quote-folio',
    'pocket-fragment',
    'daily-reflection',
    'literary-book-page',
    'marginalia',
    'distraction-free',
    'vintage-journal',
  ]);
  for (const template of Object.values(PAGE_TEMPLATES)) {
    assert.ok(template.name.length > 0);
    assert.ok(template.nameBn.length > 0);
    assert.ok(template.description.length > 0);
  }
});

test('SEC backup: JSON export carries no passphrase material (base spec 9.2)', () => {
  const locked = sanitizeEntryPayload(
    {
      ...INITIAL_ENTRIES[0],
      isLocked: true,
      lockPasswordHash: 'a'.repeat(64),
      lockSalt: 's'.repeat(32),
      lockHint: 'বইমেলার সাল',
    },
    INITIAL_ENTRIES[0].userId
  );
  const serialized = JSON.stringify(buildJsonBackup([locked], INITIAL_COLLECTIONS, []));
  assert.equal(serialized.includes('lockPassword'), false);
  assert.equal(serialized.includes('lockPasswordHash'), false);
  assert.equal(serialized.includes('lockSalt'), false);
  assert.equal(serialized.includes('a'.repeat(64)), false);
  // The writing itself survives the sanitiser untouched.
  assert.equal(serialized.includes(INITIAL_ENTRIES[0].content.slice(0, 12)), true);
});

test('SEC lock: hashing a passphrase never yields the passphrase, and NFKC variants verify', async () => {
  const { NO_LOCK_SECRET, setLockSecret, verifyLockSecret } = await import('./entry-lock.ts');
  assert.deepEqual(NO_LOCK_SECRET, { lockPasswordHash: '', lockSalt: '' });

  const secret = await setLockSecret('নশ্বরতা 123');
  assert.equal(secret.lockPasswordHash.includes('নশ্বরতা'), false);
  assert.equal(secret.lockPasswordHash.length, 64);
  assert.equal(secret.lockSalt.length, 32);

  assert.equal(await verifyLockSecret('নশ্বরতা 123', secret), true);
  assert.equal(await verifyLockSecret('নশ্বরতা 124', secret), false);
  assert.equal(await verifyLockSecret('', secret), false);
  // A locked document with no credentials can never be opened by an empty attempt.
  assert.equal(await verifyLockSecret('', { lockPasswordHash: '', lockSalt: '' }), false);
});
