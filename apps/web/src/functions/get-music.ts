import { createServerFn } from "@tanstack/react-start";
import type { MusicResponse } from "@/lib/music-types";
import { musicSeedData } from "@/lib/music-seed-data";

export type { ApiRelease } from "@/lib/music-types";

const SHOW_SEED = true;

export const getMusic = createServerFn().handler(
  async (): Promise<MusicResponse> => {
    // Dynamic import to ensure Node.js modules only load on server
    const { getMusicReleases } = await import("@/lib/music-cache");
    try {
      const data = await getMusicReleases();

      if (SHOW_SEED) {
        return [...musicSeedData, ...data?.apiReleases];
      }

      return data;
    } catch (e) {
      console.warn("Music API unavailable, using seed data instead:", e);
      return { releases: SHOW_SEED ? musicSeedData : [] };
    }
  },
);
