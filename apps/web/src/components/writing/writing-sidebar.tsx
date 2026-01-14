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
				<h3 className="mb-4 font-bold text-lg">Recent Posts</h3>
				<div className="space-y-3">
					{recentPosts.map((post) => {
						const isCurrent = post.slug === currentSlug;
						return (
							<div
								key={post.slug}
								className={`border-border border-b pb-3 last:border-0 ${
									isCurrent ? "pointer-events-none opacity-50" : ""
								}`}
							>
								<Link
									to="/writing/$slug"
									params={{ slug: post.slug }}
									className="group block"
								>
									<h4 className="mb-1 font-medium text-sm">
										<span className="squiggly-underline">{post.title}</span>
										{isCurrent && (
											<span className="ml-2 text-muted-foreground text-xs">
												(Current)
											</span>
										)}
									</h4>
									<time className="text-muted-foreground text-xs">
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
			<div className="border-border border-t pt-4">
				<Link
					to="/writing"
					className="inline-flex items-center font-medium text-sm hover:underline"
				>
					← Back to all posts
				</Link>
			</div>
		</aside>
	);
}
