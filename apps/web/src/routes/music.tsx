import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Play, ChevronDown, ChevronUp } from "lucide-react";
import { SpotifyIcon } from "@/components/icons/spotify-icon";
import { AppleMusicIcon } from "@/components/icons/apple-music-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/music")({
  component: MusicPageComponent,
});

interface Track {
  number: number;
  title: string;
  duration: string;
}

interface MusicItem {
  id: string;
  title: string;
  type: "Single" | "Album" | "EP";
  artwork: string;
  releaseDate: string;
  streamUrl: string;
  spotify?: string;
  appleMusic?: string;
  youtube?: string;
  tracks: Track[];
}

const mockMusicData: MusicItem[] = [
  {
    id: "1",
    title: "Latest Single",
    type: "Single",
    artwork: "https://placehold.co/400x400/1a1a1a/white?text=Single",
    releaseDate: "2024",
    streamUrl: "#",
    spotify: "https://open.spotify.com",
    appleMusic: "https://music.apple.com",
    youtube: "https://youtube.com",
    tracks: [{ number: 1, title: "Latest Single", duration: "3:45" }],
  },
  {
    id: "2",
    title: "Debut Album",
    type: "Album",
    artwork: "https://placehold.co/400x400/2a2a2a/white?text=Album",
    releaseDate: "2023",
    streamUrl: "#",
    spotify: "https://open.spotify.com",
    appleMusic: "https://music.apple.com",
    tracks: [
      { number: 1, title: "Opening Track", duration: "4:12" },
      { number: 2, title: "Second Song", duration: "3:58" },
      { number: 3, title: "Interlude", duration: "1:30" },
      { number: 4, title: "Best Track", duration: "4:45" },
      { number: 5, title: "Slow Jam", duration: "5:20" },
      { number: 6, title: "Upbeat Anthem", duration: "3:15" },
      { number: 7, title: "Emotional Ballad", duration: "4:30" },
      { number: 8, title: "Closing Song", duration: "4:05" },
    ],
  },
  {
    id: "3",
    title: "Summer EP",
    type: "EP",
    artwork: "https://placehold.co/400x400/3a3a3a/white?text=EP",
    releaseDate: "2023",
    streamUrl: "#",
    youtube: "https://youtube.com",
    tracks: [
      { number: 1, title: "Summer Vibes", duration: "3:22" },
      { number: 2, title: "Beach Day", duration: "3:48" },
      { number: 3, title: "Sunset Drive", duration: "4:15" },
      { number: 4, title: "Late Night", duration: "3:55" },
    ],
  },
  {
    id: "4",
    title: "Previous Single",
    type: "Single",
    artwork: "https://placehold.co/400x400/4a4a4a/white?text=Single",
    releaseDate: "2022",
    streamUrl: "#",
    tracks: [{ number: 1, title: "Previous Single", duration: "3:30" }],
  },
  {
    id: "5",
    title: "Acoustic Sessions",
    type: "EP",
    artwork: "https://placehold.co/400x400/5a5a5a/white?text=EP",
    releaseDate: "2022",
    streamUrl: "#",
    spotify: "https://open.spotify.com",
    tracks: [
      { number: 1, title: "Unplugged Version", duration: "4:05" },
      { number: 2, title: "Stripped Down", duration: "3:40" },
      { number: 3, title: "Raw Emotion", duration: "4:25" },
    ],
  },
];

function MusicPageComponent() {
  const [selectedRelease, setSelectedRelease] = useState<MusicItem>(
    mockMusicData[0],
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
                {mockMusicData.map((item) => (
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
          {mockMusicData.map((item) => (
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
