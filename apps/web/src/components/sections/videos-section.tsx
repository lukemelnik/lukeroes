import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";

interface VideoItem {
	id: string;
	title: string;
	thumbnail: string;
	duration: string;
	views: string;
	uploadDate: string;
	videoUrl: string;
}

const mockVideoData: VideoItem[] = [
	{
		id: "1",
		title: "Latest Music Video",
		thumbnail: "https://placehold.co/640x360/1a1a1a/white?text=Video+1",
		duration: "3:45",
		views: "1.2M",
		uploadDate: "2 weeks ago",
		videoUrl: "#",
	},
	{
		id: "2",
		title: "Behind The Scenes",
		thumbnail: "https://placehold.co/640x360/2a2a2a/white?text=Video+2",
		duration: "5:20",
		views: "856K",
		uploadDate: "1 month ago",
		videoUrl: "#",
	},
	{
		id: "3",
		title: "Live Performance",
		thumbnail: "https://placehold.co/640x360/3a3a3a/white?text=Video+3",
		duration: "4:12",
		views: "2.1M",
		uploadDate: "2 months ago",
		videoUrl: "#",
	},
	{
		id: "4",
		title: "Acoustic Session",
		thumbnail: "https://placehold.co/640x360/4a4a4a/white?text=Video+4",
		duration: "3:55",
		views: "1.5M",
		uploadDate: "3 months ago",
		videoUrl: "#",
	},
	{
		id: "5",
		title: "Studio Vlog",
		thumbnail: "https://placehold.co/640x360/5a5a5a/white?text=Video+5",
		duration: "8:30",
		views: "654K",
		uploadDate: "4 months ago",
		videoUrl: "#",
	},
];

export default function VideosSection() {
	return (
		<section className="w-full py-16 px-4 md:px-6 bg-muted/30">
			<div className="container mx-auto">
				<div className="mb-8">
					<h2 className="text-3xl font-bold tracking-tight mb-2">Videos</h2>
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
						{mockVideoData.map((video) => (
							<CarouselItem
								key={video.id}
								className="md:basis-1/2 lg:basis-1/3"
							>
								<Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
									<CardContent className="p-0">
										<div className="relative aspect-video">
											<img
												src={video.thumbnail}
												alt={video.title}
												className="object-cover w-full h-full"
											/>
											<div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
												{video.duration}
											</div>
											<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
												<a
													href={video.videoUrl}
													className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform"
												>
													<Play className="w-8 h-8 fill-primary-foreground text-primary-foreground ml-1" />
												</a>
											</div>
										</div>
										<div className="p-4 space-y-2">
											<h3 className="font-semibold text-lg line-clamp-2">
												{video.title}
											</h3>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<span>{video.views} views</span>
												<span>•</span>
												<span>{video.uploadDate}</span>
											</div>
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
		</section>
	);
}
