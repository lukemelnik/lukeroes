import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware } from "@/middleware/admin";

export const getAdminStatusFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    return { isAdmin: true };
  });
