import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PostEditor } from "@/components/admin/post-editor";
import { getAdminStatusFn } from "@/functions/admin.functions";
import { getAdminPostByIdFn } from "@/functions/posts.functions";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/(nav)/admin/posts/$postId")({
  component: EditPostPage,
  beforeLoad: async () => {
    await getAdminStatusFn();
  },
  head: () => ({
    ...seoHead({ title: "Edit Post", path: "/admin/posts/edit" }),
  }),
});

function EditPostPage() {
  const { postId } = Route.useParams();
  const { data: post, isLoading } = useQuery({
    queryKey: ["admin-post", postId],
    queryFn: () => getAdminPostByIdFn({ data: { id: Number(postId) } }),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="mb-4 font-heading text-2xl">Post not found</h1>
        <Link to="/admin/posts" className="text-primary text-sm hover:text-primary/80">
          &larr; Back to posts
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
      <Link
        to="/admin/posts"
        className="mb-6 inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to posts
      </Link>
      <h1 className="mb-8 font-heading text-3xl">Edit Post</h1>
      <PostEditor post={post} />
    </div>
  );
}
