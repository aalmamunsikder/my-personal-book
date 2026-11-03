'use client';

import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Calendar,
  ArrowRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Folder,
} from 'lucide-react';
import { requestAiAssist } from '../../lib/ai-client';
import type { AiRequestPayload, AiResponsePayload, ArchiveMatchSource } from '../../types/ai';
import type { JournalCollection, JournalEntry } from '../../types/entry';
import { BookDialogFrame } from '../common/BookDialogFrame';

interface AskMyArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  collections: JournalCollection[];
  onSelectEntry: (entryId: string) => void;
}

export function AskMyArchiveModal({
  isOpen,
  onClose,
  entries,
  collections,
  onSelectEntry,
}: AskMyArchiveModalProps) {
  const [query, setQuery] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<ArchiveMatchSource[]>([]);
  const [noMatch, setNoMatch] = useState(false);

  if (!isOpen) return null;

  // Filter candidates (excluding trashed entries)
  const activeEntries = entries.filter((e) => !e.isTrashed);
  const candidateEntries =
    selectedCollectionId === 'all'
      ? activeEntries
      : activeEntries.filter((e) => e.collectionId === selectedCollectionId);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setAnswer(null);
    setSources([]);
    setNoMatch(false);

    // Send context entries (limited to top 25 non-trashed entries to stay within token ceilings)
    const contextEntriesPayload = candidateEntries.slice(0, 25).map((entry) => ({
      id: entry.id,
      title: entry.title || '(Untitled)',
      entryDate: entry.entryDate,
      type: entry.type,
      excerpt: entry.content.slice(0, 450),
    }));

    const payload: AiRequestPayload = {
      task: 'archive_answer',
      text: '',
      customQuery: query,
      contextScope: selectedCollectionId === 'all' ? 'archive' : 'collection',
      contextEntries: contextEntriesPayload,
    };

    try {
      const response: AiResponsePayload = await requestAiAssist(payload);
      if (response.status === 'error') {
        setErrorMsg(response.error || 'Failed to search archive.');
      } else if (response.result?.archiveAnswer) {
        setAnswer(response.result.archiveAnswer.answer);
        setSources(response.result.archiveAnswer.sources || []);
        setNoMatch(Boolean(response.result.archiveAnswer.noMatchFound));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve archive answers.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BookDialogFrame
      open={isOpen}
      title="Ask My Archive"
      ariaLabelledBy="ask-archive-title"
      onClose={onClose}
      closeLabel="Close dialog"
      widthClassName="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Identity lockup: the frame header has no slot for the icon or the Bangla tagline. */}
        <div className="flex items-center gap-2.5">
          <div
            style={{ borderColor: 'var(--vv-card-border)' }}
            className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 border flex items-center justify-center text-[var(--accent)]"
          >
            <Search className="w-4 h-4" />
          </div>
          <p className="text-xs text-[var(--ink-soft)] font-bangla">
            আপনার অতীতের স্মৃতিকথা ও কবিতার অর্থগত সন্ধান
          </p>
        </div>

        {/* Search Query Form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Find poems mentioning distance, rain, or quiet nights..."
                style={{ borderColor: 'var(--vv-card-border)' }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-[var(--paper)] text-[var(--ink)] placeholder:text-[var(--ink-soft)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <Search className="w-4 h-4 text-[var(--ink-soft)] absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                background: 'var(--vv-primary-btn-bg)',
                borderColor: 'var(--vv-primary-btn-border)',
                color: 'var(--vv-primary-btn-text)',
              }}
              className="px-4 py-2 text-xs font-medium border hover:brightness-110 disabled:opacity-50 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {loading ? 'Searching…' : 'Ask Archive'}
            </button>
          </div>

          {/* Scope Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[var(--ink-soft)]">Scope:</span>
              <select
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                style={{ borderColor: 'var(--vv-card-border)' }}
                className="px-2.5 py-1 text-xs rounded-lg border bg-[var(--paper)] text-[var(--ink)] focus:outline-none"
              >
                <option value="all">Entire Active Archive ({activeEntries.length} entries)</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    Collection: {col.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-[var(--ink-soft)]">
              Read-only inquiry · Never modifies your entries
            </span>
          </div>
        </form>

        {/* Results Area: the frame body already scrolls, so no local max-height/overflow here. */}
        <div className="space-y-4 pr-1 text-xs">
          {loading && (
            <div
              style={{ borderColor: 'var(--vv-card-border)' }}
              className="p-8 text-center space-y-3 bg-black/5 dark:bg-white/5 rounded-2xl border animate-pulse"
            >
              <div className="w-9 h-9 rounded-full bg-black/10 dark:bg-white/10 mx-auto flex items-center justify-center text-[var(--accent)] animate-spin">
                <RefreshCw className="w-4 h-4" />
              </div>
              <p className="font-literary text-sm text-[var(--ink)]">Consulting your archive…</p>
              <p className="text-[11px] text-[var(--ink-soft)] font-bangla">সঠিক ডায়েরি ও কবিতা খুঁজে দেখা হচ্ছে</p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          {noMatch && (
            <div
              style={{ borderColor: 'var(--vv-card-border)' }}
              className="p-5 text-center bg-[var(--paper)] border rounded-xl space-y-1"
            >
              <p className="font-literary font-medium text-[var(--ink)]">
                No matching entries found in this scope.
              </p>
              <p className="text-[11px] text-[var(--ink-soft)]">
                Try broadening your query keywords or changing the selected collection.
              </p>
            </div>
          )}

          {answer && (
            <div
              style={{ borderColor: 'var(--vv-card-border)' }}
              className="p-4 rounded-xl bg-[var(--paper)] border space-y-3 shadow-sm"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)]">
                <Sparkles className="w-4 h-4" />
                <span>Archive Synthesis</span>
              </div>
              <p className="font-literary text-xs leading-relaxed text-[var(--ink)] whitespace-pre-wrap">
                {answer}
              </p>
            </div>
          )}

          {sources.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider font-sans">
                Cited Entries in Archive ({sources.length}):
              </span>
              <div className="space-y-2">
                {sources.map((src, idx) => (
                  <div
                    key={idx}
                    style={{ borderColor: 'var(--vv-card-border)' }}
                    className="p-3 rounded-xl bg-[var(--paper)] border transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-literary font-semibold text-sm text-[var(--ink)]">
                          {src.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--ink-soft)] mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {src.entryDate}
                          </span>
                          <span>•</span>
                          <span className="uppercase">{src.type}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectEntry(src.id);
                          onClose();
                        }}
                        style={{
                          background: 'var(--vv-primary-btn-bg)',
                          borderColor: 'var(--vv-primary-btn-border)',
                          color: 'var(--vv-primary-btn-text)',
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border rounded-lg transition-colors shrink-0 cursor-pointer"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <p
                      style={{ borderColor: 'var(--vv-accent)' }}
                      className="text-xs text-[var(--ink)] italic bg-black/5 dark:bg-white/5 p-2 rounded-lg border-l-2"
                    >
                      &ldquo;{src.excerpt}&rdquo;
                    </p>
                    <p className="text-[11px] text-[var(--ink-soft)]">
                      <strong className="text-[var(--ink)]">Match Reason:</strong> {src.matchReason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </BookDialogFrame>
  );
}
