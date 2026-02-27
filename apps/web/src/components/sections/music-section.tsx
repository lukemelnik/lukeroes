import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { ArtworkImage } from "@/components/artwork-image";
import { AppleMusicIcon } from "@/components/icons/apple-music-icon";
import { SpotifyIcon } from "@/components/icons/spotify-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { musicQueryOptions } from "@/hooks/use-music";
import { slugify } from "@/lib/slugify";

export default function MusicSection() {
	const { data: releases } = useQuery(musicQueryOptions);

	if (!releases || releases.length === 0) {
		return null;
	}

	return (
		<section className="w-full px-4 py-16 md:px-6">
			<div className="container mx-auto">
				<div className="mb-8">
					<h2 className="mb-2 font-bold text-3xl tracking-tight">Music</h2>
					<p className="text-muted-foreground">
						Listen to the latest releases and catalog
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
						{releases?.map((item) => (
							<CarouselItem
								key={item.id}
								className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
							>
								<Card className="overflow-hidden transition-shadow hover:shadow-lg">
									<CardContent className="p-0">
										<div className="group/artwork relative aspect-square cursor-pointer">
											<ArtworkImage
												src={item.artworkPublicUrl ?? undefined}
												alt={item.title}
												className="h-full w-full object-cover"
											/>
											<div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/artwork:opacity-100">
												<a
													href={
														item.streamingLinks?.spotify ??
														item.streamingLinks?.appleMusic ??
														item.streamingLinks?.youtube ??
														item.streamingLinks?.soundcloud ??
														item.streamingLinks?.bandcamp ??
														"#"
													}
													className="flex h-16 w-16 items-center justify-center rounded-full bg-primary transition-transform hover:scale-110"
												>
													<Play className="ml-1 h-8 w-8 fill-primary-foreground text-primary-foreground" />
												</a>
											</div>
										</div>
										<div className="space-y-1 p-4">
											<div className="flex items-center justify-between">
												<div className="flex min-w-0 flex-col gap-1">
													<h3 className="truncate font-semibold text-lg">
														{item.title}
													</h3>
													<p className="truncate text-muted-foreground text-sm">
														{item.artist}
													</p>
												</div>
												<span className="ml-2 shrink-0 text-muted-foreground text-xs">
													{item.type}
												</span>
											</div>
											<div className="flex items-center justify-between pt-2">
												<div className="flex items-center gap-3">
													{item.streamingLinks?.spotify && (
														<a
															href={item.streamingLinks.spotify}
															target="_blank"
															rel="noopener noreferrer"
															className="text-muted-foreground transition-colors hover:text-primary"
															aria-label="Listen on Spotify"
														>
															<SpotifyIcon size={20} />
														</a>
													)}
													{item.streamingLinks?.appleMusic && (
														<a
															href={item.streamingLinks.appleMusic}
															target="_blank"
															rel="noopener noreferrer"
															className="text-muted-foreground transition-colors hover:text-primary"
															aria-label="Listen on Apple Music"
														>
															<AppleMusicIcon size={20} />
														</a>
													)}
													{item.streamingLinks?.youtube && (
														<a
															href={item.streamingLinks.youtube}
															target="_blank"
															rel="noopener noreferrer"
															className="text-muted-foreground transition-colors hover:text-primary"
															aria-label="Watch on YouTube"
														>
															<YoutubeIcon size={20} />
														</a>
													)}
													<Link
														to="/music/$slug"
														params={{ slug: slugify(item.title) }}
														aria-label="Release info"
													>
														<Button
														size="sm"
														variant="outline"
														className="hover:border-primary hover:text-primary"
													>
														Details
													</Button>
													</Link>
												</div>
												<p className="text-muted-foreground text-sm">
													{new Date(item.releaseDate).toLocaleDateString(
														"en-US",
													)}
												</p>
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
