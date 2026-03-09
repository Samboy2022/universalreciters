import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Video, Key, CreditCard, TrendingUp, Activity, WalletIcon, Star } from "lucide-react";

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc("get_admin_stats");

        if (error) throw error;

        if (data) {
          setStats(data as Stats);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} active`,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Videos",
      value: stats.totalVideos,
      subtitle: "Uploaded content",
      icon: Video,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Recitations",
      value: stats.totalRecitations,
      subtitle: "Total attempts",
      icon: Activity,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Redemption PINs",
      value: stats.totalPins,
      subtitle: `${stats.redeemedPins} redeemed`,
      icon: Key,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Transactions",
      value: stats.totalTransactions,
      subtitle: "Total operations",
      icon: CreditCard,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Admin Revenue",
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      subtitle: "From unlocks",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "User Balances",
      value: `₦${stats.totalUserBalance.toLocaleString()}`,
      subtitle: "Total held",
      icon: WalletIcon,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Points",
      value: stats.totalPointsBalance.toLocaleString(),
      subtitle: "Awarded points",
      icon: Star,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground">Welcome to the admin dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {isLoading ? "..." : stat.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
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
