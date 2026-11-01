import type { EntryMood, EntryType } from './entry';

export type AiTask =
  | 'suggest_titles'
  | 'proofread'
  | 'refine'
  | 'explain_poem'
  | 'rhyme_helper'
  | 'translate'
  | 'summarize'
  | 'suggest_metadata'
  | 'writing_feedback'
  | 'continue_thought'
  | 'archive_answer'
  | 'custom_prompt';

export type AiContextScope =
  | 'selection'
  | 'current_entry'
  | 'selected_entries'
  | 'collection'
  | 'archive';

export type AiErrorCode =
  | 'AI_DISABLED'
  | 'CONSENT_REQUIRED'
  | 'UNAUTHENTICATED'
  | 'INVALID_TASK'
  | 'INVALID_REQUEST'
  | 'INPUT_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'BUDGET_EXCEEDED'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_TIMEOUT'
  | 'INVALID_MODEL_OUTPUT'
  | 'CONTEXT_NOT_AUTHORIZED'
  | 'INTERNAL_ERROR';

export interface TitleSuggestion {
  text: string;
  note?: string;
  style?: string;
}

export interface ProofreadItem {
  original: string;
  suggested: string;
  explanation: string;
  type?: 'spelling' | 'grammar' | 'punctuation' | 'style';
  confidence?: 'high' | 'uncertain' | 'poetic_license';
}

export interface RefineAlternative {
  text: string;
  direction: string;
  note: string;
}

export interface RhymeVocabularyItem {
  word: string;
  meaning: string;
  register: 'colloquial' | 'literary' | 'tatsama' | 'formal' | 'archaic';
  example?: string;
}

export interface TranslationVariant {
  translation: string;
  style: 'literary' | 'literal' | 'natural';
  sourceLanguage: 'bn' | 'en';
  targetLanguage: 'bn' | 'en';
  notes?: string;
}

export interface MetadataSuggestion {
  mood?: EntryMood;
  tags?: string[];
  suggestedType?: EntryType;
  confidenceNote?: string;
}

export interface ArchiveMatchSource {
  id: string;
  title: string;
  entryDate: string;
  type: EntryType;
  excerpt: string;
  matchReason: string;
}

export interface AiResultData {
  text?: string;
  titles?: TitleSuggestion[];
  proofreadItems?: ProofreadItem[];
  fullProofreadText?: string;
  alternatives?: RefineAlternative[];
  poemInterpretation?: {
    themes: string[];
    imageryObservations: string[];
    emotionalAtmosphere: string;
    stanzaProgression?: string;
    readingNotes: string;
  };
  rhymes?: RhymeVocabularyItem[];
  translations?: TranslationVariant[];
  metadata?: MetadataSuggestion;
  summary?: {
    shortSummary: string;
    keyThemes: string[];
    reflectionQuestions: string[];
  };
  feedback?: {
    strengths: string[];
    claritySuggestions: string[];
    imageryNotes: string[];
  };
  continuation?: {
    continuationText: string;
    creativeDirection: string;
  };
  archiveAnswer?: {
    answer: string;
    sources: ArchiveMatchSource[];
    noMatchFound: boolean;
  };
}

export interface AiRequestPayload {
  task: AiTask;
  text: string;
  title?: string;
  entryType?: EntryType;
  language?: 'bn' | 'en' | 'mixed' | 'other';
  style?: string;
  outputLanguage?: 'bn' | 'en' | 'same';
  customQuery?: string;
  contextScope: AiContextScope;
  selectedText?: string;
  contextEntries?: Array<{
    id: string;
    title: string;
    entryDate: string;
    type: EntryType;
    excerpt: string;
  }>;
}

export interface AiResponsePayload {
  requestId: string;
  task: AiTask;
  status: 'complete' | 'error';
  result?: AiResultData;
  error?: string;
  errorCode?: AiErrorCode;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
  provider: {
    label: string;
    model: string;
  };
}

export interface AiSettings {
  enabled: boolean;
  hasConsented: boolean;
  consentVersion: string;
  consentAt: string | null;
  defaultContextScope: AiContextScope;
  dailyRequestCount: number;
  dailyLimit: number;
  lastResetDate: string;
  lastUsedAt: string | null;
}
