import type { LucideIcon } from "lucide-react";
import { BookOpenText, Disc3Icon, Mail } from "lucide-react";
// Other useful icons: Music, Video, Calendar, BookOpen, Mail, ExternalLink, ShoppingBag, Ticket

export interface LinkItem {
	label: string;
	href: string;
	icon: LucideIcon;
	external?: boolean;
}

export interface FeaturedRelease {
	title: string;
	subtitle?: string;
	image: string;
	isNew?: boolean;
	streamingLinks: {
		platform: "spotify" | "appleMusic" | "youtube";
		url: string;
	}[];
}

export interface LinksConfig {
	profile: {
		image: string;
		name: string;
		tagline: string;
	};
	featured: FeaturedRelease | null;
	links: LinkItem[];
	showMailingList: boolean;
}

export const linksConfig: LinksConfig = {
	profile: {
		image: "/bg-desktop-dirty.jpg", // Add your profile image to public/profile.jpg
		name: "Luke Roes",
		tagline: "Artist • Producer • Mixer",
	},

	// Set to null to hide, or configure a featured release
	featured: null,
	// Example featured release:
	// featured: {
	//   title: "New Single",
	//   subtitle: "Out Now",
	//   image: "/releases/single-cover.jpg",
	//   isNew: true,
	//   streamingLinks: [
	//     { platform: "spotify", url: "https://open.spotify.com/..." },
	//     { platform: "appleMusic", url: "https://music.apple.com/..." },
	//     { platform: "youtube", url: "https://youtube.com/..." },
	//   ],
	// },

	links: [
		{
			label: "Work with Me",
			href: "/work-with-me",
			icon: Disc3Icon,
			external: false,
		},
		{
			label: "Contact",
			href: "/contact",
			icon: Mail,
			external: false,
		},
		{
			label: "Writing",
			href: "/writing",
			icon: BookOpenText,
			external: false,
		},
		// Add more links as needed:
		// {
		//   label: "Listen to My Music",
		//   href: "/music",
		//   icon: Music,
		//   external: false,
		// },
		// {
		//   label: "Merch Store",
		//   href: "https://merch.example.com",
		//   icon: ExternalLink,
		//   external: true,
		// },
	],

	showMailingList: true,
};
