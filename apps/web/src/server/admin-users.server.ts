import { db } from "@lukeroes/db";
import { user } from "@lukeroes/db/schema/auth";
import { desc, sql } from "drizzle-orm";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string | null;
  image: string | null;
  banned: boolean | null;
  banReason: string | null;
  createdAt: string;
  subscriptionStatus: string | null;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  const subscriptionStatuses = await getSubscriptionStatuses(rows.map((r) => r.id));

  return rows.map((r) => ({
    ...r,
    subscriptionStatus: subscriptionStatuses.get(r.id) ?? null,
  }));
}

async function getSubscriptionStatuses(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();

  const rows = await db.all<{ referenceId: string; status: string }>(
    sql`SELECT referenceId, status FROM subscription WHERE referenceId IN (${sql.join(
      userIds.map((id) => sql`${id}`),
      sql`, `,
    )}) AND plan = 'member'`,
  );

  return new Map(rows.map((r) => [r.referenceId, r.status]));
}
