import { db } from "@lukeroes/db";
import { adminAuditLog } from "@lukeroes/db/schema/membership";
import type { RequestMetadata } from "@/server/request.server";
import { getUtcNowIso } from "@/server/utc";

export interface CreateAdminAuditLogInput {
  actorUserId: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  requestMetadata?: RequestMetadata | null;
}

function serializeMetadata(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) {
    return null;
  }

  return JSON.stringify(metadata);
}

export async function createAdminAuditLogEntry(input: CreateAdminAuditLogInput) {
  const [entry] = await db
    .insert(adminAuditLog)
    .values({
      actorUserId: input.actorUserId,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadata: serializeMetadata(input.metadata),
      ipAddress: input.requestMetadata?.ipAddress ?? null,
      userAgent: input.requestMetadata?.userAgent ?? null,
      createdAt: getUtcNowIso(),
    })
    .returning();

  return entry;
}
