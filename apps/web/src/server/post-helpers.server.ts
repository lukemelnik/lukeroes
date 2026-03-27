import { db } from "@lukeroes/db";
import { posts } from "@lukeroes/db/schema/membership";
import { and, eq, like, ne, or } from "drizzle-orm";
import { slugify } from "@/lib/slugify";
import { getUtcNowIso } from "@/server/utc";

export function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function calculateReadingTimeLabel(content: string | null | undefined): string | null {
  if (!content) {
    return null;
  }

  const text = stripHtmlToPlainText(content);

  if (!text) {
    return null;
  }

  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return `${minutes} min read`;
}

export function normalizePostSlug(value: string): string {
  const normalized = slugify(value);

  if (!normalized) {
    throw new Error("A post title or slug is required to generate a valid slug.");
  }

  return normalized;
}

export async function ensureUniquePostSlug(input: {
  title: string;
  slug?: string | null;
  excludePostId?: number;
}): Promise<string> {
  const baseSlug = normalizePostSlug(
    input.slug && input.slug.trim().length > 0 ? input.slug : input.title,
  );
  const slugCondition = or(eq(posts.slug, baseSlug), like(posts.slug, `${baseSlug}-%`));

  if (!slugCondition) {
    return baseSlug;
  }

  const whereCondition =
    input.excludePostId === undefined
      ? slugCondition
      : and(slugCondition, ne(posts.id, input.excludePostId));

  if (!whereCondition) {
    return baseSlug;
  }

  const rows = await db.select({ slug: posts.slug }).from(posts).where(whereCondition);
  const takenSlugs = new Set(rows.map((row) => row.slug));

  if (!takenSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (takenSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export type PostPublicationState = "draft" | "scheduled" | "published";

export function getPostPublicationState(
  publishedAt: string | null | undefined,
  nowIso = getUtcNowIso(),
): PostPublicationState {
  if (!publishedAt) {
    return "draft";
  }

  return publishedAt <= nowIso ? "published" : "scheduled";
}

export function isPostPublished(
  publishedAt: string | null | undefined,
  nowIso = getUtcNowIso(),
): boolean {
  return getPostPublicationState(publishedAt, nowIso) === "published";
}

export function encodePostCursor(publishedAt: string, id: number): string {
  return Buffer.from(`${publishedAt}|${id}`).toString("base64");
}

export function decodePostCursor(cursor: string): { publishedAt: string; id: number } {
  const decoded = Buffer.from(cursor, "base64").toString("utf-8");
  const [publishedAt, idValue] = decoded.split("|");

  if (!publishedAt || !idValue) {
    throw new Error("Invalid post cursor.");
  }

  const id = Number(idValue);

  if (!Number.isInteger(id)) {
    throw new Error("Invalid post cursor.");
  }

  return { publishedAt, id };
}
