/**
 * Reconciles the locally held archive with a Firestore snapshot.
 *
 * Lives apart from `context/JournalContext.tsx` so the rules below can be executed by the test
 * runner: they decide whether an author's unsent writing survives a sync, and that is not
 * something to leave unexercised.
 */

export interface VersionedRecord {
  id: string;
  version: number;
}

export interface ArchiveMerge<Input> {
  /** What the client holds, including edits the server has never confirmed. */
  local: Input[];
  /** Everything the snapshot returned. A document the server deleted is simply absent. */
  remote: Input[];
  /** Ids the server has returned or accepted at least once, so absence here means deletion. */
  serverKnownIds: Iterable<string>;
  /** Ids with a local change no server write has confirmed. */
  dirtyIds: Iterable<string>;
  /** Ids the owner deleted while signed out, replayed once a write is possible. */
  pendingDeleteIds: Iterable<string>;
}

export function mergeArchive<Input extends VersionedRecord>({
  local,
  remote,
  serverKnownIds,
  dirtyIds,
  pendingDeleteIds,
}: ArchiveMerge<Input>): Input[] {
  const serverKnown = new Set(serverKnownIds);
  const dirty = new Set(dirtyIds);
  const pendingDelete = new Set(pendingDeleteIds);
  const remoteIds = new Set(remote.map((item) => item.id));

  const merged = new Map<string, Input>();
  for (const item of local) {
    if (!pendingDelete.has(item.id)) merged.set(item.id, item);
  }

  for (const item of remote) {
    if (pendingDelete.has(item.id)) continue;
    const held = merged.get(item.id);
    // Unsent writing outranks the stored copy. Overwriting it would destroy the only version of
    // words the author typed while offline or signed out.
    if (held && dirty.has(item.id)) continue;
    if (!held || item.version >= held.version) merged.set(item.id, item);
  }

  for (const item of local) {
    if (pendingDelete.has(item.id)) continue;
    if (remoteIds.has(item.id)) continue;
    // Never-seen-and-unsent is a pending upload, not a deletion. Only a document the server once
    // had and no longer returns counts as deleted, and only when nothing unsent is held for it.
    if (dirty.has(item.id) || !serverKnown.has(item.id)) continue;
    merged.delete(item.id);
  }

  return Array.from(merged.values());
}
