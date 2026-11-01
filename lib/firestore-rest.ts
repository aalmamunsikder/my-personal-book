import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseConfig.projectId;
const DATABASE_ID =
  process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)';
// Set by `firebase emulators:exec` and by the Firebase emulator suite in general — the same variable
// the Admin SDK honours. Without it the REST base is hardcoded to the live project, which means the
// rules could only ever be exercised against the SDK path, never against the writer this route uses.
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
const DOCUMENT_ROOT = `projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;
const REST_BASE = EMULATOR_HOST
  ? `http://${EMULATOR_HOST}/v1/${DOCUMENT_ROOT}`
  : `https://firestore.googleapis.com/v1/${DOCUMENT_ROOT}`;
const REQUEST_TIMEOUT_MS = 8000;

export class FirestoreRestError extends Error {
  readonly status: number;
  readonly reason: 'network' | 'rejected-by-rules' | 'http';

  // Written as explicit assignments rather than constructor parameter properties: `node --test` runs
  // this file through type-stripping, which rejects the shorthand and would make the shipped writer
  // unimportable from a test.
  constructor(status: number, reason: 'network' | 'rejected-by-rules' | 'http') {
    super(`firestore-rest-${reason}-${status}`);
    this.name = 'FirestoreRestError';
    this.status = status;
    this.reason = reason;
  }
}

/** Document ids only ever come from a verified token subject, but path segments are checked anyway. */
function assertSafeSegment(value: string): void {
  if (!/^[a-zA-Z0-9_\-]{1,128}$/.test(value)) {
    throw new FirestoreRestError(0, 'rejected-by-rules');
  }
}

type FirestoreValue = Record<string, unknown>;

function decodeValue(value: FirestoreValue | undefined): unknown {
  if (!value || typeof value !== 'object') return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    const list = (value.arrayValue as { values?: FirestoreValue[] } | undefined)?.values ?? [];
    return list.map(decodeValue);
  }
  if ('mapValue' in value) {
    return decodeFields((value.mapValue as { fields?: Record<string, FirestoreValue> } | undefined)?.fields);
  }
  return undefined;
}

function decodeFields(fields?: Record<string, FirestoreValue>): Record<string, unknown> {
  if (!fields) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    const decoded = decodeValue(value);
    if (decoded !== undefined) out[key] = decoded;
  }
  return out;
}

function encodeFields(fields: Record<string, unknown>): Record<string, FirestoreValue> {
  const encoded: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string') encoded[key] = { stringValue: value };
    else if (typeof value === 'boolean') encoded[key] = { booleanValue: value };
    else if (typeof value === 'number') encoded[key] = { integerValue: String(Math.trunc(value)) };
    else if (value === null) encoded[key] = { nullValue: null };
    else throw new FirestoreRestError(0, 'rejected-by-rules');
  }
  return encoded;
}

async function restFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    throw new FirestoreRestError(0, 'network');
  }
}

/**
 * Reads one document using the caller's own Firebase ID token, so Security Rules decide whether the
 * route handler ever sees it. A 403 here is the rule set working, not an obstacle to route around.
 */
export async function readDocumentWithToken(
  collection: string,
  documentId: string,
  idToken: string
): Promise<Record<string, unknown> | null> {
  assertSafeSegment(collection);
  assertSafeSegment(documentId);
  const response = await restFetch(`${REST_BASE}/${collection}/${documentId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new FirestoreRestError(response.status, 'http');
  const payload = (await response.json()) as { fields?: Record<string, FirestoreValue> };
  return decodeFields(payload.fields);
}

/**
 * Field-masked PATCH: the listed fields are written and everything else is left untouched, so a
 * metering write cannot clobber a document. A missing document is created under the create rules.
 * PATCH accepts no field transforms — it answers 400 "Payload isn't valid for request" — which is
 * why the meter carries no timestamp field of its own.
 */
export async function writeDocumentFields(
  collection: string,
  documentId: string,
  fields: Record<string, unknown>,
  idToken: string
): Promise<void> {
  assertSafeSegment(collection);
  assertSafeSegment(documentId);
  const mask = Object.keys(fields)
    .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
    .join('&');
  const response = await restFetch(`${REST_BASE}/${collection}/${documentId}?${mask}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFields(fields) }),
  });
  if (!response.ok) throw new FirestoreRestError(response.status, 'http');
}

/**
 * Append-only create. `POST /documents/{collection}?documentId=…` is rejected when the id already
 * exists, so a retried request cannot double-count an event; that rejection arrives as 409 and is
 * reported as false rather than as an error.
 *
 * There is deliberately no server-timestamp option here. Firestore's REST surface applies
 * SERVER_TIME transforms only inside `documents:commit`, and the commit endpoint answers
 * 400 "Payload isn't valid for request" on the emulator, so a create carries no clock at all:
 * `firestore.rules` refuses `createdAt` on these documents and Firestore's own document createTime
 * is the timestamp. A client-supplied time would be exactly that.
 */
export async function createDocumentWithToken(
  collection: string,
  documentId: string,
  fields: Record<string, unknown>,
  idToken: string
): Promise<boolean> {
  assertSafeSegment(collection);
  assertSafeSegment(documentId);
  const response = await restFetch(`${REST_BASE}/${collection}?documentId=${encodeURIComponent(documentId)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFields(fields) }),
  });
  if (response.status === 409) return false;
  if (!response.ok) throw new FirestoreRestError(response.status, 'http');
  return true;
}
