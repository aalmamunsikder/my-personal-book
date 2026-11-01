import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const OWNER_EMAIL = 'aalmamunsikder@gmail.com';
const CLIENT_DIRS = ['app', 'components', 'context', 'hooks', 'lib'];

// The owner's address may exist in exactly two kinds of place: the server that verifies the session,
// and the one client constant that compares against it. Anywhere else it is either rendered to a
// visitor or shipped in a static chunk that anyone can download.
const ALLOWED = new Set(['context/JournalContext.tsx', 'app/api/ai-assist/route.ts']);

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(path, found);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.ts$/.test(entry.name)) found.push(path);
  }
  return found;
}

test('the owner address appears nowhere but the verifier and the gating constant', () => {
  const offenders = CLIENT_DIRS.flatMap((dir) =>
    sourceFiles(dir).filter((p) => !ALLOWED.has(p) && readFileSync(p, 'utf8').includes(OWNER_EMAIL)),
  );
  assert.deepEqual(offenders, [], `these files carry the owner's address into the browser: ${offenders.join(', ')}`);
});

test('no component can read the owner address, so none can render it', () => {
  const exporters = CLIENT_DIRS.flatMap((dir) =>
    sourceFiles(dir)
      .filter((p) => p !== 'context/JournalContext.tsx')
      .filter((p) => /ADMIN_EMAIL|adminEmail/.test(readFileSync(p, 'utf8'))),
  );
  assert.deepEqual(exporters, [], 'ADMIN_EMAIL is gating state, not a display value — keep it private to the context module');
  assert.equal(
    /export const ADMIN_EMAIL/.test(readFileSync('context/JournalContext.tsx', 'utf8')),
    false,
    'exporting the constant is what let 14 components print it',
  );
});

test('the Google sign-in popup is not seeded with the owner address', () => {
  const firebase = readFileSync('lib/firebase.ts', 'utf8');
  assert.equal(/login_hint\s*:/.test(firebase), false, 'login_hint pre-fills the account chooser for every visitor');
  assert.match(firebase, /prompt: 'select_account'/, 'the chooser must stay, or the owner cannot pick their own account');
});

test('rejecting a wrong account does not tell that account whose diary it is', () => {
  const context = readFileSync('context/JournalContext.tsx', 'utf8');
  assert.equal(/\$\{ADMIN_EMAIL\}/.test(context), false, 'no rejection message may interpolate the address');
  const signedOutCopy = ['components/views/OwnerLoginView.tsx', 'components/views/SettingsBackupView.tsx'];
  for (const file of signedOutCopy) {
    assert.equal(readFileSync(file, 'utf8').includes(OWNER_EMAIL), false, `${file} renders to anonymous visitors`);
  }
});
