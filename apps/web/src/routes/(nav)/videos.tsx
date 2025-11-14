import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/(nav)/videos")({
  component: VideosPageComponent,
});

interface Video {
  id: string;
  title: string;
  youtubeId: string;
  releaseDate: string;
  duration: string;
  description?: string;
}

const mockVideoData: Video[] = [
  {
    id: "1",
    title: "Latest Music Video",
    youtubeId: "dQw4w9WgXcQ", // Replace with your actual YouTube video ID
    releaseDate: "2024",
    duration: "3:45",
    description: "The official music video for my latest single",
  },
  {
    id: "2",
    title: "Behind The Scenes",
    youtubeId: "dQw4w9WgXcQ", // Replace with your actual YouTube video ID
    releaseDate: "2024",
    duration: "8:12",
    description: "A look behind the scenes of the album recording process",
  },
  {
    id: "3",
    title: "Live Performance",
    youtubeId: "dQw4w9WgXcQ", // Replace with your actual YouTube video ID
    releaseDate: "2023",
    duration: "4:30",
    description: "Live performance from my hometown show",
  },
  {
    id: "4",
    title: "Acoustic Session",
    youtubeId: "dQw4w9WgXcQ", // Replace with your actual YouTube video ID
    releaseDate: "2023",
    duration: "3:55",
  },
  {
    id: "5",
    title: "Studio Diary",
    youtubeId: "dQw4w9WgXcQ", // Replace with your actual YouTube video ID
    releaseDate: "2023",
    duration: "6:20",
  },
  {
    id: "6",
    title: "Tour Vlog",
    youtubeId: "dQw4w9WgXcQ", // Replace with your actual YouTube video ID
    releaseDate: "2022",
    duration: "10:15",
  },
];

function VideosPageComponent() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [featuredVideo] = useState<Video>(mockVideoData[0]);
  const otherVideos = mockVideoData.filter((v) => v.id !== featuredVideo.id);

  const getThumbnailUrl = (youtubeId: string) => {
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  };

  return (
    <div className="py-8 px-4 md:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Featured Video */}
        <div className="mb-8 max-w-4xl mx-auto">
          <Card className="group cursor-pointer" onClick={() => setSelectedVideo(featuredVideo)}>
            <CardContent className="p-0">
              <div className="relative aspect-video">
                <img
                  src={getThumbnailUrl(featuredVideo.youtubeId)}
                  alt={featuredVideo.title}
                  className="w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="bg-primary/90 group-hover:bg-primary rounded-full p-6 transition-all transform group-hover:scale-110">
                    <Play className="w-12 h-12 fill-current" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 bg-black/80 px-2 py-1 rounded text-sm">
                  {featuredVideo.duration}
                </div>
              </div>
              <div className="p-6">
                <h2 className="font-bold text-2xl mb-2">
                  {featuredVideo.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-2">
                  {featuredVideo.releaseDate}
                </p>
                {featuredVideo.description && (
                  <p className="text-muted-foreground">
                    {featuredVideo.description}
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
                        src={getThumbnailUrl(video.youtubeId)}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="bg-primary/90 group-hover:bg-primary rounded-full p-4 transition-all transform group-hover:scale-110">
                          <Play className="w-8 h-8 fill-current" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                        {video.duration}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {video.releaseDate}
                      </p>
                      {video.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {video.description}
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
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-5xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
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
          {selectedVideo?.description && (
            <div className="p-6 pt-4">
              <p className="text-muted-foreground">{selectedVideo.description}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
