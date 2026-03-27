import { confirmAudioUploadFn, requestAudioUploadFn } from "@/functions/media.functions";
import {
  AUDIO_FILENAME_EXTENSIONS,
  MAX_AUDIO_BYTE_SIZE,
  MAX_IMAGE_BYTE_SIZE,
  buildWaveformPeaks,
  detectImageMimeType,
  hasAllowedFilenameExtension,
  isSupportedAudioMimeType,
  resolveMediaFormat,
  type MediaAccess,
} from "@/lib/media";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Upload failed.";
}

async function readFileHeader(file: File, length = 32) {
  const buffer = await file.slice(0, length).arrayBuffer();

  return new Uint8Array(buffer);
}

export async function validateClientImageFile(file: File) {
  if (file.size > MAX_IMAGE_BYTE_SIZE) {
    throw new Error("Images must be 20MB or smaller.");
  }

  const detectedMimeType = detectImageMimeType(await readFileHeader(file));

  if (!detectedMimeType) {
    throw new Error("Images must be JPEG, PNG, WebP, or GIF.");
  }
}

export function validateClientAudioFile(file: File) {
  if (file.size > MAX_AUDIO_BYTE_SIZE) {
    throw new Error("Audio uploads must be 100MB or smaller.");
  }

  if (
    !isSupportedAudioMimeType(file.type) &&
    !hasAllowedFilenameExtension(file.name, AUDIO_FILENAME_EXTENSIONS)
  ) {
    throw new Error("Audio uploads must be MP3, WAV, or M4A.");
  }
}

export async function extractAudioMetadata(file: File) {
  try {
    const audioContext = new AudioContext();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      const durationSeconds = Number.isFinite(audioBuffer.duration)
        ? Math.max(0, Math.round(audioBuffer.duration))
        : null;
      let waveformPeaks: number[] | null = null;

      try {
        waveformPeaks = buildWaveformPeaks(audioBuffer.getChannelData(0));
      } catch {
        waveformPeaks = null;
      }

      return {
        durationSeconds,
        waveformPeaks,
      };
    } finally {
      await audioContext.close();
    }
  } catch {
    return {
      durationSeconds: null,
      waveformPeaks: null,
    };
  }
}

export async function uploadImageAsset(input: {
  file: File;
  access: MediaAccess;
  defaultAlt?: string | null;
}) {
  await validateClientImageFile(input.file);

  const formData = new FormData();
  formData.set("file", input.file);
  formData.set("access", input.access);

  if (input.defaultAlt && input.defaultAlt.trim().length > 0) {
    formData.set("defaultAlt", input.defaultAlt.trim());
  }

  const response = await fetch("/api/admin/media/images", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (response.ok) {
    return;
  }

  let errorMessage = "Image upload failed.";

  try {
    const payload: unknown = await response.json();

    if (payload && typeof payload === "object") {
      const message = Reflect.get(payload, "error");

      if (typeof message === "string" && message.length > 0) {
        errorMessage = message;
      }
    }
  } catch {
    errorMessage = response.statusText || errorMessage;
  }

  throw new Error(errorMessage);
}

export async function uploadAudioAsset(input: { file: File; access: MediaAccess }) {
  validateClientAudioFile(input.file);

  const metadata = await extractAudioMetadata(input.file);
  const uploadSession = await requestAudioUploadFn({
    data: {
      access: input.access,
      originalFilename: input.file.name,
      mimeType: input.file.type || "application/octet-stream",
      byteSize: input.file.size,
    },
  });

  try {
    const uploadResponse = await fetch(uploadSession.uploadUrl, {
      method: "PUT",
      body: input.file,
      headers: {
        "Content-Type": input.file.type || "application/octet-stream",
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Audio upload failed.");
    }

    await confirmAudioUploadFn({
      data: {
        mediaId: uploadSession.media.id,
        status: "ready",
        durationSeconds: metadata.durationSeconds,
        waveformPeaks: metadata.waveformPeaks,
        byteSize: input.file.size,
        format: resolveMediaFormat(input.file.name, input.file.type) ?? undefined,
      },
    });
  } catch (error) {
    await confirmAudioUploadFn({
      data: {
        mediaId: uploadSession.media.id,
        status: "failed",
        processingError: getErrorMessage(error),
      },
    }).catch(() => undefined);

    throw error;
  }
}
