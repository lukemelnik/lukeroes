import { useQuery } from "@tanstack/react-query";
import { musicQueryOptions } from "@/hooks/use-music";
import { ArtworkImage } from "../artwork-image";
import { AppleMusicIcon } from "../icons/apple-music-icon";
import { SpotifyIcon } from "../icons/spotify-icon";
import { YoutubeIcon } from "../icons/youtube-icon";
import { Button } from "../ui/button";

export default function HeroSection() {
	const { data: releases } = useQuery(musicQueryOptions);
	const mostRecentRelease = releases?.[0];

	const TITLE_LENGTH_THRESHOLD = 12;
	const titleIsLong =
		(mostRecentRelease?.title.length ?? 0) > TITLE_LENGTH_THRESHOLD;

	const streamingLinks = mostRecentRelease
		? [
				{
					href: mostRecentRelease.streamingLinks?.spotify,
					icon: SpotifyIcon,
					label: "Spotify",
				},
				{
					href: mostRecentRelease.streamingLinks?.appleMusic,
					icon: AppleMusicIcon,
					label: "Apple Music",
				},
				{
					href: mostRecentRelease.streamingLinks?.youtube,
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

	return (
		<section className="-mt-[72px] relative h-dvh w-full overflow-hidden">
			{/* Background Image */}
			<div
				className="absolute inset-0 bg-center bg-cover bg-no-repeat"
				style={{
					backgroundImage: "url('/bg-desktop-dirty.webp')",
				}}
			>
				{/* Gradient Overlay */}
				<div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/5" />
			</div>
			{/* Content */}
			<div className="relative flex h-full items-end px-4 pb-10 sm:pb-20">
				{mostRecentRelease && (
					<div className="flex w-full max-w-4xl flex-col items-center">
						{/* New Release Label */}
						<p className="animate-bounce text-center font-bold text-foreground text-sm uppercase tracking-wider sm:text-lg">
							New {mostRecentRelease.type.toUpperCase()} Out Now
						</p>

						{/* Artwork and Title/Links */}
						<div className="flex w-full items-center justify-center gap-4 md:gap-8">
							{/* Album Artwork */}
							<div className="aspect-square w-22 shrink-0 md:w-32">
								<ArtworkImage
									src={mostRecentRelease.artworkPublicUrl ?? undefined}
									alt={mostRecentRelease.title}
									className="h-full w-full rounded-lg object-cover shadow-2xl"
								/>
							</div>

							{/* Title and Streaming Links */}
							<div className="flex flex-col justify-center">
								<h1
									className={`font-bold tracking-tight ${titleIsLong ? "mb-1 text-xl md:mb-2 md:text-5xl" : "text-2xl md:text-6xl"}`}
								>
									{mostRecentRelease.title}
								</h1>

								{/* Streaming Links */}
								{streamingLinks.length > 0 && (
									<div className="flex items-center gap-4">
										{streamingLinks.map(({ href, icon: Icon, label }) => (
											<Button
												key={label}
												variant="default"
												asChild
												className="rounded-full bg-primary/55 p-4 text-background backdrop-blur-md transition-all duration-500 hover:bg-foreground md:px-6 md:py-3"
											>
												<a
													href={href}
													className="rounded-full py-4 sm:p-6"
													target="_blank"
													rel="noopener noreferrer"
												>
													<Icon className="size-5 sm:size-6" />
													<span className="hidden md:inline">{label}</span>
												</a>
											</Button>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</section>
	);
}
