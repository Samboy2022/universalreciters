import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, MapPin } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar?: string;
  points: number;
  location: string;
}

const mockLeaderboard: Record<string, LeaderboardEntry[]> = {
  ward: [
    { rank: 1, name: "Ahmad Ibrahim", points: 2450, location: "Ward 3" },
    { rank: 2, name: "Fatima Yusuf", points: 2380, location: "Ward 3" },
    { rank: 3, name: "Usman Mohammed", points: 2120, location: "Ward 3" },
    { rank: 4, name: "Aisha Bello", points: 1890, location: "Ward 3" },
    { rank: 5, name: "Ibrahim Hassan", points: 1750, location: "Ward 3" },
  ],
  lga: [
    { rank: 1, name: "Musa Aliyu", points: 5420, location: "Gwale LGA" },
    { rank: 2, name: "Halima Sani", points: 5180, location: "Gwale LGA" },
    { rank: 3, name: "Yusuf Abdullahi", points: 4950, location: "Gwale LGA" },
    { rank: 4, name: "Amina Garba", points: 4720, location: "Gwale LGA" },
    { rank: 5, name: "Bashir Ismail", points: 4500, location: "Gwale LGA" },
  ],
  state: [
    { rank: 1, name: "Kabir Musa", points: 15420, location: "Kano" },
    { rank: 2, name: "Zainab Ahmed", points: 14850, location: "Kano" },
    { rank: 3, name: "Salisu Ibrahim", points: 13200, location: "Kano" },
    { rank: 4, name: "Hafsat Umar", points: 12800, location: "Kano" },
    { rank: 5, name: "Adamu Suleiman", points: 11500, location: "Kano" },
  ],
  country: [
    { rank: 1, name: "Ahmad Ibrahim", points: 25420, location: "Kano" },
    { rank: 2, name: "Fatima Yusuf", points: 24850, location: "Lagos" },
    { rank: 3, name: "Usman Mohammed", points: 23200, location: "Kaduna" },
    { rank: 4, name: "Aisha Bello", points: 22800, location: "Sokoto" },
    { rank: 5, name: "Ibrahim Hassan", points: 21500, location: "Borno" },
  ],
};

const RankingWidget = () => {
  const [activeTab, setActiveTab] = useState("ward");

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-accent" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs font-medium text-muted-foreground">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-accent/20";
    if (rank === 2) return "bg-secondary";
    if (rank === 3) return "bg-amber-100 dark:bg-amber-900/20";
    return "bg-muted/50";
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4 text-accent" />
          Rankings
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-4 h-8">
            <TabsTrigger value="ward" className="text-xs px-1">Ward</TabsTrigger>
            <TabsTrigger value="lga" className="text-xs px-1">LGA</TabsTrigger>
            <TabsTrigger value="state" className="text-xs px-1">State</TabsTrigger>
            <TabsTrigger value="country" className="text-xs px-1">Country</TabsTrigger>
          </TabsList>
          
          {Object.keys(mockLeaderboard).map((key) => (
            <TabsContent key={key} value={key} className="flex-1 mt-2">
              <div className="space-y-2">
                {mockLeaderboard[key].slice(0, 5).map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-2 p-2 rounded-lg ${getRankBg(entry.rank)}`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {entry.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-2 h-2" />
                        {entry.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-primary">
                        {entry.points.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground">pts</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        {/* Current User Rank */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
            <div className="w-6 h-6 flex items-center justify-center text-xs font-medium text-primary">
              42
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-foreground">You</div>
            </div>
            <div className="text-xs font-semibold text-primary">150 pts</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingWidget;
