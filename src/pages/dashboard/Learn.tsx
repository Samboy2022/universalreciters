import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Lock, 
  Clock, 
  Eye, 
  CheckCircle, 
  Search,
  BookOpen,
  Star,
  Trophy
} from "lucide-react";

interface LearningVideo {
  id: string;
  title: string;
  surah: string;
  ayah: string;
  duration: string;
  views: number;
  unlockFee: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  difficulty: "beginner" | "intermediate" | "advanced";
  arabicText: string;
}

const mockVideos: LearningVideo[] = [
  {
    id: "1",
    title: "Surah Al-Fatiha - Complete",
    surah: "Al-Fatiha",
    ayah: "1-7",
    duration: "3:45",
    views: 15420,
    unlockFee: 0,
    isUnlocked: true,
    isCompleted: true,
    difficulty: "beginner",
    arabicText: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
  },
  {
    id: "2",
    title: "Surah Al-Ikhlas",
    surah: "Al-Ikhlas",
    ayah: "1-4",
    duration: "1:30",
    views: 12350,
    unlockFee: 0,
    isUnlocked: true,
    isCompleted: false,
    difficulty: "beginner",
    arabicText: "قُلْ هُوَ اللَّهُ أَحَدٌ",
  },
  {
    id: "3",
    title: "Surah Al-Falaq",
    surah: "Al-Falaq",
    ayah: "1-5",
    duration: "2:15",
    views: 9870,
    unlockFee: 30,
    isUnlocked: false,
    isCompleted: false,
    difficulty: "beginner",
    arabicText: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",
  },
  {
    id: "4",
    title: "Surah An-Nas",
    surah: "An-Nas",
    ayah: "1-6",
    duration: "2:45",
    views: 8540,
    unlockFee: 30,
    isUnlocked: false,
    isCompleted: false,
    difficulty: "beginner",
    arabicText: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
  },
  {
    id: "5",
    title: "Surah Al-Baqarah - Ayat Kursi",
    surah: "Al-Baqarah",
    ayah: "255",
    duration: "5:20",
    views: 23100,
    unlockFee: 50,
    isUnlocked: false,
    isCompleted: false,
    difficulty: "intermediate",
    arabicText: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
  },
  {
    id: "6",
    title: "Surah Ya-Sin - First 10 Ayat",
    surah: "Ya-Sin",
    ayah: "1-10",
    duration: "8:15",
    views: 18500,
    unlockFee: 100,
    isUnlocked: false,
    isCompleted: false,
    difficulty: "advanced",
    arabicText: "يس وَالْقُرْآنِ الْحَكِيمِ",
  },
];

const Learn = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedVideo, setSelectedVideo] = useState<LearningVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const filteredVideos = mockVideos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.surah.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || 
      (activeTab === "unlocked" && video.isUnlocked) ||
      (activeTab === "completed" && video.isCompleted) ||
      video.difficulty === activeTab;
    return matchesSearch && matchesTab;
  });

  const completedCount = mockVideos.filter(v => v.isCompleted).length;
  const unlockedCount = mockVideos.filter(v => v.isUnlocked).length;
  const progress = (completedCount / mockVideos.length) * 100;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-success/10 text-success";
      case "intermediate": return "bg-warning/10 text-warning";
      case "advanced": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
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
                <p className="text-lg font-bold">{completedCount}/{mockVideos.length} Complete</p>
              </div>
            </div>
            <Progress value={progress} className="mt-2" />
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary" />
                  {selectedVideo ? selectedVideo.title : "Select a Lesson"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Video Player */}
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                  {selectedVideo ? (
                    <>
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                        <div className="text-center p-4">
                          <div className="font-arabic text-3xl text-primary mb-4" dir="rtl">
                            {selectedVideo.arabicText}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {selectedVideo.surah} ({selectedVideo.ayah})
                          </p>
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
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <BookOpen className="w-12 h-12 mb-2" />
                      <p>Select a lesson to start learning</p>
                    </div>
                  )}
                </div>

                {selectedVideo && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className={getDifficultyColor(selectedVideo.difficulty)}>
                      {selectedVideo.difficulty}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedVideo.duration}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Eye className="w-3 h-3" />
                      {selectedVideo.views.toLocaleString()} views
                    </Badge>
                    {selectedVideo.isCompleted && (
                      <Badge className="bg-success text-success-foreground gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Video List Section */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Lessons
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unlocked">Unlocked</TabsTrigger>
                    <TabsTrigger value="completed">Done</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px]">
                  {filteredVideos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => video.isUnlocked && setSelectedVideo(video)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedVideo?.id === video.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      } ${!video.isUnlocked && "opacity-60 cursor-not-allowed"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          {video.isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : video.isUnlocked ? (
                            <Play className="w-5 h-5 text-primary" />
                          ) : (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {video.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {video.duration}
                            </span>
                            <Badge variant="outline" className={`text-xs ${getDifficultyColor(video.difficulty)}`}>
                              {video.difficulty}
                            </Badge>
                          </div>
                        </div>
                        {!video.isUnlocked && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            ₦{video.unlockFee}
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}

                  {filteredVideos.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No lessons found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Learn;
