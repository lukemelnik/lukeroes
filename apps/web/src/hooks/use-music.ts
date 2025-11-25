import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { getMusic } from "@/functions/get-music";
import type {
  ApiRelease,
  ApiTrack,
  ApiReleaseDetails,
  MusicResponse,
} from "@/lib/music-types";
import { createServerFn } from "@tanstack/react-start";
import z from "zod/v4";
import { getReleaseDetailsById } from "@/lib/music-cache";

export type { ApiRelease, ApiTrack, ApiReleaseDetails, MusicResponse };

export const musicQueryOptions = queryOptions<ApiRelease[] | undefined>({
  queryKey: ["music"],
  queryFn: () => getMusic(),
  staleTime: 1000 * 60 * 5, // 5 minutes on client
});

const GetReleaseInputSchema = z.object({ releaseId: z.number() });

const getReleaseDetails = createServerFn({ method: "GET" })
  .inputValidator(GetReleaseInputSchema)
  .handler(async ({ data }) => {
    const details = await getReleaseDetailsById(data.releaseId);
    if (!details) throw new Error("Release information not found");
    return details;
  });

export const releaseDetailsQueryOptions = (releaseId: number | null) =>
  queryOptions<ApiReleaseDetails | undefined>({
    queryKey: ["release", releaseId],
    queryFn: releaseId
      ? () => getReleaseDetails({ data: { releaseId } })
      : skipToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
