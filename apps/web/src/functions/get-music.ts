import { createServerFn } from "@tanstack/react-start";
import type { MusicRelease } from "@/lib/music-types";

export type { MusicRelease };

export const getMusic = createServerFn({ method: "GET" }).handler(
  async (): Promise<MusicRelease[]> => {
    // Dynamic import to ensure Node.js modules only load on server
    const { getMusicReleases } = await import("@/lib/music-cache");
    return getMusicReleases();
  },
);
