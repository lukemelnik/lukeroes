# Membership System

## Context

**What:** A self-hosted membership platform on lukeroes.com that replaces Substack/Patreon — paid members get exclusive writing, audio (voice memos, demos, studio sessions), photos, and notes. Public posts are freely accessible for SEO and shareability. The frontend prototype is already built with mock data.

**Why:** You already bring your own audience. Platforms take 10-12% for infrastructure you mostly have. With auth, a database, a content system, and a mailing list already in place, the gap to a full membership system is small — and you keep 97% of revenue instead of 87-90%.

**Key Decisions:**

- **API layer: TanStack Start server functions.** No additional framework. The existing patterns (`createServerFn`, `authMiddleware`, `queryOptions`) handle everything with full type safety. Business logic is code-split into `.server.ts` files — framework-agnostic, portable. If a mobile app ever materializes, add oRPC or Hono wrappers that import the same server logic. Zero rewrite. Share image generation uses TanStack Start API routes (plain HTTP handlers, same pattern as `/api/auth/$` and `/api/health`). Stripe webhooks are handled by the Better Auth Stripe plugin through the existing `/api/auth/$` catch-all route — no separate webhook endpoint.
- **Drizzle-derived Zod schemas.** All validation schemas derived from Drizzle tables via `createInsertSchema`/`createSelectSchema` from `drizzle-zod` (must be added as a dependency — see Sprint 1). Single source of truth in the schema file — no hand-rolled Zod definitions in server functions. Follow the Songkeeper pattern in `comments-schema.ts` (`songkeeper/apps/api/src/domains/comments/comments-schema.ts`) with `.omit()` and `.extend()` for create/update variants. Note: the workspace uses Zod v4 — import from `zod/v4` when overriding field validators in `createInsertSchema`, matching the Songkeeper pattern.
- **Auto-increment integer IDs.** All new tables use `integer("id").primaryKey({ autoIncrement: true })`. Posts are identified in URLs by `slug` (not ID), and internal IDs (media, tags, junction tables) are never exposed to end users, so the ordering/count leakage tradeoff of auto-increment is irrelevant here. Simpler than generating UUIDs/nanoids, and SQLite's `ROWID` aliasing makes auto-increment the most performant option.
- **Chained middleware for auth/admin/member.** `authMiddleware` (exists, gets session) → `adminMiddleware` (chains auth, rejects non-admins) → `memberMiddleware` (chains auth, resolves `isMember` flag into context). Server function handlers contain zero auth logic — middleware handles it all.
- **Better Auth plugins: admin + Stripe.** Enable the Better Auth `admin` plugin (`better-auth/plugins/admin`) with `adminRoles: ["admin"]` — this adds a `role` column to the `user` table (default `"user"`). Enable the Better Auth `stripe` plugin (`@better-auth/stripe`) — this manages the `subscription` table automatically, handles Stripe customer creation on sign-up, webhook processing (via the existing `/api/auth/$` catch-all), and exposes client-side APIs for checkout/portal/cancellation. Follow Songkeeper's auth configuration in `songkeeper/apps/api/src/lib/auth.ts`. The single membership plan ($7/month) is defined inline in the Stripe plugin config — no `subscription_plan` table needed. MailerLite sync hooks (`onSubscriptionComplete`, `onSubscriptionCancel`) go in the plugin config and call the email service.
- **Auth: email/password + Google OAuth.** Email/password already configured in Better Auth. Add Google social provider to `packages/auth/src/index.ts` and "Sign in with Google" button to login page. Two auth methods only.
- **Two tiers only.** No account required to browse public content. Mailing list is email-only (no account). Membership is $7/month via Stripe Checkout. No free-with-account tier — that was friction for zero value in the old site. The Stripe Price is created manually in the Stripe dashboard; the Price ID is stored as `STRIPE_PRICE_ID` env var and referenced in the Better Auth Stripe plugin config.
- **Unified content home.** `/members` is the single home for all writing, audio, notes, and photos. The old standalone `/writing` section has been removed. Posts are either public (SEO-friendly, fully readable) or members-only (excerpt visible, content gated).
- **Persistent audio player: real `<audio>` element, simple context.** The current prototype is fake (setInterval counter, no actual audio). Replace with: a global `<audio>` element in a provider (Songkeeper's `AudioElementProvider` pattern — single element, survives navigation), paired with a simple React context for state (no XState). One track at a time — click play on a different post, it swaps the source. Proper event listeners on the audio element (canplay, timeupdate, ended, error → update context). No playlist, no continuous play, no repeat — just play/pause/seek/close.
- **SQLite + Litestream.** Replaces Postgres. Single file database, no separate DB process, simpler Docker setup. Litestream continuously replicates WAL changes to R2 — sub-second lag, zero data loss. Restore is one command. Perfect for a single-server, single-creator site. Full-text search uses SQLite FTS5 (replaces Postgres tsvector). FTS5 is SQLite's built-in full-text search engine — "virtual table" is just the SQLite API for it, not an external dependency. It ships with every SQLite build.
- **Storage: Cloudflare R2 direct.** All media (audio, images) stored on R2. Litestream backups also go to R2 — same bucket, separate prefixes (`media/` for uploads, `backups/` for Litestream). One account for everything. Simpler than Songkeeper's setup — no CDN layer needed for this volume. Wrap all R2 operations in a storage service (`src/server/services/storage.service.ts`) with a clean interface (`uploadFile`, `getSignedUrl`, `deleteFile`, `getPublicUrl`) so the provider is swappable without touching business logic.
- **Email service abstraction.** All email operations (MailerLite subscriber management, future Resend sends) go through a service interface (`src/server/services/email.service.ts`). The existing `subscribe-to-mailing-list.ts` pattern works but is inline — extract to a service so swapping MailerLite → Resend later is a single file change, not a grep-and-replace.
- **Stripe Checkout (hosted) via Better Auth.** No custom payment form or webhook endpoint. The Better Auth Stripe plugin handles checkout session creation, webhook verification, and subscription lifecycle — all through the existing `/api/auth/$` route. Stripe handles Apple Pay, Google Pay, tax, currencies. Client-side uses `authClient.subscription.upgrade({ plan: "member" })` to trigger checkout. Post-checkout welcome screen handles mailing list opt-in.
- **Content rendering: markdown via `react-markdown`.** Post content is stored as markdown in the database and rendered at runtime with `react-markdown` + `remark-gfm`, styled with `@tailwindcss/typography` prose classes. This replaces the old build-time content-collections pipeline (which only works for static MDX files). Songkeeper's blog prose styling (`songkeeper/apps/web/src/styles/app.css`) is a good reference for custom typography overrides.
- **React Query for all data fetching.** Feed uses `infiniteQueryOptions` with cursor-based pagination for infinite scroll. Individual post pages use `queryOptions` with `ensureQueryData` in route loaders for SSR. Follow the existing `use-music.ts` → `get-music.ts` pattern.
- **Single author, with `author_id`.** This is a single-creator site, but `author_id` is included on the `posts` table as a trivial FK to `user.id` — costs nothing and avoids a schema change if collaboration is ever added.
- **Reading time: computed on save.** `reading_time` is calculated from word count (content length / 200 WPM) and stored as a string (e.g., "4 min read") on the `posts` table. Computed on create and re-computed on update. More performant than computing on every read.
- **OG images: static, not generated.** Standard OG image (promo photo + branding) shared across posts, or per-post featured image when one exists. Dynamic text-on-image generation is reserved for the Instagram share tool in admin (Sprint 4) — not for OG tags.

**Relevant Files (this project):**

- `packages/db/src/schema/auth.ts` — existing user/session/account tables; new membership tables go alongside
- `packages/db/src/index.ts` — Drizzle client (Postgres pre-Sprint 0, SQLite after)
- `packages/auth/src/index.ts` — Better Auth setup; needs Google OAuth, admin plugin, and Stripe plugin added
- `apps/web/src/routes/(nav)/login.tsx` — existing login page (email/password only); needs Google sign-in button
- `apps/web/src/components/sign-in-form.tsx` — sign-in form; add Google OAuth button
- `apps/web/src/components/sign-up-form.tsx` — sign-up form; add Google OAuth button
- `apps/web/src/middleware/auth.ts` — existing auth middleware; new `adminMiddleware` and `memberMiddleware` chain from this
- `apps/web/src/functions/subscribe-to-mailing-list.ts` — existing MailerLite integration; extract to email service
- `apps/web/src/functions/get-music.ts` + `apps/web/src/hooks/use-music.ts` — pattern for server function → queryOptions → component
- `apps/web/src/routes/api/auth/$.ts` — catch-all auth route; Better Auth Stripe plugin webhooks flow through here automatically
- `apps/web/src/lib/members/audio-player-context.tsx` — current fake player; replace with real `<audio>` element approach
- `apps/web/src/components/members/persistent-player.tsx` — player UI; keep, wire to real audio context
- `apps/web/src/routes/(nav)/members/index.tsx` — frontend prototype (mock data)
- `apps/web/src/routes/(nav)/members/post/$slug.tsx` — post detail page prototype
- `apps/web/src/lib/members/mock-data.ts` — data structures and types for all post types
- `apps/web/src/routes/(nav)/route.tsx` — nav layout with AudioPlayerProvider (MembershipProvider moves to members route)
- `apps/web/src/lib/auth-client.ts` — auth client; needs admin, Stripe, and inferAdditionalFields plugins added

**Songkeeper references (use as primary pattern source):**

- `songkeeper/apps/api/src/lib/auth.ts` — Better Auth config with admin plugin, Stripe plugin, subscription hooks, plan loading
- `songkeeper/apps/web/src/lib/auth-client.ts` — client-side auth with `stripeClient`, `adminClient`, `inferAdditionalFields` plugins
- `songkeeper/apps/web/src/contexts/audio-element-context.tsx` — global `<audio>` element provider pattern (single ref, rendered in provider, survives navigation)
- `songkeeper/apps/api/src/domains/comments/comments-schema.ts` — Drizzle-Zod schema derivation with `.omit()` / `.extend()` pattern
- `songkeeper/apps/api/src/domains/contacts/contacts-repository.ts` — cursor-based infinite pagination with `limit + 1` pattern
- `songkeeper/apps/web/src/styles/app.css` — prose/typography styling for rendered markdown
- `songkeeper/apps/web/src/routes/(nav)/blog/$slug.tsx` — MDX content rendering with custom components

**Constraints:**

- Deployed via Docker on a VPS with Traefik reverse proxy (not serverless)
- SQLite database with Litestream continuous replication to R2 (migrated from Postgres in Sprint 0)
- Full-text search uses SQLite FTS5 (replaces Postgres tsvector)
- R2 pre-signed URLs for uploads; public bucket or signed URLs for serving depending on visibility
- Google OAuth requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars
- Stripe requires `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRICE_ID` env vars
- Litestream requires `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and R2 endpoint config

**Dependencies to install:**

- Sprint 0: `better-sqlite3`, `@types/better-sqlite3` (in `packages/db`)
- Sprint 1: `drizzle-zod` (in `packages/db`), `@better-auth/stripe` + `stripe` (in `packages/auth`), `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (in `apps/web`)
- Sprint 2: `react-markdown`, `remark-gfm` (in `apps/web`)

**Code Organization:**

```
packages/db/src/schema/
  index.ts                        ← barrel export re-exporting all schema files
  auth.ts                         ← existing auth tables (user, session, account, verification)
  membership.ts                   ← posts, media, tags tables + derived Zod schemas

packages/auth/src/
  index.ts                        ← Better Auth config with admin, stripe, google plugins

apps/web/src/
  middleware/
    auth.ts                       ← existing: gets session → context
    admin.ts                      ← chains authMiddleware, rejects non-admin (checks user.role)
    member.ts                     ← chains authMiddleware, resolves isMember → context
  server/
    posts.server.ts               ← DB queries, business logic (framework-agnostic)
    tags.server.ts                ← tag queries
    services/
      storage.service.ts          ← R2 wrapper (uploadFile, getSignedUrl, deleteFile, getPublicUrl)
      email.service.ts            ← MailerLite wrapper (addSubscriber, removeSubscriber, addToGroup)
  functions/
    posts.functions.ts            ← thin createServerFn wrappers using derived schemas
    media.functions.ts
    tags.functions.ts
  hooks/
    use-posts.ts                  ← queryOptions + infiniteQueryOptions for React Query
  lib/members/
    audio-player-context.tsx      ← real <audio> element + simple React context (replace fake)
    membership-context.tsx        ← real isMember from auth session (scoped to members route)
  routes/
    api/
      share-image/$slug.ts        ← PNG generation (plain HTTP)
```

Note: No custom Stripe webhook route, `stripe.server.ts`, `stripe.functions.ts`, `subscription.server.ts`, or `use-subscription.ts` needed — the Better Auth Stripe plugin handles subscription lifecycle, webhook processing, and client-side subscription APIs. The `subscription` table is auto-managed by Better Auth.

## Scope

**In:**

- Database schema with Drizzle-derived Zod schemas (posts, media, tags — no custom Stripe tables)
- Better Auth plugins: Google OAuth, admin (role management), Stripe (subscriptions, checkout, webhooks)
- Chained middleware (auth → admin, auth → member)
- Server functions for posts CRUD, media uploads, search
- Real persistent audio player (global `<audio>` element, survives navigation)
- Wire frontend prototype to real data with React Query (infinite scroll for feed)
- R2 media storage via swappable storage service
- Email operations via swappable email service
- Post-checkout welcome flow with mailing list opt-in
- SQLite FTS5 full-text search
- Content rendering with `react-markdown` + `remark-gfm` + prose styling
- Admin posting flow
- MailerLite segment sync for paid members (via Stripe plugin hooks)
- Social share image generation for Instagram (admin-only tool, Satori/Resvg)

**Out:**

- Resend migration (future — email service abstraction makes this a single file swap)
- Mobile app (code-split `.server.ts` files future-proof this)
- Comments or likes (v2)
- Email notifications on new posts (v2)
- Video hosting
- Custom OG image generation (use static image or featured image per post)
- Drip/automation sequences
- Custom Stripe webhook endpoint (Better Auth Stripe plugin handles this)

## Tasks

### Sprint 0: Postgres → SQLite + Litestream

#### Task 0a: Swap Drizzle to SQLite

Replace Postgres driver with SQLite. Changes:

- `packages/db/package.json` — replace `postgres` dependency with `better-sqlite3` and `@types/better-sqlite3`
- `packages/db/src/index.ts` — swap `drizzle(postgres(...))` for `drizzle(new Database(...))` using `drizzle-orm/better-sqlite3`. Database path from `DATABASE_PATH` env var (e.g., `/data/lukeroes.db` in production, `./lukeroes.db` in dev)
- `packages/db/drizzle.config.ts` — change dialect to `sqlite`, change `dbCredentials` to `{ url: process.env.DATABASE_PATH }`
- `packages/db/src/schema/auth.ts` — swap `pgTable` → `sqliteTable`, `timestamp` → `text` (store ISO 8601 strings), `boolean` → `integer` (0/1). Import from `drizzle-orm/sqlite-core` instead of `drizzle-orm/pg-core`
- `packages/auth/src/index.ts` — change `provider: "pg"` to `provider: "sqlite"`

Enable WAL mode on database open for concurrent reads: `db.run("PRAGMA journal_mode = WAL")`.

No data migration needed — the site is pre-launch, no production user data to preserve.

**Done when:**

- [ ] `pnpm db:push` creates SQLite database file with auth tables
- [ ] Dev server starts and auth (sign up, sign in, session) works against SQLite
- [ ] `pnpm db:studio` opens and shows SQLite tables
- [ ] WAL mode is enabled (`.db-wal` file appears on first write)

#### Task 0b: Litestream + Docker

Add Litestream to the Docker image for continuous SQLite replication to R2. Changes:

- `Dockerfile` — add Litestream binary (download from GitHub releases for Alpine), copy `litestream.yml` config, change entrypoint to `litestream replicate -exec "node .output/server/index.mjs"`
- Create `litestream.yml` — configure replication of the database file to the shared R2 bucket under the `backups/` prefix, using `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, R2 endpoint env vars
- `docker-compose.yml` — remove `postgres` service and `postgres-data` volume. Add a `sqlite-data` volume mounted at `/data`. Remove `depends_on: postgres` and postgres healthcheck from app service. Add R2 credential env vars.
- Add a `restore.sh` script that runs `litestream restore` to pull the latest backup from R2 — used for disaster recovery or spinning up a new server.

**Done when:**

- [ ] Docker image builds with Litestream included
- [ ] Container starts with Litestream wrapping the Node process
- [ ] Litestream replicates to R2 (verify with `aws s3 ls` or R2 dashboard)
- [ ] `restore.sh` can pull the database from R2 to a fresh volume
- [ ] No postgres service in docker-compose.yml
- [ ] Health check still works

### Sprint 1: Foundation

#### Task 1: Database schema

Add `packages/db/src/schema/membership.ts` with Drizzle tables using `sqliteTable`. Add `packages/db/src/schema/index.ts` barrel export re-exporting `auth.ts` and `membership.ts`. Install `drizzle-zod` in `packages/db`.

**`posts` table** (all new tables use `integer("id").primaryKey({ autoIncrement: true })`):

- `id` — integer PK, auto-increment
- `author_id` — text, FK → `user.id`, not null
- `type` — text, not null (`"writing"` | `"audio"` | `"note"` | `"photo"`)
- `visibility` — text, not null, default `"members"` (`"public"` | `"members"`)
- `format` — text, nullable (only for writing: `"essay"` | `"poetry"`)
- `label` — text, nullable (only for audio: `"voice-memo"` | `"demo"` | `"early-listen"` | `"studio-session"`)
- `slug` — text, not null, unique
- `title` — text, nullable (audio + writing have titles; notes/photos may not)
- `excerpt` — text, nullable
- `content` — text, nullable (markdown for writing, description for audio, text for notes)
- `reading_time` — text, nullable (computed on save: word count / 200 WPM, e.g., "4 min read")
- `published_at` — text, nullable (ISO 8601; null = draft)
- `created_at` — text, not null, default `sql\`(datetime('now'))\``
- `updated_at` — text, not null, default `sql\`(datetime('now'))\``

**`media` table:**

- `id` — integer PK, auto-increment
- `type` — text, not null (`"audio"` | `"image"`)
- `file_key` — text, not null (R2 object key)
- `url` — text, nullable (public URL, populated after upload confirmation)
- `duration` — integer, nullable (seconds, for audio)
- `width` — integer, nullable (for images)
- `height` — integer, nullable (for images)
- `alt` — text, nullable (for images)
- `created_at` — text, not null, default `sql\`(datetime('now'))\``

**`post_media` junction table:**

- `post_id` — integer, not null, FK → `posts.id` with `onDelete: "cascade"`
- `media_id` — integer, not null, FK → `media.id` with `onDelete: "cascade"`
- `role` — text, not null (`"artwork"` | `"audio"` | `"photo"`)
- `display_order` — integer, not null, default 0
- Composite primary key: `(post_id, media_id)`

**`tags` table:**

- `id` — integer PK, auto-increment
- `name` — text, not null, unique
- `slug` — text, not null, unique

**`post_tags` junction table:**

- `post_id` — integer, not null, FK → `posts.id` with `onDelete: "cascade"`
- `tag_id` — integer, not null, FK → `tags.id` with `onDelete: "cascade"`
- Composite primary key: `(post_id, tag_id)`

No custom Stripe tables — the Better Auth Stripe plugin auto-manages its own `subscription` table.

**FTS5 full-text search:** FTS5 is SQLite's built-in full-text search engine. Create a `posts_fts` virtual table via raw SQL (`db.run(sql\`CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(title, excerpt, content, content=posts, content_rowid=id)\`)`) — Drizzle doesn't support virtual table definitions natively, so this runs as a raw statement on DB init or in a migration. Keep the FTS index in sync using SQLite triggers (not application code — triggers can't be forgotten on a code path):

- `INSERT` trigger: inserts into `posts_fts` after post creation
- `UPDATE` trigger: deletes old entry + inserts new entry in `posts_fts`
- `DELETE` trigger: deletes from `posts_fts`

**Zod schema derivation:** Follow the Songkeeper `comments-schema.ts` pattern exactly. For each table:

1. `createInsertSchema(table, { ...overrides })` with refined validators (e.g., `slug: z.string().min(1).max(200)`)
2. `createSelectSchema(table)` for read types
3. Derive `createPostSchema` via `.omit({ id: true, createdAt: true, updatedAt: true })` + `.extend(...)` as needed
4. Derive `updatePostSchema` via `.partial().required({ id: true })`
5. Export `z.infer<>` types: `Post`, `CreatePostInput`, `UpdatePostInput`, etc.

**Mock data → DB mapping:** When wiring the frontend (Sprint 3), the mock types map to DB rows as follows:

- `BasePost.memberOnly: boolean` → `posts.visibility` (`memberOnly ? "members" : "public"`)
- `AudioPost.description` → `posts.content`
- `AudioPost.duration` → joined from `media.duration` via `post_media` (role `"audio"`)
- `AudioPost.artworkUrl` → joined from `media.url` via `post_media` (role `"artwork"`)
- `AudioPost.label` → `posts.label`
- `WritingPost.readingTime` → `posts.reading_time`
- `WritingPost.content` → `posts.content` (markdown)
- `WritingPost.excerpt` → `posts.excerpt`
- `PhotoPost.images[]` → joined from `media` via `post_media` (role `"photo"`, ordered by `display_order`)
- `NotePost.content` → `posts.content`

**Done when:**

- [ ] All tables created via `db:push`
- [ ] FTS5 virtual table created with triggers for sync
- [ ] Zod schemas derived from Drizzle and exported (insert, select, create, update variants)
- [ ] Schema types and tables exported from `@lukeroes/db` via barrel export
- [ ] `db:studio` shows correct tables, columns, relations
- [ ] `drizzle-zod` installed in `packages/db`

#### Task 2: Better Auth plugins (Google OAuth, Admin, Stripe)

Three plugins added to `packages/auth/src/index.ts`. Reference Songkeeper's auth config at `songkeeper/apps/api/src/lib/auth.ts` for patterns.

**Google OAuth:** Add `google` social provider to Better Auth config with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars. Add "Sign in with Google" button to both `sign-in-form.tsx` and `sign-up-form.tsx` using `authClient.signIn.social({ provider: "google" })`. Style to match existing form aesthetic.

**Admin plugin:** `admin({ adminRoles: ["admin"] })` — adds `role` column to `user` table (default `"user"`), `banned`, `banReason`, `banExpires` columns. The initial admin user's role is set manually in the database after first sign-up: `UPDATE user SET role = 'admin' WHERE email = '...'`. Document this in the seed script or README.

**Stripe plugin:** Install `@better-auth/stripe` and `stripe` in `packages/auth`. Configure:

```
stripePlugin({
  stripeClient,  // initialized from STRIPE_SECRET_KEY
  stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
  createCustomerOnSignUp: true,
  subscription: {
    enabled: true,
    plans: [{ name: "member", priceId: env.STRIPE_PRICE_ID }],
    onSubscriptionComplete: async ({ subscription }) => {
      // Look up user email, call emailService.addToGroup(email, "Members")
    },
    onSubscriptionCancel: async ({ subscription }) => {
      // Look up user email, call emailService.removeFromGroup(email, "Members")
    },
  },
})
```

**Auth client update:** Update `apps/web/src/lib/auth-client.ts` to add `stripeClient({ subscription: true })`, `adminClient()`, and `inferAdditionalFields` (with `role` field) plugins — follow Songkeeper's `songkeeper/apps/web/src/lib/auth-client.ts` pattern.

**Done when:**

- [ ] Google OAuth sign-in works in dev (redirects to Google, returns with session)
- [ ] Google button appears on both sign-in and sign-up forms
- [ ] Existing email/password auth still works unchanged
- [ ] Admin plugin adds `role` column; manually setting role to `"admin"` in DB is reflected in session
- [ ] Stripe plugin is configured; `createCustomerOnSignUp` creates a Stripe customer on new sign-ups (test mode)
- [ ] Auth client exports `subscription` and `admin` APIs
- [ ] `@better-auth/stripe` and `stripe` installed in `packages/auth`

#### Task 3: Middleware chain

Create `src/middleware/admin.ts` that chains `authMiddleware` and rejects non-admin users — check `context.session.user.role === "admin"` (the `role` field is added by the admin plugin from Task 2). Throw a redirect to `/` or a 403 error for non-admins.

Create `src/middleware/member.ts` that chains `authMiddleware` and resolves `isMember: boolean` into context. Query the Better Auth-managed `subscription` table directly: check for a row where `referenceId = user.id` and `status = "active"`. This is a simple Drizzle query — no separate `subscription.server.ts` needed since Better Auth manages the table. The subscription table is available from the schema via Better Auth's drizzle adapter.

**Done when:**

- [ ] `adminMiddleware` rejects unauthenticated and non-admin users (checks `user.role`)
- [ ] `memberMiddleware` adds `isMember` boolean to handler context (queries `subscription` table)
- [ ] Both chain from existing `authMiddleware` — no duplicated session logic

#### Task 4: Service abstractions

Create `src/server/services/storage.service.ts` — wraps R2 SDK with interface: `uploadFile(key, body, contentType)`, `getSignedUrl(key, expiresIn)`, `getPublicUrl(key)`, `deleteFile(key)`. Uses `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` pointed at R2 endpoint. All media keys use the `media/` prefix in the shared R2 bucket.

Create `src/server/services/email.service.ts` — wraps MailerLite with interface: `addSubscriber(email, fields?)`, `removeSubscriber(email)`, `addToGroup(email, groupId)`, `removeFromGroup(email, groupId)`. Extract logic from existing `subscribe-to-mailing-list.ts`. This service is called from two places: the existing mailing list form, and the Better Auth Stripe plugin's `onSubscriptionComplete` / `onSubscriptionCancel` hooks (Task 2).

**Done when:**

- [ ] Storage service can generate pre-signed upload URLs for R2
- [ ] Storage service can generate public/signed read URLs
- [ ] Email service can add/remove subscribers and manage group membership
- [ ] Existing mailing list subscription still works (now goes through email service)
- [ ] Stripe plugin hooks from Task 2 call email service for member group sync
- [ ] Both services are importable from server code only

### Sprint 2: Content API + Audio Player

#### Task 5: Posts server logic + server functions

Create `src/server/posts.server.ts` with: `listPosts` (cursor-paginated, filterable by type/tag, full-text search via FTS5), `getPostBySlug` (returns full content or excerpt based on membership), `createPost` (computes `reading_time` from content word count / 200 WPM for writing posts), `updatePost` (recomputes `reading_time` on content change), `deletePost`.

**Cursor pagination:** Use `published_at` + `id` composite cursor for consistent reverse-chronological ordering. The cursor is an opaque string encoding both values. Fetch `limit + 1` rows to determine `hasMore`, pop the extra, return `nextCursor` from the last item. Follow the Songkeeper contacts repository pattern (`songkeeper/apps/api/src/domains/contacts/contacts-repository.ts`).

**FTS5 search:** Query `posts_fts` with `MATCH` for full-text search, join back to `posts` table for filtering and pagination.

Create `src/functions/posts.functions.ts` with thin `createServerFn` wrappers — mutations use `adminMiddleware`, gated reads use `memberMiddleware`, public list uses no middleware. Input validation uses Drizzle-derived schemas from `membership.ts`.

Create `src/hooks/use-posts.ts`:

- `postsInfiniteQueryOptions(filters)` — `infiniteQueryOptions` for the feed with `getNextPageParam: (lastPage) => lastPage.nextCursor`. Filters (type, tag, search) are part of the query key so filter changes trigger refetch.
- `postQueryOptions(slug)` — `queryOptions` for a single post detail page, used with `ensureQueryData` in the route loader for SSR.

**Done when:**

- [ ] Feed loads paginated posts with cursor-based infinite scroll
- [ ] Filtering by type and tag returns correct results
- [ ] Search returns posts matching title, content, or tags via FTS5
- [ ] Non-members receive excerpt only for members-only posts (content field is null)
- [ ] Members receive full content for all posts
- [ ] Create/update/delete reject non-admin users (middleware handles it, not handler code)
- [ ] `reading_time` is computed on create/update for writing posts
- [ ] `infiniteQueryOptions` and `queryOptions` exported from `use-posts.ts`

#### Task 6: Tags server logic + server functions

Create `src/server/tags.server.ts` with `listTags` (with post counts) and tag upsert (on-the-fly during post creation). Thin server function wrappers in `src/functions/tags.functions.ts`.

**Done when:**

- [ ] Tags are created when a new post includes a new tag name
- [ ] `listTags` returns all tags with accurate post counts
- [ ] Filtering feed by tag works end-to-end

#### Task 7: Media upload server functions

Create `src/server/media.server.ts` using the storage service — `getPresignedUploadUrl` (creates media record + returns R2 signed upload URL), `confirmUpload` (marks ready, stores metadata like duration/dimensions), `getMediaUrl` (returns public URL or signed URL based on post visibility). Server function wrappers use `adminMiddleware` for uploads.

**Done when:**

- [ ] Admin can upload audio and images via pre-signed URL to R2
- [ ] Media record created in DB with file key, type, metadata
- [ ] Public media URLs resolve correctly
- [ ] Members-only audio returns signed URLs with short expiry

#### Task 8: Real persistent audio player

Replace the fake `audio-player-context.tsx` with a real implementation. Two layers, following Songkeeper's exact pattern:

**Layer 1: AudioElementProvider** (reference: `songkeeper/apps/web/src/contexts/audio-element-context.tsx`). A minimal context that renders a single global `<audio>` element and exposes the ref via `useAudioElement()`. The `<audio>` element lives inside this provider — rendered once in the layout, survives navigation. Uses `useRef<HTMLAudioElement>` + `useMemo` for stable context value. Attributes: `crossOrigin="anonymous"`, `preload="auto"`, `className="hidden"`.

**Layer 2: AudioPlayerContext** (state management). Simple React context wrapping the audio element ref. State: `currentTrack | null`, `status: 'idle' | 'loading' | 'playing' | 'paused' | 'error'`, `currentTime`, `duration`, `error`. Wire audio element events → context state (`canplay`, `timeupdate`, `ended`, `error`). Wire context actions → audio element (`play` sets `src` + calls `.play()`, `pause` calls `.pause()`, `seek` sets `.currentTime`). One track at a time — playing a new track swaps the source. Keep the existing `PersistentPlayer` UI component, wire it to the new real context.

**Done when:**

- [ ] Clicking play on an audio post loads and plays real audio from a URL
- [ ] Player docks to bottom and persists across page navigation
- [ ] Play/pause/seek all work correctly
- [ ] Playing a different track swaps to it (stops previous)
- [ ] Loading and error states are handled (spinner, error message)
- [ ] Close button stops audio and hides player

#### Task 9: Seed data

Seed script that populates the database with content from `mock-data.ts` — real rows in posts, tags, post_tags. Use placeholder R2 URLs for audio/images (or upload actual test files if R2 is configured).

**Done when:**

- [ ] Running seed populates 10+ posts across all 4 types with tags and visibility settings
- [ ] Seed is idempotent (safe to run multiple times)

### Sprint 3: Wire Frontend + Stripe

#### Task 10: Replace mock data with server function calls

Replace `MOCK_POSTS` in `members/index.tsx` and `members/post/$slug.tsx` with React Query hooks backed by post server functions. Use route `loader` with `ensureQueryData` for SSR initial data, client-side `useInfiniteQuery` with `postsInfiniteQueryOptions` for feed pagination/filters/search. Follow `use-music.ts` → `get-music.ts` pattern.

**MembershipProvider scoping:** Move `MembershipProvider` from `(nav)/route.tsx` to the members route layout (or `members/index.tsx`). Replace mock `isMember` state with real subscription status — create a server function that uses `memberMiddleware` to resolve `isMember`, call it in the members route `beforeLoad`, pass via context. No need to check subscription on every page of the site.

**Content rendering:** Render `posts.content` (markdown) using `react-markdown` + `remark-gfm`. Style with Tailwind's `prose` class from `@tailwindcss/typography`. Reference Songkeeper's prose styling in `songkeeper/apps/web/src/styles/app.css` for custom overrides. The existing `@tailwindcss/typography` plugin should already be available — if not, install it.

**Mock data → DB mapping:** Use the mapping table from Task 1 to translate between DB rows (with joined media) and the component prop shapes. The `memberOnly` boolean that components check maps to `visibility === "members"`.

**Done when:**

- [ ] Feed loads real posts from database (SSR on initial load via `ensureQueryData`)
- [ ] Infinite scroll loads more posts via cursor pagination
- [ ] Search, type filter, and tag filter update via client-side queries (query key changes)
- [ ] Post detail page shows full content for members, gate for non-members
- [ ] Writing post content rendered as markdown with prose styling
- [ ] Audio player plays real audio from R2 URLs
- [ ] `MembershipProvider` scoped to members routes, uses real subscription status
- [ ] Mock data files can be deleted without breaking anything

#### Task 11: Stripe end-to-end verification

The Better Auth Stripe plugin (configured in Sprint 1, Task 2) handles checkout sessions, webhook processing, subscription lifecycle, and the customer portal. No custom Stripe server code or webhook route is needed. This task verifies the full flow works end-to-end with Stripe test mode.

**What the plugin provides automatically:**

- Checkout session creation via `authClient.subscription.upgrade({ plan: "member" })`
- Customer portal via `authClient.subscription.cancel()` / manage
- Webhook signature verification + event processing via `/api/auth/$` catch-all
- `subscription` table auto-managed with status, period dates, Stripe IDs
- Customer creation on sign-up (`createCustomerOnSignUp: true`)

**What needs manual verification:**

- Stripe test mode Price ID is set in `STRIPE_PRICE_ID` env var
- Webhook endpoint is registered in Stripe dashboard pointing to `{APP_URL}/api/auth/stripe/webhook` (or the plugin's path)
- MailerLite sync hooks (`onSubscriptionComplete`, `onSubscriptionCancel` from Task 2) fire correctly and call the email service (Task 4)
- MailerLite sync is non-blocking — log failures, don't fail the webhook

**Done when:**

- [ ] `authClient.subscription.upgrade({ plan: "member" })` redirects to Stripe Checkout with correct $7/mo price
- [ ] Completing checkout creates a row in the `subscription` table with `status: "active"`
- [ ] `memberMiddleware` now returns `isMember: true` for the subscribed user
- [ ] Canceling subscription updates status; `memberMiddleware` returns `isMember: false`
- [ ] Active subscription → user added to MailerLite "Members" group (via plugin hook)
- [ ] Canceled subscription → user removed from MailerLite "Members" group (via plugin hook)
- [ ] Stripe CLI `stripe listen --forward-to` works for local testing

#### Task 12: Wire membership gate to Stripe

Update `MembershipGate` and join buttons: not logged in → redirect to `/login?redirect={current_url}`; logged in, no subscription → `authClient.subscription.upgrade({ plan: "member" })` triggers Stripe Checkout; active member → gate doesn't render.

Also fix the login page redirect: currently `sign-in-form.tsx` hardcodes `navigate({ to: "/dashboard" })`. Change to read `redirect` search param from the URL and navigate there after successful auth, falling back to `/members`. This makes login work generically for any future authenticated area (courses, account settings, etc.) without touching the login page again.

**Done when:**

- [ ] Join button triggers Stripe Checkout for logged-in non-members (via `authClient.subscription.upgrade`)
- [ ] Unauthenticated users redirected to `/login?redirect={current_url}`
- [ ] After login, user is redirected back to the page they came from (not hardcoded `/dashboard`)
- [ ] Active members see full content, no gate
- [ ] Canceled/expired members see gate again

#### Task 13: Post-checkout welcome flow

Detect `/members?session_id=...` after Stripe redirect (configure the success URL in the Stripe plugin or checkout call). Show welcome modal with pre-checked "Send me email updates" checkbox. On confirm, add subscriber to MailerLite general list via email service (the "Members" group sync is already handled by the Stripe plugin's `onSubscriptionComplete` hook — this checkbox is for the general mailing list).

**Done when:**

- [ ] Successful checkout redirects to `/members` with session ID
- [ ] Welcome UI with mailing list opt-in (checked by default)
- [ ] Checkbox checked → added to MailerLite general list via email service
- [ ] Welcome UI only shows once per checkout

### Sprint 4: Admin + Polish

#### Task 14: Admin posting interface

Route at `/admin/posts` protected by `adminMiddleware`. Post list, create form (title, textarea/markdown content, type selector, format toggle for writing, label selector for audio, visibility toggle, tag input with autocomplete, media upload zone via storage service), edit form. Audio: upload file + optional artwork. Photos: multi-image upload with alt text and ordering (maps to `post_media` with `display_order`).

**Done when:**

- [ ] Admin can create writing (essay/poetry), audio, note, and photo posts
- [ ] Admin can edit and delete any post
- [ ] Non-admin users redirected away from admin route
- [ ] Tag autocomplete suggests existing tags
- [ ] Media uploads go through storage service to R2
- [ ] `reading_time` auto-computed for writing posts on save

#### Task 15: Social share image generation (Instagram export)

API route at `src/routes/api/share-image/$slug.ts` renders 1080×1080 PNG via Satori + Resvg. Creator-only tool — "Download for Instagram" button in admin post view. Templates per type: writing (title + pull quote, Special Elite/Courier Prime, dark bg, amber accent), poetry (stanza in italic), audio (title + label + duration), notes (text in Courier Prime).

**Done when:**

- [ ] `/api/share-image/[slug]` returns 1080×1080 PNG
- [ ] Templates use correct brand fonts and colors per post type
- [ ] Admin post view has "Download for Instagram" button
