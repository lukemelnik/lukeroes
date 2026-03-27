import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listAdminPostsFn, deletePostFn } from "@/functions/posts.functions";
import { getAdminStatusFn } from "@/functions/admin.functions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { seoHead } from "@/lib/seo";
import type { AdminPostSummary } from "@/server/posts.server";

export const Route = createFileRoute("/(nav)/admin/posts/")({
  component: AdminPostsPage,
  beforeLoad: async () => {
    await getAdminStatusFn();
  },
  head: () => ({
    ...seoHead({ title: "Admin — Posts", path: "/admin/posts" }),
  }),
});

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-secondary/20 text-secondary",
  published: "bg-primary/15 text-primary",
};

function AdminPostsPage() {
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => listAdminPostsFn({ data: {} }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePostFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post deleted");
    },
  });

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 px-4 pb-20 pt-10 sm:px-8 sm:pt-16">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-heading text-3xl">Posts</h1>
          <Link
            to="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            New post
          </Link>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet.</p>
        ) : (
          <div className="space-y-2">
            {posts.map((post: AdminPostSummary) => (
              <div
                key={post.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground text-xs">
                      {post.type}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${
                        post.visibility === "public"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {post.visibility}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs capitalize ${
                        STATUS_STYLES[post.status] ?? STATUS_STYLES.draft
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-medium text-sm">{post.title || post.slug}</p>
                  <p className="mt-0.5 truncate font-mono text-muted-foreground text-xs">
                    /{post.slug}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <Link
                    to="/admin/posts/$postId"
                    params={{ postId: String(post.id) }}
                    className="flex size-8 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Delete this post?")) {
                        deleteMutation.mutate(post.id);
                      }
                    }}
                    className="flex size-8 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
