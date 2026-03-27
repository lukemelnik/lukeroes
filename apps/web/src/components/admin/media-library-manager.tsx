import { useQueryClient } from "@tanstack/react-query";
import { Layers3, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  bulkDeleteMediaFn,
  deleteMediaFn,
  updateMediaDefaultAltFn,
} from "@/functions/media.functions";
import { type AdminMediaAsset } from "@/lib/media";
import {
  MediaAssetCard,
  MediaLibraryEmptyState,
  MediaLibraryFiltersBar,
  MediaUploadPanel,
  type MediaLibraryFiltersValue,
  useAdminMediaLibrary,
} from "@/components/admin/media-library-shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteState {
  assetIds: number[];
  title: string;
  description: string;
}

export function MediaLibraryManager() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<MediaLibraryFiltersValue>({
    search: "",
    type: "all",
    access: "all",
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: assets = [], isLoading, isRefetching } = useAdminMediaLibrary(filters);

  useEffect(() => {
    const availableIds = new Set(
      assets.filter((asset) => asset.canDelete).map((asset) => asset.id),
    );

    setSelectedIds((currentIds) => currentIds.filter((id) => availableIds.has(id)));
  }, [assets]);

  const unusedAssetCount = useMemo(
    () => assets.filter((asset) => asset.canDelete).length,
    [assets],
  );

  async function refreshMediaLibrary() {
    await queryClient.invalidateQueries({ queryKey: ["admin-media"] });
  }

  async function handleSaveAlt(mediaId: number, defaultAlt: string | null) {
    await updateMediaDefaultAltFn({
      data: {
        mediaId,
        defaultAlt,
      },
    });
    await refreshMediaLibrary();
  }

  function toggleSelection(asset: AdminMediaAsset) {
    if (!asset.canDelete) {
      return;
    }

    setSelectedIds((currentIds) =>
      currentIds.includes(asset.id)
        ? currentIds.filter((id) => id !== asset.id)
        : [...currentIds, asset.id],
    );
  }

  async function handleDelete() {
    if (!deleteState) {
      return;
    }

    try {
      setIsDeleting(true);

      if (deleteState.assetIds.length === 1) {
        await deleteMediaFn({
          data: {
            mediaId: deleteState.assetIds[0],
          },
        });
      } else {
        await bulkDeleteMediaFn({
          data: {
            mediaIds: deleteState.assetIds,
          },
        });
      }

      toast.success(deleteState.assetIds.length === 1 ? "Media deleted" : "Selected media deleted");
      setSelectedIds((currentIds) => currentIds.filter((id) => !deleteState.assetIds.includes(id)));
      setDeleteState(null);
      await refreshMediaLibrary();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete media.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/60 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary text-xs uppercase tracking-[0.2em]">
            <Layers3 className="size-3.5" />
            Media library
          </div>
          <div>
            <h1 className="font-heading text-3xl">Admin media</h1>
            <p className="max-w-2xl text-muted-foreground text-sm">
              Upload image and audio assets, review access and status metadata, update image alt
              text, and safely delete unused files.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
              Matching assets
            </p>
            <p className="mt-2 font-semibold text-2xl">{assets.length}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Unused shown</p>
            <p className="mt-2 font-semibold text-2xl">{unusedAssetCount}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">Selected</p>
            <p className="mt-2 font-semibold text-2xl">{selectedIds.length}</p>
          </div>
        </div>
      </div>

      <MediaUploadPanel onUploadComplete={refreshMediaLibrary} />

      <div className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <MediaLibraryFiltersBar filters={filters} onFiltersChange={setFilters} />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedIds([]);
              }}
              disabled={selectedIds.length === 0}
            >
              Clear selection
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={selectedIds.length === 0}
              onClick={() => {
                setDeleteState({
                  assetIds: selectedIds,
                  title: `Delete ${selectedIds.length} unused asset${selectedIds.length === 1 ? "" : "s"}?`,
                  description:
                    "This permanently removes the media record and all stored variants. Attached assets cannot be bulk deleted.",
                });
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Delete selected
            </Button>
          </div>
        </div>

        {(isLoading || isRefetching) && assets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-muted-foreground text-sm">
            Loading media…
          </div>
        ) : assets.length === 0 ? (
          <MediaLibraryEmptyState
            title="No media matches these filters"
            description="Try adjusting your search or upload new media above."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => (
              <MediaAssetCard
                key={asset.id}
                asset={asset}
                mode="manage"
                isSelected={selectedIds.includes(asset.id)}
                selectionDisabled={!asset.canDelete}
                onToggleSelect={toggleSelection}
                onSaveAlt={handleSaveAlt}
                onDelete={(selectedAsset) => {
                  setDeleteState({
                    assetIds: [selectedAsset.id],
                    title: `Delete ${selectedAsset.originalFilename}?`,
                    description:
                      "This permanently removes the media record and all stored variants. Attached assets must be detached before deletion.",
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={deleteState !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleteState(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteState?.title ?? "Delete media?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteState?.description ?? "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
