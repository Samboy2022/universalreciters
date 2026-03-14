import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, RotateCcw, CheckCircle, XCircle, Volume2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecitationWord {
  text: string;
  status: "pending" | "correct" | "incorrect" | "partial" | "current";
  attempts: number;
}

interface RecitationCheckerProps {
  arabicText: string;
  onComplete: (score: number, mistakes: number) => void;
  onRecordingComplete?: (blob: Blob) => void;
}

// Fallback Arabic text - Suratul Fatiha
const FALLBACK_ARABIC_TEXT = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ الرَّحْمَٰنِ الرَّحِيمِ مَالِكِ يَوْمِ الدِّينِ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ";
const FALLBACK_TITLE = "Suratul Fatiha (الفاتحة)";

// Parse Arabic text into words with proper formatting
const parseArabicText = (text: string): RecitationWord[] => {
  if (!text) return [];
  
  // Split by spaces while preserving Arabic punctuation
  const words = text.split(/\s+/).filter(word => word.trim());
  
  return words.map(word => ({
    text: word,
    status: "pending" as const,
    attempts: 0,
  }));
};

// Format Arabic text into verses (split by ۝ or numbers)
const formatVerses = (text: string): string[] => {
  if (!text) return [];
  
  // Common verse separators in Quran text
  const verseSeparators = /([۝﴾﴿]|\(\d+\)|\d+[\.\-])/g;
  
  // Split by verse markers
  const parts = text.split(verseSeparators).filter(part => part.trim());
  
  // If no separators found, split by rough word count for readability
  if (parts.length <= 1) {
    const words = text.split(/\s+/);
    const verses: string[] = [];
    for (let i = 0; i < words.length; i += 8) {
      verses.push(words.slice(i, i + 8).join(' '));
    }
    return verses;
  }
  
  // Recombine verse markers with their text
  const verses: string[] = [];
  let currentVerse = '';
  
  for (const part of parts) {
    if (part.match(verseSeparators)) {
      currentVerse += ' ' + part;
      verses.push(currentVerse.trim());
      currentVerse = '';
    } else {
      currentVerse = part;
    }
  }
  
  if (currentVerse.trim()) {
    verses.push(currentVerse.trim());
  }
  
  return verses;
};

const RecitationChecker = ({ arabicText, onComplete, onRecordingComplete }: RecitationCheckerProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [words, setWords] = useState<RecitationWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(100);
  const [mistakes, setMistakes] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Parse Arabic text when it changes
  useEffect(() => {
    const textToUse = arabicText || FALLBACK_ARABIC_TEXT;
    setWords(parseArabicText(textToUse));
    resetRecitation();
  }, [arabicText]);

  // Auto-scroll to current word
  useEffect(() => {
    if (currentWordIndex > 0 && scrollRef.current) {
      const currentElement = scrollRef.current.querySelector(`[data-word-index="${currentWordIndex}"]`);
      if (currentElement) {
        currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentWordIndex]);

  const verses = useMemo(() => formatVerses(arabicText || FALLBACK_ARABIC_TEXT), [arabicText]);

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

  // Simulate AI word checking
  const simulateWordChecking = () => {
    let index = 0;
    const wordList = words.length > 0 ? words : parseArabicText(arabicText || FALLBACK_ARABIC_TEXT);
    
    if (wordList.length === 0) return;

    const interval = setInterval(() => {
      if (index >= wordList.length) {
        clearInterval(interval);
        setIsComplete(true);
        stopRecording();
        onComplete(score, mistakes);
        return;
      }

      setWords(prev => {
        const newWords = [...prev];
        if (index > 0 && newWords[index - 1]) {
          // Random success/failure for demo (85% success rate)
          const random = Math.random();
          let status: "correct" | "incorrect" | "partial" = "correct";
          
          if (random < 0.1) {
            status = "incorrect";
            setMistakes(m => m + 1);
            setScore(s => Math.max(0, s - 8));
          } else if (random < 0.2) {
            status = "partial";
            setScore(s => Math.max(0, s - 3));
          }
          
          newWords[index - 1] = {
            ...newWords[index - 1],
            status,
            attempts: newWords[index - 1].attempts + 1,
          };
        }
        if (newWords[index]) {
          newWords[index] = { ...newWords[index], status: "current" };
        }
        return newWords;
      });

      setCurrentWordIndex(index);
      index++;
    }, 1200);
  };

  const resetRecitation = () => {
    setWords(parseArabicText(arabicText || FALLBACK_ARABIC_TEXT));
    setCurrentWordIndex(0);
    setScore(100);
    setMistakes(0);
    setIsComplete(false);
    setIsRecording(false);
  };

  const getWordStyle = (status: RecitationWord['status']) => {
    switch (status) {
      case "correct":
        return "bg-success/15 text-success-foreground border-success/40 shadow-success/20";
      case "incorrect":
        return "bg-destructive/15 text-destructive-foreground border-destructive/40 shadow-destructive/20";
      case "partial":
        return "bg-warning/15 text-warning-foreground border-warning/40 shadow-warning/20";
      case "current":
        return "bg-primary/20 text-primary-foreground border-primary ring-2 ring-primary/50 animate-pulse shadow-lg shadow-primary/30 scale-110";
      default:
        return "text-foreground border-border/30 hover:border-primary/30";
    }
  };

  const getStatusIcon = (status: RecitationWord['status']) => {
    switch (status) {
      case "correct":
        return <CheckCircle className="inline-block w-3 h-3 ml-1" />;
      case "incorrect":
        return <XCircle className="inline-block w-3 h-3 ml-1" />;
      case "partial":
        return <AlertCircle className="inline-block w-3 h-3 ml-1" />;
      default:
        return null;
    }
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
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Arabic Text Display with Scroll */}
        <ScrollArea className="flex-1 max-h-[300px] rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-inner">
          <div ref={scrollRef} className="p-6 md:p-8">
            <div className="space-y-6" dir="rtl">
              {/* Display title */}
              <div className="text-center pb-3 border-b border-primary/10" dir="ltr">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {arabicText ? "Selected Surah" : "Practice Mode"}
                </p>
                <p className="text-sm font-semibold text-primary mt-1">
                  {arabicText ? "Current Selection" : FALLBACK_TITLE}
                </p>
              </div>

              {/* Bismillah Header - Decorative */}
              <div className="text-center py-6 mb-6 border-y-2 border-primary/20 bg-primary/5 rounded-lg">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div className="w-32 h-32 bg-primary rounded-full blur-3xl" />
                  </div>
                  <span className="relative font-arabic text-3xl md:text-4xl text-primary font-bold drop-shadow-sm leading-relaxed">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </span>
                </div>
              </div>
              
              {/* Word-by-word display with status highlighting */}
              <div className="font-arabic text-2xl md:text-3xl lg:text-4xl leading-[3] text-center">
                <div className="flex flex-wrap justify-center gap-3">
                  {words.map((word, index) => (
                    <span
                      key={index}
                      data-word-index={index}
                      className={cn(
                        "inline-flex items-center px-3 py-2 rounded-xl border-2 transition-all duration-300 shadow-sm hover:shadow-md",
                        getWordStyle(word.status),
                        word.status === "pending" && "hover:bg-muted/50"
                      )}
                    >
                      {word.text}
                      {getStatusIcon(word.status)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Word count and progress indicator */}
              <div className="text-center pt-6 mt-6 border-t border-primary/10" dir="ltr">
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    {words.filter(w => w.status === "correct").length} Correct
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    {words.filter(w => w.status === "partial").length} Partial
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    {words.filter(w => w.status === "incorrect").length} Incorrect
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                    {words.filter(w => w.status === "pending").length} Remaining
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/60 mt-3">
                  Total: {words.length} words
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Score Display */}
        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="bg-success/10 rounded-lg p-3 text-center border border-success/20">
            <div className="text-2xl font-bold text-success">{score}</div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
          <div className="bg-destructive/10 rounded-lg p-3 text-center border border-destructive/20">
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
                disabled={!arabicText && !FALLBACK_ARABIC_TEXT}
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
              <Button variant="outline" size="icon" disabled={!arabicText && !FALLBACK_ARABIC_TEXT}>
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
          <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center animate-fade-in border border-primary/20">
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
