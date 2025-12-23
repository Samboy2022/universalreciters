import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Lock, Clock, Eye, CheckCircle } from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  thumbnail?: string;
  duration: string;
  views: number;
  unlockFee: number;
  isUnlocked: boolean;
  surah: string;
  ayah: string;
}

const mockVideos: VideoItem[] = [
  {
    id: "1",
    title: "Surah Al-Fatiha - Complete",
    duration: "3:45",
    views: 15420,
    unlockFee: 0,
    isUnlocked: true,
    surah: "Al-Fatiha",
    ayah: "1-7",
  },
  {
    id: "2",
    title: "Surah Al-Ikhlas",
    duration: "1:30",
    views: 12350,
    unlockFee: 0,
    isUnlocked: true,
    surah: "Al-Ikhlas",
    ayah: "1-4",
  },
  {
    id: "3",
    title: "Surah Al-Falaq",
    duration: "2:15",
    views: 9870,
    unlockFee: 30,
    isUnlocked: false,
    surah: "Al-Falaq",
    ayah: "1-5",
  },
  {
    id: "4",
    title: "Surah An-Nas",
    duration: "2:45",
    views: 8540,
    unlockFee: 30,
    isUnlocked: false,
    surah: "An-Nas",
    ayah: "1-6",
  },
];

interface VideoPlayerProps {
  onSelectVideo: (video: VideoItem) => void;
}

const VideoPlayer = ({ onSelectVideo }: VideoPlayerProps) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(mockVideos[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVideoSelect = (video: VideoItem) => {
    setSelectedVideo(video);
    onSelectVideo(video);
    setIsPlaying(false);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          Recitation Videos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Video Player */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {selectedVideo ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                <div className="text-center">
                  <div className="font-arabic text-2xl text-primary mb-2">
                    سورة {selectedVideo.surah}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedVideo.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 flex items-center justify-center hover:bg-foreground/5 transition-colors"
              >
                <div className={`w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-glow ${isPlaying ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                  <Play className="w-8 h-8 text-primary-foreground ml-1" />
                </div>
              </button>
              {isPlaying && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-foreground/80 backdrop-blur rounded-full h-1">
                    <div 
                      className="bg-primary h-full rounded-full animate-pulse" 
                      style={{ width: "35%" }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a video to start learning
            </div>
          )}
        </div>

        {/* Video List */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {mockVideos.map((video) => (
            <button
              key={video.id}
              onClick={() => video.isUnlocked && handleVideoSelect(video)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedVideo?.id === video.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              } ${!video.isUnlocked && "opacity-60"}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  {video.isUnlocked ? (
                    <Play className="w-5 h-5 text-primary" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {video.title}
                    </h4>
                    {video.isUnlocked && (
                      <CheckCircle className="w-3 h-3 text-success flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {video.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {video.views.toLocaleString()}
                    </span>
                  </div>
                </div>
                {!video.isUnlocked && (
                  <Badge variant="secondary" className="text-xs">
                    ₦{video.unlockFee}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
