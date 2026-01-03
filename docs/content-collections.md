# Reproducing the content-collections setup in a TanStack Start app

This guide shows how the `apps/web` project wires [content-collections](https://content-collections.dev/) with TanStack Start and MDX, and how to recreate the same setup in another TanStack Start application.

## What this setup delivers
- MDX-backed posts stored in `content/writing` with validated frontmatter (title, summary, date, slug, draft, tags).
- Auto-generated `allPosts` data from `content-collections` with extra fields like `readingTime` and compiled MDX code.
- Vite plugin + TypeScript path aliasing so routes can import `allPosts` directly.
- MDX rendered in routes via `@content-collections/mdx/react` with custom components.

## 1) Install dependencies
```bash
pnpm add -D @content-collections/core @content-collections/mdx @content-collections/vite
```

## 2) Enable the Vite plugin
Add the plugin to `vite.config.ts` alongside the TanStack Start plugin:
```ts
import contentCollections from "@content-collections/vite";

export default defineConfig({
  plugins: [
    contentCollections(),
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    nitroV2Plugin({ preset: "node-server", compatibilityDate: "2025-11-05" }),
  ],
});
```

## 3) Define your collections
Create `content-collections.ts` at the app root (same level as `vite.config.ts`). It describes where content lives, its schema, and any transforms. Example from `apps/web`:
```ts
import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import { z } from "zod";

const posts = defineCollection({
  name: "posts",
  directory: "content/writing",
  include: "**/*.mdx",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.string(),
    slug: z.string(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
  }),
  transform: async (document, context) => {
    const mdx = await compileMDX(context, document);
    const words = (document.content || "").trim().split(/\s+/).length;
    return { ...document, mdx, readingTime: Math.ceil(words / 200) };
  },
});

export default defineConfig({
  collections: [posts],
});
```

## 4) Add content files
Place MDX files under `content/writing`. Each file needs frontmatter that matches the schema:
```mdx
---
title: "Welcome to My Blog"
summary: "First post"
date: "2025-01-15"
slug: "welcome-to-my-blog"
draft: true
tags: ["meta", "mdx", "tanstack"]
---

Content goes here...
```

## 5) Configure TypeScript paths
Point the `content-collections` import to the generated folder so TypeScript can resolve `allPosts` and types. In `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "content-collections": ["./.content-collections/generated"],
      "@/*": ["./src/*"]
    }
  }
}
```

## 6) Use the generated data in routes
- Import `allPosts` from `content-collections` anywhere in your Start app.
- Filter out drafts in production if desired, and sort by date.
- Render MDX with `MDXContent` from `@content-collections/mdx/react`.

Example list route (simplified from `src/routes/(nav)/writing/index.tsx`):
```tsx
import { allPosts } from "content-collections";

const posts = allPosts
  .filter((post) => import.meta.env.DEV || !post.draft)
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
```

Example detail route (simplified from `src/routes/(nav)/writing/$slug.tsx`):
```tsx
import { MDXContent } from "@content-collections/mdx/react";
import { allPosts } from "content-collections";

const post = allPosts.find((p) => p.slug === params.slug);
if (!post || (!import.meta.env.DEV && post.draft)) throw notFound();

const components = { CustomComponent /* MDX overrides */ };

return <MDXContent code={post.mdx} components={components} />;
```

## 7) Run the app
- `pnpm dev` regenerates `.content-collections/generated` on the fly.
- `pnpm build` runs the generator before building.

## Tips
- Keep transforms fast; they run at build and dev time. Deriving `readingTime` from `document.content` is a cheap example.
- Add more collections by extending `defineConfig({ collections: [...] })` and pointing to new directories.
- Custom MDX components (like `CustomComponent` in `apps/web`) can be registered per-route or globally to enrich content.
