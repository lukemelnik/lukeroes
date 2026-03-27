import { db } from "@lukeroes/db";
import { postLikes, posts } from "@lukeroes/db/schema/membership";
import { and, eq, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { buildRateLimitKey, enforceRateLimit, rateLimitPresets } from "@/server/rate-limit.server";
import { getUtcNowIso } from "@/server/utc";

async function getLikeablePost(postId: number) {
  const nowIso = getUtcNowIso();

  const post = await db
    .select({
      id: posts.id,
      visibility: posts.visibility,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), isNotNull(posts.publishedAt), lte(posts.publishedAt, nowIso)))
    .get();

  if (!post) {
    throw new Error("Post not found.");
  }

  return post;
}

function assertCanLikePost(visibility: "public" | "members", isMember: boolean) {
  if (visibility === "members" && !isMember) {
    throw new Error("Membership required.");
  }
}

export async function togglePostLike(input: { postId: number; userId: string; isMember: boolean }) {
  enforceRateLimit({
    ...rateLimitPresets.postLikes,
    key: buildRateLimitKey([input.userId]),
  });

  const post = await getLikeablePost(input.postId);
  assertCanLikePost(post.visibility, input.isMember);

  const existingLike = await db
    .select({ postId: postLikes.postId })
    .from(postLikes)
    .where(and(eq(postLikes.postId, input.postId), eq(postLikes.userId, input.userId)))
    .get();

  if (existingLike) {
    await db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, input.postId), eq(postLikes.userId, input.userId)));

    return {
      liked: false,
      count: await getPostLikeCount(input.postId),
    };
  }

  await db.insert(postLikes).values({
    postId: input.postId,
    userId: input.userId,
    createdAt: getUtcNowIso(),
  });

  return {
    liked: true,
    count: await getPostLikeCount(input.postId),
  };
}

async function getPostLikeCount(postId: number): Promise<number> {
  const row = await db
    .select({ count: sql<number>`count(*)` })
    .from(postLikes)
    .where(eq(postLikes.postId, postId))
    .get();

  return row?.count ?? 0;
}

export async function getPostLikeCounts(postIds: number[]) {
  if (postIds.length === 0) {
    return new Map<number, number>();
  }

  const rows = await db
    .select({
      postId: postLikes.postId,
      count: sql<number>`count(*)`,
    })
    .from(postLikes)
    .where(inArray(postLikes.postId, postIds))
    .groupBy(postLikes.postId);

  return new Map(rows.map((row) => [row.postId, row.count]));
}

export async function hasUserLiked(postIds: number[], userId: string | null | undefined) {
  if (!userId || postIds.length === 0) {
    return new Map<number, boolean>();
  }

  const rows = await db
    .select({ postId: postLikes.postId })
    .from(postLikes)
    .where(and(eq(postLikes.userId, userId), inArray(postLikes.postId, postIds)));

  return new Map(rows.map((row) => [row.postId, true]));
}
