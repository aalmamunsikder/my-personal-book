import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import 'firebase/compat/storage';
import {
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { assertFails, assertSucceeds } from './tools/rules-assertions.ts';

/**
 * `storage.rules` executed by the emulator's rules engine.
 *
 * The app has no upload feature yet, which is exactly why this file is worth running: Storage is a
 * separately-configured surface, and a rules file nobody evaluates is how `tags.all` shipped a build
 * in which every valid entry write was impossible. These tests pin the one thing the privacy spec
 * requires of Storage — no anonymous read, including `list` — against a live evaluation rather than
 * against the text.
 *
 * Run with `npm run test:rules`, which boots the Firestore and Storage emulators. Java is required.
 */

const RULES = fs.readFileSync('./storage.rules', 'utf8');
const PROJECT_ID = 'demo-versevault-rules';
const OWNER_UID = 'owner-uid-1';
const OTHER_UID = 'someone-else-uid';
// Read back from the rules so a ceiling change here and there cannot drift apart.
const CEILING_MIB = Number(/withinCeiling\((\d+) \* 1024 \* 1024\)/.exec(RULES)?.[1]);
assert.ok(CEILING_MIB, 'storage.rules must state its size ceiling in MiB');
const MAX_BYTES = CEILING_MIB * 1024 * 1024;

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: { rules: RULES, host: '127.0.0.1', port: 9199 },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv?.clearStorage();
});

const ownerCtx = () => testEnv.authenticatedContext(OWNER_UID, { email_verified: true });
const anonCtx = () => testEnv.unauthenticatedContext();
const unverifiedCtx = () => testEnv.authenticatedContext(OWNER_UID, { email_verified: false });
const otherCtx = () => testEnv.authenticatedContext(OTHER_UID, { email_verified: true });

// compat UploadTask is thenable rather than a Promise, so every call is flattened here; assertSucceeds
// and assertFails want an ordinary Promise either way.
function put(ctx: RulesTestContext, path: string, bytes: number) {
  return ctx.storage().ref(path).put(new Uint8Array(bytes)).then(() => 'uploaded');
}

function downloadUrl(ctx: RulesTestContext, path: string) {
  return ctx.storage().ref(path).getDownloadURL().then((url: string) => url);
}

function listAll(ctx: RulesTestContext, path: string) {
  return ctx.storage().ref(path).listAll().then((page: { items: unknown[] }) => page.items.length);
}

function remove(ctx: RulesTestContext, path: string) {
  return ctx.storage().ref(path).delete().then(() => 'deleted');
}

/** Writes through the emulator with rules bypassed, so tests can plant objects no client could create. */
async function seed(path: string, bytes = 16) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await put(ctx, path, bytes);
  });
}

describe('the owner prefix is the whole trust boundary', () => {
  it('the owner uploads, downloads, lists and deletes inside their own prefix', async () => {
    const path = `${OWNER_UID}/entries/entry-1.png`;
    await assertSucceeds(put(ownerCtx(), path, 1024));
    await assertSucceeds(downloadUrl(ownerCtx(), path));
    await assertSucceeds(listAll(ownerCtx(), OWNER_UID));
    await assertSucceeds(remove(ownerCtx(), path));
  });

  it('refuses an anonymous read of an object that exists', async () => {
    const path = `${OWNER_UID}/covers/private.png`;
    await seed(path);
    // The owner can read the same object: proof that the denial below is about the caller, not a
    // missing file the emulator would refuse for an unrelated reason.
    await assertSucceeds(ownerCtx().storage().ref(path).getMetadata());
    await assertFails(downloadUrl(anonCtx(), path));
    await assertFails(anonCtx().storage().ref(path).getMetadata());
  });

  it('refuses an anonymous list, so a visitor cannot enumerate the bucket', async () => {
    await seed(`${OWNER_UID}/covers/a.png`);
    await assertFails(listAll(anonCtx(), ''));
    await assertFails(listAll(anonCtx(), OWNER_UID));
  });

  it('refuses another signed-in user, and a session whose email is unverified', async () => {
    const path = `${OWNER_UID}/covers/a.png`;
    await seed(path);
    await assertFails(downloadUrl(otherCtx(), path));
    await assertFails(listAll(otherCtx(), OWNER_UID));
    await assertFails(downloadUrl(unverifiedCtx(), path));
    await assertFails(put(unverifiedCtx(), `${OWNER_UID}/b.png`, 16));
    await assertFails(put(otherCtx(), path, 16));
    // Any verified user owns their own prefix, the same way any verified owner owns their entries.
    // This is the isolation contract; the single-owner product above it is a Firestore concern.
    await assertSucceeds(put(otherCtx(), `${OTHER_UID}/own.png`, 16));
    await assertSucceeds(downloadUrl(otherCtx(), `${OTHER_UID}/own.png`));
  });

  it('grants nothing to a path that is not the owner’s own prefix', async () => {
    // The first draft of this file served anonymous reads out of /public/covers, because a Storage
    // rule cannot consult the Firestore document that would hold a "published" flag, so publication
    // was expressed as a location. The specs allow no public surface, and `list` rides on the same
    // `read` rule as `get`, so that prefix was also browsable. Now the uid prefix is the only shape
    // the bucket has: an object outside it is unreachable by anyone, owner included.
    for (const path of [
      `public/covers/${OWNER_UID}/cover.png`,
      `attachments/shared/cover.png`,
      `${OWNER_UID}/public/cover.png`,
    ]) {
      await seed(path);
      await assertFails(downloadUrl(anonCtx(), path), `${path} was world-readable`);
    }
    await assertFails(downloadUrl(ownerCtx(), 'public/covers/x/cover.png'));
    assert.doesNotMatch(
      RULES,
      /allow[^\n]*if[^\n]*request\.auth == null/,
      'an allow line must not be satisfiable by a signed-out caller'
    );
    assert.equal(
      (RULES.match(/allow[^\n]*/g) ?? []).filter((line) => !line.includes('isVerifiedOwner')).length,
      0,
      'every allow line must route through isVerifiedOwner'
    );
  });

  it('caps an upload at the declared size and refuses an empty object', async () => {
    await assertFails(put(ownerCtx(), `${OWNER_UID}/covers/too-big.png`, MAX_BYTES + 1));
    await assertFails(put(ownerCtx(), `${OWNER_UID}/covers/empty.png`, 0));
    await assertSucceeds(put(ownerCtx(), `${OWNER_UID}/covers/edge.png`, MAX_BYTES));
  });
});
