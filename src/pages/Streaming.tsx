import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye, 
  Lock,
  Search,
  Filter,
  Upload,
  User
} from "lucide-react";

interface StreamingVideo {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  title: string;
  thumbnail?: string;
  duration: string;
  views: number;
  likes: number;
  comments: number;
  unlockFee: number;
  isUnlocked: boolean;
  type: "recitation" | "upload";
  createdAt: string;
}

const mockVideos: StreamingVideo[] = [
  {
    id: "1",
    user: { name: "Ahmad Ibrahim" },
    title: "My Surah Al-Fatiha Recitation",
    duration: "3:45",
    views: 1542,
    likes: 234,
    comments: 45,
    unlockFee: 0,
    isUnlocked: true,
    type: "recitation",
    createdAt: "2 hours ago",
  },
  {
    id: "2",
    user: { name: "Fatima Yusuf" },
    title: "Beautiful Surah Ar-Rahman",
    duration: "12:30",
    views: 3240,
    likes: 567,
    comments: 89,
    unlockFee: 3,
    isUnlocked: false,
    type: "upload",
    createdAt: "5 hours ago",
  },
  {
    id: "3",
    user: { name: "Usman Mohammed" },
    title: "Learning Tajweed - Week 1",
    duration: "8:15",
    views: 892,
    likes: 156,
    comments: 23,
    unlockFee: 3,
    isUnlocked: false,
    type: "upload",
    createdAt: "1 day ago",
  },
  {
    id: "4",
    user: { name: "Aisha Bello" },
    title: "Surah Al-Mulk Complete",
    duration: "15:20",
    views: 2150,
    likes: 412,
    comments: 67,
    unlockFee: 0,
    isUnlocked: true,
    type: "recitation",
    createdAt: "2 days ago",
  },
  {
    id: "5",
    user: { name: "Ibrahim Hassan" },
    title: "My Journey - 100 Days Challenge",
    duration: "5:45",
    views: 1876,
    likes: 298,
    comments: 54,
    unlockFee: 3,
    isUnlocked: false,
    type: "upload",
    createdAt: "3 days ago",
  },
  {
    id: "6",
    user: { name: "Maryam Suleiman" },
    title: "Tips for Better Recitation",
    duration: "7:30",
    views: 4521,
    likes: 823,
    comments: 112,
    unlockFee: 0,
    isUnlocked: true,
    type: "upload",
    createdAt: "1 week ago",
  },
];

const Streaming = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredVideos = mockVideos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || 
      (activeTab === "recitations" && video.type === "recitation") ||
      (activeTab === "uploads" && video.type === "upload") ||
      (activeTab === "free" && video.unlockFee === 0);
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Streaming Home</h1>
              <p className="text-muted-foreground mt-1">
                Watch and share Qur'an recitations from the community
              </p>
            </div>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Video
            </Button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="recitations">Recitations</TabsTrigger>
                <TabsTrigger value="uploads">Uploads</TabsTrigger>
                <TabsTrigger value="free">Free</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden group hover:shadow-glow transition-all">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                    <Play className="w-12 h-12 text-primary/30" />
                  </div>
                  {!video.isUnlocked && (
                    <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center text-primary-foreground">
                        <Lock className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">₦{video.unlockFee} to unlock</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-foreground/80 text-primary-foreground text-xs px-2 py-0.5 rounded">
                    {video.duration}
                  </div>
                  <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-glow">
                      <Play className="w-6 h-6 text-primary-foreground ml-1" />
                    </div>
                  </button>
                </div>

                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {video.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{video.user.name}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.views.toLocaleString()}
                        </span>
                        <span>{video.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Interaction Stats */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors">
                      <Heart className="w-4 h-4" />
                      <span className="text-xs">{video.likes}</span>
                    </button>
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-xs">{video.comments}</span>
                    </button>
                    <button className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span className="text-xs">Share</span>
                    </button>
                    {video.type === "recitation" && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        AI Checked
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVideos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No videos found matching your search.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Streaming;
