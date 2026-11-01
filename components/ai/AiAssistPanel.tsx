'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Feather,
  BookOpen,
  HelpCircle,
  ArrowRight,
  Plus,
  RefreshCw,
  Send,
  AlertCircle,
  FileText,
  Bookmark,
  Languages,
  Tag,
  Lightbulb,
} from 'lucide-react';
import { requestAiAssist } from '../../lib/ai-client';
import type {
  AiContextScope,
  AiRequestPayload,
  AiResponsePayload,
  AiResultData,
  AiTask,
  MetadataSuggestion,
  ProofreadItem,
  RefineAlternative,
  RhymeVocabularyItem,
  TitleSuggestion,
  TranslationVariant,
} from '../../types/ai';
import type { EntryMood, EntryType, JournalEntry } from '../../types/entry';

interface AiAssistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
  selectedText?: string;
  onApplyTitle: (title: string) => void;
  onInsertAtCursor: (text: string) => void;
  onReplaceContent: (newContent: string) => void;
  onSaveAsNewDraft: (content: string, type?: EntryType, title?: string) => void;
  onApplyMetadata: (meta: MetadataSuggestion) => void;
}

export function AiAssistPanel({
  isOpen,
  onClose,
  entry,
  selectedText = '',
  onApplyTitle,
  onInsertAtCursor,
  onReplaceContent,
  onSaveAsNewDraft,
  onApplyMetadata,
}: AiAssistPanelProps) {
  const [contextScope, setContextScope] = useState<AiContextScope>(
    selectedText && selectedText.trim().length > 0 ? 'selection' : 'current_entry'
  );
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<AiTask | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<AiResultData | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [stylePreference, setStylePreference] = useState('');

  if (!isOpen) return null;

  const targetText =
    contextScope === 'selection' && selectedText.trim().length > 0
      ? selectedText.trim()
      : entry.content || '';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const executeTask = async (task: AiTask, overrideCustomQuery?: string) => {
    if (!targetText.trim() && task !== 'suggest_titles') {
      setErrorMsg('No text available to analyze. Please write some lines in the entry or select a passage.');
      return;
    }

    setLoading(true);
    setActiveTask(task);
    setErrorMsg(null);

    const payload: AiRequestPayload = {
      task,
      text: targetText,
      title: entry.title,
      entryType: entry.type,
      language: entry.language,
      style: stylePreference,
      contextScope,
      selectedText: contextScope === 'selection' ? selectedText : undefined,
      customQuery: overrideCustomQuery || customQuestion,
    };

    try {
      const response: AiResponsePayload = await requestAiAssist(payload);
      if (response.status === 'error') {
        setErrorMsg(response.error || 'AI request failed');
      } else if (response.result) {
        setResult(response.result);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection to AI service failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      aria-label="Writing Companion AI Panel"
      className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-[#FAF6EE] dark:bg-[#1E1712] border-l-2 border-[#8B6343]/30 dark:border-[#593C28] shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right"
    >
      {/* Panel Top Header */}
      <div className="p-4 sm:p-5 border-b border-[#8B6343]/20 flex items-center justify-between bg-[#F4EFE3] dark:bg-[#251D17]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#8B6343]/15 border border-[#8B6343]/30 flex items-center justify-center text-[#8B6343] dark:text-[#DFB578]">
            <Feather className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-literary font-semibold text-[var(--ink)] flex items-center gap-2">
              Writing Companion
              <span className="text-[10px] uppercase tracking-wider font-sans px-1.5 py-0.5 rounded bg-[#8B6343]/15 text-[#8B6343] dark:text-[#DFB578] font-medium">
                AI
              </span>
            </h3>
            <p className="text-[11px] text-[var(--ink-soft)] font-bangla">সাহিত্যিক অন্তর্দৃষ্টি ও সহযোগী</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[#8B6343]/10 transition-colors"
          aria-label="Close Writing Companion"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Context Scope Indicator */}
      <div className="px-4 py-2.5 bg-[#EFE8D8]/60 dark:bg-[#2A2019]/60 border-b border-[#8B6343]/15 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[var(--ink-soft)] font-medium">Context:</span>
          {selectedText && selectedText.trim().length > 0 ? (
            <div className="inline-flex rounded-lg border border-[#8B6343]/30 p-0.5 bg-[var(--paper)]">
              <button
                type="button"
                onClick={() => setContextScope('selection')}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  contextScope === 'selection'
                    ? 'bg-[#8B6343] text-white font-medium'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                Selected Passage
              </button>
              <button
                type="button"
                onClick={() => setContextScope('current_entry')}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                  contextScope === 'current_entry'
                    ? 'bg-[#8B6343] text-white font-medium'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                Whole Entry
              </button>
            </div>
          ) : (
            <span className="text-[var(--ink)] font-medium bg-[#8B6343]/10 px-2 py-0.5 rounded text-[11px]">
              This Entry ({targetText.length} chars)
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
        {/* Task Suggestions Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-[var(--ink-soft)]">
            <span>Literary Tools for {entry.type.toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Title Suggestions */}
            <button
              type="button"
              disabled={loading}
              onClick={() => executeTask('suggest_titles')}
              className="p-2.5 text-left rounded-xl bg-[var(--paper)] hover:bg-[#8B6343]/10 border border-[#8B6343]/20 transition-all active:scale-[0.98] disabled:opacity-50 space-y-1"
            >
              <div className="flex items-center gap-1.5 text-[var(--ink)] font-medium font-literary">
                <BookOpen className="w-3.5 h-3.5 text-[#8B6343]" />
                Suggest Titles
              </div>
              <p className="text-[10px] text-[var(--ink-soft)] font-bangla">মননশীল শিরোনাম প্রস্তাবনা</p>
            </button>

            {/* Proofread & Grammar */}
            <button
              type="button"
              disabled={loading}
              onClick={() => executeTask('proofread')}
              className="p-2.5 text-left rounded-xl bg-[var(--paper)] hover:bg-[#8B6343]/10 border border-[#8B6343]/20 transition-all active:scale-[0.98] disabled:opacity-50 space-y-1"
            >
              <div className="flex items-center gap-1.5 text-[var(--ink)] font-medium font-literary">
                <Check className="w-3.5 h-3.5 text-[#4A6741]" />
                Proofread & Diff
              </div>
              <p className="text-[10px] text-[var(--ink-soft)] font-bangla">বানান ও যতিচিহ্ন যাচাই</p>
            </button>

            {/* Poem Explanation / Feedback */}
            {entry.type === 'poem' ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => executeTask('explain_poem')}
                className="p-2.5 text-left rounded-xl bg-[var(--paper)] hover:bg-[#8B6343]/10 border border-[#8B6343]/20 transition-all active:scale-[0.98] disabled:opacity-50 space-y-1"
              >
                <div className="flex items-center gap-1.5 text-[var(--ink)] font-medium font-literary">
                  <Feather className="w-3.5 h-3.5 text-[#8B6343]" />
                  Poem Insight
                </div>
                <p className="text-[10px] text-[var(--ink-soft)] font-bangla">ভাবার্থ, রূপক ও আবহ</p>
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => executeTask('summarize')}
                className="p-2.5 text-left rounded-xl bg-[var(--paper)] hover:bg-[#8B6343]/10 border border-[#8B6343]/20 transition-all active:scale-[0.98] disabled:opacity-50 space-y-1"
              >
                <div className="flex items-center gap-1.5 text-[var(--ink)] font-medium font-literary">
                  <FileText className="w-3.5 h-3.5 text-[#8B6343]" />
                  Summarize
                </div>
                <p className="text-[10px] text-[var(--ink-soft)] font-bangla">সারসংক্ষেপ ও প্রতিফলন</p>
              </button>
            )}

            {/* Rhyme / Refine */}
            {entry.type === 'poem' ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => executeTask('rhyme_helper')}
                className="p-2.5 text-left rounded-xl bg-[var(--paper)] hover:bg-[#8B6343]/10 border border-[#8B6343]/20 transition-all active:scale-[0.98] disabled:opacity-50 space-y-1"
              >
                <div className="flex items-center gap-1.5 text-[var(--ink)] font-medium font-literary">
                  <Bookmark className="w-3.5 h-3.5 text-[#8B6343]" />
                  Rhymes & Words
                </div>
                <p className="text-[10px] text-[var(--ink-soft)] font-bangla">অন্ত্যমিল ও শব্দভাণ্ডার</p>
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => executeTask('refine')}
                className="p-2.5 text-left rounded-xl bg-[var(--paper)] hover:bg-[#8B6343]/10 border border-[#8B6343]/20 transition-all active:scale-[0.98] disabled:opacity-50 space-y-1"
              >
                <div className="flex items-center gap-1.5 text-[var(--ink)] font-medium font-literary">
                  <Lightbulb className="w-3.5 h-3.5 text-[#8B6343]" />
                  Refine Wording
                </div>
                <p className="text-[10px] text-[var(--ink-soft)] font-bangla">ভাষা ও সুর পরিমার্জন</p>
              </button>
            )}

            {/* Translation */}
            <button
              type="button"
              disabled={loading}
              onClick={() => executeTask('translate')}
              className="p-2.5 text-left rounded-xl bg-[var(--paper)] hover:bg-[#8B6343]/10 border border-[#8B6343]/20 transition-all active:scale-[0.98] disabled:opacity-50 space-y-1"
            >
              <div className="flex items-center gap-1.5 text-[var(--ink)] font-medium font-literary">
                <Languages className="w-3.5 h-3.5 text-[#8B6343]" />
                Translate (বাংলা ↔ En)
              </div>
              <p className="text-[10px] text-[var(--ink-soft)] font-bangla">সাহিত্যিক অনুবাদ</p>
            </button>

            {/* Suggest Metadata */}
            <button
              type="button"
              disabled={loading}
              onClick={() => executeTask('suggest_metadata')}
              className="p-2.5 text-left rounded-xl bg-[var(--paper)] hover:bg-[#8B6343]/10 border border-[#8B6343]/20 transition-all active:scale-[0.98] disabled:opacity-50 space-y-1"
            >
              <div className="flex items-center gap-1.5 text-[var(--ink)] font-medium font-literary">
                <Tag className="w-3.5 h-3.5 text-[#8B6343]" />
                Suggest Tags & Mood
              </div>
              <p className="text-[10px] text-[var(--ink-soft)] font-bangla">ট্যাগ ও অনুভূতির প্রস্তাবনা</p>
            </button>
          </div>
        </div>

        {/* Custom Question / Inquiry */}
        <div className="space-y-2 pt-2 border-t border-[#8B6343]/15">
          <label htmlFor="ai-custom-query" className="text-[11px] font-medium text-[var(--ink-soft)]">
            Ask Companion About This Writing
          </label>
          <div className="flex items-center gap-2">
            <input
              id="ai-custom-query"
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customQuestion.trim() && !loading) {
                  executeTask('custom_prompt');
                }
              }}
              placeholder="e.g. Does the cadence in the 2nd line work?"
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#8B6343]/30 bg-[var(--paper)] text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:outline-none focus:ring-1 focus:ring-[#8B6343]"
            />
            <button
              type="button"
              disabled={loading || !customQuestion.trim()}
              onClick={() => executeTask('custom_prompt')}
              className="px-3 py-2 bg-[#8B6343] hover:bg-[#725035] disabled:opacity-40 text-white rounded-lg transition-colors flex items-center justify-center"
              aria-label="Send inquiry"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="p-6 text-center space-y-3 bg-[#EFE8D8]/50 dark:bg-[#251D17]/50 rounded-2xl border border-[#8B6343]/20 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-[#8B6343]/20 mx-auto flex items-center justify-center text-[#8B6343] animate-spin">
              <RefreshCw className="w-5 h-5" />
            </div>
            <p className="text-xs font-literary text-[var(--ink)]">Reflecting on your words…</p>
            <p className="text-[10px] text-[var(--ink-soft)] font-bangla">সাহিত্যের মর্যাদা ও স্বকীয়তা অক্ষুণ্ণ রাখা হচ্ছে</p>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 space-y-1">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>AI Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Results Presentation Area */}
        {result && !loading && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-[#8B6343]/15 pb-2">
              <span className="text-xs font-literary font-semibold text-[var(--ink)]">
                AI Suggestions
              </span>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-[11px] text-[var(--ink-soft)] hover:text-[var(--ink)]"
              >
                Clear
              </button>
            </div>

            {/* 1. Title Suggestions */}
            {result.titles && result.titles.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-[11px] font-medium text-[var(--ink-soft)]">
                  Proposed Titles (Click to Apply):
                </span>
                <div className="space-y-2">
                  {result.titles.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--paper)] border border-[#8B6343]/20 space-y-1.5 hover:border-[#8B6343]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-literary font-medium text-[var(--ink)] text-sm">
                          {t.text}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(t.text, `title-${idx}`)}
                            className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--ink)]"
                            title="Copy title"
                          >
                            {copiedKey === `title-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onApplyTitle(t.text)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-[#8B6343] hover:bg-[#725035] text-white rounded transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                      {t.note && <p className="text-[11px] text-[var(--ink-soft)]">{t.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Proofreading Diff */}
            {result.proofreadItems && result.proofreadItems.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-[11px] font-medium text-[var(--ink-soft)]">
                  Spelling & Style Observations:
                </span>
                <div className="space-y-2">
                  {result.proofreadItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--paper)] border border-[#8B6343]/20 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="line-through text-red-600 dark:text-red-400">
                          {item.original}
                        </span>
                        <ArrowRight className="w-3 h-3 text-[var(--ink-soft)]" />
                        <span className="font-medium text-green-700 dark:text-green-400">
                          {item.suggested}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--ink-soft)]">{item.explanation}</p>
                    </div>
                  ))}
                </div>
                {result.fullProofreadText && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(result.fullProofreadText!, 'full-proofread')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-[#8B6343]/30 rounded text-[var(--ink)] hover:bg-[#8B6343]/10"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Corrected
                    </button>
                    <button
                      type="button"
                      onClick={() => onReplaceContent(result.fullProofreadText!)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-[#8B6343] hover:bg-[#725035] text-white rounded shadow-sm"
                    >
                      <Check className="w-3 h-3" />
                      Apply All Corrections
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. Refine Alternatives */}
            {result.alternatives && result.alternatives.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-[11px] font-medium text-[var(--ink-soft)]">
                  Voice-Preserving Alternatives:
                </span>
                <div className="space-y-2">
                  {result.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--paper)] border border-[#8B6343]/20 space-y-2"
                    >
                      <p className="font-literary text-xs leading-relaxed text-[var(--ink)] whitespace-pre-wrap">
                        {alt.text}
                      </p>
                      {alt.note && <p className="text-[11px] text-[var(--ink-soft)]">{alt.note}</p>}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#8B6343]/15">
                        <button
                          type="button"
                          onClick={() => handleCopy(alt.text, `alt-${idx}`)}
                          className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                          title="Copy"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onInsertAtCursor(alt.text)}
                          className="px-2 py-0.5 text-[11px] border border-[#8B6343]/30 rounded text-[var(--ink)] hover:bg-[#8B6343]/10"
                        >
                          Insert
                        </button>
                        <button
                          type="button"
                          onClick={() => onSaveAsNewDraft(alt.text, entry.type, `${entry.title} (Variation)`)}
                          className="px-2 py-0.5 text-[11px] bg-[#8B6343] hover:bg-[#725035] text-white rounded"
                        >
                          Save as Draft
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Poem Interpretation */}
            {result.poemInterpretation && (
              <div className="p-3.5 rounded-xl bg-[var(--paper)] border border-[#8B6343]/20 space-y-3">
                <div className="flex items-center justify-between border-b border-[#8B6343]/15 pb-1.5">
                  <span className="font-literary font-medium text-[var(--ink)]">
                    Poem Reading & Imagery
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.poemInterpretation!.readingNotes, 'poem-notes')}
                    className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                {result.poemInterpretation.themes?.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-sans tracking-wider text-[var(--ink-soft)] font-medium">
                      Themes:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {result.poemInterpretation.themes.map((th, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-[#8B6343]/15 text-[var(--ink)] text-[11px]"
                        >
                          {th}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.poemInterpretation.emotionalAtmosphere && (
                  <p className="text-xs text-[var(--ink)] italic leading-relaxed">
                    &ldquo;{result.poemInterpretation.emotionalAtmosphere}&rdquo;
                  </p>
                )}
                <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                  {result.poemInterpretation.readingNotes}
                </p>
              </div>
            )}

            {/* 5. Rhymes & Vocabulary */}
            {result.rhymes && result.rhymes.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-[var(--ink-soft)]">
                  Rhymes & Vocabulary:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {result.rhymes.map((r, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[var(--paper)] border border-[#8B6343]/20 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-literary font-medium text-sm text-[var(--ink)]">
                            {r.word}
                          </span>
                          <span className="text-[10px] text-[var(--ink-soft)] px-1.5 py-0.5 rounded bg-[#8B6343]/10">
                            {r.register}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--ink-soft)]">{r.meaning}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onInsertAtCursor(r.word)}
                        className="px-2 py-1 text-[11px] bg-[#8B6343] hover:bg-[#725035] text-white rounded"
                      >
                        Insert
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Summary & Reflection */}
            {result.summary && (
              <div className="p-3.5 rounded-xl bg-[var(--paper)] border border-[#8B6343]/20 space-y-3">
                <span className="font-literary font-medium text-[var(--ink)]">
                  Summary & Reflection Questions
                </span>
                <p className="text-xs leading-relaxed text-[var(--ink)]">
                  {result.summary.shortSummary}
                </p>
                {result.summary.reflectionQuestions?.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-[#8B6343]/15">
                    <span className="text-[11px] font-medium text-[var(--ink-soft)]">
                      Questions for personal contemplation:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-xs text-[var(--ink-soft)]">
                      {result.summary.reflectionQuestions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#8B6343]/15">
                  <button
                    type="button"
                    onClick={() =>
                      onSaveAsNewDraft(
                        `${result.summary!.shortSummary}\n\nReflection:\n${result.summary!.reflectionQuestions.join('\n')}`,
                        'fragment',
                        `Reflections on ${entry.title || 'Entry'}`
                      )
                    }
                    className="px-2.5 py-1 text-xs bg-[#8B6343] hover:bg-[#725035] text-white rounded"
                  >
                    Save as New Fragment
                  </button>
                </div>
              </div>
            )}

            {/* 7. Translation */}
            {result.translations && result.translations.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-medium text-[var(--ink-soft)]">
                  Literary Translation:
                </span>
                {result.translations.map((tr, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[var(--paper)] border border-[#8B6343]/20 space-y-2"
                  >
                    <p className="font-literary text-xs leading-relaxed whitespace-pre-wrap text-[var(--ink)]">
                      {tr.translation}
                    </p>
                    {tr.notes && <p className="text-[11px] text-[var(--ink-soft)] italic">{tr.notes}</p>}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#8B6343]/15">
                      <button
                        type="button"
                        onClick={() => handleCopy(tr.translation, `tr-${idx}`)}
                        className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSaveAsNewDraft(
                            tr.translation,
                            entry.type,
                            `${entry.title || 'Untitled'} (${tr.targetLanguage.toUpperCase()})`
                          )
                        }
                        className="px-2.5 py-1 text-xs bg-[#8B6343] hover:bg-[#725035] text-white rounded"
                      >
                        Save as New Draft
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 8. Metadata Suggestions */}
            {result.metadata && (
              <div className="p-3.5 rounded-xl bg-[var(--paper)] border border-[#8B6343]/20 space-y-3">
                <span className="font-literary font-medium text-[var(--ink)]">
                  Suggested Mood & Tags
                </span>
                {result.metadata.mood && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--ink-soft)]">Suggested Mood:</span>
                    <button
                      type="button"
                      onClick={() => onApplyMetadata({ mood: result.metadata!.mood })}
                      className="px-2.5 py-0.5 rounded-full bg-[#8B6343]/15 hover:bg-[#8B6343] hover:text-white transition-colors text-xs font-medium"
                    >
                      + {result.metadata.mood}
                    </button>
                  </div>
                )}
                {result.metadata.tags && result.metadata.tags.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-[var(--ink-soft)]">Click to add tag:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.metadata.tags.map((tg, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onApplyMetadata({ tags: [tg] })}
                          className="px-2 py-0.5 rounded-full border border-[#8B6343]/30 hover:bg-[#8B6343] hover:text-white transition-colors text-[11px]"
                        >
                          + {tg}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 9. Direct Text / Custom Answer */}
            {result.text && (
              <div className="p-3.5 rounded-xl bg-[var(--paper)] border border-[#8B6343]/20 space-y-2">
                <p className="font-literary text-xs leading-relaxed text-[var(--ink)] whitespace-pre-wrap">
                  {result.text}
                </p>
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#8B6343]/15">
                  <button
                    type="button"
                    onClick={() => handleCopy(result.text!, 'custom-text')}
                    className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
