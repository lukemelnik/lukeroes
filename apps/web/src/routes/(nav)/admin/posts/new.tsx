import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PostEditor } from "@/components/admin/post-editor";
import { getAdminStatusFn } from "@/functions/admin.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/(nav)/admin/posts/new")({
  component: NewPostPage,
  beforeLoad: async () => {
    await getAdminStatusFn();
  },
  head: () => ({
    ...seoHead({ title: "New Post", path: "/admin/posts/new" }),
  }),
});

function NewPostPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
      <Link
        to="/admin/posts"
        className="mb-6 inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to posts
      </Link>
      <h1 className="mb-8 font-heading text-3xl">New Post</h1>
      <PostEditor />
    </div>
  );
}
