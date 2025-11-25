// Server-only module - do not import on client side
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { musicSeedData } from "./music-seed-data";
import type { MusicRelease } from "./music-types";

export type { MusicRelease, Track } from "./music-types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, "../../.cache");
const CACHE_FILE = join(CACHE_DIR, "music-data.json");
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheData {
  fetchedAt: string;
  expiresAt: string;
  data: MusicRelease[];
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
    return JSON.parse(content) as CacheData;
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

async function fetchFromApi(): Promise<MusicRelease[]> {
  const apiUrl = process.env.SONGKEEPER_API_URL;
  const accessKey = process.env.SONGKEEPER_ACCESS_KEY;

  if (!apiUrl || !accessKey) {
    throw new Error("SongKeeper API configuration missing");
  }

  const response = await fetch(`${apiUrl}/releases`, {
    headers: {
      Authorization: `Bearer ${accessKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

function updateCache(data: MusicRelease[]): CacheData {
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

export async function getMusicReleases(): Promise<MusicRelease[]> {
  // 1. If memory cache exists and is not expired, return it immediately
  if (memoryCache && !isExpired(memoryCache)) {
    return memoryCache.data;
  }

  // 2. If memory is empty (cold start), load from file
  if (!memoryCache) {
    const fileCache = readFromFile();
    if (fileCache) {
      memoryCache = fileCache;
      // If loaded cache is still valid, return it
      if (!isExpired(fileCache)) {
        return fileCache.data;
      }
    }
  }

  // 3. Cache is expired or doesn't exist - try to fetch from API
  try {
    const freshData = await fetchFromApi();
    const updatedCache = updateCache(freshData);
    return updatedCache.data;
  } catch (error) {
    console.warn("Failed to fetch from API:", error);

    // 4. API failed - return stale cache if we have it
    if (memoryCache) {
      console.warn("Returning stale cache data");
      return memoryCache.data;
    }

    // 5. No cache at all - fall back to seed data
    console.warn("No cache available, returning seed data");
    return musicSeedData;
  }
}
