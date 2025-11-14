import { SpotifyIcon } from "@/components/icons/spotify-icon";
import { AppleMusicIcon } from "@/components/icons/apple-music-icon";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { TiktokIcon } from "@/components/icons/tiktok-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";
import { XIcon } from "@/components/icons/x-icon";

export const siteConfig = {
  name: "Luke Roes",
  description: "Official website of Luke Roes - Music, tour dates, and more",
  url: "https://lukeroes.com",

  SEO: {
    author: "Luke Roes",
    keywords: ["Luke Roes", "music", "artist", "singer", "songwriter"],
    ogImage: "/og-image.jpg",
  },

  socials: [
    {
      key: "spotify",
      label: "Spotify",
      href: "https://open.spotify.com/artist/4musCItyvLBJYaHClwbTLd",
      icon: SpotifyIcon,
    },
    {
      key: "appleMusic",
      label: "Apple Music",
      href: "https://music.apple.com/ca/artist/luke-roes/1457350673",
      icon: AppleMusicIcon,
    },
    {
      key: "youtube",
      label: "YouTube",
      href: "https://www.youtube.com/channel/UCsiMYzZ_pCMoOg_s55g4NHA",
      icon: YoutubeIcon,
    },
    {
      key: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/lukeroes",
      icon: InstagramIcon,
    },
    {
      key: "twitter",
      label: "Twitter",
      href: "https://x.com/lukeroes",
      icon: XIcon,
    },
    {
      key: "tiktok",
      label: "TikTok",
      href: "https://www.tiktok.com/@iamlukeroes",
      icon: TiktokIcon,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: "",
      icon: InstagramIcon,
    },
    {
      key: "soundcloud",
      label: "SoundCloud",
      href: "",
      icon: InstagramIcon,
    },
  ],

  email: "luke@lukeroes.com",
} as const;

export type SiteConfig = typeof siteConfig;
