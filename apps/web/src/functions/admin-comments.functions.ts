import { db } from "@lukeroes/db";
import { comments } from "@lukeroes/db/schema/membership";
import { createServerFn } from "@tanstack/react-start";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { adminMiddleware } from "@/middleware/admin";
import { listAdminComments, markSeen } from "@/server/comments.server";

const listAdminCommentsSchema = z.object({
  unseenOnly: z.boolean().optional(),
  postId: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const listAdminCommentsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(listAdminCommentsSchema)
  .handler(async ({ data }) => {
    return listAdminComments(data);
  });

const markSeenSchema = z.object({
  commentIds: z.array(z.number().int().positive()),
});

export const markCommentSeenFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(markSeenSchema)
  .handler(async ({ data }) => {
    return markSeen(data.commentIds);
  });

export const unseenCommentCountFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const row = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.seen, false))
      .get();
    return row?.count ?? 0;
  });
