import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SpotifyIcon } from "@/components/icons/spotify-icon";
import { AppleMusicIcon } from "@/components/icons/apple-music-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useMusicSuspense,
  type MusicRelease,
} from "@/hooks/use-music";
import { musicQueryOptions } from "@/hooks/use-music";

export const Route = createFileRoute("/(nav)/music")({
  component: MusicPageComponent,
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(musicQueryOptions);
  },
});

function MusicPageComponent() {
  const { data: musicData } = useMusicSuspense();
  const [selectedRelease, setSelectedRelease] = useState<MusicRelease>(
    musicData[0],
  );
  const [expandedMobileId, setExpandedMobileId] = useState<string | null>(null);

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
                    <img
                      src={selectedRelease.artwork}
                      alt={selectedRelease.title}
                      className="object-cover w-full h-full rounded"
                    />
                  </div>
                  <div>
                    <h2 className="font-bold text-2xl mb-1">
                      {selectedRelease.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedRelease.type} · {selectedRelease.releaseDate}
                    </p>
                  </div>

                  {/* Streaming Links */}
                  <div className="flex gap-3">
                    {selectedRelease.spotify && (
                      <a
                        href={selectedRelease.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Listen on Spotify"
                      >
                        <SpotifyIcon size={24} />
                      </a>
                    )}
                    {selectedRelease.appleMusic && (
                      <a
                        href={selectedRelease.appleMusic}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Listen on Apple Music"
                      >
                        <AppleMusicIcon size={24} />
                      </a>
                    )}
                    {selectedRelease.youtube && (
                      <a
                        href={selectedRelease.youtube}
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
                  <div>
                    <div className="space-y-1">
                      {selectedRelease.tracks.map((track) => (
                        <div
                          key={track.number}
                          className="flex items-center justify-between text-sm hover:bg-accent/50 rounded transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span>{track.title}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {track.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Scrollable Release Grid */}
          <div className="col-span-2">
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="grid grid-cols-2 gap-6 pr-4 pb-8">
                {musicData.map((item) => (
                  <Card
                    key={item.id}
                    className={`overflow-hidden group cursor-pointer hover:shadow-lg transition-all ${
                      selectedRelease.id !== item.id
                        ? "opacity-60 blur-[0.5px]"
                        : ""
                    }`}
                    onClick={() => setSelectedRelease(item)}
                  >
                    <CardContent className="p-6 flex flex-col items-center">
                      <div className="w-2/3 space-y-2">
                        <div className="aspect-square mb-2">
                          <img
                            src={item.artwork}
                            alt={item.title}
                            className="object-cover w-full h-full rounded"
                          />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg truncate">
                            {item.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.type} · {item.releaseDate}
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
          {musicData.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedMobileId(
                      expandedMobileId === item.id ? null : item.id,
                    )
                  }
                >
                  <div className="p-4 flex flex-col items-center">
                    <img
                      src={item.artwork}
                      alt={item.title}
                      className="w-2/3 aspect-square rounded object-cover mb-4"
                    />
                    <div className="w-full text-center mb-3">
                      <h3 className="font-semibold text-lg mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.type} · {item.releaseDate}
                      </p>
                    </div>
                    <div className="flex gap-3 mb-2">
                      {item.spotify && (
                        <a
                          href={item.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          aria-label="Listen on Spotify"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SpotifyIcon size={20} />
                        </a>
                      )}
                      {item.appleMusic && (
                        <a
                          href={item.appleMusic}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          aria-label="Listen on Apple Music"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AppleMusicIcon size={20} />
                        </a>
                      )}
                      {item.youtube && (
                        <a
                          href={item.youtube}
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
                      {expandedMobileId === item.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Track Info */}
                {expandedMobileId === item.id && (
                  <div className="border-t p-4">
                    <div className="space-y-2">
                      {item.tracks.map((track) => (
                        <div
                          key={track.number}
                          className="flex items-center justify-between text-sm hover:bg-accent/50 rounded transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span>{track.title}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {track.duration}
                          </span>
                        </div>
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
