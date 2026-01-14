import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { linksConfig } from "@/lib/links-config";
import { siteConfig } from "@/lib/site-config";
import { SpotifyIcon } from "@/components/icons/spotify-icon";
import { AppleMusicIcon } from "@/components/icons/apple-music-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";
import { musicQueryOptions } from "@/hooks/use-music";
import { ArtworkImage } from "@/components/artwork-image";

export const Route = createFileRoute("/links")({
  component: LinksPage,
});

function LinksPage() {
  const { profile, links, showMailingList } = linksConfig;
  const { data: releases } = useQuery(musicQueryOptions);
  const featuredRelease = releases?.[0];

  const streamingLinks = featuredRelease
    ? [
        { href: featuredRelease.streamingLinks?.spotify, icon: SpotifyIcon, label: "Spotify" },
        { href: featuredRelease.streamingLinks?.appleMusic, icon: AppleMusicIcon, label: "Apple Music" },
        { href: featuredRelease.streamingLinks?.youtube, icon: YoutubeIcon, label: "YouTube" },
      ].filter((link): link is { href: string; icon: typeof SpotifyIcon; label: string } => !!link.href)
    : [];

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // TODO: Implement mailing list subscription
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setEmail("");
    setIsSubmitting(false);
  };

  // Filter socials that have URLs
  const activeSocials = siteConfig.socials.filter((social) => social.href);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Profile Section */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Link to="/" className="group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/50 group-hover:border-primary transition-colors">
              <img
                src={profile.image}
                alt={profile.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement!.innerHTML = `<div class="w-full h-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">${profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}</div>`;
                }}
              />
            </div>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">{profile.tagline}</p>
          </div>
        </div>

        {/* Featured Release */}
        {featuredRelease && (
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex gap-4 items-center">
              <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                <ArtworkImage
                  src={featuredRelease.artworkPublicUrl ?? undefined}
                  alt={featuredRelease.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{featuredRelease.title}</h2>
                  <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-semibold tracking-widest uppercase">
                    New {featuredRelease.type}
                  </span>
                </div>
                {streamingLinks.length > 0 && (
                  <div className="flex gap-2">
                    {streamingLinks.map(({ href, icon: Icon, label }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <Icon size={18} />
                        <span className="sr-only">{label}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Link Buttons */}
        <div className="space-y-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isExternal = link.external;

            if (isExternal) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-12 px-4 rounded-lg bg-card border border-border hover:bg-accent hover:border-primary/50 transition-all font-medium"
                >
                  <Icon className="size-4" />
                  <span>{link.label}</span>
                  <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
                </a>
              );
            }

            return (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center justify-center gap-2 w-full h-12 px-4 rounded-lg bg-card border border-border hover:bg-accent hover:border-primary/50 transition-all font-medium"
              >
                <Icon className="size-4" />
                <span className="mt-0.75">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Social Icons */}
        {activeSocials.length > 0 && (
          <div className="flex justify-center gap-3 pt-4">
            {activeSocials.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.key}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="p-2.5 rounded-full bg-card border border-border hover:bg-accent hover:border-primary/50 transition-all"
                >
                  <Icon size={20} />
                </a>
              );
            })}
          </div>
        )}

        {/* Mailing List */}
        {showMailingList && (
          <div className="pt-6 border-t border-border">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-medium">Stay in the loop</span>
              </div>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={isSubmitting} size="default">
                  {isSubmitting ? "..." : "Join"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            lukeroes.com
          </Link>
        </div>
      </div>
    </div>
  );
}
