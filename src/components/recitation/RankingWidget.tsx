import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  location: string;
  id: string;
}

const RankingWidget = () => {
  const [activeTab, setActiveTab] = useState("ward");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchRankings = async (scope: string) => {
    setLoading(true);
    const { data } = await supabase.rpc("get_public_profiles_filtered", {
      _ward: scope === "ward" ? profile?.ward ?? null : null,
      _lga: scope === "lga" ? profile?.lga ?? null : null,
      _state: scope === "state" ? profile?.state ?? null : null,
      _limit: 5,
      _exclude: null,
    });

    if (data) {
      const mapped = data.map((p, i) => ({
        rank: i + 1,
        name: p.name,
        points: p.points || 0,
        location: scope === "ward" ? p.ward : scope === "lga" ? p.lga : scope === "state" ? p.state : p.state,
        id: p.id,
      }));
      setEntries(mapped);

      const myRank = mapped.findIndex((e) => e.id === profile?.id);
      setUserRank(myRank >= 0 ? myRank + 1 : null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRankings(activeTab);
  }, [activeTab, profile]);

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
          <TabsList className="grid grid-cols-4 w-full bg-muted/80 p-1 rounded-lg h-10">
            <TabsTrigger value="ward" className="text-xs rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Ward</TabsTrigger>
            <TabsTrigger value="lga" className="text-xs rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">LGA</TabsTrigger>
            <TabsTrigger value="state" className="text-xs rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">State</TabsTrigger>
            <TabsTrigger value="country" className="text-xs rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Country</TabsTrigger>
          </TabsList>

          <div className="flex-1 mt-2">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : entries.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">No reciters in this area yet</p>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-2 p-2 rounded-lg ${getRankBg(entry.rank)} ${entry.id === profile?.id ? "ring-1 ring-primary" : ""}`}
                  >
                    <div className="w-6 h-6 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {entry.name} {entry.id === profile?.id && "(You)"}
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
            )}
          </div>
        </Tabs>

        {/* Current User Rank */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
            <div className="w-6 h-6 flex items-center justify-center text-xs font-medium text-primary">
              {userRank || "--"}
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-foreground">You</div>
            </div>
            <div className="text-xs font-semibold text-primary">{profile?.points || 0} pts</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingWidget;
