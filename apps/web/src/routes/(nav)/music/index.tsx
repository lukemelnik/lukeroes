import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { AppleMusicIcon } from "@/components/icons/apple-music-icon";
import { SpotifyIcon } from "@/components/icons/spotify-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { musicQueryOptions, type ReleaseSummary } from "@/hooks/use-music";

type Track = ReleaseSummary["tracks"][number];

import { ArtworkImage } from "@/components/artwork-image";
import { Spinner } from "@/components/ui/spinner";
import { seoHead } from "@/lib/seo";
import { slugify } from "@/lib/slugify";
import { msToMMSS } from "@/lib/utils";

function MusicErrorComponent({ error: _error }: { error: unknown }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const message = "Looks like we can't find the music right now.";

	async function handleRetry() {
		await queryClient.invalidateQueries({ queryKey: ["music"] });
		await queryClient.refetchQueries({ queryKey: ["music"] });
		await router.invalidate();
	}

	return (
		<div className="flex min-h-[60vh] w-full items-center justify-center px-4">
			<Card className="w-full max-w-md p-6 text-center">
				<CardContent className="space-y-4 p-0">
					<div className="font-bold text-2xl">Oops!</div>
					<p className="text-muted-foreground">
						{message || "Looks like we can't find the music right now."}
					</p>
					<div className="flex items-center justify-center gap-3 pt-2">
						<Button onClick={handleRetry}>
							<RefreshCcw className="mr-2 h-4 w-4" /> Try again
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

const searchSchema = z.object({
	release: z.string().optional(),
});

export const Route = createFileRoute("/(nav)/music/")({
	component: MusicPageComponent,
	errorComponent: MusicErrorComponent,
	validateSearch: searchSchema,
	head: () => ({
		...seoHead({
			title: "Music",
			description:
				"Browse all releases by Luke Roes. Stream on Spotify, Apple Music, YouTube and more.",
			path: "/music",
		}),
	}),
	loader: ({ context }) => context.queryClient.prefetchQuery(musicQueryOptions),
});

function MusicPageComponent() {
	const { data: releases } = useQuery(musicQueryOptions);
	const { release: releaseParam } = Route.useSearch();
	const navigate = useNavigate();

	const selectedRelease =
		releases?.find((r) =>
			releaseParam ? slugify(r.title) === releaseParam : false,
		) ?? releases?.[0];

	const selectedReleaseSlug = selectedRelease
		? slugify(selectedRelease.title)
		: null;

	const setSelectedRelease = (title: string) => {
		navigate({ to: ".", search: { release: slugify(title) }, replace: true });
	};
	const tracksForSelected: Track[] = selectedRelease?.tracks ?? [];

	const [expandedMobileId, setExpandedMobileId] = useState<string | null>(null);

	if (!releases || releases.length === 0) {
		return (
			<div className="flex min-h-[60vh] w-full items-center justify-center px-4">
				<Card className="w-full max-w-md p-6 text-center">
					<CardContent className="space-y-4 p-0">
						<div className="font-bold text-2xl">No music yet</div>
						<p className="text-muted-foreground">
							Check back soon for releases.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!selectedRelease) {
		return (
			<div className="flex min-h-screen w-full items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full px-4 py-8 md:px-6">
			<div className="container mx-auto">
				{/* Desktop Layout */}
				<div className="hidden gap-8 md:grid md:grid-cols-3">
					{/* Left Panel - Fixed Selected Release */}
					<div className="col-span-1">
						<Card className="sticky top-6">
							<CardContent className="flex flex-col items-center p-6">
								<div className="w-2/3 space-y-4">
									<div className="aspect-square">
										<ArtworkImage
											src={selectedRelease.artworkPublicUrl ?? undefined}
											alt={selectedRelease.title}
											className="h-full w-full rounded object-cover"
										/>
									</div>
									<div>
										<h2 className="mb-1 font-bold text-2xl">
											{selectedRelease.title}
										</h2>
										<p className="mb-1 text-muted-foreground text-sm">
											{selectedRelease.artist}
										</p>
										<p className="text-muted-foreground text-sm">
											{selectedRelease.type} ·{" "}
											{new Date(selectedRelease.releaseDate).toLocaleDateString(
												"en-US",
											)}
										</p>
									</div>

									{/* Streaming Links */}
									<div className="flex w-full items-center justify-between gap-3">
										<div className="flex gap-3">
											{selectedRelease.streamingLinks?.spotify && (
												<a
													href={selectedRelease.streamingLinks.spotify}
													target="_blank"
													rel="noopener noreferrer"
													className="text-muted-foreground transition-colors hover:text-primary"
													aria-label="Listen on Spotify"
												>
													<SpotifyIcon size={24} />
												</a>
											)}
											{selectedRelease.streamingLinks?.appleMusic && (
												<a
													href={selectedRelease.streamingLinks.appleMusic}
													target="_blank"
													rel="noopener noreferrer"
													className="text-muted-foreground transition-colors hover:text-primary"
													aria-label="Listen on Apple Music"
												>
													<AppleMusicIcon size={24} />
												</a>
											)}
											{selectedRelease.streamingLinks?.youtube && (
												<a
													href={selectedRelease.streamingLinks.youtube}
													target="_blank"
													rel="noopener noreferrer"
													className="text-muted-foreground transition-colors hover:text-primary"
													aria-label="Watch on YouTube"
												>
													<YoutubeIcon size={24} />
												</a>
											)}
										</div>
										<Link
											to="/music/$slug"
											params={{ slug: slugify(selectedRelease.title) }}
											aria-label="View release details"
										>
											<Button size="sm">Details</Button>
										</Link>
									</div>

									{/* Tracklist */}
									<div className="w-full space-y-1">
										{tracksForSelected.length > 0 ? (
											tracksForSelected.map((track) => (
												<Link
													key={
														track.id ?? `${track.trackNumber}-${track.title}`
													}
													to="/music/$slug/$track"
													params={{
														slug: slugify(selectedRelease.title),
														track: slugify(track.title ?? ""),
													}}
													className="flex items-center justify-between rounded pr-1 transition-colors hover:bg-accent/50"
												>
													<div className="flex items-center gap-3 p-1">
														<span className="text-muted-foreground text-xs">
															{track.trackNumber.toString().padStart(2, "0")}
														</span>
														<span className="text-sm">{track.title}</span>
													</div>
													<span className="mr-2 text-muted-foreground text-sm">
														{msToMMSS(track.duration) ?? "—"}
													</span>
												</Link>
											))
										) : (
											<p className="text-muted-foreground text-sm">
												Tracklist not available.
											</p>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right Panel - Scrollable Release Grid */}
					<div className="col-span-2">
						<ScrollArea className="h-[calc(100vh-8rem)]">
							<div className="grid grid-cols-2 gap-6 pr-4 pb-8">
								{releases.map((item) => (
									<Card
										key={item.id}
										className={`group cursor-pointer overflow-hidden transition-all hover:shadow-lg ${
											selectedReleaseSlug !== slugify(item.title)
												? "opacity-80 blur-[0.5px]"
												: ""
										}`}
										onClick={() => setSelectedRelease(item.title)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												setSelectedRelease(item.title);
											}
										}}
										tabIndex={0}
										role="button"
									>
										<CardContent className="flex flex-col items-center p-6">
											<div className="w-2/3 space-y-2">
												<div className="mb-2 aspect-square">
													<ArtworkImage
														src={item.artworkPublicUrl ?? undefined}
														alt={item.title}
														className="h-full w-full rounded object-cover"
													/>
												</div>
												<div className="space-y-1">
													<h3 className="truncate font-semibold text-lg">
														{item.title}
													</h3>
													<p className="truncate text-muted-foreground text-sm">
														{item.artist}
													</p>
													<p className="text-muted-foreground text-sm">
														{item.type} ·{" "}
														{new Date(item.releaseDate).toLocaleDateString(
															"en-US",
														)}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</ScrollArea>
					</div>
				</div>

				{/* Mobile Layout */}
				<div className="space-y-6 md:hidden">
					{releases.map((item) => (
						<Card key={item.id} className="overflow-hidden">
							<CardContent className="p-0">
								{/* biome-ignore lint/a11y/useSemanticElements: Wrapper div contains complex nested content */}
								<div
									className="cursor-pointer"
									role="button"
									tabIndex={0}
									onClick={() => {
										const newId =
											expandedMobileId === String(item.id)
												? null
												: String(item.id);
										setExpandedMobileId(newId);
										if (newId) {
											setSelectedRelease(item.title);
										}
									}}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											const newId =
												expandedMobileId === String(item.id)
													? null
													: String(item.id);
											setExpandedMobileId(newId);
											if (newId) {
												setSelectedRelease(item.title);
											}
										}
									}}
								>
									<div className="flex flex-col items-center p-4">
										<ArtworkImage
											src={item.artworkPublicUrl ?? undefined}
											alt={item.title}
											className="mb-4 aspect-square w-2/3 rounded object-cover"
										/>
										<div className="mb-3 w-full text-center">
											<h3 className="mb-1 font-semibold text-lg">
												{item.title}
											</h3>
											<p className="mb-1 text-muted-foreground text-sm">
												{item.artist}
											</p>
											<p className="text-muted-foreground text-sm">
												{item.type} ·{" "}
												{new Date(item.releaseDate).toLocaleDateString("en-US")}
											</p>
										</div>
										<div className="mb-2 flex w-full items-center justify-between gap-3">
											<div className="flex gap-3">
												{item.streamingLinks?.spotify && (
													<a
														href={item.streamingLinks.spotify}
														target="_blank"
														rel="noopener noreferrer"
														className="text-muted-foreground transition-colors hover:text-primary"
														aria-label="Listen on Spotify"
														onClick={(e) => e.stopPropagation()}
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
														onClick={(e) => e.stopPropagation()}
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
														onClick={(e) => e.stopPropagation()}
													>
														<YoutubeIcon size={20} />
													</a>
												)}
											</div>
											<Link
												to="/music/$slug"
												params={{ slug: slugify(item.title) }}
												aria-label="View release details"
												onClick={(e) => e.stopPropagation()}
											>
												<Button variant="outline" size="sm">
													Details
												</Button>
											</Link>
										</div>
										<div className="text-muted-foreground">
											{expandedMobileId === String(item.id) ? (
												<ChevronUp className="h-5 w-5" />
											) : (
												<ChevronDown className="h-5 w-5" />
											)}
										</div>
									</div>
								</div>

								{/* Expanded Track Info */}
								{expandedMobileId === String(item.id) && (
									<div className="border-t p-4">
										<div className="space-y-2">
											{(item.tracks ?? []).map((track) => (
												<Link
													key={
														track.id ?? `${track.trackNumber}-${track.title}`
													}
													to="/music/$slug/$track"
													params={{
														slug: slugify(item.title),
														track: slugify(track.title ?? ""),
													}}
													className="flex items-center justify-between rounded text-sm transition-colors hover:bg-accent/50"
												>
													<div className="flex items-center gap-3">
														<span className="text-muted-foreground text-xs">
															{track.trackNumber.toString().padStart(2, "0")}
														</span>
														<span>{track.title}</span>
													</div>
													<span className="text-muted-foreground">
														{msToMMSS(track.duration) ?? "—"}
													</span>
												</Link>
											))}
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</div>
	);
}
