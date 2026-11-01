'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { BrassCornerOrnament, LeatherClaspButton, ParchmentPlateButton } from '../ui/VerseVaultUI';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'স্থায়ীভাবে মুছে ফেলুন (Delete Permanently)',
  cancelLabel = 'বাতিল (Cancel)',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
    >
      <div className="relative bg-[#F6ECDC] dark:bg-[#241E19] border-2 border-[#8B6343] rounded-[9px] max-w-md w-full p-5 space-y-4 shadow-[0_20px_50px_rgba(12,6,2,0.6),inset_0_0_0_2px_rgba(195,155,105,0.3)]">
        <BrassCornerOrnament position="tl" />
        <BrassCornerOrnament position="tr" />
        <BrassCornerOrnament position="bl" />
        <BrassCornerOrnament position="br" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5 text-[var(--danger)]">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 id="confirm-dialog-title" className="text-base font-bangla font-bold text-[var(--ink)]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            className="text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm font-bangla text-[var(--ink-soft)] leading-relaxed border-y border-dashed border-[#D3BE9E] dark:border-[#3D3329] py-3">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <ParchmentPlateButton onClick={onCancel} size="md">
            {cancelLabel}
          </ParchmentPlateButton>
          <LeatherClaspButton
            variant="crimson"
            size="sm"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmLabel}
          </LeatherClaspButton>
        </div>
      </div>
    </div>
  );
}
