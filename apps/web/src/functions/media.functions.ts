import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware } from "@/middleware/admin";
import {
  attachMediaToPost,
  confirmUpload,
  createMediaWithUploadUrl,
  deleteMedia,
} from "@/server/media.server";
import { buildRateLimitKey, enforceRateLimit, rateLimitPresets } from "@/server/rate-limit.server";

const requestUploadSchema = z.object({
  type: z.enum(["audio", "image"]),
  access: z.enum(["public", "members"]).optional(),
  originalFilename: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  byteSize: z.number().int().nonnegative().optional(),
  checksum: z.string().trim().min(1).optional(),
});

export const requestUploadFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(requestUploadSchema)
  .handler(async ({ data, context }) => {
    enforceRateLimit({
      ...rateLimitPresets.adminMediaUploads,
      key: buildRateLimitKey([context.user.id]),
    });

    return createMediaWithUploadUrl({
      ...data,
      createdByUserId: context.user.id,
    });
  });

const confirmUploadSchema = z.object({
  mediaId: z.number().int().positive(),
  status: z.enum(["processing", "ready", "failed"]).optional(),
  defaultAlt: z.string().trim().min(1).optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  waveformPeaks: z.array(z.number()).optional(),
  processingError: z.string().trim().min(1).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  byteSize: z.number().int().nonnegative().optional(),
  format: z.string().trim().min(1).optional(),
  displayVariantByteSize: z.number().int().nonnegative().optional(),
  thumbVariantByteSize: z.number().int().nonnegative().optional(),
});

export const confirmUploadFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(confirmUploadSchema)
  .handler(async ({ data, context }) => {
    enforceRateLimit({
      ...rateLimitPresets.adminMediaUploads,
      key: buildRateLimitKey([context.user.id]),
    });

    return confirmUpload(data);
  });

const attachMediaSchema = z.object({
  postId: z.number().int().positive(),
  mediaId: z.number().int().positive(),
  role: z.enum(["artwork", "audio", "photo", "inline"]),
  displayOrder: z.number().int().nonnegative().optional(),
  altOverride: z.string().trim().min(1).optional(),
  caption: z.string().trim().min(1).optional(),
});

export const attachMediaFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(attachMediaSchema)
  .handler(async ({ data }) => {
    return attachMediaToPost(data);
  });

const deleteMediaSchema = z.object({ mediaId: z.number().int().positive() });

export const deleteMediaFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(deleteMediaSchema)
  .handler(async ({ data, context }) => {
    return deleteMedia(data.mediaId, {
      actorUserId: context.user.id,
      requestMetadata: context.requestMetadata,
    });
  });
