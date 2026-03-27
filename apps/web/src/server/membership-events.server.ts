import { db } from "@lukeroes/db";
import { membershipEvents } from "@lukeroes/db/schema/membership";
import { getUtcNowIso } from "@/server/utc";

function serializeMetadata(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) {
    return null;
  }

  return JSON.stringify(metadata);
}

export async function recordMembershipEvent(input: {
  userId: string;
  source: "stripe" | "admin";
  type:
    | "subscription_started"
    | "subscription_updated"
    | "subscription_canceled"
    | "gift_applied"
    | "gift_removed";
  stripeSubscriptionId?: string | null;
  effectiveAt?: string;
  metadata?: Record<string, unknown> | null;
}) {
  const [event] = await db
    .insert(membershipEvents)
    .values({
      userId: input.userId,
      source: input.source,
      type: input.type,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      effectiveAt: input.effectiveAt ?? getUtcNowIso(),
      metadata: serializeMetadata(input.metadata),
      createdAt: getUtcNowIso(),
    })
    .returning();

  return event;
}
