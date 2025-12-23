import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Play, Pause, RotateCcw, CheckCircle, XCircle, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecitationWord {
  text: string;
  status: "pending" | "correct" | "incorrect" | "current";
  attempts: number;
}

interface RecitationCheckerProps {
  arabicText: string;
  onComplete: (score: number, mistakes: number) => void;
  onRecordingComplete?: (blob: Blob) => void;
}

// Sample Arabic text for demo - Surah Al-Fatiha
const sampleWords: RecitationWord[] = [
  { text: "بِسْمِ", status: "pending", attempts: 0 },
  { text: "اللَّهِ", status: "pending", attempts: 0 },
  { text: "الرَّحْمَٰنِ", status: "pending", attempts: 0 },
  { text: "الرَّحِيمِ", status: "pending", attempts: 0 },
  { text: "الْحَمْدُ", status: "pending", attempts: 0 },
  { text: "لِلَّهِ", status: "pending", attempts: 0 },
  { text: "رَبِّ", status: "pending", attempts: 0 },
  { text: "الْعَالَمِينَ", status: "pending", attempts: 0 },
];

const RecitationChecker = ({ arabicText, onComplete, onRecordingComplete }: RecitationCheckerProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [words, setWords] = useState<RecitationWord[]>(sampleWords);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(100);
  const [mistakes, setMistakes] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete?.(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start word checking simulation
      simulateWordChecking();
      
      toast({
        title: "Recording started",
        description: "Please recite clearly and at a steady pace.",
      });
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice recitation.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Simulate AI word checking (in production, this would use actual speech-to-text)
  const simulateWordChecking = () => {
    let index = 0;
    const interval = setInterval(() => {
      if (index >= words.length) {
        clearInterval(interval);
        setIsComplete(true);
        stopRecording();
        onComplete(score, mistakes);
        return;
      }

      // Simulate word processing
      setWords(prev => {
        const newWords = [...prev];
        if (index > 0) {
          // Random success/failure for demo (85% success rate)
          const success = Math.random() > 0.15;
          newWords[index - 1] = {
            ...newWords[index - 1],
            status: success ? "correct" : "incorrect",
            attempts: newWords[index - 1].attempts + 1,
          };
          
          if (!success) {
            setMistakes(m => m + 1);
            setScore(s => Math.max(0, s - 5));
          }
        }
        newWords[index] = { ...newWords[index], status: "current" };
        return newWords;
      });

      setCurrentWordIndex(index);
      index++;
    }, 1500);
  };

  const resetRecitation = () => {
    setWords(sampleWords);
    setCurrentWordIndex(0);
    setScore(100);
    setMistakes(0);
    setIsComplete(false);
    setIsRecording(false);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Recitation Checker
          </span>
          {isRecording && (
            <span className="flex items-center gap-2 text-sm text-destructive animate-pulse">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              Recording
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Arabic Text Display */}
        <div className="flex-1 bg-muted rounded-lg p-4 mb-4 overflow-auto">
          <div className="font-arabic text-2xl md:text-3xl leading-loose text-center flex flex-wrap justify-center gap-3">
            {words.map((word, index) => (
              <span
                key={index}
                className={cn(
                  "px-2 py-1 rounded transition-all duration-300",
                  word.status === "correct" && "bg-success/20 text-success",
                  word.status === "incorrect" && "bg-destructive/20 text-destructive",
                  word.status === "current" && "bg-accent/50 ring-2 ring-accent animate-pulse",
                  word.status === "pending" && "text-foreground"
                )}
              >
                {word.text}
                {word.status === "correct" && (
                  <CheckCircle className="inline-block w-4 h-4 ml-1" />
                )}
                {word.status === "incorrect" && (
                  <XCircle className="inline-block w-4 h-4 ml-1" />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-success/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-success">{score}</div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
          <div className="bg-destructive/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-destructive">{mistakes}</div>
            <div className="text-xs text-muted-foreground">Mistakes</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {!isComplete ? (
            <>
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className="flex-1"
                variant={isRecording ? "destructive" : "default"}
                disabled={isProcessing}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Reciting
                  </>
                )}
              </Button>
              <Button variant="outline" size="icon">
                <Volume2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button onClick={resetRecitation} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>

        {isComplete && (
          <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center animate-fade-in">
            <h3 className="font-semibold text-foreground mb-1">
              Recitation Complete!
            </h3>
            <p className="text-sm text-muted-foreground">
              Your score: <span className="font-bold text-primary">{score}/100</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecitationChecker;
