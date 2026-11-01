# VerseVault Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Zero Public or Anonymous Access**: Every read (`get`, `list`) and write (`create`, `update`, `delete`) across `/profiles/{userId}`, `/entries/{entryId}`, `/collections/{collectionId}`, `/tags/{tagId}`, and `/settings/{userId}` requires an authenticated user with `request.auth != null` and `request.auth.token.email_verified == true`.
2. **Strict Owner Isolation**: Every document contains an immutable `userId` field that must equal `request.auth.uid` on creation, read, list query, update, and deletion. For `/profiles/{userId}` and `/settings/{userId}`, the path parameter `{userId}` must also equal `request.auth.uid`.
3. **Path ID Hardening**: All document IDs (`{userId}`, `{entryId}`, `{collectionId}`, `{tagId}`) must satisfy `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **Strict Key Allowlisting & Anti-Update-Gap**: Every `create` and `update` operation validates the complete document against `isValid[Entity](incoming())` enforcing exact `hasAll` and `hasOnly` key sets, strict field types, and bounded string/array lengths.
5. **Temporal & Identity Immutability**: `createdAt` and `updatedAt` must equal `request.time` on creation; on update, `userId` and `createdAt` are strictly immutable (`incoming().userId == existing().userId && incoming().createdAt == existing().createdAt`), and `updatedAt` must equal `request.time`.
6. **Optimistic Concurrency**: every `entries` and `collections` document carries an integer `version >= 1`. Create must set `version == 1`; update must set it to exactly `existing.version + 1` (`nextVersionIsValid`). A lost update is refused, never silently merged.
7. **No Plaintext Passphrase Anywhere**: `lockPassword` is not an allowed key in any document. A locked page stores only `lockPasswordHash` (salted PBKDF2-SHA256 digest, `size() >= 32`) and `lockSalt` (`size() >= 8`), computed in the browser. The digest is never readable back, so no screen can display the passphrase — and there is no administrative bypass.
8. **Legacy Migration Is Single-Use**: an update may touch `lockPassword` only when the stored document still contains it *and* the incoming document removes it (`isEntryUpdateDiffAllowed`). Ordinary updates cannot write the field at all.
9. **AI Consent Is Server-Owned**: `/aiSettings/{userId}` is owner-only, `list` is denied outright, `createdAt` is immutable, and `enabled == true` requires `hasConsented == true` with a non-empty `consentVersion`. The client's localStorage copy is never consulted for authorization.
10. **AI Metering Moves Forward Only**: `/aiUsage/{userId}` may only be updated to a larger `count` for the same `day` (or a new day). `/aiUsageEvents/{requestId}` is append-only (`update` and `delete` are `if false`), its document id must equal the `requestId` it claims, its key set contains no field that could hold diary text, and it stores **no timestamp field at all** — `createdAt` is refused on write because the REST writer cannot request a server-side transform, so a stored value would be the client's clock. Firestore's server-assigned document `createTime` is the time the event happened, and it is what makes the history orderable without trusting a caller.
11. **Server-Side Session Check**: `/api/ai-assist` verifies the caller's Firebase ID token against Google's JWKS (issuer pinned to the project, `aud == projectId`, `email_verified == true`, email equal to the configured owner) before reading budget or calling the provider. There is no shared passkey. A request whose metering write fails is refused rather than spent.
12. **Secrets Stay Out of Artifacts and Logs**: JSON/ZIP exports strip `lockPasswordHash`, `lockSalt` and any legacy `lockPassword`; server logs record request shape (`requestId`, `task`, `model`, `durationMs`) only — never prompts, completions, entry content, or validation values that could contain a diary line.
13. **Storage Is Owner-Only and Shaped**: every object must live under `/{uid}/…`, and `read` (which in Storage rules carries `get`, `download` *and* `list`) requires `request.auth.uid == uid` with `email_verified == true`. There is no public prefix, because a Storage rule cannot read the Firestore document that would hold a "published" flag and the specifications allow no public surface. A `create`/`update` is additionally capped at 5 MiB; `delete` is not size-gated, since `request.resource` is absent on a delete. Any path outside the uid shape is unmatched, and `rules_version = '2'` denies it.
14. **Prototype Content Never Reaches a Shipped Artifact**: the `SAMPLE_*` fixtures in `lib/seed-data.ts` are diary writing in prototype form — poems and prose about the author's family and married life — and must appear in no browser bundle, because a static chunk is downloadable by anyone who knows to ask for it. The ruleset cannot enforce this, so the boundary is the module graph: no client module may import `lib/seed-data.ts`. One imported symbol is enough to pull the whole file in, and `SAMPLE_ENTRIES` cannot be tree-shaken out of it because it is derived by a `countWords()` call terser cannot prove side-effect free. Constants the client legitimately needs (`DEFAULT_OWNER_ID`, `INITIAL_SETTINGS`) live in `lib/journal-defaults.ts`, which holds no Bangla text and no fixture ids. `fixture-isolation.test.ts` enforces both halves under `npm test`.
15. **The Owner's Identity Is Not a Display Value**: the owner's email address authenticates a session; it is not content. It may exist in exactly two places — the server that verifies the token (`app/api/ai-assist/route.ts`) and one module-private constant used for comparison (`context/JournalContext.tsx`) — and it must never be exported, never reach the context value, never be interpolated into a message, and never be passed to Google as a `login_hint`, because an anonymous visitor or a wrong-account caller would otherwise read it off the screen or out of a static chunk. Screens that mean "which account is this" render the session's own `user?.email`, and `prompt: 'select_account'` keeps the chooser unpre-filled. The residual is accepted, not hidden: client-side gating requires the comparison value to exist in the client, so the address remains in one chunk as data, never as rendered copy. `owner-privacy.test.ts` enforces all four halves under `npm test`.

## 2. The Payload Catalogue (grown from the original "Dirty Dozen")

1. **Payload 1 (Unauthenticated Read)**: `auth = null` attempting `get` on `/entries/entry-1` -> `PERMISSION_DENIED`.
2. **Payload 2 (Unverified Email Write)**: `auth = { uid: 'user-1', email_verified: false }` attempting `create` on `/entries/entry-1` -> `PERMISSION_DENIED`.
3. **Payload 3 (Cross-User Identity Spoofing on Create)**: `auth = { uid: 'user-1', email_verified: true }` attempting `create` on `/entries/entry-1` with `userId: 'user-2'` -> `PERMISSION_DENIED`.
4. **Payload 4 (Shadow / Ghost Field Injection)**: `create` on `/entries/entry-1` containing all required fields plus `"isPublic": true` -> `PERMISSION_DENIED`.
5. **Payload 5 (Invalid Entry Type Enum)**: `create` on `/entries/entry-1` with `type: 'blog_post'` (not in `['diary', 'poem', 'quote', 'fragment', 'prose']`) -> `PERMISSION_DENIED`.
6. **Payload 6 (Malformed Entry Date Format)**: `create` on `/entries/entry-1` with `entryDate: '31-10-2026'` (fails `^\d{4}-\d{2}-\d{2}$`) -> `PERMISSION_DENIED`.
7. **Payload 7 (Resource Poisoning / Oversized Title)**: `create` on `/entries/entry-1` with `title` length 500 (`> 300`) -> `PERMISSION_DENIED`.
8. **Payload 8 (Unbounded Array Injection on Tags)**: `create` on `/entries/entry-1` with 15 tags (`> 10`) -> `PERMISSION_DENIED`.
9. **Payload 9 (Path ID Poisoning)**: `create` on `/entries/invalid$id!with*spaces` -> `PERMISSION_DENIED`.
10. **Payload 10 (Immutable Owner Mutation on Update)**: `update` on `/entries/entry-1` changing `userId` from `'user-1'` to `'user-2'` -> `PERMISSION_DENIED`.
11. **Payload 11 (Forged Client Timestamp on Create)**: `create` on `/entries/entry-1` where `createdAt != request.time` -> `PERMISSION_DENIED`.
12. **Payload 12 (Cross-Owner List Scraping)**: `list` on `/entries` where `resource.data.userId == 'user-2'` and `request.auth.uid == 'user-1'` -> `PERMISSION_DENIED`.
13. **Payload 13 (Plaintext Passphrase Smuggling)**: `update` on `/entries/entry-1` adding `lockPassword: 'hunter2'` -> `PERMISSION_DENIED` (not an allowed key; `hasOnly` rejects it).
14. **Payload 14 (Version Regression)**: `update` on `/entries/entry-1` setting `version` to `existing.version` or lower -> `PERMISSION_DENIED`.
15. **Payload 15 (Consent Bypass)**: `create`/`update` on `/aiSettings/{uid}` with `enabled: true` and `hasConsented: false` -> `PERMISSION_DENIED`.
16. **Payload 16 (Budget Reset)**: `update` on `/aiUsage/{uid}` lowering `count` for the current `day` -> `PERMISSION_DENIED`.
17. **Payload 17 (Prompt Exfiltration)**: `create` on `/aiUsageEvents/{requestId}` containing `prompt`, `completion` or `content` -> `PERMISSION_DENIED` (`hasOnly` on a metadata-only key set).
18. **Payload 18 (Passkey Replay)**: a request to `/api/ai-assist` with no `Authorization` header, or a token signed for another project/audience -> `401`/`403` before any provider call.
19. **Payload 19 (Client-Clock Metering Event)**: `create` on `/aiUsageEvents/req-1` that includes `createdAt` -> `PERMISSION_DENIED`. The event's time belongs to the server, and a REST writer cannot request a `SERVER_TIME` transform, so the field is refused outright (invariant 10).
20. **Payload 20 (Replay Priced Twice)**: `create` on `/aiUsageEvents/some-other-id` whose `requestId` field is `'req-1'` -> `PERMISSION_DENIED`. The id must equal the `requestId`, which is what makes a repeated request a no-op rather than a second charge.
21. **Payload 21 (Tag List Smuggling)**: `create` on `/entries/entry-1` with 11 tags, or with tags whose total length is 601 characters however they are packed (including one 601-character element) -> `PERMISSION_DENIED`.
22. **Payload 22 (Unscoped Archive Read)**: `list` on `/entries` issued by the owner with no `where('userId','==',uid)` filter -> `PERMISSION_DENIED`. The list rule is evaluated against the query, so an unscoped read is refused rather than silently narrowed (see §3.3).
23. **Payload 23 (World-Readable Object)**: an anonymous `getDownloadURL`, `getMetadata` or `list` on `/{uid}/covers/a.png`, and on any `public/…` path -> `PERMISSION_DENIED`; an unverified-email session is refused the same way (invariant 13).
24. **Payload 24 (Fixture Exfiltration Through the Bundle)**: a client module that imports `lib/seed-data.ts` for one constant -> `npm test` fails, because the build then ships all 13 prototype entry bodies, their document ids and the collection descriptions as public static JavaScript (invariant 14). The measured acceptance form: 0 of 13 bodies, 0 of 13 ids, 0 of 6 descriptions present anywhere under `.next/static`. This one was real — it was found by reading the *deployed* chunk, not the source.
25. **Payload 25 (Identity Disclosure Through the UI)**: an anonymous visitor reads the owner's address off the login screen; a caller who signs in with the wrong account is told whose address to use; or `login_hint` hands it to Google's chooser for every visitor -> `npm test` fails (invariant 15). All three happened on the live site at once.

## 3. Rules-Language Limits (found by executing the rules, not by reading them)

The engine that evaluates these rules is weaker than the specification's prose assumes, and the
difference is enforced elsewhere rather than wished away:

1. **There is no list quantifier.** `all()`, `any()`, `exists()`, `map()`, `filter()`, `transformList()`
   and `get()` on a list are not functions the engine knows; calling one raises *"Function not found
   error"* at evaluation time, which reaches the client as `PERMISSION_DENIED`. `firestore.rules` used
   `data.tags.all(...)` and therefore refused **every** valid entry write until the emulator ran the
   file. Rules may bound a list's size and its `join('')` length; `keys()`, `hasAll`, `hasOnly`, `size()`,
   `matches()`, `diff().affectedKeys()`, `toSet()`, `in`, `request.time` and `resource.data` all work.
   `String.size()` counts characters, not UTF-8 bytes, so Bangla titles measure correctly.
2. **Consequence: element types are unenforceable.** The rules cannot assert that each tag is a string of
   ≤ 60 characters, nor reject a blank element (`['']` passes). `sanitizeEntryPayload()`
   (`lib/validations.ts:58`) is the only writer of that field and enforces both. A future second writer
   inherits this responsibility.
3. **`list` conditions are evaluated against the query, not the results.** `resource.data.userId` in a
   `list` rule means "the query must already carry `userId == uid`". Every client reader must therefore
   send the ownership filter — the three listeners in `context/JournalContext.tsx` do, and
   `firestore.rules.emulator.test.ts` pins both the allowed shape and the unscoped refusal.
4. **No cross-document fetch.** `get()` / `exists()` on a document path do not exist, so no rule can
   verify that an entry's `collectionId` belongs to the same owner (QA **SEC-010**, **SEC-011**) or that a
   join's two sides agree. This is a referential-integrity gap, not a confidentiality one: a forged id
   names a document the caller cannot read, so the UI shows nothing for it.
5. **The REST surface cannot ask for server time.** `documents:commit` is unimplemented and both POST and
   PATCH reject `fieldTransforms`, which is why the metering event design in invariant 10 stores no
   timestamp instead of a client-supplied one.

## 4. Verification Status

`firestore.rules` and `storage.rules` are now **executed**, not just read:

| Evidence | Runs | What it proves |
|---|---|---|
| `firestore.rules.test.ts` | `npm test` | rule text ↔ blueprint key sets, id patterns, and a guard that the rules use no construct the engine refuses to resolve |
| `ai-features.test.ts` | `npm test` | the shipped consent/budget/shape guards and the prompt contract |
| `firestore.rules.emulator.test.ts` | `npm run test:rules` | 38 payloads, evaluated by the emulator's rules engine through the browser SDK |
| `firestore.rules.rest.test.ts` | `npm run test:rules` | 15 payloads through `lib/firestore-rest.ts` — the writer `/api/ai-assist` actually uses, plus a drift check that every `AI_TASKS` value is accepted by the rules and that `firebase.json` names the database the app writes to |
| `storage.rules.emulator.test.ts` | `npm run test:rules` | 6 payloads: no anonymous `get`/`download`/`list`, owner-prefix isolation, size ceiling, and no public prefix |
| `fixture-isolation.test.ts` | `npm test` | Payload 24: no client module may import the prototype fixtures, and the module that replaced them holds no diary content (invariant 14) |
| `owner-privacy.test.ts` | `npm test` | Payload 25: the owner's address appears only in the verifier and the gating constant, is never exported or interpolated, and is not a Google login hint (invariant 15) |
| `tools/verify-ai-route-guard.sh` | `npm run test:route-guard` | Payload 18 against the **built** route over HTTP: anonymous, non-JWT bearer, and unsigned `alg:none` JWT each return `401 UNAUTHENTICATED` before the provider is reached, with no configuration or stack in the body |

Payloads 1–17 and 19–23 are covered by the engine tests (QA items SEC-001…SEC-009 and SEC-012…SEC-014
among them); Payload 18 by the route guard; Payloads 24 and 25 by the static module-graph and copy gates;
SEC-010 and SEC-011 are not rule-testable, for the reason given in §3.4. `npm run test:rules` needs Java
21+ for the emulator.

**Production evidence, measured on 2026-11-01 against `https://aal-dairy.vercel.app/`** (read-only:
HTTP requests, the deployed chunks, the browser console — details in `IMPLEMENTATION_STATUS.md` §1.3):

- Payload 18 holds in production. Anonymous → `401 UNAUTHENTICATED`; `Bearer not.a.real.token` → `401
  UNAUTHENTICATED`; an unsigned `alg:none` JWT forging the real project id → `403` from the Vercel edge
  before the handler ran. No stack, no configuration in any body.
- Invariant 12 holds in what the browser downloads: no `serviceAccount`, `service_role`,
  `FIREBASE_ADMIN`, `GEMINI_API_KEY`, `-----BEGIN`, `private_key` or `client_email` string in the 10
  shared chunks or the route chunk. The publishable Firebase web API key and project id are present, as
  designed for client config.
- Invariant 14 did **not** hold in production, and no source-level review would have caught it: the
  deployed chunk carried all 13 fixture bodies. Fixed, pushed, and **re-measured on the live site**: the
  replacement chunk serves 0 of 13 bodies, 0 of 13 ids and 0 of 6 descriptions.
- Invariant 15 did not hold either, in three ways at once — the address was rendered on signed-out
  screens, quoted back to wrong-account callers, and sent to Google as a `login_hint`. It was caught by
  re-reading the live bundle to confirm the fix above had landed. Fixed and **re-measured on the live
  build**: one chunk still holds the address, as a minified gating value (`let ev="…"`) with no
  rendered-copy marker beside it; `login_hint` is absent from every chunk; `document.body.innerText` on
  the live page contains no address. The gating value remains in the client because the client decides
  ownership — see invariant 15's accepted residual.
- The Report-Only CSP reports exactly 6 violations on the signed-out page, all of them `script-src
  'self'` refusals of Next.js inline bootstrap scripts, and nothing else — so enforcement is a nonce
  question, not a directive-design question.

What this still does not establish: the ruleset is not **deployed**, so the owner's live project is still
governed by whatever was published last; the route guard proves only **rejection** — the emulator cannot
mint a real Google ID token, so no signed-in owner token has ever been *accepted* by `/api/ai-assist`;
and no signed-in browser flow has been exercised. See `IMPLEMENTATION_STATUS.md` §2 and §4.

