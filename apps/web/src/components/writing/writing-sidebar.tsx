import { Link } from "@tanstack/react-router";

interface Post {
  title: string;
  date: string;
  slug: string;
}

interface WritingSidebarProps {
  currentSlug: string;
  recentPosts: Post[];
}

export function WritingSidebar({
  currentSlug,
  recentPosts,
}: WritingSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Recent Posts */}
      <div>
        <h3 className="text-lg font-bold mb-4">Recent Posts</h3>
        <div className="space-y-3">
          {recentPosts.map((post) => {
            const isCurrent = post.slug === currentSlug;
            return (
              <div
                key={post.slug}
                className={`pb-3 border-b border-border last:border-0 ${
                  isCurrent ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <Link
                  to="/writing/$slug"
                  params={{ slug: post.slug }}
                  className="group block"
                >
                  <h4 className="font-medium mb-1 text-sm">
                    <span className="squiggly-underline">{post.title}</span>
                    {isCurrent && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Current)
                      </span>
                    )}
                  </h4>
                  <time className="text-xs text-muted-foreground">
                    {new Date(post.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Back to Writing */}
      <div className="pt-4 border-t border-border">
        <Link
          to="/writing"
          className="text-sm font-medium hover:underline inline-flex items-center"
        >
          ← Back to all posts
        </Link>
      </div>
    </aside>
  );
}
