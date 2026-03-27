import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateReadingTimeLabel,
  decodePostCursor,
  encodePostCursor,
  getPostPublicationState,
  normalizePostSlug,
  stripHtmlToPlainText,
} from "./post-helpers.server";
import { getRequestMetadata } from "./request.server";
import { generateUuidV7 } from "./id.server";
import {
  addMillisecondsToUtcIso,
  getUtcNowIso,
  isUtcIso,
  subtractMillisecondsFromUtcIso,
} from "./utc";

test("stripHtmlToPlainText removes tags and normalizes whitespace", () => {
  assert.equal(
    stripHtmlToPlainText("<p>Hello <strong>world</strong><br />again</p>"),
    "Hello world again",
  );
});

test("calculateReadingTimeLabel returns minimum one minute", () => {
  assert.equal(calculateReadingTimeLabel("<p>one two three</p>"), "1 min read");
});

test("normalizePostSlug creates strict lowercase slugs", () => {
  assert.equal(normalizePostSlug(" Hello, New Song! "), "hello-new-song");
});

test("publication states respect null, future, and past UTC timestamps", () => {
  const nowIso = "2026-03-27T12:00:00.000Z";

  assert.equal(getPostPublicationState(null, nowIso), "draft");
  assert.equal(getPostPublicationState("2026-03-27T12:00:00.000Z", nowIso), "published");
  assert.equal(getPostPublicationState("2026-03-27T12:00:01.000Z", nowIso), "scheduled");
});

test("post cursors round-trip cleanly", () => {
  const cursor = encodePostCursor("2026-03-27T12:00:00.000Z", 42);

  assert.deepEqual(decodePostCursor(cursor), {
    publishedAt: "2026-03-27T12:00:00.000Z",
    id: 42,
  });
});

test("request metadata prefers forwarded headers and preserves the user agent", () => {
  const request = new Request("https://example.com", {
    headers: {
      "x-forwarded-for": "203.0.113.10, 203.0.113.11",
      "user-agent": "pi-test-agent",
    },
  });

  assert.deepEqual(getRequestMetadata(request), {
    ipAddress: "203.0.113.10",
    userAgent: "pi-test-agent",
  });
});

test("generateUuidV7 returns a version 7 UUID", () => {
  const uuid = generateUuidV7();

  assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("UTC helpers create and validate ISO timestamps", () => {
  const nowIso = getUtcNowIso();

  assert.equal(isUtcIso(nowIso), true);
  assert.equal(
    addMillisecondsToUtcIso("2026-03-27T12:00:00.000Z", 1000),
    "2026-03-27T12:00:01.000Z",
  );
  assert.equal(
    subtractMillisecondsFromUtcIso("2026-03-27T12:00:00.000Z", 1000),
    "2026-03-27T11:59:59.000Z",
  );
});
