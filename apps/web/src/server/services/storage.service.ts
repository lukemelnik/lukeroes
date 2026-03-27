import type { Readable } from "node:stream";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.R2_BUCKET || "";
const MEDIA_PREFIX = "media/";
const PUBLIC_URL_BASE = process.env.R2_PUBLIC_URL || "";

function isAbsoluteUrl(key: string) {
  return key.startsWith("https://") || key.startsWith("http://");
}

function mediaKey(key: string) {
  if (isAbsoluteUrl(key)) {
    return key;
  }

  return key.startsWith(MEDIA_PREFIX) ? key : `${MEDIA_PREFIX}${key}`;
}

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | ReadableStream | Readable,
  contentType: string,
  contentLength?: number,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: mediaKey(key),
      Body: body,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
  );
}

export async function getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: mediaKey(key),
    ContentType: contentType,
  });
  return awsGetSignedUrl(s3, command, { expiresIn });
}

export async function getSignedUrl(key: string, expiresIn = 3600) {
  if (isAbsoluteUrl(key)) {
    return key;
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: mediaKey(key),
  });
  return awsGetSignedUrl(s3, command, { expiresIn });
}

export function getPublicUrl(key: string) {
  if (isAbsoluteUrl(key)) {
    return key;
  }

  return `${PUBLIC_URL_BASE}/${mediaKey(key)}`;
}

function getNumberProperty(value: object | null | undefined, propertyName: string): number | null {
  if (!value) {
    return null;
  }

  const propertyValue = Reflect.get(value, propertyName);

  return typeof propertyValue === "number" ? propertyValue : null;
}

export async function getFileMetadata(key: string) {
  if (isAbsoluteUrl(key)) {
    return null;
  }

  try {
    const result = await s3.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: mediaKey(key),
      }),
    );

    return {
      contentLength: result.ContentLength ?? null,
      contentType: result.ContentType ?? null,
      eTag: result.ETag ?? null,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "NotFound") {
      return null;
    }

    const metadata =
      error instanceof Error && typeof error === "object" ? Reflect.get(error, "$metadata") : null;
    const httpStatusCode =
      metadata && typeof metadata === "object"
        ? getNumberProperty(metadata, "httpStatusCode")
        : null;

    if (httpStatusCode === 404) {
      return null;
    }

    throw error;
  }
}

export async function deleteFile(key: string) {
  if (isAbsoluteUrl(key)) {
    return;
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: mediaKey(key),
    }),
  );
}
