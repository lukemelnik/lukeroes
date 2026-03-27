import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPostSchema, updatePostSchema } from "@lukeroes/db/schema/membership";
import { adminMiddleware } from "@/middleware/admin";
import { memberMiddleware } from "@/middleware/member";
import {
  listPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} from "@/server/posts.server";

const listPostsSchema = z.object({
  limit: z.number().min(1).max(50).optional(),
  cursor: z.string().optional(),
  type: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
});

export const listPostsFn = createServerFn({ method: "GET" })
  .middleware([memberMiddleware])
  .inputValidator(listPostsSchema)
  .handler(async ({ data, context }) => {
    return listPosts({
      ...data,
      isMember: context.isMember,
    });
  });

const getPostSchema = z.object({
  slug: z.string().min(1),
});

export const getPostBySlugFn = createServerFn({ method: "GET" })
  .middleware([memberMiddleware])
  .inputValidator(getPostSchema)
  .handler(async ({ data, context }) => {
    return getPostBySlug(data.slug, context.isMember);
  });

export const createPostFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(createPostSchema)
  .handler(async ({ data, context }) => {
    return createPost({
      ...data,
      authorId: context.user.id,
    });
  });

export const updatePostFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(updatePostSchema)
  .handler(async ({ data }) => {
    return updatePost(data);
  });

const deletePostSchema = z.object({ id: z.number() });

export const deletePostFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(deletePostSchema)
  .handler(async ({ data }) => {
    return deletePost(data.id);
  });
