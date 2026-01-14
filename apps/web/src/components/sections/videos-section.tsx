import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { useVideos } from "@/hooks/use-videos";

export default function VideosSection() {
	const [isClient, setIsClient] = useState(false);
	const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
	const { data: videos, isLoading, isError, error } = useVideos();

	useEffect(() => setIsClient(true), []);

	if (!isClient) {
		return (
			<section className="w-full bg-muted/30 px-4 py-16 md:px-6">
				<div className="container mx-auto flex items-center justify-center">
					<Spinner className="h-6 w-6" />
				</div>
			</section>
		);
	}

	if (isLoading) {
		return (
			<section className="w-full bg-muted/30 px-4 py-16 md:px-6">
				<div className="container mx-auto flex items-center justify-center">
					<Spinner className="h-6 w-6" />
				</div>
			</section>
		);
	}

	if (isError) {
		return (
			<section className="w-full bg-muted/30 px-4 py-16 md:px-6">
				<div className="container mx-auto">
					<h2 className="mb-2 font-bold text-3xl tracking-tight">Videos</h2>
					<p className="text-muted-foreground">
						Could not load videos right now
						{error instanceof Error ? `: ${error.message}` : "."}
					</p>
				</div>
			</section>
		);
	}

	if (!videos || videos.length === 0) {
		return (
			<section className="w-full bg-muted/30 px-4 py-16 md:px-6">
				<div className="container mx-auto">
					<h2 className="mb-2 font-bold text-3xl tracking-tight">Videos</h2>
					<p className="text-muted-foreground">
						No videos yet. Check back soon.
					</p>
				</div>
			</section>
		);
	}

	return (
		<section className="w-full bg-muted/30 px-4 py-16 md:px-6">
			<div className="container mx-auto">
				<div className="mb-8">
					<h2 className="mb-2 font-bold text-3xl tracking-tight">Videos</h2>
					<p className="text-muted-foreground">
						Watch music videos, live performances, and more
					</p>
				</div>

				<Carousel
					opts={{
						align: "start",
						loop: true,
					}}
					className="w-full"
				>
					<CarouselContent>
						{videos.map((video) => (
							<CarouselItem
								key={video.id}
								className="md:basis-1/2 lg:basis-1/3"
							>
								<Card
									className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
									onClick={() => setSelectedVideoId(video.youtubeId)}
								>
									<CardContent className="p-0">
										<div className="relative aspect-video">
											<img
												src={video.thumbnailUrl}
												alt={video.title}
												className="h-full w-full object-cover"
											/>
											<div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
												<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary transition-transform hover:scale-110">
													<Play className="ml-1 h-8 w-8 fill-primary-foreground text-primary-foreground" />
												</div>
											</div>
										</div>
										<div className="space-y-2 p-4">
											<h3 className="line-clamp-2 font-semibold text-lg">
												{video.title}
											</h3>
											{video.publishedAt && (
												<div className="flex items-center gap-2 text-muted-foreground text-sm">
													<span>
														{new Date(video.publishedAt).toLocaleDateString(
															"en-US",
														)}
													</span>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							</CarouselItem>
						))}
					</CarouselContent>
					<CarouselPrevious className="-left-12 hidden xl:flex" />
					<CarouselNext className="-right-12 hidden xl:flex" />
				</Carousel>
			</div>

			<Dialog
				open={!!selectedVideoId}
				onOpenChange={() => setSelectedVideoId(null)}
			>
				<DialogContent className="max-w-6xl p-0 md:min-w-4xl">
					<div className="aspect-video w-full">
						{selectedVideoId && (
							<iframe
								src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1`}
								title="Selected video"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowFullScreen
								className="h-full w-full"
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</section>
	);
}
