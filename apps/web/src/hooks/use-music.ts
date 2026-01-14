import { queryOptions, skipToken } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod/v4";
import { getMusic } from "@/functions/get-music";
import type { ReleaseDetail, ReleaseSummary } from "@/generated/songkeeper";
import { getReleaseDetailsById } from "@/lib/music-cache";

export type { ReleaseSummary, ReleaseDetail };

export const musicQueryOptions = queryOptions<ReleaseSummary[] | undefined>({
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
	queryOptions<ReleaseDetail | undefined>({
		queryKey: ["release", releaseId],
		queryFn: releaseId
			? () => getReleaseDetails({ data: { releaseId } })
			: skipToken,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
