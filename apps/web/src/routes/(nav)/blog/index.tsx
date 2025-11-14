import { createFileRoute } from "@tanstack/react-router";
import { allPosts } from "content-collections";
import { BlogHero } from "@/components/blog/blog-hero";
import { PostCard } from "@/components/blog/post-card";

export const Route = createFileRoute("/(nav)/blog/")({
  component: BlogIndex,
});

function BlogIndex() {
  // Filter out drafts in production
  const publishedPosts = allPosts
    .filter((post) => {
      if (import.meta.env.DEV) {
        return true; // Show all posts in development
      }
      return !post.draft; // Hide drafts in production
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latestPost = publishedPosts[0];
  const remainingPosts = publishedPosts.slice(1);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {publishedPosts.length === 0 ? (
        <p className="text-muted-foreground">No posts yet. Check back soon!</p>
      ) : (
        <>
          {latestPost && (
            <BlogHero
              title={latestPost.title}
              summary={latestPost.summary}
              date={latestPost.date}
              slug={latestPost.slug}
              tags={latestPost.tags}
              draft={latestPost.draft}
              readingTime={latestPost.readingTime}
            />
          )}

          {remainingPosts.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {remainingPosts.map((post) => (
                <PostCard
                  key={post._meta.path}
                  title={post.title}
                  summary={post.summary}
                  date={post.date}
                  slug={post.slug}
                  tags={post.tags}
                  draft={post.draft}
                  readingTime={post.readingTime}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
