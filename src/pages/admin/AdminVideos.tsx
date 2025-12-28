import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Video, Eye, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface VideoData {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  arabic_text: string;
  unlock_fee: number;
  duration: number | null;
  views: number;
  created_at: string;
}

const AdminVideos = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    arabic_text: "",
    unlock_fee: 0,
    duration: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setVideos(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error(`Upload error for ${bucket}:`, error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setUploadProgress(0);

    try {
      let videoUrl = formData.video_url;
      let thumbnailUrl = formData.thumbnail_url;

      // Upload video if file is selected
      if (videoFile) {
        setIsUploading(true);
        setUploadProgress(25);
        const uploadedUrl = await uploadFile(videoFile, 'videos');
        if (!uploadedUrl) {
          throw new Error("Failed to upload video");
        }
        videoUrl = uploadedUrl;
        setUploadProgress(60);
      }

      // Upload thumbnail if file is selected
      if (thumbnailFile) {
        setUploadProgress(75);
        const uploadedUrl = await uploadFile(thumbnailFile, 'thumbnails');
        if (!uploadedUrl) {
          throw new Error("Failed to upload thumbnail");
        }
        thumbnailUrl = uploadedUrl;
        setUploadProgress(90);
      }

      if (editingVideo) {
        const { error } = await supabase
          .from("videos")
          .update({
            title: formData.title,
            description: formData.description || null,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl || null,
            arabic_text: formData.arabic_text,
            unlock_fee: formData.unlock_fee,
            duration: formData.duration || null,
          })
          .eq("id", editingVideo.id);

        if (error) throw error;
        toast({ title: "Video updated successfully" });
      } else {
        const { error } = await supabase.from("videos").insert({
          title: formData.title,
          description: formData.description || null,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl || null,
          arabic_text: formData.arabic_text,
          unlock_fee: formData.unlock_fee,
          duration: formData.duration || null,
          created_by: user?.id,
        });

        if (error) throw error;
        toast({ title: "Video created successfully" });
      }

      setUploadProgress(100);
      setIsDialogOpen(false);
      resetForm();
      fetchVideos();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = (video: VideoData) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || "",
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || "",
      arabic_text: video.arabic_text,
      unlock_fee: video.unlock_fee,
      duration: video.duration || 0,
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    const { error } = await supabase.from("videos").delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting video", variant: "destructive" });
    } else {
      toast({ title: "Video deleted" });
      fetchVideos();
    }
  };

  const resetForm = () => {
    setEditingVideo(null);
    setFormData({
      title: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      arabic_text: "",
      unlock_fee: 0,
      duration: 0,
    });
    setVideoFile(null);
    setThumbnailFile(null);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast({ title: "Video must be less than 100MB", variant: "destructive" });
        return;
      }
      setVideoFile(file);
      setFormData({ ...formData, video_url: "" });
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Thumbnail must be less than 5MB", variant: "destructive" });
        return;
      }
      setThumbnailFile(file);
      setFormData({ ...formData, thumbnail_url: "" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Video Management</h1>
            <p className="text-muted-foreground">Upload and manage recitation videos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVideo ? "Edit Video" : "Add New Video"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unlock_fee">Unlock Fee (₦)</Label>
                    <Input
                      id="unlock_fee"
                      type="number"
                      value={formData.unlock_fee}
                      onChange={(e) => setFormData({ ...formData, unlock_fee: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* Video Upload */}
                <div className="space-y-2">
                  <Label>Video *</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    {videoFile ? (
                      <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Video className="w-5 h-5 text-primary" />
                          <span className="text-sm truncate max-w-[200px]">{videoFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setVideoFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : formData.video_url ? (
                      <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Video className="w-5 h-5 text-primary" />
                          <span className="text-sm truncate max-w-[300px]">{formData.video_url}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, video_url: "" })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload a video file or paste URL
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => videoInputRef.current?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload File
                          </Button>
                        </div>
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleVideoSelect}
                          className="hidden"
                        />
                      </div>
                    )}
                    {!videoFile && !formData.video_url && (
                      <div className="mt-3">
                        <Label htmlFor="video_url" className="text-xs">Or paste video URL</Label>
                        <Input
                          id="video_url"
                          value={formData.video_url}
                          onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                          placeholder="https://..."
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Thumbnail Upload */}
                <div className="space-y-2">
                  <Label>Thumbnail</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    {thumbnailFile ? (
                      <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-primary" />
                          <span className="text-sm truncate max-w-[200px]">{thumbnailFile.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setThumbnailFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : formData.thumbnail_url ? (
                      <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                        <img 
                          src={formData.thumbnail_url} 
                          alt="Thumbnail" 
                          className="w-16 h-10 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, thumbnail_url: "" })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => thumbnailInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Thumbnail
                        </Button>
                        <input
                          ref={thumbnailInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleThumbnailSelect}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="arabic_text">Arabic Text (Surah Text) *</Label>
                  <Textarea
                    id="arabic_text"
                    value={formData.arabic_text}
                    onChange={(e) => setFormData({ ...formData, arabic_text: e.target.value })}
                    className="font-arabic text-xl text-right"
                    dir="rtl"
                    rows={4}
                    placeholder="أدخل النص العربي هنا..."
                    required
                  />
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving || (!formData.video_url && !videoFile)}>
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingVideo ? "Update" : "Create"} Video
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No videos yet. Add your first video!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thumbnail</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Unlock Fee</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell>
                        {video.thumbnail_url ? (
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title}
                            className="w-16 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                            <Video className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{video.title}</TableCell>
                      <TableCell>{video.unlock_fee > 0 ? `₦${video.unlock_fee}` : "Free"}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {video.views}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(video.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(video)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(video.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminVideos;