import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  Trophy, 
  Medal, 
  Crown, 
  MapPin, 
  Search,
  TrendingUp,
  Users
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar?: string;
  points: number;
  recitations: number;
  location: string;
  trend: "up" | "down" | "same";
}

const mockLeaderboard: Record<string, LeaderboardEntry[]> = {
  ward: Array.from({ length: 20 }, (_, i) => ({
    rank: i + 1,
    name: ["Ahmad Ibrahim", "Fatima Yusuf", "Usman Mohammed", "Aisha Bello", "Ibrahim Hassan"][i % 5],
    points: Math.floor(2500 - i * 80 + Math.random() * 50),
    recitations: Math.floor(150 - i * 5),
    location: "Ward 3",
    trend: i < 3 ? "up" : i < 10 ? "same" : "down",
  })),
  lga: Array.from({ length: 20 }, (_, i) => ({
    rank: i + 1,
    name: ["Musa Aliyu", "Halima Sani", "Yusuf Abdullahi", "Amina Garba", "Bashir Ismail"][i % 5],
    points: Math.floor(5500 - i * 150 + Math.random() * 100),
    recitations: Math.floor(350 - i * 12),
    location: "Gwale LGA",
    trend: i < 3 ? "up" : i < 10 ? "same" : "down",
  })),
  state: Array.from({ length: 20 }, (_, i) => ({
    rank: i + 1,
    name: ["Kabir Musa", "Zainab Ahmed", "Salisu Ibrahim", "Hafsat Umar", "Adamu Suleiman"][i % 5],
    points: Math.floor(15500 - i * 400 + Math.random() * 200),
    recitations: Math.floor(850 - i * 30),
    location: "Kano",
    trend: i < 3 ? "up" : i < 10 ? "same" : "down",
  })),
  country: Array.from({ length: 20 }, (_, i) => ({
    rank: i + 1,
    name: ["Ahmad Ibrahim", "Fatima Yusuf", "Usman Mohammed", "Aisha Bello", "Ibrahim Hassan"][i % 5],
    points: Math.floor(25500 - i * 600 + Math.random() * 300),
    recitations: Math.floor(1250 - i * 45),
    location: ["Kano", "Lagos", "Kaduna", "Sokoto", "Borno"][i % 5],
    trend: i < 3 ? "up" : i < 10 ? "same" : "down",
  })),
};

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("country");
  const [searchQuery, setSearchQuery] = useState("");

  const getRankDisplay = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-gold">
          <Crown className="w-5 h-5 text-accent-foreground" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Medal className="w-5 h-5 text-secondary-foreground" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Medal className="w-5 h-5 text-amber-600" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <span className="font-semibold text-muted-foreground">{rank}</span>
      </div>
    );
  };

  const filteredEntries = mockLeaderboard[activeTab].filter(
    (entry) => entry.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = filteredEntries.slice(0, 3);
  const rest = filteredEntries.slice(3);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
              <Trophy className="w-8 h-8 text-accent" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Compete with reciters across Nigeria and rise to the top!
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">10,542</div>
                <div className="text-xs text-muted-foreground">Active Reciters</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Trophy className="w-6 h-6 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">36</div>
                <div className="text-xs text-muted-foreground">States Competing</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-success mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">1.2M+</div>
                <div className="text-xs text-muted-foreground">Total Recitations</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Medal className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">₦5.2M</div>
                <div className="text-xs text-muted-foreground">Rewards Paid</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs & Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="ward">Ward</TabsTrigger>
                <TabsTrigger value="lga">LGA</TabsTrigger>
                <TabsTrigger value="state">State</TabsTrigger>
                <TabsTrigger value="country">National</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search reciters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Top 3 Podium */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            <div className="text-center order-1">
              <div className="mt-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center mb-3">
                  <Medal className="w-8 h-8 text-secondary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{topThree[1]?.name}</h3>
                <p className="text-sm text-muted-foreground">{topThree[1]?.location}</p>
                <p className="text-lg font-bold text-primary mt-1">
                  {topThree[1]?.points.toLocaleString()} pts
                </p>
              </div>
            </div>

            {/* 1st Place */}
            <div className="text-center order-0 md:order-1">
              <div className="w-20 h-20 mx-auto rounded-full bg-accent flex items-center justify-center mb-3 shadow-gold animate-float">
                <Crown className="w-10 h-10 text-accent-foreground" />
              </div>
              <h3 className="font-bold text-lg text-foreground">{topThree[0]?.name}</h3>
              <p className="text-sm text-muted-foreground">{topThree[0]?.location}</p>
              <p className="text-xl font-bold text-primary mt-1">
                {topThree[0]?.points.toLocaleString()} pts
              </p>
            </div>

            {/* 3rd Place */}
            <div className="text-center order-2">
              <div className="mt-12">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                  <Medal className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="font-semibold text-foreground">{topThree[2]?.name}</h3>
                <p className="text-sm text-muted-foreground">{topThree[2]?.location}</p>
                <p className="text-lg font-bold text-primary mt-1">
                  {topThree[2]?.points.toLocaleString()} pts
                </p>
              </div>
            </div>
          </div>

          {/* Full Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Full Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rest.map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {getRankDisplay(entry.rank)}
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {entry.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {entry.name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {entry.location}
                      </div>
                    </div>
                    <div className="text-center hidden sm:block">
                      <div className="text-sm font-medium text-foreground">
                        {entry.recitations}
                      </div>
                      <div className="text-xs text-muted-foreground">recitations</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        {entry.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Leaderboard;
