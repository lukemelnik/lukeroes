import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { allPosts } from "content-collections";
import { X } from "lucide-react";
import { useMemo } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/writing/post-card";
import { WritingHero } from "@/components/writing/writing-hero";

const searchSchema = z.object({
	tag: z.string().optional(),
});

export const Route = createFileRoute("/(nav)/writing/")({
	component: WritingIndex,
	validateSearch: searchSchema,
});

function WritingIndex() {
	const navigate = useNavigate();
	const { tag: selectedTag } = Route.useSearch();

	// Filter out drafts in production
	const publishedPosts = allPosts
		.filter((post) => {
			if (import.meta.env.DEV) {
				return true; // Show all posts in development
			}
			return !post.draft; // Hide drafts in production
		})
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	// Get all unique tags from published posts
	const allTags = useMemo(() => {
		const tagSet = new Set<string>();
		publishedPosts.forEach((post) => {
			post.tags?.forEach((tag) => tagSet.add(tag));
		});
		return Array.from(tagSet).sort();
	}, [publishedPosts]);

	// Filter posts by selected tag
	const filteredPosts = useMemo(() => {
		if (!selectedTag) return publishedPosts;
		return publishedPosts.filter((post) => post.tags?.includes(selectedTag));
	}, [publishedPosts, selectedTag]);

	const latestPost = filteredPosts[0];
	const remainingPosts = filteredPosts.slice(1);

	const handleTagClick = (tag: string) => {
		if (selectedTag === tag) {
			// If clicking the same tag, clear the filter
			navigate({ to: "/writing", search: {} });
		} else {
			// Set the new tag filter
			navigate({ to: "/writing", search: { tag } });
		}
	};

	const clearFilter = () => {
		navigate({ to: "/writing", search: {} });
	};

	return (
		<div className="container mx-auto max-w-6xl px-4 py-12">
			{/* Tag Filter */}
			{allTags.length > 0 && (
				<div className="mb-8">
					<div className="mb-3 flex items-center gap-2">
						<h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							Filter by topic
						</h3>
						{selectedTag && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearFilter}
								className="h-7 text-xs"
							>
								<X className="mr-1 size-3" />
								Clear filter
							</Button>
						)}
					</div>
					<div className="flex flex-wrap gap-2">
						{allTags.map((tag) => {
							const isActive = selectedTag === tag;
							const postCount = publishedPosts.filter((p) =>
								p.tags?.includes(tag),
							).length;

							return (
								<button
									key={tag}
									onClick={() => handleTagClick(tag)}
									className={`rounded-md px-3 py-1.5 font-medium text-sm transition-all ${
										isActive
											? "bg-primary text-primary-foreground shadow-sm"
											: "bg-muted text-foreground hover:bg-muted/80"
									}`}
								>
									{tag}
									<span className="ml-1.5 text-xs opacity-70">
										({postCount})
									</span>
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* Posts */}
			{filteredPosts.length === 0 ? (
				<div className="py-12 text-center">
					<p className="mb-4 text-muted-foreground">
						{selectedTag
							? `No posts found with tag "${selectedTag}"`
							: "No posts yet. Check back soon!"}
					</p>
					{selectedTag && (
						<Button variant="outline" onClick={clearFilter}>
							Show all posts
						</Button>
					)}
				</div>
			) : (
				<>
					{latestPost && (
						<WritingHero
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
						<div className="grid gap-6 md:grid-cols-2">
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
