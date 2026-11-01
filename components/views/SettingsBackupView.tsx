'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  FileArchive,
  FileJson,
  LogIn,
  LogOut,
  Palette,
  RotateCcw,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import { ENTRY_MOODS, ENTRY_TYPES, formatShortDate } from '../../lib/entry-utils';
import {
  buildJsonBackup,
  generateMarkdownZipBlob,
  triggerBlobDownload,
} from '../../lib/export-utils';
import { EntryMood, EntryType, FontPreference } from '../../types/entry';
import {
  ArchivalSelect,
  BrassCornerOrnament,
  LeatherClaspButton,
  ParchmentPlateButton,
} from '../ui/VerseVaultUI';
import { useBookSound } from '../../lib/book-sound-engine';
import { AiSettingsSection } from '../ai/AiSettingsSection';
import { AiConsentModal } from '../ai/AiConsentModal';
import { saveStoredAiSettings } from '../../lib/ai-client';

export function SettingsBackupView() {
  const {
    user,
    isAdmin,
    adminEmail,
    authError,
    setAdminLoginModalOpen,
    signOutOwner,
    entries,
    collections,
    tags,
    settings,
    updateSettings,
    recordManualBackup,
    resetToSampleArchive,
    clearToBlankJournal,
  } = useJournal();

  const { soundEnabled, toggleSound } = useBookSound();

  const [exportCollectionId, setExportCollectionId] = useState<string>('all');
  const [includeTrashInExport, setIncludeTrashInExport] = useState<boolean>(false);
  const [exportStatusMessage, setExportStatusMessage] = useState<string>('');
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [aiConsentModalOpen, setAiConsentModalOpen] = useState<boolean>(false);

  const handleExportMarkdownZip = async () => {
    setIsExportingZip(true);
    setExportStatusMessage('');
    try {
      const blob = await generateMarkdownZipBlob(entries, collections, {
        includeTrashed: includeTrashInExport,
        collectionId: exportCollectionId,
      });
      const dateStamp = new Date().toISOString().slice(0, 10);
      triggerBlobDownload(blob, `VerseVault-Backup-${dateStamp}.zip`);
      recordManualBackup();
      setExportStatusMessage('Markdown ZIP archive generated and downloaded.');
    } catch (err) {
      console.error('Markdown ZIP export error:', err);
      setExportStatusMessage('Failed to generate Markdown ZIP backup.');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportJson = () => {
    setExportStatusMessage('');
    try {
      const payload = buildJsonBackup(entries, collections, tags, {
        includeTrashed: includeTrashInExport,
        collectionId: exportCollectionId,
      });
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const dateStamp = new Date().toISOString().slice(0, 10);
      triggerBlobDownload(blob, `VerseVault-Backup-${dateStamp}.json`);
      recordManualBackup();
      setExportStatusMessage('Complete JSON archive downloaded.');
    } catch (err) {
      console.error('JSON export error:', err);
      setExportStatusMessage('Failed to generate JSON backup.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <header className="border-b-2 border-dashed border-[#C7AF8E] dark:border-[#3D3329] pb-5 space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-literary font-normal text-[var(--ink)] tracking-tight">
          Settings &amp; Archival Backup
        </h1>
        <p className="text-sm font-bangla text-[var(--ink-soft)]">
          আপনার ডায়েরির কাগজের ধরন, ধ্বনি (Sound FX), লেখার পছন্দসমূহ এবং ব্যক্তিগত আর্কাইভ ব্যাকআপ নিয়ন্ত্রণ করুন।
        </p>
      </header>

      {/* 1. Appearance & Acoustic Reading Room */}
      <section className="relative bg-gradient-to-b from-[#FAF3E6] to-[#EFE2CC] dark:from-[#2A231C] dark:to-[#211B16] border-2 border-[#C4AC89] dark:border-[#463B30] rounded-[9px] p-6 space-y-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_4px_14px_rgba(40,24,10,0.08)]">
        <BrassCornerOrnament position="tl" />
        <BrassCornerOrnament position="tr" />
        <h2 className="text-lg font-literary font-medium text-[var(--ink)]">
          ✦ Appearance &amp; Acoustic Book Feel
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Theme */}
          <div>
            <span className="block text-xs font-medium text-[var(--ink-soft)] mb-2 font-bangla">
              কাগজের আবহ (Paper Theme)
            </span>
            <div className="flex items-center gap-1 p-1 bg-[#E5D3B8]/70 dark:bg-[#1C1713] border border-[#BEA583] dark:border-[#42382D] rounded-[6px]">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <ParchmentPlateButton
                  key={t}
                  active={settings.theme === t}
                  size="xs"
                  onClick={() => updateSettings({ theme: t })}
                  className="flex-1 capitalize"
                >
                  {t}
                </ParchmentPlateButton>
              ))}
            </div>
          </div>

          {/* Reading Width */}
          <div>
            <span className="block text-xs font-medium text-[var(--ink-soft)] mb-2 font-bangla">
              পাতার প্রস্থ (Reading Width)
            </span>
            <div className="flex items-center gap-1 p-1 bg-[#E5D3B8]/70 dark:bg-[#1C1713] border border-[#BEA583] dark:border-[#42382D] rounded-[6px]">
              {(['standard', 'wide'] as const).map((w) => (
                <ParchmentPlateButton
                  key={w}
                  active={settings.readingWidth === w}
                  size="xs"
                  onClick={() => updateSettings({ readingWidth: w })}
                  className="flex-1 capitalize"
                >
                  {w}
                </ParchmentPlateButton>
              ))}
            </div>
          </div>

          {/* Interface Density */}
          <div>
            <span className="block text-xs font-medium text-[var(--ink-soft)] mb-2 font-bangla">
              সূচিপত্র ঘনত্ব (Index Density)
            </span>
            <div className="flex items-center gap-1 p-1 bg-[#E5D3B8]/70 dark:bg-[#1C1713] border border-[#BEA583] dark:border-[#42382D] rounded-[6px]">
              {(['comfortable', 'compact'] as const).map((d) => (
                <ParchmentPlateButton
                  key={d}
                  active={settings.density === d}
                  size="xs"
                  onClick={() => updateSettings({ density: d })}
                  className="flex-1 capitalize"
                >
                  {d}
                </ParchmentPlateButton>
              ))}
            </div>
          </div>

          {/* Book Foley Sound FX */}
          <div>
            <span className="block text-xs font-medium text-[var(--ink-soft)] mb-2 font-bangla">
              পাতা উল্টানোর ধ্বনি (Book Sound FX)
            </span>
            <ParchmentPlateButton
              active={soundEnabled}
              size="sm"
              onClick={toggleSound}
              className="w-full py-1.5"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#DFB274]" />
                  <span>ধ্বনি চালু (Enabled)</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 opacity-60" />
                  <span>নীরব (Muted)</span>
                </>
              )}
            </ParchmentPlateButton>
          </div>
        </div>
      </section>

      {/* 2. Writing Preferences */}
      <section className="relative bg-gradient-to-b from-[#FAF3E6] to-[#EFE2CC] dark:from-[#2A231C] dark:to-[#211B16] border-2 border-[#C4AC89] dark:border-[#463B30] rounded-[9px] p-6 space-y-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_4px_14px_rgba(40,24,10,0.08)]">
        <BrassCornerOrnament position="tl" />
        <BrassCornerOrnament position="tr" />
        <h2 className="text-lg font-literary font-medium text-[var(--ink)]">
          ✦ Writing &amp; Manuscript Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <span className="block text-xs font-medium text-[var(--ink-soft)] mb-1.5 font-bangla">
              ডিফল্ট লেখার ধরন (Default Entry Type)
            </span>
            <ArchivalSelect<EntryType>
              ariaLabel="Default Entry Type"
              value={settings.defaultEntryType}
              onChange={(val) => updateSettings({ defaultEntryType: val })}
              options={ENTRY_TYPES.map((t) => ({
                value: t.value,
                label: `${t.label} (${t.banglaLabel})`,
              }))}
              className="w-full"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-[var(--ink-soft)] mb-1.5 font-bangla">
              ডিফল্ট অক্ষরশৈলী (Default Typography)
            </span>
            <ArchivalSelect<FontPreference>
              ariaLabel="Default Typography"
              value={settings.defaultFont}
              onChange={(val) => updateSettings({ defaultFont: val })}
              options={[
                { value: 'auto', label: 'Auto (Script-aware Bangla / Serif)' },
                { value: 'bangla', label: 'Bangla — Hind Siliguri' },
                { value: 'serif', label: 'Literary Serif — Literata' },
                { value: 'sans', label: 'Clean UI Sans' },
              ]}
              className="w-full"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-[var(--ink-soft)] mb-1.5 font-bangla">
              ডিফল্ট অনুভব (Default Mood)
            </span>
            <ArchivalSelect<EntryMood>
              ariaLabel="Default Mood"
              value={settings.defaultMood}
              onChange={(val) => updateSettings({ defaultMood: val })}
              options={[
                { value: '' as EntryMood, label: 'None (কোনোটি নয়)' },
                ...ENTRY_MOODS.map((m) => ({
                  value: m.value,
                  label: `${m.value} (${m.bangla})`,
                })),
              ]}
              className="w-full"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-dashed border-[#CBB393] dark:border-[#3D342A] flex flex-wrap items-center gap-6">
          <label className="inline-flex items-center gap-2 text-xs text-[var(--ink)] cursor-pointer font-bangla">
            <input
              type="checkbox"
              checked={settings.showWordCount}
              onChange={(e) => updateSettings({ showWordCount: e.target.checked })}
              className="rounded border-[var(--line)] accent-[#5D402B]"
            />
            <span>পাতার নিচে শব্দ ও অক্ষর সংখ্যা দেখান (Show word &amp; character count)</span>
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-[var(--ink)] cursor-pointer font-bangla">
            <input
              type="checkbox"
              checked={settings.autosaveEnabled}
              onChange={(e) => updateSettings({ autosaveEnabled: e.target.checked })}
              className="rounded border-[var(--line)] accent-[#5D402B]"
            />
            <span>লেখার সময় স্বয়ংক্রিয় সংরক্ষণ চালু রাখুন (Automatic debounced saving)</span>
          </label>
        </div>
      </section>

      {/* 2.5 AI Writing Companion & Privacy Settings */}
      <AiSettingsSection onOpenConsentModal={() => setAiConsentModalOpen(true)} />

      {/* 3. Export & Portable Archive Backup */}
      <section className="relative bg-gradient-to-b from-[#FAF3E6] to-[#EFE2CC] dark:from-[#2A231C] dark:to-[#211B16] border-2 border-[#C4AC89] dark:border-[#463B30] rounded-[9px] p-6 space-y-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_4px_14px_rgba(40,24,10,0.08)]">
        <BrassCornerOrnament position="tl" />
        <BrassCornerOrnament position="tr" />
        <div className="space-y-1">
          <h2 className="text-lg font-literary font-medium text-[var(--ink)]">
            ✦ Backup &amp; Portable Archive Export
          </h2>
          <p className="text-xs text-[var(--ink-soft)]">
            Export your entire journal as UTF-8 Markdown files in a structured ZIP folder or as a complete JSON archive.
          </p>
        </div>

        <div className="p-4 bg-[#EAD8BE]/70 dark:bg-[#332B22] border border-[#C2A987] dark:border-[#493E31] rounded-[6px] flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--ink)] space-y-1">
            <p className="font-medium">
              This backup may contain deeply personal writing. Store it somewhere private.
            </p>
            <p className="text-[var(--ink-soft)]">
              Exports never include passwords, authentication tokens, or cloud credentials. Original Bangla and English line breaks are preserved verbatim.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <span className="block text-xs font-medium text-[var(--ink-soft)] mb-1.5 font-bangla">
              ব্যাকআপের পরিধি (Scope of Backup)
            </span>
            <ArchivalSelect<string>
              ariaLabel="Scope of Backup"
              value={exportCollectionId}
              onChange={(val) => setExportCollectionId(val)}
              options={[
                {
                  value: 'all',
                  label: `All writing (${entries.filter((e) => !e.isTrashed).length} active pages)`,
                },
                ...collections.map((c) => ({
                  value: c.id,
                  label: `Collection: ${c.name}`,
                })),
              ]}
              className="w-full"
            />
          </div>

          <div className="pb-2">
            <label className="inline-flex items-center gap-2 text-xs text-[var(--ink)] cursor-pointer">
              <input
                type="checkbox"
                checked={includeTrashInExport}
                onChange={(e) => setIncludeTrashInExport(e.target.checked)}
                className="rounded border-[var(--line)] accent-[#5D402B]"
              />
              <span>Include soft-deleted entries from Trash</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <LeatherClaspButton
            disabled={isExportingZip}
            onClick={handleExportMarkdownZip}
            variant="walnut"
            size="md"
          >
            <FileArchive className="w-4 h-4 text-[#DFB578]" />
            <span>{isExportingZip ? 'Preparing Markdown ZIP…' : 'Export All Writing as Markdown ZIP'}</span>
          </LeatherClaspButton>

          <ParchmentPlateButton onClick={handleExportJson} size="md">
            <FileJson className="w-4 h-4 text-[var(--accent)]" />
            <span>Export All Data as JSON</span>
          </ParchmentPlateButton>

          {settings.lastBackupAt && (
            <span className="text-xs text-[var(--ink-soft)] tabular-nums ml-auto">
              Last manual backup: {formatShortDate(settings.lastBackupAt.slice(0, 10))}
            </span>
          )}
        </div>

        {exportStatusMessage && (
          <p className="text-xs text-[var(--olive)] flex items-center gap-1.5" role="status">
            <Check className="w-3.5 h-3.5" />
            {exportStatusMessage}
          </p>
        )}
      </section>

      {/* 4. Public Reader & Admin Authoring Security (aalmamunsikder@gmail.com) */}
      <section className="relative bg-gradient-to-b from-[#FAF3E6] to-[#EFE2CC] dark:from-[#2A231C] dark:to-[#211B16] border-2 border-[#C4AC89] dark:border-[#463B30] rounded-[9px] p-6 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_4px_14px_rgba(40,24,10,0.08)]">
        <BrassCornerOrnament position="tl" />
        <BrassCornerOrnament position="tr" />
        <div className="space-y-1">
          <h2 className="text-lg font-literary font-medium text-[var(--ink)] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            Public Reading &amp; Admin Authoring ({adminEmail})
          </h2>
          <p className="text-xs text-[var(--ink-soft)] leading-relaxed max-w-2xl font-bangla">
            সব উন্মুক্ত পাতা ভিজিটরদের জন্য পাঠযোগ্য, তবে পাসওয়ার্ড লক করা পাতা খুলতে নির্দিষ্ট পাসওয়ার্ড প্রয়োজন। নতুন লেখা যোগ, সম্পাদনা বা মুছে ফেলার ক্ষমতা শুধুমাত্র অ্যাডমিন ({adminEmail})-এর জন্য সংরক্ষিত।
          </p>
        </div>

        <div className="pt-3 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-[#CBB393] dark:border-[#3D342A]">
          <div className="text-xs text-[var(--ink)] font-bangla">
            {isAdmin ? (
              <span>
                অ্যাডমিন হিসেবে লগইন আছেন: <strong>{user?.email || adminEmail}</strong> (সম্পূর্ণ লেখার ও সম্পাদনার অনুমতি সক্রিয়)
              </span>
            ) : (
              <span>
                বর্তমানে <strong>পাবলিক পাঠক মোড (Public Reader Mode)</strong> সক্রিয় আছে। লেখা যোগ বা সম্পাদনা করতে অ্যাডমিন লগইন করুন।
              </span>
            )}
            {authError && <p className="text-xs text-[var(--danger)] mt-1">{authError}</p>}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              <ParchmentPlateButton onClick={() => void signOutOwner()} size="md">
                <LogOut className="w-3.5 h-3.5" />
                <span>অ্যাডমিন লগআউট (Sign Out)</span>
              </ParchmentPlateButton>
            ) : (
              <LeatherClaspButton
                onClick={() => setAdminLoginModalOpen(true)}
                variant="walnut"
                size="md"
              >
                <LogIn className="w-3.5 h-3.5 text-[#DFB578]" />
                <span>Admin Login ({adminEmail})</span>
              </LeatherClaspButton>
            )}
          </div>
        </div>

        {/* Archive Maintenance Utilities (Admin Only) */}
        {isAdmin && (
          <div className="pt-4 border-t border-dashed border-[#CBB393] dark:border-[#3D342A] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ink-soft)]">
            <span>Archive workspace state (Admin only):</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetToSampleArchive}
                className="inline-flex items-center gap-1 hover:text-[var(--ink)] underline underline-offset-4 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Restore literary sample pages
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={clearToBlankJournal}
                className="hover:text-[var(--danger)] underline underline-offset-4 cursor-pointer"
              >
                Start with blank journal
              </button>
            </div>
          </div>
        )}
      </section>

      {/* AI Consent Modal */}
      <AiConsentModal
        isOpen={aiConsentModalOpen}
        onClose={() => setAiConsentModalOpen(false)}
        onConsentAndEnable={() => {
          saveStoredAiSettings({
            enabled: true,
            hasConsented: true,
            consentAt: new Date().toISOString(),
          });
          setAiConsentModalOpen(false);
        }}
      />
    </div>
  );
}
