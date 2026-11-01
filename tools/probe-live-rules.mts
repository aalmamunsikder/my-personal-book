import fs from 'node:fs';

/**
 * Read-only probe of the rules that are ACTUALLY DEPLOYED on the owner's project.
 *
 * Everything else in this repository proves what `firestore.rules` says when the emulator runs it. It
 * says nothing about the ruleset the live project is serving, and the repository is public, so the
 * project id and publishable web key are already known to anyone. This script answers one question with
 * one request each: can an anonymous caller read the archive right now?
 *
 * It never prints document content — only HTTP status, the rules engine's error status, and field NAMES.
 * Run with `npx tsx tools/probe-live-rules.mts` or `node --import ./tools/register-ts-resolver.mjs`.
 */

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8')) as {
  projectId: string;
  firestoreDatabaseId: string;
  apiKey: string;
};

const base = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents`;

async function get(path: string): Promise<void> {
  const res = await fetch(`${base}${path}?key=${config.apiKey}`);
  const body = (await res.text()).replace(/\s+/g, ' ').slice(0, 200);
  console.log(`anonymous get   ${path}: HTTP ${res.status} ${body}`);
}

async function list(collection: string): Promise<void> {
  const res = await fetch(`${base}:runQuery?key=${config.apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: collection }], limit: { value: '1' } } }),
  });
  const text = await res.text();
  let summary: string;
  try {
    const chunks = JSON.parse(text) as { error?: { status?: string }; document?: { fields?: Record<string, unknown> } }[];
    const denial = chunks.find((c) => c.error)?.error?.status;
    const row = chunks.find((c) => c.document)?.document;
    summary = denial
      ? `denied=${denial}`
      : row
        // A readable row is a leak: report that it happened and which fields exist, never their values.
        ? `LEAK: readable row with fields ${JSON.stringify(Object.keys(row.fields ?? {}))}`
        : 'accepted but empty';
  } catch {
    summary = `unparsable response: ${text.slice(0, 120)}`;
  }
  console.log(`anonymous list  ${collection}: HTTP ${res.status} ${summary}`);
}

for (const collection of ['entries', 'collections', 'tags', 'profiles', 'settings']) {
  await list(collection);
}
await get('/entries/probe-no-such-id');
await get(`/profiles/${config.projectId}`);
