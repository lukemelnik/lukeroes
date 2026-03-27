import { useEffect, useMemo, useState } from "react";
import type { AdminMediaAsset, MediaType } from "@/lib/media";
import {
  MediaAssetCard,
  MediaLibraryEmptyState,
  MediaLibraryFiltersBar,
  MediaUploadPanel,
  SelectedMediaOrderList,
  type MediaLibraryFiltersValue,
  useAdminMediaLibrary,
} from "@/components/admin/media-library-shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (assets: AdminMediaAsset[]) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  allowedTypes?: MediaType[];
  multiSelect?: boolean;
  initialSelectedAssets?: AdminMediaAsset[];
}

function createInitialFilters(allowedTypes: MediaType[]): MediaLibraryFiltersValue {
  return {
    search: "",
    type: allowedTypes.length === 1 ? allowedTypes[0] : "all",
    access: "all",
  };
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Choose media",
  description = "Browse the library, upload new media, and select the assets you want to use.",
  confirmLabel = "Use selected media",
  allowedTypes = ["image", "audio"],
  multiSelect = false,
  initialSelectedAssets = [],
}: MediaPickerDialogProps) {
  const [filters, setFilters] = useState<MediaLibraryFiltersValue>(() =>
    createInitialFilters(allowedTypes),
  );
  const [selectedAssets, setSelectedAssets] = useState<AdminMediaAsset[]>(initialSelectedAssets);
  const {
    data: assets = [],
    isLoading,
    isRefetching,
    refetch,
  } = useAdminMediaLibrary(filters, {
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setSelectedAssets(initialSelectedAssets);
      setFilters(createInitialFilters(allowedTypes));
    }
  }, [allowedTypes, initialSelectedAssets, open]);

  useEffect(() => {
    if (assets.length === 0 || selectedAssets.length === 0) {
      return;
    }

    const nextSelectedAssets = selectedAssets.map((selectedAsset) => {
      const latestAsset = assets.find((asset) => asset.id === selectedAsset.id);

      return latestAsset ?? selectedAsset;
    });

    const hasChanged = nextSelectedAssets.some(
      (asset, index) =>
        asset.id !== selectedAssets[index]?.id ||
        asset.updatedAt !== selectedAssets[index]?.updatedAt,
    );

    if (hasChanged) {
      setSelectedAssets(nextSelectedAssets);
    }
  }, [assets, selectedAssets]);

  const selectedIds = useMemo(
    () => new Set(selectedAssets.map((asset) => asset.id)),
    [selectedAssets],
  );

  function toggleSelection(asset: AdminMediaAsset) {
    if (asset.status !== "ready") {
      return;
    }

    setSelectedAssets((currentAssets) => {
      const isAlreadySelected = currentAssets.some((currentAsset) => currentAsset.id === asset.id);

      if (isAlreadySelected) {
        return currentAssets.filter((currentAsset) => currentAsset.id !== asset.id);
      }

      if (!multiSelect) {
        return [asset];
      }

      return [...currentAssets, asset];
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden p-0" showCloseButton={false}>
        <div className="flex h-full max-h-[90vh] flex-col">
          <DialogHeader className="border-b border-border/70 px-6 py-5">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <MediaUploadPanel
                allowedTypes={allowedTypes}
                onUploadComplete={async () => {
                  await refetch();
                }}
              />
              <MediaLibraryFiltersBar
                filters={filters}
                onFiltersChange={setFilters}
                allowedTypes={allowedTypes}
              />
              {multiSelect && (
                <SelectedMediaOrderList assets={selectedAssets} onChange={setSelectedAssets} />
              )}
              {(isLoading || isRefetching) && assets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-muted-foreground text-sm">
                  Loading media…
                </div>
              ) : assets.length === 0 ? (
                <MediaLibraryEmptyState
                  title="No media available"
                  description="Upload media above or adjust your filters to find existing assets."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {assets.map((asset) => (
                    <MediaAssetCard
                      key={asset.id}
                      asset={asset}
                      mode="pick"
                      isSelected={selectedIds.has(asset.id)}
                      selectionDisabled={asset.status !== "ready"}
                      onToggleSelect={toggleSelection}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border/70 px-6 py-5">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                {selectedAssets.length} asset{selectedAssets.length === 1 ? "" : "s"} selected
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    onConfirm(selectedAssets);
                    onOpenChange(false);
                  }}
                  disabled={selectedAssets.length === 0}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
