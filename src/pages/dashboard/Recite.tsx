import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  AlertCircle,
  Lock,
  Unlock,
  WalletIcon
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Video {
  id: string;
  title: string;
  arabic_text: string;
  video_url: string;
  unlock_fee: number | null;
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

// Fallback Arabic text - Suratul Fatiha
const FALLBACK_ARABIC_TEXT = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ الرَّحْمَٰنِ الرَّحِيمِ مَالِكِ يَوْمِ الدِّينِ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ";
const FALLBACK_TITLE = "Suratul Fatiha (الفاتحة)";
const FALLBACK_VIDEO: Video = {
  id: 'fallback',
  title: FALLBACK_TITLE,
  arabic_text: FALLBACK_ARABIC_TEXT,
  video_url: '',
  unlock_fee: 0,
};

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
  const [unlockedVideoIds, setUnlockedVideoIds] = useState<Set<string>>(new Set());
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  // Fetch videos
  const fetchVideos = async () => {
    const { data } = await supabase
      .from("videos")
      .select("id, title, arabic_text, video_url, unlock_fee")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setVideos(data);
      if (!selectedVideo) {
        setSelectedVideo(data[0]);
      }
    } else {
      // No videos available, use fallback
      setVideos([]);
      if (!selectedVideo) {
        setSelectedVideo(FALLBACK_VIDEO);
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

  const fetchUnlockedVideos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("description")
      .eq("user_id", user.id)
      .eq("category", "video_unlock")
      .eq("status", "completed");

    if (data) {
      const ids = new Set<string>();
      data.forEach((tx) => {
        const match = tx.description?.match(/Unlocked video: (.+)/);
        if (match) ids.add(match[1]);
      });
      setUnlockedVideoIds(ids);
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchUserRecitations();
    fetchUnlockedVideos();
  }, [user]);

  const isVideoUnlocked = (video: Video) => {
    if (video.id === 'fallback') return true;
    if (!video.unlock_fee || video.unlock_fee <= 0) return true;
    return unlockedVideoIds.has(video.id);
  };

  const handleUnlockVideo = async (video: Video) => {
    if (!user) return;
    setIsUnlocking(true);
    try {
      const { data, error } = await supabase.rpc("unlock_video", {
        _user_id: user.id,
        _video_id: video.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; fee?: number; required?: number; balance?: number; already_unlocked?: boolean };

      if (!result.success) {
        if (result.error === 'Insufficient balance') {
          toast({
            title: "Insufficient Balance",
            description: `You need ₦${result.required} but have ₦${Number(result.balance).toLocaleString()}. Fund your wallet first.`,
            variant: "destructive",
          });
        } else {
          toast({ title: result.error || "Failed to unlock", variant: "destructive" });
        }
        return;
      }

      toast({
        title: result.fee === 0 || result.already_unlocked ? "Video Ready!" : "Video Unlocked!",
        description: result.fee && result.fee > 0 ? `₦${result.fee} deducted from your wallet` : "This video is free to access",
      });

      await fetchUnlockedVideos();
      if (refreshProfile) refreshProfile();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUnlocking(false);
    }
  };

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
      if (user && selectedVideo && selectedVideo.id !== 'fallback') {
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
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Recite</h1>
          <p className="text-sm text-muted-foreground mt-1">Practice your recitation and get instant feedback</p>
        </div>

        {/* Header Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Sessions</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{userRecitations.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 md:w-6 md:h-6 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Average Score</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{averageScore.toFixed(0)}%</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 md:w-6 md:h-6 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Points Earned</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">+{profile?.points || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recitation Area */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                Recitation Practice
              </CardTitle>
              {/* Video/Surah Selection */}
              <Select
                value={selectedVideo?.id}
                onValueChange={(value) => {
                  if (value === 'fallback') {
                    setSelectedVideo(FALLBACK_VIDEO);
                  } else {
                    const video = videos.find(v => v.id === value);
                    setSelectedVideo(video || FALLBACK_VIDEO);
                  }
                  resetRecitation();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Surah to recite" />
                </SelectTrigger>
                <SelectContent>
                  {videos.length === 0 && (
                    <SelectItem value="fallback">
                      {FALLBACK_TITLE} (Default Practice)
                    </SelectItem>
                  )}
                  {videos.map((video) => (
                    <SelectItem key={video.id} value={video.id}>
                      <span className="flex items-center gap-2">
                        {!isVideoUnlocked(video) && <Lock className="w-3 h-3 text-muted-foreground" />}
                        {video.title}
                        {video.unlock_fee && video.unlock_fee > 0 && !isVideoUnlocked(video) && (
                          <span className="text-xs text-muted-foreground">(₦{video.unlock_fee})</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                  {videos.length > 0 && (
                    <SelectItem value="fallback">
                      {FALLBACK_TITLE} (Practice)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Unlock Gate */}
              {selectedVideo && !isVideoUnlocked(selectedVideo) && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      <strong>{selectedVideo.title}</strong> — ₦{selectedVideo.unlock_fee}
                    </span>
                  </div>
                  <Button size="sm" onClick={() => handleUnlockVideo(selectedVideo)} disabled={isUnlocking}>
                    {isUnlocking ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Unlock className="w-3 h-3 mr-1" />
                    )}
                    Unlock
                  </Button>
                </div>
              )}
              {/* Arabic Text Display with Scroll - only when unlocked */}
              {(!selectedVideo || isVideoUnlocked(selectedVideo)) && (
              <ScrollArea className="max-h-[350px] rounded-lg border border-border bg-muted/30">
                <div className="p-6 md:p-8" dir="rtl">
                  {selectedVideo ? (
                    <div className="space-y-4">
                      {/* Title indicator */}
                      <div className="text-center pb-2" dir="ltr">
                        <p className="text-xs text-muted-foreground">
                          {selectedVideo.id === 'fallback' ? "Default Practice" : "Selected Surah"}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {selectedVideo.title}
                        </p>
                      </div>

                      {/* Bismillah Header */}
                      <div className="text-center pb-4 mb-4 border-b border-border/50">
                        <span className="font-arabic text-2xl md:text-3xl text-primary font-bold">
                          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </span>
                      </div>
                      
                      {/* Main Arabic Text */}
                      <div className="font-arabic text-2xl md:text-3xl lg:text-4xl leading-[2.5] text-foreground text-center">
                        {selectedVideo.arabic_text.split(/\s+/).map((word, idx) => (
                          <span key={idx} className="inline-block mx-1 my-1 hover:text-primary transition-colors">
                            {word}
                          </span>
                        ))}
                      </div>
                      
                      {/* Word count */}
                      <div className="text-center pt-4 mt-4 border-t border-border/50" dir="ltr">
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {selectedVideo.arabic_text.split(/\s+/).length} words
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center min-h-[200px]">
                      <p className="text-muted-foreground text-center">Loading...</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              )}

              {/* Only show recording controls when video is unlocked */}
              {selectedVideo && isVideoUnlocked(selectedVideo) && (
              <>

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
                        if (selectedVideo.video_url.includes("youtube.com") || selectedVideo.video_url.includes("youtu.be")) {
                          const videoId = selectedVideo.video_url.includes("v=")
                            ? selectedVideo.video_url.split("v=")[1].split("&")[0]
                            : selectedVideo.video_url.split("youtu.be/")[1].split("?")[0];
                          window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
                        } else {
                          const audio = new Audio(selectedVideo.video_url);
                          audio.play();
                        }
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
              </>
              )}
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