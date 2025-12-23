import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Video, Eye, Loader2 } from "lucide-react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingVideo) {
        const { error } = await supabase
          .from("videos")
          .update({
            title: formData.title,
            description: formData.description || null,
            video_url: formData.video_url,
            thumbnail_url: formData.thumbnail_url || null,
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
          video_url: formData.video_url,
          thumbnail_url: formData.thumbnail_url || null,
          arabic_text: formData.arabic_text,
          unlock_fee: formData.unlock_fee,
          duration: formData.duration || null,
          created_by: user?.id,
        });

        if (error) throw error;
        toast({ title: "Video created successfully" });
      }

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
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Video Management</h1>
            <p className="text-muted-foreground">Manage recitation videos</p>
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
                <div className="space-y-2">
                  <Label htmlFor="video_url">Video URL *</Label>
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
                    <Input
                      id="thumbnail_url"
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      placeholder="https://..."
                    />
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arabic_text">Arabic Text *</Label>
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
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
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
