import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import VideoPlayer from "@/components/recitation/VideoPlayer";
import RecitationChecker from "@/components/recitation/RecitationChecker";
import SelfieMirror from "@/components/recitation/SelfieMirror";
import RankingWidget from "@/components/recitation/RankingWidget";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const { toast } = useToast();

  const handleRecitationComplete = (score: number, mistakes: number) => {
    toast({
      title: "Recitation Complete!",
      description: `You scored ${score}/100 with ${mistakes} mistakes. +1 point earned!`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Practice and perfect your Qur'an recitation</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Part 1: Video Section */}
          <div className="min-h-[400px]">
            <VideoPlayer onSelectVideo={setSelectedVideo} />
          </div>

          {/* Part 2: Recitation & Checking Section */}
          <div className="min-h-[400px]">
            <RecitationChecker
              arabicText={selectedVideo?.arabic_text || ""}
              onComplete={handleRecitationComplete}
            />
          </div>

          {/* Part 3: Selfie Mirror */}
          <div className="min-h-[300px]">
            <SelfieMirror />
          </div>

          {/* Part 4: Rankings */}
          <div className="min-h-[300px]">
            <RankingWidget />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
