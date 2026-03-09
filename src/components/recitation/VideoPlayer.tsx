import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Lock, Clock, Eye, CheckCircle, Loader2, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VideoItem {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration: number | null;
  views: number;
  unlock_fee: number;
  arabic_text: string;
  video_url: string;
}

interface VideoPlayerProps {
  onSelectVideo: (video: VideoItem) => void;
}

const VideoPlayer = ({ onSelectVideo }: VideoPlayerProps) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlockedVideoIds, setUnlockedVideoIds] = useState<Set<string>>(new Set());
  const [isUnlocking, setIsUnlocking] = useState(false);
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const fetchUnlockedVideos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("description")
      .eq("user_id", user.id)
      .eq("category", "video_unlock")
      .eq("status", "completed");

    if (data) {
      const ids = new Set<string>();
      data.forEach((tx) => {
        const match = tx.description?.match(/Unlocked video: (.+)/);
        if (match) ids.add(match[1]);
      });
      setUnlockedVideoIds(ids);
    }
  };

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url, duration, views, unlock_fee, arabic_text, video_url")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setVideos(data);
        setSelectedVideo(data[0]);
        onSelectVideo(data[0]);
      }
      setLoading(false);
    };
    fetchVideos();
    fetchUnlockedVideos();
  }, [user]);

  const isUnlocked = (video: VideoItem) => {
    if (!video.unlock_fee || video.unlock_fee === 0) return true;
    return unlockedVideoIds.has(video.id);
  };

  const handleVideoSelect = (video: VideoItem) => {
    if (!isUnlocked(video)) {
      toast({
        title: "Video Locked",
        description: "Please unlock this surah to watch and practice.",
        variant: "destructive",
      });
      return;
    }
    setSelectedVideo(video);
    onSelectVideo(video);
    setIsPlaying(false);
  };

  const handleUnlockVideo = async (video: VideoItem) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to unlock videos.",
        variant: "destructive",
      });
      return;
    }
    setIsUnlocking(true);
    try {
      const { data, error } = await supabase.rpc("unlock_video", {
        _user_id: user.id,
        _video_id: video.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; fee?: number; required?: number; balance?: number; already_unlocked?: boolean };

      if (!result.success) {
        if (result.error === 'Insufficient balance') {
          toast({
            title: "Insufficient Balance",
            description: `You need ₦${result.required} but have ₦${Number(result.balance).toLocaleString()}. Fund your wallet first.`,
            variant: "destructive",
          });
        } else {
          toast({ title: result.error || "Failed to unlock", variant: "destructive" });
        }
        return;
      }

      toast({
        title: result.fee === 0 || result.already_unlocked ? "Video Ready!" : "Video Unlocked!",
        description: result.fee && result.fee > 0 ? `₦${result.fee} deducted from your wallet` : "This video is free to access",
      });

      await fetchUnlockedVideos();
      if (refreshProfile) refreshProfile();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUnlocking(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("embed/")[1].split("?")[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

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
            !isUnlocked(selectedVideo) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-6 text-center">
                <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-bold mb-2">{selectedVideo.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Unlock this surah to watch the recitation and start practicing.
                </p>
                <Button
                  onClick={() => handleUnlockVideo(selectedVideo)}
                  disabled={isUnlocking}
                  className="gap-2"
                >
                  {isUnlocking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                  Unlock for ₦{selectedVideo.unlock_fee}
                </Button>
              </div>
            ) : isPlaying ? (
              selectedVideo.video_url.includes("youtube.com") || selectedVideo.video_url.includes("youtu.be") ? (
                <iframe
                  src={getYouTubeEmbedUrl(selectedVideo.video_url)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={selectedVideo.video_url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <>
                <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                  <div className="text-center">
                    <div className="font-arabic text-2xl text-primary mb-2">
                      {selectedVideo.title}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center hover:bg-foreground/5 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-glow">
                    <Play className="w-8 h-8 text-primary-foreground ml-1" />
                  </div>
                </button>
              </>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No videos available yet
            </div>
          )}
        </div>

        {/* Video List */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {videos.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No videos uploaded yet. Admin can add videos.
            </p>
          )}
          {videos.map((video) => {
            const unlocked = isUnlocked(video);
            return (
              <button
                key={video.id}
                onClick={() => handleVideoSelect(video)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedVideo?.id === video.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                } ${!unlocked && "opacity-60"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    {unlocked ? (
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
                      {unlocked && (
                        <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(video.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {(video.views || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {!unlocked && (
                    <Badge variant="secondary" className="text-xs">
                      ₦{video.unlock_fee}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
