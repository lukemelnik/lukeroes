import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";

interface WritingHeroProps {
	title: string;
	summary: string;
	date: string;
	slug: string;
	tags?: string[];
	draft?: boolean;
	readingTime?: number;
}

export function WritingHero({
	title,
	summary,
	date,
	slug,
	tags,
	draft,
	readingTime,
}: WritingHeroProps) {
	return (
		<div className="relative mb-8 overflow-hidden rounded-xl">
			{/* Gradient background */}
			<div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />

			{/* Content */}
			<div className="relative p-8 md:p-12">
				<div className="max-w-3xl">
					{draft && (
						<div className="mb-4 inline-block rounded-md bg-yellow-100 px-3 py-1 font-medium text-sm text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100">
							Draft
						</div>
					)}

					<Link to="/writing/$slug" params={{ slug }} className="group block">
						<h1 className="mb-4 font-bold text-4xl md:text-5xl">
							<span className="squiggly-underline">{title}</span>
						</h1>
					</Link>

					<div className="mb-4 flex items-center gap-4 text-muted-foreground text-sm">
						<time dateTime={date}>
							{new Date(date).toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</time>
						{readingTime && (
							<div className="flex items-center gap-1">
								<Clock className="size-4" />
								<span>{readingTime} min read</span>
							</div>
						)}
					</div>

					{tags && tags.length > 0 && (
						<div className="mb-4 flex flex-wrap gap-2">
							{tags.map((tag) => (
								<span
									key={tag}
									className="rounded-md bg-muted px-3 py-1 text-sm"
								>
									{tag}
								</span>
							))}
						</div>
					)}

					<p className="mb-6 text-lg text-muted-foreground">{summary}</p>

					<Link
						to="/writing/$slug"
						params={{ slug }}
						className="inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Read Article →
					</Link>
				</div>
			</div>
		</div>
	);
}
