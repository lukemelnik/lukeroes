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
  stripeSubscription?: StripeClient.Subscription | null;
}) {
  const fallbackIso = input.event
    ? new Date(input.event.created * 1000).toISOString()
    : getUtcNowIso();
  const stripeSubscriptionId =
    input.stripeSubscription?.id ?? input.subscription.stripeSubscriptionId ?? null;
  const periodStart = input.stripeSubscription?.items.data[0]?.current_period_start
    ? new Date(input.stripeSubscription.items.data[0].current_period_start * 1000)
    : input.subscription.periodStart;
  const periodEnd = input.stripeSubscription?.items.data[0]?.current_period_end
    ? new Date(input.stripeSubscription.items.data[0].current_period_end * 1000)
    : input.subscription.periodEnd;
  const cancelAt = input.stripeSubscription?.cancel_at
    ? new Date(input.stripeSubscription.cancel_at * 1000)
    : input.subscription.cancelAt;
  const canceledAt = input.stripeSubscription?.canceled_at
    ? new Date(input.stripeSubscription.canceled_at * 1000)
    : input.subscription.canceledAt;
  const endedAt = input.stripeSubscription?.ended_at
    ? new Date(input.stripeSubscription.ended_at * 1000)
    : input.subscription.endedAt;
  const status = input.stripeSubscription?.status ?? input.subscription.status;
  const cancelAtPeriodEnd =
    input.stripeSubscription?.cancel_at_period_end ?? input.subscription.cancelAtPeriodEnd ?? false;
  const effectiveAt =
    input.type === "subscription_started"
      ? toUtcIso(periodStart, fallbackIso)
      : input.type === "subscription_canceled"
        ? toUtcIso(canceledAt ?? endedAt, fallbackIso)
        : toUtcIso(periodStart, fallbackIso);

  return recordMembershipEvent({
    userId: input.subscription.referenceId,
    source: "stripe",
    type: input.type,
    stripeSubscriptionId,
    effectiveAt,
    metadata: {
      eventType: input.event?.type ?? null,
      plan: input.subscription.plan,
      status,
      billingInterval: input.subscription.billingInterval ?? null,
      cancelAtPeriodEnd,
      periodStart: periodStart?.toISOString() ?? null,
      periodEnd: periodEnd?.toISOString() ?? null,
      cancelAt: cancelAt?.toISOString() ?? null,
      canceledAt: canceledAt?.toISOString() ?? null,
      endedAt: endedAt?.toISOString() ?? null,
    },
  });
}
