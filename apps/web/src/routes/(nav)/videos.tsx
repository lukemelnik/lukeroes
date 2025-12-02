import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useVideos, videosQueryOptions } from "@/hooks/use-videos";
import { Spinner } from "@/components/ui/spinner";
import type { ApiVideo } from "@/hooks/use-videos";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/(nav)/videos")({
  component: VideosPageComponent,
  loader: async ({ context }) => {
    try {
      await context.queryClient.prefetchQuery(videosQueryOptions);
    } catch (err) {
      console.warn("Prefetch videos failed; will retry on client", err);
    }
    return null;
  },
});

function VideosPageComponent() {
  const {
    data: videos,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useVideos();
  const [isClient, setIsClient] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ApiVideo | null>(null);
  const [featuredVideo, setFeaturedVideo] = useState<ApiVideo | null>(null);
  const otherVideos = useMemo(
    () =>
      videos && featuredVideo
        ? videos.filter((v) => v.id !== featuredVideo.id)
        : [],
    [videos, featuredVideo],
  );

  useEffect(() => setIsClient(true), []);
  useEffect(() => {
    if (videos && videos.length > 0) {
      setFeaturedVideo((current) => current ?? videos[0]);
    }
  }, [videos]);

  const getThumbnailUrl = (youtubeId: string) => {
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  };

  if (!isClient || isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-6">
          <CardContent className="space-y-4 p-0">
            <div className="text-2xl font-bold">Videos unavailable</div>
            <p className="text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Could not load videos right now."}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button onClick={() => refetch()} disabled={isRefetching}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isRefetching ? "Retrying..." : "Try again"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!videos || videos.length === 0 || !featuredVideo) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-6">
          <CardContent className="space-y-4 p-0">
            <div className="text-2xl font-bold">No videos yet</div>
            <p className="text-muted-foreground">Check back soon for videos.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Featured Video */}
        <div className="mb-8 max-w-4xl mx-auto">
          <Card
            className="group cursor-pointer"
            onClick={() => setSelectedVideo(featuredVideo)}
          >
            <CardContent className="p-0">
              <div className="relative aspect-video">
                <img
                  src={
                    featuredVideo.thumbnailUrl ||
                    getThumbnailUrl(featuredVideo.youtubeId)
                  }
                  alt={featuredVideo.title}
                  className="w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="bg-primary/90 group-hover:bg-primary rounded-full p-6 transition-all transform group-hover:scale-110">
                    <Play className="w-12 h-12 fill-current" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h2 className="font-bold text-2xl mb-2">
                  {featuredVideo.title}
                </h2>
                {featuredVideo.publishedAt && (
                  <p className="text-sm text-muted-foreground">
                    {new Date(featuredVideo.publishedAt).toLocaleDateString(
                      "en-US",
                    )}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Thumbnail Grid */}
        <div>
          <h3 className="text-xl font-semibold mb-4">More Videos</h3>
          <ScrollArea className="h-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
              {otherVideos.map((video) => (
                <Card
                  key={video.id}
                  className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setSelectedVideo(video)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-video">
                      <img
                        src={
                          video.thumbnailUrl || getThumbnailUrl(video.youtubeId)
                        }
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="bg-primary/90 group-hover:bg-primary rounded-full p-4 transition-all transform group-hover:scale-110">
                          <Play className="w-8 h-8 fill-current" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                        {video.title}
                      </h3>
                      {video.publishedAt && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(video.publishedAt).toLocaleDateString(
                            "en-US",
                          )}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Video Modal */}
      <Dialog
        open={!!selectedVideo}
        onOpenChange={() => setSelectedVideo(null)}
      >
        <DialogContent className="md:min-w-4xl max-w-6xl p-0">
          <div className="aspect-video w-full">
            {selectedVideo && (
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
