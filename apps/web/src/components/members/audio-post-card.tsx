import { Mic, Music, Play, Pause, Radio, Headphones } from "lucide-react";
import { useAudioPlayer } from "@/lib/members/audio-player-context";
import { useMembership } from "@/lib/members/membership-context";
import type { FeedPost } from "@/lib/members/types";
import { AUDIO_LABEL_DISPLAY, getAudioDuration, getAudioUrl } from "@/lib/members/types";
import { MembershipGate } from "./membership-gate";
import { PostDate } from "./post-date";
import { PostTags } from "./post-tags";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const LABEL_ICONS: Record<string, typeof Mic> = {
  "voice-memo": Mic,
  demo: Music,
  "early-listen": Headphones,
  "studio-session": Radio,
};

interface AudioPostCardProps {
  post: FeedPost;
  onTagClick?: (tag: string) => void;
}

export function AudioPostCard({ post, onTagClick }: AudioPostCardProps) {
  const { isMember } = useMembership();
  const player = useAudioPlayer();
  const isCurrentTrack = player.currentTrack?.id === String(post.id);
  const isPlaying = isCurrentTrack && player.isPlaying;
  const locked = post.visibility === "members" && !isMember;
  const duration = getAudioDuration(post);
  const audioUrl = getAudioUrl(post);
  const label = post.label ?? "voice-memo";
  const description = post.content ?? "";

  const LabelIcon = LABEL_ICONS[label] ?? Mic;

  function handlePlay() {
    if (locked || !audioUrl) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play({
        id: String(post.id),
        title: post.title ?? "",
        label,
        audioUrl,
        duration,
      });
    }
  }

  return (
    <article className="group relative">
      {/* Label + date header */}
      <div className="mb-3 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        <LabelIcon className="size-3.5" />
        <span>{AUDIO_LABEL_DISPLAY[label] ?? label}</span>
        <span className="text-border">&middot;</span>
        <PostDate date={post.publishedAt ?? post.createdAt} />
      </div>

      {/* Main card */}
      <div
        className={`relative overflow-hidden rounded-lg border border-border/50 bg-card transition-colors ${
          isCurrentTrack ? "border-primary/30" : ""
        }`}
      >
        <div className="flex items-center gap-4 p-4 sm:p-5">
          {/* Play button */}
          <button
            type="button"
            onClick={handlePlay}
            disabled={locked}
            className={`flex size-12 shrink-0 items-center justify-center rounded-full transition-all sm:size-14 ${
              locked
                ? "cursor-default bg-muted text-muted-foreground"
                : isPlaying
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-foreground/10 text-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20"
            }`}
          >
            {isPlaying ? (
              <Pause className="size-5 sm:size-6" fill="currentColor" />
            ) : (
              <Play className="size-5 translate-x-0.5 sm:size-6" fill="currentColor" />
            )}
          </button>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-base leading-tight sm:text-lg">{post.title}</h3>
            <p className="mt-1.5 line-clamp-2 text-muted-foreground text-sm leading-relaxed">
              {locked ? `${description.slice(0, 60)}...` : description}
            </p>
          </div>

          {/* Duration */}
          <span className="shrink-0 font-mono text-muted-foreground text-sm tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Progress bar for current track */}
        {isCurrentTrack && !locked && (
          <div className="h-0.5 w-full bg-border">
            <div
              className="h-full bg-primary transition-all duration-100 ease-linear"
              style={{
                width: `${(player.currentTime / player.duration) * 100}%`,
              }}
            />
          </div>
        )}

        {/* Gate overlay */}
        {locked && (
          <div className="border-t border-border/50 px-4 py-2 sm:px-5">
            <MembershipGate variant="inline" />
          </div>
        )}
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <PostTags tags={post.tags.map((t) => t.name)} onTagClick={onTagClick} className="mt-3" />
      )}
    </article>
  );
}
