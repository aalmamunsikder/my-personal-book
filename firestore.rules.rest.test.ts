import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { AI_TASKS } from './lib/ai-contracts.ts';

/**
 * `firestore.rules.emulator.test.ts` exercises the browser SDK. This file exercises the other writer
 * in the archive: `/api/ai-assist` meters usage through the Firestore REST API
 * (`lib/firestore-rest.ts`), which means field-masked PATCH, POST with an explicit documentId, and a
 * SERVER_TIME field transform — three things the SDK never sends. Each is a place where the rules
 * engine could disagree with the route's assumptions, and the route turns any disagreement into a
 * silent 503 or a lost event. The shipped writer is imported, not reimplemented.
 */

const RULES = fs.readFileSync('./firestore.rules', 'utf8');
const PROJECT_ID = 'demo-versevault-rules';
const BASE = `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const ADMIN_EMAIL = /request\.auth\.token\.email == '([^']+)'/.exec(RULES)?.[1];
assert.ok(ADMIN_EMAIL, 'firestore.rules must pin isAdmin() to one owner email');

const OWNER_UID = 'owner-uid-1';
const OTHER_UID = 'someone-else-uid';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = PROJECT_ID;
// The archive lives in a named database in production; the emulator serves the default one, and the
// difference is itself recorded as an open item in IMPLEMENTATION_STATUS.md.
process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID = '(default)';
assert.ok(
  process.env.FIRESTORE_EMULATOR_HOST,
  'run this file inside `firebase emulators:exec` so the shipped REST writer points at the emulator'
);

// Imported after the env is pinned: lib/firestore-rest.ts resolves its base URL at module load.
const { createDocumentWithToken, readDocumentWithToken, writeDocumentFields, FirestoreRestError } =
  await import('./lib/firestore-rest.ts');

/**
 * The emulator decodes a bearer token without checking its signature, which is the only way to hand
 * a raw REST call a `request.auth` at all. The signature segment must be present but empty: a token
 * ending in `.signature` is rejected as "invalid jwt" with HTTP 400, while `header.payload.` is
 * parsed and its claims are applied — verified against this emulator build. Claims match the shape
 * Firebase Auth issues: `email` and `email_verified` as top-level claims, the uid as `sub`.
 */
function mockToken(uid: string, email: string | null, verified: boolean): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const issuedAt = Math.floor(Date.now() / 1000);
  return [
    encode({ alg: 'none', typ: 'JWT' }),
    encode({
      iss: `https://securetoken.google.com/${PROJECT_ID}`,
      aud: PROJECT_ID,
      sub: uid,
      user_id: uid,
      email,
      email_verified: verified,
      auth_time: issuedAt,
      iat: issuedAt,
      exp: issuedAt + 3600,
      firebase: { identities: { 'google.com': { user_id: uid } }, sign_in_provider: 'google.com' },
    }),
    '',
  ].join('.');
}

const owner = mockToken(OWNER_UID, ADMIN_EMAIL, true);
const unverified = mockToken(OWNER_UID, ADMIN_EMAIL, false);
const stranger = mockToken(OTHER_UID, ADMIN_EMAIL, true);
const anonymous = mockToken(OTHER_UID, null, false);

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

async function statusOf(fn: () => Promise<unknown>): Promise<number | 'ok' | `threw:${string}`> {
  try {
    await fn();
    return 'ok';
  } catch (error) {
    if (error instanceof FirestoreRestError) return error.status;
    const detail: `threw:${string}` = `threw:${String(error).slice(0, 54)}`;
    return detail;
  }
}

describe('aiUsage meter written through the REST API', () => {
  it('a masked PATCH creates the day counter on first use', async () => {
    await writeDocumentFields('aiUsage', OWNER_UID, { userId: OWNER_UID, day: '2026-11-01', count: 1 }, owner);
    const doc = await readDocumentWithToken('aiUsage', OWNER_UID, owner);
    assert.deepEqual(doc, { userId: OWNER_UID, day: '2026-11-01', count: 1 });
  });

  it('the counter may advance, may not be rewound, and may restart on a new day', async () => {
    await writeDocumentFields('aiUsage', OWNER_UID, { userId: OWNER_UID, day: '2026-11-01', count: 1 }, owner);
    assert.equal(
      await statusOf(() =>
        writeDocumentFields('aiUsage', OWNER_UID, { userId: OWNER_UID, day: '2026-11-01', count: 2 }, owner)
      ),
      'ok'
    );
    // A replayed request must not be able to lower the meter back down and buy budget again.
    assert.equal(
      await statusOf(() =>
        writeDocumentFields('aiUsage', OWNER_UID, { userId: OWNER_UID, day: '2026-11-01', count: 1 }, owner)
      ),
      403
    );
    assert.equal(
      await statusOf(() =>
        writeDocumentFields('aiUsage', OWNER_UID, { userId: OWNER_UID, day: '2026-11-02', count: 1 }, owner)
      ),
      'ok'
    );
  });

  it('the mask cannot be used to smuggle an extra field into the meter', async () => {
    assert.equal(
      await statusOf(() =>
        writeDocumentFields(
          'aiUsage',
          OWNER_UID,
          { userId: OWNER_UID, day: '2026-11-01', count: 1, dailyLimit: 100000 },
          owner
        )
      ),
      403
    );
  });

  it('a token for another uid cannot write the owner’s meter, verified email or not', async () => {
    assert.equal(
      await statusOf(() =>
        writeDocumentFields('aiUsage', OWNER_UID, { userId: OWNER_UID, day: '2026-11-01', count: 1 }, stranger)
      ),
      403
    );
    assert.equal(
      await statusOf(() =>
        writeDocumentFields('aiUsage', OWNER_UID, { userId: OWNER_UID, day: '2026-11-01', count: 1 }, unverified)
      ),
      403
    );
    assert.equal(
      await statusOf(() =>
        writeDocumentFields('aiUsage', OWNER_UID, { userId: OWNER_UID, day: '2026-11-01', count: 1 }, anonymous)
      ),
      403
    );
  });

  it('the route reads the meter with the caller token and is refused for a neighbour’s', async () => {
    await writeDocumentFields('aiUsage', OWNER_UID, { userId: OWNER_UID, day: '2026-11-01', count: 3 }, owner);
    assert.deepEqual(await readDocumentWithToken('aiUsage', OWNER_UID, owner), {
      userId: OWNER_UID,
      day: '2026-11-01',
      count: 3,
    });
    // A refused read is a 403, not a 404: the route must not treat "you may not see this" as "it does
    // not exist", which is why the catch in reserveBudget answers 401 rather than minting a budget.
    assert.equal(await statusOf(() => readDocumentWithToken('aiUsage', OTHER_UID, owner)), 403);
    assert.equal(await statusOf(() => readDocumentWithToken('aiUsage', OWNER_UID, stranger)), 403);
    assert.equal(await statusOf(() => readDocumentWithToken('aiUsage', OWNER_UID, anonymous)), 403);
  });
});

describe('aiUsageEvents appended through the REST API', () => {
  const eventFields = (task: string, requestId: string) => ({
    userId: OWNER_UID,
    requestId,
    task,
    provider: 'Google Gemini',
    model: 'gemini-3.8-flash',
    promptVersion: '1.0.0',
    status: 'complete',
    inputTokens: null,
    outputTokens: null,
    durationMs: 1234,
  });

  it('accepts every task the app is allowed to ask for', async () => {
    // The task allowlist exists twice — once as AI_TASKS in TypeScript, once inside the rules. If they
    // drift, the route records an error and the archive silently loses metering history.
    for (const task of AI_TASKS) {
      const created = await createDocumentWithToken(
        'aiUsageEvents',
        `req-${task}`,
        eventFields(task, `req-${task}`),
        owner
      );
      assert.equal(created, true, `rules refused task "${task}" — AI_TASKS and firestore.rules have drifted`);
    }
    const recorded = await readDocumentWithToken('aiUsageEvents', 'req-proofread', owner);
    assert.equal(recorded?.createdAt, undefined, 'the event must not carry a client-supplied clock');
    assert.equal(recorded?.inputTokens, null, 'a token count may be absent, but never a body of text');
  });

  it('a repeated requestId is a no-op, not a second charge', async () => {
    const first = await createDocumentWithToken(
      'aiUsageEvents',
      'req-replay',
      eventFields('proofread', 'req-replay'),
      owner
    );
    const second = await createDocumentWithToken(
      'aiUsageEvents',
      'req-replay',
      eventFields('proofread', 'req-replay'),
      owner
    );
    assert.equal(first, true);
    assert.equal(second, false);
  });

  it('Firestore assigns the event time itself, so the history is still orderable', async () => {
    await createDocumentWithToken('aiUsageEvents', 'req-time', eventFields('proofread', 'req-time'), owner);
    const res = await fetch(`${BASE}/aiUsageEvents/req-time`, {
      headers: { Authorization: `Bearer ${owner}` },
    });
    const body = (await res.json()) as { createTime?: string; fields?: Record<string, unknown> };
    assert.match(String(body.createTime), /^\d{4}-\d{2}-\d{2}T\d{2}:/);
    assert.equal(body.fields?.createdAt, undefined, 'only the server-assigned createTime is kept');
  });

  it('refuses an event that carries writing, a prompt, or a model answer', async () => {
    for (const smuggled of [
      { prompt: 'আমার ডায়েরি' },
      { completion: 'model words' },
      { content: 'স্তবক' },
      { entryContent: 'স্তবক' },
    ]) {
      assert.equal(
        await statusOf(() =>
          createDocumentWithToken(
            'aiUsageEvents',
            `req-${Object.keys(smuggled)[0]}`,
            { ...eventFields('proofread', `req-${Object.keys(smuggled)[0]}`), ...smuggled },
            owner
          )
        ),
        403,
        `"${Object.keys(smuggled)[0]}" must never be storable in the metering log`
      );
    }
  });

  it('refuses an event id that is not the requestId it claims', async () => {
    assert.equal(
      await statusOf(() =>
        createDocumentWithToken(
          'aiUsageEvents',
          'req-real',
          eventFields('proofread', 'req-forged'),
          owner
        )
      ),
      403
    );
  });

  it('an unauthenticated REST call cannot mint free metering history', async () => {
    assert.equal(
      await statusOf(() =>
        createDocumentWithToken(
          'aiUsageEvents',
          'req-anon',
          eventFields('proofread', 'req-anon'),
          anonymous
        )
      ),
      403
    );
  });
});

describe('consent document read the way the route reads it', () => {
  it('the owner can read their own aiSettings, and cannot read a neighbour’s', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx
        .firestore()
        .collection('aiSettings')
        .doc(OWNER_UID)
        .set({
          userId: OWNER_UID,
          enabled: true,
          hasConsented: true,
          consentVersion: '1.0.0',
          consentAt: new Date(),
          defaultContextScope: 'selection',
          dailyLimit: 40,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
    });
    const doc = await readDocumentWithToken('aiSettings', OWNER_UID, owner);
    assert.equal(doc?.dailyLimit, 40);
    assert.equal(await statusOf(() => readDocumentWithToken('aiSettings', OTHER_UID, owner)), 403);
    assert.equal(await statusOf(() => readDocumentWithToken('aiSettings', OWNER_UID, anonymous)), 403);
  });

  it('a document id that is not a safe path segment is refused before it reaches the network', async () => {
    assert.equal(
      await statusOf(() => readDocumentWithToken('aiSettings', '../../etc/passwd', owner)),
      0
    );
  });
});

describe('the database the app actually writes to', () => {
  // Production does not use the `(default)` database: firebase-applet-config.json names one, and
  // `firebase deploy --only firestore:rules` attaches a rule set to ONE database id (the CLI reads
  // firestore.database from firebase.json). Getting that pair wrong leaves the real archive with no
  // rules at all while every test here stays green, so the named database is checked explicitly.
  const NAMED_DATABASE = JSON.parse(
    fs.readFileSync('./firebase-applet-config.json', 'utf8')
  ).firestoreDatabaseId as string;

  it('the configuration and firebase.json name the same database', async () => {
    const deployed = JSON.parse(fs.readFileSync('./firebase.json', 'utf8')).firestore.database;
    assert.equal(deployed, NAMED_DATABASE, 'rules would deploy to a database the app never touches');
    assert.match(NAMED_DATABASE, /^[a-zA-Z0-9_\-]{1,128}$/, 'a database id must be a safe path segment');
  });

  it('the same rule set governs the named database, so a write there is not a way around the rules', async () => {
    const root =
      `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/${encodeURIComponent(NAMED_DATABASE)}/documents`;
    const body = JSON.stringify({ fields: { userId: { stringValue: OWNER_UID } } });
    const masked = '?updateMask.fieldPaths=userId';

    const anonymousWrite = await fetch(`${root}/entries/sneak${masked}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    assert.equal(anonymousWrite.status, 403, 'an unauthenticated write into the named database must be refused');

    const ownerWrite = await fetch(`${root}/entries/sneak${masked}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${owner}`, 'Content-Type': 'application/json' },
      body,
    });
    // Refused for the payload, not for the database: the same isValidEntry() decides, here as in (default).
    assert.equal(ownerWrite.status, 403);

    const isolated = await fetch(`${BASE}/entries/sneak`, {
      headers: { Authorization: 'Bearer owner' },
    });
    assert.equal(isolated.status, 404, 'the emulator keeps the two databases apart, as production does');
  });
});
