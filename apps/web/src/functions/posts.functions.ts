import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createPostSchema, updatePostSchema } from "@lukeroes/db/schema/membership";
import { adminMiddleware } from "@/middleware/admin";
import { memberMiddleware } from "@/middleware/member";
import {
  createPost,
  deletePost,
  getAdminPostById,
  getPostBySlug,
  listAdminPosts,
  listPosts,
  syncPostInlineMedia,
  syncPostMediaAttachments,
  updatePost,
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

const listAdminPostsSchema = z.object({
  type: z.string().optional(),
  search: z.string().optional(),
});

export const listAdminPostsFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(listAdminPostsSchema)
  .handler(async ({ data }) => {
    return listAdminPosts(data);
  });

const getAdminPostSchema = z.object({
  id: z.number().int().positive(),
});

export const getAdminPostByIdFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(getAdminPostSchema)
  .handler(async ({ data }) => {
    return getAdminPostById(data.id);
  });

const mediaAttachmentSchema = z.object({
  mediaId: z.number().int().positive(),
  role: z.enum(["artwork", "audio", "photo"]),
  displayOrder: z.number().int().nonnegative(),
});

const rolesToSyncSchema = z.array(z.enum(["artwork", "audio", "photo"])).optional();

const createPostWithMediaSchema = createPostSchema.extend({
  mediaAttachments: z.array(mediaAttachmentSchema).optional(),
  rolesToSync: rolesToSyncSchema,
});

export const createPostFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(createPostWithMediaSchema)
  .handler(async ({ data, context }) => {
    const { mediaAttachments, rolesToSync, ...postData } = data;
    const post = await createPost({
      ...postData,
      authorId: context.user.id,
    });

    if (post.content && (post.type === "writing" || post.type === "note")) {
      await syncPostInlineMedia(post.id, post.content);
    }

    if (mediaAttachments || rolesToSync) {
      await syncPostMediaAttachments(post.id, mediaAttachments ?? [], rolesToSync ?? []);
    }

    return post;
  });

const updatePostWithMediaSchema = updatePostSchema.extend({
  mediaAttachments: z.array(mediaAttachmentSchema).optional(),
  rolesToSync: rolesToSyncSchema,
});

export const updatePostFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(updatePostWithMediaSchema)
  .handler(async ({ data, context }) => {
    const { mediaAttachments, rolesToSync, ...postData } = data;
    const post = await updatePost(postData, {
      actorUserId: context.user.id,
      requestMetadata: context.requestMetadata,
    });

    if (post.content !== undefined) {
      await syncPostInlineMedia(post.id, post.content);
    }

    if (mediaAttachments !== undefined || rolesToSync !== undefined) {
      await syncPostMediaAttachments(post.id, mediaAttachments ?? [], rolesToSync ?? []);
    }

    return post;
  });

const deletePostSchema = z.object({ id: z.number().int().positive() });

export const deletePostFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(deletePostSchema)
  .handler(async ({ data, context }) => {
    return deletePost(data.id, {
      actorUserId: context.user.id,
      requestMetadata: context.requestMetadata,
    });
  });
