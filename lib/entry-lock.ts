const PBKDF2_ITERATIONS = 150000;
const KEY_LENGTH_BITS = 256;
const SALT_BYTES = 16;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function subtle(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error(
      'Web Crypto is unavailable, so entry passphrases cannot be verified. A secure context (https or localhost) is required.'
    );
  }
  return crypto.subtle;
}

async function derive(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await subtle().importKey('raw', enc.encode(password.normalize('NFKC')), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await subtle().deriveBits(
    {
      name: 'PBKDF2',
      salt: fromHex(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    KEY_LENGTH_BITS
  );
  return toHex(new Uint8Array(bits as ArrayBuffer));
}

export interface EntryLockSecret {
  lockPasswordHash: string;
  lockSalt: string;
}

/**
 * Normalizes so a passphrase pasted with different Unicode composition still matches.
 * NFKC must stay identical between setLockSecret and verifyLockSecret or unlocks break.
 */
export async function setLockSecret(password: string): Promise<EntryLockSecret> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const saltHex = toHex(salt);
  return {
    lockPasswordHash: await derive(password.trim().normalize('NFKC'), saltHex),
    lockSalt: saltHex,
  };
}

export async function verifyLockSecret(
  password: string,
  secret: { lockPasswordHash?: string; lockSalt?: string }
): Promise<boolean> {
  const expected = secret.lockPasswordHash ?? '';
  const saltHex = secret.lockSalt ?? '';
  if (!expected || !saltHex) return false;
  const attempt = await derive(password.trim().normalize('NFKC'), saltHex);
  if (attempt.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < attempt.length; i += 1) {
    diff |= attempt.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export const NO_LOCK_SECRET: EntryLockSecret = { lockPasswordHash: '', lockSalt: '' };
