import { createMiddleware } from "@tanstack/react-start";
import { authMiddleware } from "@/middleware/auth";
import { resolveMembershipForUser } from "@/server/membership.server";
import { getRequestMetadata } from "@/server/request.server";

function getUserRole(user: object | null | undefined): string | null {
  if (!user) {
    return null;
  }

  const role = Reflect.get(user, "role");

  return typeof role === "string" ? role : null;
}

export const memberMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context, request }) => {
    const membership = await resolveMembershipForUser({
      userId: context.session?.user.id,
      role: getUserRole(context.session?.user),
    });

    return next({
      context: {
        session: context.session,
        isMember: membership.isMember,
        isAdmin: membership.isAdmin,
        requestMetadata: getRequestMetadata(request),
      },
    });
  });
