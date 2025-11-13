import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Info } from "lucide-react";
import { SpotifyIcon } from "@/components/icons/spotify-icon";
import { AppleMusicIcon } from "@/components/icons/apple-music-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";

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
  },
  {
    id: "3",
    title: "Summer EP",
    type: "EP",
    artwork: "https://placehold.co/400x400/3a3a3a/white?text=EP",
    releaseDate: "2023",
    streamUrl: "#",
    youtube: "https://youtube.com",
  },
  {
    id: "4",
    title: "Previous Single",
    type: "Single",
    artwork: "https://placehold.co/400x400/4a4a4a/white?text=Single",
    releaseDate: "2022",
    streamUrl: "#",
  },
  {
    id: "5",
    title: "Acoustic Sessions",
    type: "EP",
    artwork: "https://placehold.co/400x400/5a5a5a/white?text=EP",
    releaseDate: "2022",
    streamUrl: "#",
    spotify: "https://open.spotify.com",
  },
];

export default function MusicSection() {
  return (
    <section className="w-full py-16 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Music</h2>
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
            {mockMusicData.map((item) => (
              <CarouselItem
                key={item.id}
                className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="relative aspect-square">
                      <img
                        src={item.artwork}
                        alt={item.title}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={item.streamUrl}
                          className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <Play className="w-8 h-8 fill-primary-foreground text-primary-foreground ml-1" />
                        </a>
                      </div>
                    </div>
                    <div className="p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg truncate">
                          {item.title}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {item.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-3">
                          {item.spotify && (
                            <a
                              href={item.spotify}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                              aria-label="Listen on Spotify"
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
                            >
                              <YoutubeIcon size={20} />
                            </a>
                          )}
                          <a
                            href={`/music/${item.id}`}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            aria-label="Release info"
                          >
                            <Info size={20} />
                          </a>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.releaseDate}
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
