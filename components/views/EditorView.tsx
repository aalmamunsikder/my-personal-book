'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignLeft,
  Archive,
  ArrowLeft,
  BookOpen,
  Calendar,
  Heart,
  Maximize2,
  Minimize2,
  Plus,
  Palette,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import {
  countCharacters,
  countLines,
  countWords,
  ENTRY_MOODS,
  ENTRY_TYPES,
  formatEditorialDate,
  resolveContentFontScript,
} from '../../lib/entry-utils';
import type { EntryMood, EntryStatus, EntryType, FontPreference, JournalEntry } from '../../types/entry';
import { AiConsentModal } from '../ai/AiConsentModal';
import { AiAssistPanel } from '../ai/AiAssistPanel';
import { SaveStateIndicator } from '../common/SaveStateIndicator';
import { getStoredAiSettings, saveStoredAiSettings } from '../../lib/ai-client';
import type { MetadataSuggestion } from '../../types/ai';

export function EditorView() {
  const {
    entries,
    collections,
    settings,
    activeEntryId,
    previousSection,
    saveState,
    navigateTo,
    updateEntry,
    retryFailedSave,
    toggleFavorite,
    archiveEntry,
    moveToTrash,
    openEntryForReading,
    createNewEntry,
    isAdmin,
    appearanceConfig,
    setAppearanceStudioOpen,
  } = useJournal();

  const currentEntry = useMemo(
    () => entries.find((e) => e.id === activeEntryId) || entries[0] || null,
    [entries, activeEntryId]
  );

  const [distractionFree, setDistractionFree] = useState(false);
  const [ruledLines, setRuledLines] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiConsentOpen, setAiConsentOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleOpenAiAssist = () => {
    const currentSettings = getStoredAiSettings();
    if (!currentSettings.hasConsented || !currentSettings.enabled) {
      setAiConsentOpen(true);
    } else {
      setAiPanelOpen(true);
    }
  };

  const handleConsentAndEnable = () => {
    saveStoredAiSettings({
      enabled: true,
      hasConsented: true,
      consentAt: new Date().toISOString(),
    });
    setAiConsentOpen(false);
    setAiPanelOpen(true);
  };

  const handleApplyTitle = (newTitle: string) => {
    if (currentEntry) {
      updateEntry(currentEntry.id, { title: newTitle }, true);
    }
  };

  const handleInsertAtCursor = (insertedText: string) => {
    if (!currentEntry) return;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const currentVal = currentEntry.content;
      const updated = currentVal.substring(0, start) + insertedText + currentVal.substring(end);
      updateEntry(currentEntry.id, { content: updated }, true);
    } else {
      const updated = currentEntry.content ? `${currentEntry.content}\n\n${insertedText}` : insertedText;
      updateEntry(currentEntry.id, { content: updated }, true);
    }
  };

  const handleReplaceContent = (newContent: string) => {
    if (currentEntry) {
      updateEntry(currentEntry.id, { content: newContent }, true);
    }
  };

  const handleSaveAsNewDraft = (draftContent: string, draftType?: EntryType, draftTitle?: string) => {
    createNewEntry({
      initialContent: draftContent,
      type: draftType || currentEntry?.type || 'diary',
      initialTitle: draftTitle || `${currentEntry?.title || 'Draft'} (AI Assistant)`,
      mood: currentEntry?.mood,
      tags: currentEntry?.tags,
    });
    setAiPanelOpen(false);
  };

  const handleApplyMetadata = (meta: MetadataSuggestion) => {
    if (!currentEntry) return;
    const patch: Partial<JournalEntry> = {};
    if (meta.mood) patch.mood = meta.mood;
    if (meta.tags && meta.tags.length > 0) {
      const combined = Array.from(new Set([...currentEntry.tags, ...meta.tags]));
      patch.tags = combined;
    }
    updateEntry(currentEntry.id, patch, true);
  };

  // Focus writing area when opening a fresh empty entry
  useEffect(() => {
    if (currentEntry?.id && !currentEntry.content && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentEntry?.id, currentEntry?.content]);

  // Ctrl/Cmd + S keyboard shortcut to trigger immediate save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (currentEntry) {
          updateEntry(currentEntry.id, {}, true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentEntry, updateEntry]);

  if (!currentEntry) {
    return (
      <div className="p-8 text-center bg-[var(--page)] border border-[var(--line)] rounded-lg space-y-4">
        <p className="text-sm text-[var(--ink-soft)]">No entry selected for editing.</p>
        <button
          type="button"
          onClick={() => navigateTo('journal')}
          className="px-4 py-2 text-xs font-medium bg-[var(--accent)] text-[#FFFCF5] rounded-md"
        >
          Return to My Journal
        </button>
      </div>
    );
  }

  const fontScript = resolveContentFontScript(
    currentEntry.fontPreference,
    currentEntry.language,
    settings.defaultFont
  );

  const words = countWords(currentEntry.content);
  const chars = countCharacters(currentEntry.content);
  const lines = countLines(currentEntry.content);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = tagInput.trim().slice(0, 60);
    if (!trimmed) return;
    if (currentEntry.tags.length >= 10) return;
    if (!currentEntry.tags.includes(trimmed)) {
      updateEntry(currentEntry.id, { tags: [...currentEntry.tags, trimmed] }, true);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateEntry(
      currentEntry.id,
      { tags: currentEntry.tags.filter((t) => t !== tagToRemove) },
      true
    );
  };

  const backTarget =
    previousSection && previousSection !== 'editor' && previousSection !== 'reading'
      ? previousSection
      : 'journal';

  return (
    <div
      className={`transition-all ${
        distractionFree
          ? 'fixed inset-0 z-50 bg-[var(--paper)] overflow-y-auto px-4 sm:px-8 py-6'
          : 'space-y-6 pb-12'
      }`}
    >
      <div className={distractionFree ? 'max-w-[820px] mx-auto space-y-6' : 'space-y-6'}>
        {/* Top Editor Control Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                updateEntry(currentEntry.id, {}, true);
                navigateTo(backTarget);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to journal
            </button>

            <span className="text-[var(--line)]" aria-hidden="true">|</span>

            {/* Date Picker supporting backdating */}
            <label className="inline-flex items-center gap-1.5 text-xs text-[var(--ink)] cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="sr-only">Entry Date</span>
              <input
                type="date"
                value={currentEntry.entryDate}
                onChange={(e) => updateEntry(currentEntry.id, { entryDate: e.target.value }, true)}
                aria-label="Entry Date"
                className="bg-transparent font-medium text-[var(--ink)] focus:outline-none focus:underline tabular-nums"
              />
            </label>
          </div>

          {/* Save Status & Page Tools */}
          <div className="flex items-center gap-3">
            <SaveStateIndicator
              saveState={saveState}
              className="flex items-center gap-1.5 text-[var(--ink-soft)]"
              onSaveNow={() => updateEntry(currentEntry.id, {}, true)}
              onRetry={() => retryFailedSave(currentEntry.id)}
            />

            <button
              type="button"
              onClick={() => setRuledLines((v) => !v)}
              aria-label="Toggle ruled paper lines"
              className={`p-1.5 rounded text-xs transition-colors ${
                ruledLines
                  ? 'bg-[var(--accent-soft)] text-[var(--ink)]'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
              title="Toggle ruled lines"
            >
              <AlignLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setDistractionFree((v) => !v)}
              aria-label={distractionFree ? 'Exit distraction-free mode' : 'Enter distraction-free mode'}
              className={`p-1.5 rounded text-xs transition-colors ${
                distractionFree
                  ? 'bg-[var(--accent-soft)] text-[var(--ink)]'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
              title="Distraction-free mode"
            >
              {distractionFree ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => toggleFavorite(currentEntry.id)}
              aria-label={currentEntry.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
              className={`p-1.5 rounded transition-colors ${
                currentEntry.isFavorite
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              <Heart className={`w-4 h-4 ${currentEntry.isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setAppearanceStudioOpen(true)}
              aria-label="Customize page appearance"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[var(--page)] border border-[var(--line)] rounded hover:border-[var(--accent)] text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
              title="Appearance Studio (Themes, Paper, Templates, Typography)"
            >
              <Palette className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Page Style</span>
            </button>

            <button
              type="button"
              onClick={() => openEntryForReading(currentEntry.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[var(--page)] border border-[var(--line)] rounded hover:border-[var(--accent)] text-[var(--ink)] transition-colors whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
              Read View
            </button>

            <button
              type="button"
              onClick={handleOpenAiAssist}
              aria-label="AI Writing Companion"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#8B6343]/15 hover:bg-[#8B6343]/25 border border-[#8B6343]/30 rounded text-[#8B6343] dark:text-[#DFB578] transition-colors whitespace-nowrap shrink-0"
              title="Open AI Writing Companion"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assist</span>
            </button>
          </div>
        </div>

        {/* Main Open Journal Page Surface */}
        <div
          className={`bg-[var(--page)] border border-[var(--line)] rounded-lg p-6 sm:p-10 lg:p-12 transition-all ${
            currentEntry.type === 'poem' ? 'max-w-[700px] mx-auto' : ''
          }`}
        >
          {/* Editorial Date Stamp inside the page */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-soft)] mb-6">
            <span className="font-literary italic">
              {formatEditorialDate(currentEntry.entryDate, true)}
            </span>
            <span className="capitalize">
              {currentEntry.type} · {currentEntry.status}
            </span>
          </div>

          {/* Optional Title Input */}
          <div className="space-y-3 mb-6">
            <input
              type="text"
              value={currentEntry.title}
              onChange={(e) => updateEntry(currentEntry.id, { title: e.target.value })}
              onBlur={() => updateEntry(currentEntry.id, {}, true)}
              placeholder={
                currentEntry.type === 'poem'
                  ? 'Title of the poem (optional)…'
                  : currentEntry.type === 'quote'
                  ? 'Context or title for this quote (optional)…'
                  : 'Give this day a name…'
              }
              aria-label="Entry title"
              className="w-full bg-transparent text-2xl sm:text-3xl font-semibold text-[var(--ink)] placeholder:text-[var(--ink-soft)]/55 focus:outline-none journal-content"
              data-script={fontScript}
            />

            {(currentEntry.type === 'poem' || currentEntry.type === 'prose') && (
              <input
                type="text"
                value={currentEntry.subtitle}
                onChange={(e) => updateEntry(currentEntry.id, { subtitle: e.target.value })}
                onBlur={() => updateEntry(currentEntry.id, {}, true)}
                placeholder="Subtitle or dedication (optional)…"
                aria-label="Entry subtitle"
                className="w-full bg-transparent text-sm sm:text-base italic text-[var(--ink-soft)] placeholder:text-[var(--ink-soft)]/50 focus:outline-none journal-content"
                data-script={fontScript}
              />
            )}
          </div>

          {/* Main Plain-Text Writing Area preserving exact Bangla/English newlines & stanza breaks */}
          <textarea
            ref={textareaRef}
            value={currentEntry.content}
            onChange={(e) => updateEntry(currentEntry.id, { content: e.target.value })}
            onBlur={() => updateEntry(currentEntry.id, {}, true)}
            rows={currentEntry.type === 'quote' || currentEntry.type === 'fragment' ? 6 : 10}
            placeholder={
              currentEntry.type === 'poem'
                ? 'Write your poem here. Every line break and stanza spacing will be preserved exactly…'
                : currentEntry.type === 'quote'
                ? 'Write the quote or aphorism verbatim…'
                : currentEntry.type === 'fragment'
                ? 'Capture a fleeting thought, unfinished line, or observation…'
                : 'Begin wherever your thoughts take you…'
            }
            aria-label="Journal writing content"
            data-script={fontScript}
            onSelect={(e) => {
              const target = e.target as HTMLTextAreaElement;
              const sel = target.value.substring(target.selectionStart, target.selectionEnd);
              setSelectedText(sel);
            }}
            className={`w-full bg-transparent text-base sm:text-[17px] text-[var(--ink)] placeholder:text-[var(--ink-soft)]/55 focus:outline-none resize-y journal-content ${
              ruledLines ? 'ruled-paper' : ''
            }`}
          />

          {/* Quote Attribution Input when type is quote */}
          {currentEntry.type === 'quote' && (
            <div className="mt-6 pt-4 border-t border-[var(--line)]/70">
              <label className="block text-xs text-[var(--ink-soft)] mb-1">
                Attribution / Source (optional)
              </label>
              <input
                type="text"
                value={currentEntry.attribution}
                onChange={(e) => updateEntry(currentEntry.id, { attribution: e.target.value })}
                onBlur={() => updateEntry(currentEntry.id, {}, true)}
                placeholder="— Author, book, or moment…"
                aria-label="Quote attribution or source"
                className="w-full bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:outline-none font-literary"
              />
            </div>
          )}
        </div>

        {/* Bottom Metadata & Annotation Panel (hidden in distraction-free mode) */}
        {!distractionFree && (
          <section
            aria-label="Entry annotations and metadata"
            className="bg-[var(--page)] border border-[var(--line)] rounded-lg p-6 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type Selector */}
              <div>
                <label
                  htmlFor="editor-type-select"
                  className="block text-xs font-medium text-[var(--ink-soft)] mb-1.5"
                >
                  Writing Type
                </label>
                <select
                  id="editor-type-select"
                  value={currentEntry.type}
                  onChange={(e) =>
                    updateEntry(currentEntry.id, { type: e.target.value as EntryType }, true)
                  }
                  className="w-full px-3 py-2 text-xs bg-[var(--paper)] border border-[var(--line)] rounded-md text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                >
                  {ENTRY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} ({t.banglaLabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mood Annotation (Optional) */}
              <div>
                <label
                  htmlFor="editor-mood-select"
                  className="block text-xs font-medium text-[var(--ink-soft)] mb-1.5"
                >
                  Mood (Optional)
                </label>
                <select
                  id="editor-mood-select"
                  value={currentEntry.mood}
                  onChange={(e) =>
                    updateEntry(currentEntry.id, { mood: e.target.value as EntryMood }, true)
                  }
                  className="w-full px-3 py-2 text-xs bg-[var(--paper)] border border-[var(--line)] rounded-md text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="">No mood annotation</option>
                  {ENTRY_MOODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.value} ({m.bangla})
                    </option>
                  ))}
                </select>
              </div>

              {/* Collection / Notebook */}
              <div>
                <label
                  htmlFor="editor-collection-select"
                  className="block text-xs font-medium text-[var(--ink-soft)] mb-1.5"
                >
                  Collection Notebook
                </label>
                <select
                  id="editor-collection-select"
                  value={currentEntry.collectionId}
                  onChange={(e) =>
                    updateEntry(currentEntry.id, { collectionId: e.target.value }, true)
                  }
                  className="w-full px-3 py-2 text-xs bg-[var(--paper)] border border-[var(--line)] rounded-md text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] font-bangla"
                >
                  <option value="">No collection</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status & Typography */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="editor-status-select"
                    className="block text-xs font-medium text-[var(--ink-soft)] mb-1.5"
                  >
                    Status
                  </label>
                  <select
                    id="editor-status-select"
                    value={currentEntry.status}
                    onChange={(e) =>
                      updateEntry(currentEntry.id, { status: e.target.value as EntryStatus }, true)
                    }
                    className="w-full px-2.5 py-2 text-xs bg-[var(--paper)] border border-[var(--line)] rounded-md text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="draft">Draft</option>
                    <option value="complete">Complete</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="editor-font-select"
                    className="block text-xs font-medium text-[var(--ink-soft)] mb-1.5"
                  >
                    Typography
                  </label>
                  <select
                    id="editor-font-select"
                    value={currentEntry.fontPreference}
                    onChange={(e) =>
                      updateEntry(
                        currentEntry.id,
                        { fontPreference: e.target.value as FontPreference },
                        true
                      )
                    }
                    className="w-full px-2.5 py-2 text-xs bg-[var(--paper)] border border-[var(--line)] rounded-md text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="auto">Auto Script</option>
                    <option value="bangla">Bangla (Hind)</option>
                    <option value="serif">Literary Serif</option>
                    <option value="sans">Clean Sans</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tags & Word Count Row */}
            <div className="pt-4 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <span className="text-xs text-[var(--ink-soft)]">Tags:</span>
                {currentEntry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                      className="text-[var(--ink-soft)] hover:text-[var(--danger)]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {currentEntry.tags.length < 10 && (
                  <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag (Bangla/En)…"
                      aria-label="Add a tag to this entry"
                      className="px-2.5 py-1 text-xs bg-[var(--paper)] border border-[var(--line)] rounded text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:outline-none focus:border-[var(--accent)] w-36"
                    />
                    <button
                      type="submit"
                      aria-label="Add tag"
                      className="p-1 rounded bg-[var(--page-muted)] text-[var(--ink)] hover:bg-[var(--accent-soft)] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>

              {/* Word & Character count + Archive/Trash actions */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--ink-soft)] tabular-nums">
                {settings.showWordCount && (
                  <span>
                    {words} words · {chars} chars · {lines} lines
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => archiveEntry(currentEntry.id)}
                  className="inline-flex items-center gap-1 hover:text-[var(--ink)] transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </button>

                <button
                  type="button"
                  onClick={() => moveToTrash(currentEntry.id)}
                  className="inline-flex items-center gap-1 text-[var(--danger)] hover:underline transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Move to Trash
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* AI First-Use Consent Modal */}
      <AiConsentModal
        isOpen={aiConsentOpen}
        onClose={() => setAiConsentOpen(false)}
        onConsentAndEnable={handleConsentAndEnable}
      />

      {/* AI Assistant Side Panel */}
      <AiAssistPanel
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        entry={currentEntry}
        selectedText={selectedText}
        onApplyTitle={handleApplyTitle}
        onInsertAtCursor={handleInsertAtCursor}
        onReplaceContent={handleReplaceContent}
        onSaveAsNewDraft={handleSaveAsNewDraft}
        onApplyMetadata={handleApplyMetadata}
      />
    </div>
  );
}
