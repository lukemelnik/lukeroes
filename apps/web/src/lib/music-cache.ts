// Server-only module - do not import on client side
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { MusicResponse, ApiReleaseDetails } from "./music-types";

export type { MusicResponse, ApiReleaseDetails } from "./music-types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, "../../.cache");
const CACHE_FILE = join(CACHE_DIR, "music-data.json");
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheData {
  fetchedAt: string;
  expiresAt: string;
  data: MusicResponse;
}

// In-memory cache
let memoryCache: CacheData | null = null;

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function readFromFile(): CacheData | null {
  try {
    if (!existsSync(CACHE_FILE)) {
      return null;
    }
    const content = readFileSync(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(content) as Partial<CacheData>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.data ||
      !Array.isArray((parsed.data as any).releases)
    ) {
      console.warn("Cache file invalid shape; ignoring cache");
      return null;
    }
    return parsed as CacheData;
  } catch (error) {
    console.warn("Failed to read cache file:", error);
    return null;
  }
}

function writeToFile(data: CacheData): void {
  try {
    ensureCacheDir();
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.warn("Failed to write cache file:", error);
  }
}

function isExpired(cache: CacheData): boolean {
  return new Date(cache.expiresAt) < new Date();
}

function normalizeBaseUrl(raw: string): string {
  const withProtocol = /^(https?:)?\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.endsWith("/") ? withProtocol : `${withProtocol}/`;
}

async function fetchFromApi(): Promise<MusicResponse> {
  const apiUrl = process.env.SONGKEEPER_API_URL;
  const accessKey = process.env.SONGKEEPER_ACCESS_KEY;

  if (!apiUrl || !accessKey) {
    throw new Error("SongKeeper API configuration missing");
  }

  const base = normalizeBaseUrl(apiUrl);
  let url: string;
  try {
    url = new URL("releases", base).toString();
  } catch (err) {
    throw new Error(
      `Invalid SONGKEEPER_API_URL. Received: ${apiUrl}. Error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

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

function updateCache(data: MusicResponse): CacheData {
  const now = new Date();
  const cacheData: CacheData = {
    fetchedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
    data,
  };

  // Update both memory and file
  memoryCache = cacheData;
  writeToFile(cacheData);

  return cacheData;
}

export async function getMusicReleases(): Promise<MusicResponse> {
  // 1. If memory cache exists and is not expired, return it immediately
  if (memoryCache && !isExpired(memoryCache)) {
    console.log("Getting release data from cache!");
    return memoryCache.data;
  }

  // 2. Try to fetch fresh data from API
  try {
    const freshData = await fetchFromApi();
    console.log("Got data from API", freshData);
    const updatedCache = updateCache(freshData);
    return updatedCache.data;
  } catch (error) {
    console.warn("Failed to fetch from API:", error);

    // 3. API failed - fall back to file cache
    const fileCache = readFromFile();
    if (fileCache && Array.isArray(fileCache.data.apiReleases)) {
      memoryCache = fileCache;
      console.warn("Returning file cache data");
      return fileCache.data;
    }

    // 4. No cache file exists - error out
    throw new Error("No cached data available and API is unreachable");
  }
}

export async function getReleaseDetailsById(
  releaseId: string | number,
): Promise<ApiReleaseDetails | null> {
  const apiUrl = process.env.SONGKEEPER_API_URL;
  const accessKey = process.env.SONGKEEPER_ACCESS_KEY;

  if (!apiUrl || !accessKey) {
    throw new Error("SongKeeper API configuration missing");
  }

  const base = normalizeBaseUrl(apiUrl);
  let url: string;
  try {
    url = new URL(`releases/${releaseId}`, base).toString();
  } catch (err) {
    throw new Error(
      `Invalid SONGKEEPER_API_URL. Received: ${apiUrl}. Error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessKey}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const json = (await response.json()) as { release: ApiReleaseDetails };
  return json.release ?? null;
}
