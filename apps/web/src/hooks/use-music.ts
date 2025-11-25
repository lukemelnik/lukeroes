import {
  queryOptions,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { getMusic } from "@/functions/get-music";
import type {
  ApiRelease,
  ApiTrack,
  ApiReleaseDetails,
  MusicResponse,
} from "@/lib/music-types";
import { createServerFn } from "@tanstack/react-start";
import { musicSeedData } from "@/lib/music-seed-data";

export type { ApiRelease, ApiTrack, ApiReleaseDetails, MusicResponse };

export const musicQueryOptions = queryOptions<MusicResponse>({
  queryKey: ["music"],
  queryFn: () => getMusic(),
  staleTime: 1000 * 60 * 5, // 5 minutes on client
});

export function useMusic() {
  return useQuery(musicQueryOptions);
}

export function useMusicSuspense() {
  return useSuspenseQuery(musicQueryOptions);
}

const getReleaseDetails = createServerFn().handler(
  async (ctx): Promise<ApiReleaseDetails | null> => {
    const releaseId = (ctx as { data?: string | number | null }).data;
    if (!releaseId) {
      return null;
    }

    try {
      const { getReleaseDetailsById } = await import("@/lib/music-cache");
      const details = await getReleaseDetailsById(releaseId);
      if (details) {
        return details;
      }
    } catch (error) {
      console.warn("Falling back to seed release for details:", error);
    }

    const release = musicSeedData.find((r) => r.id === releaseId);
    return release ?? null;
  },
);

export const releaseDetailsQueryOptions = (releaseId: string | number | null) =>
  queryOptions<ApiReleaseDetails | null>({
    queryKey: ["release", releaseId],
    queryFn: async () => {
      if (!releaseId) {
        return null;
      }
      return getReleaseDetails({ data: releaseId });
    },
    enabled: !!releaseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

export function useReleaseDetails(releaseId: string | number | null) {
  return useQuery(releaseDetailsQueryOptions(releaseId));
}
