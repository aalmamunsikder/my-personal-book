'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { BrassCornerOrnament } from '../ui/VerseVaultUI';

/**
 * The leather frame in `OpenLeatherJournalSpread` renders this id as an empty child. A dialog that
 * portals into it is positioned by the book itself, so it reads as a page laid into the spread instead
 * of a browser modal floating over the desk. When the book is not on screen (the signed-out cover) the
 * portal target is absent and the frame falls back to the viewport.
 */
export const BOOK_DIALOG_ROOT_ID = 'versevault-book-dialog-root';

interface BookDialogFrameProps {
  open: boolean;
  title: string;
  eyebrow?: string;
  ariaLabelledBy?: string;
  onClose: () => void;
  closeLabel?: string;
  widthClassName?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function BookDialogFrame({
  open,
  title,
  eyebrow,
  ariaLabelledBy = 'book-dialog-title',
  onClose,
  closeLabel = 'Close dialog',
  widthClassName = 'max-w-md',
  footer,
  children,
}: BookDialogFrameProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // A dialog body that mounts an `autoFocus` field keeps that focus; the panel is only a fallback.
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Looked up while open rather than stored in an effect: the anchor is part of the same render pass,
  // and a dialog is only ever opened by a client-side interaction.
  const target = typeof document === 'undefined' ? null : document.getElementById(BOOK_DIALOG_ROOT_ID);
  const mount = target ?? document.body;
  const inBook = mount === target && target !== null;
  const scrimPosition = inBook ? 'absolute' : 'fixed';
  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      className={`${scrimPosition} inset-0 z-50 flex items-center justify-center p-4 sm:p-8 rounded-[22px] bg-[#140C06]/60 backdrop-blur-[2px]`}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative ${widthClassName} w-full rounded-[10px] border-2 border-[#8B6343] dark:border-[#6B4E36] bg-[#F6ECDC] dark:bg-[#241E19] shadow-[0_24px_60px_rgba(12,6,2,0.65),inset_0_0_0_2px_rgba(195,155,105,0.28)] outline-none`}
      >
        <BrassCornerOrnament position="tl" />
        <BrassCornerOrnament position="tr" />
        <BrassCornerOrnament position="bl" />
        <BrassCornerOrnament position="br" />

        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-dashed border-[#D3BE9E] dark:border-[#3D3329]">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--ink-muted)] font-bangla">
                {eyebrow}
              </p>
            )}
            <h2
              id={ariaLabelledBy}
              className="text-base sm:text-lg font-bangla font-bold text-[var(--ink)] leading-snug"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="shrink-0 p-1.5 rounded-[5px] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[#E7D6BB]/70 dark:hover:bg-[#332A21] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[62vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 px-5 py-4 border-t border-dashed border-[#D3BE9E] dark:border-[#3D3329]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(node, mount);
}
