'use client';

import React, { useEffect, useState } from 'react';
import { BookmarkPlus, Check, FilePlus2, Layers, Trash2 } from 'lucide-react';
import {
  DESK_BACKGROUNDS,
  INK_COLOR_PRESETS,
  JOURNAL_TEMPLATES,
  JournalTemplate,
  PAGE_VARIATIONS,
  PageVariationMeta,
  WRITING_STYLE_PRESETS,
} from '../../lib/journal-templates';
import type {
  DeskBackgroundId,
  EntryType,
  InkColorId,
  JournalEntry,
  PageVariation,
  WritingStyleId,
} from '../../types/entry';
import { BookDialogFrame } from '../common/BookDialogFrame';
import {
  LeatherClaspButton,
  ParchmentPlateButton,
} from '../ui/VerseVaultUI';
import { bookSound } from '../../lib/book-sound-engine';

const CUSTOM_TEMPLATES_STORAGE_KEY = 'versevault_custom_templates_v1';

interface TemplatePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: JournalTemplate, mode: 'new' | 'current') => void;
  onSelectBlankVariation: (variation: PageVariation, mode: 'new' | 'current') => void;
  currentEntry?: JournalEntry | null;
  deskBackground?: DeskBackgroundId;
  onChangeDeskBackground?: (bg: DeskBackgroundId) => void;
  writingStyle?: WritingStyleId;
  onChangeWritingStyle?: (ws: WritingStyleId) => void;
  inkColor?: InkColorId;
  onChangeInkColor?: (ink: InkColorId) => void;
}

function PaperStyleSwatch({ kind }: { kind: PageVariationMeta['previewKind'] }) {
  if (kind === 'ruled') {
    return (
      <div
        aria-hidden="true"
        className="w-11 h-14 rounded-[4px] border border-[#BEA37E] shadow-inner shrink-0 relative overflow-hidden"
        style={{
          background:
            'linear-gradient(90deg, transparent 0px, transparent 8px, rgba(180,82,72,0.45) 8px, rgba(180,82,72,0.45) 9px, transparent 9px), repeating-linear-gradient(to bottom, #FAF3E6 0px, #FAF3E6 7px, rgba(139,109,76,0.32) 7px, rgba(139,109,76,0.32) 8px)',
        }}
      />
    );
  }
  if (kind === 'poetry') {
    return (
      <div
        aria-hidden="true"
        className="w-11 h-14 rounded-[4px] border-2 border-[#B8894A] bg-gradient-to-br from-[#FBF4E6] to-[#EAD7B9] shadow-inner shrink-0 p-1 flex flex-col justify-between items-center"
      >
        <div className="w-full h-full border border-[#C89D66]/70 rounded-[2px] flex flex-col items-center justify-center gap-1">
          <div className="w-5 h-[1.5px] bg-[#8C6239]" />
          <div className="w-4 h-[1.5px] bg-[#8C6239]/70" />
          <div className="w-5 h-[1.5px] bg-[#8C6239]" />
        </div>
      </div>
    );
  }
  if (kind === 'letter') {
    return (
      <div
        aria-hidden="true"
        className="w-11 h-14 rounded-[4px] border border-[#BEA37E] bg-gradient-to-b from-[#FAF1E0] to-[#EAD7B8] shadow-inner shrink-0 p-1.5 relative"
      >
        <div className="w-3 h-3.5 border border-dashed border-[#8B3A32] bg-[#8B3A32]/15 ml-auto rounded-[1px]" />
        <div className="mt-2 space-y-1">
          <div className="w-6 h-[1.5px] bg-[#7A5B3E]/55" />
          <div className="w-7 h-[1.5px] bg-[#7A5B3E]/55" />
        </div>
      </div>
    );
  }
  if (kind === 'dot') {
    return (
      <div
        aria-hidden="true"
        className="w-11 h-14 rounded-[4px] border border-[#BEA37E] shadow-inner shrink-0"
        style={{
          backgroundColor: '#F8EFE0',
          backgroundImage: 'radial-gradient(rgba(115, 88, 58, 0.45) 1px, transparent 1px)',
          backgroundSize: '6px 6px',
        }}
      />
    );
  }
  if (kind === 'nocturnal') {
    return (
      <div
        aria-hidden="true"
        className="w-11 h-14 rounded-[4px] border border-[#7E5D3B] bg-gradient-to-b from-[#231C16] to-[#15100C] shadow-inner shrink-0 p-1.5 flex flex-col justify-between"
      >
        <div className="w-2 h-2 rounded-full bg-[#DFB578]/80 ml-auto" />
        <div className="space-y-1">
          <div className="w-6 h-[1.5px] bg-[#DFB578]/55" />
          <div className="w-5 h-[1.5px] bg-[#DFB578]/40" />
        </div>
      </div>
    );
  }
  if (kind === 'botanical') {
    return (
      <div
        aria-hidden="true"
        className="w-11 h-14 rounded-[4px] border border-[#7B8E6D] bg-gradient-to-br from-[#F4F7EE] to-[#E2EBD8] shadow-inner shrink-0 p-1.5 flex flex-col justify-between"
      >
        <div className="w-3 h-3 rounded-tr-full rounded-bl-full bg-[#5D7A52]/45 ml-auto" />
        <div className="space-y-1">
          <div className="w-6 h-[1.5px] bg-[#4F6846]/55" />
          <div className="w-5 h-[1.5px] bg-[#4F6846]/40" />
        </div>
      </div>
    );
  }
  if (kind === 'illuminated') {
    return (
      <div
        aria-hidden="true"
        className="w-11 h-14 rounded-[4px] border-2 border-[#B37B34] bg-gradient-to-br from-[#FFF6E3] via-[#F5E3C0] to-[#E8CB97] shadow-inner shrink-0 p-1 flex flex-col justify-center items-center"
      >
        <div className="w-full h-full border border-[#8E352E]/60 rounded-[2px] flex flex-col items-center justify-center gap-1">
          <div className="w-2 h-2 rotate-45 bg-[#B37B34]/75" />
          <div className="w-5 h-[1.5px] bg-[#8E352E]/65" />
        </div>
      </div>
    );
  }
  if (kind === 'khadi') {
    return (
      <div
        aria-hidden="true"
        className="w-11 h-14 rounded-[4px] border border-[#A68966] bg-gradient-to-br from-[#EFE3CE] via-[#E5D3B7] to-[#D6BFA0] shadow-inner shrink-0 p-1.5 flex flex-col justify-between"
      >
        <div className="space-y-1.5 border-l border-dashed border-[#7A5B3E]/60 pl-1.5 h-full flex flex-col justify-center">
          <div className="w-5 h-[1.5px] bg-[#6E5035]/60" />
          <div className="w-4 h-[1.5px] bg-[#6E5035]/45" />
        </div>
      </div>
    );
  }
  if (kind === 'ledger') {
    return (
      <div
        aria-hidden="true"
        className="w-11 h-14 rounded-[4px] border border-[#9E886B] shadow-inner shrink-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0px, transparent 10px, rgba(142,58,49,0.4) 10px, rgba(142,58,49,0.4) 11px, transparent 11px), repeating-linear-gradient(to bottom, #F9F2E4 0px, #F9F2E4 6px, rgba(120,100,78,0.25) 6px, rgba(120,100,78,0.25) 7px)',
        }}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="w-11 h-14 rounded-[4px] border border-[#BEA37E] bg-gradient-to-br from-[#FAF2E3] via-[#EFE1CA] to-[#E3CFAF] shadow-inner shrink-0 p-1.5 flex flex-col justify-end"
    >
      <div className="w-5 h-[1.5px] bg-[#8A6744]/50 mb-1" />
      <div className="w-7 h-[1.5px] bg-[#8A6744]/35" />
    </div>
  );
}

export function TemplatePickerModal({
  open,
  onClose,
  onSelectTemplate,
  onSelectBlankVariation,
  currentEntry,
  deskBackground = 'mahogany-study',
  onChangeDeskBackground,
  writingStyle = 'classic-book',
  onChangeWritingStyle,
  inkColor = 'sepia-walnut',
  onChangeInkColor,
}: TemplatePickerModalProps) {
  const [applyMode, setApplyMode] = useState<'new' | 'current'>(
    currentEntry ? 'current' : 'new'
  );
  const [categoryFilter, setCategoryFilter] = useState<'all' | EntryType>('all');
  const [customTemplates, setCustomTemplates] = useState<JournalTemplate[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });
  const [savedNotice, setSavedNotice] = useState<string>('');

  if (!open) return null;

  const allTemplates = [...customTemplates, ...JOURNAL_TEMPLATES];
  const filteredTemplates =
    categoryFilter === 'all'
      ? allTemplates
      : allTemplates.filter((t) => t.type === categoryFilter);

  const handleSaveCurrentAsTemplate = () => {
    if (!currentEntry) return;
    bookSound.playInkStampSound();
    const newCustom: JournalTemplate = {
      id: `tpl-custom-${Date.now()}`,
      nameBn: `${currentEntry.title || 'কাস্টম টেমপ্লেট'} (Custom)`,
      nameEn: currentEntry.title || 'Custom Saved Template',
      descriptionBn: 'আপনার বর্তমান ডায়েরির পাতা থেকে সংরক্ষিত ব্যক্তিগত টেমপ্লেট।',
      type: currentEntry.type,
      pageVariation: currentEntry.pageVariation || 'vintage-parchment',
      mood: currentEntry.mood || '',
      collectionId: currentEntry.collectionId || '',
      defaultTitle: currentEntry.title || 'নতুন পাতা',
      defaultSubtitle: currentEntry.subtitle || '',
      defaultContent: currentEntry.content || '',
      defaultAttribution: currentEntry.attribution || '',
      tags: currentEntry.tags || [],
      isCustom: true,
    };
    const updated = [newCustom, ...customTemplates];
    setCustomTemplates(updated);
    try {
      localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setSavedNotice('বর্তমান পাতাটি কাস্টম টেমপ্লেট হিসেবে সংরক্ষিত হয়েছে!');
    setTimeout(() => setSavedNotice(''), 3000);
  };

  const handleDeleteCustomTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    bookSound.playBrassClickSound();
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    try {
      localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <BookDialogFrame
      open={open}
      title="পাণ্ডুলিপি ছাঁচ, পাতার নকশা ও বইয়ের আবহ (Book Studio & Page Folio)"
      ariaLabelledBy="template-picker-modal-title"
      onClose={() => {
        bookSound.playBrassClickSound();
        onClose();
      }}
      closeLabel="Close templates dialog"
      widthClassName="max-w-3xl"
      footer={
        <ParchmentPlateButton onClick={onClose}>
          বন্ধ করুন (Close)
        </ParchmentPlateButton>
      }
    >
        <p className="text-xs font-bangla text-[var(--ink-soft)] leading-relaxed">
          পছন্দের বইয়ের ভেতরের আবহ ও বাঁধাইয়ের রঙ (৮টি থিম), কাগজের ধরন (১০টি পাতা), হাতের লেখার ছাঁদ, ঝর্ণাকলমের কালি ও সাহিত্যিক টেমপ্লেট বেছে নিন।
        </p>

        {/* Section 0: Book Interior & Binding Theme, Writing Style & Fountain Ink */}
        {(onChangeDeskBackground || onChangeWritingStyle || onChangeInkColor) && (
          <div
            style={{
              background: 'var(--vv-secondary-btn-bg)',
              borderColor: 'var(--vv-card-border)',
            }}
            className="mt-4 p-3.5 rounded-[8px] border space-y-4 transition-all duration-300"
          >
            {onChangeDeskBackground && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-bangla text-[var(--ink)]">
                    ✦ বইয়ের ভেতরের আবহ ও থিম (Book Interior &amp; Binding Theme — ৮টি আবহ)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DESK_BACKGROUNDS.map((bg) => {
                    const active = deskBackground === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => {
                          bookSound.playBrassClickSound();
                          onChangeDeskBackground(bg.id);
                        }}
                        style={
                          active
                            ? {
                                background: bg.primaryButtonCss,
                                borderColor: bg.primaryButtonBorderHex,
                                color: bg.primaryButtonTextHex,
                              }
                            : {
                                background: 'var(--vv-card-bg)',
                                borderColor: 'var(--vv-card-border)',
                              }
                        }
                        className={`p-2 rounded-[6px] border text-left transition-all flex items-center gap-2 cursor-pointer ${
                          active
                            ? 'ring-1 ring-[#D8A668]/50 shadow-xs'
                            : 'text-[var(--ink)] hover:brightness-97'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="w-6 h-6 rounded-full border border-white/30 shrink-0 shadow-inner"
                          style={{ background: bg.swatchGradient }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-bold font-bangla truncate">
                            {bg.nameBn}
                          </span>
                          <span
                            className={`block text-[9.5px] truncate ${
                              active ? 'opacity-85' : 'text-[var(--ink-soft)]'
                            }`}
                          >
                            {bg.shortLabel}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div
              style={{ borderColor: 'var(--vv-card-border)' }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-dashed"
            >
              {onChangeWritingStyle && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold font-bangla text-[var(--ink)] block">
                    ✦ লেখার ছাঁদ ও বিন্যাস (Writing Style)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {WRITING_STYLE_PRESETS.map((ws) => {
                      const active = writingStyle === ws.id;
                      return (
                        <button
                          key={ws.id}
                          type="button"
                          onClick={() => {
                            bookSound.playPenScratchSound();
                            onChangeWritingStyle(ws.id);
                          }}
                          title={ws.description}
                          style={
                            active
                              ? {
                                  background: 'var(--vv-primary-btn-bg)',
                                  borderColor: 'var(--vv-primary-btn-border)',
                                  color: 'var(--vv-primary-btn-text)',
                                }
                              : {
                                  background: 'var(--vv-card-bg)',
                                  borderColor: 'var(--vv-card-border)',
                                }
                          }
                          className={`px-2.5 py-1.5 rounded-[5px] border text-left text-[11px] font-bangla transition-all cursor-pointer truncate ${
                            active
                              ? 'font-semibold'
                              : 'text-[var(--ink)] hover:brightness-97'
                          }`}
                        >
                          {ws.nameBn}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {onChangeInkColor && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold font-bangla text-[var(--ink)] block">
                    ✦ ঝর্ণাকলমের কালি (Fountain Pen Ink)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {INK_COLOR_PRESETS.map((ink) => {
                      const active = inkColor === ink.id;
                      return (
                        <button
                          key={ink.id}
                          type="button"
                          onClick={() => {
                            bookSound.playInkStampSound();
                            onChangeInkColor(ink.id);
                          }}
                          style={
                            active
                              ? {
                                  background: 'var(--vv-primary-btn-bg)',
                                  borderColor: 'var(--vv-primary-btn-border)',
                                  color: 'var(--vv-primary-btn-text)',
                                }
                              : {
                                  background: 'var(--vv-card-bg)',
                                  borderColor: 'var(--vv-card-border)',
                                }
                          }
                          className={`px-2.5 py-1.5 rounded-[5px] border text-left text-[11px] font-bangla transition-all flex items-center gap-2 cursor-pointer truncate ${
                            active
                              ? 'font-semibold'
                              : 'text-[var(--ink)] hover:brightness-97'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0"
                            style={{ backgroundColor: ink.swatchHex }}
                          />
                          <span className="truncate">{ink.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Target Action Mode Bar: Create New Page vs Apply to Current Open Page */}
        <div
          style={{
            background: 'var(--vv-secondary-btn-bg)',
            borderColor: 'var(--vv-card-border)',
          }}
          className="mt-4 px-3 py-2.5 rounded-[6px] border flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bangla font-semibold text-[var(--ink)] mr-1">
              প্রয়োগের মাধ্যম:
            </span>
            <button
              type="button"
              onClick={() => {
                bookSound.playBrassClickSound();
                setApplyMode('new');
              }}
              style={
                applyMode === 'new'
                  ? {
                      background: 'var(--vv-primary-btn-bg)',
                      borderColor: 'var(--vv-primary-btn-border)',
                      color: 'var(--vv-primary-btn-text)',
                    }
                  : {
                      background: 'var(--vv-card-bg)',
                      borderColor: 'var(--vv-card-border)',
                    }
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] text-xs font-bangla border transition-all cursor-pointer ${
                applyMode === 'new'
                  ? 'font-semibold shadow-2xs'
                  : 'text-[var(--ink)]'
              }`}
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>নতুন পাতা তৈরি করুন (New Entry)</span>
            </button>
            {currentEntry && (
              <button
                type="button"
                onClick={() => {
                  bookSound.playBrassClickSound();
                  setApplyMode('current');
                }}
                style={
                  applyMode === 'current'
                    ? {
                        background: 'var(--vv-primary-btn-bg)',
                        borderColor: 'var(--vv-primary-btn-border)',
                        color: 'var(--vv-primary-btn-text)',
                      }
                    : {
                        background: 'var(--vv-card-bg)',
                        borderColor: 'var(--vv-card-border)',
                      }
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] text-xs font-bangla border transition-all cursor-pointer ${
                  applyMode === 'current'
                    ? 'font-semibold shadow-2xs'
                    : 'text-[var(--ink)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>বর্তমান পাতায় প্রয়োগ করুন (Apply to Open Page)</span>
              </button>
            )}
          </div>

          {currentEntry && (
            <button
              type="button"
              onClick={handleSaveCurrentAsTemplate}
              style={{
                background: 'var(--vv-card-bg)',
                borderColor: 'var(--vv-card-border)',
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-xs font-bangla hover:brightness-97 text-[var(--ink)] border cursor-pointer transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>বর্তমান পাতাটি টেমপ্লেট হিসেবে সংরক্ষণ করুন</span>
            </button>
          )}
        </div>

        {savedNotice && (
          <div className="mt-3 px-3 py-2 rounded-[6px] bg-[#4A6339] text-[#F7F3EB] text-xs font-bangla flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* Template & variation grids (the shared frame supplies the scroll) */}
        <div className="mt-5 space-y-6">
          {/* Section 1: 10 Blank Paper & Page Variations with Visual Swatches */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] font-bangla">
                ✦ ১. কাগজের ধরন ও পৃষ্ঠার নকশা (10 Manuscript Paper Styles)
              </span>
              <span
                style={{ backgroundColor: 'var(--vv-card-border)' }}
                className="flex-1 h-[1px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PAGE_VARIATIONS.map((pv) => {
                const isCurrentActive =
                  currentEntry?.pageVariation === pv.id;
                return (
                  <button
                    key={pv.id}
                    type="button"
                    onClick={() => {
                      bookSound.playPageTurnSound('next');
                      onSelectBlankVariation(pv.id, applyMode);
                      onClose();
                    }}
                    style={{
                      background: isCurrentActive
                        ? 'var(--vv-card-selected-bg)'
                        : 'var(--vv-card-bg)',
                      borderColor: isCurrentActive
                        ? 'var(--vv-accent)'
                        : 'var(--vv-card-border)',
                    }}
                    className={`relative text-left p-3 rounded-[8px] hover:brightness-97 border transition-all group flex items-start gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_4px_rgba(20,12,5,0.1)] cursor-pointer ${
                      isCurrentActive ? 'ring-1 ring-[var(--accent)]/40' : ''
                    }`}
                  >
                    <PaperStyleSwatch kind={pv.previewKind} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-sm font-bold font-bangla text-[var(--ink)] group-hover:text-[var(--accent)] truncate">
                          {pv.nameBn}
                        </span>
                        <span
                          style={{ borderColor: 'var(--vv-card-border)' }}
                          className="text-[10px] px-1.5 py-0.5 rounded-[3px] border bg-black/5 dark:bg-white/5 text-[var(--ink-soft)] shrink-0"
                        >
                          {pv.shortLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-soft)] mt-1 line-clamp-2 leading-snug">
                        {pv.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Guided Literary & Diary Templates with Category Filter */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] font-bangla">
                ✦ ২. সাহিত্য ও ডায়েরি টেমপ্লেট ({filteredTemplates.length}টি প্রস্তুত কাঠামো)
              </span>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1">
                {(
                  [
                    { id: 'all', label: 'সব (All)' },
                    { id: 'diary', label: 'দিনলিপি (Diary)' },
                    { id: 'poem', label: 'কবিতা (Poem)' },
                    { id: 'prose', label: 'চিঠি ও গদ্য (Letter)' },
                    { id: 'quote', label: 'উদ্ধৃতি (Quote)' },
                    { id: 'fragment', label: 'টুকরো ভাবনা' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      bookSound.playBrassClickSound();
                      setCategoryFilter(tab.id);
                    }}
                    style={
                      categoryFilter === tab.id
                        ? {
                            background: 'var(--vv-primary-btn-bg)',
                            borderColor: 'var(--vv-primary-btn-border)',
                            color: 'var(--vv-primary-btn-text)',
                          }
                        : {
                            background: 'var(--vv-secondary-btn-bg)',
                            borderColor: 'var(--vv-card-border)',
                          }
                    }
                    className={`px-2.5 py-0.5 rounded-[4px] text-[11px] font-bangla border transition-all cursor-pointer ${
                      categoryFilter === tab.id
                        ? 'font-medium'
                        : 'text-[var(--ink)] hover:brightness-97'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => {
                    bookSound.playPageTurnSound('next');
                    onSelectTemplate(tpl, applyMode);
                    onClose();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      bookSound.playPageTurnSound('next');
                      onSelectTemplate(tpl, applyMode);
                      onClose();
                    }
                  }}
                  style={{
                    background: 'var(--vv-card-bg)',
                    borderColor: 'var(--vv-card-border)',
                  }}
                  className="relative text-left p-4 rounded-[8px] hover:brightness-97 border transition-all group flex flex-col justify-between gap-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_5px_rgba(20,12,5,0.1)] cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold font-bangla text-[var(--ink)] group-hover:text-[var(--accent)]">
                        {tpl.nameBn}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          style={{ borderColor: 'var(--vv-card-border)' }}
                          className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[3px] border bg-black/5 dark:bg-white/5 text-[var(--ink-soft)]"
                        >
                          {tpl.type}
                        </span>
                        {tpl.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomTemplate(e, tpl.id)}
                            aria-label={`Delete custom template ${tpl.nameBn}`}
                            className="p-1 rounded bg-[#8B3A32]/15 text-[#8B3A32] hover:bg-[#8B3A32] hover:text-white transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs font-bangla text-[var(--ink-soft)]">
                      {tpl.descriptionBn}
                    </p>
                    {/* Snippet of actual template text */}
                    <div
                      style={{
                        background: 'var(--vv-secondary-btn-bg)',
                        borderColor: 'var(--vv-card-border)',
                      }}
                      className="p-2 rounded-[5px] border text-[11px] font-bangla text-[var(--ink)] line-clamp-2 whitespace-pre-line"
                    >
                      {tpl.defaultContent}
                    </div>
                  </div>

                  <div
                    style={{ borderColor: 'var(--vv-card-border)' }}
                    className="pt-2 border-t border-dashed flex items-center justify-between text-[11px] text-[var(--accent)] font-bangla"
                  >
                    <span className="truncate">শিরোনাম: “{tpl.defaultTitle}”</span>
                    <span className="font-semibold group-hover:underline shrink-0 ml-2">
                      {applyMode === 'current'
                        ? 'বর্তমান পাতায় বসান →'
                        : 'নতুন পাতায় লিখুন →'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: 8 Unique Book Atmospheres & Complete Conceptual Transformations */}
          <div className="space-y-3 pt-2 border-t border-[#D5C0A1] dark:border-[#3A3025]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5F422D] dark:text-[#D8B485] font-bangla">
                ✦ ৩. বইয়ের সার্বিক আবহ ও চামড়ার বাঁধাই (8 Unique Book Atmospheres &amp; Concepts)
              </span>
              <span className="flex-1 h-[1px] bg-gradient-to-r from-[#C8B192] dark:from-[#4A3D2F] to-transparent" />
            </div>
            <p className="text-xs font-bangla text-[#63513F] dark:text-[#B8A48C]">
              প্রতিটি আবহ কেবল রং পরিবর্তন করে না—চামড়ার বাঁধাই, পাতার গঠন, রেশমি ফিতা ও মনস্তাত্ত্বিক সাহিত্যিক অনুভবকে সম্পূর্ণ রূপান্তর করে।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {DESK_BACKGROUNDS.map((bg) => {
                const isActive = deskBackground === bg.id;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => {
                      bookSound.playPageTurnSound('next');
                      onChangeDeskBackground?.(bg.id);
                    }}
                    className={`relative text-left p-3.5 rounded-[10px] border transition-all flex flex-col justify-between gap-3 shadow-md cursor-pointer ${
                      isActive
                        ? 'ring-2 ring-[#DFB578] border-[#9E6E3D] shadow-lg scale-[1.01]'
                        : 'border-[#CBB494] dark:border-[#463B2F] hover:scale-[1.01] opacity-95 hover:opacity-100'
                    }`}
                    style={{
                      background: bg.backgroundCss,
                      borderColor: isActive ? '#DFB578' : bg.flapBorderHex,
                    }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border border-white/40 shadow-xs shrink-0"
                            style={{ background: bg.accentHex }}
                          />
                          <h4 className="text-sm font-bold font-bangla text-[#FDF8F0] drop-shadow-xs">
                            {bg.nameBn}
                          </h4>
                        </div>
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#DFB578] text-[#24140B] font-bold font-bangla">
                            সক্রিয়
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] font-bangla text-[#E6D4BE] leading-relaxed">
                        {bg.conceptSubtitleBn}
                      </p>

                      <div className="p-2 rounded-[6px] bg-black/35 border border-white/10 text-[10.5px] font-bangla text-[#E8D9C5] italic">
                        {bg.conceptQuoteBn}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-[#DFB578] font-bangla">
                      <span className="truncate">রেশমি ফিতা: {bg.shortLabel}</span>
                      <span className="font-semibold underline">আবহ রূপান্তর করুন →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
    </BookDialogFrame>
  );
}
