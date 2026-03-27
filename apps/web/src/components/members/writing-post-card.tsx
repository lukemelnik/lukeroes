import { BookOpen, Feather } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMembership } from "@/lib/members/membership-context";
import type { FeedPost } from "@/lib/members/types";
import { MembershipGate } from "./membership-gate";
import { PostDate } from "./post-date";
import { PostTags } from "./post-tags";

interface WritingPostCardProps {
  post: FeedPost;
  onTagClick?: (tag: string) => void;
}

export function WritingPostCard({ post, onTagClick }: WritingPostCardProps) {
  const { isMember } = useMembership();
  const locked = post.visibility === "members" && !isMember;
  const isPoetry = post.format === "poetry";
  const Icon = isPoetry ? Feather : BookOpen;

  return (
    <article className="group relative">
      {/* Label + date header */}
      <div className="mb-3 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        <Icon className="size-3.5" />
        <span>{isPoetry ? "Poetry" : post.readingTime}</span>
        <span className="text-border">&middot;</span>
        <PostDate date={post.publishedAt ?? post.createdAt} />
      </div>

      {/* Content */}
      <div className="relative">
        <h3 className="font-heading text-xl leading-tight sm:text-2xl">
          {locked ? (
            post.title
          ) : (
            <Link
              to="/members/post/$slug"
              params={{ slug: post.slug }}
              className="transition-colors hover:text-primary"
            >
              {post.title}
            </Link>
          )}
        </h3>

        {isPoetry ? (
          <p className="mt-3 italic leading-relaxed text-foreground/80">{post.excerpt}</p>
        ) : (
          <p className="mt-3 leading-relaxed text-foreground/80">{post.excerpt}</p>
        )}

        {locked ? (
          <div className="mt-4">
            <MembershipGate variant="block" />
          </div>
        ) : (
          <Link
            to="/members/post/$slug"
            params={{ slug: post.slug }}
            className="mt-4 inline-flex items-center gap-1.5 font-medium text-primary text-sm transition-colors hover:text-primary/80"
          >
            {isPoetry ? "Read full poem" : "Continue reading"}
            <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </Link>
        )}
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <PostTags tags={post.tags.map((t) => t.name)} onTagClick={onTagClick} className="mt-3" />
      )}
    </article>
  );
}
