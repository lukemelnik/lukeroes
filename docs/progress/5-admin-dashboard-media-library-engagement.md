# Progress: #5 Admin Dashboard, Media Library & Engagement

Issue: https://github.com/lukemelnik/lukeroes/issues/5
Started: 2026-03-27
Last Updated: 2026-03-27

## Status

Current Sprint: Sprint 1

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

## Implementation Notes

- The repo did not have a tracked Drizzle migration baseline, so Sprint 1 ships the schema in code plus validation; apply the updated schema to environments with `drizzle-kit push` or an equivalent reviewed migration plan before deploying.
- `storage.service.ts` now treats absolute URLs as pass-through media keys so the existing seed data still renders while the new media-variant model is phased in.

## Blockers
