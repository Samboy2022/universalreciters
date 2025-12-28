import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Trophy, 
  Medal, 
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Users,
  MapPin
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  location: string;
  trend: "up" | "down" | "same";
  avatar?: string;
  recitations: number;
}

const mockLeaderboard: Record<string, LeaderboardEntry[]> = {
  ward: [
    { rank: 1, name: "Ahmad Ibrahim", points: 15420, location: "Ward 3", trend: "same", recitations: 234 },
    { rank: 2, name: "Fatima Yusuf", points: 14200, location: "Ward 3", trend: "up", recitations: 198 },
    { rank: 3, name: "Usman Mohammed", points: 13850, location: "Ward 3", trend: "down", recitations: 187 },
    { rank: 4, name: "Aisha Bello", points: 12500, location: "Ward 3", trend: "up", recitations: 165 },
    { rank: 5, name: "Ibrahim Hassan", points: 11200, location: "Ward 3", trend: "same", recitations: 145 },
    { rank: 6, name: "Maryam Suleiman", points: 10800, location: "Ward 3", trend: "up", recitations: 134 },
    { rank: 7, name: "Yusuf Abdullahi", points: 9500, location: "Ward 3", trend: "down", recitations: 112 },
    { rank: 8, name: "Khadija Musa", points: 8900, location: "Ward 3", trend: "same", recitations: 98 },
    { rank: 9, name: "Abdullahi Garba", points: 8200, location: "Ward 3", trend: "up", recitations: 89 },
    { rank: 10, name: "Zainab Aliyu", points: 7800, location: "Ward 3", trend: "down", recitations: 78 },
  ],
  lga: [
    { rank: 1, name: "Ahmad Ibrahim", points: 15420, location: "Kano Municipal", trend: "same", recitations: 234 },
    { rank: 2, name: "Mohammed Sani", points: 16200, location: "Nassarawa", trend: "up", recitations: 245 },
    { rank: 3, name: "Fatima Yusuf", points: 14200, location: "Kano Municipal", trend: "up", recitations: 198 },
    { rank: 4, name: "Ali Kabiru", points: 13900, location: "Fagge", trend: "down", recitations: 189 },
    { rank: 5, name: "Halima Umar", points: 13500, location: "Gwale", trend: "same", recitations: 176 },
  ],
  state: [
    { rank: 1, name: "Mohammed Sani", points: 18500, location: "Kano State", trend: "same", recitations: 289 },
    { rank: 2, name: "Ahmad Ibrahim", points: 15420, location: "Kano State", trend: "up", recitations: 234 },
    { rank: 3, name: "Aminu Danladi", points: 14800, location: "Kano State", trend: "down", recitations: 221 },
    { rank: 4, name: "Safiya Balarabe", points: 14200, location: "Kano State", trend: "up", recitations: 198 },
    { rank: 5, name: "Ismail Yakubu", points: 13900, location: "Kano State", trend: "same", recitations: 189 },
  ],
  national: [
    { rank: 1, name: "Abdulrahman Okonkwo", points: 25000, location: "Lagos", trend: "same", recitations: 398 },
    { rank: 2, name: "Mohammed Sani", points: 18500, location: "Kano", trend: "up", recitations: 289 },
    { rank: 3, name: "Abubakar Shehu", points: 17200, location: "Kaduna", trend: "down", recitations: 267 },
    { rank: 4, name: "Ahmad Ibrahim", points: 15420, location: "Kano", trend: "up", recitations: 234 },
    { rank: 5, name: "Musa Adebayo", points: 14900, location: "Oyo", trend: "same", recitations: 223 },
  ],
};

const Rankings = () => {
  const [activeTab, setActiveTab] = useState("ward");
  const { profile } = useAuth();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30";
      default:
        return "bg-card border-border";
    }
  };

  // Find user's rank in current tab
  const currentLeaderboard = mockLeaderboard[activeTab];
  const userRank = currentLeaderboard.findIndex(e => e.name === "Ahmad Ibrahim") + 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rankings</h1>
            <p className="text-muted-foreground">
              See how you rank against other reciters in your area
            </p>
          </div>
        </div>

        {/* User's Current Position */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Current Rank</p>
                  <p className="text-3xl font-bold text-foreground">
                    #{userRank || "--"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    in {activeTab === "ward" ? "your ward" : activeTab === "lga" ? "your LGA" : activeTab === "state" ? "your state" : "Nigeria"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-primary">{profile?.points || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="ward" className="gap-1">
                  <MapPin className="w-4 h-4" />
                  Ward
                </TabsTrigger>
                <TabsTrigger value="lga" className="gap-1">
                  LGA
                </TabsTrigger>
                <TabsTrigger value="state" className="gap-1">
                  State
                </TabsTrigger>
                <TabsTrigger value="national" className="gap-1">
                  <Trophy className="w-4 h-4" />
                  National
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-3">
              {mockLeaderboard[activeTab].map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${getRankBg(entry.rank)} ${
                    entry.name === "Ahmad Ibrahim" ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="w-12 h-12 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {entry.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">
                        {entry.name}
                      </p>
                      {entry.name === "Ahmad Ibrahim" && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{entry.location}</span>
                      <span>•</span>
                      <span>{entry.recitations} recitations</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getTrendIcon(entry.trend)}
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        {entry.points.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Rankings;
