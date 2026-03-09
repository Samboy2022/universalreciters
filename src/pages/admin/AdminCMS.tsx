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
import { Upload, Save, Image, Type, Settings, BarChart3, Loader2, Share2, Search, Palette, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const AdminCMS = () => {
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const [ogImagePreview, setOgImagePreview] = useState<string>("");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

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
      if (map.seo_og_image) setOgImagePreview(map.seo_og_image);
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
      await supabase.storage.from("cms-assets").remove([path]);
      const { error: uploadError } = await supabase.storage
        .from("cms-assets")
        .upload(path, logoFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("cms-assets").getPublicUrl(path);
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
      await supabase.storage.from("cms-assets").remove(["logo.png", "logo.jpg", "logo.jpeg", "logo.svg", "logo.webp"]);
      await updateSetting.mutateAsync({ key: "logo_url", value: "" });
      setLogoPreview("");
      toast({ title: "Logo removed. Default logo will be used." });
    } catch {
      toast({ title: "Error removing logo", variant: "destructive" });
    }
  };

  const handleOgImageUpload = async () => {
    if (!ogImageFile) return;
    try {
      const ext = ogImageFile.name.split(".").pop();
      const path = `og-image.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("cms-assets")
        .upload(path, ogImageFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("cms-assets").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await updateSetting.mutateAsync({ key: "seo_og_image", value: publicUrl });
      setSettings((prev) => ({ ...prev, seo_og_image: publicUrl }));
      setOgImagePreview(publicUrl);
      setOgImageFile(null);
      toast({ title: "OG image uploaded!" });
    } catch {
      toast({ title: "Error uploading OG image", variant: "destructive" });
    }
  };

  // Convert hex to HSL string for storage
  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  // Convert HSL string to hex for color picker
  const hslToHex = (hsl: string): string => {
    try {
      const parts = hsl.match(/(\d+\.?\d*)/g);
      if (!parts || parts.length < 3) return "#16a34a";
      const h = parseFloat(parts[0]) / 360;
      const s = parseFloat(parts[1]) / 100;
      const l = parseFloat(parts[2]) / 100;
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
      const g = Math.round(hue2rgb(p, q, h) * 255);
      const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch { return "#16a34a"; }
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Content Management</h2>
            <p className="text-muted-foreground">Manage your site logo, text, social links, SEO, and landing page content.</p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="preview-toggle" className="text-sm text-muted-foreground">Live Preview</Label>
            <Switch
              id="preview-toggle"
              checked={showPreview}
              onCheckedChange={setShowPreview}
            />
            {showPreview ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>

        <div className={showPreview ? "grid grid-cols-1 xl:grid-cols-2 gap-6" : ""}>
          {/* CMS Editor Panel */}
          <div>
            <Tabs defaultValue="branding" className="space-y-4">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="branding" className="gap-2"><Image className="w-4 h-4" /> Branding</TabsTrigger>
                <TabsTrigger value="hero" className="gap-2"><Type className="w-4 h-4" /> Hero</TabsTrigger>
                <TabsTrigger value="features" className="gap-2"><Settings className="w-4 h-4" /> Features</TabsTrigger>
                <TabsTrigger value="stats" className="gap-2"><BarChart3 className="w-4 h-4" /> Stats & CTA</TabsTrigger>
                <TabsTrigger value="social" className="gap-2"><Share2 className="w-4 h-4" /> Social</TabsTrigger>
                <TabsTrigger value="seo" className="gap-2"><Search className="w-4 h-4" /> SEO</TabsTrigger>
                <TabsTrigger value="theme" className="gap-2"><Palette className="w-4 h-4" /> Theme</TabsTrigger>
              </TabsList>

              {/* Branding Tab */}
              <TabsContent value="branding">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Logo</CardTitle>
                      <CardDescription>Upload a custom logo image.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {logoPreview && (
                        <div className="border border-border rounded-lg p-4 bg-muted/30 flex items-center justify-center">
                          <img src={logoPreview} alt="Current logo" className="max-h-20 object-contain" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Upload New Logo</Label>
                        <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); } }} />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleLogoUpload} disabled={!logoFile} className="gap-2">
                          <Upload className="w-4 h-4" /> Upload Logo
                        </Button>
                        {settings.logo_url && (
                          <Button variant="outline" onClick={handleRemoveLogo}>Remove</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Site Identity</CardTitle>
                      <CardDescription>Configure your site name and tagline.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Site Name</Label>
                        <Input value={settings.site_name || ""} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} placeholder="Universal Reciters" />
                      </div>
                      <div className="space-y-2">
                        <Label>Tagline</Label>
                        <Input value={settings.site_tagline || ""} onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })} placeholder="Reciters" />
                      </div>
                      <Button onClick={() => handleSaveSettings(["site_name", "site_tagline"])} className="gap-2">
                        <Save className="w-4 h-4" /> Save Identity
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Hero Tab */}
              <TabsContent value="hero">
                <Card>
                  <CardHeader>
                    <CardTitle>Hero Section</CardTitle>
                    <CardDescription>Edit the main landing page hero section text.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Bismillah Text (Arabic)</Label>
                      <Input value={settings.hero_bismillah || ""} onChange={(e) => setSettings({ ...settings, hero_bismillah: e.target.value })} className="font-arabic text-right text-lg" dir="rtl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Hero Title</Label>
                      <Textarea value={settings.hero_title || ""} onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })} rows={2} />
                      <p className="text-xs text-muted-foreground">Use {'{{highlight}}'} to wrap text in primary color.</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Hero Subtitle</Label>
                      <Textarea value={settings.hero_subtitle || ""} onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })} rows={3} />
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
                      <Input value={settings.features_title || ""} onChange={(e) => setSettings({ ...settings, features_title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Features Subtitle</Label>
                      <Textarea value={settings.features_subtitle || ""} onChange={(e) => setSettings({ ...settings, features_subtitle: e.target.value })} rows={2} />
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
                        <div className="space-y-2"><Label>Active Reciters</Label><Input value={settings.stat_reciters || ""} onChange={(e) => setSettings({ ...settings, stat_reciters: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Recitation Videos</Label><Input value={settings.stat_videos || ""} onChange={(e) => setSettings({ ...settings, stat_videos: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Recitations Completed</Label><Input value={settings.stat_recitations || ""} onChange={(e) => setSettings({ ...settings, stat_recitations: e.target.value })} /></div>
                        <div className="space-y-2"><Label>States Covered</Label><Input value={settings.stat_states || ""} onChange={(e) => setSettings({ ...settings, stat_states: e.target.value })} /></div>
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
                      <div className="space-y-2"><Label>CTA Title</Label><Input value={settings.cta_title || ""} onChange={(e) => setSettings({ ...settings, cta_title: e.target.value })} /></div>
                      <div className="space-y-2"><Label>CTA Subtitle</Label><Textarea value={settings.cta_subtitle || ""} onChange={(e) => setSettings({ ...settings, cta_subtitle: e.target.value })} rows={3} /></div>
                      <Button onClick={() => handleSaveSettings(["cta_title", "cta_subtitle"])} className="gap-2">
                        <Save className="w-4 h-4" /> Save CTA Content
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Social Links Tab */}
              <TabsContent value="social">
                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Links</CardTitle>
                    <CardDescription>Configure social media links displayed in the footer. Leave blank to hide.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        Facebook URL
                      </Label>
                      <Input value={settings.social_facebook || ""} onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })} placeholder="https://facebook.com/yourpage" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        Twitter / X URL
                      </Label>
                      <Input value={settings.social_twitter || ""} onChange={(e) => setSettings({ ...settings, social_twitter: e.target.value })} placeholder="https://twitter.com/yourhandle" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        Instagram URL
                      </Label>
                      <Input value={settings.social_instagram || ""} onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })} placeholder="https://instagram.com/yourhandle" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                        YouTube URL
                      </Label>
                      <Input value={settings.social_youtube || ""} onChange={(e) => setSettings({ ...settings, social_youtube: e.target.value })} placeholder="https://youtube.com/@yourchannel" />
                    </div>
                    <Button onClick={() => handleSaveSettings(["social_facebook", "social_twitter", "social_instagram", "social_youtube"])} className="gap-2">
                      <Save className="w-4 h-4" /> Save Social Links
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo">
                <Card>
                  <CardHeader>
                    <CardTitle>SEO Settings</CardTitle>
                    <CardDescription>Manage page title, meta description, and Open Graph image for social sharing.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Page Title <span className="text-xs text-muted-foreground">(shown in browser tab)</span></Label>
                      <Input value={settings.seo_title || ""} onChange={(e) => setSettings({ ...settings, seo_title: e.target.value })} placeholder="Universal Reciters - Master Qur'an Recitation" maxLength={60} />
                      <p className="text-xs text-muted-foreground">{(settings.seo_title || "").length}/60 characters (recommended max)</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Meta Description <span className="text-xs text-muted-foreground">(shown in search results)</span></Label>
                      <Textarea value={settings.seo_description || ""} onChange={(e) => setSettings({ ...settings, seo_description: e.target.value })} rows={3} placeholder="Watch, Listen, Recite, Get Checked..." maxLength={160} />
                      <p className="text-xs text-muted-foreground">{(settings.seo_description || "").length}/160 characters (recommended max)</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Open Graph Image <span className="text-xs text-muted-foreground">(1200×630px recommended for social sharing)</span></Label>
                      {ogImagePreview && (
                        <div className="border border-border rounded-lg p-2 bg-muted/30">
                          <img src={ogImagePreview} alt="OG Image" className="w-full max-h-40 object-contain rounded" />
                        </div>
                      )}
                      <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setOgImageFile(f); setOgImagePreview(URL.createObjectURL(f)); } }} />
                      <Button onClick={handleOgImageUpload} disabled={!ogImageFile} size="sm" className="gap-2">
                        <Upload className="w-4 h-4" /> Upload OG Image
                      </Button>
                    </div>
                    <div className="p-4 bg-muted/40 rounded-lg border border-border">
                      <p className="text-xs font-semibold text-foreground mb-2">SEO Preview</p>
                      <p className="text-sm font-medium text-blue-500">{settings.seo_title || "Universal Reciters - Master Qur'an Recitation"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{settings.seo_description || "No description set."}</p>
                    </div>
                    <Button onClick={() => handleSaveSettings(["seo_title", "seo_description"])} className="gap-2">
                      <Save className="w-4 h-4" /> Save SEO Settings
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Theme Tab */}
              <TabsContent value="theme">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Brand Colors</CardTitle>
                      <CardDescription>Set primary and accent colors for the site. Changes apply after saving and refreshing.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label>Primary Color</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            className="w-12 h-10 rounded-md border border-input cursor-pointer bg-background"
                            value={settings.theme_primary_hsl ? hslToHex(settings.theme_primary_hsl) : "#16a34a"}
                            onChange={(e) => setSettings({ ...settings, theme_primary_hsl: hexToHsl(e.target.value) })}
                          />
                          <div className="flex-1">
                            <Input
                              value={settings.theme_primary_hsl || "142 76% 36%"}
                              onChange={(e) => setSettings({ ...settings, theme_primary_hsl: e.target.value })}
                              placeholder="142 76% 36%"
                              className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground mt-1">HSL format: hue° saturation% lightness%</p>
                          </div>
                        </div>
                        <div className="h-10 rounded-md border border-border" style={{ backgroundColor: `hsl(${settings.theme_primary_hsl || "142 76% 36%"})` }} />
                      </div>

                      <div className="space-y-3">
                        <Label>Accent Color</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            className="w-12 h-10 rounded-md border border-input cursor-pointer bg-background"
                            value={settings.theme_accent_hsl ? hslToHex(settings.theme_accent_hsl) : "#f59e0b"}
                            onChange={(e) => setSettings({ ...settings, theme_accent_hsl: hexToHsl(e.target.value) })}
                          />
                          <div className="flex-1">
                            <Input
                              value={settings.theme_accent_hsl || "38 92% 50%"}
                              onChange={(e) => setSettings({ ...settings, theme_accent_hsl: e.target.value })}
                              placeholder="38 92% 50%"
                              className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground mt-1">HSL format: hue° saturation% lightness%</p>
                          </div>
                        </div>
                        <div className="h-10 rounded-md border border-border" style={{ backgroundColor: `hsl(${settings.theme_accent_hsl || "38 92% 50%"})` }} />
                      </div>

                      <Button onClick={() => handleSaveSettings(["theme_primary_hsl", "theme_accent_hsl"])} className="gap-2 w-full">
                        <Save className="w-4 h-4" /> Save Theme Colors
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Color Preview</CardTitle>
                      <CardDescription>Live preview of your selected colors.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-lg overflow-hidden border border-border">
                        <div className="p-4" style={{ backgroundColor: `hsl(${settings.theme_primary_hsl || "142 76% 36%"})` }}>
                          <p className="text-white font-semibold">Primary Color</p>
                          <p className="text-white/80 text-sm">Buttons, links, accents</p>
                        </div>
                        <div className="p-4" style={{ backgroundColor: `hsl(${settings.theme_accent_hsl || "38 92% 50%"})` }}>
                          <p className="text-white font-semibold">Accent Color</p>
                          <p className="text-white/80 text-sm">Highlights, badges, awards</p>
                        </div>
                        <div className="p-4 bg-background">
                          <div className="flex gap-2">
                            <div className="px-4 py-2 rounded-md text-sm font-medium text-white" style={{ backgroundColor: `hsl(${settings.theme_primary_hsl || "142 76% 36%"})` }}>Primary Button</div>
                            <div className="px-4 py-2 rounded-md text-sm font-medium border border-current" style={{ color: `hsl(${settings.theme_primary_hsl || "142 76% 36%"})` }}>Outline Button</div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Note: Full site re-theme takes effect after saving and refreshing the page.</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview Panel */}
          {showPreview && (
            <div className="border border-border rounded-xl overflow-hidden bg-muted/20">
              <div className="p-3 border-b border-border bg-card flex items-center justify-between">
                <span className="text-sm font-medium text-foreground flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> Live Site Preview</span>
                <span className="text-xs text-muted-foreground">Auto-updates as you type</span>
              </div>
              <div className="overflow-auto h-[600px]">
                <div className="p-6 space-y-6 text-sm">
                  {/* Preview Hero */}
                  <div className="rounded-xl p-6 text-center space-y-3" style={{ background: `linear-gradient(135deg, hsl(${settings.theme_primary_hsl || "142 76% 36%"} / 0.1), hsl(${settings.theme_accent_hsl || "38 92% 50%"} / 0.05))`, border: `1px solid hsl(${settings.theme_primary_hsl || "142 76% 36%"} / 0.2)` }}>
                    <p className="text-lg" style={{ color: `hsl(${settings.theme_primary_hsl || "142 76% 36%"})` }}>{settings.hero_bismillah || "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"}</p>
                    <h2 className="text-xl font-bold text-foreground">{settings.hero_title?.replace(/\{\{highlight\}\}|\{\{\/highlight\}\}/g, '') || "Master Qur'an Recitation"}</h2>
                    <p className="text-muted-foreground text-xs max-w-xs mx-auto">{settings.hero_subtitle || "Watch, Listen, Recite, Get Checked, Earn Points, Get Ranked."}</p>
                    <div className="flex justify-center gap-2">
                      <div className="px-4 py-1.5 rounded-md text-white text-xs font-medium" style={{ backgroundColor: `hsl(${settings.theme_primary_hsl || "142 76% 36%"})` }}>Start Learning</div>
                      <div className="px-4 py-1.5 rounded-md text-xs font-medium border" style={{ borderColor: `hsl(${settings.theme_primary_hsl || "142 76% 36%"})`, color: `hsl(${settings.theme_primary_hsl || "142 76% 36%"})` }}>Watch Videos</div>
                    </div>
                  </div>

                  {/* Preview Stats */}
                  <div className="rounded-lg p-4" style={{ backgroundColor: `hsl(${settings.theme_primary_hsl || "142 76% 36%"})` }}>
                    <div className="grid grid-cols-4 gap-2 text-center text-white">
                      {[{v: settings.stat_reciters || "10K+", l: "Reciters"}, {v: settings.stat_videos || "500+", l: "Videos"}, {v: settings.stat_recitations || "1M+", l: "Recitations"}, {v: settings.stat_states || "36", l: "States"}].map((s) => (
                        <div key={s.l}><div className="font-bold text-base">{s.v}</div><div className="text-xs opacity-80">{s.l}</div></div>
                      ))}
                    </div>
                  </div>

                  {/* Preview Features */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">{settings.features_title || "Everything You Need to Excel"}</h3>
                    <p className="text-muted-foreground text-xs">{settings.features_subtitle || "Our comprehensive platform provides all the tools."}</p>
                  </div>

                  {/* Preview CTA */}
                  <div className="rounded-lg p-4 text-center space-y-2" style={{ backgroundColor: `hsl(${settings.theme_primary_hsl || "142 76% 36%"})` }}>
                    <h3 className="font-bold text-white">{settings.cta_title || "Ready to Start Your Journey?"}</h3>
                    <p className="text-white/80 text-xs">{settings.cta_subtitle || "Join thousands of Muslims worldwide."}</p>
                    <div className="inline-block px-4 py-1.5 rounded-md bg-white text-xs font-medium" style={{ color: `hsl(${settings.theme_primary_hsl || "142 76% 36%"})` }}>Create Free Account</div>
                  </div>

                  {/* Preview Footer Social */}
                  {(settings.social_facebook || settings.social_twitter || settings.social_instagram || settings.social_youtube) && (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Social Links (Footer)</p>
                      <div className="flex gap-2">
                        {settings.social_facebook && <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></div>}
                        {settings.social_twitter && <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center"><svg className="w-3 h-3 text-background" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>}
                        {settings.social_instagram && <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/></svg></div>}
                        {settings.social_youtube && <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/></svg></div>}
                      </div>
                    </div>
                  )}

                  {/* SEO preview */}
                  <div className="border border-border rounded-lg p-3 bg-card">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">SEO / Browser Tab</p>
                    <p className="text-sm font-medium text-blue-500 truncate">{settings.seo_title || "Universal Reciters - Master Qur'an Recitation"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{settings.seo_description || "No description set"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCMS;
