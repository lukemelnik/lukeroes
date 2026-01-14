import { queryOptions, skipToken } from "@tanstack/react-query";
import { getMusic } from "@/functions/get-music";
import type {
	ReleaseSummary,
	ReleaseDetail as GeneratedReleaseDetail,
} from "@/generated/songkeeper";
import { createServerFn } from "@tanstack/react-start";
import z from "zod/v4";
import { getReleaseDetailsById } from "@/lib/music-cache";

export type { ReleaseSummary };

// WORKAROUND: Remove after deploying songkeeper/pull/254
// The .passthrough() in ContributionSchema generates [key: string]: unknown
// which conflicts with TanStack Start's type inference ({} vs unknown)
type StripIndexSignature<T> = {
	[K in keyof T as string extends K ? never : K]: T[K];
};

type CleanContribution = StripIndexSignature<
	GeneratedReleaseDetail["tracks"][number]["song"]["songwriters"][number]
>;

export type ReleaseDetail = Omit<GeneratedReleaseDetail, "tracks"> & {
	tracks: Array<
		Omit<GeneratedReleaseDetail["tracks"][number], "song" | "recording"> & {
			song: Omit<
				GeneratedReleaseDetail["tracks"][number]["song"],
				"songwriters"
			> & {
				songwriters: CleanContribution[];
			};
			recording: Omit<
				GeneratedReleaseDetail["tracks"][number]["recording"],
				"credits" | "masterOwners" | "nonFeaturedPerformers"
			> & {
				credits: CleanContribution[];
				masterOwners: CleanContribution[];
				nonFeaturedPerformers: CleanContribution[];
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
