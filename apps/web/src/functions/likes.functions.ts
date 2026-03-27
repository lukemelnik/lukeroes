import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { memberMiddleware } from "@/middleware/member";
import { getPostLikeCounts, hasUserLiked, togglePostLike } from "@/server/post-likes.server";

const toggleLikeSchema = z.object({
  postId: z.number().int().positive(),
});

export const togglePostLikeFn = createServerFn({ method: "POST" })
  .middleware([memberMiddleware])
  .inputValidator(toggleLikeSchema)
  .handler(async ({ data, context }) => {
    if (!context.session?.user) {
      throw new Error("Unauthorized");
    }

    return togglePostLike({
      postId: data.postId,
      userId: context.session.user.id,
      isMember: context.isMember,
    });
  });

const likeInfoSchema = z.object({
  postIds: z.array(z.number().int().positive()),
});

export const getPostLikeInfoFn = createServerFn({ method: "GET" })
  .middleware([memberMiddleware])
  .inputValidator(likeInfoSchema)
  .handler(async ({ data, context }) => {
    const [counts, userLikes] = await Promise.all([
      getPostLikeCounts(data.postIds),
      hasUserLiked(data.postIds, context.session?.user?.id),
    ]);

    return data.postIds.map((id) => ({
      postId: id,
      count: counts.get(id) ?? 0,
      liked: userLikes.get(id) ?? false,
    }));
  });
