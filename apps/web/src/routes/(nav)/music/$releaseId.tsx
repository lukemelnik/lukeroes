import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useMemo } from "react";
import { z } from "zod";
import {
	type ReleaseDetail,
	releaseDetailsQueryOptions,
} from "@/hooks/use-music";

type DetailedTrack = ReleaseDetail["tracks"][number];

// Derive Contribution type from generated ReleaseDetail types
type Contribution = DetailedTrack["recording"]["credits"][number];

import { ArtworkImage } from "@/components/artwork-image";
import { AppleMusicIcon } from "@/components/icons/apple-music-icon";
import { SpotifyIcon } from "@/components/icons/spotify-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { msToMMSS } from "@/lib/utils";

const searchSchema = z.object({
	track: z.coerce.number().int().positive().optional(),
});

export const Route = createFileRoute("/(nav)/music/$releaseId")({
	validateSearch: searchSchema,
	loader: async ({ params, context }) => {
		const releaseId = Number(params.releaseId);
		if (Number.isNaN(releaseId)) {
			throw notFound();
		}

		const queryOpts = releaseDetailsQueryOptions(releaseId);
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

		return { releaseId };
	},
	component: ReleaseDetailPage,
});

function formatContributors(contributors?: Contribution[]): string[] {
	if (!contributors || contributors.length === 0) return [];

	return contributors.map((entry) => {
		const parts = [
			entry.name,
			entry.role,
			entry.contribution,
			entry.share != null ? `${entry.share}%` : null,
		].filter(Boolean);
		return parts.join(" — ") || "Unknown contributor";
	});
}

function formatDate(value?: string | null) {
	if (!value) return "—";
	return new Date(value).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function formatBoolean(value?: boolean | null) {
	if (value === null || value === undefined) return "—";
	return value ? "Yes" : "No";
}

function ReleaseDetailPage() {
	const { releaseId } = Route.useParams();
	const numericId = Number(releaseId);

	const { data: release, isPending } = useQuery(
		releaseDetailsQueryOptions(Number.isNaN(numericId) ? null : numericId),
	);

	const { track: trackParam } = Route.useSearch();
	const navigate = useNavigate();

	const selectedTrack: DetailedTrack | undefined = useMemo(() => {
		if (!release?.tracks?.length) return undefined;
		if (trackParam) {
			const found = release.tracks.find((t) => t.id === trackParam);
			if (found) return found;
		}
		return release.tracks[0];
	}, [release, trackParam]);

	if (isPending) {
		return (
			<div className="flex min-h-[60vh] w-full items-center justify-center">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (!release || !selectedTrack) {
		return (
			<div className="flex min-h-[60vh] w-full items-center justify-center">
				<Card className="w-full max-w-md p-6 text-center">
					<CardContent className="space-y-4 p-0">
						<div className="font-bold text-2xl">Release not found</div>
						<p className="text-muted-foreground">
							We couldn't load that release right now.
						</p>
						<Link to="/music">
							<Button variant="outline" className="mt-2">
								Back to music
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	const songwriterList = formatContributors(selectedTrack.song.songwriters);
	const creditList = formatContributors(selectedTrack.recording.credits);
	const masterOwners = formatContributors(selectedTrack.recording.masterOwners);
	const performers = formatContributors(
		selectedTrack.recording.nonFeaturedPerformers,
	);

	return (
		<div className="min-h-screen w-full px-4 py-8 md:px-6">
			<div className="container mx-auto space-y-6">
				<div className="flex items-center justify-between gap-3">
					<Link to="/music">
						<Button variant="ghost" size="sm">
							<ChevronLeft className="mr-2 h-4 w-4" />
							Back to all music
						</Button>
					</Link>
				</div>

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
											const isActive = selectedTrack?.id === track.id;
											return (
												<button
													type="button"
													key={track.id}
													onClick={() =>
									navigate({
										to: ".",
										search: { track: track.id },
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
						<Card>
							<CardContent className="space-y-6 p-6">
								<div className="flex flex-col gap-2">
									<p className="text-muted-foreground text-xs uppercase">
										Track{" "}
										{selectedTrack.trackNumber.toString().padStart(2, "0")}
									</p>
									<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
										<div>
											<h2 className="font-bold text-2xl">
												{selectedTrack.title}
											</h2>
											<p className="text-muted-foreground text-sm">
												ISRC: {selectedTrack.isrc || "—"} · Duration:{" "}
												{msToMMSS(selectedTrack.duration) ?? "—"}
											</p>
										</div>
										<div className="text-right text-muted-foreground text-sm">
											{selectedTrack.recording.labelName && (
												<div>{selectedTrack.recording.labelName}</div>
											)}
											{release.catalogNumber && (
												<div>Catalog #: {release.catalogNumber}</div>
											)}
										</div>
									</div>
								</div>

								<Tabs defaultValue="lyrics" className="w-full">
									<TabsList>
										<TabsTrigger value="lyrics">Lyrics</TabsTrigger>
										<TabsTrigger value="credits">Credits</TabsTrigger>
										<TabsTrigger value="info">Info</TabsTrigger>
									</TabsList>

									<TabsContent value="lyrics" className="mt-4">
										<Card>
											<CardContent className="p-4">
												{selectedTrack.song.lyrics?.trim() ? (
													<p className="whitespace-pre-wrap text-base leading-relaxed">
														{selectedTrack.song.lyrics}
													</p>
												) : (
													<p className="text-muted-foreground text-sm">
														Lyrics not available.
													</p>
												)}
											</CardContent>
										</Card>
									</TabsContent>

									<TabsContent value="credits" className="mt-4">
										<div className="grid gap-4 md:grid-cols-2">
											<CreditSection
												title="Songwriters"
												entries={songwriterList}
											/>
											<CreditSection title="Credits" entries={creditList} />
											<CreditSection
												title="Master Owners"
												entries={masterOwners}
											/>
											<CreditSection
												title="Non-featured Performers"
												entries={performers}
											/>
										</div>
									</TabsContent>

									<TabsContent value="info" className="mt-4 space-y-4">
										<div className="grid gap-4 text-sm md:grid-cols-2">
											<InfoRow
												label="Primary Genre"
												value={selectedTrack.recording.primaryGenre}
											/>
											<InfoRow
												label="Secondary Genre"
												value={selectedTrack.recording.secondaryGenre}
											/>
											<InfoRow
												label="BPM"
												value={selectedTrack.recording.bpm}
											/>
											<InfoRow
												label="Key"
												value={selectedTrack.recording.keySignature}
											/>
											<InfoRow
												label="Time Signature"
												value={selectedTrack.recording.timeSignature}
											/>
											<InfoRow
												label="Studio"
												value={selectedTrack.recording.studio}
											/>
											<InfoRow
												label="Recording Date"
												value={formatDate(
													selectedTrack.recording.recordingDate,
												)}
											/>
											<InfoRow
												label="First Release"
												value={formatDate(
													selectedTrack.recording.dateOfFirstRelease,
												)}
											/>
											<InfoRow
												label="Country of Recording"
												value={selectedTrack.recording.countryOfRecording}
											/>
											<InfoRow
												label="Country of Mastering"
												value={selectedTrack.recording.countryOfMastering}
											/>
											<InfoRow
												label="Explicit Lyrics"
												value={formatBoolean(
													selectedTrack.recording.hasExplicitLyrics,
												)}
											/>
											<InfoRow
												label="Language"
												value={selectedTrack.song.language}
											/>
											<InfoRow
												label="Work Type"
												value={selectedTrack.song.workType}
											/>
											<InfoRow label="ISWC" value={selectedTrack.song.iswc} />
											<InfoRow
												label="Copyright Year"
												value={selectedTrack.song.copyrightYear}
											/>
										</div>
										<div className="grid gap-4 text-sm md:grid-cols-2">
											<InfoRow label="UPC" value={release.upc} />
											<InfoRow
												label="Catalog Number"
												value={release.catalogNumber}
											/>
											<InfoRow
												label="Distribution Date"
												value={formatDate(release.distributionDate)}
											/>
											<InfoRow
												label="First Release Countries"
												value={
													release.countriesOfFirstRelease?.length
														? release.countriesOfFirstRelease.join(", ")
														: "—"
												}
											/>
											<InfoRow
												label="Copyright Owner Country"
												value={release.copyrightOwnerCountryOfNationality}
											/>
										</div>
									</TabsContent>
								</Tabs>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}

function CreditSection({
	title,
	entries,
}: {
	title: string;
	entries: string[];
}) {
	return (
		<Card>
			<CardContent className="space-y-2 p-4">
				<h4 className="font-semibold text-sm">{title}</h4>
				{entries.length > 0 ? (
					<ul className="list-inside list-disc space-y-1 text-sm">
						{entries.map((entry, index) => (
							<li
								// biome-ignore lint/suspicious/noArrayIndexKey: Credit entries may have duplicate names
								key={index}
								className="text-muted-foreground"
							>
								{entry}
							</li>
						))}
					</ul>
				) : (
					<p className="text-muted-foreground text-sm">No data available.</p>
				)}
			</CardContent>
		</Card>
	);
}

function InfoRow({
	label,
	value,
}: {
	label: string;
	value: string | number | null | undefined;
}) {
	return (
		<div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
			<span className="text-muted-foreground text-xs uppercase tracking-wide">
				{label}
			</span>
			<span className="font-medium">
				{value === null || value === undefined || value === "" ? "—" : value}
			</span>
		</div>
	);
}
