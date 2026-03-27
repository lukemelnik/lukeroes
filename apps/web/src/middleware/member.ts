import { db } from "@lukeroes/db";
import { sql } from "drizzle-orm";
import { createMiddleware } from "@tanstack/react-start";
import { authMiddleware } from "./auth";

export const memberMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    let isMember = false;

    if (context.session?.user) {
      const role = (context.session.user as { role?: string }).role;

      if (role === "admin") {
        isMember = true;
      } else {
        try {
          const result = db.all<{ id: string }>(
            sql`SELECT id FROM subscription WHERE "referenceId" = ${context.session.user.id} AND status = 'active' LIMIT 1`,
          );
          isMember = result.length > 0;
        } catch {
          // subscription table doesn't exist yet (Stripe plugin not configured)
        }
      }
    }

    return next({
      context: {
        session: context.session,
        isMember,
      },
    });
  });
