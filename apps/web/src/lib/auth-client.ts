import { stripeClient } from "@better-auth/stripe/client";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          input: false,
        },
      },
    }),
    stripeClient({
      subscription: true,
    }),
    adminClient(),
  ],
});

export type SessionData = typeof authClient.$Infer.Session;
