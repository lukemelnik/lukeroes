import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCheck, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getAdminStatusFn } from "@/functions/admin.functions";
import { listAdminCommentsFn, markCommentSeenFn } from "@/functions/admin-comments.functions";
import { deleteCommentFn } from "@/functions/comments.functions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/(nav)/admin/comments/")({
  component: AdminCommentsPage,
  beforeLoad: async () => {
    await getAdminStatusFn();
  },
  head: () => ({
    ...seoHead({ title: "Admin — Comments", path: "/admin/comments" }),
  }),
});

function AdminCommentsPage() {
  const queryClient = useQueryClient();
  const [unseenOnly, setUnseenOnly] = useState(false);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["admin-comments", { unseenOnly }],
    queryFn: () => listAdminCommentsFn({ data: { unseenOnly, limit: 100 } }),
  });

  const markSeenMutation = useMutation({
    mutationFn: (ids: number[]) => markCommentSeenFn({ data: { commentIds: ids } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-unseen-comments-count"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-metrics"] });
      toast.success("Marked as seen");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => deleteCommentFn({ data: { commentId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast.success("Comment deleted");
    },
  });

  const unseenIds = comments
    .filter((c: { seen: boolean }) => !c.seen)
    .map((c: { id: number }) => c.id);

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 px-4 pb-20 pt-10 sm:px-8 sm:pt-16">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-heading text-3xl">Comments</h1>
          <div className="flex gap-2">
            {unseenIds.length > 0 && (
              <button
                type="button"
                onClick={() => markSeenMutation.mutate(unseenIds)}
                disabled={markSeenMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm hover:bg-muted/80"
              >
                <CheckCheck className="size-4" />
                Mark all seen
              </button>
            )}
            <button
              type="button"
              onClick={() => setUnseenOnly(!unseenOnly)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                unseenOnly
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Unseen only
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-muted-foreground">No comments.</p>
        ) : (
          <div className="space-y-2">
            {comments.map(
              (c: {
                id: number;
                text: string;
                seen: boolean;
                isDeleted: boolean;
                createdAt: string;
                postTitle: string;
                postSlug: string;
                userName: string | null;
                userEmail: string | null;
              }) => (
                <div
                  key={c.id}
                  className={`rounded-lg border border-border/50 p-4 ${!c.seen ? "border-l-2 border-l-primary" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium">{c.userName ?? c.userEmail ?? "Anon"}</span>
                        <span className="text-muted-foreground">on</span>
                        <Link
                          to="/members/post/$slug"
                          params={{ slug: c.postSlug }}
                          className="truncate text-primary hover:underline"
                        >
                          {c.postTitle}
                        </Link>
                        <span className="text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        {!c.seen && (
                          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-primary text-[10px]">
                            new
                          </span>
                        )}
                        {c.isDeleted && (
                          <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-destructive text-[10px]">
                            deleted
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm">
                        {c.isDeleted ? "This comment was deleted." : c.text}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!c.seen && (
                        <button
                          type="button"
                          onClick={() => markSeenMutation.mutate([c.id])}
                          title="Mark seen"
                          className="flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Eye className="size-4" />
                        </button>
                      )}
                      {!c.isDeleted && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Delete this comment?")) {
                              deleteMutation.mutate(c.id);
                            }
                          }}
                          title="Delete comment"
                          className="flex size-8 items-center justify-center rounded text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
