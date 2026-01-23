// Server-only module - do not import on client side
import type {
	ReleaseDetail,
	ReleaseResponse,
	ReleaseSummary,
	ReleasesResponse,
} from "@/generated/songkeeper";
import { CACHE_TTL_MS } from "./constants";

export type { ReleaseSummary, ReleaseDetail };

const MAX_RELEASE_DETAILS_CACHE_SIZE = 100;

class NotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NotFoundError";
	}
}

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

function evictExpiredEntries(): void {
	const now = Date.now();
	for (const [key, entry] of cache.releaseDetails) {
		if (now > entry.expiresAt) {
			cache.releaseDetails.delete(key);
		}
	}
}

function evictOldestIfNeeded(): void {
	if (cache.releaseDetails.size < MAX_RELEASE_DETAILS_CACHE_SIZE) {
		return;
	}

	// First try to evict expired entries
	evictExpiredEntries();

	// If still over limit, evict oldest entry (first inserted)
	if (cache.releaseDetails.size >= MAX_RELEASE_DETAILS_CACHE_SIZE) {
		const firstKey = cache.releaseDetails.keys().next().value;
		if (firstKey !== undefined) {
			cache.releaseDetails.delete(firstKey);
		}
	}
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

	if (response.status === 404) {
		throw new NotFoundError(`Release ${releaseId} not found`);
	}

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status}`);
	}

	return response.json();
}

export async function getMusicReleases(): Promise<ReleasesResponse> {
	if (!isExpired(cache.releases) && cache.releases) {
		return { releases: cache.releases.data };
	}

	const data = await fetchReleases();
	cache.releases = createEntry(data.releases);

	return data;
}

export async function getReleaseDetailsById(
	releaseId: number,
): Promise<ReleaseDetail | undefined> {
	const cached = cache.releaseDetails.get(releaseId);
	if (!isExpired(cached) && cached) {
		return cached.data;
	}

	try {
		const data = await fetchReleaseDetails(releaseId);
		evictOldestIfNeeded();
		cache.releaseDetails.set(releaseId, createEntry(data.release));
		return data.release;
	} catch (error) {
		if (error instanceof NotFoundError) {
			return undefined;
		}
		throw error;
	}
}
