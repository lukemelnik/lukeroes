import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { getMusic } from "@/functions/get-music";
import type { MusicRelease, Track } from "@/lib/music-types";

export type { MusicRelease, Track };

export const musicQueryOptions = queryOptions({
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
