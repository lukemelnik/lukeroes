import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { unreadNotificationCountFn } from "@/functions/notifications.functions";

export function NotificationBell() {
  const { data: count } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => unreadNotificationCountFn(),
    refetchInterval: 60_000,
  });

  const unreadCount = count ?? 0;

  return (
    <div className="relative">
      <Bell className="size-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 font-mono text-[10px] text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </div>
  );
}
