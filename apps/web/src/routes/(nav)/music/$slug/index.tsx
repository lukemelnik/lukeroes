import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { musicQueryOptions, type ReleaseSummary } from "@/hooks/use-music";
import { slugify } from "@/lib/slugify";

export const Route = createFileRoute("/(nav)/music/$slug/")({
	beforeLoad: async ({ params, context }) => {
		await context.queryClient.prefetchQuery(musicQueryOptions);
		const releases = context.queryClient.getQueryData<ReleaseSummary[]>(
			musicQueryOptions.queryKey,
		);

		const match = releases?.find((r) => slugify(r.title) === params.slug);
		if (!match?.tracks?.length) {
			throw notFound();
		}

		const firstTrack = match.tracks[0];
		throw redirect({
			to: "/music/$slug/$track",
			params: {
				slug: params.slug,
				track: slugify(firstTrack.title ?? ""),
			},
			replace: true,
		});
	},
});
