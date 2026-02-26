import { createFileRoute } from "@tanstack/react-router";
import HeroSection from "@/components/sections/hero-section";
import MailingListSection from "@/components/sections/mailing-list-section";
import MusicSection from "@/components/sections/music-section";
import TourSection from "@/components/sections/tour-section";
import VideosSection from "@/components/sections/videos-section";
import { musicQueryOptions } from "@/hooks/use-music";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/(nav)/")({
	component: HomeComponent,
	head: () => ({
		...seoHead({
			description:
				"Luke Roes — artist, producer, and mixer based in Canada. Listen to the latest music, watch videos, and book production services.",
			path: "/",
		}),
	}),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(musicQueryOptions),
});

function HomeComponent() {
	return (
		<div className="w-full bg-background">
			<HeroSection />
			<MusicSection />
			<VideosSection />
			<TourSection />
			<MailingListSection />
		</div>
	);
}
