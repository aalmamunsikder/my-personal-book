# VerseVault — Product, Features, Implementation, UX & Vercel Deployment Guide
## The build blueprint for a private, single-owner digital diary

**Product name:** VerseVault (working name)  
**Product type:** Private personal diary and literary archive  
**Owner model:** One owner account only  
**Frontend:** Lovable-generated React + TypeScript + Vite  
**Backend:** Supabase Auth + Postgres  
**Hosting:** Vercel  
**Primary languages:** Bangla and English  
**Design direction:** Warm, paper-inspired, literary journal  
**Companion documents:** `VerseVault_Personal_Diary_Lovable_Spec.md` and `VerseVault_QA_Testing_and_Release_Checklist.md`

> **Purpose of this guide:** Define exactly what the product should do, how its UI should behave, how the application should be architected and implemented, which engineering practices must be followed, and how to deploy it safely to Vercel. Use this as the implementation blueprint and the source of truth for technical decisions.

---

# 1. Product definition

VerseVault is a private digital diary that feels like opening a beautifully designed physical journal.

The owner uses it to preserve:
- Daily diary entries.
- Poems and long-form literary writing.
- Quotes and aphorisms.
- Fragments and unfinished thoughts.
- Reflective prose.
- Memories and personal observations.

The application is not a public writing platform, social network, SaaS product, or multi-user workspace.

## 1.1 Product promise

**A quiet place for everything you couldn't say aloud.**

The owner must be able to open the app, write immediately, trust that the content has been saved exactly as written, and find it again months or years later.

## 1.2 Product principles

1. **Private by default:** there are no public pages, publishing controls, or share links.
2. **Writing comes first:** metadata and navigation never compete with the writing canvas.
3. **Diary-like experience:** the UI should feel intimate, tactile, calm, and literary.
4. **Content fidelity:** preserve text, Unicode, spaces, punctuation, line breaks, and stanza breaks.
5. **Reliability:** autosave must be transparent and recoverable.
6. **Bangla is first-class:** Bangla must not feel like a secondary language.
7. **Portable archive:** the owner can export their writings without being locked into the app.
8. **One owner, not a SaaS:** no multi-user features or unnecessary infrastructure.

## 1.3 Explicit non-goals

Do not implement:
- Public user registration.
- Public author profiles or published writing pages.
- Social sharing, comments, likes, followers, or reactions.
- Collaborative editing.
- Multi-tenant workspaces or user management.
- Payments, subscriptions, or billing.
- AI-generated, translated, summarized, or rewritten writing.
- Public collection links.
- A marketing site or SaaS admin dashboard.

---

# 2. Feature catalogue and functional requirements

The following is the complete intended feature set. Build in phases, but do not silently omit a feature. If something is intentionally deferred, record it in the implementation status report.

## 2.1 My Journal — home

**Purpose:** A personal opening page that makes it easy to resume writing.

Features:
- Show today's date using the user's local timezone.
- A calm greeting.
- A large writing prompt: “What is on your mind today?”
- Primary action: **Write today's entry**.
- Continue Writing section for drafts.
- Recently Written timeline.
- Small monthly calendar preview.
- Return to a Memory section showing a real older entry.
- Small, understated archive totals if useful.
- First-use empty state with a create-first-entry action.

Behavior:
- Write Today's Entry creates a Diary draft with today's local date.
- Continue Writing opens the exact selected draft.
- Recent item opens its reading view or editor according to status.
- Return to a Memory excludes deleted items.
- No fake sample records after launch.

## 2.2 Daily Entries — diary timeline

Features:
- Chronological timeline grouped by month/date.
- Date, title, excerpt, optional mood, favorite marker.
- Search within diary entries.
- Filter by year, month, mood, collection, and tag.
- Newest/oldest sorting.
- Multiple entries on the same date.
- Support backdated entries.
- Pagination/incremental loading.

Behavior:
- Use `entry_date` for diary chronology.
- Use `created_at` only for creation metadata.
- Backdating must never alter the actual creation timestamp.
- Entries with missing titles show a calm “Untitled entry” label.

## 2.3 Entry editor

This is the most important feature.

Common editor features:
- Optional title.
- Plain-text-first writing canvas.
- Type selector.
- Date selector for diary entries.
- Mood, collection, tags, favorite, font preference.
- Word and character count.
- Distraction-free mode.
- Visible save state: Saving, Saved, Failed, Offline/Unsaved.
- Retry after failure.
- Keyboard shortcut `Ctrl/Cmd + S`.
- Preserve all text exactly.

Types:
- Diary
- Poem
- Quote
- Fragment
- Prose

Type-specific behavior:
- **Diary:** date-first, mood optional, long-form body.
- **Poem:** narrower writing measure, preserves every line and stanza.
- **Quote:** focused short text, optional attribution/source.
- **Fragment:** fastest capture; title and metadata optional.
- **Prose:** wide reading/editor option for longer paragraphs.

Do not require metadata before the user can write.

### Editor behavior rules

- Create one database record per entry, not one record per autosave.
- Keep current text in local editor state.
- Debounce server saves by approximately 900–1200ms after typing pauses.
- Save on blur and before navigation when possible.
- Only show Saved after Supabase acknowledges the update.
- Keep local text when a request fails.
- Prevent older save responses from overwriting newer edits.
- Detect stale concurrent updates using a version value.
- Never trim or normalize the body text.
- Do not auto-correct or reformat line breaks.

## 2.4 Reading view

Features:
- Book/page-like presentation.
- Date and type metadata.
- Title.
- Original text with exact line and stanza breaks.
- Optional mood, collection, and tags.
- Previous/next navigation within the current list.
- Edit, Favorite, Copy, Archive, Delete.

Rules:
- Narrow comfortable reading width.
- Generous line-height, especially for Bangla.
- No technical IDs or database metadata.
- Copy must place original plain text on the clipboard.
- Do not insert typographic decoration into the copied content.

## 2.5 Poems, Quotes, Fragments, and Prose libraries

Each type gets a dedicated filtered library.

Features:
- Search.
- Sort by recently updated, newest, oldest, title.
- List or grid presentation when useful.
- Favorite toggle.
- Excerpt preview.
- Empty states.
- Quick create action for the selected type.

Avoid showing the full text of a long poem inside a cramped card.

## 2.6 Collections

Collections are thematic notebooks.

Example names:
- নৈঃশব্দ্যের দিনলিপি
- জীবনের খেরোখাতা
- Unsent Words
- Family
- Love & Distance
- Existential Notes
- Fragments of Thought
- Memories

Features:
- Create, rename, describe, reorder, delete.
- Optional muted accent/icon.
- Collection detail page.
- Add/remove writings.
- Delete collection without deleting its writing.

The MVP UI may let an entry belong to one main collection, but the data model can use a join table to permit future multiple collections.

## 2.7 Tags

Features:
- Create tags inline or in tag management.
- Autocomplete existing tags.
- Attach/remove tags.
- Filter/search by tag.
- Delete tag without deleting writing.
- Prevent duplicate tags according to a documented normalization rule.

Never normalize or mutate the actual writing content to normalize tags.

## 2.8 Calendar and memory browsing

Features:
- Month/year navigation.
- Mark dates containing entries.
- Select a date to view its entries.
- Create an entry for a date with no entry.
- Multiple entries per date.
- Leap-year handling.
- Backdated writing.
- Today highlight.
- Mobile calendar with selected-day list below.

## 2.9 Search and filters

Search fields:
- Title.
- Content.
- Tags.
- Collection name.
- Quote attribution.

Filters:
- Type.
- Date range.
- Mood.
- Collection.
- Tag.
- Favorite.
- Status.
- Active/archived.

Rules:
- Bangla and English support.
- Debounce approximately 250–350ms.
- Search only the owner's records.
- Use safe parameterized database queries.
- PostgreSQL `ILIKE`/substring search is a dependable MVP fallback for Bangla; do not assume English stemming works for Bangla.
- Do not change stored text during search.
- Trash is excluded from normal archive search.

## 2.10 Favorites

- Toggle from list, editor, and reading view.
- Dedicated Favorites screen.
- State persists.
- Unfavoriting removes the entry from Favorites, not from the archive.

## 2.11 Archive and Trash

Archive:
- Set status to archived.
- Remove from active views.
- Restore to active view.

Trash:
- Soft-delete via `deleted_at`.
- Restore.
- Permanent deletion requires clear confirmation.
- Do not auto-purge in the MVP.
- Permanent delete must remove relevant join rows.
- Delete actions must identify the exact target.

## 2.12 Statistics and writing history

Optional but included in the planned feature set:
- Total entries.
- Count by type.
- Draft/complete counts.
- Activity by month.
- Date-range selector.
- Optional writing streak only if accurate and not guilt-inducing.

Statistics must be derived from real data and clearly define whether archived/trash items are included. Do not create fake metrics.

## 2.13 Settings and personalization

Appearance:
- Light, Dark, System.
- Reading width: Standard/Wide.
- UI density: Comfortable/Compact.

Writing:
- Default entry type.
- Default font preference.
- Show/hide word count.
- Default autosave behavior.
- Distraction-free preference.

Profile:
- Optional display name.
- Account email shown only where necessary.

## 2.14 Backup and export

Required:
- Markdown ZIP export.
- JSON backup export.
- Export selected collection.
- Include/exclude Trash.
- UTF-8 writing preservation.
- Export schema version and timestamp.
- Export README with folder structure.

The export warning must explain that the files may contain private personal writing.

---

# 3. UI/UX design system

## 3.1 Design concept — The Private Journal

The application should combine:
- The familiarity of a personal diary.
- The typography of a literary journal.
- The clarity of a modern writing application.

The “diary” feeling should come from warm paper surfaces, calm typography, thoughtful spacing, page-like reading, and subtle details—not heavy leather skeuomorphism.

Avoid:
- Generic SaaS dashboard layouts.
- Large KPI cards dominating the home screen.
- Excessive gradients and glassmorphism.
- Neon/bright blue accents.
- Too many borders and pills.
- Decorative illustrations that overpower text.
- Unnecessary animations.

## 3.2 Palette

Centralize colors in CSS variables.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F5F1E8` | App background |
| `--page` | `#FFFCF5` | Journal page/editor |
| `--page-muted` | `#EEE8DC` | Secondary surface |
| `--ink` | `#292820` | Primary text |
| `--ink-soft` | `#777264` | Metadata |
| `--line` | `#E4DCCF` | Rules/dividers |
| `--accent` | `#795548` | Walnut/brown |
| `--accent-soft` | `#E9DDD1` | Soft accent surface |
| `--olive` | `#74785A` | Optional muted secondary accent |
| `--danger` | `#A64E45` | Destructive actions |

Dark theme:
- Warm charcoal background.
- Slightly lighter charcoal writing surface.
- Warm off-white text.
- Muted brown/olive accents.
- No pure-black/white contrast.

## 3.3 Typography

- Bangla: Hind Siliguri.
- UI: Inter.
- English literary reading: Literata or Lora.
- Optional handwritten accent: decorative use only, never for long content.

Use local/self-hosted fonts where licensing permits, or a controlled font provider. Ensure the fallback stack supports Bangla glyphs. Test actual rendering on the devices/browser matrix.

Suggested CSS:

```css
:root {
  --font-ui: "Inter", sans-serif;
  --font-bangla: "Hind Siliguri", sans-serif;
  --font-literary: "Literata", Georgia, serif;
}

body {
  font-family: var(--font-ui);
  background: var(--paper);
  color: var(--ink);
}

[lang="bn"],
.font-bangla {
  font-family: var(--font-bangla);
}

.journal-content {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.95;
}

.journal-content[data-script="bn"] {
  font-family: var(--font-bangla);
}

.journal-content[data-script="en"] {
  font-family: var(--font-literary);
}
```

## 3.4 Layout

Desktop:
- Sidebar: approximately 220–240px.
- Flexible central journal canvas.
- Optional right context panel.
- Main writing area max width around 900px.
- Reading column around 640–760px.
- No fixed three-column layout on small laptop screens.

Mobile:
- Compact top bar and mobile navigation/drawer.
- Single-column content.
- Optional details in bottom sheet/secondary panel.
- Keyboard-aware editor.
- Touch targets around 44×44 CSS px or larger.
- No horizontal scrolling.

## 3.5 Screen-specific UX rules

| Screen | UX direction |
|---|---|
| My Journal | Opening page of a personal journal; today's prompt and recent timeline |
| Timeline | Editorial date-grouped entries, not generic dashboard cards |
| Editor | Large paper-like writing canvas; metadata secondary |
| Reading view | Book-like narrow column with preserved stanzas |
| Poems | Literary archive with generous preview space |
| Quotes | Focused quote cards/list with optional attribution |
| Fragments | Minimal rapid-capture layout |
| Collections | Thematic notebooks with muted cover treatments |
| Calendar | Quiet monthly calendar with selected-day entry list |
| Search | Fast and functional; filters remain secondary |
| Favorites | Curated personal reading list |
| Archive/Trash | Clear separation; destructive actions visually distinct |
| Settings | Calm grouped preferences, not a huge form |
| Backup | Clear export choices and privacy warning |

## 3.6 UX state standards

Every data-backed screen needs:
- Loading state.
- First-use empty state.
- Filtered-empty/no-results state.
- Error state with retry where appropriate.
- Offline/unsaved state when editing.
- Destructive confirmation where needed.
- Success feedback after confirmed operations.

Never render an empty list when the request actually failed. Distinguish “no entries” from “could not load entries.”

## 3.7 Accessibility

- Semantic HTML and heading hierarchy.
- Visible keyboard focus.
- Proper input labels.
- Accessible names for icon-only buttons.
- Dialog focus management.
- Keyboard-operable calendar.
- Sufficient contrast.
- Reduced-motion support.
- Status changes announced appropriately.
- Do not use color alone to communicate state.

---

# 4. Recommended architecture

## 4.1 Stack

| Layer | Recommendation |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS + customized shadcn/ui |
| Icons | Lucide |
| Routing | React Router |
| Backend | Supabase |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Data access | `@supabase/supabase-js` behind service modules |
| Server-state cache | TanStack Query (recommended) or a consistent existing query layer |
| Validation | Zod |
| Forms | React Hook Form where forms justify it |
| Unit/component tests | Vitest + React Testing Library |
| E2E | Playwright |
| Hosting | Vercel |
| Source control | GitHub or another supported Git provider |

Do not add a large state-management library for the MVP. Keep editor state local. Keep database state in a query/cache layer.

## 4.2 Why Vite SPA

The product is a private, authenticated single-owner application. It does not need SEO, public content rendering, or server-side rendering for its core experience. A Vite SPA is sufficient and simple to deploy to Vercel.

Use BrowserRouter-style routes and configure Vercel rewrites so refreshing a nested route loads the SPA shell. Vercel documents this requirement for Vite SPAs. See [Vercel: Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

Do not add Next.js SSR or Vercel Functions unless a real requirement appears. The browser can use Supabase's publishable key while RLS protects the database.

## 4.3 Application architecture

```text
Browser
  |
  | React UI / React Router
  |
  +-- Feature components
  |     +-- Journal home
  |     +-- Timeline
  |     +-- Editor / Reading view
  |     +-- Poems / Quotes / Fragments
  |     +-- Collections / Tags
  |     +-- Calendar / Search
  |     +-- Favorites / Archive / Trash
  |     +-- Settings / Backup
  |
  +-- Hooks and query cache
  |
  +-- Data service layer
  |     +-- entries service
  |     +-- collections service
  |     +-- tags service
  |     +-- export service
  |
  +-- Supabase browser client
          |
          +-- Supabase Auth
          +-- Postgres + RLS
          +-- Optional Edge Function only if a future server-side task is needed

Vercel
  +-- Static Vite build (dist/)
  +-- SPA route rewrites
  +-- Static security headers
  +-- Git Preview and Production deployments
```

## 4.4 Suggested folder structure

```text
src/
  app/
    App.tsx
    routes.tsx
    providers.tsx
  components/
    shell/
      JournalShell.tsx
      JournalSidebar.tsx
      MobileJournalNav.tsx
      JournalTopbar.tsx
    journal/
      TodayPrompt.tsx
      RecentEntriesTimeline.tsx
      ContinueWriting.tsx
      MemoryReturnCard.tsx
    editor/
      JournalEditor.tsx
      EditorToolbar.tsx
      EditorMetadata.tsx
      SaveStatus.tsx
      WordCount.tsx
    entries/
      EntryPreview.tsx
      EntryTimelineItem.tsx
      EntryFilters.tsx
      EntrySearch.tsx
      ReadingPage.tsx
    calendar/
      JournalCalendar.tsx
      DayEntryList.tsx
    collections/
      CollectionList.tsx
      CollectionDialog.tsx
    common/
      EmptyState.tsx
      ConfirmDialog.tsx
      LoadingState.tsx
      ErrorState.tsx
  pages/
    LoginPage.tsx
    JournalHomePage.tsx
    JournalEntriesPage.tsx
    NewEntryPage.tsx
    EditEntryPage.tsx
    EntryReadingPage.tsx
    PoemsPage.tsx
    QuotesPage.tsx
    FragmentsPage.tsx
    CalendarPage.tsx
    CollectionsPage.tsx
    CollectionDetailPage.tsx
    FavoritesPage.tsx
    ArchivePage.tsx
    TrashPage.tsx
    SettingsPage.tsx
  hooks/
    useAuth.ts
    useEntries.ts
    useAutosave.ts
    useCollections.ts
    useTags.ts
    useCalendarEntries.ts
    useDebouncedValue.ts
  services/
    entries.service.ts
    collections.service.ts
    tags.service.ts
    export.service.ts
  lib/
    supabase.ts
    validations.ts
    entry-utils.ts
    date-utils.ts
  types/
    database.ts
    entry.ts
  styles/
    globals.css
```

The exact folders may be adjusted to the existing Lovable project. Keep feature logic modular and avoid one enormous page component.

## 4.5 Routes

```text
/login
/forgot-password
/reset-password
/app
/app/journal
/app/entries
/app/entries/new
/app/entries/:id
/app/entries/:id/read
/app/poems
/app/quotes
/app/fragments
/app/prose
/app/calendar
/app/collections
/app/collections/:id
/app/favorites
/app/archive
/app/trash
/app/settings
```

Every `/app/*` route requires an authenticated owner session. Unknown routes show a friendly not-found screen. No public `/p/:slug` route exists.

---

# 5. Data model and Supabase implementation

## 5.1 Core tables

### `profiles`
One row for the owner:
- `id uuid primary key references auth.users(id) on delete cascade`
- `display_name text nullable`
- `created_at timestamptz`
- `updated_at timestamptz`

### `entries`

| Column | Type | Purpose |
|---|---|---|
| id | uuid PK | Entry identifier |
| user_id | uuid FK | Owner |
| title | text nullable | Optional title |
| content | text not null | Original text |
| type | text | diary, poem, quote, fragment, prose |
| status | text | draft, complete, archived |
| entry_date | date | Diary date, supports backdating |
| mood | text nullable | Optional mood |
| language | text nullable | bn, en, mixed, other |
| is_favorite | boolean | Default false |
| attribution | text nullable | Quote source |
| font_preference | text | auto, bangla, serif, sans |
| version | bigint | Optimistic concurrency revision |
| created_at | timestamptz | Actual creation time |
| updated_at | timestamptz | Last successful update |
| deleted_at | timestamptz nullable | Soft deletion |

Important:
- `entry_date` and `created_at` have different meanings.
- Never update `created_at` when backdating.
- `version` increments on each successful update.
- Do not make `word_count` authoritative; calculate in the client or maintain only as a cache.
- Body content remains plain UTF-8 text.
- Do not store HTML as the only copy of a poem or diary entry.

### `collections`
- `id uuid PK`
- `user_id uuid`
- `name text`
- `description text nullable`
- `accent text nullable`
- `sort_order integer`
- `created_at`, `updated_at`

### `entry_collections`
- `entry_id uuid FK`
- `collection_id uuid FK`
- `user_id uuid`
- `created_at`
- Primary key `(entry_id, collection_id)`

### `tags`
- `id uuid PK`
- `user_id uuid`
- `name text`
- `normalized_name text`
- `created_at`
- Unique `(user_id, normalized_name)`

### `entry_tags`
- `entry_id uuid FK`
- `tag_id uuid FK`
- `user_id uuid`
- `created_at`
- Primary key `(entry_id, tag_id)`

## 5.2 Database rules

- UUID primary keys.
- Foreign keys with deliberate delete behavior.
- Check constraints for type, status, language, and font preference.
- `created_at` defaults to `now()`.
- `updated_at` maintained by a database trigger.
- `version` increments on update.
- Index `user_id` on each owner-owned table.
- Index common combinations such as `(user_id, entry_date desc)` and `(user_id, type, updated_at desc)`.
- Use partial indexes for active records where appropriate (`deleted_at is null`).
- Never rely on client-supplied `user_id` for authorization.

## 5.3 RLS and grants

Enable RLS on every owner-owned/exposed table. Create explicit policies for SELECT, INSERT, UPDATE, and DELETE with `to authenticated`.

A basic owner policy pattern for `entries`:

```sql
alter table public.entries enable row level security;

revoke all on table public.entries from anon, authenticated;
grant select, insert, update, delete on table public.entries to authenticated;

create policy "owner_select_entries"
on public.entries
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "owner_insert_entries"
on public.entries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "owner_update_entries"
on public.entries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "owner_delete_entries"
on public.entries
for delete
to authenticated
using ((select auth.uid()) = user_id);
```

Repeat with correct ownership logic for all tables.

For `entry_collections` and `entry_tags`, do not only check the join row's `user_id`. Validate that the referenced entry and collection/tag both belong to `auth.uid()`. Add database tests for allowed and denied operations.

Do not add any `anon` policy that reads private tables.

Supabase recommends enabling RLS, matching grants to app roles, creating policies per operation, and adding database tests with `supabase test db`. Read [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 5.4 Migration workflow

Treat migrations as source-controlled code.

Recommended project folders:

```text
supabase/
  config.toml
  migrations/
    2026xxxx_create_core_tables.sql
    2026xxxx_add_entry_version.sql
    2026xxxx_add_indexes.sql
    2026xxxx_add_rls_policies.sql
  tests/
    entries_rls_test.sql
    collections_rls_test.sql
    tags_rls_test.sql
  seed.sql
```

Commands (use the current Supabase CLI version and confirm command behavior before executing against production):

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase migration new create_core_tables
supabase db reset
supabase test db
supabase migration list
supabase db push
```

Rules:
- Test migrations against local or staging first.
- Commit migration files to Git.
- Never make untracked schema changes directly on the production database once migrations are established.
- Review destructive SQL carefully.
- Back up production before high-risk migrations.
- Use additive/expand-and-contract changes where possible.
- Do not deploy schema changes from an unreviewed AI-generated migration.

Reference: [Supabase: Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations).

---

# 6. Authentication and owner-only setup

Recommended approach:
1. Create the owner's account manually through the trusted Supabase project setup.
2. Verify email if email confirmation is enabled.
3. Disable public user signups after provisioning.
4. Keep password reset enabled.
5. Protect all application routes.
6. Use Supabase Auth session handling from the official client library.
7. Clear sensitive in-memory/query state on sign-out.
8. Re-check auth state when tabs resume or session refresh events occur.

Never rely only on the React route guard; RLS is the data security boundary.

Use a deliberate auth callback route if required by the selected flow. Configure Supabase:
- Site URL = production domain.
- Allowed redirect URLs = exact localhost callback plus required Preview callback patterns and production callback.
- Do not accept arbitrary redirect destinations from query parameters.
- Keep preview redirect patterns as narrow as possible.

Supabase documents Vercel Preview URL patterns and recommends an exact production Site URL: [Supabase: Auth Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

---

# 7. Data access and state management best practices

## 7.1 Supabase client

Create one browser client module. Do not create a new client in every component.

Use the Supabase publishable key in the browser. It is designed to be public and is safe only when RLS and grants are correctly configured.

Do not:
- Put a service-role/secret key in any `VITE_*` variable.
- Commit secrets to Git.
- Call Supabase directly from dozens of unrelated components.
- Trust the UI to enforce ownership.

## 7.2 Service layer

Create reusable functions:

```ts
getEntries(filters)
getEntryById(id)
createEntry(input)
updateEntry(id, input, expectedVersion)
softDeleteEntry(id)
restoreEntry(id)
permanentlyDeleteEntry(id)
toggleFavorite(id)

getCollections()
createCollection(input)
updateCollection(id, input)
deleteCollection(id)

getTags()
createTag(name)
attachTag(entryId, tagId)
removeTag(entryId, tagId)

getEntriesForDate(date)
getEntryCounts(range)
exportEntriesAsMarkdown(options)
exportEntriesAsJson(options)
```

Each query must use the signed-in Supabase client and let RLS enforce access. Do not pass an arbitrary `user_id` from UI state as proof of ownership.

## 7.3 Query/cache strategy

- Use stable query keys.
- Cache read-only lists briefly.
- Invalidate the affected entry/list after mutations.
- Do not refetch the whole archive on every keystroke.
- Cancel stale search requests where supported.
- Keep editor draft state separate from query-cache state.
- Clear private query cache on sign-out.
- Avoid optimistic updates for critical saves unless rollback behavior is correct.

## 7.4 Validation

Use Zod or equivalent for:
- Entry type/status.
- Title length.
- Mood options.
- Collection/tag name lengths.
- Date format.
- Export options.

Do not impose arbitrary low content-length limits. Validate title and metadata, but allow long writing content appropriate for a diary.

---

# 8. Autosave design and concurrency

Autosave is a core safety feature.

## 8.1 Editor state model

Track:
- `currentDraft`
- `lastSavedDraft`
- `isDirty`
- `isSaving`
- `saveError`
- `serverVersion`
- `pendingSaveSequence`

Save indicator states:
- Saved
- Unsaved
- Saving…
- Offline
- Couldn't save — Retry

## 8.2 Save flow

1. User types; keep changes in local state.
2. Mark dirty.
3. Wait approximately 900–1200ms after typing stops.
4. If connected, send one update.
5. Update the version conditionally.
6. On server success, replace `lastSavedDraft`, update server version, clear dirty, show Saved.
7. On failure, keep current draft and show error.
8. On reconnect, retry the newest draft only.
9. Do not send stale queued content after a newer save succeeds.
10. Save on blur and before navigation when possible.

## 8.3 Concurrency

Use `version` for optimistic concurrency:
- Client reads current version.
- Update is submitted only where `id = entryId` and `version = expectedVersion`.
- Database increments version on successful update.
- If zero rows are updated, treat it as a conflict, not success.
- Fetch the latest server version and present a conflict/reload/retry choice.
- Never silently overwrite another tab's newer edit.

## 8.4 New-entry creation

- Generate/create one draft record once.
- Do not insert on every debounce cycle.
- Ensure double-clicking New Entry does not create duplicates accidentally.
- Keep a stable `entryId` after initial creation.
- If the user closes before any content is entered, handle empty draft cleanup according to a documented rule.

## 8.5 Offline behavior

Prefer local draft recovery with IndexedDB if implementing offline edits. The UI must distinguish:
- Server-saved writing.
- Locally retained but not server-saved writing.
- Unknown save result.

Do not claim offline-safe behavior unless it is tested. Do not build a service worker that caches private Supabase API responses by default.

---

# 9. Search, calendar, and date handling

## 9.1 Search

- Use safe parameterized Supabase/Postgres queries.
- Escape or correctly bind search text.
- Bangla MVP search may use `ILIKE`/substring matching.
- Search results must be restricted to owner's active data by RLS and explicit trash/status filters.
- Do not assume English full-text stemming will work for Bangla.
- Add a database index strategy once archive size warrants it.

## 9.2 Date handling

- Store diary date as Postgres `date`, not a timestamp.
- Use the browser's local timezone for “today”.
- Store creation/update timestamps in `timestamptz`.
- Do not derive `entry_date` from UTC timestamp after midnight conversion.
- Test timezone boundaries and year transitions.
- Multiple entries per date are valid.

---

# 10. Export, backup, and recovery strategy

## 10.1 In-app export

Markdown ZIP:
- One Markdown file per entry.
- Group by year/type or collection.
- Include title/type/date/mood/tags/status metadata.
- Preserve original text and newlines.
- Use safe filenames.
- Include README and export version.

JSON:
- Schema version.
- Export timestamp.
- Entries.
- Collections.
- Tags.
- Relationships.
- Optional trash records.
- No auth secrets or session tokens.

## 10.2 Database backups

In-app export is not a substitute for a database backup. Database backups protect schema and database records; Markdown/JSON exports make the owner's writing portable.

Review the current Supabase plan and backup policy:
- Supabase documentation states daily automatic backups are available for Pro, Team, and Enterprise projects, with retention varying by plan.
- The docs recommend regular CLI exports for Free-tier projects.
- Supabase database backups do not include Storage object contents.
- Point-in-Time Recovery is an optional paid capability on eligible plans.

Do not promise a specific recovery point/retention period without checking the current project plan. See [Supabase: Database Backups](https://supabase.com/docs/guides/platform/backups).

Recommended for personal use:
- Download Markdown/JSON backups regularly.
- Keep at least one copy outside the hosting account.
- Do not store the only backup in the same Supabase project.
- Test restoring a backup into a separate staging project.
- Keep an explicit backup date/note.

## 10.3 No automatic data destruction

- Do not auto-purge Trash in the MVP.
- Do not delete the owner's account automatically.
- Never perform destructive schema/data operations without review and backup.
- Confirm permanent deletion clearly.

---

# 11. Vercel deployment architecture

## 11.1 Deployment model

Use Vercel for the static Vite SPA:
- Build command: `npm run build`
- Output directory: `dist`
- Install command: inferred from committed package lock, normally `npm install`/`npm ci`
- Framework preset: Vite
- Root directory: repository root unless app lives in a subdirectory.

Vercel automatically detects Vite settings. A Vite SPA using client-side routes needs a rewrite to `/index.html` for deep links and refresh. Reference: [Vercel: Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## 11.2 Required `vercel.json`

Add this file in the repository root. Review the CSP origins against the actual project before enabling enforcement.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Content-Security-Policy-Report-Only",
          "value": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://YOUR_PROJECT_REF.supabase.co wss://YOUR_PROJECT_REF.supabase.co"
        }
      ]
    }
  ]
}
```

Important:
- Replace `YOUR_PROJECT_REF` with the actual Supabase project reference.
- If remote fonts are used, add only the exact required font origins to `font-src` and `style-src`.
- If other integrations are introduced, add only their required origins.
- Start CSP in Report-Only mode in Preview. Inspect browser violations and fix the policy before switching to `Content-Security-Policy`.
- Do not add `unsafe-eval`.
- Do not add broad `https:` or `*` sources.
- `X-Frame-Options: DENY` and `frame-ancestors 'none'` are appropriate for a private diary that should not be embedded.
- Add HSTS only after the production custom domain is fully HTTPS and subdomain policy is understood.
- If the app later uses a service worker, add a carefully scoped cache policy; do not cache authenticated Supabase data.

Vercel documents headers and rewrites in [`vercel.json`](https://vercel.com/docs/project-configuration/vercel-json). Treat the example as a starting policy and validate it against the actual bundled app.

## 11.3 Caching rules

- Let Vercel serve fingerprinted Vite assets using its standard static asset behavior.
- Do not apply long-lived immutable caching to `index.html`.
- Do not add a global cache policy that stores private user data.
- Do not cache authenticated Supabase responses in a custom service worker.
- Do not cache export files or user-generated downloads in a shared CDN cache.
- Verify browser back/forward behavior after sign-out.

---

# 12. Environment variables and secrets

## 12.1 Frontend variables

Example `.env.example`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

The Supabase publishable key is intended for frontend use. It does not provide row-level permission by itself; RLS and grants must protect every exposed table.

Never create:
```dotenv
VITE_SUPABASE_SERVICE_ROLE_KEY=...
VITE_SUPABASE_SECRET_KEY=...
```

A variable prefixed with `VITE_` is bundled into client-side code and must be treated as public.

## 12.2 Vercel environment mapping

Configure variables in Vercel Project Settings → Environment Variables:

| Variable | Development | Preview | Production |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Local Supabase/QA project | QA Supabase project | Production Supabase project |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Local/QA publishable key | QA publishable key | Production publishable key |

Never point untrusted Preview deployments at the production database if avoidable. Use a separate staging Supabase project.

Vercel environment variables are scoped to environments, and changes apply to new deployments; redeploy after changing them. Reference: [Vercel: Environment Variables](https://vercel.com/docs/environment-variables).

## 12.3 Local development

```bash
cp .env.example .env.local
# Fill in local/QA values; never commit .env.local
npm install
npm run dev
```

Add to `.gitignore`:

```gitignore
.env
.env.*
!.env.example
.vercel
dist
playwright-report
test-results
```

If a repository already uses a carefully constructed `.gitignore`, merge these patterns instead of overwriting it.

---

# 13. Vercel project setup — step by step

## Step 1 — Source control

1. Ensure the Lovable project is connected to Git.
2. Confirm source files and migrations are committed.
3. Ensure the package lock file is committed.
4. Ensure `.env.local` and secret files are ignored.
5. Create a stable production branch, normally `main`.
6. Use a separate feature branch for substantial changes.

## Step 2 — Import into Vercel

1. Open the Vercel dashboard.
2. Import the Git repository.
3. Select the correct team/account.
4. Set the Root Directory.
5. Confirm the Vite framework preset.
6. Set or verify:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: use the package manager and lockfile already committed.
7. Do not override defaults unnecessarily.

## Step 3 — Add environment variables

1. Add QA credentials to Preview.
2. Add production credentials to Production.
3. Add local values to `.env.local` for development.
4. Ensure no secret/service-role key is placed in a Vite variable.
5. Trigger a new deployment after variable changes.

## Step 4 — Deploy Preview

1. Push a feature branch.
2. Wait for the Vercel Preview deployment.
3. Verify login, routes, Supabase connection, and assets.
4. Run the relevant VerseVault QA suite.
5. Keep Preview connected only to QA/staging Supabase.
6. Protect Preview deployments where available and appropriate.

## Step 5 — Configure Supabase Auth URLs

In Supabase Auth URL configuration:
- Set Site URL to the final production origin.
- Add exact local callback URL(s).
- Add the necessary Vercel Preview callback pattern, restricted to the project's Vercel team/account slug.
- Add exact production callback URL(s).
- Test password reset and email confirmation from both Preview and Production.

Use narrow allowed redirects. Do not accept arbitrary user-supplied redirect URLs.

## Step 6 — Production deployment

1. Merge tested changes into the production branch.
2. Confirm all mandatory release gates pass.
3. Ensure production environment variables point to production Supabase.
4. Deploy.
5. Verify the deployment build and generated assets.
6. Run production smoke tests without destructive actions.

## Step 7 — Custom domain

1. Add the domain in Vercel Project Settings → Domains.
2. Follow the exact DNS instructions Vercel provides.
3. Wait for domain verification and TLS certificate provisioning.
4. Make the chosen canonical host consistent (`www` or apex).
5. Configure redirects between alternate hostnames if needed.
6. Update Supabase Site URL and allowed Auth redirect URLs.
7. Redeploy if any environment variable changed.
8. Verify HTTPS, login, reset password, refresh on nested routes, and logout.

Do not guess DNS records. Use the values shown in the Vercel project dashboard for the actual domain.

## Step 8 — Post-deploy smoke tests

- [ ] Production homepage/login loads.
- [ ] `/app/journal` refresh does not return 404.
- [ ] Signed-out access redirects to login.
- [ ] Owner can sign in.
- [ ] Owner can create a disposable test entry only if agreed.
- [ ] Save status is confirmed.
- [ ] Bangla font and text render.
- [ ] Logout prevents access to app routes.
- [ ] Password reset URL points to the right domain.
- [ ] Security headers are present.
- [ ] No service key appears in source/bundle/network.
- [ ] Production data source is the production Supabase project.
- [ ] No Preview-only or test banner/config is visible.

---

# 14. Git workflow and deployment environments

Vercel provides Local, Preview, and Production environments. Use them intentionally.

| Environment | Purpose | Supabase target |
|---|---|---|
| Local | Development and automated tests | Local Supabase or QA project |
| Preview | Review feature branches/PRs | QA/staging project |
| Production | Owner's actual diary | Production project |

Recommended workflow:
1. Create feature branch.
2. Implement feature.
3. Run unit/component tests.
4. Run local Supabase migrations/tests.
5. Push branch.
6. Inspect Vercel Preview.
7. Run QA tests against staging.
8. Merge to `main`.
9. Deploy Production.
10. Run smoke tests and record release.

Vercel documents the Local, Preview, and Production environments and their environment-specific variables: [Vercel: Environments](https://vercel.com/docs/deployments/environments).

## 14.1 Database migration deployment

Do not assume deploying frontend code automatically applies Supabase migrations.

Recommended release order:
1. Review migration SQL.
2. Back up production data according to current plan and risk.
3. Test migration locally and in staging.
4. Confirm app compatibility with both old/new schema if deployment order requires it.
5. Apply migration to production using the Supabase CLI/approved workflow.
6. Deploy frontend version that depends on the migration.
7. Verify core operations.

For risky schema changes, use expand-and-contract:
- Add compatible new column/table first.
- Deploy code that can work with old and new shape.
- Backfill if required.
- Switch reads/writes.
- Remove old schema only in a later reviewed migration.

## 14.2 Rollback

Vercel can roll back frontend deployments, but a frontend rollback does not automatically reverse database migrations.

Before release:
- Know the previous successful Vercel deployment.
- Keep migrations backward-compatible where possible.
- Record the schema version expected by each release.
- Back up before destructive migrations.
- Never apply a reverse migration blindly to a live diary database.
- Prefer forward-fix for additive schema changes.
- Restore database backup only after evaluating data written since the backup.

---

# 15. Performance, reliability, and operational best practices

## 15.1 Frontend

- Lazy-load secondary routes.
- Keep the editor responsive with large text.
- Paginate archive results.
- Fetch excerpts for lists where appropriate.
- Debounce search.
- Cancel stale searches.
- Avoid full-library refetches during typing.
- Avoid large background images.
- Optimize decorative image assets.
- Use local font files or reliable font loading with fallbacks.
- Monitor bundle size.
- Avoid unnecessary UI dependencies.

## 15.2 Database

- Filter every query by necessary owner/status/date constraints.
- Index RLS predicate columns, especially `user_id`.
- Index common sort/filter combinations.
- Use pagination.
- Avoid N+1 collection/tag queries.
- Use explicit selected columns rather than selecting everything.
- Avoid storing duplicate derived fields unless necessary.
- Test RLS policy performance.

## 15.3 Reliability

- Use an Error Boundary for unexpected UI failures.
- Keep user text in editor state while requests fail.
- Make retry actions idempotent.
- Avoid duplicate writes.
- Clear private cache on logout.
- Add health/status handling for Supabase outages.
- Provide clear “could not load” versus “no entries” messages.
- Keep a manual export/backup path.

## 15.4 Observability and privacy

For this personal diary:
- Prefer minimal operational telemetry.
- Do not capture entry content, titles, quotes, or tags in analytics.
- Do not record form input values in session replay.
- If error monitoring is enabled, scrub request bodies and user content.
- Avoid collecting more personal metadata than needed.
- Store no access tokens in logs.
- Document which service providers can access deployment metadata.

---

# 16. Security best practices

1. RLS on all owner-owned tables.
2. Separate policies per operation.
3. Explicit `to authenticated`.
4. Correct grants as well as policies.
5. Verify ownership in join-table policies.
6. Do not trust client `user_id`.
7. Never expose service-role/secret keys.
8. Use allowed Auth redirect URLs only.
9. Keep public signup disabled after creating owner.
10. Validate user-supplied search and metadata.
11. Render user content as text by default.
12. If Markdown rendering is added, sanitize and disable raw HTML unless safely handled.
13. Avoid `dangerouslySetInnerHTML`.
14. Do not store private content in URLs.
15. Do not cache authenticated content in a service worker.
16. Use HTTPS and sensible response security headers.
17. Keep dependencies updated and lockfile committed.
18. Run Supabase Security Advisor and RLS tests before production.

**Important:** Vercel deployment protection is not a replacement for application authentication and RLS. The production URL may be reachable publicly; the app must still deny unauthenticated access to private data. Vercel's protection features and plan availability vary. Review [Vercel: Deployment Protection](https://vercel.com/docs/deployment-protection) for current options.

---

# 17. PWA and mobile installation decision

Do not add PWA/service-worker behavior in the first release unless there is a clear owner requirement.

Why:
- Service workers can cache pages/data in ways that are difficult to reason about.
- Private diary content must not be placed in a shared or stale cache.
- Offline editing requires conflict handling and durable local draft recovery.

If PWA is added later:
- Cache only static shell assets.
- Never cache authenticated Supabase API responses by default.
- Keep private data network-only unless a separately reviewed encrypted offline design exists.
- Test logout, account switch, cache clearing, offline, and device sharing.
- Add the service worker to the security/privacy review.
- Provide a way to clear local cached private material.

Mobile browser responsiveness is required even without PWA installation.

---

# 18. Feature implementation phases

Build incrementally and preserve the approved visual design.

## Phase 1 — Design foundation

Implement:
- CSS design tokens.
- Fonts and Bangla typography.
- Journal shell.
- Desktop sidebar and mobile navigation.
- My Journal home.
- Diary timeline.
- Calendar preview.
- Empty/loading/error visual states.
- Temporary mock data only.

Exit criteria:
- Premium diary feeling.
- Screens are coherent at desktop/mobile.
- No generic SaaS dashboard look.
- Mock data clearly identified and scheduled for removal.

## Phase 2 — Supabase and owner authentication

Implement:
- Supabase client.
- Database migrations.
- Auth flows.
- Owner profile.
- Protected routes.
- RLS policies and grants.
- Database policy tests.

Exit criteria:
- Anonymous access denied.
- Owner login works.
- Public signup disabled.
- No service key in frontend.
- Staging data isolation verified.

## Phase 3 — Editor and content lifecycle

Implement:
- Diary, Poem, Quote, Fragment, Prose create/edit/read.
- Date and backdating.
- Mood and metadata.
- Autosave and version conflict behavior.
- Reading view.
- Favorite.

Exit criteria:
- Bangla and English preserved.
- Autosave failure and retry tested.
- Refresh does not lose saved content.
- No P0 data-loss issues.

## Phase 4 — Organization and discovery

Implement:
- Timeline.
- Search/filter/sort.
- Collections.
- Tags.
- Calendar browsing.
- Favorites.
- Archive/Trash/Restore.

Exit criteria:
- Real Supabase data only.
- Search/date/filter tests pass.
- Relationships and delete behavior verified.

## Phase 5 — Settings and backup

Implement:
- Theme/reading/editor preferences.
- Markdown ZIP.
- JSON export.
- Include/exclude Trash.
- Backup guidance.

Exit criteria:
- Preferences persist.
- Export integrity tests pass.
- Secrets are excluded.

## Phase 6 — Production hardening and Vercel

Implement:
- `vercel.json`.
- Environment separation.
- Auth redirect URLs.
- Security headers/CSP review.
- Build/lint/typecheck/test scripts.
- Vercel Preview deployment.
- Production custom domain.
- Post-deploy smoke tests.

Exit criteria:
- Deep links refresh correctly.
- Preview uses QA Supabase.
- Production uses production Supabase.
- All P0/P1 QA gates satisfied.
- GO/NO-GO report completed.

---

# 19. Recommended project scripts

Adapt to the actual package manager and repository. Do not overwrite existing scripts blindly.

Example `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc -b --pretty",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Before Vercel production deployment, require:
- Install succeeds from lockfile.
- Lint succeeds.
- Typecheck succeeds.
- Unit tests succeed.
- Production build succeeds.
- E2E suite passes in QA/staging.

If the existing project uses different script names, document the actual names and ensure the release pipeline runs equivalent commands.

---

# 20. Vercel deployment checklist

## Project configuration

- [ ] Git repository connected.
- [ ] Production branch chosen.
- [ ] Vite framework detected.
- [ ] Root directory correct.
- [ ] Build command verified.
- [ ] Output directory is `dist`.
- [ ] Package lockfile committed.
- [ ] Node version pinned/consistent with local and CI.
- [ ] `.env.local` excluded from Git.
- [ ] `vercel.json` validated.

## Environment variables

- [ ] Local points to local/QA Supabase.
- [ ] Preview points to QA/staging Supabase.
- [ ] Production points to production Supabase.
- [ ] Publishable key only in Vite frontend.
- [ ] No service-role/secret key in frontend variables.
- [ ] Redeployed after changing variables.

## Auth

- [ ] Supabase Site URL is production origin.
- [ ] Local callback allowlisted.
- [ ] Preview callback allowlist is narrow.
- [ ] Production callback is exact.
- [ ] Password reset tested on production domain.
- [ ] Public signup disabled.

## Deployment

- [ ] Preview deployment built and tested.
- [ ] Preview uses test data, not production diary.
- [ ] Production deployment built from approved branch.
- [ ] Domain verified.
- [ ] HTTPS active.
- [ ] Security headers verified.
- [ ] SPA deep-link refresh verified.
- [ ] No missing assets or runtime errors.
- [ ] Production smoke tests passed.
- [ ] Rollback deployment identified.

---

# 21. Implementation status tracker

The coding agent should maintain this table in the repository, updating it with real evidence.

| ID | Feature/phase | Status | Evidence | Known issue |
|---|---|---|---|---|
| F-01 | My Journal home | NOT STARTED | — | — |
| F-02 | Diary timeline | NOT STARTED | — | — |
| F-03 | Entry editor | NOT STARTED | — | — |
| F-04 | Autosave/recovery | NOT STARTED | — | — |
| F-05 | Reading view | NOT STARTED | — | — |
| F-06 | Poems/Quotes/Fragments/Prose | NOT STARTED | — | — |
| F-07 | Collections and tags | NOT STARTED | — | — |
| F-08 | Calendar | NOT STARTED | — | — |
| F-09 | Search and filters | NOT STARTED | — | — |
| F-10 | Favorites | NOT STARTED | — | — |
| F-11 | Archive and Trash | NOT STARTED | — | — |
| F-12 | Statistics | NOT STARTED | — | — |
| F-13 | Settings | NOT STARTED | — | — |
| F-14 | Markdown/JSON export | NOT STARTED | — | — |
| F-15 | Owner Auth and RLS | NOT STARTED | — | — |
| F-16 | Responsive UX | NOT STARTED | — | — |
| F-17 | Vercel Preview | NOT STARTED | — | — |
| F-18 | Vercel Production | NOT STARTED | — | — |

Allowed status values: NOT STARTED, IN PROGRESS, BLOCKED, IMPLEMENTED, TESTED, VERIFIED. “IMPLEMENTED” is not the same as “TESTED” or “VERIFIED”.

---

# 22. Lovable master implementation prompt

Paste this into Lovable after providing the product specification, mockup reference, QA document, and this guide.

```text
Build VerseVault as a private personal diary and literary archive for ONE
owner only.

SOURCE-OF-TRUTH DOCUMENTS:
1. VerseVault Personal Diary Specification — product scope and detailed UX.
2. VerseVault QA Testing and Release Checklist — mandatory tests and evidence.
3. VerseVault Product, Implementation, UX and Vercel Guide — architecture,
   engineering practices, environment configuration, and deployment.

Do not contradict these documents. If something is unclear, preserve privacy,
content fidelity, and the simplest reliable architecture.

PRODUCT:
Store daily diary entries, poems, quotes, fragments, prose, reflections,
and memories in Bangla and English.

DESIGN:
Use the approved warm paper, walnut/brown, editorial diary aesthetic.
Hind Siliguri for Bangla, Inter for UI, and a literary serif for English
reading content. The UI must feel like opening a personal journal, not
a generic SaaS dashboard.

PERSONAL-ONLY SCOPE:
No public signup, social functions, public publishing, sharing links,
multi-user UI, teams, subscriptions, or AI writing features.
Use one owner account with Supabase Auth and strict RLS.

STACK:
React + TypeScript + Vite, Tailwind, shadcn/ui, Lucide, Supabase Auth,
Supabase Postgres, and Vercel hosting.

ENGINEERING:
- Use feature modules and a service/data-access layer.
- Use database migrations in source control.
- Enable RLS on every owner-owned table.
- Never expose a service-role key in frontend code.
- Preserve Bangla/English text, Unicode, whitespace, punctuation,
  blank lines, and poem stanzas exactly.
- Implement debounced autosave with confirmed server status, retry,
  offline/unsaved state, and stale-write conflict handling.
- Use version-based optimistic concurrency for entry updates.
- Implement loading, empty, no-result, error, offline, and confirmation states.
- Keep private content out of analytics/logs.
- Add Markdown ZIP and JSON exports.
- Do not use mock data outside the visual prototyping phase.

VERCEL:
- Prepare the Vite SPA for Vercel.
- Use dist as output directory.
- Configure SPA rewrites in vercel.json.
- Keep Local, Preview, and Production environment variables separate.
- Preview must use QA/staging Supabase, never the production diary database.
- Production must use the production Supabase project.
- Configure Supabase Auth Site URL and redirect allowlist.
- Add reviewed security headers and CSP.
- Verify deep-link refresh and custom-domain HTTPS.

IMPLEMENTATION METHOD:
Work in phases. Before each phase, inspect the current project.
After each feature, run its relevant tests from the QA specification.
Record PASS/FAIL/BLOCKED/NOT RUN honestly and attach evidence.
Fix P0 failures before moving forward.
Do not claim a feature is complete just because its UI exists.
Do not leave dead buttons, placeholder data, or untested state paths.

FIRST ACTION:
Inspect the project and produce a short implementation inventory:
- Existing components and routes.
- Supabase connection status.
- Database and RLS status.
- Existing tests and scripts.
- Missing product features.
- Vercel readiness.

Then implement only the next incomplete phase. Do not rewrite working parts
without a clear technical reason.
```

---

# 23. Final agent instruction — production readiness

Before calling VerseVault complete, the agent must:

1. Compare every implemented screen against the approved mockups.
2. Compare every feature against the product catalogue in this guide.
3. Execute all relevant cases in `VerseVault_QA_Testing_and_Release_Checklist.md`.
4. Test actual Supabase RLS, not only front-end route guards.
5. Verify Bangla text integrity through save, refresh, copy, and export.
6. Verify offline/error/retry/conflict states.
7. Verify the app at desktop, tablet, and mobile sizes.
8. Verify Vercel Preview with staging Supabase.
9. Verify production deployment with production Supabase.
10. Record any unavailable test as BLOCKED or NOT RUN.
11. Produce a GO/NO-GO report with evidence.
12. Never state “100% tested” unless every applicable test has genuinely run.

---

# 24. Official technical references

Use official documentation as the authority for platform-specific setup. Product dashboards and plan entitlements can change; verify the live project settings before deployment.

1. [Vercel — Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) — Vite project detection, build behavior, and SPA deep-link rewrites.
2. [Vercel — Project Configuration / `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json) — rewrites, headers, build settings, and deployment configuration.
3. [Vercel — Environments](https://vercel.com/docs/deployments/environments) — Local, Preview, and Production environments.
4. [Vercel — Environment Variables](https://vercel.com/docs/environment-variables) — environment-scoped variables and redeploy behavior.
5. [Vercel — Production Checklist](https://vercel.com/docs/production-checklist) — production security, reliability, performance, and operations.
6. [Vercel — Deployment Protection](https://vercel.com/docs/deployment-protection) — access controls for Preview and Production deployments; availability varies by plan.
7. [Supabase — React Auth Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react) — Vite/React Supabase client setup and publishable key usage.
8. [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — grants, RLS policies, pgTAP testing, and indexing.
9. [Supabase — Auth Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) — Site URL and allowed redirect patterns including Vercel previews.
10. [Supabase — Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations) — migration workflow and production deployment.
11. [Supabase — Database Backups](https://supabase.com/docs/guides/platform/backups) — plan-specific backups, logical exports, and PITR.

---

# 25. Closing quality standard

VerseVault is not successful because it has many features. It is successful when the owner trusts it with words that matter.

A beautiful interface with unreliable saving is a failed diary.  
A working editor that exposes private writing is a failed diary.  
A Vercel deployment that works only on the home page is not production-ready.  
A feature that has never been tested in its failure state is not finished.

**The standard:** Every thought remains exactly as its owner wrote it, safely stored, privately accessible, easy to find again, and exportable at any time.
