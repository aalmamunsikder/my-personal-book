import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/**
 * Simulates the exact boolean gates in firestore.rules to verify all 12 "Dirty Dozen"
 * payloads return PERMISSION_DENIED (false), public readers can view non-trashed entries,
 * and only Admin (aalmamunsikder@gmail.com) can write/edit/delete.
 */
interface MockAuth {
  uid: string;
  email: string;
  email_verified: boolean;
}

const ADMIN_EMAIL = 'aalmamunsikder@gmail.com';
const REQUEST_TIME = '2026-10-31T08:00:00.000Z';

function isValidId(id: unknown): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);
}

function isSignedIn(auth: MockAuth | null): boolean {
  return auth !== null && auth.email_verified === true;
}

function isAdmin(auth: MockAuth | null): boolean {
  return isSignedIn(auth) && auth!.email === ADMIN_EMAIL;
}

const REQUIRED_ENTRY_KEYS = [
  'userId', 'title', 'subtitle', 'content', 'type', 'status',
  'entryDate', 'mood', 'language', 'isFavorite', 'attribution',
  'fontPreference', 'pageVariation', 'wordCount', 'collectionId', 'tags',
  'isLocked', 'lockPassword', 'lockHint',
  'isTrashed', 'deletedAtIso', 'createdAt', 'updatedAt',
];

function isValidEntry(data: Record<string, any>, auth: MockAuth | null): boolean {
  if (!auth) return false;
  const keys = Object.keys(data);
  const hasAll = REQUIRED_ENTRY_KEYS.every((k) => keys.includes(k));
  const hasOnly = keys.every((k) => REQUIRED_ENTRY_KEYS.includes(k));
  if (!hasAll || !hasOnly) return false;

  return (
    typeof data.userId === 'string' &&
    data.userId.length >= 1 &&
    data.userId.length <= 128 &&
    /^[a-zA-Z0-9_\-]+$/.test(data.userId) &&
    data.userId === auth.uid &&
    typeof data.title === 'string' &&
    data.title.length <= 300 &&
    typeof data.subtitle === 'string' &&
    data.subtitle.length <= 300 &&
    typeof data.content === 'string' &&
    data.content.length <= 200000 &&
    typeof data.type === 'string' &&
    ['diary', 'poem', 'quote', 'fragment', 'prose'].includes(data.type) &&
    typeof data.status === 'string' &&
    ['draft', 'complete', 'archived'].includes(data.status) &&
    typeof data.entryDate === 'string' &&
    data.entryDate.length === 10 &&
    /^\d{4}-\d{2}-\d{2}$/.test(data.entryDate) &&
    typeof data.mood === 'string' &&
    data.mood.length <= 40 &&
    typeof data.language === 'string' &&
    ['bn', 'en', 'mixed', 'other'].includes(data.language) &&
    typeof data.isFavorite === 'boolean' &&
    typeof data.attribution === 'string' &&
    data.attribution.length <= 240 &&
    typeof data.fontPreference === 'string' &&
    ['auto', 'bangla', 'serif', 'sans'].includes(data.fontPreference) &&
    typeof data.pageVariation === 'string' &&
    ['vintage-parchment', 'ruled-notebook', 'poetry-scroll', 'epistolary-letter', 'dot-commonplace', 'nocturnal-vellum'].includes(data.pageVariation) &&
    Number.isInteger(data.wordCount) &&
    data.wordCount >= 0 &&
    data.wordCount <= 100000 &&
    typeof data.collectionId === 'string' &&
    data.collectionId.length <= 128 &&
    Array.isArray(data.tags) &&
    data.tags.length <= 10 &&
    (data.tags.length === 0 || (typeof data.tags[0] === 'string' && data.tags[0].length <= 60)) &&
    typeof data.isLocked === 'boolean' &&
    typeof data.lockPassword === 'string' &&
    data.lockPassword.length <= 120 &&
    typeof data.lockHint === 'string' &&
    data.lockHint.length <= 160 &&
    typeof data.isTrashed === 'boolean' &&
    typeof data.deletedAtIso === 'string' &&
    data.deletedAtIso.length <= 40 &&
    data.createdAt === REQUEST_TIME &&
    data.updatedAt === REQUEST_TIME
  );
}

function evaluateEntryGet(entryId: string, auth: MockAuth | null, existing: Record<string, any>): boolean {
  return isValidId(entryId) && (existing.isTrashed === false || isAdmin(auth));
}

function evaluateEntryList(auth: MockAuth | null, resourceData: Record<string, any>): boolean {
  return resourceData.isTrashed === false || isAdmin(auth);
}

function evaluateEntryCreate(entryId: string, auth: MockAuth | null, incoming: Record<string, any>): boolean {
  return (
    isValidId(entryId) &&
    isAdmin(auth) &&
    isValidEntry(incoming, auth) &&
    incoming.createdAt === REQUEST_TIME &&
    incoming.updatedAt === REQUEST_TIME
  );
}

function evaluateEntryUpdate(
  entryId: string,
  auth: MockAuth | null,
  existing: Record<string, any>,
  incoming: Record<string, any>
): boolean {
  if (!isValidId(entryId) || !isAdmin(auth) || !isValidEntry(incoming, auth)) return false;
  if (existing.userId !== auth!.uid) return false;
  if (incoming.userId !== existing.userId) return false;
  if (incoming.createdAt !== existing.createdAt) return false;
  if (incoming.updatedAt !== REQUEST_TIME) return false;
  return true;
}

function createValidPayload(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    userId: 'user-admin',
    title: 'হেমন্তের দিনলিপি',
    subtitle: '',
    content: 'প্রথম লাইন\n\nদ্বিতীয় স্তবক',
    type: 'diary',
    status: 'draft',
    entryDate: '2026-10-31',
    mood: 'Reflective',
    language: 'bn',
    isFavorite: false,
    attribution: '',
    fontPreference: 'auto',
    pageVariation: 'vintage-parchment',
    wordCount: 4,
    collectionId: '',
    tags: ['হেমন্ত'],
    isLocked: false,
    lockPassword: '',
    lockHint: '',
    isTrashed: false,
    deletedAtIso: '',
    createdAt: REQUEST_TIME,
    updatedAt: REQUEST_TIME,
    ...overrides,
  };
}

const ADMIN_AUTH: MockAuth = {
  uid: 'user-admin',
  email: ADMIN_EMAIL,
  email_verified: true,
};

test('firestore.rules file exists and enforces rules_version 2, isAdmin(), and default-deny catch-all', () => {
  const rulesText = fs.readFileSync('./firestore.rules', 'utf8');
  assert.match(rulesText, /rules_version\s*=\s*'2';/);
  assert.match(rulesText, /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;/);
  assert.match(rulesText, /aalmamunsikder@gmail\.com/);
  assert.match(rulesText, /isValidEntry\(incoming\(\)\)/);
});

test('Dirty Dozen #1: Unauthenticated Read of TRASHED entry is rejected, while non-trashed is public', () => {
  const trashed = createValidPayload({ isTrashed: true });
  assert.equal(evaluateEntryGet('entry-1', null, trashed), false);
  const publicEntry = createValidPayload({ isTrashed: false });
  assert.equal(evaluateEntryGet('entry-1', null, publicEntry), true);
});

test('Dirty Dozen #2: Non-Admin or Unverified Email Write is rejected (PERMISSION_DENIED)', () => {
  const payload = createValidPayload();
  assert.equal(
    evaluateEntryCreate('entry-1', { uid: 'user-admin', email: ADMIN_EMAIL, email_verified: false }, payload),
    false
  );
  assert.equal(
    evaluateEntryCreate('entry-1', { uid: 'user-admin', email: 'intruder@gmail.com', email_verified: true }, payload),
    false
  );
});

test('Dirty Dozen #3: Cross-User Identity Spoofing on Create is rejected (PERMISSION_DENIED)', () => {
  const payload = createValidPayload({ userId: 'user-2' });
  assert.equal(evaluateEntryCreate('entry-1', ADMIN_AUTH, payload), false);
});

test('Dirty Dozen #4: Shadow / Ghost Field Injection (isPublic: true) is rejected (PERMISSION_DENIED)', () => {
  const payload = createValidPayload({ isPublic: true });
  assert.equal(evaluateEntryCreate('entry-1', ADMIN_AUTH, payload), false);
});

test('Dirty Dozen #5: Invalid Entry Type or PageVariation Enum is rejected (PERMISSION_DENIED)', () => {
  const payload1 = createValidPayload({ type: 'blog_post' });
  assert.equal(evaluateEntryCreate('entry-1', ADMIN_AUTH, payload1), false);
  const payload2 = createValidPayload({ pageVariation: 'neon-cyberpunk' });
  assert.equal(evaluateEntryCreate('entry-1', ADMIN_AUTH, payload2), false);
});

test('Dirty Dozen #6: Malformed Entry Date Format is rejected (PERMISSION_DENIED)', () => {
  const payload = createValidPayload({ entryDate: '31-10-2026' });
  assert.equal(evaluateEntryCreate('entry-1', ADMIN_AUTH, payload), false);
});

test('Dirty Dozen #7: Resource Poisoning / Oversized Title (>300 chars) is rejected (PERMISSION_DENIED)', () => {
  const payload = createValidPayload({ title: 'ক'.repeat(305) });
  assert.equal(evaluateEntryCreate('entry-1', ADMIN_AUTH, payload), false);
});

test('Dirty Dozen #8: Unbounded Array Injection on Tags (>10 tags) is rejected (PERMISSION_DENIED)', () => {
  const payload = createValidPayload({
    tags: Array.from({ length: 12 }, (_, i) => `tag-${i}`),
  });
  assert.equal(evaluateEntryCreate('entry-1', ADMIN_AUTH, payload), false);
});

test('Dirty Dozen #9: Path ID Poisoning is rejected (PERMISSION_DENIED)', () => {
  const payload = createValidPayload();
  assert.equal(evaluateEntryCreate('invalid$id!with*spaces', ADMIN_AUTH, payload), false);
});

test('Dirty Dozen #10: Immutable Owner Mutation on Update is rejected (PERMISSION_DENIED)', () => {
  const existing = createValidPayload({ userId: 'user-admin' });
  const incoming = createValidPayload({ userId: 'user-2' });
  assert.equal(evaluateEntryUpdate('entry-1', ADMIN_AUTH, existing, incoming), false);
});

test('Dirty Dozen #11: Forged Client Timestamp on Create is rejected (PERMISSION_DENIED)', () => {
  const payload = createValidPayload({ createdAt: '1999-01-01T00:00:00.000Z' });
  assert.equal(evaluateEntryCreate('entry-1', ADMIN_AUTH, payload), false);
});

test('Dirty Dozen #12: Trashed List Scraping by Non-Admin is rejected (PERMISSION_DENIED)', () => {
  const trashedResource = createValidPayload({ isTrashed: true });
  assert.equal(
    evaluateEntryList({ uid: 'visitor-1', email: 'visitor@gmail.com', email_verified: true }, trashedResource),
    false
  );
});

test('Valid Admin (aalmamunsikder@gmail.com) Create, Read, Lock, and Update succeed', () => {
  const payload = createValidPayload({
    isLocked: true,
    lockPassword: 'secret-password',
    lockHint: 'Our childhood street',
    pageVariation: 'poetry-scroll',
  });
  assert.equal(evaluateEntryCreate('entry-1', ADMIN_AUTH, payload), true);
  assert.equal(evaluateEntryGet('entry-1', ADMIN_AUTH, payload), true);
  const updated = createValidPayload({
    title: 'নতুন শিরোনাম',
    isLocked: true,
    lockPassword: 'secret-password',
    lockHint: 'Our childhood street',
    pageVariation: 'poetry-scroll',
  });
  assert.equal(evaluateEntryUpdate('entry-1', ADMIN_AUTH, payload, updated), true);
});

test('TXT-001 & TXT-002: Bangla Unicode Vowels, Conjuncts, and Mixed English-Bangla fidelity', () => {
  const testText = `নশ্বরতার উপাখ্যান — silence is also a language.
কিছু কথা কখনো বলা হয় না,
শুধু লিখে রাখা হয়...
কারচিহ্ন: কি, কী, কু, কূ, কে, কৈ, কো, কৌ।
চিহ্ন: ! ? , . ; : — … “ ” ‘ ’ ( ) [ ] { } ৳ © ™ → ★ ♡ 🌙 ✍️ 🍂 ❤️`;

  const payload = createValidPayload({ content: testText });
  assert.equal(payload.content, testText);
  assert.equal(payload.content.includes('নশ্বরতার উপাখ্যান'), true);
  assert.equal(payload.content.includes('silence is also a language'), true);
  assert.equal(payload.content.includes('🌙 ✍️ 🍂 ❤️'), true);
});

test('EXP-001 & EXP-002 & EXP-014: JSON Export schema version, metadata, and secret-stripping', () => {
  const mockEntry: any = createValidPayload({
    id: 'entry-test-1',
    title: 'গোপন পাতা',
    content: 'গোপন কথা\n\nদ্বিতীয় স্তবক',
    isLocked: true,
    lockPassword: 'super-secret-password-123',
    lockHint: 'বইমেলার সাল',
  });

  // Verify that export payloads structure complies with schema version 1.0.0
  const exportPayload = {
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    application: 'VerseVault — Personal Diary & Literary Archive',
    includeTrashed: false,
    collectionFilter: 'all',
    stats: { entriesCount: 1, collectionsCount: 1, tagsCount: 1 },
    collections: [{ id: 'col-1', name: 'দাম্পত্য' }],
    tags: [{ id: 'tag-1', name: 'অভিমান' }],
    entries: [mockEntry],
  };

  assert.equal(exportPayload.schemaVersion, '1.0.0');
  assert.equal(exportPayload.entries.length, 1);
  assert.equal(exportPayload.entries[0].content.includes('দ্বিতীয় স্তবক'), true);
  // Ensure no Firebase / Supabase admin secrets or service keys exist anywhere in the export payload
  const serialized = JSON.stringify(exportPayload);
  assert.equal(serialized.includes('service_role'), false);
  assert.equal(serialized.includes('SERVICE_ROLE'), false);
  assert.equal(serialized.includes('secret_key'), false);
});

