import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Play, Lock, Clock, Eye, CheckCircle, Search, BookOpen, Trophy, Loader2, X, ExternalLink
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface LearningVideo {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  unlock_fee: number;
  duration: number | null;
  views: number | null;
  category: string | null;
  order_index: number | null;
}

interface VideoProgress {
  learning_video_id: string;
  is_completed: boolean | null;
  watch_progress: number | null;
}

const extractYouTubeId = (url: string) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const Learn = () => {
  const [videos, setVideos] = useState<LearningVideo[]>([]);
  const [progress, setProgress] = useState<VideoProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState<LearningVideo | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("learning_videos")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });
    if (data && !error) setVideos(data);
    setIsLoading(false);
  };

  const fetchProgress = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_video_progress")
      .select("learning_video_id, is_completed, watch_progress")
      .eq("user_id", user.id);
    if (data) setProgress(data);
  };

  useEffect(() => {
    fetchVideos();
    fetchProgress();
  }, [user]);

  const isVideoUnlocked = (video: LearningVideo) =>
    video.unlock_fee === 0 || (profile?.money_balance || 0) >= video.unlock_fee;

  const isVideoCompleted = (videoId: string) =>
    progress.some(p => p.learning_video_id === videoId && p.is_completed);

  const handlePlayVideo = async (video: LearningVideo) => {
    if (!isVideoUnlocked(video)) {
      toast({
        title: "Video Locked",
        description: `This video requires ₦${video.unlock_fee} to unlock. Fund your wallet to continue.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedVideo(video);
    setIsVideoModalOpen(true);

    // Increment view count
    await supabase
      .from("learning_videos")
      .update({ views: (video.views || 0) + 1 })
      .eq("id", video.id);

    // Ensure progress record exists
    if (user) {
      await supabase
        .from("user_video_progress")
        .upsert({ user_id: user.id, learning_video_id: video.id }, { onConflict: "user_id,learning_video_id" });
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedVideo || !user) return;
    setIsMarkingComplete(true);
    try {
      await supabase
        .from("user_video_progress")
        .upsert(
          { user_id: user.id, learning_video_id: selectedVideo.id, is_completed: true, completed_at: new Date().toISOString() },
          { onConflict: "user_id,learning_video_id" }
        );
      toast({ title: "🎉 Marked as complete!", description: "Great job! Keep learning." });
      fetchProgress();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "unlocked" && isVideoUnlocked(video)) ||
      (activeTab === "completed" && isVideoCompleted(video.id));
    return matchesSearch && matchesTab;
  });

  const completedCount = videos.filter(v => isVideoCompleted(v.id)).length;
  const unlockedCount = videos.filter(v => isVideoUnlocked(v)).length;
  const progressPct = videos.length > 0 ? (completedCount / videos.length) * 100 : 0;

  const selectedVideoYtId = selectedVideo ? extractYouTubeId(selectedVideo.youtube_url) : null;
  const selectedVideoCompleted = selectedVideo ? isVideoCompleted(selectedVideo.id) : false;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Learn</h1>
            <p className="text-sm text-muted-foreground mt-1">Master Qur'an recitation with guided lessons</p>
          </div>
          <Card className="p-4 min-w-[200px] md:min-w-[240px]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-lg font-bold text-foreground">{completedCount}/{videos.length} Complete</p>
              </div>
            </div>
            <Progress value={progressPct} className="mt-3" />
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All ({videos.length})</TabsTrigger>
              <TabsTrigger value="unlocked" className="text-xs sm:text-sm">Unlocked ({unlockedCount})</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm">Done ({completedCount})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Video Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">No lessons found</p>
            {videos.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">Learning videos will appear here once the admin adds them.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredVideos.map((video) => {
              const unlocked = isVideoUnlocked(video);
              const completed = isVideoCompleted(video.id);
              const ytId = extractYouTubeId(video.youtube_url);
              const thumb = ytId
                ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                : video.thumbnail_url;

              return (
                <Card
                  key={video.id}
                  className={`overflow-hidden transition-all hover:shadow-lg cursor-pointer ${!unlocked ? "opacity-75" : ""}`}
                  onClick={() => handlePlayVideo(video)}
                >
                  <div className="relative aspect-video bg-muted">
                    {thumb ? (
                      <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      {unlocked ? (
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                          <Play className="w-7 h-7 text-primary-foreground ml-1" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                          <Lock className="w-7 h-7 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Duration Badge */}
                    {video.duration && (
                      <Badge variant="secondary" className="absolute bottom-2 right-2 gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(video.duration)}
                      </Badge>
                    )}

                    {/* Completed Badge */}
                    {completed && (
                      <Badge className="absolute top-2 right-2 bg-success text-success-foreground gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </Badge>
                    )}

                    {/* Lock Badge */}
                    {!unlocked && (
                      <Badge variant="destructive" className="absolute top-2 left-2 gap-1">
                        <Lock className="w-3 h-3" />
                        ₦{video.unlock_fee}
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    {video.category && (
                      <Badge variant="secondary" className="text-xs mb-2 capitalize">
                        {video.category.replace(/_/g, " ")}
                      </Badge>
                    )}
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{video.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {(video.views || 0).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Video Player Modal */}
        <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
          <DialogContent className="max-w-4xl p-0">
            {selectedVideo && (
              <div>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 bg-foreground/50 hover:bg-foreground/70 text-background"
                    onClick={() => setIsVideoModalOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>

                  {/* YouTube Embed */}
                  {selectedVideoYtId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${selectedVideoYtId}?autoplay=1`}
                      className="w-full aspect-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full aspect-video bg-muted flex items-center justify-center">
                      <p className="text-muted-foreground">Unable to load video</p>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{selectedVideo.title}</h2>
                      {selectedVideo.description && (
                        <p className="text-muted-foreground text-sm mt-1">{selectedVideo.description}</p>
                      )}
                    </div>
                    {selectedVideoCompleted ? (
                      <Badge className="bg-success text-success-foreground gap-1 flex-shrink-0">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleMarkComplete}
                        disabled={isMarkingComplete}
                        className="flex-shrink-0"
                      >
                        {isMarkingComplete ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Learn;
