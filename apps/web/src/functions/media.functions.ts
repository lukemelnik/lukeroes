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

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const audioMimeTypes = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
]);
const imageFilenameExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const audioFilenameExtensions = [".mp3", ".wav", ".m4a"];
const maxImageByteSize = 20 * 1024 * 1024;
const maxAudioByteSize = 100 * 1024 * 1024;

function hasAllowedFilenameExtension(filename: string, allowedExtensions: string[]) {
  const normalizedFilename = filename.trim().toLowerCase();

  return allowedExtensions.some((extension) => normalizedFilename.endsWith(extension));
}

const requestUploadSchema = z
  .object({
    type: z.enum(["audio", "image"]),
    access: z.enum(["public", "members"]).optional(),
    originalFilename: z.string().trim().min(1),
    mimeType: z.string().trim().min(1),
    byteSize: z.number().int().nonnegative().optional(),
    checksum: z.string().trim().min(1).optional(),
  })
  .superRefine((data, context) => {
    const normalizedMimeType = data.mimeType.trim().toLowerCase();
    const supportedMimeTypes = data.type === "image" ? imageMimeTypes : audioMimeTypes;
    const supportedFilenameExtensions =
      data.type === "image" ? imageFilenameExtensions : audioFilenameExtensions;
    const isSupportedUpload =
      supportedMimeTypes.has(normalizedMimeType) ||
      hasAllowedFilenameExtension(data.originalFilename, supportedFilenameExtensions);
    const maxByteSize = data.type === "image" ? maxImageByteSize : maxAudioByteSize;

    if (!isSupportedUpload) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mimeType"],
        message:
          data.type === "image"
            ? "Images must be JPEG, PNG, WebP, or GIF."
            : "Audio uploads must be MP3, WAV, or M4A.",
      });
    }

    if (data.byteSize !== undefined && data.byteSize > maxByteSize) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["byteSize"],
        message:
          data.type === "image"
            ? "Images must be 20MB or smaller."
            : "Audio uploads must be 100MB or smaller.",
      });
    }
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
