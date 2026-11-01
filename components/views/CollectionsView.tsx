'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookMarked,
  Edit3,
  FolderPlus,
  Palette,
  Trash2,
} from 'lucide-react';
import { useJournal } from '../../context/JournalContext';
import { COLLECTION_ACCENTS } from '../../lib/entry-utils';
import { JournalCollection } from '../../types/entry';

export function CollectionsView() {
  const {
    collections,
    entries,
    navigateTo,
    createCollection,
    updateCollection,
    deleteCollection,
    reorderCollection,
    setAppearanceStudioOpen,
  } = useJournal();

  const [dialogMode, setDialogMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [editingCol, setEditingCol] = useState<JournalCollection | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [accentInput, setAccentInput] = useState('walnut');
  const [formError, setFormError] = useState('');
  const [colToDelete, setColToDelete] = useState<JournalCollection | null>(null);

  const entryCountsByCollection = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      if (!e.isTrashed && e.collectionId) {
        counts[e.collectionId] = (counts[e.collectionId] || 0) + 1;
      }
    }
    return counts;
  }, [entries]);

  const openCreateDialog = () => {
    setEditingCol(null);
    setNameInput('');
    setDescInput('');
    setAccentInput('walnut');
    setFormError('');
    setDialogMode('create');
  };

  const openEditDialog = (col: JournalCollection) => {
    setEditingCol(col);
    setNameInput(col.name);
    setDescInput(col.description);
    setAccentInput(col.accent || 'walnut');
    setFormError('');
    setDialogMode('edit');
  };

  const handleSaveCollection = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) {
      setFormError('Please provide a name for this collection.');
      return;
    }

    if (dialogMode === 'create') {
      createCollection(cleanName, descInput.trim(), accentInput);
    } else if (dialogMode === 'edit' && editingCol) {
      updateCollection(editingCol.id, {
        name: cleanName,
        description: descInput.trim(),
        accent: accentInput,
      });
    }
    setDialogMode('closed');
  };

  return (
    <div className="space-y-8 pb-16">
      <header className="border-b border-[var(--line)] pb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-literary font-normal text-[var(--ink)] tracking-tight">
            Collections · সংকলন ও খেরোখাতা
          </h1>
          <p className="text-sm text-[var(--ink-soft)]">
            Thematic notebooks for grouping poems, diary entries, unsent words, and memories.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateDialog}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#FFFCF5] bg-[var(--accent)] rounded-md hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          New Collection
        </button>
      </header>

      {/* Grid of Collection Notebooks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {collections.map((col, idx) => {
          const count = entryCountsByCollection[col.id] || 0;
          const accentMeta =
            COLLECTION_ACCENTS.find((a) => a.value === col.accent) || COLLECTION_ACCENTS[0];

          return (
            <article
              key={col.id}
              className="bg-[var(--page)] border border-[var(--line)] rounded-lg p-6 flex flex-col justify-between gap-5 hover:border-[var(--accent)]/60 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs text-[var(--ink-soft)]">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[var(--ink)]">
                    <BookMarked
                      className="w-4 h-4 shrink-0"
                      style={{ color: accentMeta.colorHex }}
                    />
                    <span className="tabular-nums">
                      {count} {count === 1 ? 'page' : 'pages'}
                    </span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => reorderCollection(col.id, 'up')}
                      aria-label={`Move collection '${col.name}' up`}
                      className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === collections.length - 1}
                      onClick={() => reorderCollection(col.id, 'down')}
                      aria-label={`Move collection '${col.name}' down`}
                      className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppearanceStudioOpen(true)}
                      aria-label={`Design notebook appearance for '${col.name}'`}
                      className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--accent)]"
                      title="Design notebook cover and page template"
                    >
                      <Palette className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditDialog(col)}
                      aria-label={`Edit collection '${col.name}'`}
                      className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setColToDelete(col)}
                      aria-label={`Delete collection '${col.name}'`}
                      className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--danger)]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h2 className="text-xl font-semibold text-[var(--ink)] font-bangla tracking-tight">
                  <button
                    type="button"
                    onClick={() => navigateTo('collection-detail', { collectionId: col.id })}
                    className="text-left hover:text-[var(--accent)] transition-colors"
                  >
                    {col.name}
                  </button>
                </h2>

                <p className="text-sm text-[var(--ink-soft)] font-bangla leading-relaxed">
                  {col.description || 'No description added.'}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--line)]/60 flex items-center justify-between">
                <span className="text-xs text-[var(--ink-soft)]">{accentMeta.label}</span>
                <button
                  type="button"
                  onClick={() => navigateTo('collection-detail', { collectionId: col.id })}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline"
                >
                  Open notebook
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Create / Edit Collection Modal */}
      {dialogMode !== 'closed' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="collection-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <form
            onSubmit={handleSaveCollection}
            className="bg-[var(--page)] border border-[var(--line)] rounded-lg max-w-md w-full p-6 space-y-4"
          >
            <h2 id="collection-modal-title" className="text-lg font-literary font-medium text-[var(--ink)]">
              {dialogMode === 'create' ? 'Create New Collection' : 'Edit Collection'}
            </h2>

            <div className="space-y-3">
              <div>
                <label htmlFor="collection-name-input" className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                  Collection Name (Bangla or English)
                </label>
                <input
                  id="collection-name-input"
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="e.g., নৈঃশব্দ্যের দিনলিপি or Unsent Words"
                  className="w-full px-3 py-2 text-sm bg-[var(--paper)] border border-[var(--line)] rounded-md text-[var(--ink)] font-bangla focus:outline-none focus:border-[var(--accent)]"
                />
                {formError && <p className="text-xs text-[var(--danger)] mt-1">{formError}</p>}
              </div>

              <div>
                <label htmlFor="collection-desc-input" className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="collection-desc-input"
                  rows={3}
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="What kind of writing belongs in this notebook?"
                  className="w-full px-3 py-2 text-sm bg-[var(--paper)] border border-[var(--line)] rounded-md text-[var(--ink)] font-bangla focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label htmlFor="collection-accent-select" className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                  Notebook Accent Tone
                </label>
                <select
                  id="collection-accent-select"
                  value={accentInput}
                  onChange={(e) => setAccentInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--paper)] border border-[var(--line)] rounded-md text-[var(--ink)]"
                >
                  {COLLECTION_ACCENTS.map((acc) => (
                    <option key={acc.value} value={acc.value}>
                      {acc.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDialogMode('closed')}
                className="px-4 py-2 text-xs font-medium bg-[var(--page-muted)] text-[var(--ink)] rounded-md hover:bg-[var(--line)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium bg-[var(--accent)] text-[#FFFCF5] rounded-md hover:opacity-95 transition-opacity"
              >
                {dialogMode === 'create' ? 'Create Collection' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Safe Delete Collection Confirmation Dialog */}
      {colToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-col-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        >
          <div className="bg-[var(--page)] border border-[var(--line)] rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 id="delete-col-title" className="text-base font-semibold text-[var(--ink)]">
              Remove collection &ldquo;{colToDelete.name}&rdquo;?
            </h3>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
              Deleting this collection will <strong>not</strong> delete any of the diary entries, poems, or quotes inside it. All writing will remain safely in your journal.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setColToDelete(null)}
                className="px-4 py-2 text-xs font-medium bg-[var(--page-muted)] text-[var(--ink)] rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCollection(colToDelete.id);
                  setColToDelete(null);
                }}
                className="px-4 py-2 text-xs font-medium bg-[var(--danger)] text-[#FFFCF5] rounded-md"
              >
                Remove Collection Only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
