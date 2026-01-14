import { queryOptions, useQuery } from "@tanstack/react-query";
import { type ApiVideo, getVideos } from "@/functions/get-videos";

export type { ApiVideo };

export const videosQueryOptions = queryOptions<ApiVideo[]>({
	queryKey: ["videos"],
	queryFn: () => getVideos(),
});

export function useVideos() {
	return useQuery(videosQueryOptions);
}
