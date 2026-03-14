import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Users, Video, Key, CreditCard, TrendingUp, Activity, WalletIcon, Star, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalVideos: number;
  totalRecitations: number;
  totalPins: number;
  redeemedPins: number;
  totalTransactions: number;
  totalRevenue: number;
  totalUserBalance: number;
  totalPointsBalance: number;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalVideos: 0,
    totalRecitations: 0,
    totalPins: 0,
    redeemedPins: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    totalUserBalance: 0,
    totalPointsBalance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_admin_stats");

      if (error) {
        console.error("Error fetching stats:", error);
        toast({
          title: "Error Loading Stats",
          description: error.message || "Failed to load dashboard statistics",
          variant: "destructive",
        });
        throw error;
      }

      if (data) {
        console.log("Stats loaded:", data);
        setStats(data as unknown as Stats);
        toast({
          title: "Stats Refreshed",
          description: "Dashboard data updated successfully",
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    return `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (value: number) => {
    return Number(value || 0).toLocaleString('en-NG');
  };

  const statCards = [
    {
      title: "Total Users",
      value: formatNumber(stats.totalUsers),
      subtitle: `${formatNumber(stats.activeUsers)} active`,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Videos",
      value: formatNumber(stats.totalVideos),
      subtitle: "Uploaded content",
      icon: Video,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Recitations",
      value: formatNumber(stats.totalRecitations),
      subtitle: "Total attempts",
      icon: Activity,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Redemption PINs",
      value: formatNumber(stats.totalPins),
      subtitle: `${formatNumber(stats.redeemedPins)} redeemed`,
      icon: Key,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Transactions",
      value: formatNumber(stats.totalTransactions),
      subtitle: "Total operations",
      icon: CreditCard,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Admin Revenue",
      value: formatCurrency(stats.totalRevenue),
      subtitle: "From unlocks",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "User Balances",
      value: formatCurrency(stats.totalUserBalance),
      subtitle: "Total held",
      icon: WalletIcon,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Points",
      value: formatNumber(stats.totalPointsBalance),
      subtitle: "Awarded points",
      icon: Star,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
            <p className="text-muted-foreground">Welcome to the admin dashboard</p>
          </div>
          <Button 
            onClick={fetchStats} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-2">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground truncate">
                      {isLoading ? "..." : stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor} flex-shrink-0 ml-2`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a href="/admin/videos" className="block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Upload New Video</p>
                    <p className="text-xs text-muted-foreground">Add recitation content</p>
                  </div>
                </div>
              </a>
              <a href="/admin/pins" className="block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Generate PINs</p>
                    <p className="text-xs text-muted-foreground">Create redemption codes</p>
                  </div>
                </div>
              </a>
              <a href="/admin/users" className="block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Manage Users</p>
                    <p className="text-xs text-muted-foreground">View and edit user accounts</p>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Activity feed will show recent user registrations, recitations, and transactions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
