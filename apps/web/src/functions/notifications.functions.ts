import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { memberMiddleware } from "@/middleware/member";
import {
  countUnreadNotifications,
  listNotificationsForUser,
  markNotificationsRead,
} from "@/server/notifications.server";

export const listNotificationsFn = createServerFn({ method: "GET" })
  .middleware([memberMiddleware])
  .handler(async ({ context }) => {
    if (!context.session?.user) {
      return [];
    }

    return listNotificationsForUser(context.session.user.id);
  });

export const unreadNotificationCountFn = createServerFn({ method: "GET" })
  .middleware([memberMiddleware])
  .handler(async ({ context }) => {
    if (!context.session?.user) {
      return 0;
    }

    return countUnreadNotifications(context.session.user.id);
  });

const markReadSchema = z.object({
  notificationIds: z.array(z.number().int().positive()),
});

export const markNotificationsReadFn = createServerFn({ method: "POST" })
  .middleware([memberMiddleware])
  .inputValidator(markReadSchema)
  .handler(async ({ data, context }) => {
    if (!context.session?.user) {
      throw new Error("Unauthorized");
    }

    return markNotificationsRead(context.session.user.id, data.notificationIds);
  });
