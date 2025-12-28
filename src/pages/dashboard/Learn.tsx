import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Lock, 
  Clock, 
  Eye, 
  CheckCircle, 
  Search,
  BookOpen,
  Trophy,
  Loader2,
  X
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  arabic_text: string;
  unlock_fee: number;
  duration: number | null;
  views: number;
  created_at: string;
}

interface UserRecitation {
  video_id: string;
  score: number;
}

const Learn = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [userRecitations, setUserRecitations] = useState<UserRecitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setVideos(data);
    }
    setIsLoading(false);
  };

  const fetchUserRecitations = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("recitations")
      .select("video_id, score")
      .eq("user_id", user.id);

    if (data) {
      setUserRecitations(data);
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchUserRecitations();
  }, [user]);

  const isVideoUnlocked = (video: Video) => {
    if (video.unlock_fee === 0) return true;
    // Check if user has enough balance or has already unlocked
    return (profile?.money_balance || 0) >= video.unlock_fee;
  };

  const isVideoCompleted = (videoId: string) => {
    return userRecitations.some(r => r.video_id === videoId && r.score >= 70);
  };

  const getVideoScore = (videoId: string) => {
    const recitation = userRecitations.find(r => r.video_id === videoId);
    return recitation?.score;
  };

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || 
      (activeTab === "unlocked" && isVideoUnlocked(video)) ||
      (activeTab === "completed" && isVideoCompleted(video.id));
    return matchesSearch && matchesTab;
  });

  const completedCount = videos.filter(v => isVideoCompleted(v.id)).length;
  const unlockedCount = videos.filter(v => isVideoUnlocked(v)).length;
  const progress = videos.length > 0 ? (completedCount / videos.length) * 100 : 0;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayVideo = (video: Video) => {
    if (!isVideoUnlocked(video)) {
      toast({
        title: "Video Locked",
        description: `This video requires ₦${video.unlock_fee} to unlock.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
    setIsPlaying(true);

    // Increment view count
    supabase
      .from("videos")
      .update({ views: video.views + 1 })
      .eq("id", video.id)
      .then();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Progress */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Learn</h1>
            <p className="text-muted-foreground">
              Master Qur'an recitation with guided video lessons
            </p>
          </div>
          <Card className="p-4 min-w-[200px]">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-lg font-bold">{completedCount}/{videos.length} Complete</p>
              </div>
            </div>
            <Progress value={progress} className="mt-2" />
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({videos.length})</TabsTrigger>
              <TabsTrigger value="unlocked">Unlocked ({unlockedCount})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
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
            <p className="text-muted-foreground">No lessons found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => {
              const unlocked = isVideoUnlocked(video);
              const completed = isVideoCompleted(video.id);
              const score = getVideoScore(video.id);

              return (
                <Card 
                  key={video.id} 
                  className={`overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                    !unlocked ? 'opacity-75' : ''
                  }`}
                  onClick={() => handlePlayVideo(video)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-muted">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Overlay */}
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
                    <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {video.views.toLocaleString()}
                      </span>
                      {score && (
                        <span className="flex items-center gap-1 text-primary">
                          Score: {score}%
                        </span>
                      )}
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
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10 bg-foreground/50 hover:bg-foreground/70 text-background"
                  onClick={() => setIsVideoModalOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
                <video
                  src={selectedVideo.video_url}
                  controls
                  autoPlay
                  className="w-full aspect-video"
                />
                <div className="p-4">
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {selectedVideo.title}
                  </h2>
                  <div className="font-arabic text-2xl text-center p-4 bg-muted rounded-lg" dir="rtl">
                    {selectedVideo.arabic_text}
                  </div>
                  {selectedVideo.description && (
                    <p className="text-muted-foreground mt-4">
                      {selectedVideo.description}
                    </p>
                  )}
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