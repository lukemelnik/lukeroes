import { db } from "@lukeroes/db";
import {
  media,
  mediaVariants,
  postMedia,
  postTags,
  posts,
  tags,
  type CreatePostInput,
  type Post,
  type UpdatePostInput,
} from "@lukeroes/db/schema/membership";
import { and, desc, eq, inArray, isNotNull, lt, lte, or, sql } from "drizzle-orm";
import { createAdminAuditLogEntry } from "@/server/audit-log.server";
import {
  calculateReadingTimeLabel,
  decodePostCursor,
  encodePostCursor,
  ensureUniquePostSlug,
  getPostPublicationState,
} from "@/server/post-helpers.server";
import type { RequestMetadata } from "@/server/request.server";
import { getPublicUrl } from "@/server/services/storage.service";
import { getUtcNowIso } from "@/server/utc";

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function isPostType(value: string): value is Post["type"] {
  return ["writing", "audio", "note", "photo"].includes(value);
}

interface PostMediaItem {
  postId: number;
  mediaId: number;
  id: number;
  role: "artwork" | "audio" | "photo" | "inline";
  displayOrder: number;
  type: "image" | "audio";
  mediaType: "image" | "audio";
  fileKey: string | null;
  url: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  caption: string | null;
  access: "public" | "members";
  variantKind: "original" | "display" | "thumb" | null;
  format: string | null;
  byteSize: number | null;
}

function getPreferredVariantKind(role: string, type: "image" | "audio") {
  if (type === "audio" || role === "audio") {
    return "original";
  }

  return "display";
}

async function loadTagsByPostId(postIds: number[]) {
  if (postIds.length === 0) {
    return new Map<number, Array<{ id: number; name: string; slug: string }>>();
  }

  const tagRows = await db
    .select({
      postId: postTags.postId,
      tagId: tags.id,
      tagName: tags.name,
      tagSlug: tags.slug,
    })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds));

  const tagsByPostId = new Map<number, Array<{ id: number; name: string; slug: string }>>();
  for (const row of tagRows) {
    const existingTags = tagsByPostId.get(row.postId) ?? [];
    existingTags.push({
      id: row.tagId,
      name: row.tagName,
      slug: row.tagSlug,
    });
    tagsByPostId.set(row.postId, existingTags);
  }

  return tagsByPostId;
}

async function loadMediaByPostId(postIds: number[], isMember: boolean) {
  if (postIds.length === 0) {
    return new Map<number, PostMediaItem[]>();
  }

  const relationRows = await db
    .select({
      postId: postMedia.postId,
      mediaId: media.id,
      role: postMedia.role,
      displayOrder: postMedia.displayOrder,
      altOverride: postMedia.altOverride,
      caption: postMedia.caption,
      mediaType: media.type,
      access: media.access,
      defaultAlt: media.defaultAlt,
      durationSeconds: media.durationSeconds,
    })
    .from(postMedia)
    .innerJoin(media, eq(postMedia.mediaId, media.id))
    .where(inArray(postMedia.postId, postIds))
    .orderBy(postMedia.postId, postMedia.displayOrder, postMedia.mediaId);

  const mediaIds = relationRows.map((row) => row.mediaId);

  if (mediaIds.length === 0) {
    return new Map<number, PostMediaItem[]>();
  }

  const variantRows = await db
    .select({
      mediaId: mediaVariants.mediaId,
      kind: mediaVariants.kind,
      fileKey: mediaVariants.fileKey,
      format: mediaVariants.format,
      width: mediaVariants.width,
      height: mediaVariants.height,
      byteSize: mediaVariants.byteSize,
    })
    .from(mediaVariants)
    .where(inArray(mediaVariants.mediaId, mediaIds));

  const variantsByMediaId = new Map<number, typeof variantRows>();
  for (const variantRow of variantRows) {
    const existingVariants = variantsByMediaId.get(variantRow.mediaId) ?? [];
    existingVariants.push(variantRow);
    variantsByMediaId.set(variantRow.mediaId, existingVariants);
  }

  const mediaByPostId = new Map<number, PostMediaItem[]>();
  for (const relationRow of relationRows) {
    const preferredVariantKind = getPreferredVariantKind(relationRow.role, relationRow.mediaType);
    const variants = variantsByMediaId.get(relationRow.mediaId) ?? [];
    const selectedVariant =
      variants.find((variant) => variant.kind === preferredVariantKind) ??
      variants.find((variant) => variant.kind === "original") ??
      variants[0];
    const isAccessible = relationRow.access === "public" || isMember;
    const existingMedia = mediaByPostId.get(relationRow.postId) ?? [];

    existingMedia.push({
      postId: relationRow.postId,
      mediaId: relationRow.mediaId,
      id: relationRow.mediaId,
      role: relationRow.role,
      displayOrder: relationRow.displayOrder,
      type: relationRow.mediaType,
      mediaType: relationRow.mediaType,
      fileKey: selectedVariant?.fileKey ?? null,
      url: isAccessible && selectedVariant ? getPublicUrl(selectedVariant.fileKey) : null,
      duration: relationRow.durationSeconds,
      width: selectedVariant?.width ?? null,
      height: selectedVariant?.height ?? null,
      alt: relationRow.altOverride ?? relationRow.defaultAlt,
      caption: relationRow.caption,
      access: relationRow.access,
      variantKind: selectedVariant?.kind ?? null,
      format: selectedVariant?.format ?? null,
      byteSize: selectedVariant?.byteSize ?? null,
    });

    mediaByPostId.set(relationRow.postId, existingMedia);
  }

  return mediaByPostId;
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
  const nowIso = getUtcNowIso();
  const cursorValues = params.cursor ? decodePostCursor(params.cursor) : null;
  const searchTerm = params.search?.trim();
  const conditions = [
    isNotNull(posts.publishedAt),
    lte(posts.publishedAt, nowIso),
    params.type && isPostType(params.type) ? eq(posts.type, params.type) : undefined,
    cursorValues
      ? or(
          lt(posts.publishedAt, cursorValues.publishedAt),
          and(eq(posts.publishedAt, cursorValues.publishedAt), lt(posts.id, cursorValues.id)),
        )
      : undefined,
    params.tag
      ? sql`${posts.id} IN (
          SELECT pt.post_id FROM post_tags pt
          JOIN tags t ON t.id = pt.tag_id
          WHERE t.slug = ${params.tag}
        )`
      : undefined,
    searchTerm
      ? sql`${posts.id} IN (
          SELECT rowid FROM posts_fts WHERE posts_fts MATCH ${`"${searchTerm.replace(/"/g, '""')}"*`}
        )`
      : undefined,
  ].filter(isDefined);

  const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
  const rows = await db
    .select()
    .from(posts)
    .where(whereCondition)
    .orderBy(desc(posts.publishedAt), desc(posts.id))
    .limit((params.limit ?? 10) + 1);

  const hasMore = rows.length > (params.limit ?? 10);
  const items = hasMore ? rows.slice(0, params.limit ?? 10) : rows;
  const processedPosts = items.map((post) =>
    post.visibility === "members" && !params.isMember ? { ...post, content: null } : post,
  );
  const postIds = processedPosts.map((post) => post.id);
  const [tagsByPostId, mediaByPostId] = await Promise.all([
    loadTagsByPostId(postIds),
    loadMediaByPostId(postIds, params.isMember ?? false),
  ]);
  const postsWithRelations = processedPosts.map((post) => ({
    ...post,
    tags: tagsByPostId.get(post.id) ?? [],
    media: mediaByPostId.get(post.id) ?? [],
  }));
  const lastItem = items[items.length - 1];

  return {
    posts: postsWithRelations,
    nextCursor:
      hasMore && lastItem?.publishedAt
        ? encodePostCursor(lastItem.publishedAt, lastItem.id)
        : undefined,
  };
}

export async function getPostBySlug(slug: string, isMember: boolean) {
  const nowIso = getUtcNowIso();
  const post = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), isNotNull(posts.publishedAt), lte(posts.publishedAt, nowIso)))
    .get();

  if (!post) {
    return null;
  }

  const visiblePost =
    post.visibility === "members" && !isMember ? { ...post, content: null } : post;
  const [tagsByPostId, mediaByPostId] = await Promise.all([
    loadTagsByPostId([post.id]),
    loadMediaByPostId([post.id], isMember),
  ]);

  return {
    ...visiblePost,
    tags: tagsByPostId.get(post.id) ?? [],
    media: mediaByPostId.get(post.id) ?? [],
  };
}

export async function createPost(input: CreatePostInput & { authorId: string }) {
  const nowIso = getUtcNowIso();
  const slug = await ensureUniquePostSlug({
    title: input.title,
    slug: input.slug,
  });
  const readingTime = input.type === "writing" ? calculateReadingTimeLabel(input.content) : null;
  const [post] = await db
    .insert(posts)
    .values({
      ...input,
      slug,
      readingTime,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    .returning();

  return post;
}

export async function updatePost(
  input: UpdatePostInput,
  auditContext?: { actorUserId: string; requestMetadata?: RequestMetadata | null },
) {
  const { id, ...updates } = input;
  const existingPost = await db
    .select({
      id: posts.id,
      type: posts.type,
      title: posts.title,
      slug: posts.slug,
      content: posts.content,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(eq(posts.id, id))
    .get();

  if (!existingPost) {
    throw new Error("Post not found.");
  }

  const nextType = updates.type ?? existingPost.type;
  const nextContent = updates.content === undefined ? existingPost.content : updates.content;
  const nextPublishedAt =
    updates.publishedAt === undefined ? existingPost.publishedAt : updates.publishedAt;
  const slug =
    updates.slug !== undefined
      ? await ensureUniquePostSlug({
          title: updates.title ?? existingPost.title,
          slug: updates.slug,
          excludePostId: id,
        })
      : existingPost.slug;
  const readingTime = nextType === "writing" ? calculateReadingTimeLabel(nextContent) : null;
  const nowIso = getUtcNowIso();
  const [post] = await db
    .update(posts)
    .set({
      ...updates,
      slug,
      readingTime,
      updatedAt: nowIso,
    })
    .where(eq(posts.id, id))
    .returning();

  if (auditContext) {
    const previousState = getPostPublicationState(existingPost.publishedAt, nowIso);
    const nextState = getPostPublicationState(nextPublishedAt, nowIso);

    if (previousState !== nextState) {
      await createAdminAuditLogEntry({
        actorUserId: auditContext.actorUserId,
        action: "post.publish_state_changed",
        targetType: "post",
        targetId: `${post.id}`,
        metadata: {
          previousState,
          nextState,
          previousPublishedAt: existingPost.publishedAt,
          nextPublishedAt: nextPublishedAt ?? null,
        },
        requestMetadata: auditContext.requestMetadata,
      });
    }
  }

  return post;
}

export async function deletePost(
  id: number,
  auditContext?: { actorUserId: string; requestMetadata?: RequestMetadata | null },
) {
  const existingPost = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
    })
    .from(posts)
    .where(eq(posts.id, id))
    .get();

  if (!existingPost) {
    throw new Error("Post not found.");
  }

  await db.delete(posts).where(eq(posts.id, id));

  if (auditContext) {
    await createAdminAuditLogEntry({
      actorUserId: auditContext.actorUserId,
      action: "post.delete",
      targetType: "post",
      targetId: `${existingPost.id}`,
      metadata: {
        slug: existingPost.slug,
        title: existingPost.title,
      },
      requestMetadata: auditContext.requestMetadata,
    });
  }
}
