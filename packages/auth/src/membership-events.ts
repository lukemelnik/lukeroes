import type { Subscription } from "@better-auth/stripe";
import type StripeClient from "stripe";
import { db } from "@lukeroes/db";
import { membershipEvents } from "@lukeroes/db/schema/membership";

function getUtcNowIso(): string {
  return new Date().toISOString();
}

function toUtcIso(date: Date | null | undefined, fallbackIso: string): string {
  if (!date) {
    return fallbackIso;
  }

  return date.toISOString();
}

function serializeMetadata(metadata: Record<string, unknown>): string {
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
  effectiveAt: string;
  metadata?: Record<string, unknown>;
}) {
  const [event] = await db
    .insert(membershipEvents)
    .values({
      userId: input.userId,
      source: input.source,
      type: input.type,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      effectiveAt: input.effectiveAt,
      metadata: input.metadata ? serializeMetadata(input.metadata) : null,
      createdAt: getUtcNowIso(),
    })
    .returning();

  return event;
}

export async function recordStripeMembershipLifecycleEvent(input: {
  type: "subscription_started" | "subscription_updated" | "subscription_canceled";
  subscription: Subscription;
  event?: StripeClient.Event | null;
}) {
  const fallbackIso = input.event
    ? new Date(input.event.created * 1000).toISOString()
    : getUtcNowIso();
  const effectiveAt =
    input.type === "subscription_started"
      ? toUtcIso(input.subscription.periodStart, fallbackIso)
      : input.type === "subscription_canceled"
        ? toUtcIso(input.subscription.canceledAt ?? input.subscription.endedAt, fallbackIso)
        : toUtcIso(input.subscription.periodStart, fallbackIso);

  return recordMembershipEvent({
    userId: input.subscription.referenceId,
    source: "stripe",
    type: input.type,
    stripeSubscriptionId: input.subscription.stripeSubscriptionId ?? null,
    effectiveAt,
    metadata: {
      eventType: input.event?.type ?? null,
      plan: input.subscription.plan,
      status: input.subscription.status,
      billingInterval: input.subscription.billingInterval ?? null,
      cancelAtPeriodEnd: input.subscription.cancelAtPeriodEnd ?? false,
      periodStart: input.subscription.periodStart?.toISOString() ?? null,
      periodEnd: input.subscription.periodEnd?.toISOString() ?? null,
      cancelAt: input.subscription.cancelAt?.toISOString() ?? null,
      canceledAt: input.subscription.canceledAt?.toISOString() ?? null,
      endedAt: input.subscription.endedAt?.toISOString() ?? null,
    },
  });
}
