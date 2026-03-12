import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Search,
  Loader2,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Stream {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number;
  views: number;
  likes: number;
  type: string;
  is_public: boolean;
  created_at: string;
  profiles: {
    name: string;
    avatar_url: string | null;
  };
}

const Streaming = () => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [likedStreams, setLikedStreams] = useState<Set<string>>(new Set());
  const [paidStreams, setPaidStreams] = useState<Set<string>>(new Set());
  const [paying, setPaying] = useState(false);

  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const fetchStreams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("streams")
      .select("*, profiles(name, avatar_url)")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (data && !error) {
      setStreams(data as unknown as Stream[]);
    }
    setLoading(false);
  };

  const fetchLikedStreams = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("stream_likes")
      .select("stream_id")
      .eq("user_id", user.id);

    if (data) {
      setLikedStreams(new Set(data.map((l) => l.stream_id)));
    }
  };

  const fetchPaidStreams = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("stream_views")
      .select("stream_id")
      .eq("user_id", user.id);

    if (data) {
      setPaidStreams(new Set(data.map((v) => v.stream_id)));
    }
  };

  useEffect(() => {
    fetchStreams();
    fetchLikedStreams();
    fetchPaidStreams();

    const channel = supabase
      .channel("streams-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "streams" },
        () => fetchStreams()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLike = async (streamId: string) => {
    if (!user) return;

    const isLiked = likedStreams.has(streamId);

    if (isLiked) {
      await supabase
        .from("stream_likes")
        .delete()
        .eq("stream_id", streamId)
        .eq("user_id", user.id);

      await supabase
        .from("streams")
        .update({ likes: Math.max(0, (streams.find(s => s.id === streamId)?.likes || 1) - 1) })
        .eq("id", streamId);

      setLikedStreams((prev) => {
        const next = new Set(prev);
        next.delete(streamId);
        return next;
      });
    } else {
      await supabase
        .from("stream_likes")
        .insert({ stream_id: streamId, user_id: user.id });

      await supabase
        .from("streams")
        .update({ likes: (streams.find(s => s.id === streamId)?.likes || 0) + 1 })
        .eq("id", streamId);

      setLikedStreams((prev) => new Set(prev).add(streamId));
    }

    fetchStreams();
  };

  const handleView = async (streamId: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to watch videos.", variant: "destructive" });
      return;
    }

    // If already paid, just play
    if (paidStreams.has(streamId)) {
      setPlayingVideo(streamId);
      return;
    }

    setPaying(true);
    try {
      const { data, error } = await supabase.rpc("pay_stream_view", {
        _user_id: user.id,
        _stream_id: streamId,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; already_paid?: boolean; fee?: number; required?: number; balance?: number };

      if (!result.success) {
        if (result.error === 'Insufficient balance') {
          toast({
            title: "Insufficient Balance",
            description: `You need ₦${result.required} but have ₦${Number(result.balance).toLocaleString()}. Fund your wallet first.`,
            variant: "destructive",
          });
        } else {
          toast({ title: result.error || "Payment failed", variant: "destructive" });
        }
        return;
      }

      if (!result.already_paid && result.fee) {
        toast({ title: "₦3 Deducted", description: "₦3 has been deducted to watch this video." });
      }

      setPaidStreams((prev) => new Set(prev).add(streamId));
      setPlayingVideo(streamId);
      if (refreshProfile) refreshProfile();

      // Update view count
      const stream = streams.find((s) => s.id === streamId);
      if (stream) {
        await supabase
          .from("streams")
          .update({ views: (stream.views || 0) + 1 })
          .eq("id", streamId);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const filteredStreams = streams.filter((stream) => {
    const matchesSearch =
      stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "mine" && stream.user_id === user?.id) ||
      (activeTab === "recitations" && stream.type === "recitation");
    return matchesSearch && matchesTab;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Streaming</h1>
          <p className="text-muted-foreground text-sm">
            Watch and share Qur'an recitations from the community
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search streams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="recitations">Recitations</TabsTrigger>
              <TabsTrigger value="mine">My Videos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Video Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStreams.map((stream) => (
              <Card
                key={stream.id}
                className="overflow-hidden group hover:shadow-glow transition-all"
              >
                {/* Video / Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {playingVideo === stream.id ? (
                    <div className="relative w-full h-full">
                      <video
                        src={stream.video_url}
                        controls
                        autoPlay
                        className="w-full h-full object-contain bg-foreground/5"
                      />
                      <button
                        onClick={() => setPlayingVideo(null)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-foreground/70 flex items-center justify-center hover:bg-foreground/90 transition-colors"
                      >
                        <X className="w-4 h-4 text-background" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                        <Play className="w-12 h-12 text-primary/30" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-foreground/80 text-background text-xs px-2 py-0.5 rounded">
                        {formatDuration(stream.duration || 0)}
                      </div>
                      {!paidStreams.has(stream.id) && (
                        <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded font-medium">
                          ₦3 to watch
                        </div>
                      )}
                      <button
                        onClick={() => handleView(stream.id)}
                        disabled={paying}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-glow">
                          {paying ? (
                            <Loader2 className="w-6 h-6 text-primary-foreground animate-spin" />
                          ) : (
                            <Play className="w-6 h-6 text-primary-foreground ml-1" />
                          )}
                        </div>
                      </button>
                    </>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarImage src={stream.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {stream.profiles?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground text-sm truncate">
                        {stream.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {stream.profiles?.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {(stream.views || 0).toLocaleString()}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(stream.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactions */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => handleLike(stream.id)}
                      className={`flex items-center gap-1 transition-colors ${
                        likedStreams.has(stream.id)
                          ? "text-destructive"
                          : "text-muted-foreground hover:text-destructive"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          likedStreams.has(stream.id) ? "fill-current" : ""
                        }`}
                      />
                      <span className="text-xs">{stream.likes || 0}</span>
                    </button>
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span className="text-xs">Share</span>
                    </button>
                    {stream.type === "recitation" && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Recitation
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredStreams.length === 0 && (
          <div className="text-center py-12">
            <Play className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No streams yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Record from Selfie Mirror on the Dashboard to post your first stream!
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Streaming;
