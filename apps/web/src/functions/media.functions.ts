import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware } from "@/middleware/admin";
import {
  createMediaWithUploadUrl,
  confirmUpload,
  attachMediaToPost,
  deleteMedia,
} from "@/server/media.server";

const requestUploadSchema = z.object({
  type: z.enum(["audio", "image"]),
  fileKey: z.string().min(1),
  contentType: z.string().min(1),
});

export const requestUploadFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(requestUploadSchema)
  .handler(async ({ data }) => {
    return createMediaWithUploadUrl(data);
  });

const confirmUploadSchema = z.object({
  mediaId: z.number(),
  duration: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  alt: z.string().optional(),
});

export const confirmUploadFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(confirmUploadSchema)
  .handler(async ({ data }) => {
    return confirmUpload(data);
  });

const attachMediaSchema = z.object({
  postId: z.number(),
  mediaId: z.number(),
  role: z.enum(["artwork", "audio", "photo"]),
  displayOrder: z.number().optional(),
});

export const attachMediaFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(attachMediaSchema)
  .handler(async ({ data }) => {
    return attachMediaToPost(data);
  });

const deleteMediaSchema = z.object({ mediaId: z.number() });

export const deleteMediaFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(deleteMediaSchema)
  .handler(async ({ data }) => {
    return deleteMedia(data.mediaId);
  });
