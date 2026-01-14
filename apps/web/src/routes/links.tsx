import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Mail } from "lucide-react";
import { useState } from "react";
import { ArtworkImage } from "@/components/artwork-image";
import { AppleMusicIcon } from "@/components/icons/apple-music-icon";
import { SpotifyIcon } from "@/components/icons/spotify-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { musicQueryOptions } from "@/hooks/use-music";
import { linksConfig } from "@/lib/links-config";
import { siteConfig } from "@/lib/site-config";

export const Route = createFileRoute("/links")({
	component: LinksPage,
});

function LinksPage() {
	const { profile, links, showMailingList } = linksConfig;
	const { data: releases } = useQuery(musicQueryOptions);
	const featuredRelease = releases?.[0];

	const streamingLinks = featuredRelease
		? [
				{
					href: featuredRelease.streamingLinks?.spotify,
					icon: SpotifyIcon,
					label: "Spotify",
				},
				{
					href: featuredRelease.streamingLinks?.appleMusic,
					icon: AppleMusicIcon,
					label: "Apple Music",
				},
				{
					href: featuredRelease.streamingLinks?.youtube,
					icon: YoutubeIcon,
					label: "YouTube",
				},
			].filter(
				(
					link,
				): link is { href: string; icon: typeof SpotifyIcon; label: string } =>
					!!link.href,
			)
		: [];

	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		// TODO: Implement mailing list subscription
		await new Promise((resolve) => setTimeout(resolve, 1000));
		setEmail("");
		setIsSubmitting(false);
	};

	// Filter socials that have URLs
	const activeSocials = siteConfig.socials.filter((social) => social.href);

	return (
		<div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
			<div className="w-full max-w-md space-y-8">
				{/* Profile Section */}
				<div className="flex flex-col items-center space-y-4 text-center">
					<Link to="/" className="group">
						<div className="h-24 w-24 overflow-hidden rounded-full border-2 border-primary/50 transition-colors group-hover:border-primary">
							<img
								src={profile.image}
								alt={profile.name}
								className="h-full w-full object-cover"
								onError={(e) => {
									// Fallback to initials if image fails to load
									const target = e.target as HTMLImageElement;
									target.style.display = "none";
									target.parentElement!.innerHTML = `<div class="w-full h-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">${profile.name
										.split(" ")
										.map((n) => n[0])
										.join("")}</div>`;
								}}
							/>
						</div>
					</Link>
					<div>
						<h1 className="font-bold text-xl">{profile.name}</h1>
						<p className="text-muted-foreground text-sm">{profile.tagline}</p>
					</div>
				</div>

				{/* Featured Release */}
				{featuredRelease && (
					<div className="rounded-lg border border-border bg-card p-4">
						<div className="flex items-center gap-4">
							<div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
								<ArtworkImage
									src={featuredRelease.artworkPublicUrl ?? undefined}
									alt={featuredRelease.title}
									className="h-full w-full object-cover"
								/>
							</div>
							<div className="flex flex-col justify-center space-y-2">
								<div className="flex items-start justify-between gap-2">
									<h2 className="font-semibold">{featuredRelease.title}</h2>
									<span className="rounded bg-primary px-1.5 py-0.5 font-semibold text-[10px] text-primary-foreground uppercase tracking-widest">
										New {featuredRelease.type}
									</span>
								</div>
								{streamingLinks.length > 0 && (
									<div className="flex gap-2">
										{streamingLinks.map(({ href, icon: Icon, label }) => (
											<a
												key={label}
												href={href}
												target="_blank"
												rel="noopener noreferrer"
												className="rounded-full bg-muted p-1.5 transition-colors hover:bg-muted/80"
											>
												<Icon size={18} />
												<span className="sr-only">{label}</span>
											</a>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Link Buttons */}
				<div className="space-y-3">
					{links.map((link) => {
						const Icon = link.icon;
						const isExternal = link.external;

						if (isExternal) {
							return (
								<a
									key={link.href}
									href={link.href}
									target="_blank"
									rel="noopener noreferrer"
									className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 font-medium transition-all hover:border-primary/50 hover:bg-accent"
								>
									<Icon className="size-4" />
									<span>{link.label}</span>
									<ExternalLink className="ml-auto h-4 w-4 opacity-50" />
								</a>
							);
						}

						return (
							<Link
								key={link.href}
								to={link.href}
								className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 font-medium transition-all hover:border-primary/50 hover:bg-accent"
							>
								<Icon className="size-4" />
								<span className="mt-0.75">{link.label}</span>
							</Link>
						);
					})}
				</div>

				{/* Social Icons */}
				{activeSocials.length > 0 && (
					<div className="flex justify-center gap-3 pt-4">
						{activeSocials.map((social) => {
							const Icon = social.icon;
							return (
								<a
									key={social.key}
									href={social.href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={social.label}
									className="rounded-full border border-border bg-card p-2.5 transition-all hover:border-primary/50 hover:bg-accent"
								>
									<Icon size={20} />
								</a>
							);
						})}
					</div>
				)}

				{/* Mailing List */}
				{showMailingList && (
					<div className="border-border border-t pt-6">
						<div className="space-y-4 text-center">
							<div className="flex items-center justify-center gap-2 text-muted-foreground">
								<Mail className="h-4 w-4" />
								<span className="font-medium text-sm">Stay in the loop</span>
							</div>
							<form onSubmit={handleSubmit} className="flex gap-2">
								<Input
									type="email"
									placeholder="Enter your email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="flex-1"
								/>
								<Button type="submit" disabled={isSubmitting} size="default">
									{isSubmitting ? "..." : "Join"}
								</Button>
							</form>
						</div>
					</div>
				)}

				{/* Footer */}
				<div className="pt-4 text-center">
					<Link
						to="/"
						className="text-muted-foreground text-xs transition-colors hover:text-foreground"
					>
						lukeroes.com
					</Link>
				</div>
			</div>
		</div>
	);
}
