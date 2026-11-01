# VerseVault — AI Features, Privacy & Implementation Specification
## A user-controlled AI writing companion for a private Bangla/English diary

**Product:** VerseVault  
**Product model:** Private, single-owner personal diary and literary archive  
**Frontend:** Lovable React + TypeScript + Vite  
**Database/Auth:** Supabase Postgres + Supabase Auth + RLS  
**Hosting:** Vercel  
**AI backend (recommended):** Authenticated Supabase Edge Functions  
**AI integration layer:** Provider-agnostic adapter; optionally Vercel AI SDK / AI Gateway  
**Primary languages:** Bangla and English  
**Companion specifications:**
- `VerseVault_Personal_Diary_Lovable_Spec.md`
- `VerseVault_QA_Testing_and_Release_Checklist.md`
- `VerseVault_Features_Implementation_UX_Vercel_Guide.md`

> **Core principle:** AI must serve the writer, never take ownership of the writing. It may suggest, explain, organize, translate, or help retrieve. It must never silently rewrite, publish, delete, classify, or transmit personal writing without a clear user action.

---

# 1. AI product vision

Add a thoughtful AI companion to VerseVault that helps the owner understand, refine, rediscover, and organize their own writing.

AI should feel like an optional literary assistant sitting beside the diary—not a chatbot that takes over the application.

The owner should be able to:
- Ask for title ideas for a poem.
- Get Bangla spelling and grammar suggestions.
- Explore alternative wording while preserving their voice.
- Understand themes, imagery, metaphors, and emotional tone in a poem.
- Generate a short summary of a long diary entry.
- Translate selected writing between Bangla and English.
- Suggest tags, mood, and collection placement.
- Ask questions about explicitly selected entries.
- Find old writing by meaning rather than remembering exact words.
- Receive optional writing prompts when they need inspiration.

## 1.1 AI principles

1. **User-initiated only:** no AI processing on app open, typing, or saving unless the owner explicitly invokes it.
2. **Private by default:** AI features are disabled until the owner enables them and accepts the data-processing explanation.
3. **Minimum context:** send only the text required for the requested task.
4. **Original writing is sacred:** never overwrite an entry automatically.
5. **Preview before applying:** every proposed text change is shown before it can be inserted or saved.
6. **Bangla-first quality:** test language quality with real Bangla test cases, not English-only assumptions.
7. **Transparent AI:** show when AI is being used, which context is being sent, and the provider/model where practical.
8. **No hidden profiling:** no automatic mood, personality, relationship, or mental-health inference.
9. **No autonomous data actions:** AI does not create, edit, archive, or delete entries by itself.
10. **Cost-aware:** use small requests and user-visible limits; never run unbounded AI tasks.

## 1.2 Non-goals

Do not build:
- An autonomous AI agent with unrestricted access to the diary database.
- Background analysis of every entry by default.
- Automatic daily mood surveillance.
- Mental-health diagnosis, therapy, or risk scoring.
- Automatic rewriting or correction during typing/save.
- AI-generated entries inserted without approval.
- Public AI chat or multi-user AI workspaces.
- Web browsing on the owner's behalf unless explicitly requested as a separate feature.
- AI that can permanently delete, archive, or publish data.

---

# 2. AI feature roadmap

Build the foundation first, then add features in controlled phases.

## Phase AI-0 — Privacy and AI foundation

Required before exposing any AI feature:
- AI enabled/disabled setting.
- First-use consent explanation.
- Provider/model configuration stored server-side.
- Authenticated server-side AI endpoint.
- Request validation and size limits.
- Minimal usage/cost logging without writing content.
- Clear error, retry, and rate-limit states.
- Original-content preservation.
- AI feature flags.

## Phase AI-1 — Current-writing assistant (recommended MVP)

Only the currently open entry or selected text is sent to AI.

Features:
1. **Suggest titles** — generate several title options.
2. **Proofread** — identify likely spelling, punctuation, and grammar improvements.
3. **Refine wording** — provide alternative phrasings while preserving meaning and tone.
4. **Explain a poem** — discuss themes, metaphors, imagery, and possible interpretations.
5. **Suggest rhymes/words** — offer vocabulary and rhyme ideas; do not claim strict metre correctness unless verified.
6. **Summarize** — create a short summary of a long entry.
7. **Translate** — Bangla ↔ English, with optional literal or literary style.
8. **Suggest tags and mood** — metadata suggestions only; never apply automatically.
9. **Give feedback** — offer constructive feedback on clarity, flow, imagery, and structure.
10. **Continue a thought** — generate optional continuation ideas, clearly marked as AI-generated.

All outputs must be suggestions. The owner chooses whether to copy, insert, save as a new Fragment, or discard.

## Phase AI-2 — Writing companion

Add a focused AI chat panel for questions about the current entry.

Examples:
- “What themes do you notice in this poem?”
- “Can you explain the metaphor in the third stanza?”
- “Give me three alternatives for this line, but keep the melancholy tone.”
- “Does the ending feel resolved?”
- “Suggest a title that is less direct and more philosophical.”

Rules:
- Default context = current entry only.
- User can select text to share instead.
- AI cannot access other entries unless the owner explicitly adds them.
- Chat is ephemeral by default; do not persist it unless the owner explicitly chooses Save conversation.
- AI must distinguish interpretation from fact.

## Phase AI-3 — Ask My Archive (read-only)

Allow the owner to ask natural-language questions about selected past writings.

Examples:
- “Find the poem where I wrote about silence and distance.”
- “Show entries I wrote about family.”
- “Which writing contains the phrase about a house being a memory?”
- “Find reflections about time from last year.”

Features:
- Retrieve matching entries.
- Show title/date/type and a short excerpt.
- Show why each item matched.
- Open the original entry.
- Never fabricate a quote or claim a retrieved passage exists if it cannot cite the stored entry.

Context controls:
- Selected entries only.
- Selected collection.
- Selected date range.
- Entire active archive only after explicit confirmation.

Ask My Archive is read-only. It must never modify entries.

## Phase AI-4 — Semantic search

Add vector/embedding search only after keyword search is stable and AI privacy controls are working.

Features:
- Search by meaning rather than exact words.
- Hybrid search: keyword + semantic retrieval.
- Filters by type, date, mood, and collection.
- Show original entry as the source.
- Keep retrieval scoped to the owner.

Semantic indexing is a separate opt-in. Embeddings are derived from private writing and must be treated as sensitive data.

## Phase AI-5 — Optional advanced features

Only after the above is stable:
- Voice dictation for diary entries.
- Read-aloud using text-to-speech.
- Writing prompt generator.
- Optional personal writing insights.
- Optional local/on-device model integration if feasible.

Do not implement all advanced features in the first release.

---

# 3. Feature specifications

## 3.1 AI writing toolbar

Add an **AI Assist** action in the editor toolbar. Keep it visually secondary to Save and normal writing controls.

On activation, open a compact panel with actions relevant to the content type.

For a poem:
- Suggest titles.
- Explain imagery.
- Find rhymes.
- Offer alternate lines.
- Proofread.
- Translate.
- Give literary feedback.

For a diary entry:
- Summarize.
- Proofread.
- Reflective questions.
- Suggest tags/mood.
- Translate selected text.
- Find a title.

For a quote:
- Suggest variations.
- Explain meaning.
- Translate.
- Suggest tags.
- Check grammar.

For a fragment:
- Suggest possible directions.
- Expand into optional alternatives.
- Suggest titles.
- Save an AI-generated continuation as a separate draft only after owner action.

The toolbar must not make AI appear mandatory.

## 3.2 Suggest titles

Input:
- Current entry title if present.
- Current text or selected text.
- Desired style: poetic, philosophical, subtle, direct, minimal, mysterious.
- Output language: Bangla, English, or same as source.

Output:
- 3–7 short suggestions.
- Each suggestion can be copied or applied to the title field.
- Applying a title must be a separate click.
- If the title field already has text, show a replace confirmation or allow “Keep both”.

Do not modify the body.

## 3.3 Proofreading

Support:
- Bangla spelling suggestions.
- Bangla grammar suggestions.
- English spelling and grammar.
- Mixed-language text.
- Punctuation suggestions.
- Optional formal/literary style check.

UX:
- Show original and suggested text side by side or as a clear diff.
- Explain changes briefly.
- Allow accepting/rejecting individual changes where possible.
- “Apply all” requires an explicit click.
- Preserve the original version or allow Undo.
- Never make automatic corrections on save.

Important:
- Bangla grammar and poetic license can be context-dependent.
- Clearly label uncertain suggestions.
- Do not “correct” dialect, colloquial expression, deliberate fragmentation, or poetic grammar without explaining the change.

## 3.4 Refine wording / preserve my voice

Inputs:
- Selected text or current entry.
- Requested direction: clearer, more concise, more poetic, more philosophical, more natural, more formal, or more subtle.
- Language.
- Voice-preservation option enabled by default.

Output:
- 2–3 alternatives.
- Brief note describing what changed.
- Compare with original.
- Insert selected alternative or save as a separate copy.

Never replace the full entry automatically.

## 3.5 Poem interpretation and literary feedback

AI can provide:
- Possible theme(s).
- Imagery and metaphor observations.
- Emotional atmosphere.
- Structure and stanza progression.
- Possible interpretations of ambiguous lines.
- Suggestions for stronger endings.
- Rhythm/rhyme observations.

Rules:
- Use language such as “one possible reading” rather than claiming the author's intent.
- Do not present interpretation as objective truth.
- Avoid flattening ambiguity; ambiguity is often deliberate in poetry.
- Do not claim exact Bangla metre or prosody unless the model can demonstrate and explain the method.
- Keep feedback constructive and respectful.

## 3.6 Rhyme and vocabulary helper

Features:
- Rhyme suggestions for a selected word/line.
- Synonyms and near-synonyms.
- Tattva/tatsama-style vocabulary suggestions when requested.
- Simpler alternatives.
- Bangla/English word suggestions.

Output fields:
- Word/phrase.
- Meaning.
- Register (colloquial, literary, formal, archaic).
- Example usage.
- Confidence/notes when meaning is context-dependent.

Do not return fabricated dictionary definitions as authoritative. Label suggestions as AI-generated vocabulary assistance.

## 3.7 Translation

Support:
- Bangla → English.
- English → Bangla.
- Literal translation.
- Literary translation.
- Natural conversational translation.

UX:
- Show source and translation side by side.
- Preserve stanza/paragraph breaks.
- Offer copy and “Save as new Fragment” actions.
- Never replace source text by default.
- Allow the owner to request a second translation style.

Use a model that performs adequately in both Bangla and English. Evaluate on a curated test set before production.

## 3.8 Summary and reflection

For long diary entries:
- Short summary.
- Key themes.
- Important events mentioned (only when explicitly requested).
- Questions for personal reflection.

Rules:
- Do not infer diagnoses or stable personality traits.
- Do not label the owner with psychological conditions.
- Do not present generated reflection as a factual account.
- Make the selected entry/context visible before sending.
- Keep summary separate from the original writing.

## 3.9 Metadata suggestions

Suggest:
- Mood.
- Tags.
- Collection.
- Content type (only as an optional suggestion).

Use structured output with schema validation.

Example result:
```json
{
  "mood": "Reflective",
  "tags": ["সময়", "নিঃসঙ্গতা", "স্মৃতি"],
  "suggested_type": "poem",
  "confidence_note": "These are suggestions based on the selected text."
}
```

Do not apply suggestions automatically. The owner confirms each action.

## 3.10 Writing prompts

Provide optional prompts:
- General philosophical prompt.
- Memory prompt.
- Family prompt.
- Nature prompt.
- Relationship prompt.
- Bangla literary prompt.
- English creative prompt.

Prompts should not require access to the owner's archive. A simple model request with no personal context is enough.

Avoid sending diary history just to generate a generic prompt.

## 3.11 Ask My Archive

This is a read-only retrieval assistant.

User flow:
1. Open Ask My Archive.
2. Choose context scope.
3. Enter a natural-language question.
4. AI retrieves candidate entries through owner-scoped database queries.
5. Answer includes cited entry cards.
6. User opens the original item to verify.

Each cited source must have:
- Entry title or untitled label.
- Entry date.
- Type.
- Short excerpt.
- Open original action.

The AI must not invent citations. If no records match, say it could not find a matching entry.

## 3.12 Semantic search

Use only after explicit opt-in.

High-level flow:
1. Owner enables AI archive indexing.
2. Owner chooses all entries or selected collections/date ranges.
3. Show an estimate of how many entries will be processed.
4. Confirm that text-derived embeddings will be stored.
5. Generate embeddings in a server-side function.
6. Store embeddings in a private table with RLS.
7. Re-index only changed entries.
8. Delete embeddings when the source entry is permanently deleted.
9. On disable, offer to delete all stored embeddings.
10. Never expose embeddings through public or anonymous queries.

Keep regular keyword search available even if semantic search is disabled.

---

# 4. AI experience and UI/UX

## 4.1 AI placement

AI must be discoverable but never intrusive.

Recommended placements:
- Small AI Assist button in the editor toolbar.
- Optional AI side panel on desktop.
- Bottom sheet or dedicated screen on mobile.
- “Ask My Archive” as a separate navigation action.
- AI prompt button in empty/new writing state, but never auto-triggered.

Do not show a floating chat bubble over the writing canvas at all times.

## 4.2 Desktop editor AI panel

Suggested layout:
- Main writing canvas remains visible.
- Right-side AI panel opens only when requested.
- Panel header: “Writing Companion”.
- Context label: “Using: selected text” or “Using: this entry”.
- Task chips: Proofread, Titles, Explain, Refine, Translate, Feedback.
- Prompt input for custom questions.
- Output cards with Copy, Insert, Save as new draft, and Dismiss.
- Close panel returns full focus to the writing canvas.

The AI panel must not steal keyboard focus from the editor unexpectedly.

## 4.3 Mobile AI panel

- Use a bottom sheet or full-screen assistant view.
- Keep close/back control visible.
- Show selected context.
- Results should be readable and scrollable.
- “Insert” and “Save as new draft” actions must be reachable above the keyboard.
- Never place important action buttons behind the software keyboard.

## 4.4 Context selector

Before a request, show a context selector:
- Selected text.
- Current entry.
- Selected entries.
- Selected collection.
- Date range.
- Entire archive (only for Ask My Archive; extra confirmation).

Default:
- If text is selected, use only selected text.
- Otherwise, current entry only.
- Never use entire archive by default.

Show an explicit count and source preview, e.g.:
“AI will receive: selected passage from ‘অভিমানের অন্তরালে’.”
For archive context:
“AI will receive 4 selected entries (titles, dates, and content).”

Allow the owner to remove individual entries from the context before sending.

## 4.5 Output states

Every AI task needs:
- Idle.
- Preparing context.
- Sending request.
- Streaming/generating.
- Complete.
- Empty/invalid output.
- Rate limited.
- Provider error.
- Network failure.
- Cancelled.
- Timed out.

Do not display a partial stream as a completed suggestion. If the request fails midway, keep any partial output clearly marked as incomplete and do not offer automatic Apply All.

## 4.6 Visual language

Use the same diary palette:
- Warm paper surfaces.
- Walnut/brown accent.
- Hind Siliguri for Bangla.
- Literary serif for reading outputs.
- Subtle icon/label indicating AI-generated content.

Avoid a visually separate “AI SaaS dashboard” inside the diary.

---

# 5. Privacy, consent, and data governance

This is the most important part of AI integration because diary entries may contain intimate personal information.

## 5.1 Explicit first-use consent

Before the first AI request, show a plain-language explanation:

- AI features send the selected text/context to the configured AI provider.
- The provider processes the request to generate a response.
- VerseVault's AI service does not need to store the prompt or response content.
- The provider's data handling, retention, and training terms depend on the provider/account configuration.
- The owner can disable AI at any time.
- The owner decides exactly which writing is sent.

Require an explicit “Enable AI features” action.

Do not treat a page visit or typing as consent.

## 5.2 Minimum data principle

Default request context:
1. Selected text if present.
2. Otherwise current entry.
3. For Ask My Archive, only the scope explicitly chosen.

Never:
- Send all diary entries by default.
- Include account email or profile details unless required.
- Include collections outside the selected scope.
- Include Trash entries unless explicitly selected.
- Send text from unrelated open tabs.
- send content automatically on save.

## 5.3 Provider transparency

Settings must show:
- AI enabled/disabled.
- Provider name.
- Model label (where configurable).
- Whether requests leave VerseVault and go to the provider.
- Provider's applicable data terms/retention link.
- Last AI request date (optional, metadata only).
- A control to disable AI.

Before production:
- Review the current provider privacy/data controls and terms.
- Determine whether prompts/responses are retained, used for training, or available under a zero-retention/data-control option.
- Do not claim “not used for training” or “zero retention” unless the selected account, endpoint, and configuration actually provide it.
- Re-check these terms when changing providers or models.

## 5.4 Persistence policy

Default:
- Do not store AI prompts or responses.
- Do not persist chat history.
- Do not log request bodies.
- Store only minimal usage metadata.

Optional:
- Owner may save an AI response as a new Fragment.
- Owner may explicitly save an AI conversation.
- Saved AI output must be labeled as AI-assisted/generated.
- Saved output is private, just like any other entry.

## 5.5 Original writing protection

AI must never:
- Overwrite an entry on its own.
- Change a title without a click.
- Apply all grammar corrections without confirmation.
- Delete text.
- Archive or restore entries.
- Change mood/tags/collections automatically.
- Trigger database writes through model tool calls.

Safe application flows:
- Copy suggestion.
- Insert selected suggestion at cursor.
- Replace selected text after preview and confirmation.
- Save result as a new draft.
- Undo an accepted insertion.

For whole-entry rewrites, prefer “Save as a new draft” rather than replacing the original.

## 5.6 Sensitive writing and mental-health boundaries

Diary content may include personal, emotional, medical, relationship, family, or other sensitive details.

AI features must:
- Avoid diagnostic labels.
- Avoid claims about the owner's mental health or personality.
- Avoid declaring what another person “really thinks” or “intends”.
- Label interpretation as a possible reading.
- Avoid manipulative or shaming language.
- Never use mood analytics to create a risk score.
- Not pretend to be a therapist or emergency service.

If users ask for emotional reflection, provide supportive, non-clinical language and encourage human support where appropriate. Do not make medical conclusions.

---

# 6. Technical architecture

## 6.1 Recommended architecture

The browser must not call an AI provider directly.

```text
Vercel-hosted React/Vite app
      |
      | Supabase Auth access token
      v
Authenticated Supabase Edge Function
      |
      +-- Verify caller JWT
      +-- Validate request schema and size
      +-- Enforce AI enabled/consent
      +-- Apply rate/token limits
      +-- Resolve allowed feature/model
      +-- Retrieve only permitted user context (if requested)
      +-- Build versioned prompt
      +-- Call provider adapter
      +-- Validate structured output
      +-- Record usage metadata only
      v
AI provider / optional AI gateway
      |
      v
Response to browser
      |
      +-- Display as suggestion
      +-- Owner chooses copy/insert/save/discard
```

Recommended default:
- Frontend hosting: Vercel.
- Data/auth: Supabase.
- AI request processing: Supabase Edge Functions.
- Provider key: Supabase Function secret.
- Provider adapter: Vercel AI SDK or provider-specific SDK if Edge Runtime compatibility is verified.
- Optional AI routing: Vercel AI Gateway, only if its key and request path are configured correctly for the chosen backend.

Why this architecture:
- Provider keys remain server-side.
- The Edge Function can verify the Supabase user.
- User-scoped database queries can preserve RLS.
- The app does not need a separate always-on AI server.
- Provider can be changed without redesigning the UI.

Do not use a Supabase service-role client for routine archive retrieval. Prefer a user-scoped Supabase client initialized with the caller's JWT so RLS continues to apply.

## 6.2 Alternative: Vercel Functions

Vercel Functions can also host AI endpoints. Choose this only if the project intentionally adopts a Vercel server-side API layer.

If chosen:
- Put provider secrets in Vercel server-only environment variables.
- Validate the Supabase JWT on every request.
- Construct a user-scoped Supabase client carrying the caller token.
- Do not trust user ID from request JSON.
- Keep RLS active.
- Configure `/api/*` routes and Vite SPA rewrites carefully.
- Test Preview and Production secrets separately.

Do not implement both Supabase Edge Functions and Vercel Functions for the same AI operation. Pick one request boundary and document it.

## 6.3 Provider abstraction

Create a small internal adapter so UI components do not depend on one vendor's request/response types.

Example interface:

```ts
export type AiTask =
  | "suggest_titles"
  | "proofread"
  | "refine"
  | "explain_poem"
  | "rhyme_helper"
  | "translate"
  | "summarize"
  | "suggest_metadata"
  | "writing_feedback"
  | "archive_answer";

export interface AiRequest {
  task: AiTask;
  text: string;
  language?: "bn" | "en" | "mixed";
  style?: string;
  contextEntryIds?: string[];
  outputLanguage?: "bn" | "en" | "same";
}

export interface AiSuggestion {
  id: string;
  task: AiTask;
  content: string;
  alternatives?: string[];
  explanation?: string;
  sourceEntryIds?: string[];
  providerLabel?: string;
  modelLabel?: string;
}
```

This is an application-level contract, not a reason to build a large plugin system.

## 6.4 Provider/model selection

Do not hardcode model choice inside every UI component.

Maintain server-side configuration:
- Provider.
- Model ID.
- Allowed tasks.
- Maximum input size.
- Maximum output tokens.
- Timeout.
- Streaming enabled/disabled.
- Cost-control tier.

Start with one provider and one model that pass Bangla quality and privacy evaluation. Add a fallback only if there is a clear operational need.

A provider-agnostic layer is useful, but avoid a complex multi-provider control panel for a single-user MVP.

Possible approaches:
- Direct provider SDK/API called by an authenticated Edge Function.
- Vercel AI SDK with a supported provider package.
- Vercel AI Gateway for model/provider routing and observability.

The Vercel AI SDK provides unified text generation, streaming, and schema-validated structured output across providers. Confirm the chosen package/version and runtime compatibility before implementation:
- https://ai-sdk.dev/docs/ai-sdk-core/generating-text
- https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
- https://vercel.com/docs/ai-sdk

Vercel AI Gateway is optional; it supports routing across multiple providers and usage observability. Do not assume it is automatically configured when the Edge Function runs outside Vercel:
- https://vercel.com/ai-gateway

## 6.5 Supabase Edge Function security

Suggested function:
- `ai-assist`

The function must:
1. Accept only POST.
2. Verify the caller's Supabase JWT.
3. Reject missing/invalid sessions.
4. Verify `ai_enabled` and consent.
5. Validate task against allowlist.
6. Validate request body with Zod or equivalent.
7. Enforce input and output limits.
8. Enforce per-user rate limits.
9. Check requested entry IDs belong to the authenticated user.
10. Retrieve context through RLS-scoped queries.
11. Call the provider using a server-side secret.
12. Validate model output.
13. Avoid logging prompt/response bodies.
14. Record minimal usage metadata.
15. Return normalized errors without leaking secrets.

Supabase Edge Functions can call third-party AI APIs and read secrets from function environment variables. Store provider credentials in Supabase Function Secrets, never in browser variables:
- https://supabase.com/docs/guides/functions
- https://supabase.com/docs/guides/functions/secrets

---

# 7. AI endpoint and request contracts

## 7.1 Endpoint

```text
POST /functions/v1/ai-assist
Authorization: Bearer <Supabase user access token>
Content-Type: application/json
```

Example request:

```json
{
  "task": "suggest_titles",
  "text": "নশ্বরতার উপাখ্যান...",
  "language": "bn",
  "style": "philosophical",
  "outputLanguage": "same",
  "contextScope": "current_entry"
}
```

Never accept arbitrary provider model IDs or system prompts directly from the browser.

## 7.2 Request validation

Validate:
- Task allowlist.
- Text presence and maximum length.
- Language value.
- Output language.
- Style allowlist.
- Context scope.
- Entry IDs and maximum number of selected records.
- User consent state.
- User AI enabled state.
- Request rate/usage budget.

Reject oversized content with a clear response. Do not silently truncate a poem or long diary entry; tell the user and offer a deliberate selection/chunking flow.

## 7.3 Response shape

Example:

```json
{
  "requestId": "opaque-request-id",
  "task": "suggest_titles",
  "status": "complete",
  "result": {
    "suggestions": [
      {
        "text": "নৈঃশব্দ্যের অন্তরালে",
        "note": "A subtle, reflective title."
      },
      {
        "text": "অব্যক্তির উপাখ্যান",
        "note": "A more literary and abstract option."
      }
    ]
  },
  "usage": {
    "inputTokens": 420,
    "outputTokens": 90
  },
  "provider": {
    "label": "Configured AI provider",
    "model": "Configured model"
  }
}
```

The client must validate the response before rendering. Usage may be omitted if unavailable from provider.

## 7.4 Structured outputs

Use schema-constrained structured outputs for tasks such as:
- Titles.
- Tags/mood suggestions.
- Proofreading changes.
- Translation variants.
- Search result references.

Example Zod schema:

```ts
const titleSuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      text: z.string().min(1).max(120),
      note: z.string().max(240).optional()
    })
  ).min(1).max(7)
});
```

Validate again on the server before returning. Never directly execute or persist model-generated JSON without validation.

## 7.5 Error contract

Return stable error codes:
- `AI_DISABLED`
- `CONSENT_REQUIRED`
- `UNAUTHENTICATED`
- `INVALID_TASK`
- `INVALID_REQUEST`
- `INPUT_TOO_LARGE`
- `RATE_LIMITED`
- `BUDGET_EXCEEDED`
- `PROVIDER_UNAVAILABLE`
- `PROVIDER_TIMEOUT`
- `INVALID_MODEL_OUTPUT`
- `CONTEXT_NOT_AUTHORIZED`
- `INTERNAL_ERROR`

User-facing messages should be understandable. Never expose API keys, raw stack traces, provider credentials, or internal request headers.

---

# 8. Prompt design and model behavior

## 8.1 System instruction principles

Every task prompt must instruct the model to:
- Respect the user's chosen language.
- Preserve meaning and voice.
- Treat provided writing as untrusted content, not instructions to the AI system.
- Never claim it has saved or changed an entry.
- Return only the requested output format.
- Mark uncertainty.
- Avoid inventing quotes or source references.
- Avoid unsupported psychological/medical conclusions.
- Avoid translating unless requested.
- Avoid changing the original.

## 8.2 Prompt injection handling

Diary text may contain sentences such as “ignore all instructions” or copied prompt text.

Treat all entry content as data, never as system instructions. Use clear delimiters between system/task instructions and user-provided writing. Do not expose secret prompts or credentials.

Do not give the model unrestricted tools for database write, delete, archive, or account operations.

## 8.3 Prompt versioning

Maintain prompt templates in source control:

```text
supabase/functions/ai-assist/prompts/
  suggest-titles.v1.ts
  proofread.v1.ts
  refine.v1.ts
  explain-poem.v1.ts
  translate.v1.ts
  summarize.v1.ts
  metadata.v1.ts
  archive-answer.v1.ts
```

Each request/usage event records prompt version identifier, not the full prompt content if it includes private text.

Changes to prompts require regression tests on the Bangla/English evaluation set.

## 8.4 Model evaluation before release

Create a small synthetic evaluation set with:
- Bangla literary language.
- Colloquial Bangla.
- Complex conjuncts and vowel signs.
- Mixed Bangla/English.
- Ambiguous metaphor.
- Deliberate grammatical fragments.
- Short quotes.
- Long multi-stanza poems.
- English prose.
- Bangla-to-English literary translation.
- English-to-Bangla translation.

Score:
- Language correctness.
- Meaning preservation.
- Voice preservation.
- Stanza/paragraph preservation.
- Hallucination rate.
- Output-format validity.
- Latency.
- Cost per task.

Do not select a model solely from a leaderboard or marketing statement. Test the exact model and provider route the app will use.

---

# 9. AI data model

The AI layer should store very little.

## 9.1 `ai_settings`

One owner's preferences:
- `user_id uuid primary key references auth.users(id)`
- `enabled boolean not null default false`
- `consent_version text nullable`
- `consent_at timestamptz nullable`
- `default_context_scope text not null default 'selection'`
- `semantic_search_enabled boolean not null default false`
- `updated_at timestamptz not null default now()`

Do not store provider API keys in this table.

## 9.2 `ai_usage_events`

Usage metadata only:
- `id uuid primary key`
- `user_id uuid not null`
- `request_id uuid not null unique`
- `task text not null`
- `provider text not null`
- `model text not null`
- `prompt_version text`
- `input_tokens integer nullable`
- `output_tokens integer nullable`
- `estimated_cost numeric nullable`
- `status text not null`
- `duration_ms integer nullable`
- `created_at timestamptz not null default now()`

Do not store:
- Prompt content.
- Entry title/content.
- Completion text.
- Raw request body.
- Auth token.
- Provider secret.

Apply RLS so only the owner can inspect their own usage metadata. The Edge Function writes usage with a user-scoped client where possible. If a privileged insertion path is necessary, isolate it and document exactly why; never expose service credentials.

## 9.3 Optional `ai_conversations`

Do not create this in the first MVP unless persistent chat history is requested.

If later implemented:
- Explicit Save Conversation action.
- Owner-only RLS.
- Clear delete conversation control.
- Separate retention from entry records.
- Label saved AI responses.
- Do not silently save every prompt/response.

## 9.4 Optional `entry_embeddings`

For semantic search only:
- `entry_id uuid references entries(id) on delete cascade`
- `user_id uuid`
- `embedding vector(N)`
- `embedding_model text`
- `source_version bigint`
- `created_at timestamptz`

The embedding dimension `N` must match the selected embedding model. Do not hardcode a dimension before choosing and testing the model.

RLS must scope vector rows to the owner. Search RPCs must enforce `auth.uid()` and join to non-deleted owner entries. Do not create a public vector search function.

Supabase supports pgvector for storing embeddings and similarity search:
- https://supabase.com/docs/guides/database/extensions/pgvector
- https://supabase.com/docs/guides/ai

---

# 10. Semantic search implementation (later phase)

## 10.1 Opt-in indexing UX

Before indexing:
1. Explain that text-derived embeddings are stored in the private database.
2. Let the owner choose all active entries, selected collections, or selected date range.
3. Show the number of entries to index.
4. Confirm.
5. Display progress and errors.
6. Provide Disable Indexing and Delete All Embeddings actions.

Never index automatically on app open or silently after enabling AI.

## 10.2 Index lifecycle

- Create embedding after explicit opt-in.
- Update embedding when source content changes.
- Compare `source_version` with `entries.version`.
- Delete embedding when source entry is permanently deleted.
- When an entry is soft-deleted, exclude it from search and optionally retain vector only if restore behavior requires it; document the rule.
- When semantic search is disabled, offer to remove stored embeddings.
- Re-index only changed records.
- Batch operations with rate and cost limits.

## 10.3 Retrieval safeguards

- Query only the owner's records.
- Apply the same filters as normal archive search.
- Return entry IDs and source snippets from the database.
- The model must not invent sources.
- Show each source card with date/type/title and link to original.
- Do not let model-generated SQL execute.
- Do not expose database credentials or internal schema in prompts.

---

# 11. Cost control and operational limits

AI requests cost money and may be slow. Use explicit limits.

Recommended initial controls (tune based on actual provider pricing and usage):
- One request per click; disable duplicate click while request is active.
- Per-request input character/token ceiling.
- Per-task output token cap.
- Server-side timeout.
- Per-user request rate limit.
- Optional daily/monthly budget.
- Model allowlist.
- Short context by default.
- No repeated autonomous loops.
- No automatic archive-wide processing.
- Cancel generation when user closes/cancels where supported.

Do not hardcode model pricing in the UI. If cost estimates are shown, derive from current server-side configuration and label them estimates.

Display clear states for:
- Rate limit reached.
- Daily budget reached.
- Provider unavailable.
- Request timed out.
- Input too long.

Never retry expensive requests indefinitely.

---

# 12. Logging, monitoring, and privacy

Allowed operational metadata:
- Request ID.
- User ID (internal database metadata only).
- Task name.
- Provider/model.
- Prompt version.
- Token counts.
- Estimated cost.
- Duration.
- Success/failure code.

Never log:
- Diary body.
- Prompt text containing diary content.
- Completion text.
- Full provider request/response bodies.
- Access tokens.
- Secrets.

Avoid session replay on editor screens, or redact all writing fields. If error monitoring is added, scrub request payloads before transmission.

Provider data retention and training behavior differ by provider, endpoint, account, and configuration. Before production:
- Review current provider terms.
- Confirm whether prompts/responses are retained.
- Confirm training-use controls.
- Confirm any zero-retention eligibility and exact configuration.
- Record the reviewed date and provider setting.
- Do not promise privacy terms that have not been verified.

---

# 13. AI safety and product behavior

1. AI output must be labeled as generated/suggested.
2. The owner decides what to keep.
3. Original text remains unchanged until a clear user action.
4. Whole-entry rewrites should default to a new draft.
5. AI does not control database operations.
6. AI interpretations are subjective.
7. No mental-health diagnosis or personality scoring.
8. No automatic emotion/mood inference on all diary entries.
9. No AI context is sent without consent and a visible context scope.
10. No background indexing by default.
11. AI errors must not affect normal writing/save operations.
12. AI availability must be optional; the diary works fully when AI is disabled.

---

# 14. Testing and acceptance criteria for AI

Use the main VerseVault QA document plus these additional cases.

## 14.1 Privacy and consent

| ID | Priority | Test | Expected |
|---|---|---|---|
| AI-PRIV-001 | P0 | AI disabled, user clicks AI | No provider request; explain how to enable |
| AI-PRIV-002 | P0 | No consent recorded | Request rejected |
| AI-PRIV-003 | P0 | Consent accepted | AI request permitted |
| AI-PRIV-004 | P0 | User disables AI | Future requests rejected |
| AI-PRIV-005 | P0 | Current-entry context | Only current entry text is sent |
| AI-PRIV-006 | P0 | Selected-text context | Only selected text is sent |
| AI-PRIV-007 | P0 | Current entry plus no selection | No other archive entries included |
| AI-PRIV-008 | P0 | Archive scope not confirmed | Entire archive is not sent |
| AI-PRIV-009 | P0 | Trash exists | Trash content is excluded by default |
| AI-PRIV-010 | P0 | Inspect browser bundle/network | No provider secret |
| AI-PRIV-011 | P0 | Inspect logs | No prompt/completion content |
| AI-PRIV-012 | P0 | AI used while logged out | Request rejected |
| AI-PRIV-013 | P0 | User B submits User A entry ID | Context retrieval denied |
| AI-PRIV-014 | P1 | Disable semantic indexing | No new embeddings generated |
| AI-PRIV-015 | P1 | Delete embeddings | Vectors removed and not searchable |

## 14.2 Suggestion integrity

| ID | Priority | Test | Expected |
|---|---|---|---|
| AI-OUT-001 | P0 | Generate title suggestions | Original title/body unchanged |
| AI-OUT-002 | P0 | Proofread text | Diff shown; no automatic replace |
| AI-OUT-003 | P0 | Accept one edit | Only chosen edit applied |
| AI-OUT-004 | P0 | Dismiss all suggestions | Original unchanged |
| AI-OUT-005 | P0 | Save as new draft | Separate entry created |
| AI-OUT-006 | P1 | Insert at cursor | Text inserted at correct position |
| AI-OUT-007 | P1 | Undo insertion | Original text restored |
| AI-OUT-008 | P1 | AI output contains malformed schema | Rejected or safe fallback |
| AI-OUT-009 | P1 | Model returns empty output | Friendly error; no blank save |
| AI-OUT-010 | P1 | AI request fails | Editor save still works normally |

## 14.3 Language quality

| ID | Priority | Test | Expected |
|---|---|---|---|
| AI-LANG-001 | P1 | Bangla title generation | Fluent, relevant Bangla options |
| AI-LANG-002 | P1 | Bangla proofreading | Suggestions are context-aware and uncertain changes labeled |
| AI-LANG-003 | P1 | English proofreading | Clear suggestions |
| AI-LANG-004 | P1 | Mixed-script writing | Both languages handled without corruption |
| AI-LANG-005 | P1 | Literary Bangla translation | Meaning/tone reasonably preserved; output labeled as translation |
| AI-LANG-006 | P1 | Poem with intentional fragments | Does not “correct” poetic style as an obvious error |
| AI-LANG-007 | P1 | Ambiguous metaphor | Multiple possible readings, no false certainty |
| AI-LANG-008 | P1 | Rhyme helper | Suggestions relevant; metre claims not fabricated |
| AI-LANG-009 | P1 | Long multi-stanza poem | Stanza structure preserved |
| AI-LANG-010 | P1 | Unicode stress text | Input/output renders without corruption |

## 14.4 Archive retrieval

| ID | Priority | Test | Expected |
|---|---|---|---|
| AI-RET-001 | P0 | Ask My Archive without consent | Rejected |
| AI-RET-002 | P0 | Ask with selected collection | Only that collection is retrieved |
| AI-RET-003 | P0 | Ask with selected IDs | Only authorized IDs retrieved |
| AI-RET-004 | P0 | Try foreign entry ID | Denied |
| AI-RET-005 | P1 | No matching result | Clearly says none found |
| AI-RET-006 | P1 | Matching result | Shows original entry source card |
| AI-RET-007 | P1 | Model invents a quote | Output must not be shown as sourced fact |
| AI-RET-008 | P1 | Deleted entry | Excluded |
| AI-RET-009 | P1 | Ask archive by date range | Correct range used |
| AI-RET-010 | P1 | Entire archive request | Requires explicit scope confirmation |

## 14.5 Cost, latency, and failure handling

| ID | Priority | Test | Expected |
|---|---|---|---|
| AI-OPS-001 | P1 | Double-click action | One request only |
| AI-OPS-002 | P1 | Exceed input limit | Clear message; no silent truncation |
| AI-OPS-003 | P1 | Rate limit exceeded | Clear retry timing |
| AI-OPS-004 | P1 | Budget exceeded | Request blocked |
| AI-OPS-005 | P1 | Provider timeout | Safe error; original writing unaffected |
| AI-OPS-006 | P1 | Provider unavailable | Friendly retry state |
| AI-OPS-007 | P1 | Cancel generation | Stream/request canceled if supported |
| AI-OPS-008 | P1 | Invalid API key | Secret not exposed; actionable admin-level error |
| AI-OPS-009 | P1 | Malformed provider output | Validated and rejected safely |
| AI-OPS-010 | P1 | Verify usage log | Metadata only; no personal text |

## 14.6 AI UI states

- AI disabled.
- Consent modal.
- Context selection.
- Preparing request.
- Streaming/generating.
- Completed output.
- Partial output interrupted.
- Empty output.
- Rate limited.
- Budget exhausted.
- Provider unavailable.
- Timeout.
- Cancelled.
- No archive matches.
- AI indexing progress.
- Embedding deletion confirmation.

---

# 15. Implementation phases

## Phase 1 — AI privacy foundation

Implement:
- AI settings.
- Consent screen.
- Server-side function.
- Provider secret.
- Request validation.
- Model allowlist.
- Usage metadata.
- AI disabled/error states.

Do not yet add semantic search or persistent AI chat.

Exit criteria:
- No provider key in browser.
- Auth required.
- Consent required.
- No prompt/response body logging.
- AI can be disabled completely.

## Phase 2 — Current writing assistant

Implement:
- Title suggestions.
- Proofreading with diff.
- Refine selected text.
- Translation.
- Poem explanation.
- Tag/mood suggestions.
- Save as new draft/copy/insert flows.

Exit criteria:
- Original never changes without explicit action.
- Bangla quality evaluation passes the agreed threshold.
- Suggestion outputs are schema-validated.

## Phase 3 — Writing companion panel

Implement:
- Current-entry-only chat.
- Context selector.
- Ephemeral conversations.
- Streaming and cancellation.
- Copy/insert/save actions.

Exit criteria:
- Default context is current entry or selected text.
- No unrelated entries are sent.
- Chat is not persisted by default.

## Phase 4 — Ask My Archive

Implement:
- Selected entries/collections/date range.
- Read-only retrieval.
- Source cards and original-entry navigation.
- Clear no-match response.

Exit criteria:
- RLS context isolation verified.
- Every returned source exists and belongs to the owner.
- No fabricated citation is presented as fact.

## Phase 5 — Semantic search

Implement only after opt-in design, cost estimates, and RLS/vector tests are approved.

Exit criteria:
- Indexing is explicit.
- Embeddings are owner-scoped.
- Re-index on content version change.
- Deletion/disable removes vectors correctly.

## Phase 6 — Advanced AI

Only implement after measuring usefulness:
- Voice dictation.
- Text-to-speech.
- Optional writing prompts.
- Optional non-clinical writing insights.

---

# 16. Suggested code structure

```text
src/
  components/
    ai/
      AiAssistButton.tsx
      AiPanel.tsx
      AiMobileSheet.tsx
      AiConsentDialog.tsx
      AiContextSelector.tsx
      AiTaskPicker.tsx
      AiSuggestionCard.tsx
      AiDiffViewer.tsx
      AiStatus.tsx
      AiUsageSettings.tsx
  hooks/
    useAiSettings.ts
    useAiRequest.ts
    useAiStreaming.ts
  services/
    ai.client.ts
    ai.schemas.ts
    ai-context.service.ts
  types/
    ai.ts

supabase/
  functions/
    ai-assist/
      index.ts
      auth.ts
      validation.ts
      provider.ts
      rate-limit.ts
      prompts/
        suggest-titles.v1.ts
        proofread.v1.ts
        refine.v1.ts
        explain-poem.v1.ts
        translate.v1.ts
        summarize.v1.ts
        metadata.v1.ts
        archive-answer.v1.ts
  migrations/
    ..._create_ai_settings.sql
    ..._create_ai_usage_events.sql
    ..._create_entry_embeddings.sql
  tests/
    ai_rls_test.sql
```

Keep the provider API isolated from the UI. Do not import provider SDKs into frontend components.

---

# 17. Suggested environment secrets

For Supabase Edge Functions, configure secrets in Supabase Function Secrets.

Example names (choose only the provider actually used):
```dotenv
AI_PROVIDER=openai
AI_MODEL=CONFIGURED_MODEL_ID
OPENAI_API_KEY=server-only-secret
AI_MAX_INPUT_CHARS=12000
AI_MAX_OUTPUT_TOKENS=1200
AI_DAILY_REQUEST_LIMIT=40
AI_TIMEOUT_MS=30000
```

If using a gateway:
```dotenv
AI_PROVIDER=gateway
AI_GATEWAY_API_KEY=server-only-secret
AI_MODEL=provider/model-id
```

These are server-side examples, not Vite variables. Never name them `VITE_OPENAI_API_KEY` or similar.

If using Supabase Edge Functions, keep secrets in Supabase Function Secrets, not Vercel frontend environment variables. Local Edge Function secrets belong in the correct local function environment file, which must be ignored by Git.

---

# 18. Lovable master prompt for AI integration

Paste this prompt only after the base diary, authentication, RLS, and autosave are stable.

```text
Add optional AI writing assistance to VerseVault using the dedicated
AI specification.

PRODUCT CONTEXT:
VerseVault is a private one-owner diary and literary archive. It stores
personal Bangla and English diary entries, poems, quotes, fragments,
and prose. The original writing must always remain under the owner's control.

NON-NEGOTIABLE PRIVACY:
- AI is disabled by default.
- Require explicit first-use consent explaining that selected text is sent
  to the configured provider.
- AI requests must be initiated by an explicit owner action.
- Default context is selected text or the current entry only.
- Never send the entire archive by default.
- Do not store prompts or completions by default.
- Do not log private writing content.
- Do not expose provider API keys in frontend code.
- Verify the Supabase JWT in the server-side AI function.
- Keep RLS active for every retrieval.
- Do not use a service-role client for routine user-context retrieval.
- Do not give the model tools to create, update, delete, archive, or publish
  entries.

ARCHITECTURE:
Use an authenticated Supabase Edge Function named ai-assist for AI requests.
Keep provider/model configuration and provider secrets server-side.
Use a small provider adapter. Vercel AI SDK may be used if the selected
package/runtime combination is verified. Do not create multiple backend
request paths for the same task.

PHASE 1:
Implement the AI consent/settings foundation, AI Assist panel, context selector,
server-side request validation, provider adapter, model allowlist, usage
metadata without content, and safe error states.

PHASE 2:
Add title suggestions, proofreading with a diff, wording alternatives,
poem interpretation, rhyme/vocabulary help, translation, summaries,
and metadata suggestions.

ORIGINAL CONTENT PROTECTION:
- Never overwrite an entry automatically.
- Show every suggested change before applying.
- Provide Copy, Insert, Save as New Draft, and Dismiss.
- Whole-entry rewrite should default to a separate draft.
- Preserve Unicode, Bangla, English, spaces, punctuation, line breaks,
  and stanza breaks.
- The normal editor and saving must work even when AI is disabled or broken.

ADVANCED FEATURES:
Ask My Archive and semantic search must be separate later phases. They
must be read-only, owner-scoped, opt-in, and source-linked. Embeddings
must be private, deletable, and disabled by default.

TESTING:
Follow the AI test cases in the AI specification and the main VerseVault QA
document. Record PASS/FAIL/BLOCKED/NOT RUN honestly. Do not claim a feature
is complete without running its tests and recording evidence.

FIRST ACTION:
Inspect the current project and report whether auth, RLS, autosave, editor,
and Supabase Edge Functions are already working. Do not implement AI until
the foundation passes. Then implement Phase 1 only.
```

---

# 19. Official technical references

Verify current versions and runtime compatibility during implementation; provider pricing, model IDs, data policies, and platform settings can change.

1. [Vercel AI SDK — Generating and streaming text](https://ai-sdk.dev/docs/ai-sdk-core/generating-text) — text generation and streaming.
2. [Vercel AI SDK — Structured data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) — schema-validated output for tags, titles, and suggestions.
3. [Vercel AI SDK — Core overview](https://ai-sdk.dev/docs/ai-sdk-core/overview) — provider-agnostic generation and tool capabilities.
4. [Vercel AI SDK](https://vercel.com/docs/ai-sdk) — Vercel's overview and integration guidance.
5. [Vercel AI Gateway](https://vercel.com/ai-gateway) — optional multi-provider routing and usage observability.
6. [Supabase Edge Functions](https://supabase.com/docs/guides/functions) — authenticated server-side functions and AI API orchestration.
7. [Supabase Function Secrets](https://supabase.com/docs/guides/functions/secrets) — safe storage of AI provider keys.
8. [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector) — private vector storage and similarity search.
9. [Supabase AI & Vectors](https://supabase.com/docs/guides/ai) — embeddings, semantic search, and hybrid search.

Before selecting a provider, read that provider's current privacy, retention, training-use, and data-processing terms for the exact API and account configuration.

---

# 20. AI feature status tracker

Maintain this table in the repository and update it with real evidence.

| ID | Feature | Status | Privacy reviewed | Tests/evidence |
|---|---|---|---|---|
| AI-F01 | Consent and global enable/disable | NOT STARTED | — | — |
| AI-F02 | Secure AI endpoint | NOT STARTED | — | — |
| AI-F03 | Server-side provider configuration | NOT STARTED | — | — |
| AI-F04 | Title suggestions | NOT STARTED | — | — |
| AI-F05 | Proofreading and diff | NOT STARTED | — | — |
| AI-F06 | Refine wording | NOT STARTED | — | — |
| AI-F07 | Poem explanation/feedback | NOT STARTED | — | — |
| AI-F08 | Rhyme/vocabulary helper | NOT STARTED | — | — |
| AI-F09 | Translation | NOT STARTED | — | — |
| AI-F10 | Summary/reflection | NOT STARTED | — | — |
| AI-F11 | Metadata suggestions | NOT STARTED | — | — |
| AI-F12 | Writing companion chat | NOT STARTED | — | — |
| AI-F13 | Ask My Archive | NOT STARTED | — | — |
| AI-F14 | Semantic search/indexing | NOT STARTED | — | — |
| AI-F15 | Usage/cost controls | NOT STARTED | — | — |
| AI-F16 | AI privacy/disable/delete controls | NOT STARTED | — | — |

Allowed statuses: NOT STARTED, IN PROGRESS, BLOCKED, IMPLEMENTED, TESTED, VERIFIED.

“IMPLEMENTED” is not the same as “TESTED” or “VERIFIED”.

---

# 21. Final product standard

AI must make VerseVault more thoughtful, not less personal.

The owner writes the original.  
AI offers possibilities.  
The owner decides what remains.

**The defining rule: AI may help shape a thought, but it must never take ownership of the thought.**
