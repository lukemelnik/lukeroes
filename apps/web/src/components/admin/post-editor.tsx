import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import slugify from "slugify";
import { createPostFn, updatePostFn } from "@/functions/posts.functions";
import { listTagsFn, syncPostTagsFn } from "@/functions/tags.functions";
import type { FeedPost } from "@/lib/members/types";
import { TiptapEditor } from "@/components/admin/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PostType = "writing" | "audio" | "note" | "photo";

interface PostEditorProps {
  post?: FeedPost;
}

export function PostEditor({ post }: PostEditorProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!post;

  const [type, setType] = useState<PostType>(post?.type ?? "writing");
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
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
  const [publishNow, setPublishNow] = useState(!!post?.publishedAt);

  const { data: existingTags } = useQuery({
    queryKey: ["tags"],
    queryFn: () => listTagsFn(),
  });

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && title) {
      setSlug(slugify(title, { lower: true, strict: true }));
    }
  }, [title, isEditing]);

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
        publishedAt: publishNow ? new Date().toISOString() : null,
        authorId: "",
      };
      const created = await createPostFn({ data: postData });
      if (created && selectedTags.length > 0) {
        await syncPostTagsFn({ data: { postId: created.id, tagNames: selectedTags } });
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
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
          excerpt: excerpt || null,
          content: content || null,
          visibility,
          format: type === "writing" ? format : null,
          label: type === "audio" ? label : null,
          publishedAt: publishNow ? post.publishedAt || new Date().toISOString() : undefined,
        },
      });
      await syncPostTagsFn({ data: { postId: post.id, tagNames: selectedTags } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
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

  return (
    <div className="space-y-6">
      {/* Type selector (only for new posts) */}
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

      {/* Title */}
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

      {/* Slug (auto-generated, expandable override) */}
      {slug && (
        <p className="text-muted-foreground text-xs">
          Slug: <span className="font-mono">{slug}</span>
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                const custom = prompt("Custom slug:", slug);
                if (custom) setSlug(slugify(custom, { lower: true, strict: true }));
              }}
              className="ml-2 text-primary hover:text-primary/80"
            >
              edit
            </button>
          )}
        </p>
      )}

      {/* Format (writing only) */}
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

      {/* Label (audio only) */}
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

      {/* Excerpt */}
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

      {/* Content */}
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

      {/* Visibility toggle */}
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

      {/* Tags */}
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

      {/* Publish toggle */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={publishNow}
          onChange={(e) => setPublishNow(e.target.checked)}
          className="size-4 rounded border-border"
        />
        <span className="text-sm">{isEditing ? "Published" : "Publish immediately"}</span>
      </label>

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          onClick={() => (isEditing ? updateMutation.mutate() : createMutation.mutate())}
          disabled={createMutation.isPending || updateMutation.isPending || !slug}
        >
          {createMutation.isPending || updateMutation.isPending
            ? "Saving..."
            : isEditing
              ? "Update"
              : "Create"}
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: "/admin/posts" })}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
