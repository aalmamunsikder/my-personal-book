'use client';

import React from 'react';
import { Check, RefreshCw, TriangleAlert } from 'lucide-react';
import type { SaveState } from '../../types/entry';

interface SaveStateIndicatorProps {
  saveState: SaveState;
  onSaveNow: () => void;
  onRetry: () => void;
  className?: string;
}

/**
 * One indicator, shared by the editor and the leather spread, because the two call sites had drifted:
 * neither showed `local` or `conflict` at all, so a page held only in browser memory looked identical
 * to a page that was safely in the archive. `saved` is reached only after a committed Firestore write.
 */
export function SaveStateIndicator({ saveState, onSaveNow, onRetry, className = '' }: SaveStateIndicatorProps) {
  if (saveState === 'idle') return null;

  return (
    <span role="status" aria-live="polite" className={`text-xs ${className}`.trim()}>
      {saveState === 'saving' && <span>Saving…</span>}

      {saveState === 'saved' && (
        <span className="inline-flex items-center gap-1 text-[var(--olive)]">
          <Check className="w-3.5 h-3.5" />
          Saved
        </span>
      )}

      {saveState === 'dirty' && (
        <button
          type="button"
          onClick={onSaveNow}
          className="inline-flex items-center gap-1 text-[var(--ink-soft)] underline"
        >
          Unsaved changes · Save now
        </button>
      )}

      {saveState === 'local' && (
        <span className="text-[var(--ink-soft)]">
          Kept on this device only — sign in to write it into your archive
        </span>
      )}

      {saveState === 'failed' && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1 text-[var(--danger)] underline"
        >
          <RefreshCw className="w-3 h-3" />
          Not synced — your text is safe here · Retry
        </button>
      )}

      {saveState === 'conflict' && (
        <span className="inline-flex items-start gap-1 text-[var(--danger)]">
          <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            This page has a newer copy in the archive. Nothing was overwritten — open it again and
            merge by hand before saving.
          </span>
        </span>
      )}
    </span>
  );
}
