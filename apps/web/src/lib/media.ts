export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
] as const;

export const IMAGE_FILENAME_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const;
export const AUDIO_FILENAME_EXTENSIONS = [".mp3", ".wav", ".m4a"] as const;

export const MAX_IMAGE_BYTE_SIZE = 20 * 1024 * 1024;
export const MAX_AUDIO_BYTE_SIZE = 100 * 1024 * 1024;

export type MediaType = "image" | "audio";
export type MediaAccess = "public" | "members";
export type MediaStatus = "uploading" | "processing" | "ready" | "failed";
export type MediaVariantKind = "original" | "display" | "thumb";
export type SupportedImageMimeType = (typeof IMAGE_MIME_TYPES)[number];
export type SupportedAudioMimeType = (typeof AUDIO_MIME_TYPES)[number];

export interface AdminMediaVariant {
  kind: MediaVariantKind;
  fileKey: string;
  url: string;
  format: string | null;
  width: number | null;
  height: number | null;
  byteSize: number | null;
}

export interface AdminMediaAsset {
  id: number;
  assetKey: string;
  type: MediaType;
  access: MediaAccess;
  status: MediaStatus;
  originalFilename: string;
  mimeType: string;
  byteSize: number | null;
  defaultAlt: string | null;
  durationSeconds: number | null;
  waveformPeaks: number[] | null;
  processingError: string | null;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  canDelete: boolean;
  previewUrl: string | null;
  displayUrl: string | null;
  thumbUrl: string | null;
  variants: AdminMediaVariant[];
}

const MIME_TO_EXTENSION = new Map<string, string>([
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

export function hasAllowedFilenameExtension(
  filename: string,
  allowedExtensions: readonly string[],
): boolean {
  const normalizedFilename = filename.trim().toLowerCase();

  return allowedExtensions.some((extension) => normalizedFilename.endsWith(extension));
}

export function normalizeMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase();
}

const IMAGE_MIME_TYPE_SET = new Set<string>(IMAGE_MIME_TYPES);
const AUDIO_MIME_TYPE_SET = new Set<string>(AUDIO_MIME_TYPES);

export function isSupportedImageMimeType(mimeType: string): mimeType is SupportedImageMimeType {
  return IMAGE_MIME_TYPE_SET.has(normalizeMimeType(mimeType));
}

export function isSupportedAudioMimeType(mimeType: string): mimeType is SupportedAudioMimeType {
  return AUDIO_MIME_TYPE_SET.has(normalizeMimeType(mimeType));
}

export function detectImageMimeType(bytes: Uint8Array): SupportedImageMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "image/gif";
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

function normalizeFileExtension(input: string): string | null {
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

  return MIME_TO_EXTENSION.get(normalizeMimeType(input)) ?? null;
}

export function resolveMediaFormat(originalFilename: string, mimeType: string): string | null {
  return normalizeFileExtension(originalFilename) ?? normalizeFileExtension(mimeType);
}

export function buildWaveformPeaks(channelData: Float32Array, pointCount = 200): number[] {
  if (pointCount <= 0 || channelData.length === 0) {
    return [];
  }

  const bucketSize = Math.max(1, Math.floor(channelData.length / pointCount));
  const peaks: number[] = [];

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const start = pointIndex * bucketSize;
    const end = pointIndex === pointCount - 1 ? channelData.length : start + bucketSize;
    let maxAmplitude = 0;

    for (let sampleIndex = start; sampleIndex < end; sampleIndex += 1) {
      const amplitude = Math.abs(channelData[sampleIndex] ?? 0);

      if (amplitude > maxAmplitude) {
        maxAmplitude = amplitude;
      }
    }

    peaks.push(Number(Math.min(1, maxAmplitude).toFixed(4)));
  }

  return peaks;
}

export function reorderList<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return [...items];
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  if (movedItem === undefined) {
    return [...items];
  }

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
}

export function formatMediaByteSize(byteSize: number | null | undefined): string {
  if (byteSize === null || byteSize === undefined) {
    return "—";
  }

  if (byteSize < 1024) {
    return `${byteSize} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let value = byteSize / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDurationSeconds(durationSeconds: number | null | undefined): string | null {
  if (durationSeconds === null || durationSeconds === undefined) {
    return null;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
