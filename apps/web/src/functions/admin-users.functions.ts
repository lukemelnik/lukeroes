import { db } from "@lukeroes/db";
import { user, session } from "@lukeroes/db/schema/auth";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { adminMiddleware } from "@/middleware/admin";
import { createAdminAuditLogEntry } from "@/server/audit-log.server";
import { listAdminUsers } from "@/server/admin-users.server";
import { recordMembershipEvent } from "@/server/membership-events.server";
import { getUtcNowIso } from "@/server/utc";

export const listAdminUsersFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    return listAdminUsers();
  });

const changeRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "admin"]),
});

export const changeUserRoleFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(changeRoleSchema)
  .handler(async ({ data, context }) => {
    await db
      .update(user)
      .set({ role: data.role, updatedAt: getUtcNowIso() })
      .where(eq(user.id, data.userId));

    await createAdminAuditLogEntry({
      actorUserId: context.user.id,
      action: "user.role_changed",
      targetType: "user",
      targetId: data.userId,
      metadata: { newRole: data.role },
      requestMetadata: context.requestMetadata,
    });

    return { success: true };
  });

const banUserSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

export const banUserFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(banUserSchema)
  .handler(async ({ data, context }) => {
    await db
      .update(user)
      .set({ banned: true, banReason: data.reason, updatedAt: getUtcNowIso() })
      .where(eq(user.id, data.userId));

    await createAdminAuditLogEntry({
      actorUserId: context.user.id,
      action: "user.banned",
      targetType: "user",
      targetId: data.userId,
      metadata: { reason: data.reason },
      requestMetadata: context.requestMetadata,
    });

    return { success: true };
  });

const unbanUserSchema = z.object({
  userId: z.string().min(1),
});

export const unbanUserFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(unbanUserSchema)
  .handler(async ({ data, context }) => {
    await db
      .update(user)
      .set({ banned: false, banReason: null, updatedAt: getUtcNowIso() })
      .where(eq(user.id, data.userId));

    await createAdminAuditLogEntry({
      actorUserId: context.user.id,
      action: "user.unbanned",
      targetType: "user",
      targetId: data.userId,
      requestMetadata: context.requestMetadata,
    });

    return { success: true };
  });

const impersonateSchema = z.object({
  userId: z.string().min(1),
});

export const impersonateUserFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(impersonateSchema)
  .handler(async ({ data, context }) => {
    await createAdminAuditLogEntry({
      actorUserId: context.user.id,
      action: "user.impersonated",
      targetType: "user",
      targetId: data.userId,
      requestMetadata: context.requestMetadata,
    });

    return { success: true };
  });

const revokeSessionsSchema = z.object({
  userId: z.string().min(1),
});

export const revokeAllSessionsFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(revokeSessionsSchema)
  .handler(async ({ data, context }) => {
    await db.delete(session).where(eq(session.userId, data.userId));

    await createAdminAuditLogEntry({
      actorUserId: context.user.id,
      action: "user.sessions_revoked",
      targetType: "user",
      targetId: data.userId,
      requestMetadata: context.requestMetadata,
    });

    return { success: true };
  });

const giftMembershipSchema = z.object({
  userId: z.string().min(1),
  userEmail: z.string().email(),
});

export const giftMembershipFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(giftMembershipSchema)
  .handler(async ({ data, context }) => {
    await recordMembershipEvent({
      userId: data.userId,
      source: "admin",
      type: "gift_applied",
      metadata: { giftedBy: context.user.id },
    });

    await createAdminAuditLogEntry({
      actorUserId: context.user.id,
      action: "user.gift_membership",
      targetType: "user",
      targetId: data.userId,
      metadata: { userEmail: data.userEmail },
      requestMetadata: context.requestMetadata,
    });

    return { success: true };
  });
