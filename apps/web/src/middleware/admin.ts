import { createMiddleware } from "@tanstack/react-start";
import { authMiddleware } from "./auth";

export const adminMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    if (!context.session?.user) {
      throw new Error("Unauthorized");
    }
    if ((context.session.user as { role?: string }).role !== "admin") {
      throw new Error("Forbidden");
    }
    return next({
      context: {
        user: context.session.user,
      },
    });
  });
