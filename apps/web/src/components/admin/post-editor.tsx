import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import slugify from "slugify";
import { Calendar, Clock, Eye, ImagePlus, Music, Trash2, GripVertical, X } from "lucide-react";
import { createPostFn, updatePostFn } from "@/functions/posts.functions";
import { listTagsFn, syncPostTagsFn } from "@/functions/tags.functions";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { MediaPickerDialog } from "@/components/admin/media-picker-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminMediaAsset } from "@/lib/media";

type PostType = "writing" | "audio" | "note" | "photo";
type ScheduleMode = "draft" | "schedule" | "publish";

interface PostMedia {
  role: "artwork" | "audio" | "photo" | "inline";
  displayOrder: number;
  url: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  mediaId?: number;
  id?: number;
  mediaType?: string;
  access?: "public" | "members";
}

interface PostTag {
  id: number;
  name: string;
  slug: string;
}

interface EditablePost {
  id: number;
  type: PostType;
  visibility: "public" | "members";
  format: string | null;
  label: string | null;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  publishedAt: string | null;
  tags: PostTag[];
  media: PostMedia[];
  status: string;
}

interface PostEditorProps {
  post?: EditablePost;
}

function deriveScheduleMode(publishedAt: string | null): ScheduleMode {
  if (!publishedAt) {
    return "draft";
  }

  const publishDate = new Date(publishedAt);

  if (publishDate <= new Date()) {
    return "publish";
  }

  return "schedule";
}

function formatLocalDatetime(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function localDatetimeToUtcIso(localDatetime: string): string {
  return new Date(localDatetime).toISOString();
}

export function PostEditor({ post }: PostEditorProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!post;

  const [type, setType] = useState<PostType>(post?.type ?? "writing");
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [visibility, setVisibility] = useState<"public" | "members">(post?.visibility ?? "members");
  const [format, setFormat] = useState<"essay" | "poetry">(
    (post?.format as "essay" | "poetry") ?? "essay",
  );
  const [label, setLabel] = useState<"voice-memo" | "demo" | "early-listen" | "studio-session">(
    (post?.label as "voice-memo" | "demo" | "early-listen" | "studio-session") ?? "voice-memo",
  );
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(post?.tags.map((t) => t.name) ?? []);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(
    post ? deriveScheduleMode(post.publishedAt) : "draft",
  );
  const [scheduleDatetime, setScheduleDatetime] = useState(
    post?.publishedAt && deriveScheduleMode(post.publishedAt) === "schedule"
      ? formatLocalDatetime(post.publishedAt)
      : "",
  );

  const initialAudioMedia = useMemo(
    () => post?.media.filter((m) => m.role === "audio") ?? [],
    [post],
  );
  const initialArtworkMedia = useMemo(
    () => post?.media.filter((m) => m.role === "artwork") ?? [],
    [post],
  );
  const initialPhotoMedia = useMemo(
    () =>
      (post?.media.filter((m) => m.role === "photo") ?? []).sort(
        (a, b) => a.displayOrder - b.displayOrder,
      ),
    [post],
  );

  const [audioAssets, setAudioAssets] = useState<AdminMediaAsset[]>(() =>
    initialAudioMedia
      .filter((m): m is PostMedia & { mediaId: number } => !!m.mediaId)
      .map(mediaToAdminAsset),
  );
  const [artworkAssets, setArtworkAssets] = useState<AdminMediaAsset[]>(() =>
    initialArtworkMedia
      .filter((m): m is PostMedia & { mediaId: number } => !!m.mediaId)
      .map(mediaToAdminAsset),
  );
  const [photoAssets, setPhotoAssets] = useState<AdminMediaAsset[]>(() =>
    initialPhotoMedia
      .filter((m): m is PostMedia & { mediaId: number } => !!m.mediaId)
      .map(mediaToAdminAsset),
  );

  const [audioPickerOpen, setAudioPickerOpen] = useState(false);
  const [artworkPickerOpen, setArtworkPickerOpen] = useState(false);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);

  const { data: existingTags } = useQuery({
    queryKey: ["tags"],
    queryFn: () => listTagsFn(),
  });

  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title, { lower: true, strict: true }));
    }
  }, [title, slugManuallyEdited]);

  const buildPublishedAt = useCallback((): string | null => {
    if (scheduleMode === "draft") {
      return null;
    }

    if (scheduleMode === "publish") {
      if (isEditing && post?.publishedAt) {
        const existingDate = new Date(post.publishedAt);

        if (existingDate <= new Date()) {
          return post.publishedAt;
        }
      }

      return new Date().toISOString();
    }

    if (scheduleDatetime) {
      return localDatetimeToUtcIso(scheduleDatetime);
    }

    return null;
  }, [scheduleMode, scheduleDatetime, isEditing, post]);

  const buildMediaAttachments = useCallback(() => {
    const attachments: Array<{
      mediaId: number;
      role: "artwork" | "audio" | "photo";
      displayOrder: number;
    }> = [];

    if (type === "audio") {
      for (const asset of audioAssets) {
        attachments.push({ mediaId: asset.id, role: "audio", displayOrder: 0 });
      }

      for (const asset of artworkAssets) {
        attachments.push({ mediaId: asset.id, role: "artwork", displayOrder: 0 });
      }
    }

    if (type === "photo") {
      photoAssets.forEach((asset, index) => {
        attachments.push({ mediaId: asset.id, role: "photo", displayOrder: index });
      });
    }

    return attachments;
  }, [type, audioAssets, artworkAssets, photoAssets]);

  const buildRolesToSync = useCallback((): Array<"artwork" | "audio" | "photo"> => {
    if (type === "audio") {
      return ["audio", "artwork"];
    }

    if (type === "photo") {
      return ["photo"];
    }

    return [];
  }, [type]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const postData = {
        type,
        slug: slug || undefined,
        title: title.trim(),
        excerpt: excerpt || null,
        content: content || null,
        visibility,
        format: type === "writing" ? format : null,
        label: type === "audio" ? label : null,
        publishedAt: buildPublishedAt(),
        authorId: "",
        mediaAttachments: buildMediaAttachments(),
        rolesToSync: buildRolesToSync(),
      };
      const created = await createPostFn({ data: postData });

      if (created && selectedTags.length > 0) {
        await syncPostTagsFn({
          data: { postId: created.id, tagNames: selectedTags },
        });
      }

      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post created");
      navigate({ to: "/admin/posts" });
    },
    onError: (err) => toast.error(String(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!post) return;
      await updatePostFn({
        data: {
          id: post.id,
          title: title.trim(),
          slug,
          excerpt: excerpt || null,
          content: content || null,
          visibility,
          format: type === "writing" ? format : null,
          label: type === "audio" ? label : null,
          publishedAt: buildPublishedAt(),
          mediaAttachments: buildMediaAttachments(),
          rolesToSync: buildRolesToSync(),
        },
      });

      await syncPostTagsFn({
        data: { postId: post.id, tagNames: selectedTags },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post updated");
      navigate({ to: "/admin/posts" });
    },
    onError: (err) => toast.error(String(err)),
  });

  function addTag(tag: string) {
    const trimmed = tag.trim();

    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }

    setTagInput("");
  }

  function removeTag(tag: string) {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  }

  const tagSuggestions =
    existingTags?.filter(
      (t) =>
        t.name.toLowerCase().includes(tagInput.toLowerCase()) && !selectedTags.includes(t.name),
    ) ?? [];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {!isEditing && (
        <div>
          <Label>Type</Label>
          <div className="mt-2 flex gap-2">
            {(["writing", "audio", "note", "photo"] as PostType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-md px-3 py-1.5 text-sm capitalize ${
                  type === t
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <div className="mt-1 flex items-center gap-2">
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              setSlug(slugify(e.target.value, { lower: true, strict: true }));
            }}
            placeholder="post-slug"
            className="font-mono text-xs"
          />
          {slugManuallyEdited && !isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSlugManuallyEdited(false);
                setSlug(slugify(title, { lower: true, strict: true }));
              }}
            >
              Reset
            </Button>
          )}
        </div>
        <p className="mt-1 text-muted-foreground text-xs">
          Server ensures uniqueness. If taken, a suffix is appended automatically.
        </p>
      </div>

      {type === "writing" && (
        <div>
          <Label>Format</Label>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setFormat("essay")}
              className={`rounded-md px-3 py-1.5 text-sm ${
                format === "essay"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Essay
            </button>
            <button
              type="button"
              onClick={() => setFormat("poetry")}
              className={`rounded-md px-3 py-1.5 text-sm ${
                format === "poetry"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Poetry
            </button>
          </div>
        </div>
      )}

      {type === "audio" && (
        <div>
          <Label>Label</Label>
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value as typeof label)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="voice-memo">Voice Memo</option>
            <option value="demo">Demo</option>
            <option value="early-listen">Early Listen</option>
            <option value="studio-session">Studio Session</option>
          </select>
        </div>
      )}

      {(type === "writing" || type === "photo") && (
        <div>
          <Label htmlFor="excerpt">{type === "photo" ? "Caption" : "Excerpt"}</Label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder={type === "photo" ? "Photo caption..." : "Brief excerpt..."}
          />
        </div>
      )}

      {type === "audio" && (
        <AudioMediaSection
          audioAssets={audioAssets}
          artworkAssets={artworkAssets}
          onOpenAudioPicker={() => setAudioPickerOpen(true)}
          onOpenArtworkPicker={() => setArtworkPickerOpen(true)}
          onRemoveAudio={() => setAudioAssets([])}
          onRemoveArtwork={() => setArtworkAssets([])}
        />
      )}

      {type === "photo" && (
        <PhotoMediaSection
          photoAssets={photoAssets}
          onOpenPicker={() => setPhotoPickerOpen(true)}
          onChange={setPhotoAssets}
        />
      )}

      <div>
        <Label>
          {type === "writing" ? "Content" : type === "audio" ? "Description" : "Content"}
        </Label>
        <div className="mt-1">
          {type === "writing" || type === "note" ? (
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder={type === "writing" ? "Start writing..." : "Write a note..."}
              enableImages={type === "writing"}
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Enter description..."
            />
          )}
        </div>
      </div>

      <div>
        <Label>Visibility</Label>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setVisibility("members")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              visibility === "members"
                ? "bg-secondary/20 text-secondary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Members only
          </button>
          <button
            type="button"
            onClick={() => setVisibility("public")}
            className={`rounded-md px-3 py-1.5 text-sm ${
              visibility === "public"
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Public
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags</Label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-primary text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-destructive"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <div className="relative mt-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagInput);
              }
            }}
            placeholder="Add tags..."
          />
          {tagInput && tagSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
              {tagSuggestions.slice(0, 5).map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => addTag(tag.name)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ScheduleSection
        mode={scheduleMode}
        datetime={scheduleDatetime}
        existingPublishedAt={post?.publishedAt ?? null}
        onModeChange={setScheduleMode}
        onDatetimeChange={setScheduleDatetime}
      />

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <Button
          onClick={() => (isEditing ? updateMutation.mutate() : createMutation.mutate())}
          disabled={isSaving || !title.trim()}
        >
          {isSaving
            ? "Saving..."
            : isEditing
              ? "Update"
              : scheduleMode === "publish"
                ? "Publish"
                : scheduleMode === "schedule"
                  ? "Schedule"
                  : "Save draft"}
        </Button>
        {isEditing && post?.slug && (
          <a
            href={`/members/post/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            <Eye className="size-4" />
            Preview
          </a>
        )}
        <Button variant="outline" onClick={() => navigate({ to: "/admin/posts" })}>
          Cancel
        </Button>
      </div>

      <MediaPickerDialog
        open={audioPickerOpen}
        onOpenChange={setAudioPickerOpen}
        onConfirm={(assets) => setAudioAssets(assets.slice(0, 1))}
        title="Choose audio file"
        description="Select an audio file from the media library."
        confirmLabel="Use audio"
        allowedTypes={["audio"]}
      />
      <MediaPickerDialog
        open={artworkPickerOpen}
        onOpenChange={setArtworkPickerOpen}
        onConfirm={(assets) => setArtworkAssets(assets.slice(0, 1))}
        title="Choose artwork"
        description="Select an artwork image from the media library."
        confirmLabel="Use artwork"
        allowedTypes={["image"]}
      />
      <MediaPickerDialog
        open={photoPickerOpen}
        onOpenChange={setPhotoPickerOpen}
        onConfirm={setPhotoAssets}
        title="Choose photos"
        description="Select photos from the media library. Drag to reorder after selecting."
        confirmLabel="Use photos"
        allowedTypes={["image"]}
        multiSelect
        initialSelectedAssets={photoAssets}
      />
    </div>
  );
}

function ScheduleSection({
  mode,
  datetime,
  existingPublishedAt,
  onModeChange,
  onDatetimeChange,
}: {
  mode: ScheduleMode;
  datetime: string;
  existingPublishedAt: string | null;
  onModeChange: (mode: ScheduleMode) => void;
  onDatetimeChange: (datetime: string) => void;
}) {
  const isAlreadyPublished =
    existingPublishedAt !== null && new Date(existingPublishedAt) <= new Date();

  return (
    <div className="space-y-3">
      <Label>Publishing</Label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onModeChange("draft")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
            mode === "draft"
              ? "bg-muted-foreground/20 text-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Draft
        </button>
        <button
          type="button"
          onClick={() => onModeChange("schedule")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
            mode === "schedule"
              ? "bg-secondary/20 text-secondary"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="size-3.5" />
          Schedule
        </button>
        <button
          type="button"
          onClick={() => onModeChange("publish")}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
            mode === "publish"
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {isAlreadyPublished ? "Published" : "Publish now"}
        </button>
      </div>
      {mode === "schedule" && (
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => onDatetimeChange(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm"
            min={formatLocalDatetime(new Date().toISOString())}
          />
          <span className="text-muted-foreground text-xs">Local time</span>
        </div>
      )}
      {mode === "publish" && isAlreadyPublished && existingPublishedAt && (
        <p className="text-muted-foreground text-xs">
          Published{" "}
          {new Date(existingPublishedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}

function AudioMediaSection({
  audioAssets,
  artworkAssets,
  onOpenAudioPicker,
  onOpenArtworkPicker,
  onRemoveAudio,
  onRemoveArtwork,
}: {
  audioAssets: AdminMediaAsset[];
  artworkAssets: AdminMediaAsset[];
  onOpenAudioPicker: () => void;
  onOpenArtworkPicker: () => void;
  onRemoveAudio: () => void;
  onRemoveArtwork: () => void;
}) {
  const audioAsset = audioAssets[0];
  const artworkAsset = artworkAssets[0];

  return (
    <div className="space-y-4">
      <div>
        <Label>Audio File</Label>
        {audioAsset ? (
          <div className="mt-2 flex items-center gap-3 rounded-md border border-border p-3">
            <Music className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{audioAsset.originalFilename}</p>
              {audioAsset.durationSeconds !== null && (
                <p className="text-muted-foreground text-xs">
                  {Math.floor(audioAsset.durationSeconds / 60)}:
                  {String(audioAsset.durationSeconds % 60).padStart(2, "0")}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onRemoveAudio}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="mt-2" onClick={onOpenAudioPicker}>
            <Music className="mr-2 size-4" />
            Choose audio file
          </Button>
        )}
      </div>
      <div>
        <Label>Artwork (optional)</Label>
        {artworkAsset ? (
          <div className="mt-2 flex items-center gap-3 rounded-md border border-border p-3">
            {artworkAsset.thumbUrl ? (
              <img
                src={artworkAsset.thumbUrl}
                alt={artworkAsset.defaultAlt ?? ""}
                className="size-12 rounded object-cover"
              />
            ) : (
              <ImagePlus className="size-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{artworkAsset.originalFilename}</p>
            </div>
            <button
              type="button"
              onClick={onRemoveArtwork}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="mt-2" onClick={onOpenArtworkPicker}>
            <ImagePlus className="mr-2 size-4" />
            Choose artwork
          </Button>
        )}
      </div>
    </div>
  );
}

function PhotoMediaSection({
  photoAssets,
  onOpenPicker,
  onChange,
}: {
  photoAssets: AdminMediaAsset[];
  onOpenPicker: () => void;
  onChange: (assets: AdminMediaAsset[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();

    if (dragIndex === null || dragIndex === targetIndex) {
      return;
    }

    const reordered = [...photoAssets];
    const [moved] = reordered.splice(dragIndex, 1);

    if (moved) {
      reordered.splice(targetIndex, 0, moved);
      onChange(reordered);
      setDragIndex(targetIndex);
    }
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  function removePhoto(index: number) {
    onChange(photoAssets.filter((_, i) => i !== index));
  }

  return (
    <div>
      <Label>Photos</Label>
      {photoAssets.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photoAssets.map((asset, index) => (
            <div
              key={asset.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative aspect-square overflow-hidden rounded-md border border-border ${
                dragIndex === index ? "opacity-50" : ""
              }`}
            >
              {asset.thumbUrl ? (
                <img
                  src={asset.thumbUrl}
                  alt={asset.defaultAlt ?? ""}
                  className="size-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-muted">
                  <ImagePlus className="size-6 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 flex items-start justify-between bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                <GripVertical className="size-4 cursor-grab text-white drop-shadow-md" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="rounded bg-black/50 p-0.5 text-white hover:bg-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 font-mono text-white text-xs">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" className="mt-2" onClick={onOpenPicker}>
        <ImagePlus className="mr-2 size-4" />
        {photoAssets.length > 0 ? "Edit photos" : "Choose photos"}
      </Button>
    </div>
  );
}

function mediaToAdminAsset(m: PostMedia & { mediaId: number }): AdminMediaAsset {
  return {
    id: m.mediaId,
    assetKey: "",
    type: (m.mediaType === "audio" ? "audio" : "image") as "image" | "audio",
    access: m.access ?? "public",
    status: "ready",
    originalFilename: "",
    mimeType: "",
    byteSize: null,
    defaultAlt: m.alt,
    durationSeconds: m.duration,
    waveformPeaks: null,
    processingError: null,
    createdAt: "",
    updatedAt: "",
    usageCount: 0,
    canDelete: false,
    previewUrl: m.url,
    displayUrl: m.url,
    thumbUrl: m.url,
    variants: [],
  };
}
