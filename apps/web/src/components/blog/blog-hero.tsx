import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";

interface BlogHeroProps {
  title: string;
  summary: string;
  date: string;
  slug: string;
  tags?: string[];
  draft?: boolean;
  readingTime?: number;
}

export function BlogHero({
  title,
  summary,
  date,
  slug,
  tags,
  draft,
  readingTime,
}: BlogHeroProps) {
  return (
    <div className="relative rounded-xl overflow-hidden mb-8">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />

      {/* Content */}
      <div className="relative p-8 md:p-12">
        <div className="max-w-3xl">
          {draft && (
            <div className="mb-4 inline-block px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 rounded-md text-sm font-medium">
              Draft
            </div>
          )}

          <Link
            to="/blog/$slug"
            params={{ slug }}
            className="group block"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="squiggly-underline">
                {title}
              </span>
            </h1>
          </Link>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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
            <div className="flex gap-2 flex-wrap mb-4">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-muted rounded-md text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-lg text-muted-foreground mb-6">
            {summary}
          </p>

          <Link
            to="/blog/$slug"
            params={{ slug }}
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Read Article →
          </Link>
        </div>
      </div>
    </div>
  );
}
