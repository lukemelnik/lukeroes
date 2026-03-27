import { stripe as stripePlugin } from "@better-auth/stripe";
import { sqlite3 } from "@lukeroes/db";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Stripe } from "stripe";
import { recordStripeMembershipLifecycleEvent } from "./membership-events";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" })
  : undefined;

const plugins: BetterAuthOptions["plugins"] = [
  tanstackStartCookies(),
  admin({
    adminRoles: ["admin"],
  }),
];

if (stripeClient) {
  plugins.push(
    stripePlugin({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "member",
            priceId: process.env.STRIPE_PRICE_ID || "",
          },
        ],
        onSubscriptionCreated: async ({ event, subscription }) => {
          await recordStripeMembershipLifecycleEvent({
            type: "subscription_started",
            event,
            subscription,
          });
        },
        onSubscriptionUpdate: async ({ event, subscription }) => {
          await recordStripeMembershipLifecycleEvent({
            type: "subscription_updated",
            event,
            subscription,
          });
        },
        onSubscriptionCancel: async ({ event, subscription }) => {
          await recordStripeMembershipLifecycleEvent({
            type: "subscription_canceled",
            event,
            subscription,
          });
        },
      },
    }),
  );
}

export const auth = betterAuth<BetterAuthOptions>({
  database: sqlite3,
  trustedOrigins: [process.env.CORS_ORIGIN || ""],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  plugins,
});
