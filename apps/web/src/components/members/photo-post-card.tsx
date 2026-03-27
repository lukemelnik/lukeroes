import { Camera } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMembership } from "@/lib/members/membership-context";
import type { FeedPost } from "@/lib/members/types";
import { getPostImages } from "@/lib/members/types";
import { MembershipGate } from "./membership-gate";
import { PostDate } from "./post-date";
import { PostTags } from "./post-tags";

interface PhotoPostCardProps {
  post: FeedPost;
}

export function PhotoPostCard({ post }: PhotoPostCardProps) {
  const { isMember } = useMembership();
  const locked = post.visibility === "members" && !isMember;
  const images = getPostImages(post);
  const imageCount = images.length;
  const isSingle = imageCount === 1;
  const caption = post.excerpt ?? post.content;

  return (
    <article className="group relative">
      {/* Label + date header */}
      <div className="mb-3 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        <Camera className="size-3.5" />
        <span>
          {imageCount} {imageCount === 1 ? "photo" : "photos"}
        </span>
        <span className="text-border">&middot;</span>
        <PostDate date={post.publishedAt ?? post.createdAt} />
      </div>

      {/* Caption */}
      {caption && (
        <p className="mb-3 leading-relaxed text-foreground/80">
          {locked ? `${caption.slice(0, 60)}...` : caption}
        </p>
      )}

      {/* Images */}
      {locked ? (
        <div className="relative overflow-hidden rounded-lg">
          <div className="aspect-video bg-muted/50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <MembershipGate variant="inline" />
          </div>
        </div>
      ) : (
        <Link to="/members/post/$slug" params={{ slug: post.slug }} className="block">
          {isSingle ? (
            <div className="overflow-hidden rounded-lg">
              <img
                src={images[0].url}
                alt={images[0].alt}
                className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
              {images.slice(0, 4).map((image, i) => (
                <div key={image.url} className="relative">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                  {i === 3 && imageCount > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 font-medium text-lg text-white">
                      +{imageCount - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Link>
      )}

      {/* Tags */}
      {post.tags.length > 0 && <PostTags tags={post.tags.map((t) => t.name)} className="mt-3" />}
    </article>
  );
}
