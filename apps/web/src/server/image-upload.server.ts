import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import busboy from "busboy";
import sharp from "sharp";
import {
  MAX_IMAGE_BYTE_SIZE,
  detectImageMimeType,
  resolveMediaFormat,
  type MediaAccess,
} from "@/lib/media";
import { requireAdminRequestContext } from "@/server/admin-request.server";
import {
  createPendingImageUpload,
  finalizeImageUpload,
  markMediaUploadFailed,
} from "@/server/media.server";
import { buildRateLimitKey, enforceRateLimit, rateLimitPresets } from "@/server/rate-limit.server";
import { deleteFile, uploadFile } from "@/server/services/storage.service";

interface ParsedImageUpload {
  access: MediaAccess;
  defaultAlt: string | null;
  originalFilename: string;
  mimeType: string;
  checksum: string;
  byteSize: number;
  tempDirectoryPath: string;
  tempFilePath: string;
}

function createNodeReadableStream(requestBody: ReadableStream<Uint8Array>) {
  const reader = requestBody.getReader();

  return new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();

        if (done) {
          this.push(null);
          return;
        }

        this.push(Buffer.from(value));
      } catch (error) {
        this.destroy(error instanceof Error ? error : new Error("Unable to read upload request."));
      }
    },
  });
}

function createJsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Image upload failed.";
}

function getErrorStatus(error: unknown): number {
  const message = getErrorMessage(error);

  if (message === "Unauthorized") {
    return 401;
  }

  if (message === "Forbidden") {
    return 403;
  }

  if (message.startsWith("Rate limit exceeded")) {
    return 429;
  }

  if (
    message === "Image upload requests must be multipart form data." ||
    message === "Image upload request body is missing." ||
    message === "Upload exactly one image file." ||
    message === "Image upload is missing a file." ||
    message === "Image uploads must include a filename." ||
    message === "Image uploads must be JPEG, PNG, WebP, or GIF." ||
    message === "Images must be 20MB or smaller." ||
    message === "Image access must be public or members."
  ) {
    return 400;
  }

  return 500;
}

async function removeTempDirectory(tempDirectoryPath: string) {
  await rm(tempDirectoryPath, { force: true, recursive: true });
}

async function parseImageUploadRequest(request: Request): Promise<ParsedImageUpload> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    throw new Error("Image upload requests must be multipart form data.");
  }

  const requestBody = request.body;

  if (!requestBody) {
    throw new Error("Image upload request body is missing.");
  }

  const tempDirectoryPath = await mkdtemp(join(tmpdir(), "lukeroes-media-"));
  const tempFilePath = join(tempDirectoryPath, "upload-original");

  try {
    return await new Promise<ParsedImageUpload>((resolve, reject) => {
      const headers = Object.fromEntries(request.headers.entries());
      const parser = busboy({
        headers,
        limits: {
          fields: 8,
          files: 1,
          fileSize: MAX_IMAGE_BYTE_SIZE,
        },
      });
      let access: MediaAccess = "public";
      let defaultAlt: string | null = null;
      let byteSize = 0;
      const checksum = createHash("sha256");
      const headerChunks: number[] = [];
      let fileSeen = false;
      let fileWritePromise: Promise<void> | null = null;
      let originalFilename = "";
      let detectedMimeType: string | null = null;
      let limitExceeded = false;
      let settled = false;

      function rejectOnce(error: unknown) {
        if (!settled) {
          settled = true;
          reject(error);
        }
      }

      function resolveOnce(value: ParsedImageUpload) {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      }

      parser.on("field", (fieldName, value) => {
        if (fieldName === "access") {
          const normalizedValue = value.trim().toLowerCase();

          if (normalizedValue === "public" || normalizedValue === "members") {
            access = normalizedValue;
            return;
          }

          rejectOnce(new Error("Image access must be public or members."));
          return;
        }

        if (fieldName === "defaultAlt") {
          const normalizedValue = value.trim();
          defaultAlt = normalizedValue.length > 0 ? normalizedValue : null;
        }
      });

      parser.on("file", (fieldName, file, info) => {
        if (fieldName !== "file") {
          file.resume();
          return;
        }

        if (fileSeen) {
          rejectOnce(new Error("Upload exactly one image file."));
          file.resume();
          return;
        }

        fileSeen = true;
        originalFilename = info.filename.trim();

        if (!originalFilename) {
          rejectOnce(new Error("Image uploads must include a filename."));
          file.resume();
          return;
        }

        file.on("limit", () => {
          limitExceeded = true;
        });

        const monitoringStream = new Transform({
          transform(chunk, _encoding, callback) {
            const chunkBytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            byteSize += chunkBytes.length;
            checksum.update(chunkBytes);

            if (headerChunks.length < 32) {
              for (const byte of chunkBytes) {
                if (headerChunks.length >= 32) {
                  break;
                }

                headerChunks.push(byte);
              }
            }

            callback(null, chunkBytes);
          },
        });

        fileWritePromise = pipeline(file, monitoringStream, createWriteStream(tempFilePath)).then(
          () => {
            if (limitExceeded) {
              throw new Error("Images must be 20MB or smaller.");
            }

            detectedMimeType = detectImageMimeType(Uint8Array.from(headerChunks));

            if (!detectedMimeType) {
              throw new Error("Image uploads must be JPEG, PNG, WebP, or GIF.");
            }
          },
        );
      });

      parser.on("filesLimit", () => {
        rejectOnce(new Error("Upload exactly one image file."));
      });

      parser.on("error", (error) => {
        rejectOnce(error);
      });

      parser.on("finish", () => {
        if (!fileSeen) {
          rejectOnce(new Error("Image upload is missing a file."));
          return;
        }

        if (!fileWritePromise) {
          rejectOnce(new Error("Image upload is missing a file."));
          return;
        }

        fileWritePromise
          .then(() => {
            if (!detectedMimeType) {
              rejectOnce(new Error("Image uploads must be JPEG, PNG, WebP, or GIF."));
              return;
            }

            resolveOnce({
              access,
              defaultAlt,
              originalFilename,
              mimeType: detectedMimeType,
              checksum: checksum.digest("hex"),
              byteSize,
              tempDirectoryPath,
              tempFilePath,
            });
          })
          .catch((error) => {
            rejectOnce(error);
          });
      });

      pipeline(createNodeReadableStream(requestBody), parser).catch((error) => {
        rejectOnce(error);
      });
    });
  } catch (error) {
    await removeTempDirectory(tempDirectoryPath);
    throw error;
  }
}

export async function handleImageUploadRequest(request: Request) {
  let tempDirectoryPath: string | null = null;
  let pendingMediaId: number | null = null;
  const uploadedDerivativeKeys: string[] = [];

  try {
    const { userId } = await requireAdminRequestContext(request);

    enforceRateLimit({
      ...rateLimitPresets.adminMediaUploads,
      key: buildRateLimitKey([userId]),
    });

    const parsedUpload = await parseImageUploadRequest(request);
    tempDirectoryPath = parsedUpload.tempDirectoryPath;

    const pendingUpload = await createPendingImageUpload({
      access: parsedUpload.access,
      originalFilename: parsedUpload.originalFilename,
      mimeType: parsedUpload.mimeType,
      createdByUserId: userId,
      byteSize: parsedUpload.byteSize,
      checksum: parsedUpload.checksum,
      defaultAlt: parsedUpload.defaultAlt,
    });
    pendingMediaId = pendingUpload.media.id;

    await uploadFile(
      pendingUpload.originalFileKey,
      createReadStream(parsedUpload.tempFilePath),
      parsedUpload.mimeType,
      parsedUpload.byteSize,
    );

    const imageMetadata = await sharp(parsedUpload.tempFilePath, {
      animated: true,
      pages: -1,
    }).metadata();
    const displayTempFilePath = join(parsedUpload.tempDirectoryPath, "display.webp");
    const thumbTempFilePath = join(parsedUpload.tempDirectoryPath, "thumb.webp");
    const displayInfo = await sharp(parsedUpload.tempFilePath, {
      animated: true,
      pages: -1,
    })
      .rotate()
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(displayTempFilePath);
    const thumbInfo = await sharp(parsedUpload.tempFilePath, {
      animated: true,
      pages: -1,
    })
      .rotate()
      .resize({
        width: 600,
        height: 600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(thumbTempFilePath);

    await uploadFile(
      pendingUpload.displayFileKey,
      createReadStream(displayTempFilePath),
      "image/webp",
      displayInfo.size,
    );
    uploadedDerivativeKeys.push(pendingUpload.displayFileKey);

    await uploadFile(
      pendingUpload.thumbFileKey,
      createReadStream(thumbTempFilePath),
      "image/webp",
      thumbInfo.size,
    );
    uploadedDerivativeKeys.push(pendingUpload.thumbFileKey);

    const asset = await finalizeImageUpload({
      mediaId: pendingUpload.media.id,
      original: {
        width: imageMetadata.width ?? null,
        height: imageMetadata.height ?? null,
        byteSize: parsedUpload.byteSize,
        format: resolveMediaFormat(parsedUpload.originalFilename, parsedUpload.mimeType) ?? "bin",
      },
      display: {
        width: displayInfo.width,
        height: displayInfo.height,
        byteSize: displayInfo.size,
      },
      thumb: {
        width: thumbInfo.width,
        height: thumbInfo.height,
        byteSize: thumbInfo.size,
      },
    });

    return createJsonResponse({ asset });
  } catch (error) {
    if (pendingMediaId !== null) {
      await Promise.all(uploadedDerivativeKeys.map((fileKey) => deleteFile(fileKey))).catch(
        () => undefined,
      );
      await markMediaUploadFailed(pendingMediaId, getErrorMessage(error)).catch(() => undefined);
    }

    return createJsonResponse({ error: getErrorMessage(error) }, getErrorStatus(error));
  } finally {
    if (tempDirectoryPath) {
      await removeTempDirectory(tempDirectoryPath).catch(() => undefined);
    }
  }
}
