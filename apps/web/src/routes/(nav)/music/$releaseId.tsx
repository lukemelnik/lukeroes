import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ApiContribution, type ApiDetailedTrack } from "@/lib/music-types";
import { releaseDetailsQueryOptions } from "@/hooks/use-music";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArtworkImage } from "@/components/artwork-image";
import { Spinner } from "@/components/ui/spinner";
import { msToMMSS } from "@/lib/utils";
import { AppleMusicIcon } from "@/components/icons/apple-music-icon";
import { SpotifyIcon } from "@/components/icons/spotify-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/(nav)/music/$releaseId")({
  loader: async ({ params, context }) => {
    const releaseId = Number(params.releaseId);
    if (Number.isNaN(releaseId)) {
      throw notFound();
    }

    const release = await context.queryClient.ensureQueryData(
      releaseDetailsQueryOptions(releaseId),
    );

    if (!release) {
      throw notFound();
    }

    return { releaseId };
  },
  component: ReleaseDetailPage,
});

function formatContributors(
  contributors?: ApiContribution[] | null,
): string[] {
  if (!contributors || contributors.length === 0) return [];

  return contributors.map((entry) => {
    if (typeof entry === "string") return entry;
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

  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  useEffect(() => {
    if (release?.tracks?.length && selectedTrackId === null) {
      setSelectedTrackId(release.tracks[0].id);
    }
  }, [release, selectedTrackId]);

  const selectedTrack: ApiDetailedTrack | undefined = useMemo(() => {
    if (!release?.tracks?.length) return undefined;
    if (selectedTrackId === null) return release.tracks[0];
    return release.tracks.find((track) => track.id === selectedTrackId);
  }, [release, selectedTrackId]);

  if (isPending) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!release || !selectedTrack) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-6">
          <CardContent className="space-y-4 p-0">
            <div className="text-2xl font-bold">Release not found</div>
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
    <div className="w-full min-h-screen py-8 px-4 md:px-6">
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/music">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to music
            </Button>
          </Link>
          <div className="text-sm text-muted-foreground">
            {release.releaseLabel && (
              <span className="mr-3">Label: {release.releaseLabel}</span>
            )}
            {release.distributor && (
              <span className="mr-3">Distributor: {release.distributor}</span>
            )}
            <span>Released {formatDate(release.releaseDate)}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6 flex flex-col items-center">
                <div className="w-2/3 space-y-4">
                  <div className="aspect-square">
                    <ArtworkImage
                      src={release.artworkPublicUrl ?? undefined}
                      alt={release.title}
                      className="object-cover w-full h-full rounded"
                    />
                  </div>
                  <div>
                    <h1 className="font-bold text-2xl mb-1">{release.title}</h1>
                    <p className="text-sm text-muted-foreground">
                      {release.type} · {formatDate(release.releaseDate)}
                    </p>
                    {release.version && (
                      <p className="text-sm text-muted-foreground">
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
                        className="text-muted-foreground hover:text-primary transition-colors"
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
                        className="text-muted-foreground hover:text-primary transition-colors"
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
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Watch on YouTube"
                      >
                        <YoutubeIcon size={24} />
                      </a>
                    )}
                  </div>

                  <div className="space-y-1 w-full">
                    {release.tracks.map((track) => {
                      const isActive = selectedTrack?.id === track.id;
                      return (
                        <button
                          key={track.id}
                          onClick={() => setSelectedTrackId(track.id)}
                          className={`flex w-full items-center justify-between rounded transition-colors pr-1 ${
                            isActive
                              ? "bg-accent text-foreground"
                              : "hover:bg-accent/50"
                          }`}
                        >
                          <div className="flex items-center gap-3 p-1">
                            <span className="text-xs text-muted-foreground">
                              {track.trackNumber.toString().padStart(2, "0")}
                            </span>
                            <span className="text-sm">{track.title}</span>
                          </div>
                          <span className="text-sm text-muted-foreground mr-2">
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
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col gap-2">
                  <p className="text-xs uppercase text-muted-foreground">
                    Track {selectedTrack.trackNumber.toString().padStart(2, "0")}
                  </p>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedTrack.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        ISRC: {selectedTrack.isrc || "—"} · Duration:{" "}
                        {msToMMSS(selectedTrack.duration) ?? "—"}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
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
                          <div
                            className="prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{
                              __html: selectedTrack.song.lyrics,
                            }}
                          />
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            Lyrics not available.
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-3">
                          {selectedTrack.song.isInstrumental
                            ? "This track is marked as instrumental."
                            : "Contains vocals"}
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="credits" className="mt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <CreditSection title="Songwriters" entries={songwriterList} />
                      <CreditSection title="Credits" entries={creditList} />
                      <CreditSection title="Master Owners" entries={masterOwners} />
                      <CreditSection
                        title="Non-featured Performers"
                        entries={performers}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="info" className="mt-4 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <InfoRow label="Primary Genre" value={selectedTrack.recording.primaryGenre} />
                      <InfoRow label="Secondary Genre" value={selectedTrack.recording.secondaryGenre} />
                      <InfoRow label="BPM" value={selectedTrack.recording.bpm} />
                      <InfoRow label="Key" value={selectedTrack.recording.keySignature} />
                      <InfoRow label="Time Signature" value={selectedTrack.recording.timeSignature} />
                      <InfoRow label="Studio" value={selectedTrack.recording.studio} />
                      <InfoRow label="Recording Date" value={formatDate(selectedTrack.recording.recordingDate)} />
                      <InfoRow label="First Release" value={formatDate(selectedTrack.recording.dateOfFirstRelease)} />
                      <InfoRow label="Country of Recording" value={selectedTrack.recording.countryOfRecording} />
                      <InfoRow label="Country of Mastering" value={selectedTrack.recording.countryOfMastering} />
                      <InfoRow
                        label="Explicit Lyrics"
                        value={formatBoolean(selectedTrack.recording.hasExplicitLyrics)}
                      />
                      <InfoRow
                        label="Language"
                        value={selectedTrack.song.language}
                      />
                      <InfoRow
                        label="Work Type"
                        value={selectedTrack.song.workType}
                      />
                      <InfoRow
                        label="ISWC"
                        value={selectedTrack.song.iswc}
                      />
                      <InfoRow
                        label="Copyright Year"
                        value={selectedTrack.song.copyrightYear}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <InfoRow label="UPC" value={release.upc} />
                      <InfoRow label="Catalog Number" value={release.catalogNumber} />
                      <InfoRow label="Distribution Date" value={formatDate(release.distributionDate)} />
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

function CreditSection({ title, entries }: { title: string; entries: string[] }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <h4 className="font-semibold text-sm">{title}</h4>
        {entries.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-sm">
            {entries.map((entry, index) => (
              <li key={`${title}-${index}`} className="text-muted-foreground">
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
    <div className="flex items-center justify-between gap-4 border rounded-md px-3 py-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="font-medium">
        {value === null || value === undefined || value === ""
          ? "—"
          : value}
      </span>
    </div>
  );
}
