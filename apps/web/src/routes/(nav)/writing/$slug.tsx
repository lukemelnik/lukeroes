import { MDXContent } from "@content-collections/mdx/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { allPosts } from "content-collections";
import { Clock } from "lucide-react";
import { WritingSidebar } from "@/components/writing/writing-sidebar";
import { seoHead } from "@/lib/seo";
import { CustomComponent } from "@/routes/(nav)/writing/-components/custom-component";

export const Route = createFileRoute("/(nav)/writing/$slug")({
	loader: ({ params }) => {
		const post = allPosts.find((p) => p.slug === params.slug);

		if (!post) {
			throw notFound();
		}

		if (!import.meta.env.DEV && post.draft) {
			throw notFound();
		}

		return { post };
	},
	head: ({ loaderData }) => {
		const post = loaderData?.post;
		if (!post) return {};
		return {
			...seoHead({
				title: post.title,
				description: post.summary,
				path: `/writing/${post.slug}`,
				type: "article",
				article: {
					publishedTime: post.date,
					tags: post.tags,
				},
			}),
			scripts: [
				{
					type: "application/ld+json",
					children: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "BlogPosting",
						headline: post.title,
						description: post.summary,
						datePublished: post.date,
						author: {
							"@type": "Person",
							name: "Luke Roes",
							url: "https://lukeroes.com",
						},
					}),
				},
			],
		};
	},
	component: WritingPost,
});

// Custom components for MDX content
const components = {
	h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
		<h1 className="mt-8 mb-4 font-bold text-4xl" {...props}>
			{children}
		</h1>
	),
	h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
		<h2 className="mt-6 mb-3 font-bold text-3xl" {...props}>
			{children}
		</h2>
	),
	h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
		<h3 className="mt-5 mb-2 font-bold text-2xl" {...props}>
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
		<ul className="mb-4 list-inside list-disc space-y-2" {...props}>
			{children}
		</ul>
	),
	ol: ({ children, ...props }: React.OlHTMLAttributes<HTMLOListElement>) => (
		<ol className="mb-4 list-inside list-decimal space-y-2" {...props}>
			{children}
		</ol>
	),
	code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
		<code
			className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
			{...props}
		>
			{children}
		</code>
	),
	pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
		<pre
			className="mb-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm"
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
			className="my-4 border-primary border-l-4 pl-4 text-muted-foreground italic"
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
		<div className="container mx-auto max-w-7xl px-4 py-12">
			<div className="grid gap-12 lg:grid-cols-[1fr_300px]">
				{/* Main Content */}
				<article>
					<header className="mb-8">
						{post.draft && (
							<div className="mb-4 rounded bg-yellow-100 px-4 py-2 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100">
								This is a draft post
							</div>
						)}

						<h1 className="mb-4 font-bold text-4xl">{post.title}</h1>

						<div className="flex items-center gap-4 text-muted-foreground text-sm">
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
											className="rounded-md bg-muted px-2 py-1 text-xs"
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
