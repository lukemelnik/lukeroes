import { createMiddleware } from "@tanstack/react-start";
import { authMiddleware } from "@/middleware/auth";
import { getRequestMetadata } from "@/server/request.server";

function getUserRole(user: object | null | undefined): string | null {
  if (!user) {
    return null;
  }

  const role = Reflect.get(user, "role");

  return typeof role === "string" ? role : null;
}

export const adminMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context, request }) => {
    if (!context.session?.user) {
      throw new Error("Unauthorized");
    }

    if (getUserRole(context.session.user) !== "admin") {
      throw new Error("Forbidden");
    }

    return next({
      context: {
        user: context.session.user,
        requestMetadata: getRequestMetadata(request),
      },
    });
  });
