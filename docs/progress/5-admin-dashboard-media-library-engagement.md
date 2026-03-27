# Progress: #5 Admin Dashboard, Media Library & Engagement

Issue: https://github.com/lukemelnik/lukeroes/issues/5
Started: 2026-03-27
Last Updated: 2026-03-27

## Status

Current Sprint: Sprint 3

## Completed Work

### Sprint 1: Core schema and backend foundations

Completed: 2026-03-27

- Task 1.1: Extend core schema for posts, media, engagement, membership history, audit logging, and rate limiting - DONE
  - Added foundational Drizzle tables, indexes, relations, and seed updates for media variants, post/media usage, likes, comments, comment votes, notifications, membership events, admin audit logs, and rate-limit events.
  - Files: `packages/db/src/schema/membership.ts`, `packages/db/src/seed.ts`, `packages/db/src/index.ts`
- Task 1.2: Add backend/domain helpers for UTC timestamps, slugging, reading time, membership resolution, scheduling, request metadata, and UUIDv7 asset keys - DONE
  - Added reusable server helpers for UTC ISO handling, post slug uniqueness, reading-time calculation, publication-state resolution, request IP/user-agent extraction, membership resolution, UUIDv7 media asset keys, and admin/member context propagation.
  - Files: `apps/web/src/server/utc.ts`, `apps/web/src/server/post-helpers.server.ts`, `apps/web/src/server/request.server.ts`, `apps/web/src/server/membership.server.ts`, `apps/web/src/server/id.server.ts`, `apps/web/src/middleware/member.ts`, `apps/web/src/middleware/admin.ts`
- Task 1.3: Wire server-side data-layer foundations for media, likes, comments, notifications, membership events, audit logs, and rate limiting - DONE
  - Added backend services for media lifecycle rules, audit logging, membership-event recording, notification creation, post likes, comment moderation, and DB-backed rate limiting, plus Stripe lifecycle hooks and server-side post/media integrations.
  - Files: `apps/web/src/server/media.server.ts`, `apps/web/src/server/posts.server.ts`, `apps/web/src/server/post-likes.server.ts`, `apps/web/src/server/comments.server.ts`, `apps/web/src/server/notifications.server.ts`, `apps/web/src/server/membership-events.server.ts`, `apps/web/src/server/audit-log.server.ts`, `apps/web/src/server/rate-limit.server.ts`, `packages/auth/src/index.ts`, `packages/auth/src/membership-events.ts`
- Task 1.4: Add validation coverage for core backend helpers - DONE
  - Added direct Node/tsx tests for slugging, publication states, cursor encoding, request metadata parsing, UUIDv7 generation, and UTC ISO utilities, and added repository check-types scripts plus a root test script.
  - Files: `apps/web/src/server/core-foundations.test.ts`, `package.json`, `packages/db/package.json`, `packages/auth/package.json`

### Sprint 2: Media ingestion and library UX

Completed: 2026-03-27

- Task 2.1: Complete image upload ingestion, processing, and persistence - DONE
  - Added a streaming multipart admin image upload endpoint that validates magic bytes, streams originals through the server, generates Sharp display/thumb WebP variants, and persists media plus variant metadata in the new tables.
  - Files: `apps/web/src/server/image-upload.server.ts`, `apps/web/src/server/media.server.ts`, `apps/web/src/server/admin-request.server.ts`, `apps/web/src/server/services/storage.service.ts`, `apps/web/src/routes/api/admin/media/images.ts`, `apps/web/src/lib/media.ts`, `apps/web/src/lib/media-upload-client.ts`, `apps/web/package.json`, `pnpm-lock.yaml`
- Task 2.2: Complete audio direct-upload initiation and confirmation - DONE
  - Added admin server functions and client helpers for presigned audio uploads to R2, client-side duration and waveform extraction, upload confirmation, and storage-backed ready-state verification before persisting metadata.
  - Files: `apps/web/src/functions/media.functions.ts`, `apps/web/src/server/media.server.ts`, `apps/web/src/server/services/storage.service.ts`, `apps/web/src/lib/media.ts`, `apps/web/src/lib/media-upload-client.ts`
- Task 2.3: Build the admin media library and reusable media picker UX - DONE
  - Added the `/admin/media` admin route, shared media library UI, picker dialog, upload panel, filtering/search, status/access metadata, alt-text editing, safe delete actions, waveform previews, and drag reorder support for multi-select workflows.
  - Files: `apps/web/src/routes/(nav)/admin/media/index.tsx`, `apps/web/src/components/admin/media-library-manager.tsx`, `apps/web/src/components/admin/media-library-shared.tsx`, `apps/web/src/components/admin/media-picker-dialog.tsx`, `apps/web/src/components/admin/audio-waveform.tsx`, `apps/web/src/routeTree.gen.ts`
- Task 2.4: Add validation coverage for media helper behavior - DONE
  - Added direct tests covering image signature detection, waveform peak extraction, list reordering, filename validation, and UI duration formatting helpers.
  - Files: `apps/web/src/server/media-helpers.test.ts`

## Implementation Notes

- The repo did not have a tracked Drizzle migration baseline, so Sprint 1 ships the schema in code plus validation; apply the updated schema to environments with `drizzle-kit push` or an equivalent reviewed migration plan before deploying.
- `storage.service.ts` now treats absolute URLs as pass-through media keys so the existing seed data still renders while the new media-variant model is phased in.

## Blockers
