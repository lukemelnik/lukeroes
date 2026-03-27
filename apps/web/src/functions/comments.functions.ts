import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { memberMiddleware } from "@/middleware/member";
import {
  createComment,
  deleteComment,
  listComments,
  toggleCommentVote,
} from "@/server/comments.server";

const listCommentsSchema = z.object({
  postId: z.number().int().positive(),
});

export const listCommentsFn = createServerFn({ method: "GET" })
  .middleware([memberMiddleware])
  .inputValidator(listCommentsSchema)
  .handler(async ({ data, context }) => {
    return listComments({
      postId: data.postId,
      userId: context.session?.user?.id ?? null,
      isMember: context.isMember,
    });
  });

const createCommentSchema = z.object({
  postId: z.number().int().positive(),
  text: z.string().min(1).max(5000),
  parentCommentId: z.number().int().positive().optional(),
});

export const createCommentFn = createServerFn({ method: "POST" })
  .middleware([memberMiddleware])
  .inputValidator(createCommentSchema)
  .handler(async ({ data, context }) => {
    if (!context.session?.user) {
      throw new Error("Unauthorized");
    }

    return createComment({
      postId: data.postId,
      userId: context.session.user.id,
      text: data.text,
      parentCommentId: data.parentCommentId ?? null,
      isMember: context.isMember,
      ipAddress: context.requestMetadata?.ipAddress ?? null,
    });
  });

const deleteCommentSchema = z.object({
  commentId: z.number().int().positive(),
});

export const deleteCommentFn = createServerFn({ method: "POST" })
  .middleware([memberMiddleware])
  .inputValidator(deleteCommentSchema)
  .handler(async ({ data, context }) => {
    if (!context.session?.user) {
      throw new Error("Unauthorized");
    }

    return deleteComment({
      commentId: data.commentId,
      actorUserId: context.session.user.id,
      isAdmin: context.isAdmin,
      requestMetadata: context.requestMetadata,
    });
  });

const toggleVoteSchema = z.object({
  commentId: z.number().int().positive(),
});

export const toggleCommentVoteFn = createServerFn({ method: "POST" })
  .middleware([memberMiddleware])
  .inputValidator(toggleVoteSchema)
  .handler(async ({ data, context }) => {
    if (!context.session?.user) {
      throw new Error("Unauthorized");
    }

    return toggleCommentVote({
      commentId: data.commentId,
      userId: context.session.user.id,
      isMember: context.isMember,
    });
  });
