import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { assertFails, assertSucceeds } from './tools/rules-assertions.ts';

/**
 * This is the suite that actually runs `firestore.rules` — through the Firestore emulator's rules
 * engine, not by reading the file. `firestore.rules.test.ts` proves the text and the blueprint agree;
 * this file proves the engine enforces them. Run it with `npm run test:rules`, which boots the
 * emulator. A Java runtime is required for that emulator.
 *
 * Every payload here mirrors a numbered item in `security_spec.md`, so a spec line that cannot be
 * enforced shows up as a failing test rather than a paragraph.
 */

const RULES = fs.readFileSync('./firestore.rules', 'utf8');
const PROJECT_ID = 'demo-versevault-rules';

// Read from the rules themselves: if the owner address changes there, these tests follow it.
const ADMIN_EMAIL = /request\.auth\.token\.email == '([^']+)'/.exec(RULES)?.[1];
assert.ok(ADMIN_EMAIL, 'firestore.rules must pin isAdmin() to one owner email');

const OWNER_UID = 'owner-uid-1';
const OTHER_UID = 'someone-else-uid';
const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES, host: '127.0.0.1', port: 8080 },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv?.clearFirestore();
});

const ownerCtx = () => testEnv.authenticatedContext(OWNER_UID, { email: ADMIN_EMAIL, email_verified: true });
const anonCtx = () => testEnv.unauthenticatedContext();
const unverifiedCtx = () =>
  testEnv.authenticatedContext(OWNER_UID, { email: ADMIN_EMAIL, email_verified: false });
const wrongEmailCtx = () =>
  testEnv.authenticatedContext(OWNER_UID, { email: 'intruder@example.com', email_verified: true });
const otherOwnerUidCtx = () =>
  testEnv.authenticatedContext(OTHER_UID, { email: ADMIN_EMAIL, email_verified: true });

/** Write through the emulator with rules bypassed, so tests can seed states a client could never create. */
async function seed(collection: string, id: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection(collection).doc(id).set(data);
  });
}

function entryData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    userId: OWNER_UID,
    title: 'হেমন্তের দিনলিপি',
    subtitle: '',
    content: 'প্রথম লাইন\n\nদ্বিতীয় স্তবক',
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
    lockPasswordHash: '',
    lockSalt: '',
    lockHint: '',
    isTrashed: false,
    deletedAtIso: '',
    version: 1,
    pageTemplateId: 'classic-journal',
    appearanceOverrideJson: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function collectionData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    userId: OWNER_UID,
    name: 'শরৎ',
    description: '',
    accent: 'walnut',
    sortOrder: 1,
    appearanceConfigJson: '',
    version: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function tagData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    userId: OWNER_UID,
    name: 'নদী',
    normalizedName: 'নদী',
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

function settingsData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    userId: OWNER_UID,
    theme: 'light',
    readingWidth: 'standard',
    density: 'comfortable',
    defaultEntryType: 'diary',
    defaultFont: 'auto',
    showWordCount: true,
    defaultMood: '',
    autosaveEnabled: true,
    lastBackupAt: '',
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function aiSettingsData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    userId: OWNER_UID,
    enabled: false,
    hasConsented: false,
    consentVersion: '',
    consentAt: null,
    defaultContextScope: 'selection',
    dailyLimit: 40,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

function aiEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    userId: OWNER_UID,
    requestId: 'req-1',
    task: 'proofread',
    provider: 'Google Gemini',
    model: 'test-model',
    promptVersion: '1.0.0',
    status: 'complete',
    ...overrides,
  };
}

const entries = (ctx: ReturnType<typeof ownerCtx>) => ctx.firestore().collection('entries');
const docOf = (ctx: ReturnType<typeof ownerCtx>, path: string) => ctx.firestore().doc(path);

// Every denied payload also prints a gRPC error trace. The assertions read the rejection itself, so
// the log is silenced to keep a failure in this suite readable.
firebase.firestore.setLogLevel('silent');

describe('SEC-001..003 — anonymous callers can read nothing', () => {
  it('denies anonymous get on every owner-owned collection', async () => {
    await seed('entries', 'entry-1', entryData());
    await seed('collections', 'col-1', collectionData());
    await seed('tags', 'tag-1', tagData());
    await seed('profiles', OWNER_UID, {
      userId: OWNER_UID,
      displayName: 'Owner',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await seed('settings', OWNER_UID, settingsData());

    const anon = anonCtx();
    for (const path of [
      `entries/entry-1`,
      `collections/col-1`,
      `tags/tag-1`,
      `profiles/${OWNER_UID}`,
      `settings/${OWNER_UID}`,
    ]) {
      await assertFails(docOf(anon, path).get(), `anonymous read of ${path} must be denied`);
    }
  });

  it('a trashed entry is exactly as unreadable as a live one, anonymously', async () => {
    await seed('entries', 'entry-trashed', entryData({ isTrashed: true, deletedAtIso: '2026-10-31' }));
    await seed('entries', 'entry-live', entryData());
    const anon = anonCtx();
    await assertFails(entries(anon).doc('entry-live').get());
    await assertFails(entries(anon).doc('entry-trashed').get());
  });

  it('denies anonymous list even when the collection looks empty', async () => {
    await assertFails(entries(anonCtx()).get());
  });

  it('the owner can read their own page, and a signed-in stranger cannot', async () => {
    await seed('entries', 'entry-1', entryData());
    await assertSucceeds(entries(ownerCtx()).doc('entry-1').get());
    await assertFails(entries(otherOwnerUidCtx()).doc('entry-1').get());
    await assertFails(entries(wrongEmailCtx()).doc('entry-1').get());
  });
});

describe('Dirty Dozen #2, #3, #10 — identity is pinned to the token', () => {
  it('#2 unverified email cannot write', async () => {
    await assertFails(entries(unverifiedCtx()).doc('entry-1').set(entryData()));
  });

  it('#2 wrong email cannot write', async () => {
    await assertFails(entries(wrongEmailCtx()).doc('entry-1').set(entryData()));
  });

  it('#3 cannot create a page owned by somebody else', async () => {
    await assertFails(entries(ownerCtx()).doc('entry-1').set(entryData({ userId: OTHER_UID })));
  });

  it('#10 cannot hand a page over to another uid', async () => {
    await seed('entries', 'entry-1', entryData());
    await assertFails(
      entries(ownerCtx()).doc('entry-1').update({ userId: OTHER_UID, version: 2, updatedAt: serverTimestamp() })
    );
  });

  it('a different uid with the owner email still cannot read the owner archive', async () => {
    await seed('entries', 'entry-1', entryData());
    await assertFails(entries(otherOwnerUidCtx()).doc('entry-1').get());
  });
});

describe('Dirty Dozen #4, #9 — key allowlist and document ids', () => {
  it('#4 a ghost isPublic field is rejected', async () => {
    await assertFails(entries(ownerCtx()).doc('entry-1').set(entryData({ isPublic: true })));
  });

  it('#4 a missing required field is rejected', async () => {
    const partial = entryData();
    delete partial.pageTemplateId;
    await assertFails(entries(ownerCtx()).doc('entry-1').set(partial));
  });

  it('#9 poisoned document ids are rejected on create', async () => {
    const db = entries(ownerCtx());
    // The client rejects an empty id before it ever reaches the rules, so the length ceiling is what
    // is testable here: isValidId caps ids at 128 characters.
    await assertFails(db.doc('bad$id!').set(entryData()));
    await assertFails(db.doc('e'.repeat(129)).set(entryData()));
    await seed('entries', 'entry-1', entryData());
    await assertSucceeds(db.doc('entry-1').get());
  });
});

describe('Dirty Dozen #5..#8 — enums, formats and ceilings', () => {
  it('#5 unknown type and unknown pageVariation are rejected', async () => {
    const db = entries(ownerCtx());
    await assertFails(db.doc('entry-1').set(entryData({ type: 'blog_post' })));
    await assertFails(db.doc('entry-2').set(entryData({ pageVariation: 'neon-cyberpunk' })));
    await assertSucceeds(db.doc('entry-3').set(entryData({ type: 'poem' })));
  });

  it('#6 a dd-mm-yyyy entry date is rejected', async () => {
    await assertFails(entries(ownerCtx()).doc('entry-1').set(entryData({ entryDate: '31-10-2026' })));
  });

  it('#7 an oversized title is rejected, a boundary-length one is not', async () => {
    const db = entries(ownerCtx());
    await assertFails(db.doc('entry-1').set(entryData({ title: 'ক'.repeat(301) })));
    await assertSucceeds(db.doc('entry-2').set(entryData({ title: 'ক'.repeat(300) })));
  });

  it('#8 eleven tags are rejected, ten are allowed', async () => {
    const db = entries(ownerCtx());
    const make = (n: number) => Array.from({ length: n }, (_, i) => `tag-${i}`);
    await assertFails(db.doc('entry-1').set(entryData({ tags: make(11) })));
    await assertSucceeds(db.doc('entry-2').set(entryData({ tags: make(10) })));
  });

  it('the tag list cannot be used to smuggle a payload: 600 characters in total, however packed', async () => {
    const db = entries(ownerCtx());
    // One tag of 601 characters, and sixty tags of 600 across an allowed count, are both refused by
    // the combined count + joined-length ceiling.
    await assertFails(db.doc('entry-1').set(entryData({ tags: ['ট'.repeat(601)] })));
    await assertSucceeds(
      db.doc('entry-2').set(entryData({ tags: Array.from({ length: 10 }, () => 'ট'.repeat(60)) }))
    );
    // LIMITATION, recorded as an assertion so it cannot be forgotten: this rules engine cannot inspect
    // one list element, so an empty string and a non-string element pass the engine. sanitizeEntryPayload()
    // is the only writer and drops empty tags before the document is sent.
    await assertSucceeds(db.doc('entry-3').set(entryData({ tags: [''] })));
  });
});

describe('Dirty Dozen #11, #12 — time and query scraping', () => {
  it('#11 a client-forged createdAt is rejected', async () => {
    await assertFails(
      entries(ownerCtx())
        .doc('entry-1')
        .set(entryData({ createdAt: new Date('2020-01-01T00:00:00Z'), updatedAt: serverTimestamp() }))
    );
  });

  it('#11 an update cannot move updatedAt away from the write time', async () => {
    await seed('entries', 'entry-1', entryData());
    await assertFails(
      entries(ownerCtx()).doc('entry-1').update({
        title: 'নতুন শিরোনাম',
        version: 2,
        updatedAt: new Date('2020-01-01T00:00:00Z'),
      })
    );
  });

  it('#12 a scoped list returns only the caller’s own pages', async () => {
    await seed('entries', 'mine', entryData());
    await seed('entries', 'theirs', entryData({ userId: OTHER_UID }));
    const snap = await assertSucceeds(
      entries(ownerCtx()).where('userId', '==', OWNER_UID).get()
    );
    assert.equal(snap.size, 1);
    assert.equal(snap.docs[0].id, 'mine');
  });

  // The list rule reads resource.data, and rules are evaluated against the query, not against the
  // rows it returns. So a query that does not carry the ownership filter is refused outright rather
  // than silently narrowed — which is why every reader in JournalContext.tsx starts with
  // where('userId', '==', user.uid). Pinned here so a future unscoped read fails loudly in CI.
  it('an unscoped list is refused, not quietly filtered', async () => {
    await seed('entries', 'mine', entryData());
    await assertFails(entries(ownerCtx()).get(), 'a list without where(userId) must be denied');
    await assertFails(
      testEnv.authenticatedContext(OWNER_UID, { email: ADMIN_EMAIL, email_verified: true })
        .firestore()
        .collection('collections')
        .get()
    );
    await assertFails(
      testEnv.authenticatedContext(OWNER_UID, { email: ADMIN_EMAIL, email_verified: true })
        .firestore()
        .collection('tags')
        .where('userId', '==', OTHER_UID)
        .get(),
      'a filter on somebody else’s uid cannot be used to list their pages'
    );
  });

  // JournalContext installs three live listeners, each opened with where('userId', '==', user.uid).
  // A list rule that refused one of those shapes would not raise an error — the archive would simply
  // load empty — so the permitted case is asserted for all three, exactly as the client writes them.
  it('each listener query JournalContext installs is allowed as written', async () => {
    await seed('entries', 'mine', entryData());
    await seed('collections', 'c-mine', collectionData());
    await seed('tags', 't-mine', tagData());
    const owner = ownerCtx();
    const shapes: [string, string][] = [
      ['entries', 'mine'],
      ['collections', 'c-mine'],
      ['tags', 't-mine'],
    ];
    for (const [name, expectedId] of shapes) {
      const snap = await assertSucceeds(
        owner.firestore().collection(name).where('userId', '==', OWNER_UID).get(),
        `the ${name} listener query must be permitted`
      );
      assert.equal(snap.docs.map((d: { id: string }) => d.id).join(), expectedId);
    }
  });
});

describe('Dirty Dozen #13..#15 — the passphrase never exists in the archive', () => {
  it('#13 a plaintext lockPassword cannot be created', async () => {
    await assertFails(
      entries(ownerCtx()).doc('entry-1').set(entryData({ isLocked: true, lockPassword: 'hunter2' }))
    );
  });

  it('locking without a digest is rejected; a real digest is accepted', async () => {
    const db = entries(ownerCtx());
    await assertFails(db.doc('entry-1').set(entryData({ isLocked: true })));
    await assertSucceeds(
      db.doc('entry-2').set(
        entryData({ isLocked: true, lockPasswordHash: 'a'.repeat(64), lockSalt: 'b'.repeat(32) })
      )
    );
  });

  it('a legacy plaintext document can be rewritten exactly once, only to drop the field', async () => {
    await seed('entries', 'legacy', entryData({ lockPassword: 'hunter2' }));
    const db = entries(ownerCtx());

    await assertFails(
      db.doc('legacy').update({ title: 'শিরোনাম', version: 2, updatedAt: serverTimestamp() }),
      'a legacy page must not be edited while the plaintext passphrase is still stored'
    );

    await assertSucceeds(
      db.doc('legacy').update({
        lockPassword: firebase.firestore.FieldValue.delete(),
        lockPasswordHash: 'a'.repeat(64),
        lockSalt: 'b'.repeat(32),
        isLocked: true,
        version: 2,
        updatedAt: serverTimestamp(),
      })
    );

    const after = await db.doc('legacy').get();
    assert.equal('lockPassword' in (after.data() ?? {}), false);
  });

  it('the migration branch cannot be reused to keep the plaintext field', async () => {
    await seed('entries', 'legacy', entryData({ lockPassword: 'hunter2' }));
    await assertFails(
      entries(ownerCtx()).doc('legacy').update({ version: 2, updatedAt: serverTimestamp() })
    );
  });
});

describe('#14 optimistic concurrency', () => {
  it('version must advance by exactly one', async () => {
    await seed('entries', 'entry-1', entryData());
    const db = entries(ownerCtx());
    await assertFails(db.doc('entry-1').update({ title: 'a', updatedAt: serverTimestamp() }), 'same version');
    await assertFails(
      db.doc('entry-1').update({ title: 'a', version: 3, updatedAt: serverTimestamp() }),
      'skipped version'
    );
    await assertSucceeds(db.doc('entry-1').update({ title: 'a', version: 2, updatedAt: serverTimestamp() }));
    await assertFails(
      db.doc('entry-1').update({ title: 'b', version: 2, updatedAt: serverTimestamp() }),
      'regressed version'
    );
  });

  it('a create must start at version 1', async () => {
    await assertFails(entries(ownerCtx()).doc('entry-1').set(entryData({ version: 2 })));
  });

  it('collections carry the same version discipline', async () => {
    await seed('collections', 'col-1', collectionData());
    const db = testEnv.authenticatedContext(OWNER_UID, { email: ADMIN_EMAIL, email_verified: true })
      .firestore()
      .collection('collections');
    await assertSucceeds(db.doc('col-1').update({ name: 'হেমন্ত', version: 2, updatedAt: serverTimestamp() }));
    await assertFails(db.doc('col-1').update({ name: 'বসন্ত', version: 2, updatedAt: serverTimestamp() }));
  });
});

describe('#15..#17 AI consent, metering and metadata-only events', () => {
  it('consent is required before AI can be enabled', async () => {
    const db = ownerCtx().firestore().collection('aiSettings');
    await assertSucceeds(db.doc(OWNER_UID).set(aiSettingsData()));
    await assertFails(
      db.doc(OWNER_UID).set(aiSettingsData({ enabled: true, hasConsented: false })),
      'enabled without consent must be refused'
    );
    await assertFails(
      db.doc(OWNER_UID).set(
        aiSettingsData({ enabled: true, hasConsented: true, consentVersion: '' })
      ),
      'consent needs a recorded terms version'
    );
  });

  it('aiSettings is owner-only, never listable, never deletable', async () => {
    await seed('aiSettings', OWNER_UID, aiSettingsData());
    const anon = anonCtx().firestore();
    await assertFails(anon.doc(`aiSettings/${OWNER_UID}`).get());
    await assertFails(ownerCtx().firestore().collection('aiSettings').get(), 'list must be denied');
    await assertFails(
      ownerCtx().firestore().doc(`aiSettings/${OWNER_UID}`).delete(),
      'consent history must not be erasable by a client'
    );
    await assertFails(
      ownerCtx().firestore().doc(`aiSettings/${OTHER_UID}`).get()
    );
  });

  it('the daily counter can only move forward within a day', async () => {
    const db = ownerCtx().firestore().collection('aiUsage');
    await assertSucceeds(db.doc(OWNER_UID).set({ userId: OWNER_UID, day: '2026-11-01', count: 1 }));
    await assertSucceeds(db.doc(OWNER_UID).update({ count: 2 }));
    await assertFails(db.doc(OWNER_UID).update({ count: 1 }), 'a client must not reset its own budget');
    await assertSucceeds(db.doc(OWNER_UID).update({ day: '2026-11-02', count: 1 }), 'a new day may restart');
    await assertFails(db.doc(OWNER_UID).delete(), 'metering must not be erasable');
  });

  it('a usage event with any content field is refused', async () => {
    const db = ownerCtx().firestore().collection('aiUsageEvents');
    await assertSucceeds(db.doc('req-1').set(aiEvent()));
    await assertFails(db.doc('req-2').set(aiEvent({ prompt: 'আমার লেখা' })));
    await assertFails(db.doc('req-3').set(aiEvent({ content: 'আমার লেখা' })));
    await assertFails(db.doc('req-4').set(aiEvent({ completion: 'model words' })));
  });

  it('events are append-only, the id must be the requestId, and the clock is not the client’s', async () => {
    await seed('aiUsageEvents', 'req-1', aiEvent());
    const db = ownerCtx().firestore();
    await assertFails(db.doc('aiUsageEvents/req-1').update({ status: 'error' }));
    await assertFails(db.doc('aiUsageEvents/req-1').delete());
    await assertFails(
      db.collection('aiUsageEvents').doc('some-other-id').set(aiEvent()),
      'document id must equal requestId so a replay cannot add a second charge'
    );
    // No stored timestamp means no forgeable one: Firestore's own document createTime is the time the
    // request happened, and a write that tries to supply its own clock is refused.
    await assertFails(
      db.collection('aiUsageEvents').doc('req-2').set(aiEvent({ requestId: 'req-2', createdAt: serverTimestamp() })),
      'a client-supplied createdAt must be refused on a metering event'
    );
  });

  it('an anonymous caller cannot mint free AI metering', async () => {
    const anon = anonCtx().firestore();
    await assertFails(anon.collection('aiUsage').doc(OWNER_UID).set({ userId: OWNER_UID, day: '2026-11-01', count: 1 }));
    await assertFails(anon.collection('aiUsageEvents').doc('req-1').set(aiEvent()));
  });
});

describe('profiles and settings owner path', () => {
  it('the profile document is pinned to the path parameter and the token', async () => {
    const db = ownerCtx().firestore();
    await assertSucceeds(
      db.doc(`profiles/${OWNER_UID}`).set({
        userId: OWNER_UID,
        displayName: 'মামুন',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
    await assertFails(
      db.doc(`profiles/${OTHER_UID}`).set({
        userId: OTHER_UID,
        displayName: 'x',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      'a caller cannot create a profile at someone else’s path'
    );
    await assertFails(
      db.doc(`profiles/${OWNER_UID}`).update({ displayName: 'নতুন', createdAt: new Date('2020-01-01T00:00:00Z') })
    );
  });

  it('settings reject an unknown theme value', async () => {
    const db = ownerCtx().firestore();
    await assertSucceeds(db.doc(`settings/${OWNER_UID}`).set(settingsData()));
    await assertFails(db.doc(`settings/${OWNER_UID}`).update({ theme: 'neon' }));
  });
});

describe('deletion', () => {
  it('the owner can delete their own page; nobody else can', async () => {
    await seed('entries', 'entry-1', entryData());
    await assertFails(entries(otherOwnerUidCtx()).doc('entry-1').delete());
    await assertFails(entries(unverifiedCtx()).doc('entry-1').delete());
    await assertFails(entries(anonCtx()).doc('entry-1').delete());
    await assertSucceeds(entries(ownerCtx()).doc('entry-1').delete());

    const remaining = await entries(ownerCtx()).where('userId', '==', OWNER_UID).get();
    assert.equal(remaining.size, 0, 'the page really is gone after an owner delete');
  });
});
