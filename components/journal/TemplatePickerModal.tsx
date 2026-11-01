'use client';

import React, { useEffect, useState } from 'react';
import { BookmarkPlus, Check, FilePlus2, Layers, Sparkles, Trash2, X } from 'lucide-react';
import {
  JOURNAL_TEMPLATES,
  JournalTemplate,
  PAGE_VARIATIONS,
  PageVariationMeta,
} from '../../lib/journal-templates';
import { EntryType, JournalEntry, PageVariation } from '../../types/entry';
import {
  BrassCornerOrnament,
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
}: TemplatePickerModalProps) {
  const [applyMode, setApplyMode] = useState<'new' | 'current'>('new');
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-picker-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs"
    >
      <div className="relative bg-[#F6ECDC] dark:bg-[#1E1914] border-2 border-[#8B6343] rounded-[12px] max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-[0_28px_70px_rgba(10,5,2,0.8),inset_0_0_0_2px_rgba(200,157,102,0.22)]">
        {/* Embossed Leather Header */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-[#342216] via-[#2A1B11] to-[#20130B] text-[#F5E9D7] flex items-center justify-between border-b-2 border-[#7E5B3D]">
          <BrassCornerOrnament position="tl" size="sm" />
          <BrassCornerOrnament position="tr" size="sm" />
          <div className="flex items-center gap-3 pl-2">
            <div className="w-9 h-9 rounded-[6px] bg-[#4B3221] border border-[#8E694A] flex items-center justify-center shadow-inner shrink-0">
              <Sparkles className="w-4 h-4 text-[#DFB578]" />
            </div>
            <div>
              <h2
                id="template-picker-modal-title"
                className="text-base sm:text-lg font-bangla font-bold tracking-wide text-[#FAF0E1]"
              >
                পাণ্ডুলিপি ছাঁচ ও পাতার নকশা (Archival Templates &amp; Page Folio)
              </h2>
              <p className="text-xs text-[#D2B99B] font-bangla">
                নতুন পাতা শুরু করুন অথবা বর্তমান পাতায় পছন্দের কাগজের নকশা ও সাহিত্যিক কাঠামো প্রয়োগ করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              bookSound.playBrassClickSound();
              onClose();
            }}
            aria-label="Close templates dialog"
            className="p-1.5 rounded-[5px] bg-[#462F1F] hover:bg-[#5B3D28] border border-[#7E5B3D] text-[#F5E9D7] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Action Mode Bar: Create New Page vs Apply to Current Open Page */}
        <div className="px-5 py-2.5 bg-[#EADBC4] dark:bg-[#272019] border-b border-[#C8AF8C] dark:border-[#3E3328] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bangla font-semibold text-[#4E3725] dark:text-[#D8C2A6] mr-1">
              প্রয়োগের মাধ্যম:
            </span>
            <button
              type="button"
              onClick={() => {
                bookSound.playBrassClickSound();
                setApplyMode('new');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] text-xs font-bangla border transition-all cursor-pointer ${
                applyMode === 'new'
                  ? 'bg-[#5B3E29] text-[#FDF8F0] border-[#8E694A] font-semibold shadow-2xs'
                  : 'bg-[#F8EFE0] dark:bg-[#1E1813] text-[#4E3725] dark:text-[#C8B297] border-[#C2A884] dark:border-[#463A2E]'
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
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[5px] text-xs font-bangla border transition-all cursor-pointer ${
                  applyMode === 'current'
                    ? 'bg-[#5B3E29] text-[#FDF8F0] border-[#8E694A] font-semibold shadow-2xs'
                    : 'bg-[#F8EFE0] dark:bg-[#1E1813] text-[#4E3725] dark:text-[#C8B297] border-[#C2A884] dark:border-[#463A2E]'
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-xs font-bangla bg-[#FBF4E7] dark:bg-[#312820] hover:bg-[#EFE0C6] text-[#5A3E28] dark:text-[#E5C8A3] border border-[#BEA37E] dark:border-[#524334] cursor-pointer transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-[#8C5E35]" />
              <span>বর্তমান পাতাটি টেমপ্লেট হিসেবে সংরক্ষণ করুন</span>
            </button>
          )}
        </div>

        {savedNotice && (
          <div className="px-5 py-2 bg-[#4A6339] text-[#F7F3EB] text-xs font-bangla flex items-center gap-2">
            <Check className="w-3.5 h-3.5" />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Section 1: 6 Blank Paper & Page Variations with Visual Swatches */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5F422D] dark:text-[#D8B485] font-bangla">
                ✦ ১. কাগজের ধরন ও পৃষ্ঠার নকশা (6 Manuscript Paper Styles)
              </span>
              <span className="flex-1 h-[1px] bg-gradient-to-r from-[#C8B192] dark:from-[#4A3D2F] to-transparent" />
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
                    className={`relative text-left p-3 rounded-[8px] bg-gradient-to-b from-[#FDF8F0] to-[#F1E4CE] dark:from-[#2A231C] dark:to-[#211B15] hover:from-[#F6E9D4] hover:to-[#E6D3B5] dark:hover:from-[#332A21] dark:hover:to-[#28211A] border transition-all group flex items-start gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_4px_rgba(20,12,5,0.12)] cursor-pointer ${
                      isCurrentActive
                        ? 'border-[#8C5E35] dark:border-[#D8A668] ring-1 ring-[#8C5E35]/40'
                        : 'border-[#C6AE8C] dark:border-[#463B2F]'
                    }`}
                  >
                    <PaperStyleSwatch kind={pv.previewKind} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-sm font-bold font-bangla text-[#2B1E16] dark:text-[#F3E6D2] group-hover:text-[#7A4E2D] dark:group-hover:text-[#E5B879] truncate">
                          {pv.nameBn}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] border border-[#C5AD8B] dark:border-[#524435] bg-[#E8D7BE] dark:bg-[#382F25] text-[#5A402C] dark:text-[#DFC7A7] shrink-0">
                          {pv.shortLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#665544] dark:text-[#B5A189] mt-1 line-clamp-2 leading-snug">
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
              <span className="text-xs font-bold uppercase tracking-wider text-[#5F422D] dark:text-[#D8B485] font-bangla">
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
                    className={`px-2.5 py-0.5 rounded-[4px] text-[11px] font-bangla border transition-all cursor-pointer ${
                      categoryFilter === tab.id
                        ? 'bg-[#5A3E28] text-[#FAF2E4] border-[#8C6747] font-medium'
                        : 'bg-[#EFE1CA] dark:bg-[#2A231C] text-[#5A422E] dark:text-[#C9B398] border-[#C6AE8C] dark:border-[#453A2E] hover:bg-[#E4D1B3]'
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
                  className="relative text-left p-4 rounded-[8px] bg-gradient-to-b from-[#FDF8F0] to-[#F2E5CF] dark:from-[#2A231C] dark:to-[#211B15] hover:from-[#F6E9D4] hover:to-[#E6D3B5] dark:hover:from-[#332A21] dark:hover:to-[#28211A] border border-[#C6AE8C] dark:border-[#463B2F] transition-all group flex flex-col justify-between gap-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_5px_rgba(20,12,5,0.12)] cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold font-bangla text-[#2B1E16] dark:text-[#F4E7D3] group-hover:text-[#7A4E2D] dark:group-hover:text-[#E5B879]">
                        {tpl.nameBn}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[3px] border border-[#C5AD8B] dark:border-[#524435] bg-[#E5D3B8] dark:bg-[#382F25] text-[#5C412C] dark:text-[#DFC7A7]">
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
                    <p className="text-xs font-bangla text-[#63513F] dark:text-[#B8A48C]">
                      {tpl.descriptionBn}
                    </p>
                    {/* Snippet of actual template text */}
                    <div className="p-2 rounded-[5px] bg-[#EFE2CC]/60 dark:bg-[#191410]/80 border border-[#D5C0A1]/70 dark:border-[#3A3025] text-[11px] font-bangla text-[#4A3728] dark:text-[#D5C0A5] line-clamp-2 whitespace-pre-line">
                      {tpl.defaultContent}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed border-[#D3BE9E] dark:border-[#3A3127] flex items-center justify-between text-[11px] text-[#6E4F3A] dark:text-[#D8B485] font-bangla">
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

          <div className="flex justify-end pt-1">
            <ParchmentPlateButton onClick={onClose}>
              বন্ধ করুন (Close)
            </ParchmentPlateButton>
          </div>
        </div>
      </div>
    </div>
  );
}
