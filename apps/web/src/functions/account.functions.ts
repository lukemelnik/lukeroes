import { db } from "@lukeroes/db";
import { user, account, session } from "@lukeroes/db/schema/auth";
import { comments, notifications, postLikes } from "@lukeroes/db/schema/membership";
import { createServerFn } from "@tanstack/react-start";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { memberMiddleware } from "@/middleware/member";
import { getUtcNowIso } from "@/server/utc";

export const getAccountDataFn = createServerFn({ method: "GET" })
  .middleware([memberMiddleware])
  .handler(async ({ context }) => {
    if (!context.session?.user) {
      throw new Error("Unauthorized");
    }

    const userId = context.session.user.id;
    const userData = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .get();

    if (!userData) {
      throw new Error("User not found");
    }

    const passwordAccount = await db
      .select({ id: account.id })
      .from(account)
      .where(eq(account.userId, userId))
      .get();
    const hasPassword = !!passwordAccount;

    const providers = await db
      .select({ providerId: account.providerId })
      .from(account)
      .where(eq(account.userId, userId));

    let subscriptionStatus: string | null = null;
    try {
      const rows = await db.all<{ status: string }>(
        sql`SELECT status FROM subscription WHERE referenceId = ${userId} AND plan = 'member' LIMIT 1`,
      );
      subscriptionStatus = rows[0]?.status ?? null;
    } catch {
      subscriptionStatus = null;
    }

    return {
      ...userData,
      hasPassword,
      providers: providers.map((p) => p.providerId),
      subscriptionStatus,
      isMember: context.isMember,
      isAdmin: context.isAdmin,
    };
  });

const updateNameSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const updateAccountNameFn = createServerFn({ method: "POST" })
  .middleware([memberMiddleware])
  .inputValidator(updateNameSchema)
  .handler(async ({ data, context }) => {
    if (!context.session?.user) {
      throw new Error("Unauthorized");
    }

    await db
      .update(user)
      .set({ name: data.name, updatedAt: getUtcNowIso() })
      .where(eq(user.id, context.session.user.id));

    return { success: true };
  });

const deleteAccountSchema = z.object({
  confirmation: z.string(),
});

export const deleteAccountFn = createServerFn({ method: "POST" })
  .middleware([memberMiddleware])
  .inputValidator(deleteAccountSchema)
  .handler(async ({ data, context }) => {
    if (!context.session?.user) {
      throw new Error("Unauthorized");
    }

    if (data.confirmation !== "DELETE") {
      throw new Error("Invalid confirmation");
    }

    const userId = context.session.user.id;

    const nowIso = getUtcNowIso();
    await db
      .update(comments)
      .set({
        userId: null,
        isDeleted: true,
        deletedAt: nowIso,
        updatedAt: nowIso,
      })
      .where(eq(comments.userId, userId));

    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(postLikes).where(eq(postLikes.userId, userId));
    await db.delete(session).where(eq(session.userId, userId));
    await db.delete(account).where(eq(account.userId, userId));
    await db.delete(user).where(eq(user.id, userId));

    return { success: true };
  });
