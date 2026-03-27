import { db } from "@lukeroes/db";
import { media, postMedia } from "@lukeroes/db/schema/membership";
import { eq } from "drizzle-orm";
import {
  getPresignedUploadUrl,
  getSignedUrl,
  getPublicUrl,
  deleteFile,
} from "@/server/services/storage.service";

export async function createMediaWithUploadUrl(input: {
  type: "audio" | "image";
  fileKey: string;
  contentType: string;
}) {
  const [record] = await db
    .insert(media)
    .values({
      type: input.type,
      fileKey: input.fileKey,
    })
    .returning();

  const uploadUrl = await getPresignedUploadUrl(input.fileKey, input.contentType);

  return { media: record, uploadUrl };
}

export async function confirmUpload(input: {
  mediaId: number;
  duration?: number;
  width?: number;
  height?: number;
  alt?: string;
}) {
  const publicUrl = getPublicUrl(
    (
      await db
        .select({ fileKey: media.fileKey })
        .from(media)
        .where(eq(media.id, input.mediaId))
        .limit(1)
    )[0]?.fileKey || "",
  );

  const [record] = await db
    .update(media)
    .set({
      url: publicUrl,
      duration: input.duration ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      alt: input.alt ?? null,
    })
    .where(eq(media.id, input.mediaId))
    .returning();

  return record;
}

export async function attachMediaToPost(input: {
  postId: number;
  mediaId: number;
  role: "artwork" | "audio" | "photo";
  displayOrder?: number;
}) {
  await db.insert(postMedia).values({
    postId: input.postId,
    mediaId: input.mediaId,
    role: input.role,
    displayOrder: input.displayOrder ?? 0,
  });
}

export async function getMediaUrl(mediaId: number, isPublic: boolean) {
  const [record] = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);

  if (!record) return null;

  if (isPublic) {
    return record.url || getPublicUrl(record.fileKey);
  }
  return getSignedUrl(record.fileKey, 3600);
}

export async function deleteMedia(mediaId: number) {
  const [record] = await db
    .select({ fileKey: media.fileKey })
    .from(media)
    .where(eq(media.id, mediaId))
    .limit(1);

  if (record) {
    await deleteFile(record.fileKey);
    await db.delete(media).where(eq(media.id, mediaId));
  }
}
