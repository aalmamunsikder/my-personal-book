'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Book,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Feather,
  Heart,
  Laptop,
  Layers,
  Palette,
  RefreshCw,
  RotateCcw,
  Sliders,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import type {
  AppearanceConfig,
  AppearancePreset,
  AppThemeId,
  CoverStyleId,
  PageTemplateId,
  PaperSurfaceId,
  TypographyPresetId,
} from '../../types/appearance';
import {
  COVER_STYLES,
  DEFAULT_APPEARANCE_CONFIG,
  FACTORY_PRESETS,
  FACTORY_THEMES,
  PAGE_TEMPLATES,
  PAPER_SURFACES,
  resolveEffectiveAppearance,
  TYPOGRAPHY_PRESETS,
} from '../../lib/themes';
import {
  getStoredAppearanceConfig,
  getStoredAppearancePresets,
  resetLayer,
  saveStoredAppearanceConfig,
  saveStoredAppearancePresets,
} from '../../lib/appearance-storage';
import { suggestAccessibleInk, validateContrast } from '../../lib/contrast-utils';
import { TemplateDispatcher } from '../templates/TemplateDispatcher';
import { CollectionCoverCard } from './CollectionCoverCard';
import type { JournalCollection, JournalEntry } from '../../types/entry';

type StudioCategory =
  | 'presets'
  | 'theme'
  | 'paper'
  | 'template'
  | 'typography'
  | 'covers'
  | 'colors'
  | 'decorations'
  | 'my-presets';

interface AppearanceStudioModalProps {
  open: boolean;
  onClose: () => void;
  collections?: JournalCollection[];
  targetCollectionId?: string;
  onApplyGlobal?: (config: AppearanceConfig) => void;
  onApplyCollection?: (collectionId: string, override: Partial<AppearanceConfig>) => void;
}

// Synthetic preview entries according to section 9.3
const PREVIEW_ENTRIES: Record<'diary' | 'poem' | 'quote' | 'fragment', { bn: JournalEntry; en: JournalEntry }> = {
  diary: {
    bn: {
      id: 'prev-diary-bn',
      userId: 'preview',
      title: 'নীরবতার অলিন্দে একাকীত্ব',
      subtitle: 'রাতের ডায়রি ও অনুভব',
      content: `আজ শহরের সব কোলাহল শান্ত হয়ে আসার পর টেবিলের কোণে বসে মনে হলো—\n\nঅনেক কথা কাউকে বলা যায় না। সেগুলি শুধু নিজের খাতার পাতায় জমে থাকে। যখন বাইরে বৃষ্টি নামে, ভেজা মাটির ঘ্রাণ ঘর ভরে যায়, তখন পুরনো স্মৃতির পাতাগুলো একে একে ভেসে ওঠে।\n\nআজকের দিনে সবচেয়ে বড় উপলব্ধি: নিজের সাথে কিছুক্ষণ নিঃশব্দে কাটানোই সবচেয়ে বড় আরোগ্য।`,
      type: 'diary',
      status: 'complete',
      entryDate: '2026-10-31',
      mood: 'Reflective',
      language: 'bn',
      isFavorite: true,
      attribution: '',
      fontPreference: 'bangla',
      wordCount: 84,
      collectionId: 'preview-col',
      tags: ['অনুভব', 'দিনলিপি', 'বৃষ্টি'],
      isTrashed: false,
      deletedAtIso: '',
      version: 1,
      createdAt: '2026-10-31T20:00:00.000Z',
      updatedAt: '2026-10-31T20:00:00.000Z',
    },
    en: {
      id: 'prev-diary-en',
      userId: 'preview',
      title: 'Solitude at the Edge of Autumn',
      subtitle: 'Evening diary entry',
      content: `After the streetlights flickered on, the evening settled into an unhurried quiet.\n\nThere is a peculiar tenderness to handwritten words—the way ink presses into paper, slow and deliberate, resisting the hurried pace of the modern day.\n\nI sat by the window watching the leaves turn copper under the rain. Sometimes solitude is not absence, but the arrival of one's own quiet presence.`,
      type: 'diary',
      status: 'complete',
      entryDate: '2026-10-31',
      mood: 'Peaceful',
      language: 'en',
      isFavorite: true,
      attribution: '',
      fontPreference: 'serif',
      wordCount: 78,
      collectionId: 'preview-col',
      tags: ['Autumn', 'Reflection', 'Evening'],
      isTrashed: false,
      deletedAtIso: '',
      version: 1,
      createdAt: '2026-10-31T20:00:00.000Z',
      updatedAt: '2026-10-31T20:00:00.000Z',
    },
  },
  poem: {
    bn: {
      id: 'prev-poem-bn',
      userId: 'preview',
      title: 'নৈঃশব্দ্যের গান',
      subtitle: 'তিন স্তবকের কবিতা',
      content: `অন্ধকারে নদী বয়ে যায়,\nতীর ঘেঁষে ফোটে বনফুল,\nদূরে কোনো মাঝির গানে\nহারিয়ে যায় চেনা সব কূল।\n\nযে কথাটি ছিল না মুখে,\nমনে মনে বুনেছি গান,\nরাতের হাওয়া সেই সুরে\nছুঁয়ে দিল তৃষিত প্রাণ।\n\nআবার সকাল ফিরে এলে\nমিলিয়ে যাবে মেঘের ছায়া,\nপাতায় পাতায় রয়ে যাবে\nনীরব রাতের মধুর মায়া।`,
      type: 'poem',
      status: 'complete',
      entryDate: '2026-10-31',
      mood: 'Inspired',
      language: 'bn',
      isFavorite: true,
      attribution: '',
      fontPreference: 'bangla',
      wordCount: 65,
      collectionId: 'preview-col',
      tags: ['কবিতা', 'নৈঃশব্দ্য'],
      isTrashed: false,
      deletedAtIso: '',
      version: 1,
      createdAt: '2026-10-31T20:00:00.000Z',
      updatedAt: '2026-10-31T20:00:00.000Z',
    },
    en: {
      id: 'prev-poem-en',
      userId: 'preview',
      title: 'Song of the River Vellum',
      subtitle: 'A three-stanza lyric',
      content: `Beneath the arch of indigo and mist,\nThe river breathes a silence long unsaid,\nWhere willow boughs by gentle rain are kissed,\nAnd stars recline upon an amber bed.\n\nNo hurried footstep treads upon the moss,\nNo voice disturbs the harbor’s quiet sleep,\nWe count our fleeting wanderings no loss,\nFor what is quiet is the most we keep.\n\nWhen morning crests the misty hill once more,\nThe sun will dry the ink upon the page,\nAnd send its golden wave upon the shore,\nA silent witness to an ageless age.`,
      type: 'poem',
      status: 'complete',
      entryDate: '2026-10-31',
      mood: 'Peaceful',
      language: 'en',
      isFavorite: true,
      attribution: '',
      fontPreference: 'serif',
      wordCount: 94,
      collectionId: 'preview-col',
      tags: ['Poetry', 'Lyric'],
      isTrashed: false,
      deletedAtIso: '',
      version: 1,
      createdAt: '2026-10-31T20:00:00.000Z',
      updatedAt: '2026-10-31T20:00:00.000Z',
    },
  },
  quote: {
    bn: {
      id: 'prev-quote-bn',
      userId: 'preview',
      title: 'উপলব্ধি',
      subtitle: '',
      content: `যে নীরবতা হৃদয়ের গভীরে কথা কয়, কোলাহলের ভাষা তার কাছে মলিন। নিজের অন্তরে যিনি আলো খুঁজে পান, বাহিরের অন্ধকার তাকে পরাভূত করতে পারে না।`,
      type: 'quote',
      status: 'complete',
      entryDate: '2026-10-31',
      mood: 'Reflective',
      language: 'bn',
      isFavorite: true,
      attribution: 'রবীন্দ্রনাথ ঠাকুর',
      fontPreference: 'bangla',
      wordCount: 32,
      collectionId: 'preview-col',
      tags: ['উদ্ধৃতি', 'দর্শন'],
      isTrashed: false,
      deletedAtIso: '',
      version: 1,
      createdAt: '2026-10-31T20:00:00.000Z',
      updatedAt: '2026-10-31T20:00:00.000Z',
    },
    en: {
      id: 'prev-quote-en',
      userId: 'preview',
      title: 'On Quietude',
      subtitle: '',
      content: `In the depth of winter, I finally learned that within me there lay an invincible summer.`,
      type: 'quote',
      status: 'complete',
      entryDate: '2026-10-31',
      mood: 'Inspired',
      language: 'en',
      isFavorite: true,
      attribution: 'Albert Camus',
      fontPreference: 'serif',
      wordCount: 16,
      collectionId: 'preview-col',
      tags: ['Quotes', 'Philosophy'],
      isTrashed: false,
      deletedAtIso: '',
      version: 1,
      createdAt: '2026-10-31T20:00:00.000Z',
      updatedAt: '2026-10-31T20:00:00.000Z',
    },
  },
  fragment: {
    bn: {
      id: 'prev-frag-bn',
      userId: 'preview',
      title: 'একটি অসমাপ্ত পঙ্‌ক্তি',
      subtitle: '',
      content: `চা জুড়িয়ে গেলে যেমন তার ঘ্রাণ বদলে যায়, কিছু স্মৃতিরও তেমনি—উত্তাপ চলে গেলেও স্বাদটুকু অক্ষত থেকে যায়।`,
      type: 'fragment',
      status: 'complete',
      entryDate: '2026-10-31',
      mood: 'Nostalgic',
      language: 'bn',
      isFavorite: false,
      attribution: '',
      fontPreference: 'bangla',
      wordCount: 22,
      collectionId: 'preview-col',
      tags: ['চিরকুট'],
      isTrashed: false,
      deletedAtIso: '',
      version: 1,
      createdAt: '2026-10-31T20:00:00.000Z',
      updatedAt: '2026-10-31T20:00:00.000Z',
    },
    en: {
      id: 'prev-frag-en',
      userId: 'preview',
      title: 'Unfinished Note',
      subtitle: '',
      content: `Some memories are like dried petals pressed between the pages of an old book—fragile, scentless, yet unmistakably real.`,
      type: 'fragment',
      status: 'complete',
      entryDate: '2026-10-31',
      mood: 'Nostalgic',
      language: 'en',
      isFavorite: false,
      attribution: '',
      fontPreference: 'serif',
      wordCount: 20,
      collectionId: 'preview-col',
      tags: ['Fragment'],
      isTrashed: false,
      deletedAtIso: '',
      version: 1,
      createdAt: '2026-10-31T20:00:00.000Z',
      updatedAt: '2026-10-31T20:00:00.000Z',
    },
  },
};

export function AppearanceStudioModal({
  open,
  onClose,
  collections = [],
  targetCollectionId,
  onApplyGlobal,
  onApplyCollection,
}: AppearanceStudioModalProps) {
  // Active settings loaded from local storage
  const [activeConfig, setActiveConfig] = useState<AppearanceConfig>(() => getStoredAppearanceConfig());
  const [presets, setPresets] = useState<AppearancePreset[]>(() => getStoredAppearancePresets());
  const [activeCategory, setActiveCategory] = useState<StudioCategory>('presets');

  // Preview Controls
  const [previewSampleType, setPreviewSampleType] = useState<'diary' | 'poem' | 'quote' | 'fragment'>('diary');
  const [previewLanguage, setPreviewLanguage] = useState<'bn' | 'en'>('bn');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [mobileTab, setMobileTab] = useState<'preview' | 'customize'>('preview');

  // Preset saving state
  const [newPresetName, setNewPresetName] = useState('');
  const [presetSaveSuccess, setPresetSaveSuccess] = useState(false);
  const [applyNotification, setApplyNotification] = useState<string | null>(null);

  if (!open) return null;

  const currentTheme = FACTORY_THEMES[activeConfig.appThemeId] || FACTORY_THEMES['heritage-parchment'];
  const previewEntry = PREVIEW_ENTRIES[previewSampleType][previewLanguage];

  // Live Contrast Validation (Section 13.1)
  const currentBg = activeConfig.colors?.page || currentTheme.tokens.surface;
  const currentInk = activeConfig.colors?.ink || currentTheme.tokens.primaryInk;
  const contrastCheck = validateContrast(currentInk, currentBg);

  const handleApplyPreset = (preset: AppearancePreset) => {
    setActiveConfig({ ...preset.config });
  };

  const handleSaveAsPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: AppearancePreset = {
      id: `custom-preset-${Date.now()}`,
      name: newPresetName.trim(),
      config: { ...activeConfig },
      isFavorite: false,
      isFactory: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    saveStoredAppearancePresets(updated);
    setNewPresetName('');
    setPresetSaveSuccess(true);
    setTimeout(() => setPresetSaveSuccess(false), 2500);
  };

  const handleDeletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    saveStoredAppearancePresets(updated);
  };

  const handleDuplicatePreset = (preset: AppearancePreset) => {
    const copy: AppearancePreset = {
      ...preset,
      id: `custom-preset-${Date.now()}`,
      name: `${preset.name} (Copy)`,
      isFactory: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...presets, copy];
    setPresets(updated);
    saveStoredAppearancePresets(updated);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = presets.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
    setPresets(updated);
    saveStoredAppearancePresets(updated);
  };

  const handleApplyAsDefault = () => {
    saveStoredAppearanceConfig(activeConfig);
    if (onApplyGlobal) {
      onApplyGlobal(activeConfig);
    }
    setApplyNotification('Applied as your global diary appearance!');
    setTimeout(() => setApplyNotification(null), 3000);
  };

  const handleApplyToCollection = (collectionId: string) => {
    if (onApplyCollection) {
      onApplyCollection(collectionId, {
        appThemeId: activeConfig.appThemeId,
        paperId: activeConfig.paperId,
        pageTemplateId: activeConfig.pageTemplateId,
        typographyPresetId: activeConfig.typographyPresetId,
        coverId: activeConfig.coverId,
        colors: activeConfig.colors,
      });
    }
    setApplyNotification('Applied override to selected collection notebook!');
    setTimeout(() => setApplyNotification(null), 3000);
  };

  const handleResetLayer = (layer: 'appTheme' | 'cover' | 'pageTemplate' | 'typography' | 'decorations' | 'all') => {
    const next = resetLayer(activeConfig, layer);
    setActiveConfig(next);
  };

  const handleAutoFixContrast = () => {
    const safeInk = suggestAccessibleInk(currentBg);
    setActiveConfig((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        ink: safeInk,
      },
    }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="appearance-studio-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-7xl h-[92vh] flex flex-col rounded-xl overflow-hidden border border-[var(--border)] shadow-2xl bg-[var(--app-bg)] text-[var(--ink)]"
        data-theme={activeConfig.appThemeId}
      >
        {/* Studio Top Header */}
        <header className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="appearance-studio-title" className="text-lg font-serif font-semibold text-[var(--ink)]">
                VerseVault Appearance Studio
              </h2>
              <p className="text-xs text-[var(--ink-secondary)]">
                Curate your personal book themes, page templates, papers, and typography
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {applyNotification && (
              <span className="hidden md:inline-flex items-center gap-1 text-xs text-[var(--olive)] font-medium animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                {applyNotification}
              </span>
            )}
            <button
              type="button"
              onClick={handleApplyAsDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90 shadow-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Apply as My Default
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Appearance Studio"
              className="p-1.5 rounded-md text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-secondary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Mobile Tab Switcher */}
        <div className="md:hidden flex border-b border-[var(--border)] bg-[var(--surface)]">
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-2.5 text-xs font-medium text-center border-b-2 transition-colors ${
              mobileTab === 'preview'
                ? 'border-[var(--accent)] text-[var(--accent)] font-semibold'
                : 'border-transparent text-[var(--ink-secondary)]'
            }`}
          >
            Live Preview
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('customize')}
            className={`flex-1 py-2.5 text-xs font-medium text-center border-b-2 transition-colors ${
              mobileTab === 'customize'
                ? 'border-[var(--accent)] text-[var(--accent)] font-semibold'
                : 'border-transparent text-[var(--ink-secondary)]'
            }`}
          >
            Customize Controls
          </button>
        </div>

        {/* Studio Body: Three-column layout on Desktop */}
        <div className="flex-1 flex overflow-hidden">
          {/* Column 1: Left Categories Navigation */}
          <nav
            aria-label="Appearance categories"
            className={`w-64 border-r border-[var(--border)] bg-[var(--surface)] p-3 shrink-0 overflow-y-auto space-y-1 ${
              mobileTab === 'preview' ? 'hidden md:block' : 'block md:block'
            }`}
          >
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
              Design Layers
            </div>

            {[
              { id: 'presets', label: '1. Curated Presets', icon: BookOpen },
              { id: 'theme', label: '2. App Themes (8)', icon: Palette },
              { id: 'paper', label: '3. Paper & Surfaces', icon: Layers },
              { id: 'template', label: '4. Page Layouts', icon: Sliders },
              { id: 'typography', label: '5. Typography & Size', icon: Type },
              { id: 'covers', label: '6. Collection Covers', icon: Book },
              { id: 'colors', label: '7. Colors & Contrast', icon: Feather },
              { id: 'decorations', label: '8. Ornaments & Borders', icon: Sparkles },
              { id: 'my-presets', label: '9. My Saved Presets', icon: Star },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id as StudioCategory)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all text-left ${
                    isActive
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'text-[var(--ink)] hover:bg-[var(--surface-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{cat.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 opacity-60 ${isActive ? 'text-white' : ''}`} />
                </button>
              );
            })}

            {/* Layer Reset Quick Actions */}
            <div className="pt-6 border-t border-[var(--border)] mt-4 space-y-1">
              <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
                Layer Resets
              </div>
              <button
                type="button"
                onClick={() => handleResetLayer('typography')}
                className="w-full text-left px-3 py-1.5 text-xs text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-secondary)] rounded transition-colors"
              >
                ↺ Reset Typography only
              </button>
              <button
                type="button"
                onClick={() => handleResetLayer('pageTemplate')}
                className="w-full text-left px-3 py-1.5 text-xs text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-secondary)] rounded transition-colors"
              >
                ↺ Reset Template & Paper only
              </button>
              <button
                type="button"
                onClick={() => handleResetLayer('appTheme')}
                className="w-full text-left px-3 py-1.5 text-xs text-[var(--ink-secondary)] hover:text-[var(--ink)] hover:bg-[var(--surface-secondary)] rounded transition-colors"
              >
                ↺ Reset Theme & Palette only
              </button>
              <button
                type="button"
                onClick={() => handleResetLayer('all')}
                className="w-full text-left px-3 py-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded transition-colors"
              >
                ↺ Reset All to Factory Default
              </button>
            </div>
          </nav>

          {/* Column 2: Center Live Interactive Preview */}
          <section
            aria-label="Live appearance preview"
            className={`flex-1 flex flex-col bg-[var(--app-bg)] overflow-hidden border-r border-[var(--border)] ${
              mobileTab === 'customize' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Preview Toolbar */}
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Sample Type Picker */}
              <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-md text-xs">
                {(['diary', 'poem', 'quote', 'fragment'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPreviewSampleType(type)}
                    className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                      previewSampleType === type
                        ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-xs'
                        : 'text-[var(--ink-secondary)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Language & Device Toggles */}
              <div className="flex items-center gap-2">
                {/* Bangla / English Toggle */}
                <div className="inline-flex rounded-md border border-[var(--border)] p-0.5 bg-[var(--surface-secondary)] text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewLanguage('bn')}
                    className={`px-2 py-0.5 rounded text-xs font-bangla ${
                      previewLanguage === 'bn' ? 'bg-[var(--surface)] text-[var(--ink)] font-bold shadow-xs' : 'text-[var(--ink-secondary)]'
                    }`}
                  >
                    বাংলা
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLanguage('en')}
                    className={`px-2 py-0.5 rounded text-xs ${
                      previewLanguage === 'en' ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-xs' : 'text-[var(--ink-secondary)]'
                    }`}
                  >
                    English
                  </button>
                </div>

                {/* Device Frame Toggle */}
                <div className="hidden sm:inline-flex rounded-md border border-[var(--border)] p-0.5 bg-[var(--surface-secondary)]">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    title="Desktop Preview"
                    className={`p-1 rounded ${
                      previewDevice === 'desktop' ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs' : 'text-[var(--ink-secondary)]'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    title="Mobile Phone Frame"
                    className={`p-1 rounded ${
                      previewDevice === 'mobile' ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs' : 'text-[var(--ink-secondary)]'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Render Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center">
              <div
                className={`transition-all duration-300 w-full ${
                  previewDevice === 'mobile'
                    ? 'max-w-[375px] border-4 border-[var(--border)] rounded-2xl shadow-xl p-3 bg-[var(--surface)]'
                    : 'max-w-4xl'
                }`}
              >
                {activeCategory === 'covers' ? (
                  <div className="max-w-md mx-auto py-8">
                    <CollectionCoverCard
                      collection={{
                        id: 'preview-collection',
                        userId: 'preview',
                        name: previewLanguage === 'bn' ? 'স্মৃতি ও কাব্যগাথা' : 'Selected Poems & Notes',
                        description: previewLanguage === 'bn' ? 'নীরব রাত্রির ব্যক্তিগত সংকলন' : 'A private archive of verses',
                        accent: activeConfig.colors?.accent || currentTheme.tokens.accent,
                        sortOrder: 1,
                        version: 1,
                        createdAt: '2026-01-01T00:00:00.000Z',
                        updatedAt: '2026-01-01T00:00:00.000Z',
                      }}
                      coverId={activeConfig.coverId}
                      customBg={activeConfig.colors?.page}
                      customText={activeConfig.colors?.ink}
                      entryCount={14}
                    />
                  </div>
                ) : (
                  <TemplateDispatcher
                    entry={previewEntry}
                    config={activeConfig}
                    fontScript={previewLanguage === 'bn' ? 'bn' : 'serif'}
                  />
                )}
              </div>
            </div>

            {/* Live Contrast Safeguard Strip (Section 13.1) */}
            <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--ink-secondary)]">WCAG 2.2 Contrast:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                    contrastCheck.rating === 'AAA'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : contrastCheck.rating === 'AA'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {contrastCheck.rating !== 'FAIL' ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {contrastCheck.ratio}:1 · {contrastCheck.rating}
                </span>
                <span className="text-[11px] text-[var(--ink-muted)] hidden lg:inline">
                  {contrastCheck.summary}
                </span>
              </div>

              {!contrastCheck.passesNormal && (
                <button
                  type="button"
                  onClick={handleAutoFixContrast}
                  className="px-2.5 py-1 text-xs rounded bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
                >
                  Auto-Fix Ink Contrast
                </button>
              )}
            </div>
          </section>

          {/* Column 3: Right Contextual Controls */}
          <aside
            aria-label="Appearance controls"
            className={`w-full md:w-80 lg:w-96 bg-[var(--surface)] p-5 overflow-y-auto shrink-0 space-y-6 ${
              mobileTab === 'preview' ? 'hidden md:block' : 'block'
            }`}
          >
            {/* Category 1: Presets */}
            {activeCategory === 'presets' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[var(--ink)]">Curated Factory Presets</h3>
                <p className="text-xs text-[var(--ink-secondary)]">
                  Complete design bundles pairing theme, paper, layout, and typography together.
                </p>

                <div className="space-y-2.5">
                  {presets
                    .filter((p) => p.isFactory)
                    .map((preset) => {
                      const isSelected =
                        activeConfig.appThemeId === preset.config.appThemeId &&
                        activeConfig.pageTemplateId === preset.config.pageTemplateId &&
                        activeConfig.paperId === preset.config.paperId;
                      return (
                        <div
                          key={preset.id}
                          className={`p-3 rounded-lg border transition-all text-left cursor-pointer flex flex-col gap-1.5 ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--surface-secondary)] shadow-sm'
                              : 'border-[var(--border)] hover:border-[var(--ink-muted)]'
                          }`}
                          onClick={() => handleApplyPreset(preset)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[var(--ink)]">{preset.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-[var(--accent)]" />}
                          </div>
                          <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed">
                            {preset.description}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Category 2: App Themes */}
            {activeCategory === 'theme' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[var(--ink)]">8 Factory App Themes</h3>
                <p className="text-xs text-[var(--ink-secondary)]">
                  Controls the app background, sidebar, toolbars, and primary ink palette.
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {Object.values(FACTORY_THEMES).map((thm) => {
                    const isSelected = activeConfig.appThemeId === thm.id;
                    return (
                      <button
                        key={thm.id}
                        type="button"
                        onClick={() => {
                          setActiveConfig((prev) => ({
                            ...prev,
                            appThemeId: thm.id,
                            paperId: thm.defaultPaper,
                            colors: {
                              ...prev.colors,
                              page: thm.tokens.surface,
                              ink: thm.tokens.primaryInk,
                              accent: thm.tokens.accent,
                            },
                          }));
                        }}
                        className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 bg-[var(--surface-secondary)]'
                            : 'border-[var(--border)] hover:border-[var(--ink-muted)]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: thm.tokens.appBg }}
                            />
                            <span className="text-xs font-semibold text-[var(--ink)]">{thm.name}</span>
                            <span className="text-[10px] text-[var(--ink-muted)] font-bangla">({thm.nameBn})</span>
                          </div>
                          <p className="text-[11px] text-[var(--ink-secondary)] line-clamp-1">
                            {thm.description}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[var(--accent)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category 3: Paper & Surfaces */}
            {activeCategory === 'paper' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[var(--ink)]">10 Paper Surfaces</h3>
                <p className="text-xs text-[var(--ink-secondary)]">
                  Subtle tactile surfaces independently selectable without changing your theme.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.values(PAPER_SURFACES).map((pap) => {
                    const isSelected = activeConfig.paperId === pap.id;
                    return (
                      <button
                        key={pap.id}
                        type="button"
                        onClick={() => setActiveConfig((prev) => ({ ...prev, paperId: pap.id }))}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--surface-secondary)] ring-2 ring-[var(--accent)]/20'
                            : 'border-[var(--border)] hover:border-[var(--ink-muted)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[var(--ink)]">{pap.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                        </div>
                        <p className="text-[10px] text-[var(--ink-secondary)] line-clamp-2">
                          {pap.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category 4: Page Layout Templates */}
            {activeCategory === 'template' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[var(--ink)]">10 Page Layout Templates</h3>
                <p className="text-xs text-[var(--ink-secondary)]">
                  Presentation compositions that never mutate or insert characters into original entry text.
                </p>

                <div className="space-y-2">
                  {Object.values(PAGE_TEMPLATES).map((tpl) => {
                    const isSelected = activeConfig.pageTemplateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setActiveConfig((prev) => ({ ...prev, pageTemplateId: tpl.id }))}
                        className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-start justify-between ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--surface-secondary)] ring-2 ring-[var(--accent)]/20'
                            : 'border-[var(--border)] hover:border-[var(--ink-muted)]'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-[var(--ink)]">{tpl.name}</div>
                          <p className="text-[11px] text-[var(--ink-secondary)] mt-0.5">{tpl.description}</p>
                          <span className="inline-block mt-1 text-[10px] text-[var(--accent)] uppercase font-mono">
                            Best for: {tpl.bestFor}
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category 5: Typography Controls */}
            {activeCategory === 'typography' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[var(--ink)]">Reading Typography & Scale</h3>
                  <p className="text-xs text-[var(--ink-secondary)]">
                    Curated bilingual pairings with safe line-heights preventing Bengali vowel clipping.
                  </p>
                </div>

                {/* Typography Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--ink)]">Pairing Preset</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {Object.values(TYPOGRAPHY_PRESETS).map((typ) => {
                      const isSelected = activeConfig.typographyPresetId === typ.id;
                      return (
                        <button
                          key={typ.id}
                          type="button"
                          onClick={() => {
                            setActiveConfig((prev) => ({
                              ...prev,
                              typographyPresetId: typ.id,
                              typography: {
                                ...prev.typography,
                                banglaFontSize: typ.banglaFontSize,
                                englishFontSize: typ.englishFontSize,
                                lineHeight: typ.lineHeight,
                              },
                            }));
                          }}
                          className={`p-2 rounded border text-left text-xs transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--surface-secondary)] font-medium text-[var(--ink)]'
                              : 'border-[var(--border)] text-[var(--ink-secondary)] hover:text-[var(--ink)]'
                          }`}
                        >
                          <div>
                            <div>{typ.name}</div>
                            <div className="text-[10px] text-[var(--ink-muted)]">{typ.feel}</div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fine Sliders */}
                <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                  {/* Bangla Font Size */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Bangla Font Size</span>
                      <span className="font-mono">{activeConfig.typography?.banglaFontSize || 19}px</span>
                    </div>
                    <input
                      type="range"
                      min={14}
                      max={32}
                      value={activeConfig.typography?.banglaFontSize || 19}
                      onChange={(e) =>
                        setActiveConfig((prev) => ({
                          ...prev,
                          typography: {
                            ...prev.typography,
                            banglaFontSize: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full accent-[var(--accent)]"
                    />
                  </div>

                  {/* English Font Size */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>English Font Size</span>
                      <span className="font-mono">{activeConfig.typography?.englishFontSize || 18}px</span>
                    </div>
                    <input
                      type="range"
                      min={13}
                      max={30}
                      value={activeConfig.typography?.englishFontSize || 18}
                      onChange={(e) =>
                        setActiveConfig((prev) => ({
                          ...prev,
                          typography: {
                            ...prev.typography,
                            englishFontSize: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full accent-[var(--accent)]"
                    />
                  </div>

                  {/* Line Height */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Line Height (Conjunct Safe)</span>
                      <span className="font-mono">{activeConfig.typography?.lineHeight || 1.85}</span>
                    </div>
                    <input
                      type="range"
                      min={1.4}
                      max={2.3}
                      step={0.05}
                      value={activeConfig.typography?.lineHeight || 1.85}
                      onChange={(e) =>
                        setActiveConfig((prev) => ({
                          ...prev,
                          typography: {
                            ...prev.typography,
                            lineHeight: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full accent-[var(--accent)]"
                    />
                  </div>

                  {/* Reading Column Width */}
                  <div className="space-y-1.5">
                    <label className="text-xs">Reading Column Width</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['narrow', 'standard', 'wide'] as const).map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() =>
                            setActiveConfig((prev) => ({
                              ...prev,
                              typography: { ...prev.typography, readingWidth: w },
                            }))
                          }
                          className={`py-1.5 text-xs rounded border capitalize transition-colors ${
                            activeConfig.typography?.readingWidth === w
                              ? 'border-[var(--accent)] bg-[var(--surface-secondary)] font-semibold text-[var(--ink)]'
                              : 'border-[var(--border)] text-[var(--ink-secondary)]'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alignment */}
                  <div className="space-y-1.5">
                    <label className="text-xs">Text Alignment</label>
                    <div className="grid grid-cols-2 gap-1">
                      {(['left', 'center'] as const).map((al) => (
                        <button
                          key={al}
                          type="button"
                          onClick={() =>
                            setActiveConfig((prev) => ({
                              ...prev,
                              typography: { ...prev.typography, alignment: al },
                            }))
                          }
                          className={`py-1.5 text-xs rounded border capitalize transition-colors ${
                            activeConfig.typography?.alignment === al
                              ? 'border-[var(--accent)] bg-[var(--surface-secondary)] font-semibold text-[var(--ink)]'
                              : 'border-[var(--border)] text-[var(--ink-secondary)]'
                          }`}
                        >
                          {al}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category 6: Book & Collection Covers */}
            {activeCategory === 'covers' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[var(--ink)]">8 Collection Cover Styles</h3>
                <p className="text-xs text-[var(--ink-secondary)]">
                  Authentic book covers for your thematic notebooks and collections.
                </p>

                <div className="space-y-2">
                  {Object.values(COVER_STYLES).map((cov) => {
                    const isSelected = activeConfig.coverId === cov.id;
                    return (
                      <button
                        key={cov.id}
                        type="button"
                        onClick={() => setActiveConfig((prev) => ({ ...prev, coverId: cov.id }))}
                        className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--surface-secondary)] ring-2 ring-[var(--accent)]/20'
                            : 'border-[var(--border)] hover:border-[var(--ink-muted)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-5 h-6 rounded-xs border border-black/20 shrink-0"
                            style={{ backgroundColor: cov.defaultBg }}
                          />
                          <div>
                            <div className="text-xs font-semibold text-[var(--ink)]">{cov.name}</div>
                            <div className="text-[10px] text-[var(--ink-secondary)]">{cov.description}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[var(--accent)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category 7: Colors & Contrast */}
            {activeCategory === 'colors' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[var(--ink)]">Colors & Contrast</h3>
                  <p className="text-xs text-[var(--ink-secondary)]">
                    Refined palette adjustments with instant WCAG 2.2 accessibility verification.
                  </p>
                </div>

                {/* Color Pickers */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded border border-[var(--border)]">
                    <span className="text-xs">Page Surface Color</span>
                    <input
                      type="color"
                      value={activeConfig.colors?.page || currentTheme.tokens.surface}
                      onChange={(e) =>
                        setActiveConfig((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, page: e.target.value },
                        }))
                      }
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded border border-[var(--border)]">
                    <span className="text-xs">Primary Ink Color</span>
                    <input
                      type="color"
                      value={activeConfig.colors?.ink || currentTheme.tokens.primaryInk}
                      onChange={(e) =>
                        setActiveConfig((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, ink: e.target.value },
                        }))
                      }
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded border border-[var(--border)]">
                    <span className="text-xs">Accent Color</span>
                    <input
                      type="color"
                      value={activeConfig.colors?.accent || currentTheme.tokens.accent}
                      onChange={(e) =>
                        setActiveConfig((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, accent: e.target.value },
                        }))
                      }
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                </div>

                {/* Contrast Helper Card */}
                <div
                  className={`p-3 rounded-lg border text-xs space-y-2 ${
                    contrastCheck.passesNormal
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-rose-500/40 bg-rose-500/10'
                  }`}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span>Contrast Status: {contrastCheck.rating}</span>
                    <span className="font-mono">{contrastCheck.ratio}:1</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[var(--ink-secondary)]">
                    {contrastCheck.summary}
                  </p>
                  {!contrastCheck.passesNormal && (
                    <button
                      type="button"
                      onClick={handleAutoFixContrast}
                      className="w-full py-1.5 px-3 rounded text-xs font-medium bg-[var(--accent)] text-white hover:opacity-90"
                    >
                      Use Recommended Accessible Ink
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Category 8: Ornaments & Decorations */}
            {activeCategory === 'decorations' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[var(--ink)]">Ornaments & Visual Details</h3>
                <p className="text-xs text-[var(--ink-secondary)]">
                  Toggle fine dividers, corner marks, and subtle decorative accents.
                </p>

                <div className="space-y-2.5">
                  {[
                    { id: 'dateStamp', label: 'Date Stamp on Pages', desc: 'Display editorial date in header' },
                    { id: 'divider', label: 'Section Dividers', desc: 'Poetic asterism / flourish dividers' },
                    { id: 'cornerAccent', label: 'Corner Accents', desc: 'Vintage floral or brass corner marks' },
                    { id: 'pageEdge', label: 'Subtle Page Edge Shadow', desc: 'Tactile paper depth and edge tone' },
                    { id: 'botanical', label: 'Botanical Leaf Motifs', desc: 'Natural botanical flourishes' },
                  ].map((dec) => {
                    const isChecked = Boolean(activeConfig.decorations?.[dec.id as keyof typeof activeConfig.decorations]);
                    return (
                      <label
                        key={dec.id}
                        className="flex items-start justify-between p-2.5 rounded border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-secondary)]"
                      >
                        <div className="pr-2">
                          <div className="text-xs font-medium text-[var(--ink)]">{dec.label}</div>
                          <div className="text-[10px] text-[var(--ink-secondary)]">{dec.desc}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setActiveConfig((prev) => ({
                              ...prev,
                              decorations: {
                                ...prev.decorations,
                                [dec.id]: e.target.checked,
                              },
                            }))
                          }
                          className="mt-1 accent-[var(--accent)]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category 9: My Presets Management */}
            {activeCategory === 'my-presets' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-[var(--ink)]">My Saved Presets</h3>
                  <p className="text-xs text-[var(--ink-secondary)]">
                    Save your custom combination as a reusable design preset.
                  </p>
                </div>

                {/* Save Current as New Preset Form */}
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] space-y-2">
                  <label className="text-xs font-medium text-[var(--ink)]">Save Current Settings</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. My Autumn Journal"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded border border-[var(--border)] text-xs bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--ink-muted)]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveAsPreset}
                      disabled={!newPresetName.trim()}
                      className="px-3 py-1.5 rounded text-xs font-medium bg-[var(--accent)] text-white disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                  {presetSaveSuccess && (
                    <p className="text-[11px] text-[var(--olive)] font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Saved to your personal presets!
                    </p>
                  )}
                </div>

                {/* Custom Presets List */}
                <div className="space-y-2">
                  {presets
                    .filter((p) => !p.isFactory)
                    .map((cust) => (
                      <div
                        key={cust.id}
                        className="p-2.5 rounded border border-[var(--border)] flex items-center justify-between gap-2"
                      >
                        <div className="overflow-hidden">
                          <div className="text-xs font-semibold text-[var(--ink)] truncate">{cust.name}</div>
                          <div className="text-[10px] text-[var(--ink-muted)]">
                            Saved {new Date(cust.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApplyPreset(cust)}
                            className="px-2 py-1 text-xs rounded bg-[var(--surface-secondary)] hover:bg-[var(--accent)] hover:text-white transition-colors"
                          >
                            Apply
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicatePreset(cust)}
                            title="Duplicate preset"
                            className="p-1 rounded text-[var(--ink-secondary)] hover:text-[var(--ink)]"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePreset(cust.id)}
                            title="Delete preset"
                            className="p-1 rounded text-[var(--danger)] hover:bg-[var(--danger)]/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                  {presets.filter((p) => !p.isFactory).length === 0 && (
                    <p className="text-xs text-[var(--ink-muted)] text-center py-4">
                      No custom presets saved yet. Adjust any setting and click &ldquo;Save&rdquo; above.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Collection Scope Overrides */}
            {collections.length > 0 && (
              <div className="pt-4 border-t border-[var(--border)] space-y-2">
                <div className="text-[11px] font-medium text-[var(--ink)]">Apply to Specific Collection</div>
                <div className="flex gap-1.5 flex-wrap">
                  {collections.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleApplyToCollection(c.id)}
                      className="px-2 py-1 rounded text-[11px] font-bangla border border-[var(--border)] bg-[var(--surface-secondary)] hover:border-[var(--accent)] text-[var(--ink)] transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
