import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface PostCardProps {
  title: string;
  summary: string;
  date: string;
  slug: string;
  tags?: string[];
  draft?: boolean;
  readingTime?: number;
  variant?: "default" | "featured";
}

export function PostCard({
  title,
  summary,
  date,
  slug,
  tags,
  draft,
  readingTime,
  variant = "default",
}: PostCardProps) {
  const isFeatured = variant === "featured";

  return (
    <Card
      className={`group transition-all duration-300 hover:shadow-md ${
        isFeatured ? "border-2 border-primary/20" : ""
      }`}
    >
      <CardHeader>
        <Link to="/writing/$slug" params={{ slug }} className="block">
          <h2
            className={`font-bold mb-2 ${isFeatured ? "text-3xl" : "text-2xl"}`}
          >
            <span className="squiggly-underline">{title}</span>
            {draft && (
              <span className="ml-2 text-sm text-muted-foreground">
                (Draft)
              </span>
            )}
          </h2>
        </Link>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-muted rounded-md text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <p className="text-muted-foreground mb-4">{summary}</p>

        <Link
          to="/writing/$slug"
          params={{ slug }}
          className="inline-block text-sm font-medium hover:underline"
        >
          Read more →
        </Link>
      </CardContent>
    </Card>
  );
}
