import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  Play, 
  Mic, 
  Trophy, 
  Wallet, 
  Users, 
  Star,
  ArrowRight,
  CheckCircle,
  BookOpen,
  Award
} from "lucide-react";
import heroPattern from "@/assets/hero-pattern.jpg";

const features = [
  {
    icon: Play,
    title: "Watch & Learn",
    description: "Access curated Qur'an recitation videos from expert reciters to learn proper tajweed and pronunciation.",
  },
  {
    icon: Mic,
    title: "AI Voice Check",
    description: "Record your recitation and get instant AI-powered feedback on your accuracy word by word.",
  },
  {
    icon: Trophy,
    title: "Compete & Rank",
    description: "See your ranking in your ward, local government, state, and country. Rise to the top!",
  },
  {
    icon: Wallet,
    title: "Earn Rewards",
    description: "Earn points for every recitation and convert them to real money. Learn and earn!",
  },
];

const steps = [
  { step: 1, title: "Watch", description: "Select a recitation video" },
  { step: 2, title: "Listen", description: "Learn the correct pronunciation" },
  { step: 3, title: "Recite", description: "Record your own recitation" },
  { step: 4, title: "Get Checked", description: "AI checks your accuracy" },
  { step: 5, title: "Earn Points", description: "Get rewarded for learning" },
  { step: 6, title: "Get Ranked", description: "Compete with others" },
];

const stats = [
  { value: "10K+", label: "Active Reciters" },
  { value: "500+", label: "Recitation Videos" },
  { value: "1M+", label: "Recitations Completed" },
  { value: "36", label: "States Covered" },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroPattern})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Arabic Bismillah */}
            <p className="font-arabic text-3xl md:text-4xl text-primary mb-4 animate-fade-in">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-fade-in">
              Master Qur'an Recitation with{" "}
              <span className="text-primary">AI-Powered</span> Feedback
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
              Watch, Listen, Recite, Get Checked, Earn Points, Get Ranked, Get Rewarded. 
              Universal Reciters turns Qur'an learning into a modern, rewarding experience.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto gap-2 shadow-glow">
                  Start Learning Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/streaming">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                  <Play className="w-5 h-5" />
                  Watch Recitations
                </Button>
              </Link>
            </div>
            
            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-sm">Free to Start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-sm">AI Voice Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-sm">Real Rewards</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-primary-foreground/80 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need to perfect your Qur'an recitation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-glow transition-all duration-300 border-border">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple steps to master your recitation and earn rewards.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {steps.map((item, index) => (
              <div 
                key={item.step} 
                className="relative text-center p-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                  {item.step}
                </div>
                <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-6 -right-2 w-4 h-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competition Section */}
      <section className="py-20 bg-gradient-hero islamic-pattern">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Compete Across Nigeria
              </h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of reciters competing at every level - from your local ward 
                to the national stage. Track your progress and climb the rankings!
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Users, text: "Ward Level Rankings" },
                  { icon: BookOpen, text: "Local Government (LGEA) Rankings" },
                  { icon: Star, text: "State Level Rankings" },
                  { icon: Award, text: "National Championships" },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <span className="text-foreground font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
              <Link to="/leaderboard" className="inline-block mt-8">
                <Button variant="outline" className="gap-2">
                  View Leaderboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <Card className="shadow-glow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-accent" />
                    Top Reciters - National
                  </h3>
                  <div className="space-y-4">
                    {[
                      { rank: 1, name: "Ahmad Ibrahim", points: 15420, state: "Kano" },
                      { rank: 2, name: "Fatima Yusuf", points: 14850, state: "Lagos" },
                      { rank: 3, name: "Usman Mohammed", points: 13200, state: "Kaduna" },
                    ].map((user) => (
                      <div 
                        key={user.rank} 
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          user.rank === 1 ? 'bg-accent text-accent-foreground' :
                          user.rank === 2 ? 'bg-secondary text-secondary-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {user.rank}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.state}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-primary">{user.points.toLocaleString()}</div>
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

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of Muslims worldwide who are perfecting their Qur'an recitation 
            with Universal Reciters. Start learning today!
          </p>
          <Link to="/register">
            <Button 
              size="lg" 
              variant="secondary" 
              className="gap-2 shadow-gold"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
