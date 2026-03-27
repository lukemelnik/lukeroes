import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware } from "@/middleware/admin";
import {
  AUDIO_FILENAME_EXTENSIONS,
  MAX_AUDIO_BYTE_SIZE,
  hasAllowedFilenameExtension,
  isSupportedAudioMimeType,
} from "@/lib/media";
import {
  attachMediaToPost,
  bulkDeleteMedia,
  createAudioUploadSession,
  deleteMedia,
  finalizeAudioUpload,
  listMediaAssets,
  updateMediaDefaultAlt,
} from "@/server/media.server";
import { buildRateLimitKey, enforceRateLimit, rateLimitPresets } from "@/server/rate-limit.server";

const requestAudioUploadSchema = z
  .object({
    access: z.enum(["public", "members"]).optional(),
    originalFilename: z.string().trim().min(1),
    mimeType: z.string().trim().min(1),
    byteSize: z.number().int().nonnegative().optional(),
    checksum: z.string().trim().min(1).optional(),
  })
  .superRefine((data, context) => {
    const isSupportedUpload =
      isSupportedAudioMimeType(data.mimeType) ||
      hasAllowedFilenameExtension(data.originalFilename, AUDIO_FILENAME_EXTENSIONS);

    if (!isSupportedUpload) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mimeType"],
        message: "Audio uploads must be MP3, WAV, or M4A.",
      });
    }

    if (data.byteSize !== undefined && data.byteSize > MAX_AUDIO_BYTE_SIZE) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["byteSize"],
        message: "Audio uploads must be 100MB or smaller.",
      });
    }
  });

export const requestAudioUploadFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(requestAudioUploadSchema)
  .handler(async ({ data, context }) => {
    enforceRateLimit({
      ...rateLimitPresets.adminMediaUploads,
      key: buildRateLimitKey([context.user.id]),
    });

    return createAudioUploadSession({
      ...data,
      createdByUserId: context.user.id,
    });
  });

const confirmAudioUploadSchema = z.object({
  mediaId: z.number().int().positive(),
  status: z.enum(["ready", "failed"]).optional(),
  durationSeconds: z.number().int().nonnegative().nullable().optional(),
  waveformPeaks: z.array(z.number()).nullable().optional(),
  processingError: z.string().trim().min(1).nullable().optional(),
  byteSize: z.number().int().nonnegative().optional(),
  format: z.string().trim().min(1).optional(),
});

export const confirmAudioUploadFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(confirmAudioUploadSchema)
  .handler(async ({ data, context }) => {
    enforceRateLimit({
      ...rateLimitPresets.adminMediaUploads,
      key: buildRateLimitKey([context.user.id]),
    });

    return finalizeAudioUpload(data);
  });

const listMediaSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(100).optional(),
  type: z.enum(["audio", "image"]).optional(),
  access: z.enum(["public", "members"]).optional(),
  search: z.string().trim().optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export const listMediaFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(listMediaSchema)
  .handler(async ({ data }) => {
    return listMediaAssets(data);
  });

const updateMediaDefaultAltSchema = z.object({
  mediaId: z.number().int().positive(),
  defaultAlt: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export const updateMediaDefaultAltFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(updateMediaDefaultAltSchema)
  .handler(async ({ data }) => {
    return updateMediaDefaultAlt(data);
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

const bulkDeleteMediaSchema = z.object({
  mediaIds: z.array(z.number().int().positive()).min(1).max(100),
});

export const bulkDeleteMediaFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(bulkDeleteMediaSchema)
  .handler(async ({ data, context }) => {
    return bulkDeleteMedia(data.mediaIds, {
      actorUserId: context.user.id,
      requestMetadata: context.requestMetadata,
    });
  });
