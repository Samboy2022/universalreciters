import { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Maximize2, Minimize2 } from "lucide-react";

const SelfieMirror = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
      }
    } catch (error) {
      console.error("Camera access denied:", error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className={`h-full flex flex-col transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            Selfie Mirror
          </span>
          <div className="flex gap-1">
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
        <div className="flex-1 bg-muted rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
            style={{ display: isActive ? 'block' : 'none' }}
          />
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Camera off</p>
              </div>
            </div>
          )}
        </div>
        <Button
          onClick={isActive ? stopCamera : startCamera}
          variant={isActive ? "outline" : "default"}
          size="sm"
          className="mt-3"
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
        <p className="text-xs text-muted-foreground text-center mt-2">
          Mirror view helps maintain posture while reciting
        </p>
      </CardContent>
    </Card>
  );
};

export default SelfieMirror;
