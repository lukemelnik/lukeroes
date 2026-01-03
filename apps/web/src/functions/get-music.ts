import { createServerFn } from "@tanstack/react-start";
import type { ApiRelease, MusicResponse } from "@/lib/music-types";
import { musicSeedData } from "@/lib/music-seed-data";

export type { ApiRelease } from "@/lib/music-types";

const SHOW_SEED = false;

export const getMusic = createServerFn().handler(
  async (): Promise<ApiRelease[] | undefined> => {
    // Dynamic import to ensure Node.js modules only load on server
    const { getMusicReleases } = await import("@/lib/music-cache");
    try {
      const data = await getMusicReleases();

      if (SHOW_SEED) {
        return [...musicSeedData, ...data?.apiReleases];
      }

      return data.apiReleases;
    } catch (e) {
      console.warn("Music API unavailable, returning empty array:", e);
      return [];
    }
  },
);
