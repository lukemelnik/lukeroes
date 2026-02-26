import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	notFound,
	Outlet,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { ArtworkImage } from "@/components/artwork-image";
import { AppleMusicIcon } from "@/components/icons/apple-music-icon";
import { SpotifyIcon } from "@/components/icons/spotify-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
	musicQueryOptions,
	type ReleaseDetail,
	type ReleaseSummary,
	releaseDetailsQueryOptions,
} from "@/hooks/use-music";
import { slugify } from "@/lib/slugify";
import { msToMMSS } from "@/lib/utils";

export const Route = createFileRoute("/(nav)/music/$slug")({
	loader: async ({ params, context }) => {
		await context.queryClient.prefetchQuery(musicQueryOptions);
		const releases = context.queryClient.getQueryData<ReleaseSummary[]>(
			musicQueryOptions.queryKey,
		);

		const match = releases?.find((r) => slugify(r.title) === params.slug);
		if (!match) {
			throw notFound();
		}

		const queryOpts = releaseDetailsQueryOptions(match.id);
		await context.queryClient.prefetchQuery({
			queryKey: queryOpts.queryKey,
			queryFn: queryOpts.queryFn,
		});
		const release = context.queryClient.getQueryData<ReleaseDetail>(
			queryOpts.queryKey,
		);

		if (!release) {
			throw notFound();
		}
	},
	component: ReleaseLayout,
});

function formatDate(value?: string | null) {
	if (!value) return "—";
	return new Date(value).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function ReleaseLayout() {
	const { slug } = Route.useParams();
	const navigate = useNavigate();
	const { track: trackSlug } = useParams({ strict: false }) as {
		track?: string;
	};

	const { data: releases } = useQuery(musicQueryOptions);
	const match = releases?.find((r) => slugify(r.title) === slug);

	const { data: release, isPending } = useQuery(
		releaseDetailsQueryOptions(match?.id ?? null),
	);

	if (isPending) {
		return (
			<div className="flex min-h-[60vh] w-full items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (!release) {
		return null;
	}

	return (
		<div className="min-h-screen w-full px-4 py-8 md:px-6">
			<div className="container mx-auto space-y-6">
				<div className="grid gap-8 md:grid-cols-3">
					<div className="md:col-span-1">
						<Card className="sticky top-6">
							<CardContent className="flex flex-col items-center p-6">
								<div className="space-y-4 md:w-2/3">
									<div className="aspect-square">
										<ArtworkImage
											src={release.artworkPublicUrl ?? undefined}
											alt={release.title}
											className="h-full w-full rounded object-cover"
										/>
									</div>
									<div>
										<h1 className="mb-1 font-bold text-2xl">{release.title}</h1>
										<p className="mb-1 text-muted-foreground text-sm">
											{release.artist}
										</p>
										<p className="text-muted-foreground text-sm">
											{release.type} · {formatDate(release.releaseDate)}
										</p>
										{release.version && (
											<p className="text-muted-foreground text-sm">
												Version: {release.version}
											</p>
										)}
									</div>
									<div className="flex gap-3">
										{release.streamingLinks?.spotify && (
											<a
												href={release.streamingLinks.spotify}
												target="_blank"
												rel="noopener noreferrer"
												className="text-muted-foreground transition-colors hover:text-primary"
												aria-label="Listen on Spotify"
											>
												<SpotifyIcon size={24} />
											</a>
										)}
										{release.streamingLinks?.appleMusic && (
											<a
												href={release.streamingLinks.appleMusic}
												target="_blank"
												rel="noopener noreferrer"
												className="text-muted-foreground transition-colors hover:text-primary"
												aria-label="Listen on Apple Music"
											>
												<AppleMusicIcon size={24} />
											</a>
										)}
										{release.streamingLinks?.youtube && (
											<a
												href={release.streamingLinks.youtube}
												target="_blank"
												rel="noopener noreferrer"
												className="text-muted-foreground transition-colors hover:text-primary"
												aria-label="Watch on YouTube"
											>
												<YoutubeIcon size={24} />
											</a>
										)}
									</div>

									<div className="w-full space-y-1">
										{release.tracks.map((track) => {
											const thisTrackSlug = slugify(track.title ?? "");
											const isActive = trackSlug === thisTrackSlug;
											return (
												<button
													type="button"
													key={track.id}
													onClick={() =>
														navigate({
															to: "/music/$slug/$track",
															params: {
																slug: slugify(release.title),
																track: thisTrackSlug,
															},
															replace: true,
														})
													}
													className={`flex w-full items-center justify-between rounded pr-1 transition-colors ${
														isActive
															? "bg-accent text-foreground"
															: "hover:bg-accent/50"
													}`}
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
												</button>
											);
										})}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="md:col-span-2">
						<Outlet />
					</div>
				</div>
			</div>
		</div>
	);
}
