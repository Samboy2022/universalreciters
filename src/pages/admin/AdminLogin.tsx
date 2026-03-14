import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, Loader2, Shield, Copy, CheckCircle } from "lucide-react";

const ADMIN_EMAIL = "admin@universalreciters.com";
const ADMIN_PASSWORD = "Admin@UR2024!";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);
  const { login, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await login(email, password);
      if (error) {
        toast({
          title: "Admin login failed",
          description: error.message || "Invalid credentials. Please check your email and password.",
          variant: "destructive",
        });
      } else {
        // Will redirect via useEffect once isAdmin updates
        toast({ title: "Welcome, Administrator!" });
      }
    } catch {
      toast({
        title: "Login failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: "email" | "password") => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fillCredentials = () => {
    setEmail(ADMIN_EMAIL);
    setPassword(ADMIN_PASSWORD);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Admin Credentials Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Default Admin Credentials</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2 border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-mono font-medium text-foreground">{ADMIN_EMAIL}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(ADMIN_EMAIL, "email")}
                  className="p-1 hover:text-primary transition-colors"
                >
                  {copiedField === "email" ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2 border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Password</p>
                  <p className="text-sm font-mono font-medium text-foreground">{ADMIN_PASSWORD}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(ADMIN_PASSWORD, "password")}
                  className="p-1 hover:text-primary transition-colors"
                >
                  {copiedField === "password" ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 border-primary/30 text-primary hover:bg-primary/10"
              onClick={fillCredentials}
            >
              Auto-fill credentials
            </Button>
          </CardContent>
        </Card>

        {/* Login Form Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <Link to="/" className="inline-block mb-3">
              <Logo size="lg" className="mx-auto" />
            </Link>
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Admin Portal</CardTitle>
            </div>
            <CardDescription>Sign in to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@universalreciters.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                Sign In as Admin
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-border text-center">
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to user login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
