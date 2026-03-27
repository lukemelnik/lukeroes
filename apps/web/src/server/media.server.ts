import { db } from "@lukeroes/db";
import { media, mediaVariants, postMedia, posts } from "@lukeroes/db/schema/membership";
import { and, eq, sql } from "drizzle-orm";
import { createAdminAuditLogEntry } from "@/server/audit-log.server";
import { generateUuidV7 } from "@/server/id.server";
import type { RequestMetadata } from "@/server/request.server";
import {
  deleteFile,
  getPresignedUploadUrl,
  getPublicUrl,
  getSignedUrl,
} from "@/server/services/storage.service";
import { getUtcNowIso } from "@/server/utc";

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function normalizeFileExtension(input: string): string {
  const dotIndex = input.lastIndexOf(".");

  if (dotIndex >= 0) {
    const extension = input
      .slice(dotIndex + 1)
      .trim()
      .toLowerCase();

    if (extension.length > 0) {
      return extension;
    }
  }

  const mimeToExtension = new Map<string, string>([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
    ["audio/mpeg", "mp3"],
    ["audio/wav", "wav"],
    ["audio/x-wav", "wav"],
    ["audio/mp4", "m4a"],
    ["audio/x-m4a", "m4a"],
  ]);

  return mimeToExtension.get(input.trim().toLowerCase()) ?? "bin";
}

function buildOriginalFileKey(
  type: "audio" | "image",
  assetKey: string,
  extension: string,
): string {
  return type === "image"
    ? `images/${assetKey}/original.${extension}`
    : `audio/${assetKey}/original.${extension}`;
}

function buildDisplayFileKey(assetKey: string): string {
  return `images/${assetKey}/display.webp`;
}

function buildThumbFileKey(assetKey: string): string {
  return `images/${assetKey}/thumb.webp`;
}

function getPreferredVariantKind(type: "audio" | "image") {
  return type === "audio" ? "original" : "display";
}

export async function createMediaWithUploadUrl(input: {
  type: "audio" | "image";
  access?: "public" | "members";
  originalFilename: string;
  mimeType: string;
  createdByUserId: string;
  byteSize?: number;
  checksum?: string;
}) {
  const nowIso = getUtcNowIso();
  const assetKey = generateUuidV7();
  const extension = normalizeFileExtension(input.originalFilename || input.mimeType);
  const originalFileKey = buildOriginalFileKey(input.type, assetKey, extension);

  const [record] = await db
    .insert(media)
    .values({
      assetKey,
      type: input.type,
      access: input.access ?? "public",
      status: "uploading",
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      byteSize: input.byteSize ?? null,
      checksum: input.checksum ?? null,
      createdByUserId: input.createdByUserId,
      defaultAlt: null,
      durationSeconds: null,
      waveformPeaks: null,
      processingError: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    .returning();

  await db.insert(mediaVariants).values({
    mediaId: record.id,
    kind: "original",
    fileKey: originalFileKey,
    format: extension,
    width: null,
    height: null,
    byteSize: input.byteSize ?? null,
    createdAt: nowIso,
  });

  const uploadUrl = await getPresignedUploadUrl(originalFileKey, input.mimeType);

  return {
    media: record,
    uploadUrl,
    originalFileKey,
    displayFileKey: input.type === "image" ? buildDisplayFileKey(assetKey) : null,
    thumbFileKey: input.type === "image" ? buildThumbFileKey(assetKey) : null,
  };
}

export async function confirmUpload(input: {
  mediaId: number;
  status?: "processing" | "ready" | "failed";
  defaultAlt?: string;
  durationSeconds?: number;
  waveformPeaks?: number[];
  processingError?: string;
  width?: number;
  height?: number;
  byteSize?: number;
  format?: string;
  displayVariantByteSize?: number;
  thumbVariantByteSize?: number;
}) {
  const nowIso = getUtcNowIso();
  const existingMedia = await db.select().from(media).where(eq(media.id, input.mediaId)).get();

  if (!existingMedia) {
    throw new Error("Media not found.");
  }

  const [record] = await db
    .update(media)
    .set({
      status: input.status ?? "ready",
      defaultAlt: input.defaultAlt ?? existingMedia.defaultAlt,
      durationSeconds: input.durationSeconds ?? existingMedia.durationSeconds,
      waveformPeaks: input.waveformPeaks
        ? JSON.stringify(input.waveformPeaks)
        : existingMedia.waveformPeaks,
      processingError: input.processingError ?? null,
      byteSize: input.byteSize ?? existingMedia.byteSize,
      updatedAt: nowIso,
    })
    .where(eq(media.id, input.mediaId))
    .returning();

  const originalVariant = await db
    .select({ id: mediaVariants.id, fileKey: mediaVariants.fileKey })
    .from(mediaVariants)
    .where(and(eq(mediaVariants.mediaId, input.mediaId), eq(mediaVariants.kind, "original")))
    .get();

  if (!originalVariant) {
    throw new Error("Media original variant not found.");
  }

  if (input.byteSize !== undefined || input.format !== undefined) {
    await db
      .update(mediaVariants)
      .set({
        byteSize: input.byteSize ?? null,
        format: input.format ?? null,
      })
      .where(eq(mediaVariants.id, originalVariant.id));
  }

  if (record.type === "image" && input.width && input.height) {
    const displayFileKey = buildDisplayFileKey(record.assetKey);
    const thumbFileKey = buildThumbFileKey(record.assetKey);

    await db
      .insert(mediaVariants)
      .values({
        mediaId: record.id,
        kind: "display",
        fileKey: displayFileKey,
        format: "webp",
        width: input.width,
        height: input.height,
        byteSize: input.displayVariantByteSize ?? null,
        createdAt: nowIso,
      })
      .onConflictDoUpdate({
        target: [mediaVariants.mediaId, mediaVariants.kind],
        set: {
          fileKey: displayFileKey,
          format: "webp",
          width: input.width,
          height: input.height,
          byteSize: input.displayVariantByteSize ?? null,
        },
      });

    await db
      .insert(mediaVariants)
      .values({
        mediaId: record.id,
        kind: "thumb",
        fileKey: thumbFileKey,
        format: "webp",
        width: input.width,
        height: input.height,
        byteSize: input.thumbVariantByteSize ?? null,
        createdAt: nowIso,
      })
      .onConflictDoUpdate({
        target: [mediaVariants.mediaId, mediaVariants.kind],
        set: {
          fileKey: thumbFileKey,
          format: "webp",
          width: input.width,
          height: input.height,
          byteSize: input.thumbVariantByteSize ?? null,
        },
      });
  }

  return record;
}

export async function attachMediaToPost(input: {
  postId: number;
  mediaId: number;
  role: "artwork" | "audio" | "photo" | "inline";
  displayOrder?: number;
  altOverride?: string;
  caption?: string;
}) {
  const [postRecord, mediaRecord] = await Promise.all([
    db.select({ visibility: posts.visibility }).from(posts).where(eq(posts.id, input.postId)).get(),
    db
      .select({
        type: media.type,
        access: media.access,
        status: media.status,
      })
      .from(media)
      .where(eq(media.id, input.mediaId))
      .get(),
  ]);

  if (!postRecord) {
    throw new Error("Post not found.");
  }

  if (!mediaRecord) {
    throw new Error("Media not found.");
  }

  if (mediaRecord.status !== "ready") {
    throw new Error("Only ready media can be attached to posts.");
  }

  if (postRecord.visibility === "public" && mediaRecord.access !== "public") {
    throw new Error("Members-only media cannot be attached to public posts.");
  }

  if (input.role === "audio" && mediaRecord.type !== "audio") {
    throw new Error("Audio role requires audio media.");
  }

  if (["artwork", "photo", "inline"].includes(input.role) && mediaRecord.type !== "image") {
    throw new Error("Image media is required for artwork, photo, and inline roles.");
  }

  await db
    .insert(postMedia)
    .values({
      postId: input.postId,
      mediaId: input.mediaId,
      role: input.role,
      displayOrder: input.displayOrder ?? 0,
      altOverride: input.altOverride ?? null,
      caption: input.caption ?? null,
    })
    .onConflictDoUpdate({
      target: [postMedia.postId, postMedia.mediaId, postMedia.role],
      set: {
        displayOrder: input.displayOrder ?? 0,
        altOverride: input.altOverride ?? null,
        caption: input.caption ?? null,
      },
    });
}

export async function getMediaUrl(mediaId: number, isAuthorized: boolean) {
  const mediaRecord = await db.select().from(media).where(eq(media.id, mediaId)).get();

  if (!mediaRecord) {
    return null;
  }

  if (mediaRecord.access === "members" && !isAuthorized) {
    return null;
  }

  const preferredVariantKind = getPreferredVariantKind(mediaRecord.type);
  const variants = await db
    .select({ kind: mediaVariants.kind, fileKey: mediaVariants.fileKey })
    .from(mediaVariants)
    .where(eq(mediaVariants.mediaId, mediaId));
  const preferredVariant =
    variants.find((variant) => variant.kind === preferredVariantKind) ??
    variants.find((variant) => variant.kind === "original") ??
    variants[0];

  if (!preferredVariant) {
    return null;
  }

  if (mediaRecord.access === "public") {
    return getPublicUrl(preferredVariant.fileKey);
  }

  return getSignedUrl(preferredVariant.fileKey, 3600);
}

export async function deleteMedia(
  mediaId: number,
  auditContext?: { actorUserId: string; requestMetadata?: RequestMetadata | null },
) {
  const usageRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(postMedia)
    .where(eq(postMedia.mediaId, mediaId))
    .get();

  if ((usageRow?.count ?? 0) > 0) {
    throw new Error("Media cannot be deleted while it is attached to a post.");
  }

  const mediaRecord = await db
    .select({
      id: media.id,
      assetKey: media.assetKey,
      type: media.type,
      access: media.access,
      originalFilename: media.originalFilename,
    })
    .from(media)
    .where(eq(media.id, mediaId))
    .get();

  if (!mediaRecord) {
    throw new Error("Media not found.");
  }

  const variants = await db
    .select({ id: mediaVariants.id, fileKey: mediaVariants.fileKey })
    .from(mediaVariants)
    .where(eq(mediaVariants.mediaId, mediaId));

  if (variants.length > 0) {
    await Promise.all(variants.map((variant) => deleteFile(variant.fileKey)));
  }

  await db.delete(media).where(eq(media.id, mediaId));

  if (auditContext) {
    await createAdminAuditLogEntry({
      actorUserId: auditContext.actorUserId,
      action: "media.delete",
      targetType: "media",
      targetId: `${mediaRecord.id}`,
      metadata: {
        assetKey: mediaRecord.assetKey,
        type: mediaRecord.type,
        access: mediaRecord.access,
        originalFilename: mediaRecord.originalFilename,
        fileKeys: variants.map((variant) => variant.fileKey),
      },
      requestMetadata: auditContext.requestMetadata,
    });
  }
}

export async function listMediaAssets(input?: {
  type?: "audio" | "image";
  access?: "public" | "members";
  search?: string;
  limit?: number;
}) {
  const conditions = [
    input?.type ? eq(media.type, input.type) : undefined,
    input?.access ? eq(media.access, input.access) : undefined,
    input?.search && input.search.trim().length > 0
      ? orLike(`%${input.search.trim()}%`)
      : undefined,
  ].filter(isDefined);

  const whereCondition =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);
  const baseQuery = db
    .select({
      id: media.id,
      assetKey: media.assetKey,
      type: media.type,
      access: media.access,
      status: media.status,
      originalFilename: media.originalFilename,
      mimeType: media.mimeType,
      byteSize: media.byteSize,
      defaultAlt: media.defaultAlt,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
      usageCount: sql<number>`(
        SELECT count(*)
        FROM ${postMedia}
        WHERE ${postMedia.mediaId} = ${media.id}
      )`,
    })
    .from(media)
    .orderBy(sql`${media.createdAt} DESC`, sql`${media.id} DESC`)
    .limit(input?.limit ?? 100);

  if (!whereCondition) {
    return baseQuery;
  }

  return baseQuery.where(whereCondition);
}

function orLike(searchValue: string) {
  return sql`(${media.originalFilename} LIKE ${searchValue} OR ${media.defaultAlt} LIKE ${searchValue})`;
}
