import { z } from 'zod';
import type { AiResultData, AiTask } from '../types/ai';

export const AI_TASKS = [
  'suggest_titles',
  'proofread',
  'refine',
  'explain_poem',
  'rhyme_helper',
  'translate',
  'summarize',
  'suggest_metadata',
  'writing_feedback',
  'continue_thought',
  'archive_answer',
  'custom_prompt',
] as const satisfies readonly AiTask[];

export const AI_CONTEXT_SCOPES = [
  'selection',
  'current_entry',
  'selected_entries',
  'collection',
  'archive',
] as const;

const ENTRY_TYPES = ['diary', 'poem', 'quote', 'fragment', 'prose'] as const;

/** Gemini charges per token, so every field that reaches the model gets an explicit ceiling. */
export const MAX_INPUT_CHARACTERS = 12000;
export const MAX_ARCHIVE_CONTEXT_ITEMS = 20;
export const MAX_ARCHIVE_EXCERPT_CHARACTERS = 1200;

export const aiRequestSchema = z
  .object({
    task: z.enum(AI_TASKS),
    text: z.string().max(MAX_INPUT_CHARACTERS),
    title: z.string().max(300).optional(),
    entryType: z.enum(ENTRY_TYPES).optional(),
    language: z.enum(['bn', 'en', 'mixed', 'other']).optional(),
    style: z.string().max(120).optional(),
    outputLanguage: z.enum(['bn', 'en', 'same']).optional(),
    customQuery: z.string().max(2000).optional(),
    contextScope: z.enum(AI_CONTEXT_SCOPES),
    selectedText: z.string().max(MAX_INPUT_CHARACTERS).optional(),
    contextEntries: z
      .array(
        z.object({
          id: z.string().min(1).max(128),
          title: z.string().max(300),
          entryDate: z.string().length(10),
          type: z.enum(ENTRY_TYPES),
          excerpt: z.string().max(MAX_ARCHIVE_EXCERPT_CHARACTERS),
        })
      )
      .max(MAX_ARCHIVE_CONTEXT_ITEMS)
      .optional(),
  })
  .strict();

export type ValidatedAiRequest = z.infer<typeof aiRequestSchema>;

const titleSuggestionSchema = z.object({
  text: z.string().max(300),
  note: z.string().max(500).optional(),
  style: z.string().max(80).optional(),
});

const proofreadItemSchema = z.object({
  original: z.string().max(2000),
  suggested: z.string().max(2000),
  explanation: z.string().max(1500),
  type: z.enum(['spelling', 'grammar', 'punctuation', 'style']).optional(),
  confidence: z.enum(['high', 'uncertain', 'poetic_license']).optional(),
});

const refineAlternativeSchema = z.object({
  text: z.string().max(6000),
  direction: z.string().max(300),
  note: z.string().max(1000),
});

const archiveMatchSourceSchema = z.object({
  id: z.string().max(128),
  title: z.string().max(300),
  entryDate: z.string().max(40),
  type: z.enum(ENTRY_TYPES),
  excerpt: z.string().max(MAX_ARCHIVE_EXCERPT_CHARACTERS),
  matchReason: z.string().max(600),
});

/**
 * Unknown keys are dropped rather than passed through, so a model that invents extra fields
 * cannot widen the shape the UI then renders.
 */
export const aiResultSchema = z.object({
  text: z.string().max(20000).optional(),
  titles: z.array(titleSuggestionSchema).max(12).optional(),
  proofreadItems: z.array(proofreadItemSchema).max(300).optional(),
  fullProofreadText: z.string().max(20000).optional(),
  alternatives: z.array(refineAlternativeSchema).max(6).optional(),
  poemInterpretation: z
    .object({
      themes: z.array(z.string().max(300)).max(12),
      imageryObservations: z.array(z.string().max(600)).max(12),
      emotionalAtmosphere: z.string().max(1500),
      stanzaProgression: z.string().max(2000).optional(),
      readingNotes: z.string().max(6000),
    })
    .optional(),
  rhymes: z
    .array(
      z.object({
        word: z.string().max(120),
        meaning: z.string().max(1000),
        register: z.enum(['colloquial', 'literary', 'tatsama', 'formal', 'archaic']),
        example: z.string().max(600).optional(),
      })
    )
    .max(40)
    .optional(),
  translations: z
    .array(
      z.object({
        translation: z.string().max(8000),
        style: z.enum(['literary', 'literal', 'natural']),
        sourceLanguage: z.enum(['bn', 'en']),
        targetLanguage: z.enum(['bn', 'en']),
        notes: z.string().max(1500).optional(),
      })
    )
    .max(6)
    .optional(),
  metadata: z
    .object({
      mood: z.string().max(40).optional(),
      tags: z.array(z.string().max(60)).max(10).optional(),
      suggestedType: z.enum(ENTRY_TYPES).optional(),
      confidenceNote: z.string().max(600).optional(),
    })
    .optional(),
  summary: z
    .object({
      shortSummary: z.string().max(4000),
      keyThemes: z.array(z.string().max(300)).max(12),
      reflectionQuestions: z.array(z.string().max(400)).max(6),
    })
    .optional(),
  feedback: z
    .object({
      strengths: z.array(z.string().max(600)).max(12),
      claritySuggestions: z.array(z.string().max(600)).max(12),
      imageryNotes: z.array(z.string().max(600)).max(12),
    })
    .optional(),
  continuation: z
    .object({
      continuationText: z.string().max(8000),
      creativeDirection: z.string().max(1000),
    })
    .optional(),
  archiveAnswer: z
    .object({
      answer: z.string().max(8000),
      sources: z.array(archiveMatchSourceSchema).max(MAX_ARCHIVE_CONTEXT_ITEMS),
      noMatchFound: z.boolean(),
    })
    .optional(),
});

export function parseAiResult(raw: unknown): AiResultData | null {
  const parsed = aiResultSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data as AiResultData;
}
