import { createFileRoute, notFound } from "@tanstack/react-router";
import { allPosts } from "content-collections";
import { MDXContent } from "@content-collections/mdx/react";
import { WritingSidebar } from "@/components/writing/writing-sidebar";
import { Clock } from "lucide-react";
import { CustomComponent } from "@/routes/(nav)/writing/-components/custom-component";

export const Route = createFileRoute("/(nav)/writing/$slug")({
  loader: ({ params }) => {
    const post = allPosts.find((p) => p.slug === params.slug);

    if (!post) {
      throw notFound();
    }

    // In production, hide draft posts
    if (!import.meta.env.DEV && post.draft) {
      throw notFound();
    }

    return { post };
  },
  component: WritingPost,
});

// Custom components for MDX content
const components = {
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-4xl font-bold mt-8 mb-4" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-3xl font-bold mt-6 mb-3" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-2xl font-bold mt-5 mb-2" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-4 leading-7" {...props}>
      {children}
    </p>
  ),
  a: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a className="text-primary underline hover:no-underline" {...props}>
      {children}
    </a>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside mb-4 space-y-2" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside mb-4 space-y-2" {...props}>
      {children}
    </ol>
  ),
  code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 text-sm"
      {...props}
    >
      {children}
    </pre>
  ),
  blockquote: ({
    children,
    ...props
  }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-8 border-border" {...props} />
  ),
  CustomComponent,
};

function WritingPost() {
  const { post } = Route.useLoaderData();

  // Get recent posts for sidebar (exclude current post)
  const recentPosts = allPosts
    .filter((p) => {
      // Filter out current post
      if (p.slug === post.slug) return false;
      // Filter out drafts in production
      if (!import.meta.env.DEV && p.draft) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map((p) => ({
      title: p.title,
      date: p.date,
      slug: p.slug,
    }));

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="grid lg:grid-cols-[1fr_300px] gap-12">
        {/* Main Content */}
        <article>
          <header className="mb-8">
            {post.draft && (
              <div className="mb-4 px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 rounded">
                This is a draft post
              </div>
            )}

            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>

              {post.readingTime && (
                <div className="flex items-center gap-1">
                  <Clock className="size-4" />
                  <span>{post.readingTime} min read</span>
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-muted rounded-md text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <MDXContent code={post.mdx} components={components} />
          </div>
        </article>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <WritingSidebar currentSlug={post.slug} recentPosts={recentPosts} />
        </div>
      </div>
    </div>
  );
}
