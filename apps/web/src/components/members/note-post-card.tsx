import { useMembership } from "@/lib/members/membership-context";
import type { FeedPost } from "@/lib/members/types";
import { MembershipGate } from "./membership-gate";
import { PostDate } from "./post-date";
import { PostTags } from "./post-tags";

interface NotePostCardProps {
  post: FeedPost;
  onTagClick?: (tag: string) => void;
}

export function NotePostCard({ post, onTagClick }: NotePostCardProps) {
  const { isMember } = useMembership();
  const locked = post.visibility === "members" && !isMember;
  const content = post.content ?? "";

  return (
    <article className="group relative">
      {/* Date */}
      <div className="mb-3 text-muted-foreground text-xs uppercase tracking-wider">
        <PostDate date={post.publishedAt ?? post.createdAt} />
      </div>

      {/* Content with left accent border */}
      <div className="relative border-l-2 border-border pl-4">
        {locked ? (
          <>
            <p className="leading-relaxed text-foreground/80">{content.slice(0, 80)}...</p>
            <div className="mt-3">
              <MembershipGate variant="inline" />
            </div>
          </>
        ) : (
          <p className="leading-relaxed text-foreground/80">{content}</p>
        )}
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <PostTags tags={post.tags.map((t) => t.name)} onTagClick={onTagClick} className="mt-3" />
      )}
    </article>
  );
}
