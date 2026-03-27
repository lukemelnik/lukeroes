# Progress: #5 Admin Dashboard, Media Library & Engagement

Issue: https://github.com/lukemelnik/lukeroes/issues/5
Started: 2026-03-27
Last Updated: 2026-03-27

## Status

Current Sprint: Sprint 5 (Complete)

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

### Sprint 3: Admin post authoring, Tiptap integration, and publishing

Completed: 2026-03-27

- Task 3.1: Build admin post management with status badges and admin-specific listing - DONE
  - Added `listAdminPosts` and `getAdminPostById` server functions that return all posts (not just published), with computed status badges (draft/scheduled/published). Updated admin posts list to use admin-specific queries with status indicators.
  - Files: `apps/web/src/server/posts.server.ts`, `apps/web/src/functions/posts.functions.ts`, `apps/web/src/routes/(nav)/admin/posts/index.tsx`, `apps/web/src/routes/(nav)/admin/posts/$postId.tsx`
- Task 3.2: Build custom Tiptap image extension with data-media-id and media picker toolbar - DONE
  - Created `MediaImage` custom Tiptap extension extending the Image node with `data-media-id` attribute support. Added image toolbar button, media picker integration, drag-drop image upload, and paste image upload to the editor.
  - Files: `apps/web/src/lib/tiptap-extensions.ts`, `apps/web/src/components/admin/tiptap-editor.tsx`
- Task 3.3: Implement comprehensive post creation/editing forms for all 4 post types - DONE
  - Rebuilt PostEditor with type-specific media attachment UIs: writing (Tiptap with inline images), audio (audio picker + artwork picker), photo (multi-image picker with drag reorder), note (Tiptap without inline images). Added scheduling UI (draft/schedule/publish), slug editing with auto-generation and manual override, and post preview link.
  - Files: `apps/web/src/components/admin/post-editor.tsx`
- Task 3.4: Implement post save flow with inline media sync and media attachment sync - DONE
  - Added `syncPostInlineMedia` that parses HTML, extracts `data-media-id` values, and syncs `post_media` rows with `role="inline"`. Added `syncPostMediaAttachments` with `rolesToSync` for deterministic clearing of artwork/audio/photo attachments on save.
  - Files: `apps/web/src/server/posts.server.ts`, `apps/web/src/functions/posts.functions.ts`
- Task 3.5: Add SEO meta tags per post in the route head function - DONE
  - Created `buildPostSeoHead` helper implementing spec rules: post title, excerpt/stripped description, OG image selection respecting members-only access (never exposing members-only media URLs to non-members), SSR-rendered via `beforeLoad` data.
  - Files: `apps/web/src/lib/post-seo.ts`, `apps/web/src/routes/(nav)/members/post/$slug.tsx`

### Sprint 4: Public-facing post rendering, engagement UX, and notifications

Completed: 2026-03-27

- Task 4.1: Expose comment, like, and notification server functions to the UI - DONE
  - Created `comments.functions.ts` (listComments, createComment, deleteComment, toggleVote), `likes.functions.ts` (togglePostLike, getPostLikeInfo), and `notifications.functions.ts` (listNotifications, unreadCount, markRead) with proper middleware and validation.
  - Files: `apps/web/src/functions/comments.functions.ts`, `apps/web/src/functions/likes.functions.ts`, `apps/web/src/functions/notifications.functions.ts`
- Task 4.2: Implement photo gallery layouts and lightbox - DONE
  - Built `FeedGallery` (1/2/3/4+ layouts per spec) and `DetailGallery` (masonry-style for 4+ using CSS columns with aspect ratio). Built `Lightbox` with dark blurred backdrop, prev/next nav, escape/backdrop close, swipe on mobile, image counter, visible captions.
  - Files: `apps/web/src/components/members/photo-gallery.tsx`, `apps/web/src/components/members/lightbox.tsx`, `apps/web/src/components/members/photo-post-card.tsx`
- Task 4.3: Implement post likes UI - DONE
  - Built `PostLikeButton` with optimistic toggle, filled heart for liked state, like count, and query invalidation. Integrated into post detail page.
  - Files: `apps/web/src/components/members/post-like-button.tsx`
- Task 4.4: Implement comments system end-to-end UI - DONE
  - Built `CommentsSection` with composer, threaded display (top-level newest first, replies nested one level chronological), admin badge/highlight, vote button, reply button, delete button, relative time, sign-in prompt for logged-out users, membership gate for locked posts.
  - Files: `apps/web/src/components/members/comments-section.tsx`
- Task 4.5: Implement notification bell and notifications list - DONE
  - Built `NotificationBell` with unread count badge (polling every 60s) in site header for logged-in users. Built `NotificationsList` with read/unread state, mark-all-read, and links to source posts.
  - Files: `apps/web/src/components/members/notification-bell.tsx`, `apps/web/src/components/members/notifications-list.tsx`, `apps/web/src/components/header.tsx`
- Task 4.6: Wire engagement into post detail page - DONE
  - Updated post detail page to render likes and comments below all post types, with proper access gating (members-only posts gate comments for non-members). Added userId to membership status for comment ownership checks.
  - Files: `apps/web/src/routes/(nav)/members/post/$slug.tsx`, `apps/web/src/functions/membership.functions.ts`, `apps/web/src/lib/members/types.ts`

## Implementation Notes

- The repo did not have a tracked Drizzle migration baseline, so Sprint 1 ships the schema in code plus validation; apply the updated schema to environments with `drizzle-kit push` or an equivalent reviewed migration plan before deploying.
- `storage.service.ts` now treats absolute URLs as pass-through media keys so the existing seed data still renders while the new media-variant model is phased in.
- The `@tiptap/extension-image` package was added as a dependency for Sprint 3's custom image extension.
- The custom `MediaImage` Tiptap extension stores `data-media-id` for stable media references; the save flow uses regex extraction rather than DOM parsing to avoid server-side JSDOM overhead for this simple pattern.
- `syncPostMediaAttachments` accepts a `rolesToSync` parameter to deterministically clear roles even when no attachments are present for that role, preventing orphaned media associations.
- Post SEO uses `beforeLoad` to fetch post data server-side, making all SEO tags available in the initial SSR HTML.
- The notification bell polls every 60 seconds for unread count. Future optimization could use SSE/WebSocket.
- `getPostImages` now returns `caption`, `width`, and `height` to support lightbox captions and masonry aspect ratios.
- `getMembershipStatusFn` now returns `userId` so the comments UI can determine comment ownership for delete permissions.

### Sprint 5: Admin dashboard, user management, comment moderation, account page

Completed: 2026-03-27

- Task 5.1: Admin dashboard at /admin with metric cards and Recharts charts - DONE
  - Built dashboard with total users, paid members, published posts, unseen comments metrics; user signup bar chart and paid member line chart with 30/60/90 day toggle.
  - Files: `apps/web/src/routes/(nav)/admin/index.tsx`, `apps/web/src/server/admin-dashboard.server.ts`, `apps/web/src/functions/admin-dashboard.functions.ts`
- Task 5.2: Admin sidebar layout with unseen comments badge - DONE
  - Built AdminSidebar component with Dashboard/Posts/Media/Users/Comments nav items and live unseen comment count badge.
  - Files: `apps/web/src/components/admin/admin-sidebar.tsx`
- Task 5.3: Admin user management at /admin/users - DONE
  - Built user list with name/email/role/joined/subscription columns; change role, ban/unban with reason dialog, impersonate, revoke sessions, gift membership actions with audit logging.
  - Files: `apps/web/src/routes/(nav)/admin/users/index.tsx`, `apps/web/src/functions/admin-users.functions.ts`, `apps/web/src/server/admin-users.server.ts`
- Task 5.4: Admin comments moderation at /admin/comments - DONE
  - Built moderation view with newest-first comments, unseen-only filter, mark seen/bulk mark all seen, tombstone delete actions.
  - Files: `apps/web/src/routes/(nav)/admin/comments/index.tsx`, `apps/web/src/functions/admin-comments.functions.ts`
- Task 5.5: User account page at /account - DONE
  - Built profile section (avatar/initials, editable name, read-only email, change password via authClient), subscription status/manage, notifications list, danger zone with typed DELETE confirmation and account deletion with comment anonymization.
  - Files: `apps/web/src/routes/(nav)/account.tsx`, `apps/web/src/functions/account.functions.ts`
- Task 5.6: Wire notification bell to /account and add sidebar to existing admin pages - DONE
  - Updated header notification bell link from /members to /account; added AdminSidebar to posts and media admin pages.
  - Files: `apps/web/src/components/header.tsx`, `apps/web/src/routes/(nav)/admin/posts/index.tsx`, `apps/web/src/routes/(nav)/admin/media/index.tsx`
- Task 5.7: Audit log entries for admin actions - DONE
  - All admin actions (role change, ban/unban, impersonation, revoke sessions, gift membership, comment moderation delete) write audit log entries with actor, target, metadata, IP, and user agent.
  - Files: `apps/web/src/functions/admin-users.functions.ts`

## Blockers
