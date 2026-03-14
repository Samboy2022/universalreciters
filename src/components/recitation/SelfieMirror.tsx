import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  CameraOff,
  Maximize2,
  Minimize2,
  Circle,
  Square,
  Upload,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const SelfieMirror = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
      }
    } catch (error) {
      console.error("Camera access denied:", error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera and microphone access.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (isRecording) stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm;codecs=vp8,opus",
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setShowUploadDialog(true);
    };

    mediaRecorder.start(1000);
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleUpload = async () => {
    if (!recordedBlob || !user || !title.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const fileName = `${user.id}/${Date.now()}.webm`;

      setUploadProgress(30);
      const { error: uploadError } = await supabase.storage
        .from("streams")
        .upload(fileName, recordedBlob, {
          contentType: "video/webm",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      const { data: urlData } = supabase.storage
        .from("streams")
        .getPublicUrl(fileName);

      setUploadProgress(80);

      const { error: insertError } = await supabase.from("streams").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        video_url: urlData.publicUrl,
        duration: recordingTime,
        type: "recitation",
        is_public: true,
      });

      if (insertError) throw insertError;

      setUploadProgress(100);

      toast({
        title: "Video uploaded!",
        description: "Your recitation has been posted to the stream.",
      });

      // Reset state
      setShowUploadDialog(false);
      setRecordedBlob(null);
      setTitle("");
      setDescription("");
      setUploadProgress(0);

      // Navigate to streaming page
      navigate("/streaming");
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <>
      <Card
        className={`h-full flex flex-col transition-all duration-300 ${
          isExpanded ? "fixed inset-4 z-50" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              Selfie Mirror
            </span>
            <div className="flex items-center gap-1">
              {isRecording && (
                <span className="flex items-center gap-1 text-xs text-destructive animate-pulse font-mono">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  {formatTime(recordingTime)}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <Minimize2 className="w-3 h-3" />
                ) : (
                  <Maximize2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 bg-muted rounded-lg overflow-hidden relative min-h-[180px]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
              style={{ display: isActive ? "block" : "none" }}
            />
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Camera off</p>
                </div>
              </div>
            )}
            {isRecording && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-destructive/90 text-destructive-foreground rounded-full px-3 py-1 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" />
                REC
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              onClick={isActive ? stopCamera : startCamera}
              variant={isActive ? "outline" : "default"}
              size="sm"
              className="flex-1"
            >
              {isActive ? (
                <>
                  <CameraOff className="w-4 h-4 mr-2" />
                  Turn Off
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Turn On
                </>
              )}
            </Button>

            {isActive && !isRecording && (
              <Button
                onClick={startRecording}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                <Circle className="w-4 h-4 mr-2 fill-current" />
                Record
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="sm"
                className="flex-1 animate-pulse"
              >
                <Square className="w-4 h-4 mr-2 fill-current" />
                Stop
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Record your recitation and share it to the stream
          </p>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Post to Stream
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Video preview */}
            {recordedBlob && (
              <div className="rounded-lg overflow-hidden bg-muted aspect-video">
                <video
                  src={URL.createObjectURL(recordedBlob)}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="stream-title">Title *</Label>
              <Input
                id="stream-title"
                placeholder="e.g. My Surah Al-Fatiha Recitation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stream-desc">Description (optional)</Label>
              <Input
                id="stream-desc"
                placeholder="Tell others about this recitation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="text-xs text-muted-foreground">
              Duration: {formatTime(recordingTime)}
            </div>

            {uploading && (
              <div className="space-y-1">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setRecordedBlob(null);
              }}
              disabled={uploading}
            >
              Discard
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !title.trim()}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Post to Stream
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SelfieMirror;
