import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/Logo";
import {
  LayoutDashboard,
  Play,
  Mic,
  Trophy,
  Wallet,
  MessageSquare,
  Settings,
  LogOut,
  Home,
  Video,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const sidebarNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/learn", icon: Play, label: "Learn" },
  { href: "/dashboard/recite", icon: Mic, label: "Recite" },
  { href: "/dashboard/rankings", icon: Trophy, label: "Rankings" },
  { href: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
  { href: "/dashboard/chat", icon: MessageSquare, label: "Chat" },
  { href: "/streaming", icon: Video, label: "Streaming" },
];

const mobileBottomNavItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/learn", icon: Play, label: "Learn" },
  { href: "/dashboard/recite", icon: Mic, label: "Recite" },
  { href: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
  { href: "/streaming", icon: Video, label: "Stream" },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex-col">
        <div className="p-4 border-b border-sidebar-border flex-shrink-0">
          <Link to="/">
            <Logo size="md" />
          </Link>
        </div>

        <div className="p-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold">
              {profile?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sidebar-foreground truncate">
                {profile?.name || "Guest User"}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {profile?.state || "Location"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <div className="flex-1 bg-sidebar-accent rounded-full px-2 py-1 text-center">
              <span className="text-sidebar-primary font-semibold">
                {profile?.points || 0}
              </span>{" "}
              <span className="text-sidebar-foreground/70">pts</span>
            </div>
            <div className="flex-1 bg-sidebar-accent rounded-full px-2 py-1 text-center">
              <span className="text-sidebar-primary font-semibold">
                ₦{(profile?.money_balance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive(item.href)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-1 flex-shrink-0">
          <Link
            to="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Desktop sidebar spacer */}
      <div className="hidden lg:block w-64 flex-shrink-0" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-3 py-2 flex items-center gap-2 lg:hidden">
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <div className="flex-1" />

          {/* Points badge */}
          <div className="flex items-center gap-1 bg-accent/15 text-accent-foreground rounded-full px-2.5 py-1 text-xs font-semibold">
            <Star className="w-3.5 h-3.5 text-accent" />
            {profile?.points || 0}
          </div>

          {/* Wallet balance */}
          <Link to="/dashboard/wallet" className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-semibold">
            <Wallet className="w-3.5 h-3.5" />
            ₦{(profile?.money_balance || 0).toLocaleString()}
          </Link>

          {/* Settings */}
          <Link to="/dashboard/settings" className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Link>

          {/* Logout */}
          <button onClick={handleLogout} className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors">
            <LogOut className="w-5 h-5 text-destructive" />
          </button>

          {/* Avatar */}
          <Link to="/dashboard/settings">
            <Avatar className="w-8 h-8 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {profile?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border p-4 items-center gap-4">
          <div className="flex-1" />
          <Button size="sm" variant="outline" asChild>
            <Link to="/dashboard/wallet">
              <Wallet className="w-4 h-4 mr-2" />
              ₦{(profile?.money_balance || 0).toLocaleString()}
            </Link>
          </Button>
        </header>

        {/* Page Content - add bottom padding on mobile for nav bar */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around h-16 px-1">
          {mobileBottomNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-colors",
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive(item.href) && "text-primary")} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive(item.href) && (
                <div className="w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
