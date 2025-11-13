import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { SpotifyIcon } from "./icons/spotify-icon";
import { AppleMusicIcon } from "./icons/apple-music-icon";
import { InstagramIcon } from "./icons/instagram-icon";
import { TiktokIcon } from "./icons/tiktok-icon";
import { YoutubeIcon } from "./icons/youtube-icon";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { to: "/", label: "Home" },
    { to: "/music", label: "Music" },
    { to: "/videos", label: "Videos" },
    { to: "/tour", label: "Tour" },
  ] as const;

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
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background backdrop-blur">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-6 py-4">
        {/* Left - Navigation Links */}
        <nav className="flex gap-6 text-sm font-medium">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
              activeProps={{
                className: "text-foreground",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Center - Artist Name */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link to="/" className="text-2xl font-bold tracking-tight">
            LUKE ROES
          </Link>
        </div>

        {/* Right - Social Icons */}
        <div className="flex items-center gap-4">
          {socialLinks.map(({ href, icon: Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/60 transition-colors hover:text-foreground"
              aria-label={label}
            >
              <Icon size={20} />
            </a>
          ))}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex md:hidden items-center justify-between px-4 py-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link to="/" className="text-xl font-bold tracking-tight">
          LUKE ROES
        </Link>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col px-4 py-2">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="py-3 text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                activeProps={{
                  className: "text-foreground",
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="border-t px-4 py-4">
            <div className="flex items-center justify-center gap-6">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/60 transition-colors hover:text-foreground"
                  aria-label={label}
                >
                  <Icon size={24} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
