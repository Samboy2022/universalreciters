import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Upload, Save, Image, Type, Settings, BarChart3, Loader2 } from "lucide-react";

const AdminCMS = () => {
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [settings, setSettings] = useState<Record<string, string>>({});

  const { data: appSettings, isLoading } = useQuery({
    queryKey: ["admin-cms-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (appSettings) {
      const map: Record<string, string> = {};
      appSettings.forEach((s) => (map[s.key] = s.value));
      setSettings(map);
      if (map.logo_url) setLogoPreview(map.logo_url);
    }
  }, [appSettings]);

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("app_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cms-settings"] });
      queryClient.invalidateQueries({ queryKey: ["cms-settings"] });
    },
  });

  const handleSaveSettings = async (keys: string[]) => {
    try {
      for (const key of keys) {
        if (settings[key] !== undefined) {
          await updateSetting.mutateAsync({ key, value: settings[key] });
        }
      }
      toast({ title: "Settings saved successfully!" });
    } catch {
      toast({ title: "Error saving settings", variant: "destructive" });
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    try {
      const ext = logoFile.name.split(".").pop();
      const path = `logo.${ext}`;

      // Remove old logo if exists
      await supabase.storage.from("cms-assets").remove([path]);

      const { error: uploadError } = await supabase.storage
        .from("cms-assets")
        .upload(path, logoFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("cms-assets").getPublicUrl(path);

      // Add cache buster
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await updateSetting.mutateAsync({ key: "logo_url", value: publicUrl });
      setLogoPreview(publicUrl);
      setLogoFile(null);
      toast({ title: "Logo uploaded successfully!" });
    } catch {
      toast({ title: "Error uploading logo", variant: "destructive" });
    }
  };

  const handleRemoveLogo = async () => {
    try {
      // Try removing common extensions
      await supabase.storage.from("cms-assets").remove(["logo.png", "logo.jpg", "logo.jpeg", "logo.svg", "logo.webp"]);
      await updateSetting.mutateAsync({ key: "logo_url", value: "" });
      setLogoPreview("");
      toast({ title: "Logo removed. Default logo will be used." });
    } catch {
      toast({ title: "Error removing logo", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Content Management</h2>
          <p className="text-muted-foreground">Manage your site logo, text, and landing page content.</p>
        </div>

        <Tabs defaultValue="branding" className="space-y-4">
          <TabsList>
            <TabsTrigger value="branding" className="gap-2"><Image className="w-4 h-4" /> Branding</TabsTrigger>
            <TabsTrigger value="hero" className="gap-2"><Type className="w-4 h-4" /> Hero Section</TabsTrigger>
            <TabsTrigger value="features" className="gap-2"><Settings className="w-4 h-4" /> Features</TabsTrigger>
            <TabsTrigger value="stats" className="gap-2"><BarChart3 className="w-4 h-4" /> Stats & CTA</TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Logo</CardTitle>
                  <CardDescription>Upload a custom logo image. Leave empty to use the default logo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {logoPreview && (
                    <div className="border border-border rounded-lg p-4 bg-muted/30 flex items-center justify-center">
                      <img src={logoPreview} alt="Current logo" className="max-h-20 object-contain" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Upload New Logo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLogoFile(file);
                          setLogoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleLogoUpload} disabled={!logoFile} className="gap-2">
                      <Upload className="w-4 h-4" /> Upload Logo
                    </Button>
                    {settings.logo_url && (
                      <Button variant="outline" onClick={handleRemoveLogo}>
                        Remove Logo
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Site Identity</CardTitle>
                  <CardDescription>Configure your site name and tagline shown in the logo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Site Name</Label>
                    <Input
                      value={settings.site_name || ""}
                      onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                      placeholder="Universal Reciters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tagline</Label>
                    <Input
                      value={settings.site_tagline || ""}
                      onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                      placeholder="Reciters"
                    />
                  </div>
                  <Button onClick={() => handleSaveSettings(["site_name", "site_tagline"])} className="gap-2">
                    <Save className="w-4 h-4" /> Save Identity
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Hero Section Tab */}
          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Edit the main landing page hero section text.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bismillah Text (Arabic)</Label>
                  <Input
                    value={settings.hero_bismillah || ""}
                    onChange={(e) => setSettings({ ...settings, hero_bismillah: e.target.value })}
                    className="font-arabic text-right text-lg"
                    dir="rtl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hero Title</Label>
                  <Textarea
                    value={settings.hero_title || ""}
                    onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">Use {'{{highlight}}'} to wrap text in the primary color. E.g. "Master Qur'an with {'{{highlight}}'}AI-Powered{'{{/highlight}}'} Feedback"</p>
                </div>
                <div className="space-y-2">
                  <Label>Hero Subtitle</Label>
                  <Textarea
                    value={settings.hero_subtitle || ""}
                    onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button onClick={() => handleSaveSettings(["hero_bismillah", "hero_title", "hero_subtitle"])} className="gap-2">
                  <Save className="w-4 h-4" /> Save Hero Content
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Features Section</CardTitle>
                <CardDescription>Edit the features section heading and description.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Features Title</Label>
                  <Input
                    value={settings.features_title || ""}
                    onChange={(e) => setSettings({ ...settings, features_title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Features Subtitle</Label>
                  <Textarea
                    value={settings.features_subtitle || ""}
                    onChange={(e) => setSettings({ ...settings, features_subtitle: e.target.value })}
                    rows={2}
                  />
                </div>
                <Button onClick={() => handleSaveSettings(["features_title", "features_subtitle"])} className="gap-2">
                  <Save className="w-4 h-4" /> Save Features Content
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats & CTA Tab */}
          <TabsContent value="stats">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                  <CardDescription>Edit the stats shown on the landing page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Active Reciters</Label>
                      <Input
                        value={settings.stat_reciters || ""}
                        onChange={(e) => setSettings({ ...settings, stat_reciters: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Recitation Videos</Label>
                      <Input
                        value={settings.stat_videos || ""}
                        onChange={(e) => setSettings({ ...settings, stat_videos: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Recitations Completed</Label>
                      <Input
                        value={settings.stat_recitations || ""}
                        onChange={(e) => setSettings({ ...settings, stat_recitations: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>States Covered</Label>
                      <Input
                        value={settings.stat_states || ""}
                        onChange={(e) => setSettings({ ...settings, stat_states: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={() => handleSaveSettings(["stat_reciters", "stat_videos", "stat_recitations", "stat_states"])} className="gap-2">
                    <Save className="w-4 h-4" /> Save Stats
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Call to Action</CardTitle>
                  <CardDescription>Edit the CTA section at the bottom of the landing page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>CTA Title</Label>
                    <Input
                      value={settings.cta_title || ""}
                      onChange={(e) => setSettings({ ...settings, cta_title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Subtitle</Label>
                    <Textarea
                      value={settings.cta_subtitle || ""}
                      onChange={(e) => setSettings({ ...settings, cta_subtitle: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button onClick={() => handleSaveSettings(["cta_title", "cta_subtitle"])} className="gap-2">
                    <Save className="w-4 h-4" /> Save CTA Content
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminCMS;
