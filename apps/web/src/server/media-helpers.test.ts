import assert from "node:assert/strict";
import test from "node:test";
import {
  buildWaveformPeaks,
  detectImageMimeType,
  formatDurationSeconds,
  hasAllowedFilenameExtension,
  reorderList,
} from "@/lib/media";

test("detectImageMimeType recognizes supported image signatures", () => {
  assert.equal(detectImageMimeType(Uint8Array.from([0xff, 0xd8, 0xff])), "image/jpeg");
  assert.equal(
    detectImageMimeType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/png",
  );
  assert.equal(
    detectImageMimeType(Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])),
    "image/gif",
  );
  assert.equal(
    detectImageMimeType(
      Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]),
    ),
    "image/webp",
  );
  assert.equal(detectImageMimeType(Uint8Array.from([0, 1, 2, 3])), null);
});

test("buildWaveformPeaks downsamples channel data into normalized peaks", () => {
  const channelData = Float32Array.from([0, -0.25, 0.5, -0.75, 1, -0.5, 0.25, 0]);

  assert.deepEqual(buildWaveformPeaks(channelData, 4), [0.25, 0.75, 1, 0.25]);
  assert.deepEqual(buildWaveformPeaks(channelData, 0), []);
});

test("reorderList returns a reordered copy and leaves invalid moves unchanged", () => {
  assert.deepEqual(reorderList([1, 2, 3, 4], 1, 3), [1, 3, 4, 2]);
  assert.deepEqual(reorderList([1, 2, 3, 4], -1, 2), [1, 2, 3, 4]);
});

test("media helpers normalize filenames and durations for the UI", () => {
  assert.equal(hasAllowedFilenameExtension("Cover.JPG", [".jpg", ".png"]), true);
  assert.equal(hasAllowedFilenameExtension("track.flac", [".mp3", ".wav"]), false);
  assert.equal(formatDurationSeconds(185), "3:05");
  assert.equal(formatDurationSeconds(null), null);
});
