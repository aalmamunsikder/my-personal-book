# VerseVault — Implementation Status & Verification Evidence

Supersedes the previous version of this file, which reported a **GO** recommendation on evidence that
did not exist. Every claim below is either (a) reproducible by a listed command, (b) labelled
**NOT VERIFIED** with the reason, or (c) a known gap. Nothing here is inferred from intent.

Specs referenced: the five VerseVault guides mirrored in `public/assets/aistudio/`.

---

## 0. Stack deviation record (binding decision)

The guides were written for **Lovable + Vite + Supabase** (Edge Functions, Postgres, RLS,
`YOUR_PROJECT_REF.supabase.co`). The owner's decision for this repository is **Next.js 15 + Firebase**.
That changes the *infrastructure wording* of the specs, not their *requirements*:

| Spec requirement | This project's equivalent |
|---|---|
| Postgres RLS policy on every owner-owned table | Firestore Security Rules v2, deny-by-default catch-all (`firestore.rules`) |
| Supabase Edge Function verifies the JWT | Next route handler `app/api/ai-assist/route.ts` verifies the Firebase ID token with `jose` against Google's JWKS |
| `YOUR_PROJECT_REF.supabase.co` in `connect-src` | `firestore.googleapis.com`, `identitytoolkit.googleapis.com`, `securetoken.googleapis.com` in `vercel.json` |
| Vite SPA rewrite to `/index.html` | Not applicable — App Router. See gap NAV-003/004 below. |
| Supabase Storage bucket and upload flows | Firebase Storage with `storage.rules`: owner-only, one `/{uid}/…` shape, no anonymous read of any kind. Uploads are deferred by the Themes guide ("No large image upload system is required initially"), so no application code calls the SDK. |
| `entry_date` / `created_at` snake_case columns | `entryDate` / `createdAt` camelCase document fields (Firestore has no columns) |

The mirrored spec files are the owner's documents and are left untouched. Where a spec line cannot be
satisfied as written, it is listed as a gap here rather than silently reinterpreted.

---

## 1. Reproducible gates

| Command | Result at this commit |
|---|---|
| `npm test --silent` | **59 tests, 59 pass, 0 fail** across 6 files: `firestore.rules.test.ts` (15), `ai-features.test.ts` (15), `lib/entry-utils.test.ts` (12), `archive-merge.test.ts` (9), `fixture-isolation.test.ts` (4), `owner-privacy.test.ts` (4) |
| `npm run test:rules` | **59 tests, 59 pass, 0 fail**: `firestore.rules.emulator.test.ts` (38), `firestore.rules.rest.test.ts` (15), `storage.rules.emulator.test.ts` (6). These are evaluated by the real rules engine in the Firestore/Storage emulators |
| `npm run test:route-guard` | **3 checks pass** — spec Payload 18 executed against the *built* `/api/ai-assist`: an anonymous request, a non-JWT bearer and an unsigned `alg:none` JWT each get `401 UNAUTHENTICATED`, with no provider call and no leaked configuration or stack. `tools/verify-ai-route-guard.sh` runs `next build` first, starts its own server, and refuses to test against one it did not start |
| `npx tsc --noEmit` | clean, no output |
| `npm run lint` | **0 errors, 8 warnings** (all 8 are `@next/next/no-img-element` in `components/common/JournalArtwork.tsx`) |
| `npm run build` | succeeds; route table is `/` (static), `/_not-found` (static), `/api/ai-assist` (dynamic) |

**118 tests, 118 pass**, plus the 3-check route guard that runs the built handler over HTTP. `npm test`
and `npm run test:rules` were re-measured after the fixture-isolation, owner-privacy and archive-merge
changes (§1.3, §1.4), including a second full emulator run after the version-record persistence landed.
`npm run test:route-guard` and `npm run build` were **not** re-run at this commit — both invoke
`next build`, which shares `.next` with the owner's running dev server and wedges it; the route they
exercise (`app/api/ai-assist/route.ts`) is unchanged since the measurement above, and `tsc --noEmit`
covers the client changes.

`npm run test:rules` boots the Firebase emulators, and those need **Java 21 or newer** — firebase-tools
15.34.2 rejects a 17 runtime ("no longer supports Java version before 21"). On this machine the run uses
Temurin JDK 21 from `/data/re-tools/jdk-21.0.13+9/bin` on `PATH`; a CI image must do the same. `npm test`,
`tsc`, `lint` and `build` need no Java and are the gates that run anywhere.

### 1.1 What executing the rules found

Running the file through the engine, instead of reading it, turned up three shipping defects that the
static suite could not see by construction:

1. **Every valid entry write was impossible.** `isValidEntry` guarded tags with `data.tags.all(...)`.
   The rules language has **no list quantifier** — `all()`, `exists()`, `map()`, `filter()`, `get()`,
   `contains()` all raise *"Function not found error"* at evaluation time, and the client sees that as
   `PERMISSION_DENIED`. Replaced with bounds the engine can express
   (`tags is list && size() <= 10 && join('').size() <= 600`), and `firestore.rules.test.ts` now fails
   the build if the rules ever use a construct the engine refuses to resolve.
2. **Every AI metering event was silently discarded.** `/api/ai-assist` writes through the Firestore
   **REST** API, and a REST create cannot apply a `SERVER_TIME` transform: `documents:commit` is not
   implemented (400 for every body shape tried), and POST/PATCH both reject `fieldTransforms`. The
   rules demanded `createdAt == request.time`, so the event write could only ever be refused. The event
   no longer stores a timestamp — the rules require `!('createdAt' in data)`, the blueprint dropped the
   property, and Firestore's own server-assigned document `createTime` is the time the event happened.
   The document id must equal `requestId`, which is what turns a replay into a no-op rather than a
   second charge.
3. **The rules would have deployed to a database the app never touches.** `firebase.json` declared only
   the rules file; `firebase-tools` takes its target from `firestore.database`
   (`node_modules/firebase-tools/lib/deploy/firestore/prepare.js:79`), so the ruleset would have been
   published to `(default)` while the app reads and writes the named database
   `ai-studio-51454e48-bdf7-4db9-8208-22e26077b533`. `firebase.json` now pins it, and a test asserts
   that `firebase-applet-config.json` and `firebase.json` name the same database and that the same
   ruleset governs writes to it.

### 1.2 Two engine behaviours the design now depends on

- **`list` rules are evaluated against the query, not against the rows it returns.**
  `allow list: if resource.data.userId == request.auth.uid` *denies outright* a read that does not
  itself carry the ownership filter. All three live readers in the archive —
  [context/JournalContext.tsx:410](file:///data/my-personal-book/context/JournalContext.tsx#L410),
  [context/JournalContext.tsx:442](file:///data/my-personal-book/context/JournalContext.tsx#L442) and
  [context/JournalContext.tsx:468](file:///data/my-personal-book/context/JournalContext.tsx#L468) — open
  with `where('userId', '==', user.uid)`; the emulator asserts both halves — each shipped query shape is
  allowed, and an unscoped `collection().get()` is refused rather than quietly narrowed. A future
  unscoped read would fail loudly in CI instead of loading an empty archive.
- **Per-element list checks are not expressible.** With no quantifier the rules can bound the tag list
  (at most 10 entries, at most 600 characters in total) but cannot assert that every element is a string
  of ≤ 60 characters, nor reject a blank entry.
  [lib/validations.ts:58](file:///data/my-personal-book/lib/validations.ts#L58)
  (`sanitizeEntryPayload`, the only writer of the field) trims each tag to `TAG_NAME_MAX_LENGTH` (60),
  drops blanks and caps the count at 10, so the archive can never hold a document the blueprint would
  reject. This is a documented split of responsibility between the rules and the one writer, not a claim
  that the rules enforce it.

`next.config.ts` no longer contains `eslint.ignoreDuringBuilds`, so the build runs ESLint. The 8
remaining warnings are advisory: every illustration is a 8–77 KB PNG served from `/public` and drawn
as a decorative, CSS-sized, mix-blend overlay, so `next/image` would add layout risk for no measurable
gain. They are reported, not silenced.

**Tests that were previously false have been replaced, not re-labelled.** The old
`firestore.rules.test.ts` asserted the *insecure* rule text as correct (e.g. it expected an anonymous
`get` on a non-trashed entry to succeed) and "tested" an export by validating an inline mock instead of
calling `buildJsonBackup`. The old `ai-features.test.ts` re-declared `AI_SYSTEM_INSTRUCTION` and a
`buildTaskPromptSimulation` inside the test file, so it kept passing while the shipped prompt changed.
Both files now import the shipped modules (`lib/ai-prompts.ts`, `lib/ai-contracts.ts`,
`lib/ai-guards.ts`) or read the shipped artifacts from disk (`firestore.rules`,
`firebase-blueprint.json`).

### 1.3 What the live deployment was measured to do

On 2026-11-01 the running site (`https://aal-dairy.vercel.app/`) was probed read-only: HTTP requests,
the deployed JavaScript chunks, and the browser console. Nothing was written, and no credential was
printed by any of these probes.

- **`vercel.json` is actually applied.** `GET /` returns 200 with `Content-Security-Policy-Report-Only`
  (12 directives, Firebase Firestore/Identity Toolkit/Secure Token origins in `connect-src`),
  `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. F-17 has
  production evidence for the first time.
- **Report-only CSP: 6 violations, all one kind.** Every console message on the signed-out home page is
  an `info`-level `script-src 'self'` complaint about an inline script — Next.js's own bootstrap, each
  with a distinct `sha256-…`. No other directive is violated and there are no other console errors.
  That is the number §4.6 was written to produce, and it says enforcement needs a **nonce**, not the
  six hashes: the hashes are computed per build, so pinning them breaks on the next deploy. A separate
  `default-src 'self'` refusal of the Firebase Auth popup frame was measured on the sign-in path and is
  recorded with this item in §4.6 — enforcement needs both fixes, not one.
- **Spec Payload 18, executed against production.** `POST /api/ai-assist` with no credential → `401`
  `UNAUTHENTICATED` ("Sign in as the journal owner to use the AI companion."); with `Bearer not.a.real.token`
  → `401` `UNAUTHENTICATED` ("Your session could not be verified. Please sign in again."); with an
  unsigned `alg:none` JWT whose claims forge the real project id → **`403 Forbidden` from the Vercel edge**
  (`bom1::…`), so the handler was never reached. All three refused, no stack and no configuration in
  the bodies. The bodies do echo `provider: { label: "Google Gemini", model: "gemini-3.8-flash" }` —
  not a leak: the same string is deliberately rendered in `components/ai/AiConsentModal.tsx:84` and
  ships in the client bundle. The edge's `403` is a rejection, not proof this repository's verifier
  handled that token; the emulator and route-guard evidence stands.
- **No secret is in what the browser downloads.** Across the 10 shared chunks plus
  `app/page-*.js`: zero hits for `serviceAccount`, `service_role`, `FIREBASE_ADMIN`, `GEMINI_API_KEY`,
  `-----BEGIN`, `private_key`, `client_email`, and zero hits for a `=== "versevault"` comparison (the
  surviving `versevault` substrings are `localStorage` key names). What *is* present is the publishable
  Firebase web API key and the project id, inlined from `firebase-applet-config.json` — client config by
  design, protected by the ruleset rather than by secrecy. SEC-015 has production evidence.

Three defects surfaced only because the deployed artifact was read instead of the source:

1. **The prototype diary shipped to the public.** All 13 sample entry bodies (2,721 characters of
   personal-style Bangla poems and prose), all 13 entry ids and all 6 collection descriptions were
   downloadable from `/_next/static/chunks/app/page-*.js`. `context/JournalContext.tsx:37` imported
   `DEFAULT_OWNER_ID` and `INITIAL_SETTINGS` from `lib/seed-data.ts`, and because
   `SAMPLE_ENTRIES` is derived by a `countWords()` call, terser cannot prove the module is side-effect
   free and so cannot drop it. Fixed by moving the two constants to `lib/journal-defaults.ts`;
   `fixture-isolation.test.ts` now fails the build if any client module imports the fixtures again
   (4 assertions) and asserts the module the client *may* import contains no Bangla text and no fixture
   ids. A rebuild measures **0 of 13 bodies, 0 of 13 ids, 0 of 6 descriptions** in the bundle; the eight
   tag *names* that still appear come from `lib/journal-templates.ts` and shipped UI placeholders, not
   from `lib/seed-data.ts`. This was pushed and the deployment re-measured: the live chunk now serves
   **0 of 13** bodies, **0 of 13** ids and **0 of 6** descriptions.
2. **A stale instruction on the live auth path.** The popup-blocked error told users to sign in with the
   hard-coded admin passkey that this session removed, naming the owner's email address in the copy.
   Replaced with the accurate instruction at [context/JournalContext.tsx:1108](file:///data/my-personal-book/context/JournalContext.tsx#L1108);
   no `পাসকি`/passkey reference remains anywhere in the source.
3. **The owner's personal email address was public.** It was rendered to *anonymous* visitors in 14
   places (`Admin Account: …`, `Sign in with Google (…)`, `Admin Login (…)`), handed to any wrong-account
   caller by two rejection messages, baked into the bundle as the Google `login_hint`, and re-sent live on
   the re-scan that confirmed fix 1. `ADMIN_EMAIL` is now a module-private constant used only for gating —
   it is no longer exported and no longer reaches the context value, so no component can print it. Where a
   screen means "which account is this", it now reads the session's own `user?.email`. `login_hint` is gone
   and `prompt: 'select_account'` stays, so the chooser is not pre-filled for strangers.
   `owner-privacy.test.ts` (4 assertions) fails `npm test` if the address appears in any other client
   module, if the constant is exported again, if a rejection message interpolates it, or if the login hint
   returns. **Measured on the live deployment after the push** (chunk `app/page-e9e2c881d5434282.js`, 10
   chunks fetched): the address survives in exactly **1 of 10** chunks, where it is minified to one
   assignment (`let ev="…@gmail.com"`) with no rendered-copy marker beside it, `login_hint` is gone from
   every chunk, and the stale passkey sentence is gone. The live DOM was read too: the login modal says
   «…মালিকের Google অ্যাকাউন্ট দিয়ে সাইন-ইন করুন», both nav buttons say «মালিক লগইন», and
   `document.body.innerText` contains no address. An honest residual, not a hidden one: client-side gating
   requires the comparison value to exist in the client, so the address remains in one chunk as data. The
   server-side default in `app/api/ai-assist/route.ts:22` is not shipped to the browser. The Report-Only
   CSP re-check on the new build reported the same 6 inline-script violations and nothing else.

### 1.4 Owner-reported defect: deleted writing came back

Reported on 2026-11-01 — *"why things contents are coming back even I delete"*. Three separate causes,
all in the client archive layer, found by reading the write/sync paths rather than by probing the
deployment:

1. **A signed-out delete was only a local-state mutation.** `permanentlyDeleteEntry` and
   `deleteCollection` update React state and `localStorage`, and when no session exists there is no
   `deleteDoc` at all. Nothing recorded the intent, so the document still existed in the archive and the
   next `onSnapshot` handed it straight back.
2. **The snapshot merge was additive-only.** It unioned remote documents into local state with no
   concept of "this id was deleted here", so any local removal was invisible to it.
3. **The same merge silently overwrote unsent writing.** It accepted any remote document with
   `version >= local.version`, while local edits never bump `version` — the local copy's version is the
   one the server last confirmed. So a document edited while signed out was replaced by the server copy
   on the next snapshot, with no warning. That is data loss in the opposite direction from the one the
   owner reported, and it is the more serious of the two: the specs make preserving the author's writing
   the primary rule.

Fixed by extracting the reconciliation rule into a pure module so it can be executed rather than argued
about. [lib/archive-merge.ts](file:///data/my-personal-book/lib/archive-merge.ts) takes
`local`, `remote`, `serverKnownIds`, `dirtyIds` and `pendingDeleteIds` and resolves precedence as:
a queued delete wins over both sides; unsent (dirty) local writing outranks **any** remote version; a
remote-only id is added; and a local id the server no longer has is dropped **only** if the server had
confirmed it at least once and it is not dirty. The consequence that matters: an empty snapshot clears an
archive that is fully synchronised (someone really did delete it) but can never erase writing that has
not been safely stored.

The two inputs the rule needs are tracked where the writes happen, in
[context/JournalContext.tsx](file:///data/my-personal-book/context/JournalContext.tsx): `dirtyIdsRef` is
marked before any local mutation and cleared **only** on the confirmed success path of
`syncEntryToCloud` (a failed write re-marks it — nothing is confirmed by a failed write), and
`pendingDeletesRef` is persisted to `localStorage` under `versevault_pending_deletes_v5` so a delete made
while signed out survives a reload and is replayed as a real `deleteDoc` the next time the archive
syncs, cleared only when that delete succeeds. Both `onSnapshot` handlers now call `mergeArchive`
instead of unioning.

`archive-merge.test.ts` (9 tests) executes the rule: server-removed document drops, never-synced local
document is kept as a pending upload, dirty local survives the server's absence, a higher remote version
does **not** clobber dirty local, a confirmed document is replaced at `remote.version >= local.version`,
a new remote document is added, a queued delete is not resurrected, an empty snapshot clears a
fully-synced archive, and the merge is idempotent.

**One residual found while documenting it, and fixed in the same pass.** The rule decides "the server
deleted this" from `serverKnownIds`, which came from an in-memory `serverVersionRef`. `localStorage`
survives a reload but that ref does not, so after a refresh every local document looked never-synced and
a deletion made on the server — in the Firebase Console, or from another tab — would be handed back
anyway. Same bug through a different door. The confirmation record is now persisted under
`versevault_server_versions_v5`: read during hydration, written whenever a snapshot or a confirmed
transaction records a version, pruned when our own `deleteDoc` succeeds, and fail-soft in both
directions (a store we cannot read or write loses the record and the merge then *keeps* local writing,
which is the safe direction). The version bookkeeping also moved out of the `setState` updaters, so a
StrictMode double-invoke cannot write the wrong set and a queued updater cannot be overtaken by a
snapshot.

**Rendered check of the new storage path** (headless Chrome against the dev server, no session): seeded
`versevault_entries_v5`, a `versevault_server_versions_v5` record and a queued delete, then reloaded — all
three keys survive hydration and the page reports no error. Corrupting the version record to `'{not json'`
and reloading left the archive intact, which is the fail-soft direction the invariant requires. The
helpers themselves are not unit-tested; only the pure rule is.

**What this does not prove:** no signed-in session has run any of it. The replay path and the dirty
tracking need a real owner token against the real archive, which is destructive to exercise — see §2. The
rule itself is proven; the wiring around it is read, not run.

---

### 1.5 Dark mode: the cause was a token/utility mismatch, not taste

Reported as *"the dark mode is looking disgusting"*. Measured rather than judged: every leaf text node on
the rendered home surface was read out of the browser with its computed colour, the pixel behind it was
sampled from a screenshot, and the WCAG ratio computed from the pair. Before the fix the unsigned-in dark
view had **44 text nodes below 3:1**, several at **1.01:1** — literally invisible.

The mechanism was structural, and no amount of adding `dark:` classes would have fixed it:

- `context/JournalContext.tsx` puts `.dark` on `<html>` from `settings.theme`, and *also* always sets
  `data-theme` from the appearance config. The only dark-token block in `app/globals.css` was
  `.dark:not([data-theme])` — which therefore **never matched**. So every `dark:` utility in the app
  flipped to its dark value while `--paper`, `--surface`, `--ink` and `--line` stayed light-parchment.
  Pale utility text on a light token is the 1.01:1 case; dark token text on a `dark:` utility surface is
  the mirror image of it.
- Fix: the block is now `.dark:not([data-theme="midnight-library"])` and carries the full token set
  (`--app-bg`, `--surface`, `--surface-secondary`, `--ink-secondary`, `--ink-muted`, `--border`,
  `--page-rule`, `--ui-dark-*`) alongside the ones it already had. `midnight-library` is the one factory
  theme that already ships dark tokens, so it is left alone.
- Two utilities then sat on top of that: the selected index row
  ([components/book/OpenLeatherJournalSpread.tsx:2399](file:///data/my-personal-book/components/book/OpenLeatherJournalSpread.tsx#L2399))
  paired `dark:from-`/`dark:to-` but left `via-[#EFE0C8]` light, so the middle of the row stayed a bright
  band; and the stacked page frames, the empty-state slab, the search chip and four hover states had light
  parchment with no dark pair at all. A scan for the same class of bug (`via-[#…]` present, `dark:via-`
  absent, on any line that already carries `dark:`) returns **0 remaining** sites.

**Re-measured after the fix: 0 text nodes below 3:1 in dark mode**, and the same measurement in light mode
is unchanged (its two flags are artifacts of the sampler: a box so densely filled by glyphs that the most
common pixel *is* the text colour). Both modes were then read as rendered PNGs — dark shows dark leather
with dark pages and pale ink, light is unchanged from before. Screenshots: `/tmp/mode-dark-open.png`,
`/tmp/mode-light-open.png`.

This is a palette decision, so it is listed for the owner in §5: in dark mode the eight light factory
themes now render one dark palette instead of their own.

---

## 2. What the tests do **not** prove

- **The rules are enforced — in the emulator, not yet in the owner's project.** 59 tests evaluate
  `firestore.rules` and `storage.rules` in the real rules engine, so QA items **SEC-001 … SEC-009,
  SEC-012 … SEC-014 now have executed evidence**. What is still unproven is *whose* rules the live project
  is serving: an anonymous read-only probe (`tools/probe-live-rules.mts`, §4.1) shows it denies anonymous
  `get` and `list` today, but that is the project's own ruleset, not this file's — it is not known to
  enforce owner isolation, key allowlists, versioning or the passphrase rules, and testing that needs a
  real second account. The emulator also cannot mint real Google ID tokens — it accepts unsigned mock
  ones — so `npm run test:route-guard` covers only the **rejection** half of Payload 18 (anonymous,
  malformed, and `alg:none` callers all refused before any provider call). The **acceptance** half, a
  genuine signed-in owner token reaching Gemini, has never happened anywhere.
- **Referential integrity is outside the rules' reach.** Because the engine cannot read a second document
  (`get()` / `exists()` do not exist), no rule can check that an entry's `collectionId` names a collection
  the same owner owns, nor that a join row's two sides agree. **SEC-010 and SEC-011 are therefore not
  testable as rule behaviour.** The blast radius is containment, not leakage: a forged `collectionId`
  points at a document the caller cannot read, so the collection view shows nothing, and every picker in
  the UI is populated from the owner's own scoped listener. `sanitizeEntryPayload` caps the field's shape
  but cannot assert ownership either. Recorded here as a real gap in the spec's model, not as covered.
- **No signed-in flow has been exercised.** There are no test users, and none were created. Autosave
  conflict handling, entry locking, and the AI route's consent gate have been read and reasoned about —
  not run end to end against Firebase Auth.
- **The AI provider has never been called.** No `GEMINI_API_KEY` exists in this environment, so
  `GEMINI_MODEL`'s default value **`gemini-3.8-flash` is an unverified model id**. If it is wrong the
  route fails closed with `PROVIDER_UNAVAILABLE`/`PROVIDER_TIMEOUT`, but the AI feature is unshipped
  until one real request succeeds.
- **The app is deployed; this repository's security posture is not.** The Vercel site is live and was
  measured (§1.3), but **no rules published, no data migrated, no Storage bucket touched, and the live
  bundle is an older build** — it predates the fixture-isolation and auth-copy fixes, so it still ships
  the prototype diary prose. Nothing in this table describes what the deployed project's *ruleset*
  enforces. See §4.
- **`storage.rules` guards a feature the app does not have.** The Themes guide defers uploads ("No large
  image upload system is required initially") and nothing in this repository calls the Storage SDK. The
  file exists so the bucket cannot sit in the console's default test mode; its ruleset is owner-only and
  executed by the emulator. If uploads are ever built, they must live under `/{uid}/…` — anything else is
  unreachable, by design and by test.
- **Browser verification is still only the signed-out surface.** Locally and on the live site the
  unsigned-in UI was rendered (empty archive, login modal, Settings & Backup view, reading view) and the
  live console was read for CSP violations. After the copy changes the modal and the backup view were
  re-read from the live DOM as **text, not pixels** — the in-app browser reported a hidden viewport, so no
  screenshot could be taken, and nothing was visually confirmed about layout. Every screen behind
  authentication is unverified, and the responsive matrix (F-16) has no evidence at all.

---

## 3. Feature status (Features guide §21)

| ID | Feature | Status | Evidence / gap |
|---|---|---|---|
| F-01 | My Journal Home | Implemented, unsigned-in render verified | Screenshot taken of the empty-archive state; the seeded demo archive is **not** loaded, and after §1.3 it is no longer **bundled** either (`fixture-isolation.test.ts` gates it). The deployment still serving the old bundle keeps shipping those fixtures until it is redeployed |
| F-02 | Diary timeline | Implemented, unit-tested | `filterAndSortEntries` tests (Bangla + English) |
| F-03 | Entry editor | Implemented, **not visually verified** | Requires a signed-in session |
| F-04 | Autosave & recovery | Implemented; save-state UI is now honest | `components/common/SaveStateIndicator.tsx` renders all seven states. Previously `local` and `conflict` rendered **nothing**, so a page held only in browser memory looked identical to a page safely in the archive |
| F-05 | Reading view | Implemented, render verified | `ReadingView` had a conditional `useMemo` after an early return (a real Rules-of-Hooks error, previously hidden by `ignoreDuringBuilds`); fixed and re-rendered |
| F-06 | Poems / quotes / fragments / prose | Implemented, unit-tested | type filters in `entry-utils.test.ts` |
| F-07 | Collections & tags | Implemented, unsigned-in only | write paths unverified |
| F-08 | Calendar browsing | Implemented, **not verified** | no test, no signed-in render |
| F-09 | Search & filters | Implemented, unit-tested | Bangla + English substring tests |
| F-10 | Favorites | Implemented, **not verified** | write path needs a session |
| F-11 | Archive & trash | Implemented; reconciliation rule **executed**, destructive paths not run | §1.4: the delete-then-reappear defect is fixed and covered by 9 tests on the pure merge rule. Permanent deletion against the live archive still needs a verified backup and explicit authorization, so the Firestore `deleteDoc` and the queued-delete replay have never been exercised with a real session |
| F-12 | Statistics | Implemented, unit-tested | `countWords`, `toBanglaDigits` |
| F-13 | Settings & personalization | Implemented, partially verified | 9 factory themes + 10 page templates asserted against the Themes guide in `entry-utils.test.ts`. Dark mode is now measured, not eyeballed: 0 rendered text nodes below 3:1 in dark, unchanged in light (§1.5) |
| F-14 | Markdown & JSON export | Implemented, unit-tested | `buildJsonBackup` is called for real; a test asserts no `lockPassword`/`lockPasswordHash`/`lockSalt` reaches the payload while the writing itself survives byte-for-byte |
| F-15 | Owner auth & rules | Implemented and **executed by the rules engine** | 59 emulator tests cover anonymous denial, owner isolation, key allowlists, id hardening, ceilings, immutability, versioning, consent and metering (§1.1). The catch-all still denies anything unmatched, and `storage.rules` grants no anonymous read of any kind. Not yet verified against the owner's deployed project — see §4.1 |
| F-16 | Responsive UX | **NOT VERIFIED** | The old file cited `.playwright-cli/desktop-view.png` and `.playwright-cli/mobile-view.png`; **that directory does not exist and no Playwright run exists in this repository** |
| F-17 | Vercel configuration | Implemented | `vercel.json` now carries the 4 original headers **plus** `Content-Security-Policy-Report-Only` with Firebase origins. Report-Only only: enforcing CSP needs a violation review first, and Next.js inline bootstrap scripts will almost certainly violate `script-src 'self'` |
| F-18 | Production hardening | Implemented | 0 lint errors, 0 type errors, clean build (see §1) |

### Gaps against the specs that are still open

- **NAV-003 / NAV-004 — no deep links.** The build route table has exactly one page. Entry, collection,
  calendar and search states live in React context, so refreshing or sharing a link loses the page.
- **AUTH-001 / AUTH-008 — no dedicated auth routes** (`/signin`, callback) for the same reason.
- **AUTH-006 / AUTH-007 — no password recovery.** `sendPasswordResetEmail` appears nowhere in the
  source. Acceptable only because sign-in is Google federated; it must be a conscious decision.
- **Entry lock has no designed conflict/merge path.** A `conflict` save state tells the author the
  archive has a newer copy and that nothing was overwritten; there is no UI to load the archive copy
  and merge. The specs do not define one either.
- **Forms do not use schema validation.** `zod` is used in exactly one module (`lib/ai-contracts.ts`).
  Diary/collection forms still hand-validate in `lib/validations.ts`. `@hookform/resolvers` is declared
  in `package.json` and imported by nothing; `react-hook-form` is not a dependency at all.
- **Design-direction conflict (unresolved, owner decision).** The Themes guide and the base spec both
  warn against heavy skeuomorphic leather. `components/book/OpenLeatherJournalSpread.tsx` is ~3,900
  lines of exactly that, and it is the app's primary surface. This is a product direction question, not
  a defect I should settle by deleting the author's design.

---

## 4. Operational work required before any release (none of it done)

1. **Deploy `firestore.rules` and `storage.rules`** to the project named by
   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, with `firebase.database` set to the named database the app uses —
   `firebase.json` now pins it, but a manual deploy from the console would not. What the live project
   serves *today* is measurable without deploying: `node --import ./tools/register-ts-resolver.mjs
   tools/probe-live-rules.mts` (read-only, prints no document values) returned, on 2026-11-01,
   `PERMISSION_DENIED` for every anonymous `get` **and** `list` across `entries`, `collections`, `tags`,
   `profiles` and `settings`. So the archive is not world-readable to anonymous callers right now — but
   that denial is the project's existing ruleset, not this repository's, and the shape of the answer
   ("any authenticated caller may read anything") is what the default Firebase production ruleset looks
   like. Only a **signed-in non-owner probe**, or the deploy itself, can distinguish the two, and that
   needs explicit authorization plus credentials this workspace does not have.
2. **One-time backfill for pre-existing documents.** The v5 shape adds `version`, replaces
   `lockPassword` with `lockPasswordHash` + `lockSalt`, and introduces `aiSettings` / `aiUsageEvents`.
   Documents written under the old shape will fail `isValidEntry` on their next update. The rules allow
   exactly one migration write per document (the branch that only removes `lockPassword` — now executed,
   including the "cannot be reused" case), but any document missing `version` cannot be updated until it
   is backfilled. **This must run against a verified backup, with explicit authorization, and never as a
   bulk destructive script.**
   **Owner decision recorded 2026-11-01:** the pre-existing prototype/test documents are not needed —
   *"I do not need any doc / I will create new"*. So the v5 backfill is not required for them; they can be
   discarded instead of migrated. Two honest consequences of that decision: the documents are still
   physically in the project's Firestore and will sync **down** into a fresh client archive on the first
   sign-in, so "start new" does not happen by itself; and deleting them from the real archive is a
   destructive operation this repository will not run without explicit authorization plus a verified
   backup, per §2. The simplest compliant route is to delete them by hand in the Firebase Console, which
   needs nothing from here.
3. **Set the server environment**: `GEMINI_API_KEY` (secret), `GEMINI_MODEL` to a model id confirmed
   against the provider's catalogue, `VERSEVAULT_OWNER_EMAIL`.
4. **Register the authorized origins** in Firebase Auth for the domain the app is actually served from.
   **This is now a live blocker, observed, not predicted.** On 2026-11-01 signing in from
   `https://aal-dairy.vercel.app/` returns `Firebase: Error (auth/unauthorized-domain)`. The cause is
   measured in the deployed artifact: the chunks served by Vercel initialise Auth with
   `projectId`/`authDomain` = `gen-lang-client-0869508722` / `gen-lang-client-0869508722.firebaseapp.com`,
   and an AI-Studio-created project authorises only `localhost` plus that project's own
   `*.firebaseapp.com` / `*.web.app` hosts. `aal-dairy.vercel.app` is not on the list, so the Google OAuth
   client refuses the popup's calling origin. The fix is a Console action — **Authentication → Settings →
   Authorized domains → add `aal-dairy.vercel.app`** — and there is no CLI or `firebase.json` path for it
   (checked: `firebase login:list` reports no authorized account, and `gcloud` is not installed here, but
   neither would manage this resource anyway). Do **not** add `vercel.app` or a bare wildcard to cover
   preview deploys: that authorises every Vercel-hosted site to complete sign-in against this Auth
   project. Preview URLs are random `*-<hash>.vercel.app` hosts, so either add each one that needs auth
   testing or test sign-in on the production alias only. Nothing in this repository can be changed to work
   around it — the check is on the provider side.
   **Resolved, and verified live.** The owner added `aal-dairy.vercel.app` in the Console on 2026-11-01.
   Re-probed from the deployed site: the popup now reaches the Firebase handler and advances to
   `accounts.google.com/v3/signin/identifier` with `context_uri=https://aal-dairy.vercel.app`, with no
   `auth/unauthorized-domain` error anywhere in the dialog. That proves the calling origin is authorised.
   It does **not** prove a sign-in completes — no session has been established in this workspace, so
   §2's "no signed-in flow has been exercised" still stands, and that first successful sign-in is now the
   moment the pre-existing archive documents sync down (see §4.2).
5. **Put `npm run test:rules` in CI** on an image with Java 21+ (Temurin 21 works; 17 is refused by
   firebase-tools 15). Locally it needs the same JDK on `PATH` plus `node_modules/.bin/firebase`.
6. **Decide CSP enforcement with the measured numbers, not a guess.** Production has now been checked:
   the signed-out page reports exactly 6 violations, all `script-src 'self'` refusals of Next.js's own
   inline bootstrap scripts, and nothing else. Enforcing therefore needs a **nonce**
   (`script-src 'self' 'nonce-…'` per request); pinning the six reported `sha256-…` values would break on
   the next build, because they are computed per deploy. **A second finding changes the shape of the fix:**
   while verifying the sign-in fix, report-only mode also flagged
   `Framing 'https://gen-lang-client-0869508722.firebaseapp.com/' violates "default-src 'self'"`. That is
   Firebase Auth's own popup frame, so enforcing CSP needs **both** a nonce for the inline scripts and
   `frame-src https://*.firebaseapp.com`; either one alone breaks something — the nonce alone blocks
   sign-in, `frame-src` alone still refuses every bootstrap script. The header stays Report-Only until
   both are in place and re-measured.
7. **Deploy verification is done for all three §1.3 fixes.** The live build now serves no fixture prose,
   no stale passkey instruction and no rendered owner address (measured above). The remaining deploy work
   is the Firestore/Storage ruleset and the server environment (§4.1, §4.3) — the app artifact itself is
   current with this repository.
8. Housekeeping done at this commit: `package-lock.json` is tracked (an emulator run is not reproducible
   without pinned `firebase-tools`), and `tsconfig.tsbuildinfo` is gitignored.

---

## 5. Deliberate behaviour changes the owner should confirm

- **The entry passphrase lock now applies to the owner too.** The previous build accepted a hard-coded
  admin passkey (`versevault`) that opened any locked page, and stored the passphrase in plaintext so
  the UI could read it back. Both are gone: only a salted PBKDF2-SHA256 digest is stored, it is never
  readable, and there is no bypass. A forgotten passphrase is now unrecoverable by design.
- **Anonymous visitors can no longer read entries.** Public reading needs an explicit, scoped design;
  the specs' "hiding UI is not security" rule left no compliant option but to deny.
- **The login screens no longer name you.** Signed-out copy says "the archive owner's Google account"
  instead of printing your address, the two rejection messages say the same, and the identity row shows
  the email of whoever is actually signed in. If the UI naming the owner was deliberate — a household
  device where you need to see which account to pick — that affordance is gone, and it is the one part of
  this change that is a product decision rather than a defect fix.
- **AI consent, enablement and daily budget are read from Firestore, not localStorage.** The browser
  copy is a UI convenience; the route decides. A request whose metering write fails is refused rather
  than spent.
- **Dark mode now overrides the light factory themes.** Before §1.5 the theme picker and dark mode fought
  each other and the result was invisible text; now, with `.dark` on the root, the eight light palettes
  render one dark token set and only `midnight-library` keeps its own. The visible consequence: choosing
  "Botanical Journal" while in dark mode no longer shows a green-tinted paper. If per-theme dark variants
  are wanted, that is nine dark palettes to design — a product decision, not a defect.
- **A metering event no longer carries its own timestamp field.** The rules refuse `createdAt` on
  `/aiUsageEvents/{requestId}` because the REST writer cannot ask the server for one (§1.1.2), so a
  stored value would have been the client's clock. The history is still ordered and still server-owned:
  Firestore's document `createTime` is assigned by the server, and the id is the `requestId`, which makes
  a replay a no-op instead of a second charge.
- **Storage has no public prefix at all.** An earlier draft of `storage.rules` served anonymous reads
  out of `/public/covers/{uid}/{file}` on the theory that publication is a location, since a Storage rule
  cannot read the Firestore document that would hold a "published" flag. The privacy spec allows no
  public or publish surface, and `read` carries `list` with it — so that prefix was world-readable *and*
  browsable. Every object must now live under `/{uid}/…`, verified by the emulator.

---

## 6. Release recommendation

**NO-GO.**

Blocking items: rules are written and now engine-verified, but **undeployed**, so the owner's live
archive is still governed by a ruleset this repository has no evidence for beyond "it denies anonymous
reads today" (§2, §4.1); no migration/backfill has been run for existing archive documents (§4.2); there
is no signed-in or responsive verification with real evidence (§2, F-16); the AI provider has never been
called, so the model id is unverified (§2); and the browser artifact still carries your address as one
gating comparison value (§1.3.3) — displayed nowhere since the push, but it only leaves the bundle if
ownership stops being decided in the client, which is an open design decision rather than a blocker.
The P0 privacy defects this work started from — world-readable entries, plaintext passphrases, and a
hard-coded admin passkey that bypassed both the lock and the AI budget — are closed, and the first two
are now closed by engine results rather than by reading the rule text.
The gap the emulator work closed is the one that made the security story unfalsifiable — the rules used
to be *claimed* rather than *run*. Running them found three shipping defects (§1.1). Reading the
deployed artifact found three more that no source-level review could see (§1.3) — and the third was
caught by re-reading the live bundle to confirm the first fix had landed. That is the argument for
treating deployment, not the test suite, as the remaining work.
