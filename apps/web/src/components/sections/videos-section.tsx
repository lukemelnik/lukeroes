import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";
import { useVideos } from "@/hooks/use-videos";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function VideosSection() {
  const [isClient, setIsClient] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const { data: videos, isLoading, isError, error } = useVideos();

  useEffect(() => setIsClient(true), []);

  if (!isClient) {
    return (
      <section className="w-full py-16 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto flex items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="w-full py-16 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto flex items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="w-full py-16 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Videos</h2>
          <p className="text-muted-foreground">
            Could not load videos right now
            {error instanceof Error ? `: ${error.message}` : "."}
          </p>
        </div>
      </section>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <section className="w-full py-16 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Videos</h2>
          <p className="text-muted-foreground">
            No videos yet. Check back soon.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 px-4 md:px-6 bg-muted/30">
      <div className="container mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Videos</h2>
          <p className="text-muted-foreground">
            Watch music videos, live performances, and more
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {videos.map((video) => (
              <CarouselItem
                key={video.id}
                className="md:basis-1/2 lg:basis-1/3"
              >
                <Card
                  className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedVideoId(video.youtubeId)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-video">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 fill-primary-foreground text-primary-foreground ml-1" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {video.title}
                      </h3>
                      {video.publishedAt && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {new Date(video.publishedAt).toLocaleDateString(
                              "en-US",
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-12 hidden xl:flex" />
          <CarouselNext className="-right-12 hidden xl:flex" />
        </Carousel>
      </div>

      <Dialog
        open={!!selectedVideoId}
        onOpenChange={() => setSelectedVideoId(null)}
      >
        <DialogContent className="md:min-w-4xl max-w-6xl p-0">
          <div className="aspect-video w-full">
            {selectedVideoId && (
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1`}
                title="Selected video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
