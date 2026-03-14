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
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Dashboard layout component with sidebar and mobile navigation
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
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex-col shadow-lg">
        {/* Logo Section */}
        <div className="p-5 border-b border-sidebar-border flex-shrink-0">
          <Link to="/" className="block transition-transform hover:scale-105">
            <Logo size="md" />
          </Link>
        </div>

        {/* Navigation - All items together, no scroll, no spacing */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-1"
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sidebar-primary-foreground rounded-r-full" />
                )}
                <item.icon className={cn("w-5 h-5 flex-shrink-0", active ? "" : "group-hover:scale-110 transition-transform")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          {/* Settings */}
          <Link
            to="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group",
              isActive("/dashboard/settings")
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-1"
            )}
          >
            {isActive("/dashboard/settings") && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sidebar-primary-foreground rounded-r-full" />
            )}
            <Settings className="w-5 h-5 flex-shrink-0 group-hover:rotate-90 transition-transform duration-300" />
            Settings
          </Link>
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full group hover:translate-x-1"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            Logout
          </button>
        </nav>
      </aside>

      {/* Desktop sidebar spacer */}
      <div className="hidden lg:block w-64 flex-shrink-0" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-3 py-2.5 flex items-center gap-2 lg:hidden shadow-sm">
          <Link to="/" className="transition-transform active:scale-95">
            <Logo size="sm" />
          </Link>
          <div className="flex-1" />

          {/* Points badge */}
          <div className="flex items-center gap-1 bg-accent/10 text-accent-foreground rounded-full px-2.5 py-1.5 text-xs font-semibold border border-accent/20">
            <Star className="w-3.5 h-3.5 text-accent fill-accent" />
            <span>{profile?.points || 0}</span>
          </div>

          {/* Wallet balance */}
          <Link 
            to="/dashboard/wallet" 
            className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-1.5 text-xs font-semibold border border-primary/20 transition-all active:scale-95 hover:bg-primary/15"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>₦{(profile?.money_balance || 0).toLocaleString()}</span>
          </Link>

          {/* Avatar with dropdown indicator */}
          <Link 
            to="/dashboard/settings"
            className="transition-transform active:scale-95"
          >
            <Avatar className="w-9 h-9 border-2 border-primary/30 ring-2 ring-primary/10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {profile?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-6 py-3 items-center gap-4 shadow-sm">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Welcome back, <span className="font-semibold text-foreground">{profile?.name?.split(' ')[0] || 'User'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-accent/10 text-accent-foreground rounded-lg px-3 py-2 text-sm font-semibold border border-accent/20">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span>{profile?.points || 0} Points</span>
            </div>
            <Button size="sm" variant="outline" className="font-semibold" asChild>
              <Link to="/dashboard/wallet">
                <Wallet className="w-4 h-4 mr-2" />
                ₦{(profile?.money_balance || 0).toLocaleString()}
              </Link>
            </Button>
          </div>
        </header>

        {/* Page Content - extra bottom padding on mobile for sticky nav bar */}
        <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar - Sticky App-like */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {/* Safe area padding for devices with notches/home indicators */}
        <div className="flex items-center justify-around h-16 px-2 pb-safe">
          {mobileBottomNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-all relative touch-manipulation",
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:scale-90"
                )}
              >
                {/* Icon with background effect */}
                <div className={cn(
                  "relative transition-all duration-300",
                  active && "scale-110"
                )}>
                  {/* Active background glow */}
                  {active && (
                    <div className="absolute -inset-3 bg-primary/10 rounded-2xl animate-pulse" />
                  )}
                  
                  {/* Icon */}
                  <div className={cn(
                    "relative z-10 p-2 rounded-xl transition-all",
                    active && "bg-primary/10"
                  )}>
                    <item.icon className={cn(
                      "w-5 h-5 transition-all",
                      active && "drop-shadow-[0_2px_8px_rgba(var(--primary),0.5)]"
                    )} />
                  </div>
                </div>
                
                {/* Label */}
                <span className={cn(
                  "text-[10px] font-medium transition-all",
                  active && "font-bold scale-105"
                )}>
                  {item.label}
                </span>
                
                {/* Active indicator dot */}
                {active && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
