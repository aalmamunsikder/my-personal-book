import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { DEFAULT_OWNER_ID, INITIAL_SETTINGS } from './lib/journal-defaults.ts';

const FIXTURE_MODULE = 'lib/seed-data.ts';
const CLIENT_DIRS = ['app', 'components', 'context', 'hooks', 'lib'];

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(path, found);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.ts$/.test(entry.name)) found.push(path);
  }
  return found;
}

test('no client module imports the prototype diary fixtures', () => {
  const offenders = CLIENT_DIRS.flatMap((dir) =>
    sourceFiles(dir)
      .filter((path) => path !== FIXTURE_MODULE)
      .filter((path) => /from\s+['"][^'"]*seed-data(\.ts)?['"]/.test(readFileSync(path, 'utf8'))),
  );
  assert.deepEqual(
    offenders,
    [],
    `${FIXTURE_MODULE} holds the author's sample poems and prose. Importing anything from it makes the ` +
      'whole module reachable from the browser bundle, so the private writing ships publicly. Move the ' +
      'constant the client needs into lib/journal-defaults.ts instead.',
  );
});

test('the module the client is allowed to import carries no diary content', () => {
  const source = readFileSync('lib/journal-defaults.ts', 'utf8');
  assert.equal(/[\u0980-\u09FF]/.test(source), false, 'no Bangla text may live in the client-owned defaults module');
  assert.equal(/entry-2025/.test(source), false, 'no fixture document ids may live in the client-owned defaults module');
});

test('moving the constants preserved the settings the archive falls back to', () => {
  assert.equal(DEFAULT_OWNER_ID, 'local-owner-vault');
  assert.equal(INITIAL_SETTINGS.userId, DEFAULT_OWNER_ID);
  assert.equal(INITIAL_SETTINGS.theme, 'light');
  assert.equal(INITIAL_SETTINGS.autosaveEnabled, true);
  assert.equal(INITIAL_SETTINGS.showWordCount, true);
  assert.equal(INITIAL_SETTINGS.density, 'comfortable');
  assert.equal(INITIAL_SETTINGS.readingWidth, 'standard');
  assert.equal(INITIAL_SETTINGS.defaultEntryType, 'diary');
  assert.equal(INITIAL_SETTINGS.defaultFont, 'auto');
});

test('the fixtures are still available to the code that legitimately needs them', () => {
  const fixtures = readFileSync(FIXTURE_MODULE, 'utf8');
  assert.match(fixtures, /export const SAMPLE_ENTRIES/);
  assert.match(fixtures, /export const SAMPLE_COLLECTIONS/);
  assert.match(fixtures, /export const SAMPLE_TAGS/);
  assert.equal(
    /export const INITIAL_SETTINGS/.test(fixtures),
    false,
    'INITIAL_SETTINGS must not be defined in the fixture module or it is bundled again',
  );
  assert.equal(
    /export const DEFAULT_OWNER_ID/.test(fixtures),
    false,
    'DEFAULT_OWNER_ID must not be defined in the fixture module or it is bundled again',
  );
});
