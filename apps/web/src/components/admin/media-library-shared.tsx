import { skipToken, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  GripVertical,
  ImagePlus,
  LoaderCircle,
  Music4,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { listMediaFn } from "@/functions/media.functions";
import type { AdminMediaAsset, MediaAccess, MediaType } from "@/lib/media";
import {
  AUDIO_FILENAME_EXTENSIONS,
  IMAGE_FILENAME_EXTENSIONS,
  formatDurationSeconds,
  formatMediaByteSize,
  reorderList,
} from "@/lib/media";
import { uploadAudioAsset, uploadImageAsset } from "@/lib/media-upload-client";
import { cn } from "@/lib/utils";
import { AudioWaveform } from "@/components/admin/audio-waveform";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface MediaLibraryFiltersValue {
  search: string;
  type: MediaType | "all";
  access: MediaAccess | "all";
}

interface UploadJob {
  id: string;
  fileName: string;
  type: MediaType;
  status: "uploading" | "success" | "error";
  message: string;
}

function createUploadJobId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveMediaDateLabel(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue));
}

function resolveUploadKind(file: File): MediaType | null {
  const normalizedName = file.name.trim().toLowerCase();

  if (IMAGE_FILENAME_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))) {
    return "image";
  }

  if (AUDIO_FILENAME_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))) {
    return "audio";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("audio/")) {
    return "audio";
  }

  return null;
}

function createUploadAcceptValue(allowedTypes: MediaType[]) {
  const parts: string[] = [];

  if (allowedTypes.includes("image")) {
    parts.push(...IMAGE_FILENAME_EXTENSIONS);
  }

  if (allowedTypes.includes("audio")) {
    parts.push(...AUDIO_FILENAME_EXTENSIONS);
  }

  return parts.join(",");
}

function parseMediaTypeFilterValue(value: string, allowedTypes: MediaType[]) {
  if (value === "all") {
    return "all";
  }

  if (value === "image" && allowedTypes.includes("image")) {
    return "image";
  }

  if (value === "audio" && allowedTypes.includes("audio")) {
    return "audio";
  }

  return null;
}

function parseMediaAccessFilterValue(value: string) {
  if (value === "all") {
    return "all";
  }

  if (value === "public" || value === "members") {
    return value;
  }

  return null;
}

interface UseAdminMediaLibraryOptions {
  enabled?: boolean;
  limit?: number;
}

export function useAdminMediaLibrary(
  filters: MediaLibraryFiltersValue,
  options?: UseAdminMediaLibraryOptions,
) {
  const deferredSearch = useDeferredValue(filters.search.trim());

  return useQuery({
    queryKey: ["admin-media", filters.type, filters.access, deferredSearch, options?.limit ?? null],
    queryFn:
      options?.enabled === false
        ? skipToken
        : () =>
            listMediaFn({
              data: {
                type: filters.type === "all" ? undefined : filters.type,
                access: filters.access === "all" ? undefined : filters.access,
                search: deferredSearch.length > 0 ? deferredSearch : undefined,
                limit: options?.limit,
              },
            }),
  });
}

interface MediaLibraryFiltersBarProps {
  filters: MediaLibraryFiltersValue;
  onFiltersChange: (nextFilters: MediaLibraryFiltersValue) => void;
  allowedTypes?: MediaType[];
  showAccessFilter?: boolean;
}

export function MediaLibraryFiltersBar({
  filters,
  onFiltersChange,
  allowedTypes = ["image", "audio"],
  showAccessFilter = true,
}: MediaLibraryFiltersBarProps) {
  const showTypeFilter = allowedTypes.length > 1;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-4 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) =>
            onFiltersChange({
              ...filters,
              search: event.target.value,
            })
          }
          placeholder="Search filename, alt text, or media type"
          className="pl-9"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        {showTypeFilter && (
          <select
            value={filters.type}
            onChange={(event) => {
              const nextTypeValue = parseMediaTypeFilterValue(event.target.value, allowedTypes);

              if (nextTypeValue) {
                onFiltersChange({
                  ...filters,
                  type: nextTypeValue,
                });
              }
            }}
            className="h-10 min-w-36 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All media</option>
            {allowedTypes.includes("image") && <option value="image">Images</option>}
            {allowedTypes.includes("audio") && <option value="audio">Audio</option>}
          </select>
        )}
        {showAccessFilter && (
          <select
            value={filters.access}
            onChange={(event) => {
              const nextAccessValue = parseMediaAccessFilterValue(event.target.value);

              if (nextAccessValue) {
                onFiltersChange({
                  ...filters,
                  access: nextAccessValue,
                });
              }
            }}
            className="h-10 min-w-36 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All access</option>
            <option value="public">Public</option>
            <option value="members">Members</option>
          </select>
        )}
      </div>
    </div>
  );
}

interface MediaUploadPanelProps {
  allowedTypes?: MediaType[];
  onUploadComplete?: () => Promise<void> | void;
}

export function MediaUploadPanel({
  allowedTypes = ["image", "audio"],
  onUploadComplete,
}: MediaUploadPanelProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [access, setAccess] = useState<MediaAccess>("public");
  const [defaultAlt, setDefaultAlt] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadJobs, setUploadJobs] = useState<UploadJob[]>([]);

  const acceptValue = useMemo(() => createUploadAcceptValue(allowedTypes), [allowedTypes]);

  async function handleFiles(fileList: File[]) {
    if (fileList.length === 0) {
      return;
    }

    setIsUploading(true);

    for (const file of fileList) {
      const uploadKind = resolveUploadKind(file);

      if (!uploadKind || !allowedTypes.includes(uploadKind)) {
        const unsupportedJob: UploadJob = {
          id: createUploadJobId(),
          fileName: file.name,
          type: uploadKind ?? "image",
          status: "error",
          message: "This file type is not supported here.",
        };

        setUploadJobs((currentJobs) => [unsupportedJob, ...currentJobs].slice(0, 8));
        toast.error(`${file.name} is not supported here.`);
        continue;
      }

      const jobId = createUploadJobId();
      const pendingJob: UploadJob = {
        id: jobId,
        fileName: file.name,
        type: uploadKind,
        status: "uploading",
        message: "Uploading…",
      };

      setUploadJobs((currentJobs) => [pendingJob, ...currentJobs].slice(0, 8));

      try {
        if (uploadKind === "image") {
          await uploadImageAsset({
            file,
            access,
            defaultAlt,
          });
        } else {
          await uploadAudioAsset({
            file,
            access,
          });
        }

        setUploadJobs((currentJobs) =>
          currentJobs.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: "success",
                  message: "Uploaded",
                }
              : job,
          ),
        );
        toast.success(`${file.name} uploaded`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed.";

        setUploadJobs((currentJobs) =>
          currentJobs.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: "error",
                  message,
                }
              : job,
          ),
        );
        toast.error(message);
      }
    }

    setIsUploading(false);
    await onUploadComplete?.();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/70 bg-card/60 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-medium text-base">Upload media</h2>
          <p className="text-muted-foreground text-sm">
            Image uploads stream through the server. Audio uploads go directly to storage after a
            secure initiation step.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="space-y-1">
            <label
              htmlFor={`${inputId}-access`}
              className="block text-muted-foreground text-xs uppercase tracking-[0.2em]"
            >
              Access
            </label>
            <select
              id={`${inputId}-access`}
              value={access}
              onChange={(event) => {
                const nextAccess = event.target.value;

                if (nextAccess === "public" || nextAccess === "members") {
                  setAccess(nextAccess);
                }
              }}
              className="h-10 min-w-36 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="public">Public</option>
              <option value="members">Members</option>
            </select>
          </div>
          {allowedTypes.includes("image") && (
            <div className="space-y-1 lg:min-w-64">
              <label
                htmlFor={`${inputId}-alt`}
                className="block text-muted-foreground text-xs uppercase tracking-[0.2em]"
              >
                Default alt text
              </label>
              <Input
                id={`${inputId}-alt`}
                value={defaultAlt}
                onChange={(event) => setDefaultAlt(event.target.value)}
                placeholder="Optional image alt text"
              />
            </div>
          )}
        </div>
      </div>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          const relatedTarget = event.relatedTarget;

          if (!(relatedTarget instanceof Node) || !event.currentTarget.contains(relatedTarget)) {
            setIsDragActive(false);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragActive(false);
          void handleFiles(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "rounded-xl border border-dashed p-6 transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-border/70 bg-background/40",
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {allowedTypes.length === 1 && allowedTypes[0] === "audio" ? (
              <Music4 className="size-5" />
            ) : (
              <ImagePlus className="size-5" />
            )}
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm">
              Drag and drop files here or browse from your computer
            </p>
            <p className="text-muted-foreground text-xs">
              Images: JPEG, PNG, WebP, GIF up to 20MB. Audio: MP3, WAV, M4A up to 100MB.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              accept={acceptValue}
              multiple
              onChange={(event) => {
                void handleFiles(Array.from(event.target.files ?? []));
              }}
              className="sr-only"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : (
                <Upload className="mr-2 size-4" />
              )}
              Choose files
            </Button>
          </div>
        </div>
      </div>

      {uploadJobs.length > 0 && (
        <div className="space-y-2">
          {uploadJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{job.fileName}</p>
                <p className="text-muted-foreground text-xs">{job.message}</p>
              </div>
              <div className="ml-3 flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.18em]",
                    job.status === "success" && "bg-primary/10 text-primary",
                    job.status === "error" && "bg-destructive/10 text-destructive",
                    job.status === "uploading" && "bg-muted text-muted-foreground",
                  )}
                >
                  {job.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface MediaAssetCardProps {
  asset: AdminMediaAsset;
  mode: "manage" | "pick";
  isSelected?: boolean;
  selectionDisabled?: boolean;
  onToggleSelect?: (asset: AdminMediaAsset) => void;
  onDelete?: (asset: AdminMediaAsset) => void;
  onSaveAlt?: (mediaId: number, defaultAlt: string | null) => Promise<void> | void;
}

function MediaPreview({ asset }: { asset: AdminMediaAsset }) {
  if (asset.type === "image" && asset.previewUrl) {
    return (
      <img
        src={asset.previewUrl}
        alt={asset.defaultAlt ?? asset.originalFilename}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/10 via-background to-primary/10 p-4">
      <AudioWaveform peaks={asset.waveformPeaks} className="h-full w-full" />
    </div>
  );
}

function resolveSelectionDisabledMessage(asset: AdminMediaAsset) {
  if (asset.status === "failed") {
    return "This asset is unavailable until it is re-uploaded.";
  }

  if (asset.status === "processing" || asset.status === "uploading") {
    return "This asset can be selected after processing finishes.";
  }

  return "This asset is unavailable right now.";
}

export function MediaAssetCard({
  asset,
  mode,
  isSelected = false,
  selectionDisabled = false,
  onToggleSelect,
  onDelete,
  onSaveAlt,
}: MediaAssetCardProps) {
  const altTextareaId = useId();
  const [draftAlt, setDraftAlt] = useState(asset.defaultAlt ?? "");
  const [isSavingAlt, setIsSavingAlt] = useState(false);
  const hasAltChanges = draftAlt.trim() !== (asset.defaultAlt ?? "");
  const selectionDisabledMessage = selectionDisabled
    ? resolveSelectionDisabledMessage(asset)
    : null;

  useEffect(() => {
    setDraftAlt(asset.defaultAlt ?? "");
  }, [asset.defaultAlt, asset.id]);

  async function handleSaveAlt() {
    if (!onSaveAlt) {
      return;
    }

    try {
      setIsSavingAlt(true);
      await onSaveAlt(asset.id, draftAlt.trim().length > 0 ? draftAlt.trim() : null);
      toast.success("Alt text saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save alt text.");
      setDraftAlt(asset.defaultAlt ?? "");
    } finally {
      setIsSavingAlt(false);
    }
  }

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors",
        isSelected && "border-primary ring-1 ring-primary/40",
        mode === "pick" && !selectionDisabled && "cursor-pointer hover:border-primary/60",
      )}
    >
      <button
        type="button"
        onClick={() => {
          if (mode === "pick" && !selectionDisabled) {
            onToggleSelect?.(asset);
          }
        }}
        disabled={mode !== "pick" || selectionDisabled}
        className={cn(
          "relative block w-full text-left",
          mode !== "pick" && "cursor-default",
          selectionDisabled && "cursor-not-allowed opacity-75",
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
          <MediaPreview asset={asset} />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-background/90 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-foreground backdrop-blur">
                {asset.type}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.18em] backdrop-blur",
                  asset.access === "public"
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary/15 text-secondary",
                )}
              >
                {asset.access}
              </span>
            </div>
            {mode === "pick" && isSelected && (
              <span className="rounded-full bg-primary/90 p-1 text-primary-foreground">
                <CheckCircle2 className="size-4" />
              </span>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-linear-to-t from-background/95 to-transparent p-3 text-xs">
            <span
              className={cn(
                "rounded-full px-2 py-1 uppercase tracking-[0.18em]",
                asset.status === "ready" && "bg-primary/10 text-primary",
                asset.status === "failed" && "bg-destructive/10 text-destructive",
                (asset.status === "processing" || asset.status === "uploading") &&
                  "bg-muted text-muted-foreground",
              )}
            >
              {asset.status}
            </span>
            <span className="rounded-full bg-background/90 px-2 py-1 text-muted-foreground backdrop-blur">
              {asset.canDelete
                ? "Unused"
                : `${asset.usageCount} use${asset.usageCount === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>
      </button>

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium text-sm">{asset.originalFilename}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
                <span>{formatMediaByteSize(asset.byteSize)}</span>
                <span>{resolveMediaDateLabel(asset.createdAt)}</span>
                {asset.type === "audio" && asset.durationSeconds !== null && (
                  <span>{formatDurationSeconds(asset.durationSeconds)}</span>
                )}
              </div>
            </div>
            {mode === "manage" && (
              <label className="inline-flex items-center gap-2 text-muted-foreground text-xs">
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={selectionDisabled}
                  onChange={() => onToggleSelect?.(asset)}
                  className="size-4 rounded border-border accent-primary"
                />
                Select
              </label>
            )}
          </div>
          {asset.processingError && (
            <p className="text-destructive text-xs">{asset.processingError}</p>
          )}
          {asset.type === "image" && asset.defaultAlt && mode === "pick" && (
            <p className="line-clamp-2 text-muted-foreground text-xs">Alt: {asset.defaultAlt}</p>
          )}
          {mode === "pick" && selectionDisabledMessage && (
            <p className="text-muted-foreground text-xs">{selectionDisabledMessage}</p>
          )}
        </div>

        {mode === "manage" && asset.type === "image" && (
          <div className="space-y-2">
            <label
              htmlFor={altTextareaId}
              className="block text-muted-foreground text-xs uppercase tracking-[0.2em]"
            >
              Default alt text
            </label>
            <Textarea
              id={altTextareaId}
              value={draftAlt}
              onChange={(event) => setDraftAlt(event.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Describe this image for accessibility"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  void handleSaveAlt();
                }}
                disabled={!hasAltChanges || isSavingAlt}
              >
                {isSavingAlt ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
                Save alt text
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setDraftAlt(asset.defaultAlt ?? "")}
                disabled={!hasAltChanges || isSavingAlt}
              >
                Reset
              </Button>
            </div>
          </div>
        )}

        {mode === "manage" && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs">
              {asset.canDelete ? "Safe to delete" : "Remove from posts before deleting"}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onDelete?.(asset)}
              disabled={!asset.canDelete}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

interface SelectedMediaOrderListProps {
  assets: AdminMediaAsset[];
  onChange: (nextAssets: AdminMediaAsset[]) => void;
}

export function SelectedMediaOrderList({ assets, onChange }: SelectedMediaOrderListProps) {
  const [draggingAssetId, setDraggingAssetId] = useState<number | null>(null);

  if (assets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card/60 p-4">
      <div>
        <h3 className="font-medium text-sm">Selected media</h3>
        <p className="text-muted-foreground text-xs">
          Drag to reorder the selected assets before confirming.
        </p>
      </div>
      <div className="space-y-2">
        {assets.map((asset, index) => (
          <div
            key={asset.id}
            draggable
            onDragStart={() => setDraggingAssetId(asset.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();

              if (draggingAssetId === null) {
                return;
              }

              const fromIndex = assets.findIndex((item) => item.id === draggingAssetId);
              const toIndex = assets.findIndex((item) => item.id === asset.id);

              if (fromIndex >= 0 && toIndex >= 0) {
                onChange(reorderList(assets, fromIndex, toIndex));
              }

              setDraggingAssetId(null);
            }}
            onDragEnd={() => setDraggingAssetId(null)}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm",
              draggingAssetId === asset.id && "border-primary/60 bg-primary/5",
            )}
          >
            <button
              type="button"
              className="cursor-grab text-muted-foreground"
              aria-label={`Reorder ${asset.originalFilename}`}
            >
              <GripVertical className="size-4" />
            </button>
            <span className="w-5 text-muted-foreground text-xs">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{asset.originalFilename}</p>
              <p className="truncate text-muted-foreground text-xs">{asset.type}</p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onChange(assets.filter((item) => item.id !== asset.id))}
              className="size-8"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MediaLibraryEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty className="border border-dashed border-border/70 bg-card/40">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ImagePlus />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
