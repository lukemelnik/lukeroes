# Luke Roes — Artist Website

My artist website, built with TanStack Start. It consumes the [Songkeeper](https://songkeeper.io) API to display release information, track metadata, credits, and streaming links — so everything stays in sync with my production management workflow.

## How it works

Release data (tracks, credits, ISRC codes, streaming links, artwork) is managed in Songkeeper and exposed via a public API. This site generates a type-safe TypeScript SDK from the OpenAPI spec using [@hey-api/openapi-ts](https://github.com/hey-api/openapi-ts), so the frontend always stays in sync with the API schema.

```
Songkeeper API (OpenAPI spec)
        ↓
  openapi-ts codegen
        ↓
  Generated TypeScript SDK + TanStack Query hooks
        ↓
  Artist website renders release data
```

## Tech stack

- **Framework**: TanStack Start (SSR) with TanStack Router
- **Styling**: TailwindCSS + shadcn/ui
- **API integration**: Generated OpenAPI SDK with TanStack Query
- **Content**: MDX blog posts via Content Collections
- **Auth**: Better-Auth
- **Email**: React Email + Nodemailer
- **Deployment**: Docker + GitHub Actions

## Pages

- `/` — Homepage with latest release, music, videos, tour dates, mailing list
- `/music` — Release browser with track-level detail
- `/music/:releaseId` — Full release page (lyrics, credits, technical metadata)
- `/writing` — Blog
- `/tour` — Tour dates
- `/videos` — Video collection
- `/contact` — Contact form
- `/work-with-me` — Services and collaboration

## Development

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
pnpm dev
```

Regenerate the Songkeeper API SDK:

```bash
cd apps/web && pnpm generate:api
```

## Project structure

```
lukeroes/
├── apps/
│   └── web/              # TanStack Start application
│       ├── src/
│       │   ├── routes/   # File-based routing
│       │   ├── components/
│       │   ├── generated/ # Auto-generated Songkeeper SDK
│       │   ├── hooks/    # Data fetching hooks
│       │   └── lib/      # Server-side caching, utilities
│       └── content/      # MDX blog posts
└── packages/
    ├── auth/             # Better-Auth configuration
    └── db/               # Drizzle ORM schema
```
