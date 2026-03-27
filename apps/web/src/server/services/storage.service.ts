import {
  DeleteObjectCommand,
  GetObjectCommand,
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

function mediaKey(key: string) {
  return key.startsWith(MEDIA_PREFIX) ? key : `${MEDIA_PREFIX}${key}`;
}

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: mediaKey(key),
      Body: body,
      ContentType: contentType,
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
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: mediaKey(key),
  });
  return awsGetSignedUrl(s3, command, { expiresIn });
}

export function getPublicUrl(key: string) {
  return `${PUBLIC_URL_BASE}/${mediaKey(key)}`;
}

export async function deleteFile(key: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: mediaKey(key),
    }),
  );
}
