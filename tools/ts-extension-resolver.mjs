import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CANDIDATE_SUFFIXES = ['.ts', '.tsx', '/index.ts'];

/**
 * Node's ESM loader requires explicit file extensions, while the app is bundled by Next, which
 * resolves extensionless specifiers. This hook bridges the two so `node --test` can import the
 * real source files instead of test-local copies that silently drift from them.
 */
export async function resolve(specifier, context, nextResolve) {
  const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
  const hasExtension = /\.[cm]?[jt]sx?$/.test(specifier);
  if (isRelative && !hasExtension && context.parentURL?.startsWith('file:')) {
    const base = new URL(specifier, context.parentURL);
    for (const suffix of CANDIDATE_SUFFIXES) {
      const candidate = new URL(base.href + suffix);
      if (existsSync(fileURLToPath(candidate))) {
        return { url: candidate.href, shortCircuit: true };
      }
    }
  }
  return nextResolve(specifier, context);
}
