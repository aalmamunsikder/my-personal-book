import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

/**
 * What this file proves, and what it does not.
 *
 * These tests read the real `firestore.rules` and `firebase-blueprint.json` from disk. They prove
 * the rule text says what we believe it says, and that the blueprint and the rules cannot drift
 * apart silently. They do NOT prove how the Firestore engine evaluates a condition — that is
 * `firestore.rules.emulator.test.ts` (SDK writes) and `firestore.rules.rest.test.ts` (the REST
 * writer used by /api/ai-assist), both of which run the file through the emulator's rules engine
 * under `npm run test:rules`. What this file adds is the cheap, static half: key sets, id patterns,
 * and the language constructs the engine is known not to implement.
 *
 * The Dirty Dozen payloads run against a validator generated from the blueprint rather than a
 * hand-copied list of constants, so the same document that the rules were written against decides
 * the outcome.
 */

const RULES = fs.readFileSync('./firestore.rules', 'utf8');
const BLUEPRINT = JSON.parse(fs.readFileSync('./firebase-blueprint.json', 'utf8'));

const ADMIN_EMAIL = 'aalmamunsikder@gmail.com';

function blockAfter(needle: string): string {
  const start = RULES.indexOf(needle);
  assert.notEqual(start, -1, `firestore.rules is missing "${needle}"`);
  // Search after the needle: `match /entries/{entryId}` contains braces that are path parameters,
  // not the opening brace of the block.
  const open = RULES.indexOf('{', start + needle.length);
  let depth = 0;
  for (let i = open; i < RULES.length; i += 1) {
    if (RULES[i] === '{') depth += 1;
    if (RULES[i] === '}') {
      depth -= 1;
      if (depth === 0) return RULES.slice(open + 1, i);
    }
  }
  throw new Error(`unbalanced braces after "${needle}"`);
}

function functionBody(name: string): string {
  return blockAfter(`function ${name}(`);
}

function matchBlock(path: string): string {
  return blockAfter(`match ${path}`);
}

/** Every `allow <verb>:` line inside a block, with its condition text. */
function allowLines(block: string): { verb: string; condition: string }[] {
  const out: { verb: string; condition: string }[] = [];
  const re = /allow\s+([a-z, -]+):\s*([^;]*);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    out.push({ verb: m[1].trim(), condition: m[2].replace(/\s+/g, ' ').trim() });
  }
  return out;
}

function keyList(body: string, which: 'hasAll' | 'hasOnly'): string[] {
  const re = new RegExp(`data\\.keys\\(\\)\\.${which}\\(\\[([\\s\\S]*?)\\]\\)`);
  const m = re.exec(body);
  assert.ok(m, `validator body is missing .${which}([...])`);
  return (m[1].match(/'([^']+)'/g) ?? []).map((s) => s.slice(1, -1));
}

type SchemaNode = {
  type?: string | string[];
  properties?: Record<string, SchemaNode>;
  required?: string[];
  enum?: unknown[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
};

function jsonType(value: unknown, allowed: string[]): string {  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value) && allowed.includes('integer')) return 'integer';
  return typeof value;
}

function validateAgainst(entityName: string, data: Record<string, unknown>): boolean {
  const schema = BLUEPRINT.entities[entityName] as SchemaNode;
  const properties = Object.keys(schema.properties ?? {});
  const keys = Object.keys(data);
  if (!schema.required!.every((key) => keys.includes(key))) return false;
  if (!keys.every((key) => properties.includes(key))) return false;

  for (const key of keys) {
    const rule = (schema.properties ?? {})[key] as SchemaNode;
    const value = data[key];
    const types: string[] = rule.type ? (Array.isArray(rule.type) ? rule.type : [rule.type]) : [];
    if (rule.type && !types.includes(jsonType(value, types))) return false;
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) return false;
      if (rule.maxLength !== undefined && value.length > rule.maxLength) return false;
      if (rule.pattern && !new RegExp(rule.pattern).test(value)) return false;
    }
    if (typeof value === 'number' && (rule.minimum !== undefined && value < rule.minimum ||
      rule.maximum !== undefined && value > rule.maximum)) return false;
    if (Array.isArray(value)) {
      if (rule.maxLength !== undefined && value.length > rule.maxLength) return false;
      if (rule.minLength !== undefined && value.length < rule.minLength) return false;
    }
    if (rule.enum && !rule.enum.includes(value)) return false;
  }
  return true;
}

function validEntryPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    userId: 'user-admin',
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
    createdAt: '2026-10-31T08:00:00.000Z',
    updatedAt: '2026-10-31T08:00:00.000Z',
    ...overrides,
  };
}

const ADMIN = { uid: 'user-admin', email: ADMIN_EMAIL, email_verified: true };
const UNVERIFIED = { uid: 'user-admin', email: ADMIN_EMAIL, email_verified: false };
const INTRUDER = { uid: 'user-admin', email: 'intruder@gmail.com', email_verified: true };

const ENTRY_MATCH = matchBlock('/entries/{entryId}');
const ENTRY_GET = allowLines(ENTRY_MATCH).find((line) => line.verb === 'get')!;
const ENTRY_LIST = allowLines(ENTRY_MATCH).find((line) => line.verb === 'list')!;
const ENTRY_CREATE = allowLines(ENTRY_MATCH).find((line) => line.verb === 'create')!;
const ENTRY_UPDATE = allowLines(ENTRY_MATCH).find((line) => line.verb === 'update')!;
const ENTRY_DELETE = allowLines(ENTRY_MATCH).find((line) => line.verb === 'delete')!;

test('firestore.rules: version 2, default-deny catch-all, and the owner identity gate', () => {
  assert.match(RULES, /rules_version\s*=\s*'2';/);
  assert.match(RULES, /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;/);

  const isAdmin = functionBody('isAdmin');
  assert.match(isAdmin, /isSignedIn\(\)/);
  assert.match(isAdmin, new RegExp(`'${ADMIN_EMAIL}'`));
  assert.match(functionBody('isSignedIn'), /request\.auth != null/);
  assert.match(functionBody('isSignedIn'), /request\.auth\.token\.email_verified == true/);
});

test('SEC-001..003: an anonymous caller cannot read any entry', () => {
  for (const line of [ENTRY_GET, ENTRY_LIST]) {
    assert.match(line.condition, /isAdmin\(\)/, `${line.verb} must require the owner`);
    assert.doesNotMatch(line.condition, /\|\|/, `${line.verb} must not offer an alternative path in`);
    assert.doesNotMatch(line.condition, /isTrashed == false \|\|/);
  }
  // No rule anywhere grants read access without an authentication check.
  const unauthenticatedGrants = RULES.split('\n')
    .filter((line) => /^\s*allow\s+(read|get|list)\s*:/.test(line))
    .filter((line) => !/isAdmin\(\)|isOwner\(|isSignedIn\(\)/.test(line))
    .filter((line) => !/if\s+false/.test(line));
  assert.deepEqual(unauthenticatedGrants, [], `anonymous read grants found: ${unauthenticatedGrants.join(' | ')}`);
});

test('Dirty Dozen #1: trashed and non-trashed entries are equally unreadable without a session', () => {
  assert.equal(ENTRY_GET.condition.includes('request.auth'), true);
  assert.equal(ENTRY_GET.condition.includes('if true'), false);
});

test('Dirty Dozen #2: unverified or non-owner email cannot write', () => {
  assert.equal(ENTRY_CREATE.condition.includes('isAdmin()'), true);
  assert.equal(UNVERIFIED.email_verified, false);
  assert.equal(
    /email_verified == true/.test(functionBody('isSignedIn')),
    true,
    'an unverified session must fail isSignedIn()'
  );
  assert.equal(functionBody('isAdmin').includes('intruder'), false);
  assert.equal(INTRUDER.email, 'intruder@gmail.com');
});

test('Dirty Dozen #3 + #10: the owner id is pinned to the token, on create and on update', () => {
  assert.match(ENTRY_CREATE.condition, /isValidEntry\(incoming\(\)\)/);
  assert.match(functionBody('isValidEntry'), /data\.userId == request\.auth\.uid/);
  assert.match(ENTRY_UPDATE.condition, /existing\(\)\.userId == request\.auth\.uid/);
  assert.match(ENTRY_UPDATE.condition, /incoming\(\)\.userId == existing\(\)\.userId/);
});

test('Dirty Dozen #4 + #9: ghost fields and poisoned document ids are rejected', () => {
  assert.equal(validateAgainst('Entry', validEntryPayload({ isPublic: true })), false);
  assert.equal(validateAgainst('Entry', validEntryPayload({ lockPassword: 'hunter2' })), false);
  assert.match(ENTRY_CREATE.condition, /isValidId\(entryId\)/);

  // The id pattern in the rules and the owner-id pattern in the blueprint must be one contract, not two.
  const rulesPattern = /id\.matches\('(\^\[.+\]\+\$)'\)/.exec(functionBody('isValidId'))![1];
  const blueprintPattern = String(BLUEPRINT.entities.Profile.properties.userId.pattern);
  const normalize = (p: string) => p.replace(/\\/g, '');
  assert.equal(normalize(rulesPattern), normalize(blueprintPattern),
    `rules id pattern ${rulesPattern} drifted from blueprint ${blueprintPattern}`);
  assert.match(functionBody('isValidId'), /id\.size\(\) >= 1 && id\.size\(\) <= 128/);
});

test('Dirty Dozen #5 + #6 + #7 + #8: enums, formats and size ceilings from the blueprint', () => {
  assert.equal(validateAgainst('Entry', validEntryPayload({ type: 'blog_post' })), false);
  assert.equal(validateAgainst('Entry', validEntryPayload({ pageVariation: 'neon-cyberpunk' })), false);
  assert.equal(validateAgainst('Entry', validEntryPayload({ entryDate: '31-10-2026' })), false);
  assert.equal(validateAgainst('Entry', validEntryPayload({ title: 'ক'.repeat(305) })), false);
  assert.equal(validateAgainst('Entry', validEntryPayload({ tags: Array.from({ length: 12 }, (_, i) => `tag-${i}`) })), false);
  assert.equal(validateAgainst('Entry', validEntryPayload()), true);
});

test('Dirty Dozen #11 + #12: forged timestamps rejected, and list scraping needs the owner', () => {
  assert.match(ENTRY_CREATE.condition, /incoming\(\)\.createdAt == request\.time/);
  assert.match(ENTRY_CREATE.condition, /incoming\(\)\.updatedAt == request\.time/);
  assert.match(ENTRY_LIST.condition, /resource\.data\.userId == request\.auth\.uid/);
});

test('Dirty Dozen #13: a locked page never stores the passphrase itself', () => {
  const entryValidator = functionBody('isValidEntry');
  assert.equal(/'lockPassword'/.test(entryValidator), false, 'rules must not accept a plaintext passphrase');
  assert.match(entryValidator, /'lockPasswordHash'/);
  assert.match(entryValidator, /'lockSalt'/);
  // Locking a page without any credentials is refused; unlocking clears both.
  const lockGate = functionBody('isValidEntry').match(/data\.isLocked == false \|\| \((data\.lockPasswordHash[\s\S]*?)\)\)/);
  assert.ok(lockGate, 'isLocked must imply a hash and a salt');
  assert.match(lockGate![1], /lockPasswordHash\.size\(\) >= 32/);
  assert.match(lockGate![1], /lockSalt\.size\(\) >= 8/);
  assert.equal(validateAgainst('Entry', validEntryPayload({ isLocked: true, lockPasswordHash: '', lockSalt: '' })), true,
    'the blueprint leaves the hashed-value length check to the rules; see the SEC lock tests');
});

test('concurrent-write control: version must advance by exactly one per update', () => {
  assert.match(functionBody('nextVersionIsValid'), /existingData\.version : 0\) \+ 1/);
  assert.match(ENTRY_UPDATE.condition, /nextVersionIsValid\(incoming\(\), existing\(\)\)/);
  assert.match(ENTRY_CREATE.condition, /incoming\(\)\.version == 1/);
});

test('legacy documents may be rewritten once, only to drop the plaintext passphrase', () => {
  const body = functionBody('isEntryUpdateDiffAllowed');
  const branches = [...body.matchAll(/affectedKeys\(\)\.hasOnly\(\[([\s\S]*?)\]\)/g)]
    .map((m) => (m[1].match(/'([^']+)'/g) ?? []).map((s) => s.slice(1, -1)));
  assert.equal(branches.length, 2, 'expected one ordinary branch and one legacy-clearing branch');
  assert.equal(branches[0].includes('lockPassword'), false,
    'an ordinary update must never be able to write a plaintext passphrase');
  assert.match(body, /'lockPassword' in existingData/);
  assert.match(body, /!\('lockPassword' in incomingData\)/);
  assert.equal(branches[1].includes('lockPassword'), true,
    'the migration branch must list lockPassword among the keys it is removing');
});

test('AI collections: consent is owner-only, metering is append-forward, nothing deletes', () => {
  const aiUsage = allowLines(matchBlock('/aiUsage/{userId}'));
  const aiSettings = allowLines(matchBlock('/aiSettings/{userId}'));
  const aiEvents = allowLines(matchBlock('/aiUsageEvents/{eventId}'));

  for (const line of [...aiUsage, ...aiSettings, ...aiEvents]) {
    if (line.verb === 'delete' || line.verb === 'update') {
      if (/^if false$/.test(line.condition)) continue;
    }
    assert.match(line.condition, /isAdmin\(\)|isOwner\(|if false/, `${line.verb} is not owner-gated`);
  }
  assert.deepEqual(aiUsage.map((line) => line.verb), ['get', 'create', 'update', 'delete']);
  assert.match(functionBody('isValidAiSettings'), /data\.enabled == false \|\| \(data\.hasConsented == true/);
  // No client-supplied clock on a metering event: Firestore's own document createTime is the time the
  // request happened, and the rules refuse any field that would let the writer invent one.
  assert.match(functionBody('isValidAiUsageEvent'), /!\('createdAt' in data\)/);
  assert.equal(
    (BLUEPRINT.entities.AiUsageEvent.properties.createdAt as unknown) === undefined,
    true,
    'the blueprint must not reintroduce a stored timestamp on usage events'
  );
  assert.equal(
    matchBlock('/aiUsageEvents/{eventId}').includes('request.time'),
    false,
    'the event match block must not compare a client field against request.time'
  );
  assert.equal(
    (BLUEPRINT.entities.AiUsageEvent.properties.content as unknown) === undefined,
    true,
    'usage events must never gain a content field'
  );
});

test('blueprint and rules cannot drift: required keys are identical', () => {
  const pairs: [string, string][] = [
    ['Profile', 'isValidProfile'],
    ['Entry', 'isValidEntry'],
    ['Collection', 'isValidCollection'],
    ['Tag', 'isValidTag'],
    ['UserSettings', 'isValidSettings'],
    ['AiUsage', 'isValidAiUsage'],
    ['AiSettings', 'isValidAiSettings'],
    ['AiUsageEvent', 'isValidAiUsageEvent'],
  ];
  for (const [entity, fnName] of pairs) {
    const schema = BLUEPRINT.entities[entity] as SchemaNode;
    const required = [...schema.required!].sort();
    const body = functionBody(fnName);
    assert.deepEqual(keyList(body, 'hasAll').sort(), required, `${fnName} hasAll != blueprint required`);
    assert.deepEqual(keyList(body, 'hasOnly').sort(), Object.keys(schema.properties!).sort(), `${fnName} hasOnly != blueprint properties`);
  }
});

test('TXT-001 & TXT-002: Bangla Unicode vowels, conjuncts, and mixed English-Bangla fidelity', () => {
  const testText = `নশ্বরতার উপাখ্যান — silence is also a language.
কিছু কথা কখনো বলা হয় না,
শুধু লিখে রাখা হয়...
কারচিহ্ন: কি, কী, কু, কূ, কে, কৈ, কো, কৌ।
চিহ্ন: ! ? , . ; : — … “ ” ‘ ’ ( ) [ ] { } ৳ © ™ → ★ ♡ 🌙 ✍️ 🍂 ❤️`;

  const payload = validEntryPayload({ content: testText });
  assert.equal(payload.content, testText);
  assert.equal(validateAgainst('Entry', payload), true);
});

test('the rules use no language construct the engine refuses to resolve', () => {
  // An unimplemented function is not a compile error in this rules engine: the condition raises
  // "Function not found error" at evaluation time, which reads as a denial. `data.tags.all(...)` sat
  // in this file for weeks and made every valid entry write fail, while every test that expected a
  // denial kept passing for the wrong reason. Each name below was probed against a list value in the
  // emulator and failed to resolve, so the static check is enough to stop one coming back.
  const code = RULES
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');
  const unsupported = ['all', 'exists', 'map', 'filter', 'transformList', 'get', 'contains'];
  for (const name of unsupported) {
    const call = new RegExp(`\\.${name}\\(`);
    assert.equal(
      call.test(code),
      false,
      `firestore.rules calls .${name}(); the rules engine does not implement it, and the condition would ` +
        'fail closed as an evaluation error rather than raising an alarm'
    );
  }
});
