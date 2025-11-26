import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { SpotifyIcon } from "@/components/icons/spotify-icon";
import { AppleMusicIcon } from "@/components/icons/apple-music-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { releaseDetailsQueryOptions, type ApiTrack } from "@/hooks/use-music";
import { musicQueryOptions } from "@/hooks/use-music";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import { msToMMSS } from "@/lib/utils";
import { ArtworkImage } from "@/components/artwork-image";

function MusicErrorComponent({ error: _error }: { error: unknown }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  let message = "Looks like we can't find the music right now.";

  async function handleRetry() {
    await queryClient.invalidateQueries({ queryKey: ["music"] });
    await queryClient.refetchQueries({ queryKey: ["music"] });
    await router.invalidate();
  }

  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center p-6">
        <CardContent className="space-y-4 p-0">
          <div className="text-2xl font-bold">Oops!</div>
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

export const Route = createFileRoute("/(nav)/music")({
  component: MusicPageComponent,
  errorComponent: MusicErrorComponent,
  loader: ({ context }) => context.queryClient.prefetchQuery(musicQueryOptions),
});

function MusicPageComponent() {
  const { data: releases } = useQuery(musicQueryOptions);
  console.log("RELEASES DATA", releases);
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!selectedReleaseId && releases && releases.length > 0) {
      setSelectedReleaseId(releases[0].id);
    }
  }, [releases, selectedReleaseId]);

  const { data: detailedRelease, isLoading: isLoadingDetails } = useQuery(
    releaseDetailsQueryOptions(selectedReleaseId),
  );
  console.log("DETAILED RELEASE", detailedRelease);
  const selectedRelease = releases?.find((r) => r.id === selectedReleaseId);
  const tracksForSelected: ApiTrack[] =
    detailedRelease?.tracks ?? selectedRelease?.tracks ?? [];

  const [expandedMobileId, setExpandedMobileId] = useState<string | null>(null);

  if (!releases || releases.length === 0) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-6">
          <CardContent className="space-y-4 p-0">
            <div className="text-2xl font-bold">No music yet</div>
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
      <div className="w-full min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen py-8 px-4 md:px-6">
      <div className="container mx-auto">
        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {/* Left Panel - Fixed Selected Release */}
          <div className="col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6 flex flex-col items-center">
                <div className="w-2/3 space-y-4">
                  <div className="aspect-square">
                    <ArtworkImage
                      src={selectedRelease.artworkPublicUrl ?? undefined}
                      alt={selectedRelease.title}
                      className="object-cover w-full h-full rounded"
                    />
                  </div>
                  <div>
                    <h2 className="font-bold text-2xl mb-1">
                      {selectedRelease.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedRelease.type} ·{" "}
                      {new Date(selectedRelease.releaseDate).toLocaleDateString(
                        "en-US",
                      )}
                    </p>
                  </div>

                  {/* Streaming Links */}
                  <div className="flex gap-3">
                    {selectedRelease.streamingLinks?.spotify && (
                      <a
                        href={selectedRelease.streamingLinks.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
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
                        className="text-muted-foreground hover:text-primary transition-colors"
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
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Watch on YouTube"
                      >
                        <YoutubeIcon size={24} />
                      </a>
                    )}
                  </div>

                  {/* Tracklist */}
                  <div className="space-y-1 w-full">
                    {isLoadingDetails &&
                    (!tracksForSelected || tracksForSelected.length === 0) ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner className="h-4 w-4" />
                        <span>Loading tracklist...</span>
                      </div>
                    ) : tracksForSelected.length > 0 ? (
                      (tracksForSelected ?? []).map((track) => (
                        <Collapsible
                          key={
                            track.id ?? `${track.trackNumber}-${track.title}`
                          }
                          className="w-full"
                        >
                          <div className="flex items-center justify-between hover:bg-accent/50 rounded transition-colors pr-1">
                            <div className="flex items-center gap-3 p-1">
                              <span className="text-xs text-muted-foreground">
                                {track.trackNumber.toString().padStart(2, "0")}
                              </span>
                              <span className="text-sm">{track.title}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm text-muted-foreground mr-2">
                                {msToMMSS(track.duration) ?? "—"}
                              </span>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="sr-only">Toggle Lyrics</span>
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                          </div>
                          <CollapsibleContent>
                            <div className="p-3 my-1 rounded-md border bg-muted/40">
                              {isLoadingDetails && !detailedRelease ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Spinner className="h-4 w-4" />
                                  <span>Loading lyrics...</span>
                                </div>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                  {track.lyrics?.trim() ||
                                    "Lyrics not available."}
                                </p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
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
                    className={`overflow-hidden group cursor-pointer hover:shadow-lg transition-all ${
                      selectedReleaseId !== item.id
                        ? "opacity-80 blur-[0.5px]"
                        : ""
                    }`}
                    onClick={() => setSelectedReleaseId(item.id)}
                  >
                    <CardContent className="p-6 flex flex-col items-center">
                      <div className="w-2/3 space-y-2">
                        <div className="aspect-square mb-2">
                          <ArtworkImage
                            src={item.artworkPublicUrl ?? undefined}
                            alt={item.title}
                            className="object-cover w-full h-full rounded"
                          />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg truncate">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
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
        <div className="md:hidden space-y-6">
          {releases.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    const newId =
                      expandedMobileId === String(item.id)
                        ? null
                        : String(item.id);
                    setExpandedMobileId(newId);
                    if (newId) {
                      setSelectedReleaseId(item.id);
                    }
                  }}
                >
                  <div className="p-4 flex flex-col items-center">
                    <ArtworkImage
                      src={item.artworkPublicUrl ?? undefined}
                      alt={item.title}
                      className="w-2/3 aspect-square rounded object-cover mb-4"
                    />
                    <div className="w-full text-center mb-3">
                      <h3 className="font-semibold text-lg mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.type} ·{" "}
                        {new Date(item.releaseDate).toLocaleDateString("en-US")}
                      </p>
                    </div>
                    <div className="flex gap-3 mb-2">
                      {item.streamingLinks?.spotify && (
                        <a
                          href={item.streamingLinks.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
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
                          className="text-muted-foreground hover:text-primary transition-colors"
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
                          className="text-muted-foreground hover:text-primary transition-colors"
                          aria-label="Watch on YouTube"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <YoutubeIcon size={20} />
                        </a>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      {expandedMobileId === String(item.id) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Track Info */}
                {expandedMobileId === String(item.id) && (
                  <div className="border-t p-4">
                    {isLoadingDetails &&
                    selectedReleaseId === item.id &&
                    (!detailedRelease || !detailedRelease.tracks.length) ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ) : (
                      (() => {
                        const tracks: ApiTrack[] =
                          detailedRelease && detailedRelease.id === item.id
                            ? detailedRelease.tracks
                            : (item.tracks ?? []);
                        return (
                          <div className="space-y-2">
                            {tracks.map((track) => (
                              <div
                                key={
                                  track.id ??
                                  `${track.trackNumber}-${track.title}`
                                }
                                className="flex items-center justify-between text-sm hover:bg-accent/50 rounded transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-muted-foreground">
                                    {track.trackNumber
                                      .toString()
                                      .padStart(2, "0")}
                                  </span>
                                  <span>{track.title}</span>
                                </div>
                                <span className="text-muted-foreground">
                                  {msToMMSS(track.duration) ?? "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    )}
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
