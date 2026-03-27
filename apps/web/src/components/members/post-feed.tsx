import type { FeedPost } from "@/lib/members/types";
import { AudioPostCard } from "./audio-post-card";
import { WritingPostCard } from "./writing-post-card";
import { NotePostCard } from "./note-post-card";
import { PhotoPostCard } from "./photo-post-card";

interface PostFeedProps {
  posts: FeedPost[];
  onTagClick?: (tag: string) => void;
}

export function PostFeed({ posts, onTagClick }: PostFeedProps) {
  if (posts.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>No posts found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 sm:space-y-12">
      {posts.map((post) => {
        switch (post.type) {
          case "audio":
            return <AudioPostCard key={post.id} post={post} onTagClick={onTagClick} />;
          case "writing":
            return <WritingPostCard key={post.id} post={post} onTagClick={onTagClick} />;
          case "note":
            return <NotePostCard key={post.id} post={post} onTagClick={onTagClick} />;
          case "photo":
            return <PhotoPostCard key={post.id} post={post} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
