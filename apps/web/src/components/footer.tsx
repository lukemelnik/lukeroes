import { Link } from "@tanstack/react-router";
import { SpotifyIcon } from "./icons/spotify-icon";
import { AppleMusicIcon } from "./icons/apple-music-icon";
import { InstagramIcon } from "./icons/instagram-icon";
import { TiktokIcon } from "./icons/tiktok-icon";
import { YoutubeIcon } from "./icons/youtube-icon";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { href: "https://open.spotify.com", icon: SpotifyIcon, label: "Spotify" },
    {
      href: "https://music.apple.com",
      icon: AppleMusicIcon,
      label: "Apple Music",
    },
    { href: "https://instagram.com", icon: InstagramIcon, label: "Instagram" },
    { href: "https://tiktok.com", icon: TiktokIcon, label: "TikTok" },
    { href: "https://youtube.com", icon: YoutubeIcon, label: "YouTube" },
  ];

  const links = [
    { to: "/", label: "Home" },
    { to: "/music", label: "Music" },
    { to: "/videos", label: "Videos" },
    { to: "/tour", label: "Tour" },
  ];

  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="text-2xl font-bold tracking-tight">
              LUKE ROES
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Artist, Producer, Mixer
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h3 className="font-semibold">Quick Links</h3>
            <nav className="flex gap-4 ">
              {links.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Social */}
          <div className="space-y-2">
            <h3 className="font-semibold">Follow</h3>
            <div className="flex gap-4">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={label}
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Luke Roes. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
