import { db } from "@lukeroes/db";
import { media, mediaVariants, postMedia, posts } from "@lukeroes/db/schema/membership";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { createAdminAuditLogEntry } from "@/server/audit-log.server";
import { generateUuidV7 } from "@/server/id.server";
import type { RequestMetadata } from "@/server/request.server";
import {
  MAX_AUDIO_BYTE_SIZE,
  type AdminMediaAsset,
  type AdminMediaVariant,
  type MediaAccess,
  type MediaType,
  resolveMediaFormat,
} from "@/lib/media";
import {
  deleteFile,
  getFileMetadata,
  getPresignedUploadUrl,
  getPublicUrl,
  getSignedUrl,
} from "@/server/services/storage.service";
import { getUtcNowIso } from "@/server/utc";

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function buildOriginalFileKey(type: MediaType, assetKey: string, extension: string): string {
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

function getPreferredVariantKind(type: MediaType) {
  return type === "audio" ? "original" : "display";
}

function getPreviewVariantKind(type: MediaType) {
  return type === "audio" ? "original" : "thumb";
}

function assertPostSupportsMediaRole(
  postType: "writing" | "audio" | "note" | "photo",
  role: "artwork" | "audio" | "photo" | "inline",
) {
  if ((postType === "writing" || postType === "note") && role !== "inline") {
    throw new Error("Writing and note posts can only use inline image media.");
  }

  if (postType === "audio" && role !== "audio" && role !== "artwork") {
    throw new Error("Audio posts can only use audio files and artwork.");
  }

  if (postType === "photo" && role !== "photo") {
    throw new Error("Photo posts can only use photo media.");
  }
}

function isSingleAttachmentRole(role: "artwork" | "audio" | "photo" | "inline") {
  return role === "audio" || role === "artwork";
}

function buildVariantUrl(access: MediaAccess, fileKey: string) {
  if (access === "public") {
    return Promise.resolve(getPublicUrl(fileKey));
  }

  return getSignedUrl(fileKey, 3600);
}

function parseWaveformPeaks(waveformPeaks: string | null): number[] | null {
  if (!waveformPeaks) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(waveformPeaks);

    if (!Array.isArray(parsedValue)) {
      return null;
    }

    return parsedValue.filter((value): value is number => typeof value === "number");
  } catch {
    return null;
  }
}

async function hydrateMediaAssets(
  rows: Array<{
    id: number;
    assetKey: string;
    type: MediaType;
    access: MediaAccess;
    status: "uploading" | "processing" | "ready" | "failed";
    originalFilename: string;
    mimeType: string;
    byteSize: number | null;
    defaultAlt: string | null;
    durationSeconds: number | null;
    waveformPeaks: string | null;
    processingError: string | null;
    createdAt: string;
    updatedAt: string;
    usageCount: number;
  }>,
): Promise<AdminMediaAsset[]> {
  if (rows.length === 0) {
    return [];
  }

  const mediaIds = rows.map((row) => row.id);
  const variantRows = await db
    .select({
      mediaId: mediaVariants.mediaId,
      kind: mediaVariants.kind,
      fileKey: mediaVariants.fileKey,
      format: mediaVariants.format,
      width: mediaVariants.width,
      height: mediaVariants.height,
      byteSize: mediaVariants.byteSize,
    })
    .from(mediaVariants)
    .where(inArray(mediaVariants.mediaId, mediaIds));

  const variantsByMediaId = new Map<number, typeof variantRows>();

  for (const variantRow of variantRows) {
    const existingVariants = variantsByMediaId.get(variantRow.mediaId) ?? [];
    existingVariants.push(variantRow);
    variantsByMediaId.set(variantRow.mediaId, existingVariants);
  }

  return Promise.all(
    rows.map(async (row) => {
      const rawVariants = variantsByMediaId.get(row.id) ?? [];
      const variants = await Promise.all(
        rawVariants.map(
          async (variantRow): Promise<AdminMediaVariant> => ({
            kind: variantRow.kind,
            fileKey: variantRow.fileKey,
            url: await buildVariantUrl(row.access, variantRow.fileKey),
            format: variantRow.format,
            width: variantRow.width,
            height: variantRow.height,
            byteSize: variantRow.byteSize,
          }),
        ),
      );

      const previewVariant =
        variants.find((variant) => variant.kind === getPreviewVariantKind(row.type)) ??
        variants.find((variant) => variant.kind === getPreferredVariantKind(row.type)) ??
        variants.find((variant) => variant.kind === "original") ??
        null;
      const displayVariant =
        variants.find((variant) => variant.kind === "display") ??
        variants.find((variant) => variant.kind === "original") ??
        null;
      const thumbVariant =
        variants.find((variant) => variant.kind === "thumb") ??
        variants.find((variant) => variant.kind === "display") ??
        variants.find((variant) => variant.kind === "original") ??
        null;

      return {
        id: row.id,
        assetKey: row.assetKey,
        type: row.type,
        access: row.access,
        status: row.status,
        originalFilename: row.originalFilename,
        mimeType: row.mimeType,
        byteSize: row.byteSize,
        defaultAlt: row.defaultAlt,
        durationSeconds: row.durationSeconds,
        waveformPeaks: parseWaveformPeaks(row.waveformPeaks),
        processingError: row.processingError,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        usageCount: row.usageCount,
        canDelete: row.usageCount === 0,
        previewUrl: previewVariant?.url ?? null,
        displayUrl: displayVariant?.url ?? null,
        thumbUrl: thumbVariant?.url ?? null,
        variants,
      };
    }),
  );
}

async function getMediaRowById(mediaId: number) {
  return db
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
      durationSeconds: media.durationSeconds,
      waveformPeaks: media.waveformPeaks,
      processingError: media.processingError,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
      usageCount: sql<number>`(
        SELECT count(*)
        FROM ${postMedia}
        WHERE ${postMedia.mediaId} = ${media.id}
      )`,
    })
    .from(media)
    .where(eq(media.id, mediaId))
    .get();
}

export async function getAdminMediaAssetById(mediaId: number): Promise<AdminMediaAsset | null> {
  const row = await getMediaRowById(mediaId);

  if (!row) {
    return null;
  }

  const [asset] = await hydrateMediaAssets([row]);

  return asset ?? null;
}

export async function createAudioUploadSession(input: {
  access?: MediaAccess;
  originalFilename: string;
  mimeType: string;
  createdByUserId: string;
  byteSize?: number;
  checksum?: string;
}) {
  const nowIso = getUtcNowIso();
  const assetKey = generateUuidV7();
  const extension = resolveMediaFormat(input.originalFilename, input.mimeType) ?? "bin";
  const originalFileKey = buildOriginalFileKey("audio", assetKey, extension);

  const [record] = await db
    .insert(media)
    .values({
      assetKey,
      type: "audio",
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
  };
}

export async function finalizeAudioUpload(input: {
  mediaId: number;
  status?: "ready" | "failed";
  durationSeconds?: number | null;
  waveformPeaks?: number[] | null;
  processingError?: string | null;
  byteSize?: number;
  format?: string;
}) {
  const nowIso = getUtcNowIso();
  const existingMedia = await db.select().from(media).where(eq(media.id, input.mediaId)).get();

  if (!existingMedia) {
    throw new Error("Media not found.");
  }

  if (existingMedia.type !== "audio") {
    throw new Error("Media is not an audio asset.");
  }

  const originalVariant = await db
    .select({
      id: mediaVariants.id,
      fileKey: mediaVariants.fileKey,
    })
    .from(mediaVariants)
    .where(and(eq(mediaVariants.mediaId, input.mediaId), eq(mediaVariants.kind, "original")))
    .get();

  if (!originalVariant) {
    throw new Error("Media original variant not found.");
  }

  const uploadedFileMetadata =
    input.status === "failed" ? null : await getFileMetadata(originalVariant.fileKey);

  if (input.status !== "failed" && !uploadedFileMetadata) {
    throw new Error("Uploaded audio file not found in storage.");
  }

  const uploadedByteSize = uploadedFileMetadata?.contentLength ?? null;
  const isOversizedUpload =
    input.status !== "failed" &&
    uploadedByteSize !== null &&
    uploadedByteSize > MAX_AUDIO_BYTE_SIZE;

  if (isOversizedUpload) {
    await deleteFile(originalVariant.fileKey).catch(() => undefined);
  }

  const resolvedStatus = isOversizedUpload ? "failed" : (input.status ?? "ready");
  const resolvedProcessingError = isOversizedUpload
    ? "Audio uploads must be 100MB or smaller."
    : input.status === "failed"
      ? (input.processingError ?? "Audio upload failed.")
      : (input.processingError ?? null);
  const resolvedByteSize = uploadedByteSize ?? input.byteSize ?? existingMedia.byteSize ?? null;

  const [record] = await db
    .update(media)
    .set({
      status: resolvedStatus,
      durationSeconds:
        input.durationSeconds !== undefined ? input.durationSeconds : existingMedia.durationSeconds,
      waveformPeaks:
        input.waveformPeaks !== undefined
          ? input.waveformPeaks
            ? JSON.stringify(input.waveformPeaks)
            : null
          : existingMedia.waveformPeaks,
      processingError: resolvedProcessingError,
      byteSize: resolvedByteSize,
      updatedAt: nowIso,
    })
    .where(eq(media.id, input.mediaId))
    .returning();

  await db
    .update(mediaVariants)
    .set({
      byteSize: resolvedByteSize,
      format:
        input.format ?? resolveMediaFormat(existingMedia.originalFilename, existingMedia.mimeType),
    })
    .where(eq(mediaVariants.id, originalVariant.id));

  const asset = await getAdminMediaAssetById(record.id);

  if (!asset) {
    throw new Error("Media not found.");
  }

  return asset;
}

export async function createPendingImageUpload(input: {
  access?: MediaAccess;
  originalFilename: string;
  mimeType: string;
  createdByUserId: string;
  byteSize: number;
  checksum: string;
  defaultAlt?: string | null;
}) {
  const nowIso = getUtcNowIso();
  const assetKey = generateUuidV7();
  const extension = resolveMediaFormat(input.originalFilename, input.mimeType) ?? "bin";
  const originalFileKey = buildOriginalFileKey("image", assetKey, extension);

  const [record] = await db
    .insert(media)
    .values({
      assetKey,
      type: "image",
      access: input.access ?? "public",
      status: "processing",
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      checksum: input.checksum,
      createdByUserId: input.createdByUserId,
      defaultAlt: input.defaultAlt ?? null,
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
    byteSize: input.byteSize,
    createdAt: nowIso,
  });

  return {
    media: record,
    originalFileKey,
    displayFileKey: buildDisplayFileKey(assetKey),
    thumbFileKey: buildThumbFileKey(assetKey),
  };
}

export async function finalizeImageUpload(input: {
  mediaId: number;
  original: {
    width: number | null;
    height: number | null;
    byteSize: number;
    format: string;
  };
  display: {
    width: number;
    height: number;
    byteSize: number;
  };
  thumb: {
    width: number;
    height: number;
    byteSize: number;
  };
}) {
  const nowIso = getUtcNowIso();
  const existingMedia = await db.select().from(media).where(eq(media.id, input.mediaId)).get();

  if (!existingMedia) {
    throw new Error("Media not found.");
  }

  if (existingMedia.type !== "image") {
    throw new Error("Media is not an image asset.");
  }

  const originalVariant = await db
    .select({ id: mediaVariants.id })
    .from(mediaVariants)
    .where(and(eq(mediaVariants.mediaId, input.mediaId), eq(mediaVariants.kind, "original")))
    .get();

  if (!originalVariant) {
    throw new Error("Media original variant not found.");
  }

  db.transaction((tx) => {
    tx.update(media)
      .set({
        status: "ready",
        processingError: null,
        byteSize: input.original.byteSize,
        updatedAt: nowIso,
      })
      .where(eq(media.id, input.mediaId))
      .run();

    tx.update(mediaVariants)
      .set({
        format: input.original.format,
        width: input.original.width,
        height: input.original.height,
        byteSize: input.original.byteSize,
      })
      .where(eq(mediaVariants.id, originalVariant.id))
      .run();

    tx.insert(mediaVariants)
      .values({
        mediaId: input.mediaId,
        kind: "display",
        fileKey: buildDisplayFileKey(existingMedia.assetKey),
        format: "webp",
        width: input.display.width,
        height: input.display.height,
        byteSize: input.display.byteSize,
        createdAt: nowIso,
      })
      .onConflictDoUpdate({
        target: [mediaVariants.mediaId, mediaVariants.kind],
        set: {
          fileKey: buildDisplayFileKey(existingMedia.assetKey),
          format: "webp",
          width: input.display.width,
          height: input.display.height,
          byteSize: input.display.byteSize,
        },
      })
      .run();

    tx.insert(mediaVariants)
      .values({
        mediaId: input.mediaId,
        kind: "thumb",
        fileKey: buildThumbFileKey(existingMedia.assetKey),
        format: "webp",
        width: input.thumb.width,
        height: input.thumb.height,
        byteSize: input.thumb.byteSize,
        createdAt: nowIso,
      })
      .onConflictDoUpdate({
        target: [mediaVariants.mediaId, mediaVariants.kind],
        set: {
          fileKey: buildThumbFileKey(existingMedia.assetKey),
          format: "webp",
          width: input.thumb.width,
          height: input.thumb.height,
          byteSize: input.thumb.byteSize,
        },
      })
      .run();
  });

  const asset = await getAdminMediaAssetById(input.mediaId);

  if (!asset) {
    throw new Error("Media not found.");
  }

  return asset;
}

export async function markMediaUploadFailed(mediaId: number, processingError: string) {
  const nowIso = getUtcNowIso();
  const [record] = await db
    .update(media)
    .set({
      status: "failed",
      processingError,
      updatedAt: nowIso,
    })
    .where(eq(media.id, mediaId))
    .returning();

  if (!record) {
    throw new Error("Media not found.");
  }

  const asset = await getAdminMediaAssetById(mediaId);

  if (!asset) {
    throw new Error("Media not found.");
  }

  return asset;
}

export async function updateMediaDefaultAlt(input: { mediaId: number; defaultAlt: string | null }) {
  const existingMedia = await db.select().from(media).where(eq(media.id, input.mediaId)).get();

  if (!existingMedia) {
    throw new Error("Media not found.");
  }

  if (existingMedia.type !== "image") {
    throw new Error("Only image media supports alt text.");
  }

  const nowIso = getUtcNowIso();

  await db
    .update(media)
    .set({
      defaultAlt: input.defaultAlt,
      updatedAt: nowIso,
    })
    .where(eq(media.id, input.mediaId));

  const asset = await getAdminMediaAssetById(input.mediaId);

  if (!asset) {
    throw new Error("Media not found.");
  }

  return asset;
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
    db
      .select({
        type: posts.type,
        visibility: posts.visibility,
      })
      .from(posts)
      .where(eq(posts.id, input.postId))
      .get(),
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

  assertPostSupportsMediaRole(postRecord.type, input.role);

  if (postRecord.visibility === "public" && mediaRecord.access !== "public") {
    throw new Error("Members-only media cannot be attached to public posts.");
  }

  if (input.role === "audio" && mediaRecord.type !== "audio") {
    throw new Error("Audio role requires audio media.");
  }

  if (
    (input.role === "artwork" || input.role === "photo" || input.role === "inline") &&
    mediaRecord.type !== "image"
  ) {
    throw new Error("Image media is required for artwork, photo, and inline roles.");
  }

  if (isSingleAttachmentRole(input.role)) {
    await db
      .delete(postMedia)
      .where(
        and(
          eq(postMedia.postId, input.postId),
          eq(postMedia.role, input.role),
          ne(postMedia.mediaId, input.mediaId),
        ),
      );
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

  if (!mediaRecord || mediaRecord.status !== "ready") {
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

  return buildVariantUrl(mediaRecord.access, preferredVariant.fileKey);
}

async function assertMediaUnused(mediaIds: number[]) {
  const usageRows = await db
    .select({
      mediaId: postMedia.mediaId,
      usageCount: sql<number>`count(*)`,
    })
    .from(postMedia)
    .where(inArray(postMedia.mediaId, mediaIds))
    .groupBy(postMedia.mediaId);

  if (usageRows.length > 0) {
    throw new Error("Media cannot be deleted while it is attached to a post.");
  }
}

export async function deleteMedia(
  mediaId: number,
  auditContext?: { actorUserId: string; requestMetadata?: RequestMetadata | null },
) {
  await assertMediaUnused([mediaId]);

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
    .select({ fileKey: mediaVariants.fileKey })
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

export async function bulkDeleteMedia(
  mediaIds: number[],
  auditContext: { actorUserId: string; requestMetadata?: RequestMetadata | null },
) {
  const uniqueMediaIds = Array.from(new Set(mediaIds));

  if (uniqueMediaIds.length === 0) {
    return [];
  }

  await assertMediaUnused(uniqueMediaIds);

  for (const mediaId of uniqueMediaIds) {
    await deleteMedia(mediaId, auditContext);
  }

  return uniqueMediaIds;
}

export async function listMediaAssets(input?: {
  ids?: number[];
  type?: MediaType;
  access?: MediaAccess;
  search?: string;
  limit?: number;
}) {
  if (input?.ids && input.ids.length === 0) {
    return [];
  }

  const trimmedSearch = input?.search?.trim();
  const searchValue = trimmedSearch ? `%${trimmedSearch}%` : undefined;
  const conditions = [
    input?.ids ? inArray(media.id, input.ids) : undefined,
    input?.type ? eq(media.type, input.type) : undefined,
    input?.access ? eq(media.access, input.access) : undefined,
    searchValue
      ? sql`(
          ${media.originalFilename} LIKE ${searchValue}
          OR ${media.defaultAlt} LIKE ${searchValue}
          OR ${media.type} LIKE ${searchValue}
        )`
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
      durationSeconds: media.durationSeconds,
      waveformPeaks: media.waveformPeaks,
      processingError: media.processingError,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
      usageCount: sql<number>`(
        SELECT count(*)
        FROM ${postMedia}
        WHERE ${postMedia.mediaId} = ${media.id}
      )`,
    })
    .from(media);
  const filteredQuery = whereCondition ? baseQuery.where(whereCondition) : baseQuery;
  const orderedQuery = filteredQuery.orderBy(sql`${media.createdAt} DESC`, sql`${media.id} DESC`);
  const rows = input?.limit ? await orderedQuery.limit(input.limit) : await orderedQuery;

  return hydrateMediaAssets(rows);
}
