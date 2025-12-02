import { SpotifyIcon } from "../icons/spotify-icon";
import { AppleMusicIcon } from "../icons/apple-music-icon";
import { YoutubeIcon } from "../icons/youtube-icon";
import { Button } from "../ui/button";
import { useQuery } from "@tanstack/react-query";
import { musicQueryOptions } from "@/hooks/use-music";
import { ArtworkImage } from "../artwork-image";

export default function HeroSection() {
  const { data: releases } = useQuery(musicQueryOptions);
  const mostRecentRelease = releases?.[0];

  const TITLE_LENGTH_THRESHOLD = 12;
  const titleIsLong =
    (mostRecentRelease?.title.length ?? 0) > TITLE_LENGTH_THRESHOLD;

  const streamingLinks = mostRecentRelease
    ? [
        mostRecentRelease.streamingLinks?.spotify && {
          href: mostRecentRelease.streamingLinks.spotify,
          icon: SpotifyIcon,
          label: "Spotify",
        },
        mostRecentRelease.streamingLinks?.appleMusic && {
          href: mostRecentRelease.streamingLinks.appleMusic,
          icon: AppleMusicIcon,
          label: "Apple Music",
        },
        mostRecentRelease.streamingLinks?.youtube && {
          href: mostRecentRelease.streamingLinks.youtube,
          icon: YoutubeIcon,
          label: "YouTube",
        },
      ].filter(Boolean)
    : [];

  return (
    <section className="relative h-screen w-full overflow-hidden -mt-[72px]">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/bg-desktop-dirty.jpg')",
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/5" />
      </div>
      {/* Content */}
      <div className="relative h-full flex items-end  pb-10 sm:pb-20 px-4">
        {mostRecentRelease && (
          <div className="flex flex-col items-center max-w-4xl w-full">
            {/* New Release Label */}
            <p
              className="text-sm sm:text-lg font-bold text-foreground animate-bounce
              uppercase tracking-wider text-center"
            >
              New {mostRecentRelease.type.toUpperCase()} Out Now
            </p>

            {/* Artwork and Title/Links */}
            <div className="flex items-center gap-4 md:gap-8 w-full justify-center">
              {/* Album Artwork */}
              <div className="w-22 md:w-32 aspect-square shrink-0">
                <ArtworkImage
                  src={mostRecentRelease.artworkPublicUrl ?? undefined}
                  alt={mostRecentRelease.title}
                  className="w-full h-full object-cover rounded-lg shadow-2xl"
                />
              </div>

              {/* Title and Streaming Links */}
              <div className="flex flex-col justify-center ">
                <h1
                  className={`font-bold tracking-tight ${titleIsLong ? "text-xl md:text-5xl mb-1 md:mb-2" : "text-2xl md:text-6xl"}`}
                >
                  {mostRecentRelease.title}
                </h1>

                {/* Streaming Links */}
                {streamingLinks.length > 0 && (
                  <div className="flex items-center gap-4">
                    {streamingLinks.map(({ href, icon: Icon, label }) => (
                      <Button
                        key={label}
                        variant="default"
                        asChild
                        className="rounded-full bg-primary/55 backdrop-blur-md
                        text-background hover:bg-foreground p-4 transition-all duration-500 md:px-6 md:py-3"
                      >
                        <a
                          href={href}
                          className="rounded-full py-4 sm:p-6"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Icon className="size-5 sm:size-6" />
                          <span className="hidden md:inline">{label}</span>
                        </a>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
