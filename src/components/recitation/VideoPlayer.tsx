import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Lock, Clock, Eye, CheckCircle, Loader2, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const handleVideoChange = (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      setSelectedVideo(video);
      onSelectVideo(video);
      setIsPlaying(false);
    }
  };

  const handleUnlockVideo = async (video: VideoItem) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to unlock videos.", variant: "destructive" });
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
        {/* Surah Selection Dropdown */}
        <Select
          value={selectedVideo?.id}
          onValueChange={handleVideoChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a Surah to watch" />
          </SelectTrigger>
          <SelectContent>
            {videos.length === 0 && (
              <SelectItem value="none" disabled>
                No videos available
              </SelectItem>
            )}
            {videos.map((video) => {
              const unlocked = isUnlocked(video);
              return (
                <SelectItem key={video.id} value={video.id}>
                  <span className="flex items-center gap-2">
                    {!unlocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                    {unlocked && <CheckCircle className="w-3 h-3 text-primary" />}
                    {video.title}
                    {!unlocked && video.unlock_fee > 0 && (
                      <span className="text-xs text-muted-foreground">(₦{video.unlock_fee})</span>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Unlock Gate */}
        {selectedVideo && !isUnlocked(selectedVideo) && (
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {/* Thumbnail Background (blurred) */}
            {selectedVideo.thumbnail_url ? (
              <>
                <img
                  src={selectedVideo.thumbnail_url}
                  alt={selectedVideo.title}
                  className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20" />
            )}
            
            {/* Lock Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white drop-shadow-lg">{selectedVideo.title}</h3>
              <p className="text-sm text-white/90 mb-4 max-w-md drop-shadow">
                Unlock this surah to watch the recitation and start practicing.
              </p>
              <Button
                onClick={() => handleUnlockVideo(selectedVideo)}
                disabled={isUnlocking}
                className="gap-2 shadow-lg"
                size="lg"
              >
                {isUnlocking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
                Unlock for ₦{selectedVideo.unlock_fee}
              </Button>
              <p className="text-xs text-white/80 mt-3 drop-shadow">
                Balance: ₦{Number(profile?.money_balance || 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Video Player - only when unlocked */}
        {selectedVideo && isUnlocked(selectedVideo) && (
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {isPlaying ? (
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
                {/* Thumbnail Background */}
                {selectedVideo.thumbnail_url ? (
                  <img
                    src={selectedVideo.thumbnail_url}
                    alt={selectedVideo.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-lg drop-shadow-lg">
                    {selectedVideo.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    {selectedVideo.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {selectedVideo.views.toLocaleString()} views
                    </span>
                  </div>
                </div>
                
                {/* Play Button */}
                <button
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center hover:bg-black/10 transition-colors group"
                >
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-primary-foreground ml-1" />
                  </div>
                </button>
              </>
            )}
          </div>
        )}

        {/* No video selected */}
        {!selectedVideo && (
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center text-muted-foreground">
            No videos available yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoPlayer;
