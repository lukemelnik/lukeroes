import { stripe as stripePlugin } from "@better-auth/stripe";
import { sqlite3 } from "@lukeroes/db";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Stripe } from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2025-04-30.basil" })
  : undefined;

const plugins = [
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
