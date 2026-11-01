import {
  assertFails as refusedByEngine,
  assertSucceeds as acceptedByEngine,
} from '@firebase/rules-unit-testing';

/**
 * The published `assertFails`/`assertSucceeds` accept exactly one argument, so a reason written next to
 * a payload — which is how these tests name the `security_spec.md` payload they cover — would be
 * silently ignored, and a failing run would report "Expected request to fail" with no idea which of a
 * hundred assertions fired. These wrappers keep the reason while delegating the important part: the
 * refusal must be the rules engine's PERMISSION_DENIED, not any error at all.
 */

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Preserve the SDK error's `code`, which is how the library recognises a rules refusal. */
function annotate(error: unknown, reason: string): Error {
  const annotated = new Error(`${reason}: ${describe(error)}`) as Error & { code?: unknown };
  const code = (error as { code?: unknown })?.code;
  if (code !== undefined) annotated.code = code;
  return annotated;
}

export async function assertFails(promise: Promise<unknown>, reason?: string): Promise<void> {
  const target = reason ? promise.catch((error: unknown) => { throw annotate(error, reason); }) : promise;
  try {
    await refusedByEngine(target);
  } catch (error) {
    if (describe(error).startsWith('Expected request to fail') && reason) {
      throw new Error(`${reason}: the rules engine accepted this request`);
    }
    throw error;
  }
}

export async function assertSucceeds<T>(promise: Promise<T>, reason?: string): Promise<T> {
  try {
    return await acceptedByEngine(promise);
  } catch (error) {
    throw new Error(`${reason ?? 'expected the rules engine to accept this request'}: ${describe(error)}`);
  }
}
