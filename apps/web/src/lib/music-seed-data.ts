import type { ReleaseSummary } from "@/generated/songkeeper";

// Seed data used when cache is empty and API is unavailable
// This ensures the app works even without API configuration
export const musicSeedData: ReleaseSummary[] = [
	{
		id: 2234234,
		title: "Latest Single",
		artist: "Luke Roes",
		type: "single",
		releaseDate: "2024-01-01",
		upc: "000000000001",
		catalogNumber: "LR-001",
		status: "published",
		artworkFileKey: "https://placehold.co/400x400/1a1a1a/white?text=Single",
		artworkOptimizedFileKey:
			"https://placehold.co/400x400/1a1a1a/white?text=Single",
		artworkPublicUrl: "https://placehold.co/400x400/1a1a1a/white?text=Single",
		artworkOptimizedPublicUrl:
			"https://placehold.co/400x400/1a1a1a/white?text=Single",
		streamingLinks: {
			spotify: "https://open.spotify.com",
			appleMusic: "https://music.apple.com",
			youtube: "https://youtube.com",
			soundcloud: "",
			bandcamp: "",
		},
		tracks: [
			{
				id: 1001,
				trackNumber: 1,
				title: "Latest Single",
				artist: "Luke Roes",
				duration: 210000,
				isrc: "US-TEST-00001",
			},
		],
	},
	{
		id: 3453452,
		title: "Debut Album",
		artist: "Luke Roes",
		type: "album",
		releaseDate: "2023-01-01",
		upc: "000000000002",
		catalogNumber: "LR-002",
		status: "published",
		artworkFileKey: "https://placehold.co/400x400/2a2a2a/white?text=Album",
		artworkOptimizedFileKey:
			"https://placehold.co/400x400/2a2a2a/white?text=Album",
		artworkPublicUrl: "https://placehold.co/400x400/2a2a2a/white?text=Album",
		artworkOptimizedPublicUrl:
			"https://placehold.co/400x400/2a2a2a/white?text=Album",
		streamingLinks: {
			spotify: "https://open.spotify.com",
			appleMusic: "https://music.apple.com",
			youtube: "",
			soundcloud: "",
			bandcamp: "",
		},
		tracks: [
			{
				id: 2001,
				trackNumber: 1,
				title: "Opening Track",
				artist: "Luke Roes",
				duration: 180000,
				isrc: "",
			},
			{
				id: 2002,
				trackNumber: 2,
				title: "Second Song",
				artist: "Luke Roes",
				duration: 200000,
				isrc: "",
			},
			{
				id: 2003,
				trackNumber: 3,
				title: "Interlude",
				artist: "Luke Roes",
				duration: 90000,
				isrc: "",
			},
			{
				id: 2004,
				trackNumber: 4,
				title: "Best Track",
				artist: "Luke Roes",
				duration: 240000,
				isrc: "",
			},
		],
	},
	{
		id: 433,
		title: "Summer EP",
		artist: "Luke Roes",
		type: "ep",
		releaseDate: "2023-06-01",
		upc: "000000000003",
		catalogNumber: "LR-003",
		status: "published",
		artworkFileKey: "https://placehold.co/400x400/3a3a3a/white?text=EP",
		artworkOptimizedFileKey:
			"https://placehold.co/400x400/3a3a3a/white?text=EP",
		artworkPublicUrl: "https://placehold.co/400x400/3a3a3a/white?text=EP",
		artworkOptimizedPublicUrl:
			"https://placehold.co/400x400/3a3a3a/white?text=EP",
		streamingLinks: {
			spotify: "",
			appleMusic: "",
			youtube: "https://youtube.com",
			soundcloud: "",
			bandcamp: "",
		},
		tracks: [
			{
				id: 3001,
				trackNumber: 1,
				title: "Summer Vibes",
				artist: "Luke Roes",
				duration: 195000,
				isrc: "",
			},
			{
				id: 3002,
				trackNumber: 2,
				title: "Beach Day",
				artist: "Luke Roes",
				duration: 210000,
				isrc: "",
			},
			{
				id: 3003,
				trackNumber: 3,
				title: "Sunset Drive",
				artist: "Luke Roes",
				duration: 220000,
				isrc: "",
			},
		],
	},
];
