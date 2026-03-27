import { db } from "@lukeroes/db";
import { user } from "@lukeroes/db/schema/auth";
import { comments, membershipEvents, posts } from "@lukeroes/db/schema/membership";
import { and, count, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { getUtcNowIso } from "@/server/utc";

export async function getDashboardMetrics() {
  const nowIso = getUtcNowIso();

  const [totalUsersRow, publishedPostsRow, unseenCommentsRow] = await Promise.all([
    db.select({ count: count() }).from(user).get(),
    db
      .select({ count: count() })
      .from(posts)
      .where(and(isNotNull(posts.publishedAt), lte(posts.publishedAt, nowIso)))
      .get(),
    db.select({ count: count() }).from(comments).where(eq(comments.seen, false)).get(),
  ]);

  const paidMembersCount = await getPaidMembersCount();

  return {
    totalUsers: totalUsersRow?.count ?? 0,
    paidMembers: paidMembersCount,
    totalPublishedPosts: publishedPostsRow?.count ?? 0,
    unseenComments: unseenCommentsRow?.count ?? 0,
  };
}

async function getPaidMembersCount(): Promise<number> {
  const rows = await db.all<{ count: number }>(
    sql`SELECT count(*) as count FROM subscription WHERE plan = 'member' AND status = 'active'`,
  );
  return rows[0]?.count ?? 0;
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export async function getSignupChartData(days: number) {
  const sinceIso = daysAgoIso(days);

  const rows = await db
    .select({
      date: sql<string>`substr(${user.createdAt}, 1, 10)`,
      count: count(),
    })
    .from(user)
    .where(gte(user.createdAt, sinceIso))
    .groupBy(sql`substr(${user.createdAt}, 1, 10)`)
    .orderBy(sql`substr(${user.createdAt}, 1, 10)`);

  return rows.map((r) => ({ date: r.date, count: r.count }));
}

export async function getPaidMemberChartData(days: number) {
  const sinceIso = daysAgoIso(days);

  const events = await db
    .select({
      date: sql<string>`substr(${membershipEvents.effectiveAt}, 1, 10)`,
      type: membershipEvents.type,
    })
    .from(membershipEvents)
    .where(gte(membershipEvents.effectiveAt, sinceIso))
    .orderBy(membershipEvents.effectiveAt);

  const countByDate = new Map<string, number>();
  let running = 0;

  for (const event of events) {
    if (event.type === "subscription_started" || event.type === "gift_applied") {
      running += 1;
    } else if (event.type === "subscription_canceled" || event.type === "gift_removed") {
      running = Math.max(0, running - 1);
    }
    countByDate.set(event.date, running);
  }

  return [...countByDate.entries()].map(([date, members]) => ({ date, members }));
}
