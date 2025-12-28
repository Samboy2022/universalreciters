import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  MicOff, 
  RotateCcw,
  CheckCircle,
  XCircle,
  Volume2,
  Star,
  Trophy,
  Target,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Video {
  id: string;
  title: string;
  arabic_text: string;
  video_url: string;
}

interface WordResult {
  word: string;
  expected: string;
  status: "correct" | "incorrect" | "partial";
  similarity: number;
}

interface AnalysisResult {
  wordResults: WordResult[];
  overallScore: number;
  totalWords: number;
  correctWords: number;
  incorrectWords: number;
  feedback: string;
}

const Recite = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [userRecitations, setUserRecitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transcribedText, setTranscribedText] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Fetch videos
  const fetchVideos = async () => {
    const { data } = await supabase
      .from("videos")
      .select("id, title, arabic_text, video_url")
      .order("created_at", { ascending: false });

    if (data) {
      setVideos(data);
      if (data.length > 0 && !selectedVideo) {
        setSelectedVideo(data[0]);
      }
    }
    setIsLoading(false);
  };

  // Fetch user recitations
  const fetchUserRecitations = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("recitations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setUserRecitations(data);
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchUserRecitations();
  }, [user]);

  // Timer for recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    if (!selectedVideo) {
      toast({
        title: "Select a Surah",
        description: "Please select a surah to recite first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setTranscribedText("");
      setAnalysisResult(null);
      setRecordingTime(0);

      // Check if Web Speech API is available
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + ' ';
          }
          setTranscribedText(transcript.trim());
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      // Start audio recording for backup
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak clearly in Arabic. Click the mic button again when done.",
      });
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access to record your recitation.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);

    if (!transcribedText || !selectedVideo) {
      toast({
        title: "No speech detected",
        description: "Please try again and speak clearly into the microphone.",
        variant: "destructive",
      });
      return;
    }

    // Analyze the recitation
    await analyzeRecitation(transcribedText, selectedVideo.arabic_text);
  };

  const analyzeRecitation = async (transcribed: string, expected: string) => {
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-recitation', {
        body: { transcribedText: transcribed, expectedText: expected },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysisResult(data);

      // Save recitation result
      if (user && selectedVideo) {
        await supabase.from("recitations").insert({
          user_id: user.id,
          video_id: selectedVideo.id,
          score: data.overallScore,
          mistakes: data.incorrectWords,
          word_results: data.wordResults,
        });

        // Award points based on score
        if (data.overallScore >= 70) {
          const pointsEarned = Math.floor(data.overallScore / 10);
          await supabase
            .from("profiles")
            .update({ points: (profile?.points || 0) + pointsEarned })
            .eq("id", user.id);

          toast({
            title: `+${pointsEarned} Points Earned!`,
            description: `Great recitation with ${data.overallScore}% accuracy.`,
          });
        }

        fetchUserRecitations();
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze your recitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetRecitation = () => {
    setTranscribedText("");
    setAnalysisResult(null);
    setRecordingTime(0);
  };

  const completedCount = userRecitations.filter(r => r.score >= 70).length;
  const averageScore = userRecitations.length > 0
    ? userRecitations.reduce((acc, r) => acc + r.score, 0) / userRecitations.length
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-destructive";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                <p className="text-2xl font-bold">{userRecitations.length}</p>
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
                <p className="text-2xl font-bold">+{profile?.points || 0}</p>
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
              {/* Video/Surah Selection */}
              <Select
                value={selectedVideo?.id}
                onValueChange={(value) => {
                  const video = videos.find(v => v.id === value);
                  setSelectedVideo(video || null);
                  resetRecitation();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Surah to recite" />
                </SelectTrigger>
                <SelectContent>
                  {videos.map((video) => (
                    <SelectItem key={video.id} value={video.id}>
                      {video.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Arabic Text Display */}
              <div className="p-8 bg-muted/50 rounded-lg text-center">
                {selectedVideo ? (
                  <>
                    <p className="font-arabic text-3xl md:text-4xl leading-loose text-foreground" dir="rtl">
                      {selectedVideo.arabic_text}
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {selectedVideo.title}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Select a surah to practice</p>
                )}
              </div>

              {/* Transcribed Text */}
              {transcribedText && (
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Your recitation:</p>
                  <p className="font-arabic text-xl text-foreground" dir="rtl">
                    {transcribedText}
                  </p>
                </div>
              )}

              {/* Recording Controls */}
              <div className="flex flex-col items-center gap-4">
                {isRecording && (
                  <div className="text-center">
                    <span className="text-2xl font-mono text-destructive animate-pulse">
                      {formatTime(recordingTime)}
                    </span>
                    <p className="text-sm text-muted-foreground">Recording...</p>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-full"
                    onClick={() => {
                      if (selectedVideo) {
                        const audio = new Audio(selectedVideo.video_url);
                        audio.play();
                      }
                    }}
                    disabled={!selectedVideo}
                  >
                    <Volume2 className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    size="lg"
                    className={`w-20 h-20 rounded-full ${isRecording ? 'bg-destructive hover:bg-destructive/90 animate-pulse' : ''}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!selectedVideo || isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-full"
                    onClick={resetRecitation}
                    disabled={isRecording}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground">
                  {isAnalyzing ? "Analyzing your recitation..." : 
                   isRecording ? "Recording... Click to stop" : 
                   "Click the mic to start"}
                </p>

                {/* Analysis Result */}
                {analysisResult && (
                  <div className="w-full p-4 bg-muted/50 rounded-lg space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Your Score</p>
                      <p className={`text-5xl font-bold ${getScoreColor(analysisResult.overallScore)}`}>
                        {analysisResult.overallScore}%
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-success">{analysisResult.correctWords}</p>
                        <p className="text-xs text-muted-foreground">Correct</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-warning">
                          {analysisResult.wordResults.filter(w => w.status === 'partial').length}
                        </p>
                        <p className="text-xs text-muted-foreground">Partial</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-destructive">{analysisResult.incorrectWords}</p>
                        <p className="text-xs text-muted-foreground">Incorrect</p>
                      </div>
                    </div>

                    <p className="text-sm text-center text-muted-foreground">
                      {analysisResult.feedback}
                    </p>

                    {/* Word-by-word results */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {analysisResult.wordResults.map((word, index) => (
                        <Badge
                          key={index}
                          variant={word.status === 'correct' ? 'default' : 'secondary'}
                          className={`
                            ${word.status === 'correct' ? 'bg-success text-success-foreground' : ''}
                            ${word.status === 'partial' ? 'bg-warning text-warning-foreground' : ''}
                            ${word.status === 'incorrect' ? 'bg-destructive text-destructive-foreground' : ''}
                          `}
                        >
                          {word.status === 'correct' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {word.status === 'incorrect' && <XCircle className="w-3 h-3 mr-1" />}
                          {word.status === 'partial' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {word.expected}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Recitations */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Recent Sessions
                </span>
                <Badge variant="secondary">{userRecitations.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : userRecitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recitations yet</p>
                  <p className="text-sm">Start practicing to see your progress!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userRecitations.map((recitation) => {
                    const video = videos.find(v => v.id === recitation.video_id);
                    return (
                      <div
                        key={recitation.id}
                        className={`p-4 rounded-lg border transition-all ${
                          recitation.score >= 70 
                            ? "border-success/30 bg-success/5" 
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            recitation.score >= 70 ? "bg-success/10" : "bg-muted"
                          }`}>
                            {recitation.score >= 70 ? (
                              <CheckCircle className="w-5 h-5 text-success" />
                            ) : (
                              <XCircle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {video?.title || "Unknown"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(recitation.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={getScoreColor(recitation.score)}
                          >
                            {recitation.score}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Recite;