import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Minus,
  Users,
  MapPin,
  Loader2,
} from "lucide-react";

interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  points: number;
  location: string;
  recitations: number;
}

const Rankings = () => {
  const [activeTab, setActiveTab] = useState("ward");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchRankings = async (scope: string) => {
    setLoading(true);

    let query = supabase
      .from("profiles")
      .select("id, name, points, ward, lga, state")
      .order("points", { ascending: false })
      .limit(20);

    if (scope === "ward" && profile?.ward) {
      query = query.eq("ward", profile.ward);
    } else if (scope === "lga" && profile?.lga) {
      query = query.eq("lga", profile.lga);
    } else if (scope === "state" && profile?.state) {
      query = query.eq("state", profile.state);
    }

    const { data: profilesData } = await query;

    if (profilesData) {
      // Fetch recitation counts for these users
      const userIds = profilesData.map((p) => p.id);
      const { data: recData } = await supabase
        .from("recitations")
        .select("user_id")
        .in("user_id", userIds);

      const recCounts: Record<string, number> = {};
      recData?.forEach((r) => {
        recCounts[r.user_id] = (recCounts[r.user_id] || 0) + 1;
      });

      const mapped = profilesData.map((p, i) => ({
        id: p.id,
        rank: i + 1,
        name: p.name,
        points: p.points || 0,
        location:
          scope === "ward"
            ? p.ward
            : scope === "lga"
            ? p.lga
            : p.state,
        recitations: recCounts[p.id] || 0,
      }));

      setEntries(mapped);
      const myRank = mapped.findIndex((e) => e.id === profile?.id);
      setUserRank(myRank >= 0 ? myRank + 1 : null);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (profile) fetchRankings(activeTab);
  }, [activeTab, profile]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-accent" />;
      case 2:
        return <Medal className="w-6 h-6 text-muted-foreground" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-accent/20 border-accent/30";
      case 2:
        return "bg-secondary border-secondary";
      case 3:
        return "bg-amber-100 dark:bg-amber-900/20 border-amber-600/30";
      default:
        return "bg-card border-border";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Rankings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            See how you rank against other reciters in your area
          </p>
        </div>

        {/* User's Current Position */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Your Current Rank</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">
                    #{userRank || "--"}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    in{" "}
                    {activeTab === "ward"
                      ? "your ward"
                      : activeTab === "lga"
                      ? "your LGA"
                      : activeTab === "state"
                      ? "your state"
                      : "Nigeria"}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-muted-foreground">Total Points</p>
                <p className="text-xl md:text-2xl font-bold text-primary">
                  {profile?.points || 0}
                </p>
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
                <TabsTrigger value="ward" className="gap-1 text-xs sm:text-sm">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Ward</span>
                  <span className="sm:hidden">Ward</span>
                </TabsTrigger>
                <TabsTrigger value="lga" className="gap-1 text-xs sm:text-sm">
                  <span>LGA</span>
                </TabsTrigger>
                <TabsTrigger value="state" className="gap-1 text-xs sm:text-sm">
                  <span>State</span>
                </TabsTrigger>
                <TabsTrigger value="national" className="gap-1 text-xs sm:text-sm">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">National</span>
                  <span className="sm:hidden">All</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No reciters found in this area</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Start reciting to appear on the leaderboard!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${getRankBg(
                      entry.rank
                    )} ${entry.id === profile?.id ? "ring-2 ring-primary" : ""}`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {entry.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">
                          {entry.name}
                        </p>
                        {entry.id === profile?.id && (
                          <Badge variant="secondary" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{entry.location}</span>
                        <span>•</span>
                        <span>{entry.recitations} recitations</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        {entry.points.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Rankings;
