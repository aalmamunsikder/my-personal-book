# VerseVault — Personal Diary & Literary Archive
## Complete Lovable Implementation Specification

**Product:** VerseVault (working name)  
**Purpose:** A private, single-owner digital diary and literary archive for poems, quotes, reflections, fragments, and personal writing.  
**Audience:** One person only — the owner. This is not a public product, social network, or multi-user SaaS.  
**Recommended stack:** Lovable React + TypeScript + Vite, Supabase Postgres, optional Supabase Auth for owner-only access, Tailwind CSS, shadcn/ui, Lucide.  
**Primary languages:** Bangla and English.

---

# 1. Product vision

Create a personal digital diary that feels like opening a beautifully designed physical journal.

The experience should be intimate, reflective, calm, and literary. It should not resemble an admin dashboard, a SaaS product, a CMS, or a generic notes app.

The application is a private place to preserve:
- Daily diary entries.
- Poems and longer literary pieces.
- Short quotes and aphorisms.
- Personal reflections and life observations.
- Unfinished thoughts, lines, and fragments.
- Memories that the owner wants to keep.

The interface should combine the emotional familiarity of a paper diary with the convenience of a searchable digital archive.

**Central design idea:** The user should feel as though they are writing in their own journal, not managing records in software.

## 1.1 Product principles

1. **Personal, not social:** no profiles for other users, followers, likes, comments, or community features.
2. **Private by design:** no public pages, publishing, public URLs, or sharing features in the MVP.
3. **Diary-first:** date, mood, and the act of writing are central.
4. **Literary archive:** poems and quotes should feel like treasured pages, not database rows.
5. **Frictionless capture:** opening a new entry and writing should take only one action.
6. **Preserve the original:** never silently alter spelling, punctuation, whitespace, stanza breaks, or line breaks.
7. **Beautiful typography:** Bangla and English must both feel native and carefully typeset.
8. **Reliable preservation:** visible autosave status, backup, and export are essential.

## 1.2 Explicitly out of scope

Do not implement:
- Public registration or multi-user onboarding.
- Public author profiles or published writing pages.
- Social sharing, followers, comments, likes, or reactions.
- Team workspaces or collaboration.
- Subscription, payment, or billing features.
- AI writing or rewriting features.
- Public collections.
- A marketing website or product landing page.

Do not add features just because a typical SaaS dashboard has them.

---

# 2. The diary-like UI/UX concept

## 2.1 Overall visual direction: The Private Journal

The application should resemble a premium personal journal, a literary notebook, and a quiet reading room.

Visual inspiration:
- A beautifully bound journal.
- Warm ivory paper.
- Subtle page edges and fine ruled details.
- Date stamps and handwritten-style annotations used sparingly.
- Editorial book typography.
- Calm, tactile interactions.

Do not literally imitate a skeuomorphic notebook with heavy leather textures, spiral bindings, fake shadows, or decorative clutter. The diary feeling should come primarily from layout, typography, spacing, and interaction.

### Visual mood

- Warm, intimate, thoughtful.
- Minimal and timeless.
- Soft contrast, not washed-out.
- Refined rather than ornamental.
- Content-led, with the writing always receiving the most attention.

## 2.2 Color palette

Use CSS variables so the palette can be changed centrally.

### Light theme — default

| Token | Suggested color | Purpose |
|---|---|---|
| `--paper` | `#F5F1E8` | Main diary background |
| `--page` | `#FFFCF5` | Journal page/editor surface |
| `--page-muted` | `#EEE8DC` | Secondary page surface |
| `--ink` | `#292820` | Primary text |
| `--ink-soft` | `#777264` | Metadata and secondary text |
| `--line` | `#E4DCCF` | Page rules and dividers |
| `--accent` | `#795548` | Muted walnut/brown accent |
| `--accent-soft` | `#E9DDD1` | Soft accent background |
| `--olive` | `#74785A` | Optional secondary accent |
| `--danger` | `#A64E45` | Destructive actions |

Use accent colors sparingly. Avoid bright blue SaaS styling, neon colors, large gradients, and excessive shadows.

### Dark theme

Optional, but include it after the light theme is polished:
- Deep warm charcoal background.
- Slightly lighter charcoal page.
- Warm off-white ink.
- Muted brown/olive accents.
- Avoid pure black backgrounds.

## 2.3 Typography

Typography is one of the most important parts of the product.

- **Bangla:** Hind Siliguri.
- **English interface:** Inter.
- **English literary reading:** Literata or Lora.
- **Optional diary accent:** a restrained handwriting font for small date labels or decorative annotations only — never for long content.

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

.journal-content[data-script="en"] {
  font-family: var(--font-literary);
}

.journal-content[data-script="bn"] {
  font-family: var(--font-bangla);
}
```

Use script-aware font selection where practical. Do not force Bangla text into an English serif font.

## 2.4 Application shell

Desktop should feel like a journal workspace, not a dashboard.

Recommended composition:

- A narrow left rail or sidebar for navigation.
- A central journal area that resembles an open page.
- A small optional right-side panel for calendar, mood, or entry details.
- A quiet top bar with the date, search, and new-entry action.

Suggested dimensions:
- Left navigation: 220–240px.
- Main writing area: flexible, max width around 900px.
- Reading column: 640–760px.
- Optional right context panel: 220–260px.
- On smaller screens, hide the right panel and collapse navigation.

Avoid a permanently visible three-column layout on small laptops. The writing canvas must remain generous.

## 2.5 Interaction style

- Gentle page transitions, no dramatic animation.
- Soft hover states.
- Small save-status indicator.
- Subtle selected-day treatment in the calendar.
- No animation that delays typing.
- Use dialogs only for destructive or genuinely important decisions.
- Make the main “Write today” action easy to find.

---

# 3. Information architecture

## 3.1 Main navigation

Use diary language rather than generic SaaS labels.

- **My Journal** — home and recent activity.
- **Daily Entries** — dated diary entries.
- **Poems** — literary pieces.
- **Quotes** — short quotes and aphorisms.
- **Fragments** — unfinished thoughts and short passages.
- **Collections** — thematic groupings.
- **Calendar** — browse entries by date.
- **Favorites** — writing worth revisiting.
- **Archive** — older entries and archived work.
- **Settings & Backup** — preferences and data export.

Keep a prominent **Write an entry** action.

## 3.2 Content categories

Each saved item has a type:

| Type | Purpose |
|---|---|
| Diary | Daily life, personal experiences, feelings, reflections |
| Poem | Multi-line literary writing |
| Quote | Short statement or aphorism |
| Fragment | An unfinished thought, sentence, or idea |
| Prose | Longer reflective or literary writing |

A diary entry may contain a title, date, mood, and long-form text. Poems and quotes may also have dates, but their presentation should not be forced into a daily-journal format.

## 3.3 Entry status

Keep status simple:
- Draft
- Complete
- Archived

There is no Published status because the archive is private.

## 3.4 Mood

Mood is optional. Offer a restrained set:
- Reflective
- Peaceful
- Melancholic
- Hopeful
- Grateful
- Nostalgic
- Anxious
- Romantic
- Frustrated
- Inspired
- Other

Do not make mood selection mandatory. It should feel like a diary annotation, not a form requirement.

---

# 4. Main screens and detailed UX

## 4.1 My Journal — home

The home screen should resemble the opening page of a personal diary.

Suggested layout:

1. A quiet date heading, e.g. “Saturday, October 31”.
2. A short welcome line such as “A place for the thoughts worth keeping.”
3. A prominent paper-like writing prompt: “What is on your mind today?”
4. A **Write today’s entry** action.
5. A “Continue writing” section for unfinished drafts.
6. A chronological “Recently written” journal timeline.
7. A small calendar preview showing days with entries.
8. A compact “Return to a memory” section showing a randomly selected older entry, if available.

Do not fill the home screen with metric cards. If showing counts, keep them subtle, e.g. “128 pages · 34 poems · 19 quotes”.

First-use empty state:
- A calm blank-page illustration or simple typographic treatment.
- Text: “Every journal begins with a first page.”
- Action: “Write your first entry”.

Do not use fake sample entries in production. Mock content is acceptable only during initial UI prototyping and must be removed before launch.

## 4.2 Daily Entries — timeline

This is the main diary archive.

Use a chronological journal timeline grouped by month or date.

Each entry preview should feel like a small excerpt from a diary page:
- Date prominently displayed.
- Optional title.
- First few lines of content, preserving line breaks.
- Mood label if present.
- Small type indicator only when necessary.
- Favorite marker if selected.

Controls:
- Search diary entries.
- Filter by year, month, mood, and collection.
- Sort newest/oldest.
- Calendar navigation.
- Load more / pagination for large archives.

Do not present diary entries as generic ecommerce-style cards. Prefer editorial list rows or paper-page previews.

## 4.3 Calendar

Create a useful monthly calendar for browsing the diary.

Requirements:
- Month and year navigation.
- A subtle dot or marker on dates with entries.
- Selecting a date shows that day's entries.
- Selecting a date with no entry offers “Write for this day”.
- Support writing a backdated entry.
- Highlight today distinctly but quietly.
- Do not assume only one entry can exist per day.

On mobile, use a compact month calendar with an entry list beneath it.

## 4.4 New diary entry

This should be the easiest action in the entire app.

When the user selects **Write today’s entry**:
- Open a clean journal page immediately.
- Set the date to today in the user's local timezone.
- Set type to Diary.
- Set status to Draft.
- Keep mood, collection, and title optional.
- Put the cursor in the writing area.

Editor structure:

**Top strip**
- Back to journal.
- Date selector.
- Save state: Saving / Saved / Offline or Failed.
- More actions.

**Paper page**
- Optional title field with a quiet placeholder: “Give this day a name…”
- Main writing area with placeholder: “Begin wherever your thoughts take you…”
- Generous line spacing.
- No heavy borders around the text area.
- Optional subtle ruled-paper background, but ensure it does not interfere with Bangla glyphs or readability.

**Bottom or side metadata**
- Mood.
- Type.
- Collection.
- Tags.
- Favorite.
- Word count.

Do not make the user complete metadata before writing.

## 4.5 Writing editor — poems, quotes, fragments, prose

Use the same underlying editor with type-specific presentation.

### Poems
- Preserve every line break and stanza break.
- Use a narrower reading width.
- Allow title and optional subtitle.
- Do not auto-wrap or reformat stored text.
- Avoid rich-text features that interfere with line-based composition.

### Quotes
- Focused, compact writing surface.
- Optional source/attribution field.
- Optional title.
- Copy action.

### Fragments
- Fast capture with minimal fields.
- Allow saving without a title.
- Quick convert to poem, quote, diary, or prose.

### Prose
- Wider editor option.
- Comfortable long-form typography.
- Paragraph spacing.

### Common editor requirements
- Plain-text-first.
- Bangla, English, mixed-script, and emoji support.
- Preserve Unicode, punctuation, spaces, blank lines, and newlines exactly.
- Word count and character count.
- Optional distraction-free mode.
- `Ctrl/Cmd + S` to save.
- Visible autosave state.
- No accidental data loss.

A rich-text editor is not required for the MVP. Start with a high-quality textarea or contenteditable implementation that preserves plain text. If adding Markdown or rich text later, keep the original plain-text content recoverable.

## 4.6 Reading view — open journal page

The reading view should feel like revisiting a page in a physical diary.

- Warm page surface.
- Date in small, understated type.
- Large title if one exists.
- Mood as a subtle annotation.
- Main text centered in a readable column.
- Preserve all original line and stanza breaks.
- Optional collection and tags at the bottom.
- Previous / next entry navigation.
- Actions: Edit, Favorite, Copy, Archive, Delete.

Do not show technical metadata such as UUIDs or database fields.

## 4.7 Collections

Collections are thematic notebooks, not mandatory folders.

Example collections:
- নৈঃশব্দ্যের দিনলিপি
- জীবনের খেরোখাতা
- Unsent Words
- Family
- Love & Distance
- Existential Notes
- Fragments of Thought
- Memories

Features:
- Create, rename, describe, reorder, and delete collections.
- Optional muted color or simple icon.
- Collection detail page with chronological entries.
- Deleting a collection must not delete its writing.
- An entry can belong to one collection in the MVP; keep the data model extensible.

## 4.8 Search

Search:
- Title.
- Main content.
- Tags.
- Collection name.
- Quote attribution/source.

Requirements:
- Bangla and English.
- Case-insensitive where relevant.
- Debounce around 250–350ms.
- Search only the owner's data.
- Preserve original content; search must not rewrite stored text.
- For Bangla, use PostgreSQL substring/ILIKE matching as a reliable MVP fallback rather than assuming English stemming works.

## 4.9 Favorites

- Favorite toggle in editor, reading view, and archive list.
- Dedicated Favorites page.
- Persist the state in Supabase.

## 4.10 Archive and trash

Archive:
- Removes an item from the active journal views but preserves it.
- Can be restored.

Trash:
- Soft-delete using `deleted_at`.
- Restore.
- Permanent deletion requires a second confirmation.
- Do not automatically purge content in the MVP.

## 4.11 Settings & Backup

**Appearance**
- Light / Dark / System.
- Reading width: Standard / Wide.
- Interface density: Comfortable / Compact.

**Writing preferences**
- Default entry type.
- Default font.
- Show word count.
- Default mood (optional).
- Autosave enabled.

**Privacy**
- Confirm that this is a private, owner-only archive.
- No public publishing or share links.
- Explain where data is stored.

**Backup**
- Export all writing as Markdown ZIP.
- Export all data as JSON.
- Export selected collection.
- Include or exclude trash.
- Show last manual backup date if tracked.

---

# 5. Personal-use security model

This app is for one owner. Do not build multi-user product functionality.

There are two acceptable deployment approaches:

### Recommended: owner-only Supabase Auth

Use Supabase Auth to protect the app, but:
- Disable public signup after creating the owner's account, or use an invite-only/manual account setup.
- Only the owner's account should be able to sign in.
- Protect all `/app/*` routes.
- Use RLS with `auth.uid() = user_id`.
- Do not build user management or team features.

This is the best choice if the app is hosted online and accessed from multiple devices.

### Alternative: local-only app

If the owner wants data stored only on one device, use IndexedDB/local storage with export backups. This avoids cloud storage but does not provide reliable cross-device sync. Do not choose this silently; the default specification assumes Supabase cloud persistence.

**Important:** “Personal use only” does not mean a public internet deployment is automatically private. Authentication, RLS, secure secrets, and HTTPS are still required.

No public sharing routes or public read policies should be created.

---

# 6. Supabase database design

Use Supabase Postgres. Store every writing as UTF-8 text. Every user-owned table must have RLS enabled.

## 6.1 Tables

### `profiles`
One row for the owner.

- `id uuid primary key references auth.users(id)`
- `display_name text`
- `created_at timestamptz`
- `updated_at timestamptz`

### `entries`
Main writing table.

| Column | Type | Purpose |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Owner |
| title | text nullable | Entry title |
| content | text | Original writing |
| type | text | diary, poem, quote, fragment, prose |
| status | text | draft, complete, archived |
| entry_date | date | Diary date; supports backdating |
| mood | text nullable | Optional mood |
| language | text nullable | bn, en, mixed, other |
| is_favorite | boolean | Default false |
| attribution | text nullable | Quote source/author |
| font_preference | text | auto, bangla, serif, sans |
| word_count | integer | Optional cached count |
| created_at | timestamptz | Creation time |
| updated_at | timestamptz | Last update |
| deleted_at | timestamptz nullable | Soft deletion |

`entry_date` is separate from `created_at`. This allows the owner to write about a past date without changing the actual creation timestamp.

Constraints:
- `content` must not be null.
- `type` limited to the supported types.
- `status` limited to supported statuses.
- New entries default to private because there is no public visibility feature.

### `collections`

- `id uuid primary key`
- `user_id uuid`
- `name text`
- `description text nullable`
- `accent text nullable`
- `sort_order integer default 0`
- `created_at timestamptz`
- `updated_at timestamptz`

### `entry_collections`

- `entry_id uuid`
- `collection_id uuid`
- `user_id uuid`
- `created_at timestamptz`
- Primary key `(entry_id, collection_id)`

### `tags`

- `id uuid primary key`
- `user_id uuid`
- `name text`
- `normalized_name text`
- `created_at timestamptz`
- Unique `(user_id, normalized_name)`

### `entry_tags`

- `entry_id uuid`
- `tag_id uuid`
- `user_id uuid`
- `created_at timestamptz`
- Primary key `(entry_id, tag_id)`

## 6.2 SQL migration starting point

```sql
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text not null default '',
  type text not null default 'diary'
    check (type in ('diary', 'poem', 'quote', 'fragment', 'prose')),
  status text not null default 'draft'
    check (status in ('draft', 'complete', 'archived')),
  entry_date date not null default current_date,
  mood text,
  language text
    check (language is null or language in ('bn', 'en', 'mixed', 'other')),
  is_favorite boolean not null default false,
  attribution text,
  font_preference text not null default 'auto'
    check (font_preference in ('auto', 'bangla', 'serif', 'sans')),
  word_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index entries_owner_date_idx
  on public.entries(user_id, entry_date desc)
  where deleted_at is null;

create index entries_owner_updated_idx
  on public.entries(user_id, updated_at desc)
  where deleted_at is null;

create index entries_owner_type_idx
  on public.entries(user_id, type)
  where deleted_at is null;

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  accent text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, name)
);

create table public.entry_collections (
  entry_id uuid not null references public.entries(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(entry_id, collection_id)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  created_at timestamptz not null default now(),
  unique(user_id, normalized_name)
);

create table public.entry_tags (
  entry_id uuid not null references public.entries(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(entry_id, tag_id)
);
```

Add `updated_at` triggers for editable tables. Create the profile row when the owner account is created, or create it safely after first sign-in.

## 6.3 RLS

Enable RLS on every table:

```sql
alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.collections enable row level security;
alter table public.entry_collections enable row level security;
alter table public.tags enable row level security;
alter table public.entry_tags enable row level security;
```

For `entries`, use owner-only policies:

```sql
create policy "Owner can read own entries"
on public.entries for select
to authenticated
using (auth.uid() = user_id);

create policy "Owner can create own entries"
on public.entries for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Owner can update own entries"
on public.entries for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Owner can delete own entries"
on public.entries for delete
to authenticated
using (auth.uid() = user_id);
```

Create equivalent owner-only policies for profiles, collections, tags, and join tables. For join tables, validate that both referenced records belong to `auth.uid()`.

There must be:
- No anonymous read policy.
- No public access policy.
- No public publishing RPC.
- No service-role key in the browser.

Even with a single owner, test that an unauthenticated session cannot read entries.

---

# 7. Authentication and deployment

For the online version:
- Use Supabase Auth email/password.
- Create the owner's account manually.
- Disable public signup after the account is created, or restrict account creation through Supabase configuration.
- Add password reset.
- Protect all journal routes.
- Keep the Supabase anon/publishable key in frontend environment variables.
- Keep service-role secrets server-side only; the frontend should not need them.
- Use HTTPS.
- Never log diary content in analytics or error reports.

Suggested routes:

```text
/login
/forgot-password
/app
/app/journal
/app/entries/new
/app/entries/:id
/app/entries/:id/read
/app/poems
/app/quotes
/app/fragments
/app/calendar
/app/collections
/app/collections/:id
/app/favorites
/app/archive
/app/trash
/app/settings
```

All `/app/*` routes require owner authentication.

---

# 8. Autosave and content integrity

Autosave is essential because this is a diary.

Recommended behavior:
1. Keep the latest text in local editor state.
2. Mark the entry dirty as soon as the user changes it.
3. Wait approximately 900ms after typing stops.
4. Save to Supabase.
5. Show `Saving…`.
6. Only show `Saved` after the database confirms success.
7. On failure, preserve local text and show `Retry`.
8. Prevent older requests from overwriting newer content.
9. Save on blur and before navigation when possible.
10. Warn before leaving only if pending changes cannot be safely retained.

For network interruption:
- Keep unsaved content in memory and, if appropriate, a temporary local draft in IndexedDB.
- Clearly distinguish local recovery from server-saved state.
- Reconcile carefully when the connection returns.
- Never silently overwrite the newer local draft with an older server copy.

Content rules:
- Store UTF-8 text.
- Preserve all line breaks and blank lines.
- Do not trim content automatically.
- Do not normalize punctuation or Unicode.
- Do not collapse spaces.
- Copy must copy the original text.
- Use safe rendering if Markdown is introduced.
- Do not insert generated content into the owner's diary.

---

# 9. Export and backup

The owner must always be able to take their writing elsewhere.

## 9.1 Markdown ZIP

- One Markdown file per entry.
- Group files by year and optionally collection.
- Include metadata such as title, type, date, mood, tags, and status.
- Preserve original content and line breaks.
- Use safe filenames.
- Include a README explaining the archive structure.

Example:

```text
VerseVault-Backup/
  README.md
  2026/
    2026-10-31-a-day-of-reflection.md
    2026-10-29-untitled-poem.md
  Poems/
  Quotes/
```

## 9.2 JSON backup

Include:
- Export schema version.
- Export timestamp.
- Entries.
- Collections.
- Tags.
- Relationships.
- Optional trashed entries if selected.

Exclude:
- Passwords.
- Auth tokens.
- Supabase secrets.
- Session data.

Show a warning before download: “This backup may contain deeply personal writing. Store it somewhere private.”

## 9.3 Backup reminder

Do not nag the user. A small reminder in Settings is sufficient. Do not automatically email or transmit diary backups to third parties.

---

# 10. Suggested frontend structure

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
  lib/
    supabase.ts
    validations.ts
    entry-utils.ts
    export/
      exportMarkdown.ts
      exportJson.ts
  types/
    database.ts
    entry.ts
  styles/
    globals.css
```

Keep components modular. Avoid a monolithic page component.

---

# 11. Build phases for Lovable

Build in phases and test each one. Do not ask Lovable to implement the entire product in one prompt.

## Phase 1 — Diary visual foundation

Build:
- Typography and color tokens.
- Paper-like surfaces.
- Journal application shell.
- Sidebar and mobile navigation.
- My Journal home screen.
- Diary timeline.
- Calendar visual.
- Empty states.
- Mock data only for this phase.

Acceptance:
- It feels like a personal diary, not a SaaS dashboard.
- The writing area is the visual focus.
- Bangla typography works.
- Desktop and mobile layouts are coherent.

## Phase 2 — Owner-only Supabase setup

Build:
- Supabase connection.
- Tables and migrations.
- Owner authentication.
- Protected routes.
- RLS policies.
- Profile initialization.

Acceptance:
- Owner can sign in.
- Anonymous users cannot read any entries.
- No public signup or multi-user UI.
- No service-role key in frontend code.

## Phase 3 — Entry editor and autosave

Build:
- Daily diary entry creation.
- Poems, quotes, fragments, prose.
- Date selection and backdating.
- Metadata and mood.
- Autosave, retry, and recovery.
- Reading view.

Acceptance:
- Refresh does not lose saved content.
- Bangla and English are preserved.
- Newlines and stanza spacing remain exact.
- Save failure is visible.

## Phase 4 — Archive and discovery

Build:
- Timeline.
- Search.
- Filters and sorting.
- Calendar browsing.
- Collections.
- Tags.
- Favorites.
- Archive and trash.

Acceptance:
- All data comes from Supabase.
- Calendar dates map to the correct entries.
- Search supports Bangla and English.

## Phase 5 — Backup and preferences

Build:
- Markdown ZIP export.
- JSON export.
- Theme preferences.
- Font and reading preferences.
- Account settings.
- Backup guidance.

Acceptance:
- Exported content is complete and readable.
- No private content is sent to external services.

## Phase 6 — Final QA

Test:
- Authentication and route protection.
- RLS.
- Autosave race conditions.
- Network interruption.
- Bangla shaping and line breaks.
- Desktop, tablet, and mobile.
- Export integrity.
- Empty, loading, and error states.
- Every button and menu action.

---

# 12. Testing checklist

## Writing fidelity
- [ ] Save a Bangla diary entry.
- [ ] Save an English poem.
- [ ] Save mixed Bangla and English.
- [ ] Include blank lines and multiple stanzas.
- [ ] Include punctuation and emoji.
- [ ] Refresh and verify exact content.
- [ ] Copy and verify original plain text.

## Diary behavior
- [ ] Create today's entry.
- [ ] Create a backdated entry.
- [ ] Create more than one entry on a date.
- [ ] Browse a month with entries.
- [ ] Select an empty date and create an entry.
- [ ] Filter by mood.
- [ ] Continue an unfinished draft.

## Organization
- [ ] Create and rename collection.
- [ ] Attach and remove collection.
- [ ] Create and attach tags.
- [ ] Favorite and unfavorite an entry.
- [ ] Archive and restore.
- [ ] Trash and restore.
- [ ] Permanently delete after confirmation.

## Privacy
- [ ] Anonymous user cannot access `/app`.
- [ ] Anonymous user cannot read Supabase entries.
- [ ] Owner can access their own entries.
- [ ] No public read policies exist.
- [ ] No public sharing routes exist.
- [ ] Service-role key is not in browser assets.

## Export
- [ ] Markdown ZIP contains all selected entries.
- [ ] JSON backup includes relationships.
- [ ] Content line breaks survive export.
- [ ] Trash inclusion option works.
- [ ] Backup warning is visible.

## Responsive
- [ ] Desktop 1440px.
- [ ] Laptop 1280px.
- [ ] Tablet 768px.
- [ ] Mobile 390px and 360px.
- [ ] No horizontal overflow.
- [ ] Editor works with mobile keyboard open.

---

# 13. Lovable master prompt

Paste this into Lovable to begin. The first task is deliberately limited to the visual foundation.

```text
Build a private personal diary and literary archive called VerseVault.

IMPORTANT PRODUCT CONTEXT:
This is for ONE PERSON'S PERSONAL USE ONLY. It is not a SaaS product,
not a public platform, and not a multi-user application. Do not build
public registration, profiles for multiple users, social features,
public publishing, sharing links, subscriptions, or team features.

PRODUCT IDEA:
Create a beautiful digital diary that feels like opening a premium
physical journal. The owner will store daily diary entries, poems,
quotes, fragments, prose, reflections, and memories in Bangla and English.

DESIGN DIRECTION:
The interface must feel like a private literary journal:
- Warm ivory paper background.
- Soft paper-like writing surfaces.
- Deep charcoal ink.
- Muted walnut/brown accent with optional muted olive.
- Elegant serif typography for literary reading.
- Inter for UI.
- Hind Siliguri for Bangla.
- Generous whitespace and beautiful line spacing.
- Subtle page-like details, fine dividers, and restrained shadows.
- Calm, intimate, timeless visual design.

Do not create a generic admin dashboard, SaaS dashboard, CMS, or generic
notes app. Do not overuse cards, gradients, glassmorphism, bright blue,
or decorative illustrations. The writing itself must be the main visual focus.

DIARY-LIKE HOME:
Create a My Journal home screen with:
- Today's date as an editorial heading.
- A warm greeting.
- A large paper-like prompt: "What is on your mind today?"
- A clear "Write today's entry" action.
- Continue writing section for drafts.
- A chronological recent entries timeline.
- A compact monthly calendar preview.
- A subtle "Return to a memory" section.
- A quiet first-entry empty state.

NAVIGATION:
My Journal, Daily Entries, Poems, Quotes, Fragments, Collections,
Calendar, Favorites, Archive, Settings & Backup.
Use a narrow desktop sidebar and responsive mobile navigation.

CONTENT TYPES:
Diary, Poem, Quote, Fragment, Prose.

EDITOR:
- Paper-like writing surface.
- Optional title.
- Large plain-text writing area.
- Date selector and backdating.
- Optional mood, collection, tags, favorite, and font preference.
- Preserve every newline, stanza break, blank line, punctuation mark,
  Unicode character, Bangla character, and emoji.
- Autosave status must be visible.
- Do not require metadata before writing.
- Provide a distraction-free mode.

TECH:
Use React + TypeScript + Vite, Tailwind, shadcn/ui, Lucide, and Supabase.
Use Supabase Auth for the owner's private login and Postgres for persistence.
Disable public signup after creating the owner's account. Enable RLS on all
user-owned tables. There must be no anonymous read access and no public
publishing or sharing feature. Never expose the service-role key in frontend code.

FIRST TASK:
Implement PHASE 1 ONLY:
- Design system and fonts.
- Journal application shell.
- Desktop sidebar and mobile navigation.
- My Journal home screen.
- Diary timeline screen.
- Calendar preview.
- Responsive empty states.
Use clearly identified temporary mock data only for this phase.
Do not connect Supabase yet.
Do not build authentication yet.
Focus on making the UI exceptional and genuinely diary-like.
After implementation, summarize created components and wait for the next phase.
```

---

# 14. Follow-up prompts for Lovable

Use these sequentially. Do not paste all at once.

### Phase 2 — Supabase and owner-only login

```text
Implement Phase 2 of the VerseVault specification.
Connect Supabase and create the profiles, entries, collections, entry_collections,
tags, and entry_tags tables. Add migrations, indexes, updated_at triggers,
owner authentication, protected routes, and RLS on every table.

This is a single-owner personal diary. Do not add public signup or multi-user
features. Create the owner's account manually, then disable public signup.
There must be no anonymous read policy and no public content access.
Test that an unauthenticated session cannot read entries.
Keep the existing diary UI unchanged.
```

### Phase 3 — Diary editor and autosave

```text
Implement Phase 3 of the VerseVault specification.
Build the diary entry editor, poem editor, quote editor, fragment editor,
and prose editor. Add date selection and backdating, optional mood,
collection, tags, favorite, and font preference.

Implement reliable debounced autosave with Saving, Saved, and Failed states.
Preserve Bangla Unicode, English, mixed text, blank lines, stanza breaks,
punctuation, spaces, and emoji exactly. Handle network failure without
silently losing text. Build a beautiful reading view that feels like
revisiting a page in a personal journal.
```

### Phase 4 — Archive and calendar

```text
Implement Phase 4 of the VerseVault specification.
Connect all archive screens to real Supabase data. Add chronological
timeline, calendar browsing, date filters, Bangla/English search, mood
filters, collections, tags, favorites, archive, trash, and restore.
Support multiple entries on the same date and backdated entries.
Respect RLS on every query.
```

### Phase 5 — Export and settings

```text
Implement Phase 5. Add Markdown ZIP export, JSON backup export, include-trash
option, appearance settings, reading width, font preference, and editor
preferences. Preserve the original writing exactly in exports. Include a
clear warning that backups may contain private personal writing.
```

### Phase 6 — Final audit

```text
Audit the complete VerseVault application against the specification.
Remove all mock data. Fix broken buttons, nonfunctional controls, persistence
bugs, autosave race conditions, Bangla font and line-break issues, responsive
problems, and RLS weaknesses. Confirm that there are no public routes,
public signup screens, public sharing features, or anonymous read policies.
Test the complete acceptance checklist and report anything incomplete.
Do not redesign working screens without a clear reason.
```

---

# 15. Final product decisions

These are non-negotiable:

1. This is a private personal diary for one owner.
2. No public publishing or sharing.
3. No social or multi-user features.
4. The home screen should feel like opening a diary.
5. The editor should feel like writing on a beautiful page.
6. Diary entries are date-based and support backdating.
7. Poems and quotes remain first-class content types.
8. Bangla typography uses Hind Siliguri.
9. Writing content and line breaks must be preserved exactly.
10. Autosave must be transparent and reliable.
11. Supabase RLS must protect all records.
12. The owner can export and back up everything.

**Definition of success:** The owner opens VerseVault and feels like they have entered their own quiet room — a place where today's thoughts, yesterday's memories, unfinished poems, and words they cannot say aloud can all live safely, beautifully, and privately.
