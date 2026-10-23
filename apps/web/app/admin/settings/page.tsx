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
  Star,
  Check,
  Zap,
  Radio,
  ExternalLink,
  Layers,
  Globe,
  BellRing,
  ShieldAlert,
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
  panelName: "NOVA STUDIO",
  panelLogo: "",
  panelFaviconName: "Nova Panel",
  panelFaviconLogo: "/favicon.ico",
  panelMotd: "Welcome to Nova Studio — Elite Engineering & Creative System",
  panelMotdEnabled: true,
  panelMotdImage: "",
  panelMotdLink: "",
  backgroundType: "image" as const,
  backgroundUrl:
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=3840&auto=format&fit=crop",
  backgroundOpacity: 100,
  panelTransparency: 35,
  panelBlur: 16,
  primaryColor: "#7c3aed",
  accentColor: "#06b6d4",
  glassTint: "#12111a",
  enablePublicBackground: true,
};

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
  const [bgSourceTab, setBgSourceTab] = useState<"browser" | "upload" | "url" | "palette">("browser");
  const [isDirty, setIsDirty] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState("");

  const logoFileRef = useRef<HTMLInputElement>(null);
  const faviconFileRef = useRef<HTMLInputElement>(null);
  const motdFileRef = useRef<HTMLInputElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data, isLoading, refetch } = useQuery<{ success: boolean; settings: SiteSettings }>({
    queryKey: ["siteSettings"],
    queryFn: async () => (await api.get("/api/admin/settings")).data,
  });

  useEffect(() => {
    if (data?.settings) {
      const cloned = JSON.parse(JSON.stringify(data.settings));
      if (cloned.branding) {
        cloned.branding.panelName = cloned.branding.panelName || cloned.branding.siteTitle || DEFAULT_SETTINGS.panelName;
        cloned.branding.panelLogo = cloned.branding.panelLogo !== undefined ? cloned.branding.panelLogo : cloned.branding.logoImageUrl || "";
        cloned.branding.panelFaviconName = cloned.branding.panelFaviconName || DEFAULT_SETTINGS.panelFaviconName;
        cloned.branding.panelFaviconLogo = cloned.branding.panelFaviconLogo || cloned.branding.faviconUrl || DEFAULT_SETTINGS.panelFaviconLogo;
        cloned.branding.panelMotd = cloned.branding.panelMotd !== undefined ? cloned.branding.panelMotd : DEFAULT_SETTINGS.panelMotd;
        cloned.branding.panelMotdEnabled = cloned.branding.panelMotdEnabled !== undefined ? cloned.branding.panelMotdEnabled : true;
        cloned.branding.panelMotdImage = cloned.branding.panelMotdImage || "";
        cloned.branding.panelMotdLink = cloned.branding.panelMotdLink || "";
        cloned.branding.backgroundType = cloned.branding.backgroundType || DEFAULT_SETTINGS.backgroundType;
        cloned.branding.backgroundUrl = cloned.branding.backgroundUrl !== undefined ? cloned.branding.backgroundUrl : DEFAULT_SETTINGS.backgroundUrl;
        cloned.branding.backgroundOpacity = cloned.branding.backgroundOpacity !== undefined ? cloned.branding.backgroundOpacity : DEFAULT_SETTINGS.backgroundOpacity;
        cloned.branding.panelTransparency = cloned.branding.panelTransparency !== undefined ? cloned.branding.panelTransparency : DEFAULT_SETTINGS.panelTransparency;
        cloned.branding.panelBlur = cloned.branding.panelBlur !== undefined ? cloned.branding.panelBlur : DEFAULT_SETTINGS.panelBlur;
        cloned.branding.favoriteWallpapers = cloned.branding.favoriteWallpapers || [];
        cloned.branding.glassTint = cloned.branding.glassTint || DEFAULT_SETTINGS.glassTint;
        cloned.branding.enablePublicBackground = cloned.branding.enablePublicBackground !== undefined ? cloned.branding.enablePublicBackground : true;
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
      // Keep legacy fields in sync
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

  // Dedicated file uploader (Logo, Favicon, MOTD Image, Background Image/Video)
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

  const handleResetToDefault = () => {
    setSettings((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        branding: {
          ...prev.branding,
          ...DEFAULT_SETTINGS,
        },
      };
      triggerAutoSave(updated);
      return updated;
    });
    setIsDirty(true);
    toast.info("All Panel branding, background, and glassmorphism reset to defaults.");
  };

  const branding = settings.branding;
  const currentBgUrl = branding.backgroundUrl || DEFAULT_SETTINGS.backgroundUrl;
  const currentBgType = branding.backgroundType || "image";
  const currentTransparency = branding.panelTransparency ?? DEFAULT_SETTINGS.panelTransparency;
  const currentBlur = branding.panelBlur ?? DEFAULT_SETTINGS.panelBlur;
  const currentOpacity = branding.backgroundOpacity ?? DEFAULT_SETTINGS.backgroundOpacity;
  const previewSurfaceAlpha = Math.max(0.08, 1 - currentTransparency / 100);

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Website Settings"
        subtitle="Manage Panel Name, Logo, Favicon, MOTD, Background 4K Wallpapers, Glassmorphism, and SEO"
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
              onClick={handleResetToDefault}
              className="h-8 text-xs gap-1.5 border-white/10 text-zinc-300 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
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
        {/* TAB NAVBAR BAR = [ Branding , Background , SEO , fhichacr ] */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900/90 border border-white/10 p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-lg shadow-black/40">
            <TabsTrigger value="branding" className="text-xs font-semibold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Palette className="h-4 w-4 text-violet-300" />
              <span>Branding</span>
            </TabsTrigger>
            <TabsTrigger value="background" className="text-xs font-semibold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <ImageIcon className="h-4 w-4 text-cyan-300" />
              <span>Background</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="text-xs font-semibold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Search className="h-4 w-4 text-emerald-300" />
              <span>SEO</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="text-xs font-semibold gap-2 py-2.5 px-4 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md">
              <Layers className="h-4 w-4 text-amber-300" />
              <span>Features (fhichacr)</span>
            </TabsTrigger>
          </TabsList>

          {/* ========================================================= */}
          {/* TAB 1: BRANDING (Panel Name, Logo, Favicon, MOTD)       */}
          {/* ========================================================= */}
          <TabsContent value="branding" className="space-y-6 mt-6">
            {/* 1. PANEL NAME & LOGO */}
            <Card className="border-white/10 bg-zinc-900/40 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="h-4 w-4 text-violet-400" />
                  Panel Identity & Logo (Normal + Admin)
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure Panel Name, Logo image, and live preview applied across both public website and admin panel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Panel Name */}
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Panel Name</label>
                  <Input
                    value={branding.panelName || ""}
                    onChange={(e) => handleUpdateBranding("panelName", e.target.value)}
                    placeholder="NOVA STUDIO"
                    className="bg-zinc-950/80 border-white/10 text-sm font-semibold"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Displays in Navbar, Admin Sidebar header, and page titles.
                  </span>
                </div>

                {/* Panel Logo with Upload + URL + Live Preview */}
                <div className="p-4 rounded-2xl border border-white/10 bg-zinc-950/50 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <ImageIcon className="h-3.5 w-3.5 text-violet-400" />
                        Panel Logo
                      </label>
                      <span className="text-[11px] text-zinc-400">
                        Upload image or input direct image URL
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
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
                        className="h-8 text-xs gap-1.5"
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
                          className="h-8 text-xs text-red-400 hover:text-red-300 border-white/10"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="md:col-span-2">
                      <Input
                        value={branding.panelLogo || ""}
                        onChange={(e) => handleUpdateBranding("panelLogo", e.target.value)}
                        placeholder="https://... or /uploads/logo.png"
                        className="font-mono text-xs bg-zinc-900 border-white/10"
                      />
                    </div>

                    {/* LIVE PREVIEW CONTAINER */}
                    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-white/10 bg-zinc-900/80">
                      <div className="h-10 w-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {branding.panelLogo ? (
                          <img
                            src={branding.panelLogo}
                            alt="Logo Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-extrabold text-violet-400 text-xs">
                            {(branding.panelName || "N").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                          Live Logo Preview
                        </span>
                        <span className="text-xs font-bold text-white truncate block">
                          {branding.panelName || "NOVA STUDIO"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. PANEL FAVICON NAME & FAVICON LOGO */}
            <Card className="border-white/10 bg-zinc-900/40 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="h-4 w-4 text-cyan-400" />
                  Panel Favicon & Tab Title
                </CardTitle>
                <CardDescription className="text-xs">
                  Favicon logo, browser tab name, and live tab preview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Panel Favicon Name (Browser Tab Suffix)
                  </label>
                  <Input
                    value={branding.panelFaviconName || ""}
                    onChange={(e) => handleUpdateBranding("panelFaviconName", e.target.value)}
                    placeholder="Nova Web Panel"
                    className="bg-zinc-950/80 border-white/10 text-sm font-semibold"
                  />
                </div>

                {/* Favicon Logo with Upload + URL + Live Preview */}
                <div className="p-4 rounded-2xl border border-white/10 bg-zinc-950/50 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                        Panel Favicon Logo
                      </label>
                      <span className="text-[11px] text-zinc-400">
                        Square .ico, .png, or .svg for browser tab
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
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
                        className="h-8 text-xs gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>{isUploading === "panelFaviconLogo" ? "Uploading..." : "Upload Favicon"}</span>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="md:col-span-2">
                      <Input
                        value={branding.panelFaviconLogo || ""}
                        onChange={(e) => handleUpdateBranding("panelFaviconLogo", e.target.value)}
                        placeholder="/favicon.ico or https://.../icon.png"
                        className="font-mono text-xs bg-zinc-900 border-white/10"
                      />
                    </div>

                    {/* LIVE BROWSER TAB MOCKUP */}
                    <div className="flex items-center gap-2.5 p-2 rounded-xl border border-white/10 bg-zinc-900/90 shadow-md">
                      <div className="h-5 w-5 rounded-md bg-zinc-950 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {branding.panelFaviconLogo ? (
                          <img
                            src={branding.panelFaviconLogo}
                            alt="Favicon"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Globe className="h-3 w-3 text-cyan-400" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-[9px] text-zinc-500 block uppercase font-bold">
                          Browser Tab
                        </span>
                        <span className="text-xs font-semibold text-zinc-200 truncate block">
                          {branding.panelName || "Nova Studio"} {branding.panelFaviconName ? `— ${branding.panelFaviconName}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. PANEL MOTD (Message Of The Day) */}
            <Card className="border-white/10 bg-zinc-900/40 rounded-3xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <BellRing className="h-4 w-4 text-amber-400" />
                      Panel MOTD (Message Of The Day / Banner)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Live announcement text and banner image rendered on the website
                    </CardDescription>
                  </div>
                  <Switch
                    checked={branding.panelMotdEnabled !== false}
                    onCheckedChange={(checked) => handleUpdateBranding("panelMotdEnabled", checked)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    Panel MOTD Text
                  </label>
                  <Textarea
                    rows={2}
                    value={branding.panelMotd || ""}
                    onChange={(e) => handleUpdateBranding("panelMotd", e.target.value)}
                    placeholder="Welcome to Nova Studio — Elite Engineering & Creative System"
                    className="bg-zinc-950/80 border-white/10 text-xs sm:text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      MOTD Action Link (Optional)
                    </label>
                    <Input
                      value={branding.panelMotdLink || ""}
                      onChange={(e) => handleUpdateBranding("panelMotdLink", e.target.value)}
                      placeholder="https://... or /tutorials"
                      className="bg-zinc-950/80 border-white/10 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-300 block mb-1">
                      Panel MOTD Image
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={branding.panelMotdImage || ""}
                        onChange={(e) => handleUpdateBranding("panelMotdImage", e.target.value)}
                        placeholder="https://.../motd.png"
                        className="bg-zinc-950/80 border-white/10 text-xs font-mono flex-1"
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
                        className="h-9 px-3 text-xs"
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* LIVE MOTD BANNER MOCKUP */}
                <div className="p-3.5 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/70 via-zinc-950 to-indigo-950/70 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-violet-400 block tracking-wider">
                    Live MOTD Banner Preview
                  </span>
                  <div className="flex items-center gap-3">
                    {branding.panelMotdImage ? (
                      <img
                        src={branding.panelMotdImage}
                        alt="MOTD Preview"
                        className="h-7 w-7 rounded-lg object-cover border border-violet-400/30"
                      />
                    ) : (
                      <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      {branding.panelMotd || "No MOTD currently set"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 2: BACKGROUND (4K Wallpapers, Upload, Sliders, Palette)*/}
          {/* ========================================================= */}
          <TabsContent value="background" className="space-y-8 mt-6">
            {/* LIVE PREVIEW HERO CARD */}
            <Card className="border-white/15 bg-zinc-950/60 overflow-hidden shadow-2xl shadow-black/60 rounded-3xl">
              <CardHeader className="border-b border-white/10 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      Live Interactive Glassmorphism Stage
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Real-time interactive preview reflecting active background, transparency, blur, and color palette
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

                  {/* Sample Glass Panel Card */}
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
                        {branding.panelLogo ? (
                          <img
                            src={branding.panelLogo}
                            alt="Logo"
                            className="h-8 w-8 rounded-xl object-cover border border-white/10 shadow-md"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
                            {(branding.panelName || "N").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-white tracking-wide">
                            {branding.panelName || "NOVA GLASS PANEL"}
                          </h4>
                          <p className="text-[10px] text-zinc-300">
                            {branding.panelFaviconName || "Glassmorphism Active"}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px]">
                        {currentBgType.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 my-4">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                        <span className="text-[10px] text-zinc-400 block">Transparency Control</span>
                        <span className="text-sm font-extrabold text-cyan-300 font-mono">
                          {currentTransparency}%
                        </span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
                        <span className="text-[10px] text-zinc-400 block">Blur Control</span>
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
                        <Check className="h-3 w-3" /> Live Synced
                      </span>
                    </div>
                  </div>
                </div>

                {/* SLIDERS CONTROLS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/10">
                  {/* 3. TRANSPARENCY CONTROL SLIDER */}
                  <div className="space-y-3 p-4 rounded-2xl border border-white/10 bg-zinc-900/50">
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
                      <span>0% (Solid)</span>
                      <span>50%</span>
                      <span>100% (Translucent)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Controls the surface transparency of panels and cards across normal & admin views.
                    </p>
                  </div>

                  {/* 4. BLUR CONTROL SLIDER */}
                  <div className="space-y-3 p-4 rounded-2xl border border-white/10 bg-zinc-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-400" />
                        <label className="text-xs font-bold text-white">
                          Blur Control (Glassmorphism)
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
                      <span>0px (Crisp)</span>
                      <span>20px</span>
                      <span>40px (Ultra Frosted)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      CSS <code className="text-zinc-300">backdrop-filter: blur(Xpx)</code> for Image & Video backgrounds.
                    </p>
                  </div>
                </div>

                {/* BACKGROUND BRIGHTNESS */}
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
                    Panel Background Sources
                  </h3>
                  <p className="text-xs text-zinc-400">
                    4K Wallpapers browser, file uploads, direct URL, or theme color palette
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
                    onClick={() => setBgSourceTab("palette")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      bgSourceTab === "palette"
                        ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Color Palette
                  </button>
                </div>
              </div>

              {/* 1. INTEGRATED 4K WALLPAPER BROWSER */}
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

              {/* 2. UPLOAD IMAGE OR VIDEO */}
              {bgSourceTab === "upload" && (
                <Card className="border-white/10 bg-zinc-900/40 p-8 rounded-3xl">
                  <div className="max-w-xl mx-auto text-center space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-3xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                      <Upload className="h-8 w-8 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Upload Image or Video Background
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Supports PNG, JPG, WEBP, GIF, MP4, and WEBM video clips up to 50MB.
                      </p>
                    </div>

                    <input
                      ref={bgFileRef}
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      onChange={(e) => handleGenericUpload("backgroundUrl", e)}
                      className="hidden"
                    />

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button
                        type="button"
                        variant="studio"
                        disabled={isUploading === "backgroundUrl"}
                        onClick={() => bgFileRef.current?.click()}
                        className="text-xs gap-2 px-6 h-10 shadow-lg shadow-violet-600/30"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{isUploading === "backgroundUrl" ? "Uploading Media..." : "Select Image or Video"}</span>
                      </Button>
                    </div>

                    <p className="text-[10px] text-zinc-500">
                      Files are saved in persistent storage at <code className="text-zinc-400 font-mono">/uploads/</code>
                    </p>
                  </div>
                </Card>
              )}

              {/* 3. DIRECT URL */}
              {bgSourceTab === "url" && (
                <Card className="border-white/10 bg-zinc-900/40 p-6 rounded-3xl">
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-cyan-400" />
                        Enter Background Image or Video URL
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Paste any online wallpaper link (e.g. from 4kwallpapers.com, Unsplash, or MP4 video link)
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
                        onChange={(e) => handleUpdateBranding("backgroundType", e.target.value as any)}
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

              {/* 4. COLOR PALETTE */}
              {bgSourceTab === "palette" && (
                <Card className="border-white/10 bg-zinc-900/40 p-6 rounded-3xl">
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Palette className="h-4 w-4 text-violet-400" />
                        Color Palette & Accent Themes
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Choose theme accent colors and surface glass tints
                      </p>
                    </div>

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
                            className="font-mono text-xs uppercase"
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
                            className="font-mono text-xs uppercase"
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
                            className="font-mono text-xs uppercase"
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
          {/* TAB 3: SEO                                               */}
          {/* ========================================================= */}
          <TabsContent value="seo" className="space-y-6 mt-6">
            <Card className="border-white/10 bg-zinc-900/40 rounded-3xl">
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
                    className="mt-1 font-medium bg-zinc-950/80 border-white/10"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Meta Description</label>
                  <Textarea
                    rows={3}
                    value={settings.seo.metaDescription}
                    onChange={(e) => handleUpdateSeo("metaDescription", e.target.value)}
                    className="mt-1 bg-zinc-950/80 border-white/10"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Keywords (comma separated)</label>
                  <Input
                    value={settings.seo.keywords.join(", ")}
                    onChange={(e) =>
                      handleUpdateSeo(
                        "keywords",
                        e.target.value.split(",").map((k) => k.trim())
                      )
                    }
                    className="mt-1 bg-zinc-950/80 border-white/10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Social Share Image (OG)</label>
                    <Input
                      value={settings.seo.ogImageUrl}
                      onChange={(e) => handleUpdateSeo("ogImageUrl", e.target.value)}
                      className="mt-1 font-mono text-xs bg-zinc-950/80 border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Twitter Handle</label>
                    <Input
                      value={settings.seo.twitterHandle}
                      onChange={(e) => handleUpdateSeo("twitterHandle", e.target.value)}
                      className="mt-1 font-mono text-xs bg-zinc-950/80 border-white/10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB 4: FEATURES (fhichacr) & Socials                     */}
          {/* ========================================================= */}
          <TabsContent value="features" className="space-y-6 mt-6">
            <Card className="border-white/10 bg-zinc-900/40 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  Features & Global Settings (fhichacr)
                </CardTitle>
                <CardDescription className="text-xs">
                  Global display toggles for public site (normal) and admin panel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-zinc-950/50">
                  <div>
                    <h5 className="text-xs font-bold text-white">Enable 4K Wallpaper Background on Public Website</h5>
                    <p className="text-[11px] text-zinc-400">
                      Renders the custom wallpaper, transparency, and blur on the public normal site as well as admin.
                    </p>
                  </div>
                  <Switch
                    checked={branding.enablePublicBackground !== false}
                    onCheckedChange={(checked) => handleUpdateBranding("enablePublicBackground", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-white/10 bg-zinc-950/50">
                  <div>
                    <h5 className="text-xs font-bold text-white">Enable MOTD Announcement Banner</h5>
                    <p className="text-[11px] text-zinc-400">
                      Displays the top announcement bar with MOTD text and image on the normal public website.
                    </p>
                  </div>
                  <Switch
                    checked={branding.panelMotdEnabled !== false}
                    onCheckedChange={(checked) => handleUpdateBranding("panelMotdEnabled", checked)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Default Color Theme</label>
                    <select
                      value={branding.defaultTheme || "dark"}
                      onChange={(e) => handleUpdateBranding("defaultTheme", e.target.value as any)}
                      className="w-full mt-1 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-white"
                    >
                      <option value="dark">Dark Theme (Glassmorphism)</option>
                      <option value="light">Light Theme</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300">Corner Border Radius</label>
                    <Input
                      value={branding.borderRadius || "0.5rem"}
                      onChange={(e) => handleUpdateBranding("borderRadius", e.target.value)}
                      className="mt-1 font-mono text-xs bg-zinc-950 border-white/10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FOOTER SOCIAL LINKS */}
            <Card className="border-white/10 bg-zinc-900/40 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-emerald-400" />
                    Footer Social Links
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure social media icons in normal public footer
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
                  <span>Add Social</span>
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
    </div>
  );
}
