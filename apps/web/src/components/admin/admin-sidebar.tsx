import { Link } from "@tanstack/react-router";
import { BarChart3, FileText, Image, MessageSquare, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { unseenCommentCountFn } from "@/functions/admin-comments.functions";

const navItems = [
  { to: "/admin" as const, label: "Dashboard", icon: BarChart3, exact: true },
  { to: "/admin/posts" as const, label: "Posts", icon: FileText },
  { to: "/admin/media" as const, label: "Media", icon: Image },
  { to: "/admin/users" as const, label: "Users", icon: Users },
  { to: "/admin/comments" as const, label: "Comments", icon: MessageSquare },
];

export function AdminSidebar() {
  const { data: unseenCount } = useQuery({
    queryKey: ["admin-unseen-comments-count"],
    queryFn: () => unseenCommentCountFn(),
    refetchInterval: 30_000,
  });

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border/50 md:block">
      <nav className="sticky top-16 space-y-1 p-4">
        <p className="mb-3 font-heading font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Admin
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/admin" }}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/50 [&.active]:bg-muted [&.active]:font-medium"
            activeProps={{ className: "active" }}
          >
            <Icon className="size-4 text-muted-foreground" />
            <span>{label}</span>
            {label === "Comments" && (unseenCount ?? 0) > 0 && (
              <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-destructive font-mono text-[10px] text-destructive-foreground">
                {(unseenCount ?? 0) > 9 ? "9+" : unseenCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
