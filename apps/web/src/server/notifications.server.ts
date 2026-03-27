import { db } from "@lukeroes/db";
import { user } from "@lukeroes/db/schema/auth";
import { comments, notifications, posts } from "@lukeroes/db/schema/membership";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getUtcNowIso } from "@/server/utc";

const deletedCommentPlaceholder = "This comment was deleted.";

export async function createNotification(input: {
  userId: string;
  type: "comment_reply" | "comment_vote";
  postId: number;
  commentId: number;
  actorId: string | null;
}) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      postId: input.postId,
      commentId: input.commentId,
      actorId: input.actorId,
      createdAt: getUtcNowIso(),
    })
    .returning();

  return notification;
}

export async function listNotificationsForUser(userId: string, limit = 50) {
  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      postId: notifications.postId,
      postSlug: posts.slug,
      postTitle: posts.title,
      commentId: notifications.commentId,
      actorId: notifications.actorId,
      actorName: user.name,
      actorImage: user.image,
      commentText: sql<string>`CASE WHEN ${comments.isDeleted} THEN ${deletedCommentPlaceholder} ELSE ${comments.text} END`,
    })
    .from(notifications)
    .innerJoin(posts, eq(notifications.postId, posts.id))
    .innerJoin(comments, eq(notifications.commentId, comments.id))
    .leftJoin(user, eq(notifications.actorId, user.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit);
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const row = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .get();

  return row?.count ?? 0;
}

export async function markNotificationsRead(userId: string, notificationIds: number[]) {
  if (notificationIds.length === 0) {
    return 0;
  }

  const nowIso = getUtcNowIso();
  const result = await db
    .update(notifications)
    .set({ readAt: nowIso })
    .where(and(eq(notifications.userId, userId), inArray(notifications.id, notificationIds)))
    .run();

  return result.changes;
}
