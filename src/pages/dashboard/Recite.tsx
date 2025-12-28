import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  MicOff, 
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  Volume2,
  Star,
  Trophy,
  Target
} from "lucide-react";

interface RecitationSession {
  id: string;
  surah: string;
  ayah: string;
  arabicText: string;
  score?: number;
  completed: boolean;
}

const mockSessions: RecitationSession[] = [
  {
    id: "1",
    surah: "Al-Fatiha",
    ayah: "1",
    arabicText: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
    score: 95,
    completed: true,
  },
  {
    id: "2",
    surah: "Al-Fatiha",
    ayah: "2",
    arabicText: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    score: 88,
    completed: true,
  },
  {
    id: "3",
    surah: "Al-Fatiha",
    ayah: "3",
    arabicText: "الرَّحْمَنِ الرَّحِيمِ",
    completed: false,
  },
  {
    id: "4",
    surah: "Al-Fatiha",
    ayah: "4",
    arabicText: "مَالِكِ يَوْمِ الدِّينِ",
    completed: false,
  },
];

const Recite = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedSession, setSelectedSession] = useState<RecitationSession | null>(mockSessions[2]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const { toast } = useToast();

  const handleStartRecording = () => {
    setIsRecording(true);
    setLastScore(null);
    toast({
      title: "Recording Started",
      description: "Speak clearly into your microphone",
    });
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Simulate AI analysis
    const simulatedScore = Math.floor(Math.random() * 30) + 70;
    setLastScore(simulatedScore);
    toast({
      title: "Recording Complete!",
      description: `Your score: ${simulatedScore}/100`,
    });
  };

  const completedCount = mockSessions.filter(s => s.completed).length;
  const averageScore = mockSessions
    .filter(s => s.score)
    .reduce((acc, s) => acc + (s.score || 0), 0) / completedCount || 0;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-destructive";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">{completedCount}/{mockSessions.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{averageScore.toFixed(0)}%</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Points Earned</p>
                <p className="text-2xl font-bold">+{completedCount * 10}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recitation Area */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                Recitation Practice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Arabic Text Display */}
              <div className="p-8 bg-muted/50 rounded-lg text-center">
                <p className="font-arabic text-4xl leading-loose text-foreground" dir="rtl">
                  {selectedSession?.arabicText || "Select an ayah to practice"}
                </p>
                {selectedSession && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {selectedSession.surah} - Ayah {selectedSession.ayah}
                  </p>
                )}
              </div>

              {/* Recording Controls */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-full"
                  >
                    <Volume2 className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    size="lg"
                    className={`w-20 h-20 rounded-full ${isRecording ? 'bg-destructive hover:bg-destructive/90 animate-pulse' : ''}`}
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    disabled={!selectedSession}
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-full"
                    onClick={() => setLastScore(null)}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  {isRecording ? "Recording... Click to stop" : "Click the mic to start"}
                </p>

                {/* Score Display */}
                {lastScore !== null && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg w-full">
                    <p className="text-sm text-muted-foreground mb-2">Your Score</p>
                    <p className={`text-5xl font-bold ${getScoreColor(lastScore)}`}>
                      {lastScore}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {lastScore >= 90 ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : lastScore >= 70 ? (
                        <Star className="w-5 h-5 text-warning" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                      <span className="text-sm">
                        {lastScore >= 90 ? "Excellent!" : lastScore >= 70 ? "Good try!" : "Keep practicing!"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Session List */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Practice Queue
                </span>
                <Badge variant="secondary">{completedCount}/{mockSessions.length}</Badge>
              </CardTitle>
              <Progress value={(completedCount / mockSessions.length) * 100} className="mt-2" />
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {mockSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => !session.completed && setSelectedSession(session)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedSession?.id === session.id
                        ? "border-primary bg-primary/5"
                        : session.completed
                        ? "border-success/30 bg-success/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        session.completed ? "bg-success/10" : "bg-muted"
                      }`}>
                        {session.completed ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">
                            {session.ayah}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-arabic text-lg text-foreground truncate" dir="rtl">
                          {session.arabicText}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {session.surah} - Ayah {session.ayah}
                        </p>
                      </div>
                      {session.score && (
                        <Badge 
                          variant="secondary" 
                          className={`${getScoreColor(session.score)} flex-shrink-0`}
                        >
                          {session.score}%
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Recite;
