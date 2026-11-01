'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { LeatherClaspButton, ParchmentPlateButton } from '../ui/VerseVaultUI';
import { BookDialogFrame } from './BookDialogFrame';

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
  return (
    <BookDialogFrame
      open={open}
      title={title}
      eyebrow="Confirm"
      onClose={onCancel}
      closeLabel="Close confirmation dialog"
      footer={
        <>
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
        </>
      }
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[var(--danger)]" />
        <p className="text-xs sm:text-sm font-bangla text-[var(--ink-soft)] leading-relaxed">
          {description}
        </p>
      </div>
    </BookDialogFrame>
  );
}
