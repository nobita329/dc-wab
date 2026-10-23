"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Palette,
  Search,
  Share2,
  Plus,
  Trash2,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Link2,
  Sparkles,
  SlidersHorizontal,
  Check,
  Zap,
  ExternalLink,
  Layers,
  Globe,
  BellRing,
  Monitor,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { WallpaperBrowser } from "@/components/admin/WallpaperBrowser";
import { toast } from "sonner";
import { SiteSettings, SocialLink, DEFAULT_GLOBAL_SETTINGS } from "@nova/shared";

const COLOR_PRESETS = [
  { name: "Cyberpunk Violet", primary: "#7c3aed", accent: "#06b6d4", tint: "#12111a" },
  { name: "Neon Emerald", primary: "#10b981", accent: "#06b6d4", tint: "#0b1712" },
  { name: "Sunset Crimson", primary: "#f43f5e", accent: "#fbbf24", tint: "#170f12" },
  { name: "Deep Ocean", primary: "#2563eb", accent: "#38bdf8", tint: "#0b1120" },
  { name: "AMOLED Obsidian", primary: "#9333ea", accent: "#a855f7", tint: "#000000" },
];

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [activeTab, setActiveTab] = useState("branding");
  const [bgSourceTab, setBgSourceTab] = useState<"browser" | "upload" | "url" | "color" | "gradient">("browser");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [isDirty, setIsDirty] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);
  const motdFileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data, isLoading, refetch } = useQuery<{ success: boolean; settings: SiteSettings }>({
    queryKey: ["adminSettings"],
    queryFn: async () => (await api.get("/api/admin/settings")).data,
  });

  useEffect(() => {
    if (data?.settings) {
      setSettings(JSON.parse(JSON.stringify(data.settings)));
      setIsDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: SiteSettings) => {
      const res = await api.put("/api/admin/settings", payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Global website settings saved successfully");
      setIsDirty(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save settings");
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/admin/settings/reset");
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Settings reset to defaults");
      setShowResetConfirmModal(false);
      setIsDirty(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to reset settings");
    },
  });

  const triggerAutoSave = (updated: SiteSettings) => {
    if (!autoSave) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      saveMutation.mutate(updated);
    }, 800);
  };

  if (isLoading || !settings) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Website Settings" subtitle="Loading configurations..." />
        <div className="p-8 space-y-6">
          <Skeleton className="h-10 w-96 bg-zinc-800" />
          <Skeleton className="h-64 w-full bg-zinc-800" />
        </div>
      </div>
    );
  }

  const handleUpdateBranding = (field: string, value: any) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        branding: { ...prev.branding, [field]: value },
      };
      if (field === "panelName") updated.branding.siteTitle = value;
      if (field === "panelLogo") updated.branding.logoImageUrl = value;
      if (field === "panelFaviconLogo") updated.branding.faviconUrl = value;
      triggerAutoSave(updated);
      return updated;
    });
    setIsDirty(true);
  };

  const handleUpdateSeo = (field: string, value: any) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, seo: { ...prev.seo, [field]: value } };
      triggerAutoSave(updated);
      return updated;
    });
    setIsDirty(true);
  };

  const handleUpdateFeature = (field: string, value: any) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        features: {
          ...(prev.features as any),
          [field]: value,
        },
      };
      triggerAutoSave(updated);
      return updated;
    });
    setIsDirty(true);
  };

  const handleGenericUpload = (field: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size exceeds 50MB limit");
      return;
    }

    const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setIsUploading(field);
        const base64Data = reader.result as string;
        const res = await api.post("/api/admin/upload-background", {
          fileData: base64Data,
          fileName: file.name,
          mimeType: file.type,
        });

        if (res.data.success) {
          handleUpdateBranding(field, res.data.url);
          if (field === "backgroundUrl") {
            handleUpdateBranding("backgroundType", isVideo ? "video" : "image");
          }
          toast.success(`${file.name} uploaded and applied!`);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to upload file");
      } finally {
        setIsUploading(null);
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleFavorite = (url: string) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const currentFavs = prev.branding.favoriteWallpapers || [];
      const exists = currentFavs.includes(url);
      const newFavs = exists ? currentFavs.filter((u) => u !== url) : [...currentFavs, url];
      const updated = {
        ...prev,
        branding: { ...prev.branding, favoriteWallpapers: newFavs },
      };
      triggerAutoSave(updated);
      toast.success(exists ? "Removed from favorites" : "Added to favorites!");
      return updated;
    });
    setIsDirty(true);
  };

  const branding = settings.branding;
  const seo = settings.seo;
  const features = settings.features || {
    allowUserCustomBackground: true,
    allowUserTransparency: true,
    allowUserBlur: true,
    allowUserTheme: true,
    allowUserWallpapers: true,
    enablePublicBackground: true,
    enableVideoBackground: true,
    enableMotdBanner: true,
    enableGlassmorphism: true,
    defaultUserTheme: "dark",
    lastSavedTime: new Date().toISOString(),
  };

  const currentBgUrl = branding.backgroundUrl || "";
  const currentBgType = branding.backgroundType || "image";
  const currentTransparency = branding.panelTransparency ?? 35;
  const currentBlur = branding.panelBlur ?? 16;
  const currentOpacity = branding.backgroundOpacity ?? 100;
  const previewSurfaceAlpha = Math.max(0.08, 1 - currentTransparency / 100);

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Website Settings"
        subtitle="Manage Global Panel Branding, 4K Wallpapers, Glassmorphism, SEO, and User Permission Features"
        action={
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900/60">
              <Zap className={`h-3.5 w-3.5 ${autoSave ? "text-amber-400 fill-amber-400" : "text-zinc-500"}`} />
              <span className="text-xs text-zinc-300 font-medium">Auto-Save</span>
              <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowResetConfirmModal(true)}
              className="h-8 text-xs gap-1.5 border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-950/20"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset All</span>
            </Button>

            <Button
              size="sm"
              variant="studio"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate(settings)}
              className="h-8 text-xs gap-1.5 shadow-md shadow-violet-600/30"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saveMutation.isPending ? "Saving..." : "Save Settings"}</span>
              {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />}
            </Button>
          </div>
        }
      />

      <main className="p-6 sm:p-8 max-w-6xl space-y-8">
        {/* TABS NAVBAR BAR = [ Branding , Background , SEO , Features ] */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900/90 border border-white/10 p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-lg shadow-black/40">
            <TabsTrigger
              value="branding"
              className="text-xs font-semibold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Palette className="h-4 w-4 text-violet-300" />
              <span>Branding</span>
            </TabsTrigger>
            <TabsTrigger
              value="background"
              className="text-xs font-semibold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <ImageIcon className="h-4 w-4 text-cyan-300" />
              <span>Background</span>
            </TabsTrigger>
            <TabsTrigger
              value="seo"
              className="text-xs font-semibold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Search className="h-4 w-4 text-emerald-300" />
              <span>SEO</span>
            </TabsTrigger>
            <TabsTrigger
              value="features"
              className="text-xs font-semibold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Layers className="h-4 w-4 text-amber-300" />
              <span>Features (fhichacr)</span>
            </TabsTrigger>
          </TabsList>

          {/* ========================================================= */}
          {/* TAB 1: BRANDING (Panel Name, Logo, Favicon, MOTD)       */}
          {/* ========================================================= */}
          <TabsContent value="branding" className="space-y-6 mt-6">
            {/* 1. PANEL NAME & TAGLINE */}
            <Card className="border-white/10 bg-zinc-900/40 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="h-4 w-4 text-violet-400" />
                  Panel Identity & Brand Name
                </CardTitle>
                <CardDescription className="text-xs">
                  Global panel name, tagline, and mission statement applied dynamically across the website and browser title
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">Panel Name</label>
                    <Input
                      value={branding.panelName || ""}
                      onChange={(e) => handleUpdateBranding("panelName", e.target.value)}
                      placeholder="NOVA STUDIO"
                      className="bg-zinc-950/80 border-white/10 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">Tagline</label>
                    <Input
                      value={branding.siteTagline || ""}
                      onChange={(e) => handleUpdateBranding("siteTagline", e.target.value)}
                      placeholder="Crafting transcendent digital experiences"
                      className="bg-zinc-950/80 border-white/10 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. PANEL LOGO (Upload + URL + Live Preview) */}
            <Card className="border-white/10 bg-zinc-900/40 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-violet-400" />
                  Panel Logo
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload logo image or enter URL with instant live preview. Supports PNG, JPG, SVG, WebP up to 50MB.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Input
                    value={branding.panelLogo || ""}
                    onChange={(e) => handleUpdateBranding("panelLogo", e.target.value)}
                    placeholder="https://... or /uploads/logo.png"
                    className="flex-1 font-mono text-xs bg-zinc-950 border-white/10"
                  />
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleGenericUpload("panelLogo", e)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="studio"
                    disabled={isUploading === "panelLogo"}
                    onClick={() => logoFileRef.current?.click()}
                    className="h-9 text-xs gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isUploading === "panelLogo" ? "Uploading..." : "Upload Logo"}</span>
                  </Button>
                  {branding.panelLogo && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateBranding("panelLogo", "")}
                      className="h-9 text-xs text-red-400 hover:text-red-300 border-white/10"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                {/* Live Logo Preview Box */}
                <div className="p-4 rounded-2xl border border-white/10 bg-zinc-950/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                      {branding.panelLogo ? (
                        <img src={branding.panelLogo} alt="Logo Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-extrabold text-violet-400 text-sm">
                          {(branding.panelName || "N").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Live Logo Preview</span>
                      <span className="text-sm font-bold text-white">{branding.panelName || "NOVA STUDIO"}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-zinc-400 border-white/10">
                    {branding.panelLogo ? "Custom Asset" : "Monogram Fallback"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* 3. PANEL FAVICON (Name + Upload + URL + Live Browser Tab Mock) */}
            <Card className="border-white/10 bg-zinc-900/40 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="h-4 w-4 text-cyan-400" />
                  Panel Favicon & Tab Title
                </CardTitle>
                <CardDescription className="text-xs">
                  Favicon logo, browser tab name, and live tab preview updated without full page reload
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Favicon Name / Tab Suffix</label>
                  <Input
                    value={branding.panelFaviconName || ""}
                    onChange={(e) => handleUpdateBranding("panelFaviconName", e.target.value)}
                    placeholder="Nova Web Panel"
                    className="bg-zinc-950/80 border-white/10 text-xs"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Input
                    value={branding.panelFaviconLogo || ""}
                    onChange={(e) => handleUpdateBranding("panelFaviconLogo", e.target.value)}
                    placeholder="/favicon.ico or https://.../icon.png"
                    className="flex-1 font-mono text-xs bg-zinc-950 border-white/10"
                  />
                  <input
                    ref={faviconFileRef}
                    type="file"
                    accept="image/*,.ico"
                    onChange={(e) => handleGenericUpload("panelFaviconLogo", e)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="studio"
                    disabled={isUploading === "panelFaviconLogo"}
                    onClick={() => faviconFileRef.current?.click()}
                    className="h-9 text-xs gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isUploading === "panelFaviconLogo" ? "Uploading..." : "Upload Favicon"}</span>
                  </Button>
                </div>

                {/* Live Browser Tab Mockup */}
                <div className="p-3.5 rounded-2xl border border-white/10 bg-zinc-950/60 flex items-center gap-3">
                  <div className="h-5 w-5 rounded-md bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {branding.panelFaviconLogo ? (
                      <img src={branding.panelFaviconLogo} alt="Favicon" className="h-full w-full object-contain" />
                    ) : (
                      <Globe className="h-3 w-3 text-cyan-400" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Browser Tab Mockup</span>
                    <span className="text-xs font-semibold text-zinc-200 truncate block">
                      {branding.panelName || "Nova Studio"} {branding.panelFaviconName ? `— ${branding.panelFaviconName}` : ""}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. PANEL MOTD (Message of the Day + Image + Positioning + Visibility) */}
            <Card className="border-white/10 bg-zinc-900/40 rounded-3xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <BellRing className="h-4 w-4 text-amber-400" />
                      Panel MOTD (Message Of The Day)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Live announcement banner with text, subtitle, action URL, and logo image
                    </CardDescription>
                  </div>
                  <Switch
                    checked={branding.panelMotdEnabled !== false}
                    onCheckedChange={(checked) => handleUpdateBranding("panelMotdEnabled", checked)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">MOTD Main Headline</label>
                  <Textarea
                    rows={2}
                    value={branding.panelMotd || ""}
                    onChange={(e) => handleUpdateBranding("panelMotd", e.target.value)}
                    placeholder="Welcome to Nova Studio — Elite Engineering & Creative System"
                    className="bg-zinc-950/80 border-white/10 text-xs sm:text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">MOTD Subtitle</label>
                    <Input
                      value={branding.panelMotdSubtitle || ""}
                      onChange={(e) => handleUpdateBranding("panelMotdSubtitle", e.target.value)}
                      placeholder="Latest stable build"
                      className="bg-zinc-950/80 border-white/10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">Action URL</label>
                    <Input
                      value={branding.panelMotdLink || ""}
                      onChange={(e) => handleUpdateBranding("panelMotdLink", e.target.value)}
                      placeholder="https://... or /tutorials"
                      className="bg-zinc-950/80 border-white/10 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">Image Positioning</label>
                    <select
                      value={branding.panelMotdPosition || "left"}
                      onChange={(e) => handleUpdateBranding("panelMotdPosition", e.target.value as any)}
                      className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white"
                    >
                      <option value="left">Left Icon</option>
                      <option value="right">Right Icon</option>
                      <option value="top">Top Badge</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Input
                    value={branding.panelMotdImage || ""}
                    onChange={(e) => handleUpdateBranding("panelMotdImage", e.target.value)}
                    placeholder="MOTD Image URL (e.g. /uploads/banner.png)"
                    className="flex-1 font-mono text-xs bg-zinc-950 border-white/10"
                  />
                  <input
                    ref={motdFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleGenericUpload("panelMotdImage", e)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="studio"
                    disabled={isUploading === "panelMotdImage"}
                    onClick={() => motdFileRef.current?.click()}
                    className="h-9 text-xs gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Image</span>
                  </Button>
                </div>

                {/* Live Banner Mockup */}
                <div className="p-3.5 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/70 via-zinc-950 to-indigo-950/70">
                  <span className="text-[10px] uppercase font-bold text-violet-400 block tracking-wider mb-1">
                    Live MOTD Banner Mockup
                  </span>
                  <div className="flex items-center gap-3">
                    {branding.panelMotdImage ? (
                      <img src={branding.panelMotdImage} alt="MOTD" className="h-7 w-7 rounded-lg object-cover border border-violet-400/30" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      {branding.panelMotd || "No MOTD message currently configured"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 2: BACKGROUND (4K Wallpapers, Sliders, Fit, Overlay) */}
          {/* ========================================================= */}
          <TabsContent value="background" className="space-y-8 mt-6">
            {/* LIVE PREVIEW STAGE WITH DESKTOP & MOBILE TOGGLE */}
            <Card className="border-white/15 bg-zinc-950/60 overflow-hidden shadow-2xl rounded-3xl">
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      Live Interactive Glassmorphism Stage
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Real-time interactive preview of background, transparency, and blur
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-white/10">
                      <button
                        type="button"
                        onClick={() => setPreviewMode("desktop")}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          previewMode === "desktop" ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                        }`}
                        title="Desktop Preview"
                      >
                        <Monitor className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode("mobile")}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          previewMode === "mobile" ? "bg-violet-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                        }`}
                        title="Mobile Preview"
                      >
                        <Smartphone className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 flex items-center justify-center">
                <div
                  className={`relative rounded-2xl overflow-hidden border border-white/15 flex items-center justify-center p-6 shadow-inner transition-all duration-300 ${
                    previewMode === "desktop" ? "w-full h-72 sm:h-80" : "w-72 h-96"
                  }`}
                >
                  {/* Background Layer */}
                  {currentBgType === "image" && currentBgUrl && (
                    <div
                      className="absolute inset-0 transition-all duration-500"
                      style={{
                        backgroundImage: `url(${currentBgUrl})`,
                        backgroundSize: branding.backgroundFit || "cover",
                        backgroundPosition: branding.backgroundPosition || "center",
                        opacity: currentOpacity / 100,
                      }}
                    />
                  )}

                  {currentBgType === "video" && currentBgUrl && (
                    <video
                      autoPlay={branding.videoAutoplay !== false}
                      loop={branding.videoLoop !== false}
                      muted={branding.videoMuted !== false}
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                      style={{ opacity: currentOpacity / 100 }}
                      src={currentBgUrl}
                    />
                  )}

                  {currentBgType === "color" && (
                    <div
                      className="absolute inset-0 transition-colors duration-500"
                      style={{
                        backgroundColor: currentBgUrl || "#09090b",
                        opacity: currentOpacity / 100,
                      }}
                    />
                  )}

                  {currentBgType === "gradient" && (
                    <div
                      className="absolute inset-0 transition-all duration-500"
                      style={{
                        background: `linear-gradient(${branding.gradientAngle || 135}deg, ${branding.gradientFrom || "#7c3aed"}, ${branding.gradientTo || "#06b6d4"})`,
                        opacity: currentOpacity / 100,
                      }}
                    />
                  )}

                  {/* Optional Overlay Tint */}
                  {(branding.overlayOpacity ?? 0) > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none transition-all"
                      style={{
                        backgroundColor: branding.overlayColor || "#09090b",
                        opacity: (branding.overlayOpacity ?? 0) / 100,
                      }}
                    />
                  )}

                  {/* Sample Glass Panel Card */}
                  <div
                    className="relative z-10 w-full max-w-sm sm:max-w-md rounded-2xl border border-white/20 p-4 sm:p-5 shadow-2xl transition-all duration-200"
                    style={{
                      backgroundColor: `rgba(18, 17, 26, ${previewSurfaceAlpha})`,
                      backdropFilter: `blur(${currentBlur}px)`,
                      WebkitBackdropFilter: `blur(${currentBlur}px)`,
                    }}
                  >
                    <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        {branding.panelLogo ? (
                          <img src={branding.panelLogo} alt="Logo" className="h-7 w-7 rounded-lg object-cover border border-white/10" />
                        ) : (
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs">
                            {(branding.panelName || "N").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-white tracking-wide">
                            {branding.panelName || "NOVA STUDIO"}
                          </h4>
                          <p className="text-[9px] text-zinc-300">{branding.panelFaviconName || "Glass Stage"}</p>
                        </div>
                      </div>
                      <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[9px]">
                        {currentBgType.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 my-3">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                        <span className="text-[9px] text-zinc-400 block">Transparency</span>
                        <span className="text-xs font-extrabold text-cyan-300 font-mono">
                          {currentTransparency}%
                        </span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                        <span className="text-[9px] text-zinc-400 block">Backdrop Blur</span>
                        <span className="text-xs font-extrabold text-violet-300 font-mono">
                          {currentBlur}px
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-300 pt-1.5 border-t border-white/10">
                      <span className="truncate max-w-[180px]">{currentBgUrl || "Solid / Gradient"}</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Live
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SLIDERS CONTROLS: TRANSPARENCY, BLUR, OPACITY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Transparency Control Slider */}
              <div className="p-5 rounded-3xl border border-white/10 bg-zinc-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
                    <label className="text-xs font-bold text-white">Transparency Control</label>
                  </div>
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                    {currentTransparency}%
                  </span>
                </div>

                <Slider
                  value={currentTransparency}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(val) => handleUpdateBranding("panelTransparency", val)}
                />

                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>0% (Solid Surface)</span>
                  <span>50%</span>
                  <span>100% (Translucent Glass)</span>
                </div>
              </div>

              {/* Blur Control Slider */}
              <div className="p-5 rounded-3xl border border-white/10 bg-zinc-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <label className="text-xs font-bold text-white">Blur Control (Glassmorphism)</label>
                  </div>
                  <span className="font-mono text-xs font-bold text-violet-400 bg-violet-950/60 border border-violet-500/30 px-2 py-0.5 rounded-lg">
                    {currentBlur}px
                  </span>
                </div>

                <Slider
                  value={currentBlur}
                  min={0}
                  max={40}
                  step={1}
                  onChange={(val) => handleUpdateBranding("panelBlur", val)}
                />

                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                  <span>0px (Crisp Sharp)</span>
                  <span>20px</span>
                  <span>40px (Ultra Frosted)</span>
                </div>
              </div>
            </div>

            {/* BACKGROUND CONTROLS: FIT, POSITION, OVERLAY OPACITY */}
            <div className="p-5 rounded-3xl border border-white/10 bg-zinc-900/50 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Background Layout & Overlay Settings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Image Fit</label>
                  <select
                    value={branding.backgroundFit || "cover"}
                    onChange={(e) => handleUpdateBranding("backgroundFit", e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs text-white"
                  >
                    <option value="cover">Cover (Fill Screen)</option>
                    <option value="contain">Contain (Fit in Bounds)</option>
                    <option value="fill">Fill (Stretch)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Position</label>
                  <select
                    value={branding.backgroundPosition || "center"}
                    onChange={(e) => handleUpdateBranding("backgroundPosition", e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs text-white"
                  >
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-400">Wallpaper Brightness</label>
                    <span className="text-xs font-mono text-zinc-300">{currentOpacity}%</span>
                  </div>
                  <Slider
                    value={currentOpacity}
                    min={10}
                    max={100}
                    step={1}
                    onChange={(val) => handleUpdateBranding("backgroundOpacity", val)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-zinc-400">Dark Overlay Opacity</label>
                    <span className="text-xs font-mono text-zinc-300">{branding.overlayOpacity ?? 0}%</span>
                  </div>
                  <Slider
                    value={branding.overlayOpacity ?? 0}
                    min={0}
                    max={90}
                    step={1}
                    onChange={(val) => handleUpdateBranding("overlayOpacity", val)}
                  />
                </div>
              </div>
            </div>

            {/* BACKGROUND SOURCE SELECTOR */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-violet-400" />
                    Panel Background Sources
                  </h3>
                  <p className="text-xs text-zinc-400">
                    4K Wallpapers browser, local file uploads, direct URL, or theme color palette
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-white/10 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setBgSourceTab("browser")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      bgSourceTab === "browser"
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    4K Wallpapers
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgSourceTab("upload")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      bgSourceTab === "upload"
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Upload Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgSourceTab("url")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      bgSourceTab === "url"
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Direct URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgSourceTab("color")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      bgSourceTab === "color"
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Color & Palette
                  </button>
                  <button
                    type="button"
                    onClick={() => setBgSourceTab("gradient")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      bgSourceTab === "gradient"
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Gradient
                  </button>
                </div>
              </div>

              {/* 1. 4K WALLPAPER BROWSER */}
              {bgSourceTab === "browser" && (
                <Card className="border-white/10 bg-zinc-900/40 p-6 rounded-3xl">
                  <WallpaperBrowser
                    currentUrl={currentBgUrl}
                    favoriteWallpapers={branding.favoriteWallpapers || []}
                    onSelectWallpaper={(url, type) => {
                      handleUpdateBranding("backgroundUrl", url);
                      handleUpdateBranding("backgroundType", type);
                    }}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </Card>
              )}

              {/* 2. UPLOAD MEDIA */}
              {bgSourceTab === "upload" && (
                <Card className="border-white/10 bg-zinc-900/40 p-8 rounded-3xl text-center">
                  <div className="max-w-md mx-auto space-y-4">
                    <Upload className="h-10 w-10 text-violet-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">Upload Background Image or Video</h4>
                    <p className="text-xs text-zinc-400">
                      Supports PNG, JPG, WEBP, GIF, MP4, and WEBM video clips up to 50MB.
                    </p>

                    <input
                      ref={bgFileRef}
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      onChange={(e) => handleGenericUpload("backgroundUrl", e)}
                      className="hidden"
                    />

                    <Button
                      type="button"
                      variant="studio"
                      disabled={isUploading === "backgroundUrl"}
                      onClick={() => bgFileRef.current?.click()}
                      className="text-xs gap-2 px-6 h-10 shadow-lg shadow-violet-600/30"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{isUploading === "backgroundUrl" ? "Uploading Media..." : "Select File"}</span>
                    </Button>
                  </div>
                </Card>
              )}

              {/* 3. DIRECT URL */}
              {bgSourceTab === "url" && (
                <Card className="border-white/10 bg-zinc-900/40 p-6 rounded-3xl">
                  <div className="max-w-xl mx-auto space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-cyan-400" />
                      Paste Online Image or Video URL
                    </h4>
                    <div className="flex gap-2">
                      <Input
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://images.unsplash.com/... or https://4kwallpapers.com/..."
                        className="bg-zinc-950 border-white/10 text-xs font-mono"
                      />
                      <Button
                        type="button"
                        variant="studio"
                        onClick={() => {
                          if (!customUrlInput.trim()) return;
                          const isVid = /\.(mp4|webm|mov)(\?.*)?$/i.test(customUrlInput);
                          handleUpdateBranding("backgroundUrl", customUrlInput.trim());
                          handleUpdateBranding("backgroundType", isVid ? "video" : "image");
                          toast.success("Applied custom URL!");
                        }}
                        className="text-xs"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* 4. SOLID COLOR & PALETTE */}
              {bgSourceTab === "color" && (
                <Card className="border-white/10 bg-zinc-900/40 p-6 rounded-3xl">
                  <div className="max-w-3xl mx-auto space-y-6">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Palette className="h-4 w-4 text-violet-400" />
                      Color Palette & Accent Themes
                    </h4>

                    {/* Quick Presets */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-zinc-300">Quick Palette Presets:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              handleUpdateBranding("primaryColor", preset.primary);
                              handleUpdateBranding("accentColor", preset.accent);
                              handleUpdateBranding("glassTint", preset.tint);
                              toast.success(`Preset "${preset.name}" applied!`);
                            }}
                            className="p-2.5 rounded-xl border border-white/10 bg-zinc-950/60 hover:border-violet-500/50 transition-all text-left flex flex-col gap-1.5"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.primary }} />
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.accent }} />
                            </div>
                            <span className="text-[11px] font-semibold text-white truncate">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Primary Accent</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={branding.primaryColor || "#7c3aed"}
                            onChange={(e) => handleUpdateBranding("primaryColor", e.target.value)}
                            className="h-9 w-10 rounded border border-white/10 bg-zinc-800 p-0.5 cursor-pointer"
                          />
                          <Input
                            value={branding.primaryColor || "#7c3aed"}
                            onChange={(e) => handleUpdateBranding("primaryColor", e.target.value)}
                            className="font-mono text-xs uppercase bg-zinc-950"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Secondary Accent</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={branding.accentColor || "#06b6d4"}
                            onChange={(e) => handleUpdateBranding("accentColor", e.target.value)}
                            className="h-9 w-10 rounded border border-white/10 bg-zinc-800 p-0.5 cursor-pointer"
                          />
                          <Input
                            value={branding.accentColor || "#06b6d4"}
                            onChange={(e) => handleUpdateBranding("accentColor", e.target.value)}
                            className="font-mono text-xs uppercase bg-zinc-950"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Glass Tint Base</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={branding.glassTint || "#12111a"}
                            onChange={(e) => handleUpdateBranding("glassTint", e.target.value)}
                            className="h-9 w-10 rounded border border-white/10 bg-zinc-800 p-0.5 cursor-pointer"
                          />
                          <Input
                            value={branding.glassTint || "#12111a"}
                            onChange={(e) => handleUpdateBranding("glassTint", e.target.value)}
                            className="font-mono text-xs uppercase bg-zinc-950"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 5. GRADIENT BACKGROUND */}
              {bgSourceTab === "gradient" && (
                <Card className="border-white/10 bg-zinc-900/40 p-6 rounded-3xl">
                  <div className="max-w-xl mx-auto space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Palette className="h-4 w-4 text-violet-400" />
                      Configure Smooth Gradient Background
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1">Color 1</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={branding.gradientFrom || "#7c3aed"}
                            onChange={(e) => {
                              handleUpdateBranding("gradientFrom", e.target.value);
                              handleUpdateBranding("backgroundType", "gradient");
                            }}
                            className="h-8 w-10 rounded border border-white/10 bg-zinc-900 cursor-pointer p-0.5"
                          />
                          <Input
                            value={branding.gradientFrom || "#7c3aed"}
                            onChange={(e) => {
                              handleUpdateBranding("gradientFrom", e.target.value);
                              handleUpdateBranding("backgroundType", "gradient");
                            }}
                            className="font-mono text-xs uppercase bg-zinc-950"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-zinc-400 block mb-1">Color 2</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={branding.gradientTo || "#06b6d4"}
                            onChange={(e) => {
                              handleUpdateBranding("gradientTo", e.target.value);
                              handleUpdateBranding("backgroundType", "gradient");
                            }}
                            className="h-8 w-10 rounded border border-white/10 bg-zinc-900 cursor-pointer p-0.5"
                          />
                          <Input
                            value={branding.gradientTo || "#06b6d4"}
                            onChange={(e) => {
                              handleUpdateBranding("gradientTo", e.target.value);
                              handleUpdateBranding("backgroundType", "gradient");
                            }}
                            className="font-mono text-xs uppercase bg-zinc-950"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 3: SEO (Metadata, OpenGraph, SERP Preview, Robots)   */}
          {/* ========================================================= */}
          <TabsContent value="seo" className="space-y-6 mt-6">
            <Card className="border-white/10 bg-zinc-900/40 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Search className="h-4 w-4 text-cyan-400" />
                  Search Engine Optimization (SEO) & Social Previews
                </CardTitle>
                <CardDescription className="text-xs">
                  Global meta tags, OpenGraph social cards, and search discoverability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-300">Meta Title Tag</label>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {(seo.metaTitle || "").length} / 60 characters
                    </span>
                  </div>
                  <Input
                    value={seo.metaTitle || ""}
                    onChange={(e) => handleUpdateSeo("metaTitle", e.target.value)}
                    className="font-medium bg-zinc-950/80 border-white/10 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-300">Meta Description</label>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {(seo.metaDescription || "").length} / 160 characters
                    </span>
                  </div>
                  <Textarea
                    rows={3}
                    value={seo.metaDescription || ""}
                    onChange={(e) => handleUpdateSeo("metaDescription", e.target.value)}
                    className="bg-zinc-950/80 border-white/10 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Canonical URL</label>
                    <Input
                      value={seo.canonicalUrl || ""}
                      onChange={(e) => handleUpdateSeo("canonicalUrl", e.target.value)}
                      placeholder="https://yourdomain.com"
                      className="bg-zinc-950/80 border-white/10 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Robots Indexing</label>
                    <select
                      value={seo.robotsIndex || "index, follow"}
                      onChange={(e) => handleUpdateSeo("robotsIndex", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white"
                    >
                      <option value="index, follow">Index, Follow (Recommended)</option>
                      <option value="noindex, nofollow">Noindex, Nofollow (Private)</option>
                      <option value="index, nofollow">Index, Nofollow</option>
                      <option value="noindex, follow">Noindex, Follow</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">OG Share Image URL</label>
                    <Input
                      value={seo.ogImageUrl || ""}
                      onChange={(e) => handleUpdateSeo("ogImageUrl", e.target.value)}
                      className="font-mono text-xs bg-zinc-950/80 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Twitter / X Handle</label>
                    <Input
                      value={seo.twitterHandle || ""}
                      onChange={(e) => handleUpdateSeo("twitterHandle", e.target.value)}
                      className="font-mono text-xs bg-zinc-950/80 border-white/10"
                    />
                  </div>
                </div>

                {/* Google SERP Snippet Mockup */}
                <div className="p-4 rounded-2xl border border-white/10 bg-zinc-950/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider mb-1">
                    Google Search Result Mockup
                  </span>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {seo.canonicalUrl || "https://yourdomain.com"}
                  </p>
                  <h4 className="text-sm font-semibold text-cyan-400 hover:underline cursor-pointer">
                    {seo.metaTitle || "Nova Studio — High Impact Digital Architecture"}
                  </h4>
                  <p className="text-xs text-zinc-300 line-clamp-2">
                    {seo.metaDescription || "Elite creative studio specializing in modern web design and scalable web systems."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 4: FEATURES (User Permissions, Display Toggles)       */}
          {/* ========================================================= */}
          <TabsContent value="features" className="space-y-6 mt-6">
            {/* User Permissions & Feature Toggles */}
            <Card className="border-white/10 bg-zinc-900/40 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  User Permissions & Customization Controls (fhichacr)
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure which personalization features Normal Users can modify on their dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-zinc-950/50">
                  <div>
                    <h5 className="text-xs font-bold text-white">Allow Users Custom Backgrounds</h5>
                    <p className="text-[11px] text-zinc-400">
                      Normal users can pick personal 4K wallpapers, colors, or uploaded backgrounds
                    </p>
                  </div>
                  <Switch
                    checked={features.allowUserCustomBackground !== false}
                    onCheckedChange={(checked) => handleUpdateFeature("allowUserCustomBackground", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-zinc-950/50">
                  <div>
                    <h5 className="text-xs font-bold text-white">Allow Users Transparency Slider</h5>
                    <p className="text-[11px] text-zinc-400">
                      Normal users can adjust personal surface opacity (0% to 100%)
                    </p>
                  </div>
                  <Switch
                    checked={features.allowUserTransparency !== false}
                    onCheckedChange={(checked) => handleUpdateFeature("allowUserTransparency", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-zinc-950/50">
                  <div>
                    <h5 className="text-xs font-bold text-white">Allow Users Blur (Glassmorphism) Slider</h5>
                    <p className="text-[11px] text-zinc-400">
                      Normal users can adjust personal backdrop blur (0px to 40px)
                    </p>
                  </div>
                  <Switch
                    checked={features.allowUserBlur !== false}
                    onCheckedChange={(checked) => handleUpdateFeature("allowUserBlur", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-zinc-950/50">
                  <div>
                    <h5 className="text-xs font-bold text-white">Enable 4K Wallpaper on Normal Public Website</h5>
                    <p className="text-[11px] text-zinc-400">
                      Renders the custom wallpaper, transparency, and blur on the public normal site as well as admin.
                    </p>
                  </div>
                  <Switch
                    checked={features.enablePublicBackground !== false}
                    onCheckedChange={(checked) => handleUpdateFeature("enablePublicBackground", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-zinc-950/50">
                  <div>
                    <h5 className="text-xs font-bold text-white">Enable Background Video Playback</h5>
                    <p className="text-[11px] text-zinc-400">
                      Permits looping video backgrounds on supported viewports
                    </p>
                  </div>
                  <Switch
                    checked={features.enableVideoBackground !== false}
                    onCheckedChange={(checked) => handleUpdateFeature("enableVideoBackground", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Links Manager */}
            <Card className="border-white/10 bg-zinc-900/40 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-emerald-400" />
                    Footer Social Links
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure social media icons displayed in public footer
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newSocial: SocialLink = {
                      id: `social-${Date.now()}`,
                      platform: "github",
                      label: "Platform",
                      url: "https://",
                      enabled: true,
                    };
                    setSettings((prev) => {
                      if (!prev) return prev;
                      const updated = { ...prev, socials: [...prev.socials, newSocial] };
                      triggerAutoSave(updated);
                      return updated;
                    });
                    setIsDirty(true);
                  }}
                  className="gap-1.5 text-xs border-white/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Link</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.socials.map((social) => (
                  <div
                    key={social.id}
                    className="p-3.5 rounded-xl border border-white/10 bg-zinc-950/60 flex flex-col sm:flex-row items-center gap-4 justify-between"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <select
                        value={social.platform}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettings((prev) => {
                            if (!prev) return prev;
                            const updated = {
                              ...prev,
                              socials: prev.socials.map((s) => (s.id === social.id ? { ...s, platform: val as any } : s)),
                            };
                            triggerAutoSave(updated);
                            return updated;
                          });
                          setIsDirty(true);
                        }}
                        className="rounded-lg border border-white/10 bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="github">GitHub</option>
                        <option value="twitter">X / Twitter</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="dribbble">Dribbble</option>
                        <option value="instagram">Instagram</option>
                        <option value="youtube">YouTube</option>
                        <option value="other">Other Link</option>
                      </select>
                      <Input
                        value={social.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettings((prev) => {
                            if (!prev) return prev;
                            const updated = {
                              ...prev,
                              socials: prev.socials.map((s) => (s.id === social.id ? { ...s, label: val } : s)),
                            };
                            triggerAutoSave(updated);
                            return updated;
                          });
                          setIsDirty(true);
                        }}
                        placeholder="Label"
                        className="w-32 text-xs bg-zinc-900 border-white/10"
                      />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
                      <Input
                        value={social.url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSettings((prev) => {
                            if (!prev) return prev;
                            const updated = {
                              ...prev,
                              socials: prev.socials.map((s) => (s.id === social.id ? { ...s, url: val } : s)),
                            };
                            triggerAutoSave(updated);
                            return updated;
                          });
                          setIsDirty(true);
                        }}
                        placeholder="https://..."
                        className="text-xs font-mono bg-zinc-900 border-white/10"
                      />
                      <Switch
                        checked={social.enabled}
                        onCheckedChange={(checked) => {
                          setSettings((prev) => {
                            if (!prev) return prev;
                            const updated = {
                              ...prev,
                              socials: prev.socials.map((s) => (s.id === social.id ? { ...s, enabled: checked } : s)),
                            };
                            triggerAutoSave(updated);
                            return updated;
                          });
                          setIsDirty(true);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSettings((prev) => {
                            if (!prev) return prev;
                            const updated = {
                              ...prev,
                              socials: prev.socials.filter((s) => s.id !== social.id),
                            };
                            triggerAutoSave(updated);
                            return updated;
                          });
                          setIsDirty(true);
                        }}
                        className="text-zinc-500 hover:text-red-400 p-1"
                        title="Delete social link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* CONFIRMATION MODAL BEFORE RESETTING GLOBAL SETTINGS */}
      {showResetConfirmModal && (
        <Dialog open={showResetConfirmModal} onOpenChange={setShowResetConfirmModal}>
          <DialogContent className="max-w-md bg-zinc-950 border border-white/15 p-6 rounded-2xl shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-white">Reset All Settings?</DialogTitle>
                  <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                    This will restore global branding, background, SEO, and feature permissions to default settings.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-white/10 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirmModal(false)}
                className="text-xs border-white/10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={resetMutation.isPending}
                onClick={() => resetMutation.mutate()}
                className="text-xs"
              >
                {resetMutation.isPending ? "Resetting..." : "Yes, Reset All"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
