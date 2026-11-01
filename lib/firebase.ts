import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  login_hint: 'aalmamunsikder@gmail.com',
  prompt: 'select_account',
});

// A const object rather than `enum`: the type-stripping test runner cannot evaluate enums, and
// these members are only ever used as string labels.
export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
} as const;

export type OperationType = (typeof OperationType)[keyof typeof OperationType];

export interface FirestoreErrorInfo {
  operationType: OperationType;
  path: string | null;
  code: string;
  signedIn: boolean;
}

/**
 * Reports which operation failed and nothing more. UIDs, emails and provider data are personal
 * information, and raw SDK messages can echo document content — neither belongs in a console that
 * an error collector may read.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const info: FirestoreErrorInfo = {
    operationType,
    path,
    code:
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: unknown }).code)
        : 'unknown',
    signedIn: auth.currentUser !== null,
  };
  console.error('Firestore operation failed:', JSON.stringify(info));
  throw new Error(`Firestore ${operationType} failed (${info.code}).`);
}
