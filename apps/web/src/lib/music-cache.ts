// Server-only module - do not import on client side
import type {
	ReleaseSummary,
	ReleaseDetail,
	ReleasesResponse,
	ReleaseResponse,
} from "@/generated/songkeeper";

export type { ReleaseSummary, ReleaseDetail };

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

const cache = {
	releases: null as CacheEntry<ReleaseSummary[]> | null,
	releaseDetails: new Map<number, CacheEntry<ReleaseDetail>>(),
};

function isExpired<T>(entry: CacheEntry<T> | null | undefined): boolean {
	return !entry || Date.now() > entry.expiresAt;
}

function createEntry<T>(data: T): CacheEntry<T> {
	return { data, expiresAt: Date.now() + CACHE_TTL_MS };
}

function normalizeBaseUrl(raw: string): string {
	const withProtocol = /^(https?:)?\/\//i.test(raw) ? raw : `https://${raw}`;
	return withProtocol.endsWith("/") ? withProtocol : `${withProtocol}/`;
}

async function fetchReleases(): Promise<ReleasesResponse> {
	const apiUrl = process.env.SONGKEEPER_API_URL;
	const accessKey = process.env.SONGKEEPER_ACCESS_KEY;

	if (!apiUrl || !accessKey) {
		throw new Error("SongKeeper API configuration missing");
	}

	const base = normalizeBaseUrl(apiUrl);
	const url = new URL("releases", base).toString();

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessKey}`,
		},
	});

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`);
	}

	return response.json();
}

async function fetchReleaseDetails(
	releaseId: number,
): Promise<ReleaseResponse> {
	const apiUrl = process.env.SONGKEEPER_API_URL;
	const accessKey = process.env.SONGKEEPER_ACCESS_KEY;

	if (!apiUrl || !accessKey) {
		throw new Error("SongKeeper API configuration missing");
	}

	const base = normalizeBaseUrl(apiUrl);
	const url = new URL(`releases/${releaseId}`, base).toString();

	const response = await fetch(url, {
		headers: {
			Authorization: `Bearer ${accessKey}`,
		},
	});

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`);
	}

	return response.json();
}

export async function getMusicReleases(): Promise<ReleasesResponse> {
	if (!isExpired(cache.releases) && cache.releases) {
		console.log("Getting release data from cache!");
		return { releases: cache.releases.data };
	}

	const data = await fetchReleases();
	console.log("Got data from API", data);
	cache.releases = createEntry(data.releases);

	return data;
}

export async function getReleaseDetailsById(
	releaseId: number,
): Promise<ReleaseDetail | undefined> {
	const cached = cache.releaseDetails.get(releaseId);
	if (!isExpired(cached) && cached) {
		console.log(`Getting release ${releaseId} details from cache!`);
		return cached.data;
	}

	try {
		const data = await fetchReleaseDetails(releaseId);
		console.log(`Got release ${releaseId} details from API`);
		cache.releaseDetails.set(releaseId, createEntry(data.release));
		return data.release;
	} catch (error) {
		if (error instanceof Error && error.message.includes("404")) {
			return undefined;
		}
		throw error;
	}
}
