# VerseVault — Complete QA, Testing & Release Gate
## Mandatory test specification for the private personal diary

**Product model:** One-owner private diary and literary archive  
**Stack:** Lovable React + TypeScript + Vite, Supabase Auth + Postgres  
**Languages:** Bangla and English  
**Purpose:** An AI coding agent must use this document during implementation, not merely at final review.

> **Non-negotiable:** A feature is not complete because it looks correct. It is complete only when its behavior has been executed and verified, failure states are handled, privacy is tested at the database/API layer, and evidence is recorded.

---

# 1. Mission and definition of done

VerseVault preserves daily diary entries, poems, quotes, fragments, prose, memories, and unfinished thoughts. Its most important responsibilities are trustworthy preservation and privacy.

The application must ensure:
1. Writing is saved and does not silently disappear.
2. Bangla, English, mixed-script content, punctuation, spaces, emoji, and stanza breaks remain intact.
3. The archive can be browsed by date, type, collection, tag, and search.
4. The interface feels like a personal journal on desktop and mobile.
5. Anonymous visitors cannot read private entries.
6. The owner can export the archive in usable formats.
7. Every visible control works or is visibly disabled with a clear reason.

## 1.1 Test statuses

- **PASS** — executed; expected result observed; evidence recorded.
- **FAIL** — executed; actual result differs from expected result.
- **BLOCKED** — unavailable dependency/environment; blocker recorded.
- **NOT RUN** — not executed. Never describe as passed.
- **NOT APPLICABLE** — genuinely outside scope, with reason.

Do not mark a runtime test PASS from code inspection alone.

## 1.2 Priority

| Priority | Meaning | Release handling |
|---|---|---|
| P0 Critical | Data loss, private data exposure, broken authentication, corrupted writing, editor unusable | Must pass; no release with open P0 |
| P1 High | Core feature broken, autosave unreliable, search/calendar wrong, mobile editor unusable | Must pass or have explicitly accepted workaround |
| P2 Medium | Secondary workflow/usability defect with workaround | Document and prioritize |
| P3 Low | Cosmetic refinement | May be deferred with documentation |

## 1.3 Definition of done

A release is not ready until:
- All P0 tests pass.
- No critical/high security defect is open.
- All P1 tests pass or have an explicitly accepted workaround.
- Desktop and mobile test evidence exists.
- Bangla/text fidelity and RLS tests pass.
- Export tests pass.
- Mock data and dead controls are removed.
- The final evidence-backed report is complete.

---

# 2. Scope boundaries

This is a **one-owner personal application**, not a SaaS product.

Do not add:
- Public registration or multi-user onboarding.
- Public author profiles, publishing, or shareable writing pages.
- Followers, comments, social feeds, or reactions.
- Team workspaces or collaboration.
- Billing, subscriptions, payments, or user-management dashboards.
- AI writing or rewriting unless separately requested.

Required security model:
- One owner account.
- Login, logout, and password recovery.
- No open public signup after owner account setup.
- Protected app routes.
- Supabase RLS on every owner-owned table.
- No anonymous read access to entries, collections, tags, or profile data.
- No service-role secret in frontend code or browser requests.

A second temporary QA account may be used in staging to verify data isolation. This does not make multi-user functionality part of the product.

---

# 3. Mandatory instructions for the AI coding agent

## 3.1 Before coding

1. Read the product implementation specification and this QA document.
2. Inspect the current repository and running application before editing.
3. Identify existing and incomplete screens/features.
4. Map the feature to test IDs in this document.
5. Do not replace working behavior to make a test easier.
6. Use synthetic Bangla and English writing only.
7. Do not test destructive operations against the owner's real archive without explicit authorization and a verified backup.

## 3.2 While implementing

1. Implement loading, empty, success, error, offline, and destructive-confirmation states as applicable.
2. Keep the editor plain-text-first.
3. Preserve the exact original user content.
4. Use RLS as the security boundary; hiding UI is not security.
5. Use real persistence for completed features. Mock data is allowed only during an explicitly temporary design phase.
6. Every control must work or be visibly disabled with a reason.
7. Never show “Saved” before the database confirms success.
8. Do not swallow errors; provide useful feedback and retry/recovery where possible.
9. Never log diary content, titles, quotes, or personal writing to analytics or production error logs.

## 3.3 After each feature

1. Run relevant unit/component tests.
2. Run relevant end-to-end tests.
3. Test desktop and mobile viewports.
4. Verify database state, not just UI feedback.
5. Record status and evidence.
6. Run relevant regression tests.
7. Resolve P0 failures before moving on.

## 3.4 Evidence requirement

Each PASS needs appropriate evidence:
- Automated test output and test name.
- Screenshot/video for visual/responsive behavior.
- Supabase query/database state verification.
- Browser network evidence for save/security behavior.

Never invent evidence, test runs, screenshots, or test users.

## 3.5 Required final report

```text
Phase:
Build/commit:
Environment:
Browsers/devices tested:

PASS:
FAIL:
BLOCKED:
NOT RUN:
NOT APPLICABLE:

P0 defects:
P1 defects:
P2/P3 known issues:

Security/RLS checks:
Bangla/content-integrity checks:
Desktop/mobile checks:
Export/backup checks:

Evidence locations:
Release recommendation: GO / NO-GO
Reason:
```

A GO recommendation requires Section 17 to pass.

---

# 4. Test environments and compatibility

## 4.1 Environments

| Environment | Purpose | Data |
|---|---|---|
| Local development | Unit/component/developer tests | Synthetic only |
| QA/staging Supabase | RLS, persistence, integration, E2E | Synthetic fixtures only |
| Production | Post-deploy smoke tests | Non-destructive checks only |

Do not experiment with migrations, permanent delete, or bulk export on the owner's real archive.

## 4.2 Viewport/browser matrix

| Target | Viewport | Required coverage |
|---|---|---|
| Desktop wide | 1440 × 900 | Full shell, editor, reading view |
| Desktop compact | 1280 × 800 | No cramped columns/overflow |
| Laptop small | 1024 × 768 | Sidebar and editor behavior |
| Tablet | 768 × 1024 | Navigation, editor, calendar |
| Mobile large | 390 × 844 | Full core workflow |
| Mobile small | 360 × 800 | No clipping; keyboard behavior |

Test at least one Chromium browser, Firefox, and Safari/WebKit where available. If unavailable, mark BLOCKED or NOT RUN.

Responsive rules:
- No horizontal page overflow.
- No clipped text, buttons, dialogs, or navigation.
- Mobile keyboard must not permanently cover the active writing field or essential save state.
- Touch targets should be comfortably tappable (aim for 44 × 44 CSS px).
- Mobile cannot rely on hover.
- Desktop content must not be excessively wide.
- Reading line length must remain comfortable.

---

# 5. Synthetic test fixtures

Use reproducible synthetic fixtures.

**Bangla diary**
```text
আজকের দিনটি অদ্ভুত নীরবতায় কেটে গেল।

কিছু কথা বলা হয়নি,
তবু মনে হলো—সব কথাই যেন বলা হয়ে গেছে।
```

**Bangla poem**
```text
নশ্বরতার উপাখ্যান

জীবনের অমোঘ স্রোতে ভেসে যায় কত আয়োজন,
প্রাপ্তির প্রাসাদে চাপা পড়ে বিস্মৃতির ক্রন্দন।

পথের শেষে ফিরে দেখি,
ঘরই ছিল সবচেয়ে দীর্ঘ ঠিকানা।
```

**English quote**
```text
Some words are never meant to be spoken;
some are only meant to be preserved.
```

**Mixed-script fragment**
```text
আজ বুঝলাম — silence is also a language.
কিছু নীরবতা উত্তর নয়, বরং দীর্ঘ প্রশ্ন।
```

**Unicode stress text**
```text
বাংলা কারচিহ্ন: কি, কী, কু, কূ, কে, কৈ, কো, কৌ।
Punctuation: ! ? , . ; : — … “ ” ‘ ’ ( ) [ ] { }
Symbols: ৳ © ™ → ★ ♡
Emoji: 🌙 ✍️ 🍂 ❤️
```

Also create:
- A synthetic entry with 10,000+ characters.
- 20+ paragraphs/stanzas.
- Multiple blank lines.
- Entries for today, yesterday, first/last day of month, Dec 31/Jan 1, Feb 28/29 in leap year, prior year, and multiple entries on the same date.

Never use personal diary content as fixtures.

---

# 6. Authentication, session, and route protection

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| AUTH-001 | P0 | Open `/app` signed out | Redirect to login; no private data is fetched/rendered |
| AUTH-002 | P0 | Sign in with owner credentials | Owner reaches journal home |
| AUTH-003 | P1 | Wrong password | Clear error; no session |
| AUTH-004 | P1 | Empty login form | Required validation appears |
| AUTH-005 | P1 | Malformed email | Inline validation |
| AUTH-006 | P1 | Request password reset | Safe confirmation; reset flow starts |
| AUTH-007 | P1 | Open reset link | Password can be reset; new login works |
| AUTH-008 | P0 | Refresh authenticated route | Session persists; private page loads safely |
| AUTH-009 | P0 | Sign out | Session cleared; protected route inaccessible |
| AUTH-010 | P0 | Browser Back after sign out | Private page is not readable from stale state |
| AUTH-011 | P1 | Session expires while editing | User is safely redirected/asked to sign in; unsaved text preserved if possible |
| AUTH-012 | P1 | Open login while already signed in | Safe authenticated destination |
| AUTH-013 | P0 | Attempt public signup after setup | Signup unavailable/disabled as designed |
| AUTH-014 | P1 | Auth request fails offline | Retryable error; no false success |
| AUTH-015 | P1 | Sign out in another tab | Other tabs detect invalid session and protect content |

A hidden signup button is insufficient. Verify Supabase project configuration and API behavior.

---

# 7. Application shell and navigation

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| NAV-001 | P1 | Open every main navigation item | Correct page; active item indicated |
| NAV-002 | P1 | Browser Back/Forward | Route and selected state stay consistent |
| NAV-003 | P1 | Reload nested route | Correct page loads |
| NAV-004 | P1 | Unknown route | Friendly not-found state |
| NAV-005 | P1 | Open mobile navigation | Menu opens, navigates, and closes correctly |
| NAV-006 | P1 | Escape with overlay open | Overlay closes where appropriate |
| NAV-007 | P2 | Resize desktop to mobile and back | Layout adapts without losing editor state |
| NAV-008 | P1 | Keyboard navigate sidebar | Logical order and visible focus |
| NAV-009 | P1 | Click brand/logo | Returns to My Journal safely |
| NAV-010 | P1 | New Entry from different screens | Creates/opens correct draft without accidental duplicates |

---

# 8. Screen-by-screen tests

Every screen must be tested at desktop and mobile widths. A normal-state screenshot alone is not sufficient.

## 8.1 My Journal / Home

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| HOME-001 | P1 | Home with existing entries | Date, greeting, recent writing, quick action are correct |
| HOME-002 | P1 | New empty account | First-entry empty state; no fake records |
| HOME-003 | P1 | Write Today's Entry | New Diary draft with today's local date |
| HOME-004 | P1 | Quick capture, if implemented | Exactly one draft; text preserved |
| HOME-005 | P1 | Continue a draft | Correct draft opens |
| HOME-006 | P2 | Recent entries | Correct ordering and excerpts |
| HOME-007 | P2 | Calendar preview | Markers match actual entry dates |
| HOME-008 | P2 | Return to a Memory | Opens real older, non-deleted entry |
| HOME-009 | P2 | Counts/summary | Counts match documented inclusion rules |
| HOME-010 | P1 | Home on mobile | Main write action is obvious and reachable |

Visual checks: Does it feel like opening a diary? Is the writing prompt dominant? Are metrics understated? Is typography legible?

## 8.2 Daily Entries / Timeline

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| DIARY-001 | P1 | Open timeline with many entries | Correct selected sort |
| DIARY-002 | P1 | Group by month/date | Headings match `entry_date` |
| DIARY-003 | P1 | Open timeline item | Correct entry opens |
| DIARY-004 | P1 | Multiple entries on same date | All appear; none overwrite |
| DIARY-005 | P1 | Backdated entry | Appears by `entry_date`, not creation time |
| DIARY-006 | P1 | Filter year/month | Only matching entries |
| DIARY-007 | P1 | Newest/oldest sort | Correct order |
| DIARY-008 | P1 | Empty timeline | Useful empty state and create action |
| DIARY-009 | P1 | Long title/excerpt | Graceful wrapping/truncation |
| DIARY-010 | P1 | Mobile timeline | Date/title/excerpt/actions usable |

## 8.3 New Entry / Editor

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| EDIT-001 | P0 | Create Diary | Exactly one owner draft with correct date |
| EDIT-002 | P1 | Create Poem | Correct type; stanza layout preserved |
| EDIT-003 | P1 | Create Quote | Focused quote editor; attribution optional |
| EDIT-004 | P1 | Create Fragment | Can save without title |
| EDIT-005 | P1 | Create Prose | Comfortable long-form editor |
| EDIT-006 | P1 | Save without title | Valid untitled entry |
| EDIT-007 | P1 | Save empty content | Explicit documented behavior; no accidental junk entries |
| EDIT-008 | P1 | Change type after typing | Content unchanged |
| EDIT-009 | P1 | Change entry date | `entry_date` changes; `created_at` does not |
| EDIT-010 | P1 | Set mood | Persists after refresh |
| EDIT-011 | P1 | Set collection | Relationship persists |
| EDIT-012 | P1 | Add/remove tags | Relationships update; content unchanged |
| EDIT-013 | P1 | Toggle favorite | Persists after refresh |
| EDIT-014 | P1 | Change font preference | Rendering changes; stored text does not |
| EDIT-015 | P1 | Distraction-free mode | Controls hide/show; editor state survives |
| EDIT-016 | P1 | Word/character count | Correct and does not mutate text |
| EDIT-017 | P1 | Ctrl/Cmd+S | Saves without browser side effects |
| EDIT-018 | P1 | Navigate away after save | No unnecessary warning |
| EDIT-019 | P0 | Navigate with pending changes | Flush or preserve; no silent loss |
| EDIT-020 | P1 | Mobile editor | Keyboard and controls remain usable |

## 8.4 Autosave, races, and recovery

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| SAVE-001 | P0 | Type and pause | Debounced request; Saving then Saved only after server confirmation |
| SAVE-002 | P0 | Refresh after Saved | Exact latest content reloads |
| SAVE-003 | P0 | Type continuously | Debounce; no request per keystroke |
| SAVE-004 | P0 | Overlapping saves | Older response cannot overwrite newer text |
| SAVE-005 | P0 | Simulate network failure | Local text remains; Failed and Retry shown |
| SAVE-006 | P0 | Retry failed save | Latest complete text saved |
| SAVE-007 | P0 | Go offline while typing | Offline/Unsaved shown; text retained locally |
| SAVE-008 | P0 | Reconnect | Latest text saves; stale server content does not replace it |
| SAVE-009 | P1 | Reopen with recovery data | Recovery prompt/behavior works if implemented |
| SAVE-010 | P1 | Switch entry while save pending | Save belongs to correct entry |
| SAVE-011 | P1 | Save on blur | Changes committed or safely retained |
| SAVE-012 | P1 | Session expires while typing | Text remains recoverable |
| SAVE-013 | P1 | Database rejects update | Error shown; text remains in editor |
| SAVE-014 | P1 | Save long content | No truncation |
| SAVE-015 | P0 | Throttle network | Saved never appears before server acknowledgement |

If offline local recovery is not implemented, disclose its limits. Do not promise that offline text survives closing the tab unless verified.

## 8.5 Reading View

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| READ-001 | P1 | Open poem | Correct title/content/date/metadata |
| READ-002 | P1 | Multi-stanza poem | Line and stanza breaks preserved |
| READ-003 | P1 | Open diary entry | Date and mood correct |
| READ-004 | P1 | Change reading preference | Layout changes without text changes |
| READ-005 | P1 | Favorite from reading view | State persists |
| READ-006 | P1 | Copy text | Original plain text and line breaks in clipboard |
| READ-007 | P1 | Edit from reading view | Same entry opens in editor |
| READ-008 | P1 | Previous/next | Correct neighbor in current context |
| READ-009 | P1 | Open deleted entry | Safe unavailable/not-found state |
| READ-010 | P1 | Mobile reading | Comfortable line width and touch actions |

## 8.6 Poems, Quotes, Fragments, Prose

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| TYPE-001 | P1 | Poems page | Only active Poem entries |
| TYPE-002 | P1 | Quotes page | Only active Quote entries |
| TYPE-003 | P1 | Fragments page | Only active Fragment entries |
| TYPE-004 | P1 | Convert Fragment to Poem | Type changes; content/metadata stay |
| TYPE-005 | P1 | Quote with attribution | Attribution persists and displays |
| TYPE-006 | P1 | Quote without attribution | No awkward empty label |
| TYPE-007 | P1 | Grid/list toggle, if offered | Same records/actions in both |
| TYPE-008 | P1 | Empty type page | Type-specific empty state |
| TYPE-009 | P1 | Favorite item in list | State persists |
| TYPE-010 | P1 | Mobile type library | No horizontal scrolling |

## 8.7 Collections

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| COLL-001 | P1 | Create collection | Persists |
| COLL-002 | P1 | Duplicate collection name | Clear validation |
| COLL-003 | P1 | Rename collection | Existing relationships remain |
| COLL-004 | P1 | Edit description/accent | Persists |
| COLL-005 | P1 | Attach entry | Entry appears in collection |
| COLL-006 | P1 | Remove entry | Entry remains in archive |
| COLL-007 | P1 | Delete collection | Entries are not deleted |
| COLL-008 | P1 | Empty collection | Helpful add-writing state |
| COLL-009 | P1 | Collection with many entries | Sorting/pagination correct |
| COLL-010 | P1 | Reorder, if implemented | Order persists |
| COLL-011 | P1 | Mobile collection | Controls usable |

## 8.8 Tags

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| TAG-001 | P1 | Create tag | Persists |
| TAG-002 | P1 | Duplicate English tag with different case | Prevented or consistently merged |
| TAG-003 | P1 | Create Bangla tag | Unicode persists and is searchable |
| TAG-004 | P1 | Attach tag | Relationship persists |
| TAG-005 | P1 | Remove tag | Entry unchanged |
| TAG-006 | P1 | Delete tag | Writing remains |
| TAG-007 | P1 | Filter by tag | Only matching active entries |
| TAG-008 | P2 | Many tags | Autocomplete and layout remain usable |

## 8.9 Calendar and memory browsing

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| CAL-001 | P1 | Open current month | Correct month/year |
| CAL-002 | P1 | Previous/next month | Correct month loads |
| CAL-003 | P1 | Select date with one entry | Entry appears |
| CAL-004 | P1 | Select date with multiple entries | All entries appear |
| CAL-005 | P1 | Select empty date | Create-for-date action appears |
| CAL-006 | P1 | Create from calendar | Correct `entry_date` saved |
| CAL-007 | P1 | December to January | Year transition correct |
| CAL-008 | P1 | Leap-year February | February 29 valid |
| CAL-009 | P1 | Month starts on different weekday | Grid aligns correctly |
| CAL-010 | P1 | Local timezone around midnight | No unexpected date shift |
| CAL-011 | P1 | Archived/trash items | Markers follow explicit rules |
| CAL-012 | P1 | Mobile calendar | Month and selected-day list usable |

## 8.10 Search and filters

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| SRCH-001 | P1 | Exact English title | Correct entry |
| SRCH-002 | P1 | Bangla title | Correct entry |
| SRCH-003 | P1 | Bangla content phrase | Correct entry |
| SRCH-004 | P1 | Mixed Bangla/English phrase | Correct entry |
| SRCH-005 | P1 | Punctuation/special characters | No crash or malformed query |
| SRCH-006 | P1 | No-match query | Clear no-results state |
| SRCH-007 | P1 | Clear search | Default archive returns |
| SRCH-008 | P1 | Search + type filter | Both apply |
| SRCH-009 | P1 | Search + collection/tag/mood | Correct intersection |
| SRCH-010 | P1 | Rapid typing | Debounce; stale response not displayed |
| SRCH-011 | P1 | Search trash | Trash excluded from normal archive |
| SRCH-012 | P1 | Mobile search | Controls accessible |
| SRCH-013 | P1 | Apostrophe/wildcard-like input | Safe query behavior |
| SRCH-014 | P2 | Clear all filters | Defaults restored |

## 8.11 Favorites

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| FAV-001 | P1 | Favorite entry | Appears in Favorites |
| FAV-002 | P1 | Unfavorite from Favorites | Removed from Favorites, remains in archive |
| FAV-003 | P1 | Favorite from editor | Consistent across screens |
| FAV-004 | P1 | Favorite from reader | Persists after refresh |
| FAV-005 | P1 | Empty Favorites | Helpful empty state |
| FAV-006 | P1 | Deleted favorite | Excluded from active Favorites |

## 8.12 Archive and Trash

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| ARC-001 | P1 | Archive entry | Hidden from active views; shown in Archive |
| ARC-002 | P1 | Restore archived entry | Returns to correct view/date |
| ARC-003 | P1 | Soft-delete entry | Hidden from normal archive |
| ARC-004 | P1 | Open Trash | Deleted entry appears |
| ARC-005 | P1 | Restore trash item | Content/date/type/relations return |
| ARC-006 | P0 | Permanently delete after confirm | Removed; target/action clearly identified |
| ARC-007 | P0 | Cancel permanent delete | Nothing deleted |
| ARC-008 | P1 | Delete collection | Entry not deleted |
| ARC-009 | P1 | Empty Trash | Empty state shown |
| ARC-010 | P1 | Browser Back after delete | Deleted content not exposed from stale state |
| ARC-011 | P1 | Refresh Trash | State matches database |
| ARC-012 | P1 | Bulk action, if implemented | Selection and confirmation accurate |

## 8.13 Statistics and writing history

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| STAT-001 | P2 | Total count | Matches defined inclusion rules |
| STAT-002 | P2 | Counts by type | Match active database entries |
| STAT-003 | P2 | Draft/complete counts | Match statuses |
| STAT-004 | P2 | Monthly writing activity | Correct date grouping |
| STAT-005 | P2 | Change date range | Charts and totals update |
| STAT-006 | P2 | Empty archive | Honest empty chart state |
| STAT-007 | P2 | Mobile stats | Values/labels legible |
| STAT-008 | P2 | Archived/trash inclusion | Consistent documented rule |

## 8.14 Settings and personalization

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| SET-001 | P1 | Light/dark/system theme | Applies consistently |
| SET-002 | P1 | Refresh after theme change | Preference persists |
| SET-003 | P1 | Reading width | Reading layout changes |
| SET-004 | P1 | UI density | Spacing changes without overlap |
| SET-005 | P1 | Default entry type | New entry uses preference where applicable |
| SET-006 | P1 | Default font | Correct editor/reading font |
| SET-007 | P1 | Toggle word count | Preference honored |
| SET-008 | P1 | Change display name, if supported | Profile updates |
| SET-009 | P1 | Settings on mobile | Sections usable |
| SET-010 | P1 | Invalid preference via API | Rejected safely |

## 8.15 Backup and export

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| EXP-001 | P0 | Markdown ZIP export all | Includes all eligible entries |
| EXP-002 | P0 | JSON backup | Valid JSON with schema version |
| EXP-003 | P1 | Export one collection | Only selected collection's items |
| EXP-004 | P1 | Include/exclude Trash | Option respected |
| EXP-005 | P0 | Bangla in Markdown | UTF-8 text correct |
| EXP-006 | P0 | Line/stanza breaks | Original newlines preserved |
| EXP-007 | P1 | Quote attribution and metadata | Included correctly |
| EXP-008 | P1 | Tags and collection relationships | Present in JSON |
| EXP-009 | P1 | Empty archive export | Valid empty export or clear message |
| EXP-010 | P1 | Export network failure | Error; no false completion |
| EXP-011 | P1 | Bangla/special-character filenames | Safe filenames |
| EXP-012 | P1 | Backup warning | Explains private data is included |
| EXP-013 | P1 | Large archive export | No freeze or silent truncation |
| EXP-014 | P0 | Inspect export for secrets | No password/token/service key/session secret |

For fixtures, compare exported text byte-for-byte or through a controlled UTF-8 read.

---

# 9. Special states and edge conditions

Every applicable state must be implemented and tested. A screen with only its normal state is incomplete.

| ID | Condition | Required behavior |
|---|---|---|
| STATE-001 | First-time empty diary | First-entry state with clear action |
| STATE-002 | Empty type library | Type-specific empty state |
| STATE-003 | Empty collection | Invite adding writing |
| STATE-004 | No favorites | Calm empty state |
| STATE-005 | Empty Trash | Empty state |
| STATE-006 | Search no results | Explain no match; clear search |
| STATE-007 | Loading data | Stable loading indicator/skeleton |
| STATE-008 | Slow network | Responsive UI and progress |
| STATE-009 | Network unavailable at load | Retry state; not a false empty archive |
| STATE-010 | Network drops while editing | Preserve text; Offline/Unsaved state |
| STATE-011 | Save in progress | Saving; avoid duplicate submission |
| STATE-012 | Save succeeds | Saved only after server confirmation |
| STATE-013 | Save fails | Keep text; show Retry |
| STATE-014 | Stale save response | Newer text remains authoritative |
| STATE-015 | Session expires | Protect private data; preserve unsaved text if possible |
| STATE-016 | Invalid form data | Inline actionable validation |
| STATE-017 | Delete confirmation | Identify target and destructive action |
| STATE-018 | Delete canceled | No database change |
| STATE-019 | Delete succeeded | Archive/Trash updates |
| STATE-020 | Restore in progress | Progress; prevent duplicate action |
| STATE-021 | Restore succeeded | Entry returns to correct place |
| STATE-022 | Export in progress | Progress/disabled state |
| STATE-023 | Export failed | Retry; no false completion |
| STATE-024 | Theme not loaded | Avoid inconsistent theme flash where practical |
| STATE-025 | Mobile menu open | Overlay works and dismisses |
| STATE-026 | Mobile keyboard visible | Active field and essential actions reachable |
| STATE-027 | Long title | Wrap/truncate without hiding actions |
| STATE-028 | Very long poem | Editor/reader remain usable |
| STATE-029 | Optional metadata absent | No broken empty labels |
| STATE-030 | Unknown DB type/status | Safe fallback; no crash |
| STATE-031 | Deleted entry opened directly | Safe unavailable state |
| STATE-032 | Empty calendar date selected | Create-for-date works |
| STATE-033 | Multiple entries on one date | All are individually selectable |
| STATE-034 | No profile display name | Sensible fallback |
| STATE-035 | Reduced motion enabled | Reduce/remove nonessential motion |

---

# 10. Bangla, Unicode, typography, and text fidelity

This is a critical product requirement.

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| TXT-001 | P0 | Save Bangla vowel signs/conjuncts | Unchanged |
| TXT-002 | P0 | Save mixed Bangla/English | Both render correctly |
| TXT-003 | P0 | Save emoji and symbols | No replacement characters/data loss |
| TXT-004 | P0 | Save curly quotes, em dash, ellipsis | Original punctuation preserved |
| TXT-005 | P0 | Save multiple blank lines | Blank lines remain |
| TXT-006 | P0 | Save leading/trailing spaces | Not silently trimmed |
| TXT-007 | P0 | Save tabs/repeated spaces | Preserved or explicitly documented |
| TXT-008 | P0 | Save 10,000+ characters | Full text persists |
| TXT-009 | P0 | Copy from reading view | Clipboard matches original |
| TXT-010 | P0 | Export Markdown/JSON | Unicode/newlines survive |
| TXT-011 | P1 | Change font preference | Text data unchanged |
| TXT-012 | P1 | Switch theme | Shaping and line breaks remain correct |

Typography review:
- Hind Siliguri actually loads for Bangla.
- Fallback fonts have required glyphs.
- Vowel signs/diacritics are not clipped vertically.
- Bangla line-height is comfortable.
- Mixed-script lines align naturally.
- Poem line breaks remain visible.
- Metadata is legible.
- Font loading failure has a sensible fallback.
- Text is real text, not a rendered image.

The app must not auto-correct, translate, rewrite, summarize, trim, collapse newlines, replace punctuation, reorder stanzas, or send content to AI/analytics.

---

# 11. Database integrity and RLS security

UI hiding is not security. Test with direct API/database requests in staging.

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| SEC-001 | P0 | Anonymous SELECT entries | Denied/no private rows |
| SEC-002 | P0 | Anonymous SELECT collections | Denied/no private rows |
| SEC-003 | P0 | Anonymous SELECT tags | Denied/no private rows |
| SEC-004 | P0 | Owner reads own entries | Allowed |
| SEC-005 | P0 | Owner inserts with own `user_id` | Allowed |
| SEC-006 | P0 | Owner inserts with another user's ID | Denied |
| SEC-007 | P0 | QA B reads QA A entry by UUID | Denied |
| SEC-008 | P0 | QA B updates QA A entry by UUID | Denied |
| SEC-009 | P0 | QA B deletes QA A entry by UUID | Denied |
| SEC-010 | P0 | QA B attaches QA A tag/collection | Denied |
| SEC-011 | P0 | Join row references mismatched owners | Denied |
| SEC-012 | P0 | Owner updates own entry | Allowed |
| SEC-013 | P0 | Owner soft-deletes own entry | Allowed |
| SEC-014 | P0 | Verify RLS on every owner table | Enabled |
| SEC-015 | P0 | Inspect frontend bundle/network | No service-role secret |
| SEC-016 | P1 | SQL-injection-like search input | Treated as data |
| SEC-017 | P1 | Malformed UUID in route | Safe error, no crash |
| SEC-018 | P1 | Active archive query includes deleted rows | Deleted rows excluded |
| SEC-019 | P1 | Verify owner/timestamps on create | Correct values |
| SEC-020 | P1 | Verify join cleanup | Parent writing not unexpectedly deleted |

Database constraints:
- UUID primary keys unique.
- Foreign keys reject orphan relationships.
- Type/status checks reject unsupported values.
- Required content is not null.
- `entry_date` is distinct from `created_at`.
- `updated_at` changes on update.
- Duplicate tag/collection rules work.
- Soft delete does not unintentionally cascade-delete.
- Permanent deletion cleans up join rows.
- Common owner/date/type queries use appropriate indexes.

Privacy/secrets:
- Service-role key is never in `VITE_*` variables or browser bundles.
- Private writing is absent from analytics and error breadcrumbs.
- No private content in URL parameters.
- Do not keep the only copy of a draft in ephemeral component state.
- Do not expose account email unnecessarily.
- No unapproved third-party transmission of entries.

---

# 12. Visual and interaction QA

Compare all screens to the approved VerseVault diary mockup and design specification.

Check:
- Warm paper/ivory surfaces and dark ink.
- Restrained brown/maroon accents.
- Consistent navigation desktop/mobile.
- Hind Siliguri for Bangla.
- Appropriate English literary typography.
- Clear hierarchy for title, metadata, actions, and body.
- Consistent spacing, borders, radii, shadows, and controls.
- Empty/error states fit the same visual language.
- Decorative elements never overpower writing.

Reject/revise if:
- Home is dominated by oversized KPI cards.
- Every page is a generic dashboard-card grid.
- Editor feels like a long mandatory form.
- Reading view is too wide or cramped.
- Textured surfaces reduce contrast.
- Excessive gradients, glassmorphism, animation, or bright SaaS-blue styling appear.
- Mobile is merely a squeezed desktop view.

Every interactive element must work by mouse, keyboard (where appropriate), and touch. Focus must be visible. Loading must prevent accidental duplicate submissions. Success/error feedback must reflect actual outcomes.

---

# 13. Accessibility tests

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| A11Y-001 | P1 | Navigate without mouse | Core flows keyboard-operable |
| A11Y-002 | P1 | Inspect focus | Visible focus indicator |
| A11Y-003 | P1 | Open/close dialog | Focus managed and returned |
| A11Y-004 | P1 | Icon-only controls | Accessible name/label |
| A11Y-005 | P1 | Screen reader forms | Labels and validation associated |
| A11Y-006 | P1 | Contrast review | WCAG AA where practical |
| A11Y-007 | P1 | Zoom 200% | Core content usable |
| A11Y-008 | P1 | Reduced motion | Preference respected |
| A11Y-009 | P1 | Save/error updates | Status changes announced appropriately |
| A11Y-010 | P1 | Calendar keyboard use | Date selection accessible |

Use semantic landmarks/headings/buttons/labels. Do not communicate state by color alone.

---

# 14. Performance and reliability

| ID | Priority | Scenario | Expected result |
|---|---|---|---|
| PERF-001 | P1 | Load home with typical archive | Prompt, non-blocking render |
| PERF-002 | P1 | Archive with 1,000 synthetic entries | Pagination/incremental loading |
| PERF-003 | P1 | Search large archive | Responsive and correct |
| PERF-004 | P1 | Open 10,000-character entry | Usable editor/reader |
| PERF-005 | P1 | Type in long entry | No severe input lag |
| PERF-006 | P1 | Repeated navigation | No memory/subscription leaks |
| PERF-007 | P1 | Slow network | Clear loading/save feedback |
| PERF-008 | P0 | Database outage during save | Recoverable text; no false Saved |
| PERF-009 | P1 | Refresh during load | Safe recovery/error |
| PERF-010 | P1 | Double-click create/save | No accidental duplicate |
| PERF-011 | P1 | Rapid favorite toggle | Final DB state matches last action |
| PERF-012 | P1 | Large export | No silent truncation/corruption |

Record device, browser, network, fixture size, and timings for performance results.

---

# 15. Automated testing strategy

Use existing project tooling where possible. Do not add a large framework without need.

Recommended coverage:
- **Unit:** date utilities, filters, word count, filenames, export serialization, content helpers.
- **Component:** editor states, dialogs, navigation, filters, empty/error states.
- **Integration:** Supabase CRUD, auth, autosave, collection/tag relationships.
- **E2E:** owner journeys in a real browser.
- **Security:** direct API/database RLS tests in staging.
- **Visual:** screenshots of key desktop/mobile screens.

Potential tools: Vitest, React Testing Library, Playwright, Supabase local/staging, pgTAP if already supported.

## 15.1 Mandatory end-to-end journeys

**E2E-001 — First journal entry**
1. Sign in as QA owner.
2. Open My Journal.
3. Click Write Today's Entry.
4. Enter Bangla title and multi-line content.
5. Wait for confirmed Saved.
6. Refresh.
7. Reopen.
8. Verify exact content and date.

**E2E-002 — Poem lifecycle**
1. Create multi-stanza poem.
2. Add collection and two tags.
3. Favorite.
4. Open reading view and copy text.
5. Edit one line and refresh.
6. Archive and restore.
7. Verify content and metadata.

**E2E-003 — Calendar/backdating**
1. Navigate to previous month.
2. Select empty date.
3. Create diary entry.
4. Verify timeline grouping and calendar marker.
5. Create second entry on same date.
6. Verify both entries.

**E2E-004 — Search/retrieval**
1. Create Bangla and English entries.
2. Search Bangla phrase and English phrase.
3. Combine search with type/tag filters.
4. Clear filters.
5. Verify matching and no-results states.

**E2E-005 — Delete/restore**
1. Soft-delete a fixture.
2. Verify it leaves active views.
3. Open Trash and restore.
4. Verify date/content/type/relations.
5. Permanently delete a separate disposable fixture after confirmation.
6. Verify it cannot be retrieved.

**E2E-006 — Export integrity**
1. Create Bangla, English, and mixed fixtures.
2. Include blank lines, punctuation, emoji, tags, collection, attribution.
3. Export Markdown ZIP and JSON.
4. Parse/open files.
5. Compare content.
6. Verify no secrets.

**E2E-007 — RLS isolation**
1. QA A creates private entry.
2. Sign in as QA B.
3. Attempt read/update/delete by UUID.
4. Verify denied.
5. Sign out and attempt anonymous query.
6. Verify no private rows.

**E2E-008 — Mobile writing**
1. Set 390px and 360px viewport.
2. Open mobile navigation.
3. Create diary entry.
4. Type long Bangla text with blank lines.
5. Confirm save status remains reachable.
6. Hide keyboard; inspect layout.
7. Reopen and edit.
8. Verify exact content and no horizontal overflow.

**E2E-009 — Offline recovery**
1. Open saved fixture.
2. Simulate offline.
3. Add text.
4. Verify Offline/Unsaved.
5. Use only the documented recovery path; do not risk real data.
6. Reconnect and retry.
7. Verify exact latest server content.

**E2E-010 — Responsive tour**
1. Visit each main screen at desktop.
2. Capture screenshots.
3. Repeat at mobile.
4. Check navigation, clipping, overlays, actions, and overflow.
5. Record every failure.

---

# 16. Regression checklist

Run relevant tests after every material change; run every P0 and core E2E journey before release.

- [ ] Sign in/sign out.
- [ ] Protected routes.
- [ ] Create diary entry.
- [ ] Create poem.
- [ ] Edit/autosave.
- [ ] Refresh/persistence.
- [ ] Bangla/mixed script preservation.
- [ ] Stanza and blank-line preservation.
- [ ] Reading view.
- [ ] Bangla/English search.
- [ ] Calendar/backdating.
- [ ] Collections and tags.
- [ ] Favorites.
- [ ] Archive/restore.
- [ ] Trash/permanent-delete confirmation.
- [ ] Markdown ZIP export.
- [ ] JSON export.
- [ ] Anonymous RLS denial.
- [ ] Owner isolation.
- [ ] Desktop layout.
- [ ] Mobile layout.
- [ ] No dead controls or console errors.

---

# 17. Release gates — GO / NO-GO

## Gate A — Core writing safety (P0)

- [ ] Create/edit entries works.
- [ ] Autosave reports success only after server confirmation.
- [ ] Failed save does not silently lose text.
- [ ] Refresh after save preserves exact content.
- [ ] Newlines, blank lines, punctuation, whitespace, and Unicode tests pass.
- [ ] Large-entry test passes.
- [ ] Double submission does not create duplicates.

## Gate B — Privacy and security (P0)

- [ ] Anonymous access denied.
- [ ] RLS enabled on every owner-owned table.
- [ ] Cross-account read/update/delete denied.
- [ ] Join-table ownership validated.
- [ ] No service-role key exposed.
- [ ] No public signup, publish, or share feature.
- [ ] Private text absent from analytics/error logs.

## Gate C — Core functionality (P1)

- [ ] Timeline.
- [ ] Calendar and backdating.
- [ ] Poems, quotes, fragments, prose.
- [ ] Reading view.
- [ ] Bangla and English search.
- [ ] Collections and tags.
- [ ] Favorites.
- [ ] Archive/trash/restore.

## Gate D — Responsive/design (P1)

- [ ] Desktop wide and compact pass.
- [ ] Tablet pass.
- [ ] Mobile large and small pass.
- [ ] Mobile keyboard does not make editor unusable.
- [ ] Diary-like design direction maintained.
- [ ] No horizontal overflow or clipped primary action.

## Gate E — Backup/release hygiene

- [ ] Markdown ZIP works.
- [ ] JSON export works.
- [ ] Export preserves Bangla and line breaks.
- [ ] Relationships included.
- [ ] Export excludes secrets.
- [ ] Migrations recorded and reproducible.
- [ ] Production environment variables verified.
- [ ] Error/empty states present.
- [ ] No mock data remains.
- [ ] No placeholder/dead controls remain.
- [ ] Untested targets and known issues disclosed.

**GO:** All P0 pass, no open critical/high security issue, all P1 pass or have owner-accepted workarounds, and evidence is recorded.

**NO-GO:** Any P0 failure, private data exposure, unverified RLS, silent data-loss path, missing core editor behavior, or inaccurate test reporting.

---

# 18. Defect report template

```text
Defect ID:
Title:
Priority:
Affected screen/feature:
Environment:
Browser/device/viewport:
Build/commit:

Preconditions:
Steps to reproduce:
Expected result:
Actual result:

Reproducibility/frequency:
Screenshot/video:
Console/network evidence:
Database evidence (if relevant):

Possible cause:
Fix:
Regression tests added:
Status: OPEN / IN PROGRESS / FIXED / VERIFIED
Verified by:
Verification date:
```

A defect is VERIFIED only after reproducing the original failure, applying the fix, rerunning the original test, and running relevant regression tests.

---

# 19. Phase-by-phase execution plan

## Phase 1 — Visual foundation
Test design tokens/fonts, desktop/mobile shell, navigation, My Journal, timeline, calendar preview, and empty states. Do not claim backend behavior is tested with mock data.

## Phase 2 — Supabase and authentication
Test owner login/logout/reset, protected routes, tables, constraints, indexes, triggers, RLS API checks, and secret exposure. Do not store real personal writing until this gate passes.

## Phase 3 — Editor and autosave
Test all content types, Bangla/English fidelity, debounce, failed save/retry, offline handling, race conditions, refresh persistence, and reading view. Resolve all P0 failures.

## Phase 4 — Archive and discovery
Test timeline, calendar, date navigation, search, filters, sorting, collections, tags, favorites, archive/trash/restore.

## Phase 5 — Settings and backup
Test preferences, Markdown ZIP, JSON, export integrity, and backup warning.

## Phase 6 — Final audit
Run all P0 and applicable P1 tests, E2E journeys, staging RLS tests, desktop/mobile checks, and export validation. Remove fixtures/mock data. Produce evidence-backed GO/NO-GO report.

---

# 20. Copy/paste instruction for Lovable or the coding agent

```text
Treat the VerseVault QA & Testing specification as a mandatory acceptance
contract, not optional guidance.

Before changes:
1. Inspect the current application and repository.
2. Read the product implementation spec and QA document.
3. Identify the feature and related test IDs.
4. List existing behavior that must not regress.

While implementing:
1. Preserve the private, single-owner product model.
2. Preserve the diary-like visual direction.
3. Implement loading, empty, success, error, offline, and destructive
   confirmation states as applicable.
4. Preserve Bangla/English, Unicode, whitespace, punctuation, blank lines,
   and stanza breaks exactly.
5. Never fake persistence success.
6. Keep RLS as the security boundary.
7. Never expose service-role secrets.
8. Do not add public publishing, sharing, signup, or social features.
9. Do not log private writing content.
10. Do not leave mock data or dead controls in a completed feature.

After implementation:
1. Run relevant unit/component tests.
2. Run relevant browser/E2E tests.
3. Verify Supabase persistence and database effects.
4. Test desktop and mobile.
5. Verify text fidelity.
6. Verify relevant privacy/RLS behavior.
7. Record every test as PASS, FAIL, BLOCKED, NOT RUN, or NOT APPLICABLE.
8. Attach real evidence for every PASS.
9. Fix P0 failures before proceeding.
10. Run regression tests after each fix.

Never claim a test passed if it was not executed.
Never label NOT RUN or BLOCKED as passed.
Never claim complete coverage while applicable tests remain untested.

At the end, produce the final report format from this document and make
a GO/NO-GO recommendation based on the release gates. If a test cannot
run, explain the blocker and leave it BLOCKED or NOT RUN.
```

---

# 21. Final quality principle

VerseVault stores words that may be personally meaningful and impossible to recreate.

A beautiful interface with unreliable saving is a failed diary.  
A working editor that exposes private writing is a failed diary.  
A feature list with untested mobile and error states is not complete.

**Final standard:** Every thought must remain exactly as its owner wrote it, safely stored, privately accessible, and easy to find again.
