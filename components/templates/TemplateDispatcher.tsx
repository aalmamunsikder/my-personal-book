'use client';

import React from 'react';
import type { AppearanceConfig } from '../../types/appearance';
import type { JournalCollection, JournalEntry } from '../../types/entry';
import { PAPER_SURFACES } from '../../lib/themes';
import { ClassicJournalTemplate } from './ClassicJournalTemplate';
import { CleanLetterTemplate } from './CleanLetterTemplate';
import { PoetryManuscriptTemplate } from './PoetryManuscriptTemplate';
import { QuoteFolioTemplate } from './QuoteFolioTemplate';
import { PocketFragmentTemplate } from './PocketFragmentTemplate';
import { DailyReflectionTemplate } from './DailyReflectionTemplate';
import { LiteraryBookPageTemplate } from './LiteraryBookPageTemplate';
import { MarginaliaTemplate } from './MarginaliaTemplate';
import { DistractionFreeTemplate } from './DistractionFreeTemplate';
import { VintageJournalTemplate } from './VintageJournalTemplate';

export interface TemplateDispatcherProps {
  entry: JournalEntry;
  collection?: JournalCollection | null;
  config: AppearanceConfig;
  fontScript: 'serif' | 'bn' | 'sans';
  children?: React.ReactNode;
}

export function TemplateDispatcher({
  entry,
  collection,
  config,
  fontScript,
  children,
}: TemplateDispatcherProps) {
  const paperDef = PAPER_SURFACES[config.paperId] || PAPER_SURFACES['cream-stationery'];
  const paperClass = paperDef.cssClass;

  const templateProps = {
    entry,
    collection,
    config,
    fontScript,
    children,
  };

  const renderTemplateContent = () => {
    switch (config.pageTemplateId) {
      case 'clean-letter':
        return <CleanLetterTemplate {...templateProps} />;
      case 'poetry-manuscript':
        return <PoetryManuscriptTemplate {...templateProps} />;
      case 'quote-folio':
        return <QuoteFolioTemplate {...templateProps} />;
      case 'pocket-fragment':
        return <PocketFragmentTemplate {...templateProps} />;
      case 'daily-reflection':
        return <DailyReflectionTemplate {...templateProps} />;
      case 'literary-book-page':
        return <LiteraryBookPageTemplate {...templateProps} />;
      case 'marginalia':
        return <MarginaliaTemplate {...templateProps} />;
      case 'distraction-free':
        return <DistractionFreeTemplate {...templateProps} />;
      case 'vintage-journal':
        return <VintageJournalTemplate {...templateProps} />;
      case 'classic-journal':
      default:
        // PAGE-010: Safe fallback for unknown template ID without crash
        return <ClassicJournalTemplate {...templateProps} />;
    }
  };

  return (
    <div
      data-template={config.pageTemplateId}
      data-paper={config.paperId}
      className={`page-surface transition-all duration-200 rounded-lg ${paperClass}`}
    >
      {renderTemplateContent()}
    </div>
  );
}
