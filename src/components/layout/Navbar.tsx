import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/Logo";
import { Menu, X, User, LogIn, Sun, Moon, LogOut, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );
  const location = useLocation();
  const { isAuthenticated, profile, logout, isLoading, isAdmin } = useAuth();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/streaming", label: "Streaming" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/about", label: "About" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled 
          ? "bg-background/95 backdrop-blur-lg border-b border-border shadow-lg" 
          : "bg-background/80 backdrop-blur-md border-b border-border/50"
      )}
    >
      <div className="container mx-auto px-4">
        <div className={cn(
          "flex items-center justify-between transition-all duration-300",
          scrolled ? "h-14" : "h-16"
        )}>
          <Link to="/" className="hover:scale-105 transition-transform">
            <Logo size={scrolled ? "sm" : "md"} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105",
                  isActive(link.href) 
                    ? "text-primary bg-primary/10 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleDarkMode} 
              className="rounded-full hover:scale-110 transition-transform"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <>
                    {isAdmin ? (
                      <>
                        <Link to="/admin">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="hover:scale-105 transition-transform"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Admin Panel
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleLogout}
                          className="hover:scale-105 transition-transform"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link to="/dashboard">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="hover:scale-105 transition-transform"
                          >
                            <User className="w-4 h-4 mr-2" />
                            {profile?.name || "Dashboard"}
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleLogout}
                          className="hover:scale-105 transition-transform"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:scale-105 transition-transform"
                      >
                        Login
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button 
                        size="sm" 
                        className="shadow-md hover:scale-105 transition-transform"
                      >
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleDarkMode} 
              className="rounded-full hover:scale-110 transition-transform"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <button
              className={cn(
                "p-2 rounded-lg transition-all duration-200 hover:scale-110",
                isOpen ? "bg-primary/10 text-primary" : "hover:bg-muted"
              )}
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="py-4 border-t border-border/50">
            <div className="flex flex-col gap-1">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 animate-fade-in",
                    isActive(link.href)
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile Auth Buttons */}
              {!isLoading && (
                <div className="flex flex-col gap-3 mt-6 px-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
                  {isAuthenticated ? (
                    <>
                      {isAdmin ? (
                        <>
                          <Link to="/admin" onClick={() => setIsOpen(false)}>
                            <Button 
                              variant="outline" 
                              className="w-full h-11 font-medium hover:scale-[1.02] transition-transform" 
                              size="sm"
                            >
                              <User className="w-4 h-4 mr-2" />
                              Admin Panel
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            className="w-full h-11 font-medium hover:scale-[1.02] transition-transform" 
                            size="sm"
                            onClick={handleLogout}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                            <Button 
                              variant="outline" 
                              className="w-full h-11 font-medium hover:scale-[1.02] transition-transform" 
                              size="sm"
                            >
                              <User className="w-4 h-4 mr-2" />
                              {profile?.name || "Dashboard"}
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            className="w-full h-11 font-medium hover:scale-[1.02] transition-transform" 
                            size="sm"
                            onClick={handleLogout}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="w-full" onClick={() => setIsOpen(false)}>
                        <Button 
                          variant="outline" 
                          className="w-full h-11 font-medium hover:scale-[1.02] transition-transform" 
                          size="sm"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Login
                        </Button>
                      </Link>
                      <Link to="/register" className="w-full" onClick={() => setIsOpen(false)}>
                        <Button 
                          className="w-full h-11 font-medium shadow-md hover:scale-[1.02] transition-transform" 
                          size="sm"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Get Started
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
