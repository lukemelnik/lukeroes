import { db } from "@lukeroes/db";
import { user } from "@lukeroes/db/schema/auth";
import { comments, commentVotes, notifications, posts } from "@lukeroes/db/schema/membership";
import { and, desc, eq, inArray, isNotNull, lte, sql } from "drizzle-orm";
import { createNotification } from "@/server/notifications.server";
import { buildRateLimitKey, enforceRateLimit, rateLimitPresets } from "@/server/rate-limit.server";
import { getUtcNowIso } from "@/server/utc";

interface CommentAuthor {
  id: string;
  name: string | null;
  image: string | null;
  role: string | null;
}

interface CommentReplyNode {
  id: number;
  postId: number;
  userId: string | null;
  parentCommentId: number | null;
  text: string;
  seen: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  user: CommentAuthor | null;
  voteCount: number;
  hasCurrentUserVoted: boolean;
}

interface CommentThreadNode extends CommentReplyNode {
  replies: CommentReplyNode[];
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function assertMembersOnlyCommentAccess(visibility: "public" | "members", isMember: boolean) {
  if (visibility === "members" && !isMember) {
    throw new Error("Membership required.");
  }
}

async function getCommentablePost(postId: number) {
  const nowIso = getUtcNowIso();

  const post = await db
    .select({
      id: posts.id,
      visibility: posts.visibility,
    })
    .from(posts)
    .where(and(eq(posts.id, postId), isNotNull(posts.publishedAt), lte(posts.publishedAt, nowIso)))
    .get();

  if (!post) {
    throw new Error("Post not found.");
  }

  return post;
}

async function getCommentVoteCount(commentId: number): Promise<number> {
  const row = await db
    .select({ count: sql<number>`count(*)` })
    .from(commentVotes)
    .where(eq(commentVotes.commentId, commentId))
    .get();

  return row?.count ?? 0;
}

async function getCommentVoteCounts(commentIds: number[]) {
  if (commentIds.length === 0) {
    return new Map<number, number>();
  }

  const rows = await db
    .select({
      commentId: commentVotes.commentId,
      count: sql<number>`count(*)`,
    })
    .from(commentVotes)
    .where(inArray(commentVotes.commentId, commentIds))
    .groupBy(commentVotes.commentId);

  return new Map(rows.map((row) => [row.commentId, row.count]));
}

async function getUserCommentVotes(commentIds: number[], userId: string | null | undefined) {
  if (!userId || commentIds.length === 0) {
    return new Set<number>();
  }

  const rows = await db
    .select({ commentId: commentVotes.commentId })
    .from(commentVotes)
    .where(and(eq(commentVotes.userId, userId), inArray(commentVotes.commentId, commentIds)));

  return new Set(rows.map((row) => row.commentId));
}

function createCommentThreadNode(
  row: {
    id: number;
    postId: number;
    userId: string | null;
    parentCommentId: number | null;
    text: string;
    seen: boolean;
    isDeleted: boolean;
    deletedAt: string | null;
    deletedByUserId: string | null;
    createdAt: string;
    updatedAt: string;
    userName: string | null;
    userImage: string | null;
    userRole: string | null;
  },
  voteCounts: Map<number, number>,
  userVotes: Set<number>,
): CommentThreadNode {
  return {
    id: row.id,
    postId: row.postId,
    userId: row.userId,
    parentCommentId: row.parentCommentId,
    text: row.text,
    seen: row.seen,
    isDeleted: row.isDeleted,
    deletedAt: row.deletedAt,
    deletedByUserId: row.deletedByUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    user: row.userId
      ? {
          id: row.userId,
          name: row.userName,
          image: row.userImage,
          role: row.userRole,
        }
      : null,
    voteCount: voteCounts.get(row.id) ?? 0,
    hasCurrentUserVoted: userVotes.has(row.id),
    replies: [],
  };
}

function toCommentReplyNode(comment: CommentThreadNode): CommentReplyNode {
  return {
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    parentCommentId: comment.parentCommentId,
    text: comment.text,
    seen: comment.seen,
    isDeleted: comment.isDeleted,
    deletedAt: comment.deletedAt,
    deletedByUserId: comment.deletedByUserId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    user: comment.user,
    voteCount: comment.voteCount,
    hasCurrentUserVoted: comment.hasCurrentUserVoted,
  };
}

export async function listComments(input: {
  postId: number;
  userId?: string | null;
  isMember: boolean;
}) {
  const post = await getCommentablePost(input.postId);
  assertMembersOnlyCommentAccess(post.visibility, input.isMember);

  const commentRows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      parentCommentId: comments.parentCommentId,
      text: comments.text,
      seen: comments.seen,
      isDeleted: comments.isDeleted,
      deletedAt: comments.deletedAt,
      deletedByUserId: comments.deletedByUserId,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      userName: user.name,
      userImage: user.image,
      userRole: user.role,
    })
    .from(comments)
    .leftJoin(user, eq(comments.userId, user.id))
    .where(eq(comments.postId, input.postId));

  const commentIds = commentRows.map((row) => row.id);
  const voteCounts = await getCommentVoteCounts(commentIds);
  const userVotes = await getUserCommentVotes(commentIds, input.userId);
  const commentNodes = commentRows.map((row) =>
    createCommentThreadNode(row, voteCounts, userVotes),
  );
  const commentsById = new Map(commentNodes.map((comment) => [comment.id, comment]));
  const topLevelComments = commentNodes.filter((comment) => comment.parentCommentId === null);

  for (const comment of commentNodes) {
    if (comment.parentCommentId === null) {
      continue;
    }

    const parentComment = commentsById.get(comment.parentCommentId);

    if (parentComment) {
      parentComment.replies.push(toCommentReplyNode(comment));
    }
  }

  topLevelComments.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  for (const comment of topLevelComments) {
    comment.replies.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  return topLevelComments;
}

export async function createComment(input: {
  postId: number;
  userId: string;
  text: string;
  parentCommentId?: number | null;
  isMember: boolean;
  ipAddress?: string | null;
}) {
  const trimmedText = input.text.trim();

  if (trimmedText.length === 0) {
    throw new Error("Comment text is required.");
  }

  const post = await getCommentablePost(input.postId);
  assertMembersOnlyCommentAccess(post.visibility, input.isMember);

  enforceRateLimit({
    ...rateLimitPresets.commentCreation,
    key: buildRateLimitKey([input.userId]),
  });

  if (input.ipAddress) {
    enforceRateLimit({
      ...rateLimitPresets.commentCreationIp,
      key: buildRateLimitKey([input.ipAddress]),
    });
  }

  const parentComment = input.parentCommentId
    ? await db
        .select({
          id: comments.id,
          postId: comments.postId,
          userId: comments.userId,
          parentCommentId: comments.parentCommentId,
        })
        .from(comments)
        .where(and(eq(comments.id, input.parentCommentId), eq(comments.postId, input.postId)))
        .get()
    : null;

  if (input.parentCommentId && !parentComment) {
    throw new Error("Parent comment not found.");
  }

  if (parentComment?.parentCommentId !== null && parentComment?.parentCommentId !== undefined) {
    throw new Error("Replies are limited to one level deep.");
  }

  const nowIso = getUtcNowIso();
  const [comment] = await db
    .insert(comments)
    .values({
      postId: input.postId,
      userId: input.userId,
      parentCommentId: input.parentCommentId ?? null,
      text: trimmedText,
      seen: false,
      isDeleted: false,
      deletedAt: null,
      deletedByUserId: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    .returning();

  if (parentComment?.userId && parentComment.userId !== input.userId) {
    await createNotification({
      userId: parentComment.userId,
      type: "comment_reply",
      postId: input.postId,
      commentId: comment.id,
      actorId: input.userId,
    });
  }

  return comment;
}

export async function deleteComment(input: {
  commentId: number;
  actorUserId: string;
  isAdmin: boolean;
}) {
  const existingComment = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      isDeleted: comments.isDeleted,
    })
    .from(comments)
    .where(eq(comments.id, input.commentId))
    .get();

  if (!existingComment) {
    throw new Error("Comment not found.");
  }

  if (!input.isAdmin && existingComment.userId !== input.actorUserId) {
    throw new Error("Forbidden.");
  }

  if (existingComment.isDeleted) {
    return db.select().from(comments).where(eq(comments.id, input.commentId)).get();
  }

  const nowIso = getUtcNowIso();
  const [comment] = await db
    .update(comments)
    .set({
      isDeleted: true,
      deletedAt: nowIso,
      deletedByUserId: input.actorUserId,
      updatedAt: nowIso,
    })
    .where(eq(comments.id, input.commentId))
    .returning();

  return comment;
}

export async function toggleCommentVote(input: {
  commentId: number;
  userId: string;
  isMember: boolean;
}) {
  enforceRateLimit({
    ...rateLimitPresets.commentVoting,
    key: buildRateLimitKey([input.userId]),
  });

  const nowIso = getUtcNowIso();
  const targetComment = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      userId: comments.userId,
      isDeleted: comments.isDeleted,
      visibility: posts.visibility,
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(
      and(
        eq(comments.id, input.commentId),
        isNotNull(posts.publishedAt),
        lte(posts.publishedAt, nowIso),
      ),
    )
    .get();

  if (!targetComment) {
    throw new Error("Comment not found.");
  }

  assertMembersOnlyCommentAccess(targetComment.visibility, input.isMember);

  if (targetComment.isDeleted) {
    throw new Error("Deleted comments cannot be voted on.");
  }

  const existingVote = await db
    .select({ commentId: commentVotes.commentId })
    .from(commentVotes)
    .where(and(eq(commentVotes.commentId, input.commentId), eq(commentVotes.userId, input.userId)))
    .get();

  if (existingVote) {
    await db
      .delete(commentVotes)
      .where(
        and(eq(commentVotes.commentId, input.commentId), eq(commentVotes.userId, input.userId)),
      );

    return {
      voted: false,
      count: await getCommentVoteCount(input.commentId),
    };
  }

  await db.insert(commentVotes).values({
    commentId: input.commentId,
    userId: input.userId,
    createdAt: nowIso,
  });

  if (targetComment.userId && targetComment.userId !== input.userId) {
    const existingNotification = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, targetComment.userId),
          eq(notifications.commentId, input.commentId),
          eq(notifications.actorId, input.userId),
          eq(notifications.type, "comment_vote"),
        ),
      )
      .get();

    if (!existingNotification) {
      await createNotification({
        userId: targetComment.userId,
        type: "comment_vote",
        postId: targetComment.postId,
        commentId: input.commentId,
        actorId: input.userId,
      });
    }
  }

  return {
    voted: true,
    count: await getCommentVoteCount(input.commentId),
  };
}

export async function listAdminComments(input?: {
  unseenOnly?: boolean;
  postId?: number;
  limit?: number;
}) {
  const conditions = [
    input?.unseenOnly ? eq(comments.seen, false) : undefined,
    input?.postId !== undefined ? eq(comments.postId, input.postId) : undefined,
  ].filter(isDefined);
  const whereCondition =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);
  const query = db
    .select({
      id: comments.id,
      postId: comments.postId,
      parentCommentId: comments.parentCommentId,
      text: comments.text,
      seen: comments.seen,
      isDeleted: comments.isDeleted,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      postSlug: posts.slug,
      postTitle: posts.title,
      userId: comments.userId,
      userName: user.name,
      userEmail: user.email,
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .leftJoin(user, eq(comments.userId, user.id))
    .orderBy(desc(comments.createdAt), desc(comments.id))
    .limit(input?.limit ?? 100);

  return whereCondition ? query.where(whereCondition) : query;
}

export async function markSeen(commentIds: number[]) {
  if (commentIds.length === 0) {
    return 0;
  }

  const result = await db
    .update(comments)
    .set({ seen: true })
    .where(inArray(comments.id, commentIds))
    .run();

  return result.changes;
}
