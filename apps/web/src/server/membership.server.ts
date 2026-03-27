import { db } from "@lukeroes/db";
import { sql } from "drizzle-orm";

export interface MembershipResolution {
  isAdmin: boolean;
  isMember: boolean;
  hasActiveSubscription: boolean;
  source: "admin" | "subscription" | "none";
}

async function hasSubscriptionTable(): Promise<boolean> {
  const rows = await db.all<{ name: string }>(
    sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'subscription' LIMIT 1`,
  );

  return rows.length > 0;
}

async function hasActiveMembershipSubscription(userId: string): Promise<boolean> {
  if (!(await hasSubscriptionTable())) {
    return false;
  }

  const rows = await db.all<{ id: string }>(
    sql`SELECT id FROM subscription WHERE referenceId = ${userId} AND plan = 'member' AND status = 'active' LIMIT 1`,
  );

  return rows.length > 0;
}

export async function resolveMembershipForUser(input: {
  userId: string | null | undefined;
  role: string | null | undefined;
}): Promise<MembershipResolution> {
  if (!input.userId) {
    return {
      isAdmin: false,
      isMember: false,
      hasActiveSubscription: false,
      source: "none",
    };
  }

  if (input.role === "admin") {
    return {
      isAdmin: true,
      isMember: true,
      hasActiveSubscription: false,
      source: "admin",
    };
  }

  const hasActiveSubscription = await hasActiveMembershipSubscription(input.userId);

  return {
    isAdmin: false,
    isMember: hasActiveSubscription,
    hasActiveSubscription,
    source: hasActiveSubscription ? "subscription" : "none",
  };
}
