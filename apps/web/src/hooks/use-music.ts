import { queryOptions, skipToken } from "@tanstack/react-query";
import { getMusic } from "@/functions/get-music";
import type {
	ReleaseSummary,
	ReleaseDetail as GeneratedReleaseDetail,
} from "@/generated/songkeeper";
import { createServerFn } from "@tanstack/react-start";
import z from "zod/v4";
import { getReleaseDetailsById } from "@/lib/music-cache";

// Re-export the generated summary type
export type { ReleaseSummary };

// WORKAROUND: The deployed Songkeeper API currently uses z.unknown() for contribution
// fields (songwriters, credits, etc.), which generates 'unknown' in the OpenAPI spec.
// TanStack Start infers '{}' for these, causing type conflicts.
//
// After deploying the Songkeeper schema fix (ContributionSchema instead of z.unknown()),
// run `pnpm generate:api` and then:
// 1. Delete this Contribution type and ReleaseDetail override
// 2. Change the import to: import type { ReleaseSummary, ReleaseDetail } from "@/generated/songkeeper";
// 3. Add ReleaseDetail to the re-export
type Contribution = {
	name?: string | null;
	role?: string | null;
	contribution?: string | null;
	share?: number | null;
};

export type ReleaseDetail = Omit<GeneratedReleaseDetail, "tracks"> & {
	tracks: Array<
		Omit<GeneratedReleaseDetail["tracks"][number], "song" | "recording"> & {
			song: Omit<
				GeneratedReleaseDetail["tracks"][number]["song"],
				"songwriters"
			> & {
				songwriters?: Contribution[] | null;
			};
			recording: Omit<
				GeneratedReleaseDetail["tracks"][number]["recording"],
				"credits" | "masterOwners" | "nonFeaturedPerformers"
			> & {
				credits?: Contribution[] | null;
				masterOwners?: Contribution[] | null;
				nonFeaturedPerformers?: Contribution[] | null;
			};
		}
	>;
};

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
		return details as ReleaseDetail;
	});

export const releaseDetailsQueryOptions = (releaseId: number | null) =>
	queryOptions<ReleaseDetail | undefined>({
		queryKey: ["release", releaseId],
		queryFn: releaseId
			? () => getReleaseDetails({ data: { releaseId } })
			: skipToken,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
