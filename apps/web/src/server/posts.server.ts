import { db } from "@lukeroes/db";
import {
  posts,
  postMedia,
  postTags,
  tags,
  media,
  type Post,
  type CreatePostInput,
  type UpdatePostInput,
} from "@lukeroes/db/schema/membership";
import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeReadingTime(content: string | null | undefined): string | null {
  if (!content) return null;
  const text = stripHtml(content);
  if (!text) return null;
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function encodeCursor(publishedAt: string, id: number): string {
  return Buffer.from(`${publishedAt}|${id}`).toString("base64");
}

function decodeCursor(cursor: string): { publishedAt: string; id: number } {
  const decoded = Buffer.from(cursor, "base64").toString("utf-8");
  const [publishedAt, idStr] = decoded.split("|");
  return { publishedAt, id: Number(idStr) };
}

export interface ListPostsParams {
  limit?: number;
  cursor?: string;
  type?: string;
  tag?: string;
  search?: string;
  isMember?: boolean;
}

export async function listPosts(params: ListPostsParams) {
  const { limit = 10, cursor, type, tag, search, isMember = false } = params;

  const conditions = [sql`${posts.publishedAt} IS NOT NULL`];

  if (type) {
    conditions.push(eq(posts.type, type as "writing" | "audio" | "note" | "photo"));
  }

  if (cursor) {
    const { publishedAt, id } = decodeCursor(cursor);
    conditions.push(
      or(
        lt(posts.publishedAt, publishedAt),
        and(eq(posts.publishedAt, publishedAt), lt(posts.id, id)),
      )!,
    );
  }

  // Tag filter via subquery
  if (tag) {
    conditions.push(
      sql`${posts.id} IN (
				SELECT pt.post_id FROM post_tags pt
				JOIN tags t ON t.id = pt.tag_id
				WHERE t.slug = ${tag}
			)`,
    );
  }

  // FTS5 search
  if (search && search.trim()) {
    const searchTerm = search.trim().replace(/"/g, '""');
    conditions.push(
      sql`${posts.id} IN (
				SELECT rowid FROM posts_fts WHERE posts_fts MATCH ${`"${searchTerm}"*`}
			)`,
    );
  }

  const rows = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.publishedAt), desc(posts.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  // Strip content for non-members viewing members-only posts
  const processed = items.map((post: Post) => {
    if (post.visibility === "members" && !isMember) {
      return { ...post, content: null };
    }
    return post;
  });

  // Load tags for all posts
  const postIds = processed.map((p: Post) => p.id);
  const tagRows =
    postIds.length > 0
      ? await db
          .select({
            postId: postTags.postId,
            tagId: tags.id,
            tagName: tags.name,
            tagSlug: tags.slug,
          })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(inArray(postTags.postId, postIds))
      : [];

  // Load media for all posts
  const mediaRows =
    postIds.length > 0
      ? await db
          .select({
            postId: postMedia.postId,
            role: postMedia.role,
            displayOrder: postMedia.displayOrder,
            mediaId: media.id,
            mediaType: media.type,
            fileKey: media.fileKey,
            url: media.url,
            duration: media.duration,
            width: media.width,
            height: media.height,
            alt: media.alt,
          })
          .from(postMedia)
          .innerJoin(media, eq(postMedia.mediaId, media.id))
          .where(inArray(postMedia.postId, postIds))
          .orderBy(postMedia.displayOrder)
      : [];

  const tagsByPostId = new Map<number, { id: number; name: string; slug: string }[]>();
  for (const row of tagRows) {
    const arr = tagsByPostId.get(row.postId) || [];
    arr.push({ id: row.tagId, name: row.tagName, slug: row.tagSlug });
    tagsByPostId.set(row.postId, arr);
  }

  const mediaByPostId = new Map<number, typeof mediaRows>();
  for (const row of mediaRows) {
    const arr = mediaByPostId.get(row.postId) || [];
    arr.push(row);
    mediaByPostId.set(row.postId, arr);
  }

  const postsWithRelations = processed.map((post: Post) => ({
    ...post,
    tags: tagsByPostId.get(post.id) || [],
    media: mediaByPostId.get(post.id) || [],
  }));

  const lastItem = items[items.length - 1];
  const nextCursor =
    hasMore && lastItem?.publishedAt ? encodeCursor(lastItem.publishedAt, lastItem.id) : undefined;

  return { posts: postsWithRelations, nextCursor };
}

export async function getPostBySlug(slug: string, isMember: boolean) {
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);

  if (!post) return null;

  // Strip content for non-members viewing members-only posts
  if (post.visibility === "members" && !isMember) {
    post.content = null;
  }

  // Load tags
  const tagRows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, post.id));

  // Load media
  const mediaRows = await db
    .select({
      role: postMedia.role,
      displayOrder: postMedia.displayOrder,
      id: media.id,
      type: media.type,
      fileKey: media.fileKey,
      url: media.url,
      duration: media.duration,
      width: media.width,
      height: media.height,
      alt: media.alt,
    })
    .from(postMedia)
    .innerJoin(media, eq(postMedia.mediaId, media.id))
    .where(eq(postMedia.postId, post.id))
    .orderBy(postMedia.displayOrder);

  return { ...post, tags: tagRows, media: mediaRows };
}

export async function createPost(input: CreatePostInput) {
  const readingTime = input.type === "writing" ? computeReadingTime(input.content) : null;

  const [post] = await db
    .insert(posts)
    .values({
      ...input,
      readingTime,
    })
    .returning();

  return post;
}

export async function updatePost(input: UpdatePostInput) {
  const { id, ...updates } = input;

  // Recompute reading time if content changed on a writing post
  if (updates.content !== undefined) {
    const [existing] = await db.select({ type: posts.type }).from(posts).where(eq(posts.id, id));
    if (existing?.type === "writing") {
      (updates as Record<string, unknown>).readingTime = computeReadingTime(updates.content);
    }
  }

  const [post] = await db
    .update(posts)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(posts.id, id))
    .returning();

  return post;
}

export async function deletePost(id: number) {
  await db.delete(posts).where(eq(posts.id, id));
}
