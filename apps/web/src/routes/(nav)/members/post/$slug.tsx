import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Camera, Feather, Play, Pause } from "lucide-react";
import { MembershipProvider } from "@/lib/members/membership-context";
import { useMembership } from "@/lib/members/membership-context";
import { useAudioPlayer } from "@/lib/members/audio-player-context";
import { getMembershipStatusFn } from "@/functions/membership.functions";
import { getPostBySlugFn } from "@/functions/posts.functions";
import { postQueryOptions } from "@/hooks/use-posts";
import type { FeedPost } from "@/lib/members/types";
import {
  AUDIO_LABEL_DISPLAY,
  MEMBERSHIP_TIER,
  getAudioDuration,
  getAudioUrl,
  getPostImages,
} from "@/lib/members/types";
import { PostTags } from "@/components/members/post-tags";
import { buildPostSeoHead } from "@/lib/post-seo";

export const Route = createFileRoute("/(nav)/members/post/$slug")({
  component: PostDetailPage,
  beforeLoad: async ({ params }) => {
    const [membership, post] = await Promise.all([
      getMembershipStatusFn(),
      getPostBySlugFn({ data: { slug: params.slug } }),
    ]);

    return { membership, post };
  },
  head: ({ match }) => {
    const context = match.context as { post?: FeedPost | null } | undefined;
    const post = context?.post ?? null;

    return buildPostSeoHead(post, match.params.slug);
  },
});

function PostDetailPage() {
  const { slug } = Route.useParams();
  const { membership, post: ssrPost } = Route.useRouteContext();
  const { data: post, isLoading } = useQuery({
    ...postQueryOptions(slug),
    initialData: ssrPost ?? undefined,
  });

  if (isLoading && !post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="mb-4 font-heading text-2xl">Post not found</h1>
        <Link to="/members" className="text-primary text-sm hover:text-primary/80">
          &larr; Back to feed
        </Link>
      </div>
    );
  }

  return (
    <MembershipProvider isMember={membership.isMember} isLoggedIn={membership.isLoggedIn}>
      <div className="mx-auto max-w-2xl px-4 pb-32 pt-10 sm:px-6 sm:pt-16">
        <Link
          to="/members"
          className="mb-8 inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to feed
        </Link>

        {post.type === "writing" && <WritingDetail post={post} />}
        {post.type === "audio" && <AudioDetail post={post} />}
        {post.type === "photo" && <PhotoDetail post={post} />}
        {post.type === "note" && <NoteDetail post={post} />}
      </div>
    </MembershipProvider>
  );
}

function WritingDetail({ post }: { post: FeedPost }) {
  const { isMember } = useMembership();
  const locked = post.visibility === "members" && !isMember;
  const isPoetry = post.format === "poetry";
  const Icon = isPoetry ? Feather : BookOpen;

  return (
    <article>
      <div className="mb-4 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        <Icon className="size-3.5" />
        <span>{isPoetry ? "Poetry" : post.readingTime}</span>
        <span className="text-border">&middot;</span>
        <FormattedDate date={post.publishedAt ?? post.createdAt} />
      </div>

      <h1 className="mb-6 font-heading text-3xl leading-tight sm:text-4xl">{post.title}</h1>

      {post.tags.length > 0 && <PostTags tags={post.tags.map((t) => t.name)} className="mb-8" />}

      {locked ? (
        <>
          <p className="mb-6 text-lg leading-relaxed text-foreground/80">{post.excerpt}</p>
          <MemberGateBlock />
        </>
      ) : isPoetry ? (
        <div className="prose-poetry" dangerouslySetInnerHTML={{ __html: post.content ?? "" }} />
      ) : (
        <div className="prose-post" dangerouslySetInnerHTML={{ __html: post.content ?? "" }} />
      )}

      {post.visibility === "public" && !locked && <SoftCta />}
    </article>
  );
}

function AudioDetail({ post }: { post: FeedPost }) {
  const { isMember } = useMembership();
  const player = useAudioPlayer();
  const locked = post.visibility === "members" && !isMember;
  const isCurrentTrack = player.currentTrack?.id === String(post.id);
  const isPlaying = isCurrentTrack && player.isPlaying;
  const duration = getAudioDuration(post);
  const audioUrl = getAudioUrl(post);
  const labelValue = post.label ?? "voice-memo";
  const description = post.content ?? "";

  function handlePlay() {
    if (locked || !audioUrl) return;
    if (isPlaying) {
      player.pause();
    } else {
      player.play({
        id: String(post.id),
        title: post.title ?? "",
        label: labelValue,
        audioUrl,
        duration,
      });
    }
  }

  const m = Math.floor(duration / 60);
  const s = duration % 60;
  const durationStr = `${m}:${s.toString().padStart(2, "0")}`;

  return (
    <article>
      <div className="mb-4 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        <span>{AUDIO_LABEL_DISPLAY[labelValue] ?? labelValue}</span>
        <span className="text-border">&middot;</span>
        <span>{durationStr}</span>
        <span className="text-border">&middot;</span>
        <FormattedDate date={post.publishedAt ?? post.createdAt} />
      </div>

      <h1 className="mb-6 font-heading text-3xl leading-tight sm:text-4xl">{post.title}</h1>

      {post.tags.length > 0 && <PostTags tags={post.tags.map((t) => t.name)} className="mb-6" />}

      {locked ? (
        <MemberGateBlock />
      ) : (
        <>
          <button
            type="button"
            onClick={handlePlay}
            className={`mb-8 flex w-full items-center gap-4 rounded-lg border p-5 transition-colors ${
              isPlaying
                ? "border-primary/30 bg-primary/5"
                : "border-border/50 bg-card hover:border-primary/20"
            }`}
          >
            <div
              className={`flex size-14 shrink-0 items-center justify-center rounded-full transition-all ${
                isPlaying
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-foreground/10 text-foreground"
              }`}
            >
              {isPlaying ? (
                <Pause className="size-6" fill="currentColor" />
              ) : (
                <Play className="size-6 translate-x-0.5" fill="currentColor" />
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="font-medium text-sm">{isPlaying ? "Now playing" : "Play"}</p>
              {isCurrentTrack && (
                <div className="mt-2 h-1 w-full rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-100 ease-linear"
                    style={{
                      width: `${(player.currentTime / player.duration) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
            <span className="font-mono text-muted-foreground text-sm tabular-nums">
              {durationStr}
            </span>
          </button>

          <div className="prose-post" dangerouslySetInnerHTML={{ __html: description }} />
        </>
      )}
    </article>
  );
}

function PhotoDetail({ post }: { post: FeedPost }) {
  const { isMember } = useMembership();
  const locked = post.visibility === "members" && !isMember;
  const images = getPostImages(post);
  const caption = post.excerpt ?? post.content;

  return (
    <article>
      <div className="mb-4 flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        <Camera className="size-3.5" />
        <span>
          {images.length} {images.length === 1 ? "photo" : "photos"}
        </span>
        <span className="text-border">&middot;</span>
        <FormattedDate date={post.publishedAt ?? post.createdAt} />
      </div>

      {caption && <p className="mb-6 text-lg leading-relaxed text-foreground/80">{caption}</p>}

      {post.tags.length > 0 && <PostTags tags={post.tags.map((t) => t.name)} className="mb-6" />}

      {locked ? (
        <MemberGateBlock />
      ) : (
        <div className="space-y-3">
          {images.map((image) => (
            <img
              key={image.url}
              src={image.url}
              alt={image.alt}
              className="w-full rounded-lg object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}

      {post.visibility === "public" && !locked && <SoftCta />}
    </article>
  );
}

function NoteDetail({ post }: { post: FeedPost }) {
  return (
    <article>
      <div className="mb-4 text-muted-foreground text-xs uppercase tracking-wider">
        <FormattedDate date={post.publishedAt ?? post.createdAt} />
      </div>
      <p className="text-lg leading-relaxed text-foreground/80">{post.content}</p>
      {post.tags.length > 0 && <PostTags tags={post.tags.map((t) => t.name)} className="mt-6" />}
    </article>
  );
}

function FormattedDate({ date }: { date: string }) {
  const d = new Date(date);
  return (
    <time dateTime={date}>
      {d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}
    </time>
  );
}

function MemberGateBlock() {
  return (
    <div className="my-8 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
      <p className="mb-2 font-heading text-xl">This is for members</p>
      <p className="mx-auto mb-6 max-w-sm text-muted-foreground text-sm">
        Join for ${MEMBERSHIP_TIER.price}/month to read this and get access to all writing, audio,
        photos, and notes.
      </p>
      <button
        type="button"
        className="inline-flex items-center rounded-md bg-primary px-6 py-2.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
      >
        Become a member
      </button>
    </div>
  );
}

function SoftCta() {
  return (
    <div className="mt-12 border-t border-border/50 pt-8 text-center">
      <p className="mb-1 text-muted-foreground text-sm">
        Enjoyed this? There's a lot more where it came from.
      </p>
      <Link to="/members" className="text-primary text-sm transition-colors hover:text-primary/80">
        See what members get &rarr;
      </Link>
    </div>
  );
}
