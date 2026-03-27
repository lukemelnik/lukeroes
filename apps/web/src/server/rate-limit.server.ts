import { db } from "@lukeroes/db";
import { rateLimitEvents } from "@lukeroes/db/schema/membership";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import {
  addMillisecondsToUtcIso,
  getUtcNowIso,
  subtractMillisecondsFromUtcIso,
} from "@/server/utc";

export interface RateLimitConfig {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
  nowIso?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  bucket: string;
  key: string;
  limit: number;
  remaining: number;
  resetAt: string;
  retryAfterSeconds: number;
  count: number;
}

export const rateLimitPresets = {
  commentCreation: {
    bucket: "comment:create:user",
    limit: 5,
    windowMs: 60_000,
  },
  commentCreationIp: {
    bucket: "comment:create:ip",
    limit: 10,
    windowMs: 60_000,
  },
  commentVoting: {
    bucket: "comment:vote:user",
    limit: 30,
    windowMs: 60_000,
  },
  postLikes: {
    bucket: "post:like:user",
    limit: 30,
    windowMs: 60_000,
  },
  adminMediaUploads: {
    bucket: "media:admin-upload:user",
    limit: 20,
    windowMs: 60_000,
  },
};

export function buildRateLimitKey(parts: Array<string | number | null | undefined>): string {
  const sanitizedParts = parts
    .filter((part) => part !== null && part !== undefined && `${part}`.length > 0)
    .map((part) => `${part}`);

  return sanitizedParts.join(":");
}

export function createRateLimitError(result: RateLimitResult): Error {
  return new Error(
    `Rate limit exceeded for ${result.bucket}. Retry after ${result.retryAfterSeconds} seconds.`,
  );
}

export function consumeRateLimit(config: RateLimitConfig): RateLimitResult {
  const nowIso = config.nowIso ?? getUtcNowIso();
  const windowStartIso = subtractMillisecondsFromUtcIso(nowIso, config.windowMs);
  const defaultResetAt = addMillisecondsToUtcIso(nowIso, config.windowMs);

  return db.transaction((tx) => {
    tx.delete(rateLimitEvents).where(lte(rateLimitEvents.expiresAt, nowIso)).run();

    const usage = tx
      .select({
        count: sql<number>`count(*)`,
        oldestCreatedAt: sql<string | null>`min(${rateLimitEvents.createdAt})`,
      })
      .from(rateLimitEvents)
      .where(
        and(
          eq(rateLimitEvents.bucket, config.bucket),
          eq(rateLimitEvents.key, config.key),
          gte(rateLimitEvents.createdAt, windowStartIso),
        ),
      )
      .get();

    const count = usage?.count ?? 0;
    const oldestCreatedAt = usage?.oldestCreatedAt ?? null;
    const resetAt = oldestCreatedAt
      ? addMillisecondsToUtcIso(oldestCreatedAt, config.windowMs)
      : defaultResetAt;

    if (count >= config.limit) {
      const retryAfterMilliseconds = Math.max(0, Date.parse(resetAt) - Date.parse(nowIso));

      return {
        allowed: false,
        bucket: config.bucket,
        key: config.key,
        limit: config.limit,
        remaining: 0,
        resetAt,
        retryAfterSeconds: Math.ceil(retryAfterMilliseconds / 1000),
        count,
      };
    }

    tx.insert(rateLimitEvents)
      .values({
        bucket: config.bucket,
        key: config.key,
        createdAt: nowIso,
        expiresAt: addMillisecondsToUtcIso(nowIso, config.windowMs),
      })
      .run();

    const nextCount = count + 1;
    const nextResetAt = oldestCreatedAt
      ? addMillisecondsToUtcIso(oldestCreatedAt, config.windowMs)
      : addMillisecondsToUtcIso(nowIso, config.windowMs);

    return {
      allowed: true,
      bucket: config.bucket,
      key: config.key,
      limit: config.limit,
      remaining: Math.max(0, config.limit - nextCount),
      resetAt: nextResetAt,
      retryAfterSeconds: 0,
      count: nextCount,
    };
  });
}

export function enforceRateLimit(config: RateLimitConfig): RateLimitResult {
  const result = consumeRateLimit(config);

  if (!result.allowed) {
    throw createRateLimitError(result);
  }

  return result;
}
