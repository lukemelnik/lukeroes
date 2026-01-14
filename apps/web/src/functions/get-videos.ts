import { createServerFn } from "@tanstack/react-start";

export interface ApiVideo {
	id: string;
	title: string;
	description: string | null;
	publishedAt: string | null;
	youtubeId: string;
	thumbnailUrl: string;
}

interface YouTubeThumbnail {
	url?: string;
}

interface YouTubePlaylistItem {
	id?: string;
	snippet?: {
		title?: string;
		description?: string;
		publishedAt?: string;
		resourceId?: { videoId?: string };
		thumbnails?: {
			maxres?: YouTubeThumbnail;
			standard?: YouTubeThumbnail;
			high?: YouTubeThumbnail;
			medium?: YouTubeThumbnail;
			default?: YouTubeThumbnail;
		};
	};
	contentDetails?: {
		videoId?: string;
	};
}

function getBestThumbnail(item: YouTubePlaylistItem): string | null {
	const thumbnails =
		item.snippet?.thumbnails && Object.values(item.snippet.thumbnails);
	if (!thumbnails || thumbnails.length === 0) return null;

	const preferredOrder = [
		"maxres",
		"standard",
		"high",
		"medium",
		"default",
	] as const;
	for (const key of preferredOrder) {
		const maybeThumb = item.snippet?.thumbnails?.[key];
		if (maybeThumb?.url) return maybeThumb.url;
	}

	return thumbnails.find((t) => t?.url)?.url ?? null;
}

function getVideoId(item: YouTubePlaylistItem): string | null {
	return (
		item.snippet?.resourceId?.videoId ?? item.contentDetails?.videoId ?? null
	);
}

async function fetchPlaylistVideos(): Promise<ApiVideo[]> {
	const apiKey = process.env.YOUTUBE_API_KEY;
	const playlistId = process.env.YOUTUBE_PLAYLIST_ID;

	if (!apiKey || !playlistId) {
		throw new Error(
			"Missing YouTube API configuration. Please set YOUTUBE_API_KEY and YOUTUBE_PLAYLIST_ID.",
		);
	}

	const params = new URLSearchParams({
		part: "snippet,contentDetails",
		playlistId,
		maxResults: "20",
		key: apiKey,
	});

	const response = await fetch(
		`https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`,
	);

	if (!response.ok) {
		throw new Error(`YouTube API request failed: ${response.status}`);
	}

	const json = (await response.json()) as {
		items?: YouTubePlaylistItem[];
	};

	const items = json.items ?? [];

	return items
		.map((item) => {
			const youtubeId = getVideoId(item);
			if (!youtubeId) return null;

			return {
				id: item.id ?? youtubeId,
				youtubeId,
				title: item.snippet?.title ?? "Untitled video",
				description: item.snippet?.description ?? null,
				publishedAt: item.snippet?.publishedAt ?? null,
				thumbnailUrl:
					getBestThumbnail(item) ??
					`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
			} satisfies ApiVideo;
		})
		.filter(Boolean) as ApiVideo[];
}

export const getVideos = createServerFn().handler(fetchPlaylistVideos);
