import { createFileRoute } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";
import { Play, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import type { ApiVideo } from "@/hooks/use-videos";
import { useVideos, videosQueryOptions } from "@/hooks/use-videos";

export const Route = createFileRoute("/(nav)/videos")({
	component: VideosPageComponent,
	head: () => ({
		...seoHead({
			title: "Videos",
			description:
				"Watch music videos and live performances by Luke Roes.",
			path: "/videos",
		}),
	}),
	loader: async ({ context }) => {
		try {
			await context.queryClient.prefetchQuery(videosQueryOptions);
		} catch {
			// Prefetch failed — will retry on client
		}
		return null;
	},
});

function VideosPageComponent() {
	const {
		data: videos,
		isLoading,
		isError,
		error,
		refetch,
		isRefetching,
	} = useVideos();
	const [isClient, setIsClient] = useState(false);
	const [selectedVideo, setSelectedVideo] = useState<ApiVideo | null>(null);
	const [featuredVideo, setFeaturedVideo] = useState<ApiVideo | null>(null);
	const otherVideos = useMemo(
		() =>
			videos && featuredVideo
				? videos.filter((v) => v.id !== featuredVideo.id)
				: [],
		[videos, featuredVideo],
	);

	useEffect(() => setIsClient(true), []);
	useEffect(() => {
		if (videos && videos.length > 0) {
			setFeaturedVideo((current) => current ?? videos[0]);
		}
	}, [videos]);

	const getThumbnailUrl = (youtubeId: string) => {
		return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
	};

	if (!isClient || isLoading) {
		return (
			<div className="flex min-h-[60vh] w-full items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex min-h-[60vh] w-full items-center justify-center px-4">
				<Card className="w-full max-w-md p-6 text-center">
					<CardContent className="space-y-4 p-0">
						<div className="font-bold text-2xl">Videos unavailable</div>
						<p className="text-muted-foreground">
							{error instanceof Error
								? error.message
								: "Could not load videos right now."}
						</p>
						<div className="flex items-center justify-center gap-3 pt-2">
							<Button onClick={() => refetch()} disabled={isRefetching}>
								<RefreshCcw className="mr-2 h-4 w-4" />
								{isRefetching ? "Retrying..." : "Try again"}
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!videos || videos.length === 0 || !featuredVideo) {
		return (
			<div className="flex min-h-[60vh] w-full items-center justify-center px-4">
				<Card className="w-full max-w-md p-6 text-center">
					<CardContent className="space-y-4 p-0">
						<div className="font-bold text-2xl">No videos yet</div>
						<p className="text-muted-foreground">Check back soon for videos.</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="px-4 py-8 md:px-6">
			<div className="mx-auto max-w-7xl">
				{/* Featured Video */}
				<div className="mx-auto mb-8 max-w-4xl">
					<Card
						className="group cursor-pointer"
						onClick={() => setSelectedVideo(featuredVideo)}
					>
						<CardContent className="p-0">
							<div className="relative aspect-video">
								<img
									src={
										featuredVideo.thumbnailUrl ||
										getThumbnailUrl(featuredVideo.youtubeId)
									}
									alt={featuredVideo.title}
									className="w-full object-cover"
								/>
								<div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/30">
									<div className="transform rounded-full bg-primary/90 p-6 transition-all group-hover:scale-110 group-hover:bg-primary">
										<Play className="h-12 w-12 fill-current" />
									</div>
								</div>
							</div>
							<div className="p-6">
								<h2 className="mb-2 font-bold text-2xl">
									{featuredVideo.title}
								</h2>
								{featuredVideo.publishedAt && (
									<p className="text-muted-foreground text-sm">
										{new Date(featuredVideo.publishedAt).toLocaleDateString(
											"en-US",
										)}
									</p>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Thumbnail Grid */}
				<div>
					<h3 className="mb-4 font-semibold text-xl">More Videos</h3>
					<ScrollArea className="h-auto">
						<div className="grid grid-cols-1 gap-6 pb-4 md:grid-cols-2 lg:grid-cols-3">
							{otherVideos.map((video) => (
								<Card
									key={video.id}
									className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
									onClick={() => setSelectedVideo(video)}
								>
									<CardContent className="p-0">
										<div className="relative aspect-video">
											<img
												src={
													video.thumbnailUrl || getThumbnailUrl(video.youtubeId)
												}
												alt={video.title}
												className="h-full w-full object-cover"
											/>
											<div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/30">
												<div className="transform rounded-full bg-primary/90 p-4 transition-all group-hover:scale-110 group-hover:bg-primary">
													<Play className="h-8 w-8 fill-current" />
												</div>
											</div>
										</div>
										<div className="p-4">
											<h3 className="mb-1 line-clamp-2 font-semibold text-lg">
												{video.title}
											</h3>
											{video.publishedAt && (
												<p className="text-muted-foreground text-sm">
													{new Date(video.publishedAt).toLocaleDateString(
														"en-US",
													)}
												</p>
											)}
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</ScrollArea>
				</div>
			</div>

			{/* Video Modal */}
			<Dialog
				open={!!selectedVideo}
				onOpenChange={() => setSelectedVideo(null)}
			>
				<DialogContent className="max-w-6xl p-0 md:min-w-4xl">
					<div className="aspect-video w-full">
						{selectedVideo && (
							<iframe
								src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
								title={selectedVideo.title}
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowFullScreen
								className="h-full w-full"
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
