import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCMSSettings } from "@/hooks/useCMSSettings";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Play, Mic, Trophy, Wallet, Users, Star,
  CheckCircle, BookOpen, Award, ArrowRight
} from "lucide-react";
import heroPattern from "@/assets/hero-pattern.jpg";

const features = [
  { icon: Play, title: "Watch & Learn", description: "Access curated Qur'an recitation videos from expert reciters to learn proper tajweed and pronunciation." },
  { icon: Mic, title: "AI Voice Check", description: "Record your recitation and get instant AI-powered feedback on your accuracy word by word." },
  { icon: Trophy, title: "Compete & Rank", description: "See your ranking in your ward, local government, state, and country. Rise to the top!" },
  { icon: Wallet, title: "Earn Rewards", description: "Earn points for every recitation and convert them to real money. Learn and earn!" },
];

const steps = [
  { step: 1, title: "Watch", description: "Select a recitation video" },
  { step: 2, title: "Listen", description: "Learn the correct pronunciation" },
  { step: 3, title: "Recite", description: "Record your own recitation" },
  { step: 4, title: "Get Checked", description: "AI checks your accuracy" },
  { step: 5, title: "Earn Points", description: "Get rewarded for learning" },
  { step: 6, title: "Get Ranked", description: "Compete with others" },
];

const renderHeroTitle = (title: string) => {
  const parts = title.split(/\{\{highlight\}\}|\{\{\/highlight\}\}/);
  return parts.map((part, i) =>
    i % 2 === 1 ? <span key={i} className="text-primary">{part}</span> : part
  );
};

const Index = () => {
  const { data: cms } = useCMSSettings();
  const { isAuthenticated, profile, isLoading } = useAuth();

  const stats = [
    { value: cms?.stat_reciters || "10K+", label: "Active Reciters" },
    { value: cms?.stat_videos || "500+", label: "Recitation Videos" },
    { value: cms?.stat_recitations || "1M+", label: "Recitations Completed" },
    { value: cms?.stat_states || "36", label: "States Covered" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0" style={{ backgroundImage: `url(${heroPattern})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-arabic text-4xl md:text-5xl text-primary mb-6 animate-fade-in opacity-0 [animation-delay:100ms] [animation-fill-mode:forwards]">
              {cms?.hero_bismillah || "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}
            </p>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 leading-tight animate-fade-in opacity-0 [animation-delay:300ms] [animation-fill-mode:forwards]">
              {cms?.hero_title ? renderHeroTitle(cms.hero_title) : <>Master Qur'an Recitation with <span className="text-primary">AI-Powered</span> Feedback</>}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in opacity-0 [animation-delay:500ms] [animation-fill-mode:forwards]">
              {cms?.hero_subtitle || "Watch, Listen, Recite, Get Checked, Earn Points, Get Ranked, Get Rewarded. Universal Reciters turns Qur'an learning into a modern, rewarding experience."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in opacity-0 [animation-delay:700ms] [animation-fill-mode:forwards]">
              {!isLoading && (
                <>
                  {isAuthenticated ? (
                    <>
                      <Link to="/dashboard" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 shadow-glow hover:scale-105 transition-transform">
                          Go to Dashboard
                        </Button>
                      </Link>
                      <Link to="/dashboard/recite" className="w-full sm:w-auto">
                        <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 hover:scale-105 transition-transform">
                          Start Reciting
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/register" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 shadow-glow hover:scale-105 transition-transform">
                          Start Learning Now
                        </Button>
                      </Link>
                      <Link to="/streaming" className="w-full sm:w-auto">
                        <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 hover:scale-105 transition-transform">
                          Watch Recitations
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground animate-fade-in opacity-0 [animation-delay:900ms] [animation-fill-mode:forwards]">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">Welcome back, {profile?.name}!</span>
                  </div>
                  <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Trophy className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">{profile?.points || 0} Points</span>
                  </div>
                  <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Wallet className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">₦{profile?.money_balance || 0}</span>
                  </div>
                </>
              ) : (
                <>
                  {["Free to Start", "AI Voice Analysis", "Real Rewards"].map((t) => (
                    <div key={t} className="flex items-center gap-2 bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">{t}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, idx) => (
              <div key={s.label} className="text-center transform hover:scale-110 transition-transform duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">{s.value}</div>
                <div className="text-sm md:text-base text-primary-foreground/90 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{cms?.features_title || "Everything You Need to Excel"}</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{cms?.features_subtitle || "Our comprehensive platform provides all the tools you need to perfect your Qur'an recitation."}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, idx) => (
              <Card key={f.title} className="group hover:shadow-glow hover:-translate-y-2 transition-all duration-300 border-border cursor-pointer" style={{ animationDelay: `${idx * 100}ms` }}>
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <f.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">How It Works</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">Simple steps to master your recitation and earn rewards.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {steps.map((item, index) => (
              <div key={item.step} className="relative text-center p-6 rounded-xl hover:bg-muted/50 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-lg group-hover:scale-110 transition-transform">{item.step}</div>
                <h4 className="font-bold text-foreground mb-2 text-base">{item.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                {index < steps.length - 1 && <ArrowRight className="hidden lg:block absolute top-8 -right-3 w-5 h-5 text-primary/50" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competition */}
      <section className="py-24 bg-gradient-hero islamic-pattern">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">Compete Across Nigeria</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">Join thousands of reciters competing at every level - from your local ward to the national stage.</p>
              <ul className="space-y-5">
                {[{ icon: Users, text: "Ward Level Rankings" }, { icon: BookOpen, text: "Local Government (LGEA) Rankings" }, { icon: Star, text: "State Level Rankings" }, { icon: Award, text: "National Championships" }].map((item, idx) => (
                  <li key={item.text} className="flex items-center gap-4 group" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                      <item.icon className="w-7 h-7 text-accent-foreground" />
                    </div>
                    <span className="text-foreground font-semibold text-lg">{item.text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/leaderboard" className="inline-block mt-10">
                <Button variant="outline" className="h-12 px-8 text-base font-semibold hover:scale-105 transition-transform">
                  View Leaderboard
                </Button>
              </Link>
            </div>
            <div className="relative">
              <Card className="shadow-glow border-2 hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <h3 className="font-bold text-xl text-foreground mb-6 flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-accent" /> 
                    Top Reciters - National
                  </h3>
                  <div className="space-y-4">
                    {[{ rank: 1, name: "Ahmad Ibrahim", points: 15420, state: "Kano" }, { rank: 2, name: "Fatima Yusuf", points: 14850, state: "Lagos" }, { rank: 3, name: "Usman Mohammed", points: 13200, state: "Kaduna" }].map((user) => (
                      <div key={user.rank} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-md ${user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' : user.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'}`}>
                          {user.rank}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-foreground text-base">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.state}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary text-lg">{user.points.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-10" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">{cms?.cta_title || "Ready to Start Your Journey?"}</h2>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto leading-relaxed">{cms?.cta_subtitle || "Join thousands of Muslims worldwide who are perfecting their Qur'an recitation with Universal Reciters. Start learning today!"}</p>
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button size="lg" variant="secondary" className="shadow-gold text-lg px-10 py-6 hover:scale-105 transition-transform">
                    Continue Learning
                  </Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button size="lg" variant="secondary" className="shadow-gold text-lg px-10 py-6 hover:scale-105 transition-transform">
                    Create Free Account
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
