"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Sliders,
  Palette,
  Search,
  Share2,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Video,
  Link2,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Star,
  Eye,
  Check,
  Zap,
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
import { WallpaperBrowser } from "@/components/admin/WallpaperBrowser";
import { toast } from "sonner";
import { SiteSettings, SocialLink } from "@nova/shared";

const DEFAULT_SETTINGS = {
  backgroundType: "image" as const,
  backgroundUrl:
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=3840&auto=format&fit=crop",
  backgroundOpacity: 100,
  panelTransparency: 35,
  panelBlur: 16,
};

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [activeTab, setActiveTab] = useState("panel-bg");
  const [bgSourceTab, setBgSourceTab] = useState<"browser" | "upload" | "url" | "color">("browser");
  const [isDirty, setIsDirty] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data, isLoading, refetch } = useQuery<{ success: boolean; settings: SiteSettings }>({
    queryKey: ["siteSettings"],
    queryFn: async () => (await api.get("/api/admin/settings")).data,
  });

  useEffect(() => {
    if (data?.settings) {
      const cloned = JSON.parse(JSON.stringify(data.settings));
      // Ensure defaults for panel background customization
      if (cloned.branding) {
        cloned.branding.backgroundType = cloned.branding.backgroundType || DEFAULT_SETTINGS.backgroundType;
        cloned.branding.backgroundUrl =
          cloned.branding.backgroundUrl !== undefined
            ? cloned.branding.backgroundUrl
            : DEFAULT_SETTINGS.backgroundUrl;
        cloned.branding.backgroundOpacity =
          cloned.branding.backgroundOpacity !== undefined
            ? cloned.branding.backgroundOpacity
            : DEFAULT_SETTINGS.backgroundOpacity;
        cloned.branding.panelTransparency =
          cloned.branding.panelTransparency !== undefined
            ? cloned.branding.panelTransparency
            : DEFAULT_SETTINGS.panelTransparency;
        cloned.branding.panelBlur =
          cloned.branding.panelBlur !== undefined
            ? cloned.branding.panelBlur
            : DEFAULT_SETTINGS.panelBlur;
        cloned.branding.favoriteWallpapers = cloned.branding.favoriteWallpapers || [];
      }
      setSettings(cloned);
      setIsDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: SiteSettings) => {
      const res = await api.put("/api/admin/settings", payload);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Website settings saved successfully");
      setIsDirty(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save settings");
    },
  });

  // Handle auto-save debounce
  const triggerAutoSave = (updated: SiteSettings) => {
    if (!autoSave) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
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
      triggerAutoSave(updated);
      return updated;
    });
    setIsDirty(true);
  };

  const handleUpdateSeo = (field: string, value: any) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        seo: { ...prev.seo, [field]: value },
      };
      triggerAutoSave(updated);
      return updated;
    });
    setIsDirty(true);
  };

  const handleAddSocial = () => {
    const newSocial: SocialLink = {
      id: `social-${Date.now()}`,
      platform: "github",
      label: "Platform",
      url: "https://",
      enabled: true,
    };
    setSettings((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        socials: [...prev.socials, newSocial],
      };
      triggerAutoSave(updated);
      return updated;
    });
    setIsDirty(true);
  };

  const handleRemoveSocial = (id: string) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        socials: prev.socials.filter((s) => s.id !== id),
      };
      triggerAutoSave(updated);
      return updated;
    });
    setIsDirty(true);
  };

  const handleUpdateSocial = (id: string, field: keyof SocialLink, value: any) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        socials: prev.socials.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
      };
      triggerAutoSave(updated);
      return updated;
    });
    setIsDirty(true);
  };

  // Toggle favorite wallpaper
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

  // Handle local file upload (image or video)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setIsUploading(true);
        const base64Data = reader.result as string;
        const res = await api.post("/api/admin/upload-background", {
          fileData: base64Data,
          fileName: file.name,
          mimeType: file.type,
        });

        if (res.data.success) {
          handleUpdateBranding("backgroundUrl", res.data.url);
          handleUpdateBranding("backgroundType", isVideo ? "video" : "image");
          toast.success(res.data.message || "Background uploaded and applied!");
        }
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to upload background file");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Reset to default panel settings
  const handleResetToDefault = () => {
    setSettings((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        branding: {
          ...prev.branding,
          backgroundType: DEFAULT_SETTINGS.backgroundType,
          backgroundUrl: DEFAULT_SETTINGS.backgroundUrl,
          backgroundOpacity: DEFAULT_SETTINGS.backgroundOpacity,
          panelTransparency: DEFAULT_SETTINGS.panelTransparency,
          panelBlur: DEFAULT_SETTINGS.panelBlur,
        },
      };
      triggerAutoSave(updated);
      return updated;
    });
    setIsDirty(true);
    toast.info("Panel background and glassmorphism reset to defaults.");
  };

  const branding = settings.branding;
  const currentBgUrl = branding.backgroundUrl || DEFAULT_SETTINGS.backgroundUrl;
  const currentBgType = branding.backgroundType || "image";
  const currentTransparency = branding.panelTransparency ?? DEFAULT_SETTINGS.panelTransparency;
  const currentBlur = branding.panelBlur ?? DEFAULT_SETTINGS.panelBlur;
  const currentOpacity = branding.backgroundOpacity ?? DEFAULT_SETTINGS.backgroundOpacity;

  // Real-time glass card surface alpha: 0% transparency = 1.0 (solid), 100% = 0.05 (ultra clear)
  const previewSurfaceAlpha = Math.max(0.08, 1 - currentTransparency / 100);

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Website Settings"
        subtitle="Manage global panel background, glassmorphism design, SEO metadata, and social links"
        action={
          <div className="flex items-center gap-3">
            {/* Auto-Save Switch */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900/60">
              <Zap
                className={`h-3.5 w-3.5 ${autoSave ? "text-amber-400 fill-amber-400" : "text-zinc-500"}`}
              />
              <span className="text-xs text-zinc-300 font-medium">Auto-Save</span>
              <Switch checked={autoSave} onCheckedChange={setAutoSave} />
            </div>

            {/* Reset to Default Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetToDefault}
              className="h-8 text-xs gap-1.5 border-white/10 text-zinc-300 hover:text-white"
              title="Reset background, transparency and blur to defaults"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </Button>

            {/* Manual Save Button */}
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900/80 border border-white/10 p-1 rounded-xl flex-wrap">
            <TabsTrigger value="panel-bg" className="text-xs gap-2 py-2">
              <ImageIcon className="h-3.5 w-3.5 text-violet-400" />
              <span>Panel Background & Glass</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="text-xs gap-2 py-2">
              <Palette className="h-3.5 w-3.5 text-indigo-400" />
              <span>Branding & Design Tokens</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="text-xs gap-2 py-2">
              <Search className="h-3.5 w-3.5 text-cyan-400" />
              <span>SEO & Metadata</span>
            </TabsTrigger>
            <TabsTrigger value="socials" className="text-xs gap-2 py-2">
              <Share2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Social Links</span>
            </TabsTrigger>
          </TabsList>

          {/* ========================================================= */}
          {/* TAB 1: PANEL BACKGROUND & GLASSMORPHISM CUSTOMIZATION */}
          {/* ========================================================= */}
          <TabsContent value="panel-bg" className="space-y-8 mt-6">
            {/* LIVE PREVIEW HERO CARD */}
            <Card className="border-white/15 bg-zinc-950/60 overflow-hidden shadow-2xl shadow-black/60 rounded-3xl">
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      Live Interactive Glassmorphism Preview
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Real-time interactive preview reflecting active background, transparency, and
                      blur filters
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] gap-1 px-2.5 py-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Sync Active
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Visual Glass Stage */}
                <div className="relative h-72 sm:h-80 w-full rounded-2xl overflow-hidden border border-white/15 flex items-center justify-center p-6 shadow-inner">
                  {/* Background Media */}
                  {currentBgType === "image" && (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                      style={{
                        backgroundImage: `url(${currentBgUrl})`,
                        opacity: currentOpacity / 100,
                      }}
                    />
                  )}
                  {currentBgType === "video" && (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                      style={{ opacity: currentOpacity / 100 }}
                      src={currentBgUrl}
                    />
                  )}
                  {currentBgType === "color" && (
                    <div
                      className="absolute inset-0 transition-all duration-500"
                      style={{
                        backgroundColor: currentBgUrl || "#09090b",
                        opacity: currentOpacity / 100,
                      }}
                    />
                  )}

                  {/* Sample Glass Panel Card with Real-time Transparency & Blur */}
                  <div
                    className="relative z-10 w-full max-w-lg rounded-2xl border border-white/20 p-5 sm:p-6 shadow-2xl transition-all duration-200"
                    style={{
                      backgroundColor: `rgba(18, 17, 26, ${previewSurfaceAlpha})`,
                      backdropFilter: `blur(${currentBlur}px)`,
                      WebkitBackdropFilter: `blur(${currentBlur}px)`,
                    }}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
                          AG
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white tracking-wide">
                            NOVA GLASS PANEL
                          </h4>
                          <p className="text-[10px] text-zinc-300">Ultra Glassmorphism Surface</p>
                        </div>
                      </div>
                      <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px]">
                        {currentBgType.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 my-4">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                        <span className="text-[10px] text-zinc-400 block">Surface Transparency</span>
                        <span className="text-sm font-extrabold text-cyan-300 font-mono">
                          {currentTransparency}%
                        </span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                        <span className="text-[10px] text-zinc-400 block">Backdrop Blur</span>
                        <span className="text-sm font-extrabold text-violet-300 font-mono">
                          {currentBlur}px
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-300 pt-2 border-t border-white/10">
                      <span className="truncate max-w-[240px]">
                        {currentBgUrl ? currentBgUrl.split("/").pop()?.split("?")[0] : "Default Wallpaper"}
                      </span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Ready
                      </span>
                    </div>
                  </div>
                </div>

                {/* SLIDERS CONTROLS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/10">
                  {/* TRANSPARENCY SLIDER */}
                  <div className="space-y-3 p-4 rounded-2xl border border-white/10 bg-zinc-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
                        <label className="text-xs font-bold text-white">Panel Transparency</label>
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
                      <span>100% (Translucent)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Adjusts the background opacity of glass panels and modals across the panel.
                    </p>
                  </div>

                  {/* BLUR CONTROL SLIDER */}
                  <div className="space-y-3 p-4 rounded-2xl border border-white/10 bg-zinc-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-400" />
                        <label className="text-xs font-bold text-white">
                          Backdrop Blur (Glassmorphism)
                        </label>
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
                    <p className="text-[11px] text-zinc-400">
                      Controls CSS <code className="text-zinc-300">backdrop-filter: blur()</code>{" "}
                      for image and video backgrounds.
                    </p>
                  </div>
                </div>

                {/* BACKGROUND OPACITY SLIDER */}
                <div className="mt-4 p-4 rounded-2xl border border-white/5 bg-zinc-900/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">
                      Background Wallpaper Brightness / Opacity
                    </label>
                    <span className="font-mono text-xs font-semibold text-zinc-400">
                      {currentOpacity}%
                    </span>
                  </div>
                  <Slider
                    value={currentOpacity}
                    min={10}
                    max={100}
                    step={1}
                    onChange={(val) => handleUpdateBranding("backgroundOpacity", val)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* BACKGROUND SOURCE SELECTOR */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-violet-400" />
                    Choose Background Source
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Browse authentic 4K wallpapers, upload local photos/videos, or input direct URLs
                  </p>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-white/10">
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
                </div>
              </div>

              {/* OPTION 1: INTEGRATED 4K WALLPAPER BROWSER */}
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
                    onPreviewWallpaper={(url) => {
                      handleUpdateBranding("backgroundUrl", url);
                    }}
                  />
                </Card>
              )}

              {/* OPTION 2: UPLOAD IMAGE OR VIDEO */}
              {bgSourceTab === "upload" && (
                <Card className="border-white/10 bg-zinc-900/40 p-8 rounded-3xl">
                  <div className="max-w-xl mx-auto text-center space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-3xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                      <Upload className="h-8 w-8 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Upload Custom Background Image or Video
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Supports high-resolution PNG, JPG, WEBP, GIF, MP4, and WEBM video clips up
                        to 50MB.
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button
                        type="button"
                        variant="studio"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs gap-2 px-6 h-10 shadow-lg shadow-violet-600/30"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{isUploading ? "Uploading Media..." : "Select File from Device"}</span>
                      </Button>
                    </div>

                    <p className="text-[10px] text-zinc-500">
                      Uploaded files are permanently saved in persistent storage at{" "}
                      <code className="text-zinc-400 font-mono">/uploads/</code>
                    </p>
                  </div>
                </Card>
              )}

              {/* OPTION 3: DIRECT URL */}
              {bgSourceTab === "url" && (
                <Card className="border-white/10 bg-zinc-900/40 p-6 rounded-3xl">
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-cyan-400" />
                        Enter Image or Video URL
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Paste any online wallpaper link (e.g. from 4kwallpapers.com, Unsplash, or
                        direct MP4 video link)
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                      <Input
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://images.unsplash.com/... or https://4kwallpapers.com/..."
                        className="flex-1 text-xs font-mono bg-zinc-950 border-white/10"
                      />
                      <Button
                        type="button"
                        variant="studio"
                        onClick={() => {
                          if (!customUrlInput.trim()) {
                            toast.error("Please enter a valid URL");
                            return;
                          }
                          const isVid = /\.(mp4|webm|mov)(\?.*)?$/i.test(customUrlInput);
                          handleUpdateBranding("backgroundUrl", customUrlInput.trim());
                          handleUpdateBranding("backgroundType", isVid ? "video" : "image");
                          toast.success("Applied background URL successfully!");
                        }}
                        className="text-xs gap-1.5 h-10"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Apply URL</span>
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-xs text-zinc-400">Media Type:</span>
                      <select
                        value={currentBgType}
                        onChange={(e) =>
                          handleUpdateBranding("backgroundType", e.target.value as any)
                        }
                        className="rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1 text-xs text-white"
                      >
                        <option value="image">Image (JPG, PNG, WEBP)</option>
                        <option value="video">Video (MP4, WEBM)</option>
                        <option value="color">Solid Hex Color</option>
                      </select>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 2: BRANDING & TOKENS */}
          {/* ========================================================= */}
          <TabsContent value="branding" className="space-y-6 mt-6">
            <Card className="border-white/10 bg-zinc-900/40">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="h-4 w-4 text-violet-400" />
                  Branding Identity
                </CardTitle>
                <CardDescription className="text-xs">
                  Site identity, custom logo text, and typography
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Website Name</label>
                    <Input
                      value={branding.siteTitle}
                      onChange={(e) => handleUpdateBranding("siteTitle", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Logo Display Text</label>
                    <Input
                      value={branding.logoText}
                      onChange={(e) => handleUpdateBranding("logoText", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Tagline / Mission</label>
                  <Input
                    value={branding.siteTagline}
                    onChange={(e) => handleUpdateBranding("siteTagline", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Favicon Path</label>
                    <Input
                      value={branding.faviconUrl}
                      onChange={(e) => handleUpdateBranding("faviconUrl", e.target.value)}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Typography Font Family</label>
                    <Input
                      value={branding.fontFamily}
                      onChange={(e) => handleUpdateBranding("fontFamily", e.target.value)}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-zinc-900/40">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Color Palette & Tokens</CardTitle>
                <CardDescription className="text-xs">
                  Primary and accent hex values saved to settings.db
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Primary Accent</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) => handleUpdateBranding("primaryColor", e.target.value)}
                        className="h-9 w-10 rounded border border-white/10 bg-zinc-800 p-0.5 cursor-pointer"
                      />
                      <Input
                        value={branding.primaryColor}
                        onChange={(e) => handleUpdateBranding("primaryColor", e.target.value)}
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Secondary Accent</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={branding.accentColor}
                        onChange={(e) => handleUpdateBranding("accentColor", e.target.value)}
                        className="h-9 w-10 rounded border border-white/10 bg-zinc-800 p-0.5 cursor-pointer"
                      />
                      <Input
                        value={branding.accentColor}
                        onChange={(e) => handleUpdateBranding("accentColor", e.target.value)}
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Corner Border Radius</label>
                    <Input
                      value={branding.borderRadius}
                      onChange={(e) => handleUpdateBranding("borderRadius", e.target.value)}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 3: SEO */}
          {/* ========================================================= */}
          <TabsContent value="seo" className="space-y-6 mt-6">
            <Card className="border-white/10 bg-zinc-900/40">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Search className="h-4 w-4 text-cyan-400" />
                  Search Engine Optimization (SEO)
                </CardTitle>
                <CardDescription className="text-xs">
                  Meta tags, OpenGraph previews, and search discoverability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Meta Title Tag</label>
                  <Input
                    value={settings.seo.metaTitle}
                    onChange={(e) => handleUpdateSeo("metaTitle", e.target.value)}
                    className="mt-1 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Meta Description</label>
                  <Textarea
                    rows={3}
                    value={settings.seo.metaDescription}
                    onChange={(e) => handleUpdateSeo("metaDescription", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Keywords (comma separated)
                  </label>
                  <Input
                    value={settings.seo.keywords.join(", ")}
                    onChange={(e) =>
                      handleUpdateSeo(
                        "keywords",
                        e.target.value.split(",").map((k) => k.trim())
                      )
                    }
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Social Share Image (OG)</label>
                    <Input
                      value={settings.seo.ogImageUrl}
                      onChange={(e) => handleUpdateSeo("ogImageUrl", e.target.value)}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Twitter Handle</label>
                    <Input
                      value={settings.seo.twitterHandle}
                      onChange={(e) => handleUpdateSeo("twitterHandle", e.target.value)}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 4: SOCIAL LINKS */}
          {/* ========================================================= */}
          <TabsContent value="socials" className="space-y-6 mt-6">
            <Card className="border-white/10 bg-zinc-900/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-emerald-400" />
                    Footer Social Media Links
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure links rendered in public footer
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddSocial}
                  className="gap-1.5 text-xs border-white/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Social Link</span>
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
                        onChange={(e) =>
                          handleUpdateSocial(social.id, "platform", e.target.value)
                        }
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
                        onChange={(e) =>
                          handleUpdateSocial(social.id, "label", e.target.value)
                        }
                        placeholder="Label"
                        className="w-32 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
                      <Input
                        value={social.url}
                        onChange={(e) =>
                          handleUpdateSocial(social.id, "url", e.target.value)
                        }
                        placeholder="https://..."
                        className="text-xs font-mono"
                      />
                      <Switch
                        checked={social.enabled}
                        onCheckedChange={(checked) =>
                          handleUpdateSocial(social.id, "enabled", checked)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSocial(social.id)}
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
    </div>
  );
}
