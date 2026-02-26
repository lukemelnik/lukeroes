import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Music, Sliders } from "lucide-react";
import { AudioComparisonSection } from "@/components/audio-comparison";
import { ContactForm } from "@/components/contact-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/(nav)/work-with-me")({
	component: ProductionPageComponent,
	head: () => ({
		...seoHead({
			title: "Work With Me",
			description:
				"Hire Luke Roes for mixing, production, and consulting. Professional music production services based in Canada.",
			path: "/work-with-me",
		}),
	}),
});

interface Service {
	icon: React.ReactNode;
	title: string;
	description: string;
	price: string;
	priceNote?: string;
	features: string[];
}

const services: Service[] = [
	{
		icon: <Sliders className="h-8 w-8" />,
		title: "Mix",
		description: "Get your tracks polished and radio-ready.",
		price: "$250 - $650",
		priceNote: "depending on project track count",
		features: [
			"Unlimited revisions",
			"1 week turnaround",
			"Optional vocal tuning (extra)",
			"Optional digital master (extra)",
		],
	},
	{
		icon: <Music className="h-8 w-8" />,
		title: "Production",
		description: "Take your song from a simple idea to a full production.",
		price: "$500",
		priceNote: "per day",
		features: [
			"Professional vocal production",
			"Arrangement, composition & lyrics",
			"Guitar, bass, synth and drum programming",
			"Sound design and effects",
		],
	},
	{
		icon: <MessageSquare className="h-8 w-8" />,
		title: "Consulting",
		description: "Get feedback and direction on your productions.",
		price: "$75",
		priceNote: "per hour",
		features: [
			"Mix feedback & critique",
			"Production direction",
			"DAW optimization (Logic, Ableton)",
			"Home studio setup",
		],
	},
];

// Placeholder Spotify playlist embed URL - replace with actual playlist
// https://open.spotify.com/playlist/6ZvtmYcjQ4W5ZRQieqfaGH?si=101017387fd54aa3
const SPOTIFY_PLAYLIST_ID = "6ZvtmYcjQ4W5ZRQieqfaGH"; // placeholder

// Toggle to show/hide the "Hear the Difference" section
const SHOW_AUDIO_COMPARISON = false;

// Production comparison examples - client demo vs finished production
const productionExamples = [
	{
		title: "Artist Name - Track Title",
		beforeLabel: "Demo",
		afterLabel: "Final Production",
		beforeSrc: "/audio/production-demo-1.mp3", // placeholder
		afterSrc: "/audio/production-final-1.mp3", // placeholder
	},
	{
		title: "Artist Name - Track Title",
		beforeLabel: "Demo",
		afterLabel: "Final Production",
		beforeSrc: "/audio/production-demo-2.mp3", // placeholder
		afterSrc: "/audio/production-final-2.mp3", // placeholder
	},
];

// Mixing comparison examples - client rough mix vs final mix
const mixingExamples = [
	{
		title: "Artist Name - Track Title",
		beforeLabel: "Rough Mix",
		afterLabel: "Final Mix",
		beforeSrc: "/audio/mix-rough-1.mp3", // placeholder
		afterSrc: "/audio/mix-final-1.mp3", // placeholder
	},
	{
		title: "Artist Name - Track Title",
		beforeLabel: "Rough Mix",
		afterLabel: "Final Mix",
		beforeSrc: "/audio/mix-rough-2.mp3", // placeholder
		afterSrc: "/audio/mix-final-2.mp3", // placeholder
	},
];

function ProductionPageComponent() {
	return (
		<div className="min-h-screen w-full">
			{/* Hero Section with Studio Background */}
			<section className="relative flex min-h-[60vh] items-center">
				{/* Background Image */}
				<div
					className="absolute inset-0 bg-center bg-cover"
					style={{ backgroundImage: "url('/studio.webp')" }}
				>
					<div className="absolute inset-0 bg-linear-to-b from-background/80 to-background" />
				</div>

				{/* Content */}
				<div className="container relative mx-auto px-4 py-16 md:px-6">
					<div className="flex justify-end">
						<div className="max-w-xl text-right">
							<h1 className="mb-4 flex flex-col font-bold text-4xl md:text-6xl">
								<span>Let's Make</span>
								<span> a Record</span>
							</h1>
							<Button className="" asChild size="lg">
								<a href="#contact">Get in touch</a>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Hear the Difference Section */}
			{SHOW_AUDIO_COMPARISON && (
				<section className="px-4 py-16 md:px-6">
					<div className="container mx-auto max-w-3xl">
						<h2 className="mb-12 text-center font-bold text-3xl md:text-4xl">
							Hear the Difference
						</h2>

						<div className="space-y-12">
							{/* Production Comparisons */}
							<AudioComparisonSection
								heading="Production"
								description="Hear the transformation from initial demo to polished final production."
								examples={productionExamples}
							/>

							{/* Mixing Comparisons */}
							<AudioComparisonSection
								heading="Mixing"
								description="Compare rough mixes to the final mixed version."
								examples={mixingExamples}
							/>
						</div>
					</div>
				</section>
			)}

			{/* Pricing Section */}
			<section className="px-4 py-16 md:px-6">
				<div className="container mx-auto max-w-6xl">
					<h2 className="mb-4 text-center font-bold text-3xl md:text-4xl">
						Pricing
					</h2>
					<p className="mb-12 text-center text-muted-foreground text-sm">
						All prices are in CAD. Taxes not included.
					</p>
					<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
						{services.map((service) => (
							<Card
								key={service.title}
								className="flex h-full flex-col transition-shadow hover:shadow-lg"
							>
								<CardHeader className="pb-2 text-center">
									<div className="mx-auto mb-3 text-primary">
										{service.icon}
									</div>
									<CardTitle className="text-2xl">{service.title}</CardTitle>
									<p className="mt-2 text-muted-foreground text-sm">
										{service.description}
									</p>
								</CardHeader>
								<CardContent className="flex flex-1 flex-col">
									<div className="mb-4 text-center">
										<span className="font-bold text-3xl">{service.price}</span>
										{service.priceNote && (
											<span className="block text-muted-foreground text-sm">
												{service.priceNote}
											</span>
										)}
									</div>
									<ul className="flex-1 space-y-2 text-muted-foreground text-sm">
										{service.features.map((feature) => (
											<li key={feature} className="flex items-start gap-2">
												<span className="text-primary">-</span>
												<span>{feature}</span>
											</li>
										))}
									</ul>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Past Work / Spotify Playlist Section */}
			<section className="px-4 py-16 md:px-6">
				<div className="container mx-auto max-w-4xl">
					<h2 className="mb-8 text-center font-bold text-3xl md:text-4xl">
						Past Work
					</h2>
					<div className="overflow-hidden rounded-lg">
						<iframe
							title="Production Portfolio Playlist"
							src={`https://open.spotify.com/embed/playlist/${SPOTIFY_PLAYLIST_ID}?utm_source=generator&theme=0`}
							width="100%"
							height="450"
							allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
							loading="lazy"
							className="border-0"
						/>
					</div>
					<p className="mt-4 text-center text-muted-foreground text-sm">
						A selection of tracks I've produced, mixed, or collaborated on.
					</p>
				</div>
			</section>

			{/* Contact Section */}
			<section id="contact" className="bg-muted/30 px-4 py-16 md:px-6">
				<div className="container mx-auto max-w-xl">
					<h2 className="mb-4 text-center font-bold text-3xl md:text-4xl">
						Let's Work Together
					</h2>
					<p className="mb-8 text-center text-muted-foreground">
						Have a project in mind? Send me a message and I'll get back to you
						within 24 hours.
					</p>
					<ContactForm showProjectField />
				</div>
			</section>
		</div>
	);
}
