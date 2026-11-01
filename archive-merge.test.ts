import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeArchive, type VersionedRecord } from './lib/archive-merge.ts';

interface Rec extends VersionedRecord {
  label: string;
}

const rec = (id: string, version: number, label = id): Rec => ({ id, version, label });

const ids = (list: Rec[]) => list.map((r) => r.id).sort();

test('a document the server once had and no longer returns is removed', () => {
  const result = mergeArchive({
    local: [rec('keep', 1), rec('gone', 1)],
    remote: [rec('keep', 1)],
    serverKnownIds: ['keep', 'gone'],
    dirtyIds: [],
    pendingDeleteIds: [],
  });
  assert.deepEqual(ids(result), ['keep']);
});

test('a local document the server has never accepted is treated as a pending upload, not a deletion', () => {
  const result = mergeArchive({
    local: [rec('draft', 1)],
    remote: [],
    serverKnownIds: [],
    dirtyIds: [],
    pendingDeleteIds: [],
  });
  assert.deepEqual(ids(result), ['draft']);
});

test('unsent writing survives a snapshot that no longer contains the document', () => {
  const result = mergeArchive({
    local: [rec('edited', 4)],
    remote: [],
    serverKnownIds: ['edited'],
    dirtyIds: ['edited'],
    pendingDeleteIds: [],
  });
  assert.deepEqual(ids(result), ['edited']);
});

test('a remote copy never overwrites a local change the server has not confirmed', () => {
  const result = mergeArchive({
    local: [rec('a', 2, 'local words')],
    remote: [rec('a', 9, 'server words')],
    serverKnownIds: ['a'],
    dirtyIds: ['a'],
    pendingDeleteIds: [],
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].label, 'local words');
  assert.equal(result[0].version, 2);
});

test('a confirmed document is replaced when the server copy is at least as new', () => {
  const result = mergeArchive({
    local: [rec('a', 3, 'stale')],
    remote: [rec('a', 3, 'fresh')],
    serverKnownIds: ['a'],
    dirtyIds: [],
    pendingDeleteIds: [],
  });
  assert.equal(result[0].label, 'fresh');
});

test('a new remote document is added', () => {
  const result = mergeArchive({
    local: [rec('a', 1)],
    remote: [rec('a', 1), rec('b', 1)],
    serverKnownIds: ['a', 'b'],
    dirtyIds: [],
    pendingDeleteIds: [],
  });
  assert.deepEqual(ids(result), ['a', 'b']);
});

test('a deletion made while signed out is replayed forward and not resurrected', () => {
  const result = mergeArchive({
    local: [rec('a', 1), rec('b', 1)],
    remote: [rec('a', 1), rec('b', 1)],
    serverKnownIds: ['a', 'b'],
    dirtyIds: [],
    pendingDeleteIds: ['b'],
  });
  assert.deepEqual(ids(result), ['a']);
});

test('an empty snapshot clears a fully synchronised archive rather than leaving ghosts', () => {
  const result = mergeArchive({
    local: [rec('a', 1), rec('b', 2)],
    remote: [],
    serverKnownIds: ['a', 'b'],
    dirtyIds: [],
    pendingDeleteIds: [],
  });
  assert.deepEqual(result, []);
});

test('merging is idempotent: feeding its own output back changes nothing', () => {
  const input = {
    local: [rec('a', 1), rec('b', 5), rec('draft', 1)],
    remote: [rec('a', 2), rec('b', 5)],
    serverKnownIds: ['a', 'b'],
    dirtyIds: ['b'],
    pendingDeleteIds: [],
  };
  const once = mergeArchive(input);
  const twice = mergeArchive({ ...input, local: once });
  assert.deepEqual(ids(once), ids(twice));
  assert.deepEqual(once, twice);
});
