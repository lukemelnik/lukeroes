import { createFileRoute } from "@tanstack/react-router";
import TourSection from "@/components/sections/tour-section";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/(nav)/tour")({
	component: RouteComponent,
	head: () => ({
		...seoHead({
			title: "Tour",
			description:
				"Upcoming and past live shows and tour dates for Luke Roes.",
			path: "/tour",
		}),
	}),
});

function RouteComponent() {
	return (
		<div>
			<TourSection showPastDates={false} />
		</div>
	);
}
