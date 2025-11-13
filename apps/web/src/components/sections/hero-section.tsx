import { SpotifyIcon } from "../icons/spotify-icon";
import { AppleMusicIcon } from "../icons/apple-music-icon";
import { YoutubeIcon } from "../icons/youtube-icon";

export default function HeroSection() {
  const streamingLinks = [
    { href: "https://open.spotify.com", icon: SpotifyIcon, label: "Spotify" },
    {
      href: "https://music.apple.com",
      icon: AppleMusicIcon,
      label: "Apple Music",
    },
    { href: "https://youtube.com", icon: YoutubeIcon, label: "YouTube" },
  ];

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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-end justify-center pb-52 px-4">
        <div className="text-center space-y-6 max-w-2xl">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              New EP Out Now
            </p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Welcome To My Head
            </h1>
          </div>

          {/* Streaming Links */}
          <div className="flex items-center justify-center gap-4">
            {streamingLinks.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
