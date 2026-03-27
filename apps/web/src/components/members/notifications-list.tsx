import { MessageCircle, ArrowUp } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { listNotificationsFn, markNotificationsReadFn } from "@/functions/notifications.functions";

interface Notification {
  id: number;
  type: string;
  readAt: string | null;
  createdAt: string;
  postId: number;
  postSlug: string;
  postTitle: string;
  commentId: number;
  actorId: string | null;
  actorName: string | null;
  actorImage: string | null;
  commentText: string;
}

export function NotificationsList() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotificationsFn(),
  });

  const markReadMutation = useMutation({
    mutationFn: (ids: number[]) => markNotificationsReadFn({ data: { notificationIds: ids } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  if (isLoading) {
    return <p className="py-4 text-center text-muted-foreground text-sm">Loading...</p>;
  }

  const items = (notifications ?? []) as Notification[];

  if (items.length === 0) {
    return <p className="py-4 text-center text-muted-foreground text-sm">No notifications yet.</p>;
  }

  const unreadIds = items.filter((n) => !n.readAt).map((n) => n.id);

  return (
    <div>
      {unreadIds.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => markReadMutation.mutate(unreadIds)}
            disabled={markReadMutation.isPending}
            className="text-primary text-xs hover:text-primary/80"
          >
            Mark all read
          </button>
        </div>
      )}
      <div className="space-y-2">
        {items.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
  const isUnread = !notification.readAt;
  const Icon = notification.type === "comment_reply" ? MessageCircle : ArrowUp;
  const actionText =
    notification.type === "comment_reply" ? "replied to your comment" : "upvoted your comment";

  return (
    <Link
      to="/members/post/$slug"
      params={{ slug: notification.postSlug }}
      className={`flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50 ${isUnread ? "bg-primary/5" : ""}`}
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{notification.actorName ?? "Someone"}</span> {actionText} on{" "}
          <span className="font-medium">{notification.postTitle}</span>
        </p>
        <p className="mt-0.5 truncate text-muted-foreground text-xs">{notification.commentText}</p>
        <p className="mt-1 text-muted-foreground text-xs">
          {new Date(notification.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
      {isUnread && <div className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
    </Link>
  );
}
