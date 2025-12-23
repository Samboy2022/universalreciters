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
      <div className="h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Part 1: Video Section */}
        <div className="lg:row-span-1">
          <VideoPlayer onSelectVideo={setSelectedVideo} />
        </div>

        {/* Part 2: Recitation & Checking Section */}
        <div className="lg:row-span-1">
          <RecitationChecker
            arabicText={selectedVideo?.arabicText || ""}
            onComplete={handleRecitationComplete}
          />
        </div>

        {/* Part 3: Selfie Mirror */}
        <div className="lg:row-span-1">
          <SelfieMirror />
        </div>

        {/* Part 4: Rankings */}
        <div className="lg:row-span-1">
          <RankingWidget />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
