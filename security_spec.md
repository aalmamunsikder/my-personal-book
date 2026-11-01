# VerseVault Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Zero Public or Anonymous Access**: Every read (`get`, `list`) and write (`create`, `update`, `delete`) across `/profiles/{userId}`, `/entries/{entryId}`, `/collections/{collectionId}`, `/tags/{tagId}`, and `/settings/{userId}` requires an authenticated user with `request.auth != null` and `request.auth.token.email_verified == true`.
2. **Strict Owner Isolation**: Every document contains an immutable `userId` field that must equal `request.auth.uid` on creation, read, list query, update, and deletion. For `/profiles/{userId}` and `/settings/{userId}`, the path parameter `{userId}` must also equal `request.auth.uid`.
3. **Path ID Hardening**: All document IDs (`{userId}`, `{entryId}`, `{collectionId}`, `{tagId}`) must satisfy `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **Strict Key Allowlisting & Anti-Update-Gap**: Every `create` and `update` operation validates the complete document against `isValid[Entity](incoming())` enforcing exact `hasAll` and `hasOnly` key sets, strict field types, and bounded string/array lengths.
5. **Temporal & Identity Immutability**: `createdAt` and `updatedAt` must equal `request.time` on creation; on update, `userId` and `createdAt` are strictly immutable (`incoming().userId == existing().userId && incoming().createdAt == existing().createdAt`), and `updatedAt` must equal `request.time`.

## 2. The "Dirty Dozen" Payloads

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
