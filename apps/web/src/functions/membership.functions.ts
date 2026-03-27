import { createServerFn } from "@tanstack/react-start";
import { memberMiddleware } from "@/middleware/member";

export const getMembershipStatusFn = createServerFn({ method: "GET" })
  .middleware([memberMiddleware])
  .handler(async ({ context }) => {
    return {
      isMember: context.isMember,
      isLoggedIn: !!context.session?.user,
      isAdmin: (context.session?.user as { role?: string } | undefined)?.role === "admin",
    };
  });
