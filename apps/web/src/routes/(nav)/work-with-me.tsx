import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Sliders, MessageSquare } from "lucide-react";
import { AudioComparisonSection } from "@/components/audio-comparison";
import { ContactForm } from "@/components/contact-form";

export const Route = createFileRoute("/(nav)/work-with-me")({
  component: ProductionPageComponent,
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
    <div className="w-full min-h-screen">
      {/* Hero Section with Studio Background */}
      <section className="relative min-h-[60vh] flex items-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/studio.webp')" }}
        >
          <div className="absolute inset-0 bg-linear-to-b from- background/80 to-background" />
        </div>

        {/* Content */}
        <div className="container relative mx-auto px-4 md:px-6 py-16">
          <div className="flex justify-end">
            <div className="max-w-xl text-right">
              <h1 className="flex flex-col text-4xl md:text-6xl font-bold mb-4">
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
        <section className="py-16 px-4 md:px-6">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
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
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Pricing
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-12">
            All prices are in CAD. Taxes not included.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service.title}
                className="flex flex-col h-full hover:shadow-lg transition-shadow"
              >
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-3 text-primary">
                    {service.icon}
                  </div>
                  <CardTitle className="text-2xl">{service.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {service.description}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="text-center mb-4">
                    <span className="text-3xl font-bold">{service.price}</span>
                    {service.priceNote && (
                      <span className="text-sm text-muted-foreground block">
                        {service.priceNote}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground flex-1">
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
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Past Work
          </h2>
          <div className="rounded-lg overflow-hidden">
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
          <p className="text-center text-sm text-muted-foreground mt-4">
            A selection of tracks I've produced, mixed, or collaborated on.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto max-w-xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Let's Work Together
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Have a project in mind? Send me a message and I'll get back to you
            within 24 hours.
          </p>
          <ContactForm showProjectField />
        </div>
      </section>
    </div>
  );
}
