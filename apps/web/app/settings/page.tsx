"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Palette,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Link2,
  Sparkles,
  SlidersHorizontal,
  Check,
  Zap,
  ArrowLeft,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { WallpaperBrowser } from "@/components/admin/WallpaperBrowser";
import { toast } from "sonner";
import { UserPanelPreferences, SiteSettings, BrandingSettings } from "@nova/shared";
import { useAuthStore, useThemeStore } from "@/lib/store";

export default function UserSettingsPage() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [bgSourceTab, setBgSourceTab] = useState<"browser" | "upload" | "url" | "color" | "gradient">("browser");
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Global settings for permissions and defaults
  const { data: globalData } = useQuery<{ success: boolean; settings: SiteSettings }>({
    queryKey: ["siteSettings"],
    queryFn: async () => (await api.get("/api/settings")).data,
  });

  // User personal preferences query
  const { data: userPrefData, isLoading } = useQuery<{
    success: boolean;
    preferences: UserPanelPreferences | null;
    permissions: any;
    defaults: any;
  }>({
    queryKey: ["userPreferences"],
    queryFn: async () => {
      if (!isAuthenticated) {
        // Fallback to localStorage for guests
        const local = localStorage.getItem("nova_user_prefs");
        return {
          success: true,
          preferences: local ? JSON.parse(local) : null,
          permissions: globalData?.settings?.features || {},
          defaults: globalData?.settings?.branding || {},
        };
      }
      return (await api.get("/api/user/preferences")).data;
    },
  });

  const defaults: Partial<BrandingSettings> = globalData?.settings?.branding || {};
  const permissions = globalData?.settings?.features || {
    allowUserCustomBackground: true,
    allowUserTransparency: true,
    allowUserBlur: true,
    allowUserTheme: true,
    allowUserWallpapers: true,
  };

  const [prefs, setPrefs] = useState<UserPanelPreferences>({
    userId: user?.id || "guest",
    theme: (theme as any) || "dark",
    backgroundType: "image",
    backgroundUrl: defaults.backgroundUrl || "",
    backgroundFit: "cover",
    backgroundPosition: "center",
    backgroundOpacity: defaults.backgroundOpacity ?? 100,
    panelTransparency: defaults.panelTransparency ?? 35,
    panelBlur: defaults.panelBlur ?? 16,
    overlayColor: "#09090b",
    overlayOpacity: 0,
    gradientFrom: "#7c3aed",
    gradientTo: "#06b6d4",
    gradientAngle: 135,
    favoriteWallpapers: [],
  });

  useEffect(() => {
    if (userPrefData?.preferences) {
      setPrefs((prev) => ({
        ...prev,
        ...userPrefData.preferences,
      }));
    } else if (defaults) {
      setPrefs((prev) => ({
        ...prev,
        backgroundUrl: defaults.backgroundUrl || prev.backgroundUrl,
        panelTransparency: defaults.panelTransparency ?? prev.panelTransparency,
        panelBlur: defaults.panelBlur ?? prev.panelBlur,
        backgroundOpacity: defaults.backgroundOpacity ?? prev.backgroundOpacity,
      }));
    }
  }, [userPrefData, defaults]);

  // Mutation to save personal preferences
  const saveMutation = useMutation({
    mutationFn: async (updated: UserPanelPreferences) => {
      setSaveStatus("saving");
      // Save locally
      localStorage.setItem("nova_user_prefs", JSON.stringify(updated));
      if (isAuthenticated) {
        const res = await api.put("/api/user/preferences", updated);
        return res.data;
      }
      return { success: true };
    },
    onSuccess: () => {
      setSaveStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
      // Dispatch custom storage event for live layout synchronization
      window.dispatchEvent(new Event("nova_prefs_updated"));
    },
    onError: () => {
      setSaveStatus("unsaved");
      toast.error("Failed to save personal preferences");
    },
  });

  const handleUpdate = (field: keyof UserPanelPreferences, value: any) => {
    setPrefs((prev) => {
      const updated = { ...prev, [field]: value };
      setSaveStatus("unsaved");
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        saveMutation.mutate(updated);
      }, 700);
      return updated;
    });
  };

  const handleResetToDefaults = async () => {
    try {
      localStorage.removeItem("nova_user_prefs");
      if (isAuthenticated) {
        await api.post("/api/user/preferences/reset");
      }
      setPrefs({
        userId: user?.id || "guest",
        theme: "dark",
        backgroundType: defaults.backgroundType || "image",
        backgroundUrl: defaults.backgroundUrl || "",
        backgroundFit: "cover",
        backgroundPosition: "center",
        backgroundOpacity: defaults.backgroundOpacity ?? 100,
        panelTransparency: defaults.panelTransparency ?? 35,
        panelBlur: defaults.panelBlur ?? 16,
        overlayColor: "#09090b",
        overlayOpacity: 0,
        gradientFrom: "#7c3aed",
        gradientTo: "#06b6d4",
        gradientAngle: 135,
        favoriteWallpapers: [],
      });
      window.dispatchEvent(new Event("nova_prefs_updated"));
      toast.success("Personal appearance reset to global defaults!");
    } catch {
      toast.error("Failed to reset preferences");
    }
  };

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
          handleUpdate("backgroundUrl", res.data.url);
          handleUpdate("backgroundType", isVideo ? "video" : "image");
          toast.success("Uploaded and applied to your personal panel!");
        }
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to upload file");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const previewSurfaceAlpha = Math.max(0.08, 1 - (prefs.panelTransparency ?? 35) / 100);

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Studio</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Palette className="h-6 w-6 text-violet-400" />
            <span>Personal Appearance & Theme</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Customize your personal wallpaper, transparency, and glassmorphic blur without affecting global settings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge
            className={`text-[11px] gap-1 px-3 py-1 font-mono ${
              saveStatus === "saving"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : saveStatus === "saved"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "bg-zinc-800 text-zinc-300 border-white/10"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                saveStatus === "saving"
                  ? "bg-amber-400 animate-ping"
                  : saveStatus === "saved"
                  ? "bg-emerald-400"
                  : "bg-zinc-400"
              }`}
            />
            <span>{saveStatus === "saving" ? "Auto-Saving..." : saveStatus === "saved" ? "Changes Saved" : "Unsaved"}</span>
          </Badge>

          <Button
            size="sm"
            variant="outline"
            onClick={handleResetToDefaults}
            className="h-8 text-xs gap-1.5 border-white/10 text-zinc-300 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </Button>
        </div>
      </div>

      {/* LIVE INTERACTIVE PREVIEW STAGE WITH DESKTOP/MOBILE SWITCH */}
      <Card className="border-white/15 bg-zinc-950/60 overflow-hidden shadow-2xl rounded-3xl">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Live Real-Time Appearance Preview
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Visualizing your personal wallpaper, blur, and surface opacity
              </CardDescription>
            </div>

            {/* Desktop / Mobile Switch */}
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
        </CardHeader>

        <CardContent className="p-6 flex items-center justify-center">
          <div
            className={`relative rounded-2xl overflow-hidden border border-white/15 flex items-center justify-center p-6 shadow-inner transition-all duration-300 ${
              previewMode === "desktop" ? "w-full h-72 sm:h-80" : "w-72 h-96"
            }`}
          >
            {/* Background Layer */}
            {prefs.backgroundType === "image" && prefs.backgroundUrl && (
              <div
                className="absolute inset-0 transition-all duration-500"
                style={{
                  backgroundImage: `url(${prefs.backgroundUrl})`,
                  backgroundSize: prefs.backgroundFit || "cover",
                  backgroundPosition: prefs.backgroundPosition || "center",
                  opacity: (prefs.backgroundOpacity ?? 100) / 100,
                }}
              />
            )}

            {prefs.backgroundType === "video" && prefs.backgroundUrl && (
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                style={{ opacity: (prefs.backgroundOpacity ?? 100) / 100 }}
                src={prefs.backgroundUrl}
              />
            )}

            {prefs.backgroundType === "color" && (
              <div
                className="absolute inset-0 transition-colors duration-500"
                style={{
                  backgroundColor: prefs.backgroundUrl || "#09090b",
                  opacity: (prefs.backgroundOpacity ?? 100) / 100,
                }}
              />
            )}

            {prefs.backgroundType === "gradient" && (
              <div
                className="absolute inset-0 transition-all duration-500"
                style={{
                  background: `linear-gradient(${prefs.gradientAngle || 135}deg, ${prefs.gradientFrom || "#7c3aed"}, ${prefs.gradientTo || "#06b6d4"})`,
                  opacity: (prefs.backgroundOpacity ?? 100) / 100,
                }}
              />
            )}

            {/* Optional Overlay Tint */}
            {(prefs.overlayOpacity ?? 0) > 0 && (
              <div
                className="absolute inset-0 pointer-events-none transition-all"
                style={{
                  backgroundColor: prefs.overlayColor || "#09090b",
                  opacity: (prefs.overlayOpacity ?? 0) / 100,
                }}
              />
            )}

            {/* Sample Glass Card */}
            <div
              className="relative z-10 w-full max-w-sm sm:max-w-md rounded-2xl border border-white/20 p-4 sm:p-5 shadow-2xl transition-all duration-200"
              style={{
                backgroundColor: `rgba(18, 17, 26, ${previewSurfaceAlpha})`,
                backdropFilter: `blur(${prefs.panelBlur ?? 16}px)`,
                WebkitBackdropFilter: `blur(${prefs.panelBlur ?? 16}px)`,
              }}
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white text-xs">
                    AG
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide">
                      {defaults.panelName || "NOVA STUDIO"}
                    </h4>
                    <p className="text-[9px] text-zinc-300">Personal Appearance</p>
                  </div>
                </div>
                <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[9px]">
                  {prefs.backgroundType?.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2.5 my-3">
                <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                  <span className="text-[9px] text-zinc-400 block">Transparency</span>
                  <span className="text-xs font-extrabold text-cyan-300 font-mono">
                    {prefs.panelTransparency}%
                  </span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-2">
                  <span className="text-[9px] text-zinc-400 block">Backdrop Blur</span>
                  <span className="text-xs font-extrabold text-violet-300 font-mono">
                    {prefs.panelBlur}px
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-300 pt-1.5 border-t border-white/10">
                <span className="truncate max-w-[180px]">{prefs.backgroundUrl || "Default"}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="h-3 w-3" /> Live
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SLIDERS CONTROLS: TRANSPARENCY, BLUR, AND THEME */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Transparency Slider */}
        <div className="p-5 rounded-3xl border border-white/10 bg-zinc-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
              <label className="text-xs font-bold text-white">Panel Transparency</label>
            </div>
            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
              {prefs.panelTransparency}%
            </span>
          </div>

          <Slider
            value={prefs.panelTransparency ?? 35}
            min={0}
            max={100}
            step={1}
            disabled={!permissions.allowUserTransparency}
            onChange={(val) => handleUpdate("panelTransparency", val)}
          />

          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>0% (Solid)</span>
            <span>50%</span>
            <span>100% (Translucent)</span>
          </div>
        </div>

        {/* Blur Slider */}
        <div className="p-5 rounded-3xl border border-white/10 bg-zinc-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <label className="text-xs font-bold text-white">Backdrop Blur (Glassmorphism)</label>
            </div>
            <span className="font-mono text-xs font-bold text-violet-400 bg-violet-950/60 border border-violet-500/30 px-2 py-0.5 rounded-lg">
              {prefs.panelBlur}px
            </span>
          </div>

          <Slider
            value={prefs.panelBlur ?? 16}
            min={0}
            max={40}
            step={1}
            disabled={!permissions.allowUserBlur}
            onChange={(val) => handleUpdate("panelBlur", val)}
          />

          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>0px (Sharp)</span>
            <span>20px</span>
            <span>40px (Deep Frost)</span>
          </div>
        </div>
      </div>

      {/* BACKGROUND FIT, POSITION & OVERLAY CONTROLS */}
      <div className="p-5 rounded-3xl border border-white/10 bg-zinc-900/50 space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Background Fit & Positioning</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Image Fit</label>
            <select
              value={prefs.backgroundFit || "cover"}
              onChange={(e) => handleUpdate("backgroundFit", e.target.value as any)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-1.5 text-xs text-white"
            >
              <option value="cover">Cover (Fill Screen)</option>
              <option value="contain">Contain (Fit In View)</option>
              <option value="fill">Fill (Stretch)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Position</label>
            <select
              value={prefs.backgroundPosition || "center"}
              onChange={(e) => handleUpdate("backgroundPosition", e.target.value as any)}
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
              <label className="text-xs text-zinc-400">Dark Overlay Opacity</label>
              <span className="text-xs font-mono text-zinc-300">{prefs.overlayOpacity ?? 0}%</span>
            </div>
            <Slider
              value={prefs.overlayOpacity ?? 0}
              min={0}
              max={90}
              step={1}
              onChange={(val) => handleUpdate("overlayOpacity", val)}
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
              Choose Personal Background
            </h3>
            <p className="text-xs text-zinc-400">
              Browse authentic 4K wallpapers, upload personal photos/videos, or apply gradient colors
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
              Upload
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

        {/* 1. 4K WALLPAPERS BROWSER */}
        {bgSourceTab === "browser" && (
          <Card className="border-white/10 bg-zinc-900/40 p-6 rounded-3xl">
            <WallpaperBrowser
              currentUrl={prefs.backgroundUrl}
              favoriteWallpapers={prefs.favoriteWallpapers || []}
              onSelectWallpaper={(url, type) => {
                handleUpdate("backgroundUrl", url);
                handleUpdate("backgroundType", type);
              }}
              onToggleFavorite={(url) => {
                const currentFavs = prefs.favoriteWallpapers || [];
                const exists = currentFavs.includes(url);
                const updated = exists ? currentFavs.filter((u) => u !== url) : [...currentFavs, url];
                handleUpdate("favoriteWallpapers", updated);
                toast.success(exists ? "Removed from favorites" : "Added to favorites!");
              }}
            />
          </Card>
        )}

        {/* 2. UPLOAD IMAGE / VIDEO */}
        {bgSourceTab === "upload" && (
          <Card className="border-white/10 bg-zinc-900/40 p-8 rounded-3xl text-center">
            <div className="max-w-md mx-auto space-y-4">
              <Upload className="h-10 w-10 text-violet-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Upload Your Background Image or Video</h4>
              <p className="text-xs text-zinc-400">
                Supports PNG, JPG, WEBP, GIF, MP4, and WEBM video clips up to 50MB.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={handleFileUpload}
                className="hidden"
              />

              <Button
                type="button"
                variant="studio"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="text-xs gap-2 px-6 h-10 shadow-lg shadow-violet-600/30"
              >
                <Upload className="h-4 w-4" />
                <span>{isUploading ? "Uploading Media..." : "Select File"}</span>
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
                  placeholder="https://..."
                  className="bg-zinc-950 border-white/10 text-xs font-mono"
                />
                <Button
                  type="button"
                  variant="studio"
                  onClick={() => {
                    if (!customUrlInput.trim()) return;
                    const isVid = /\.(mp4|webm|mov)(\?.*)?$/i.test(customUrlInput);
                    handleUpdate("backgroundUrl", customUrlInput.trim());
                    handleUpdate("backgroundType", isVid ? "video" : "image");
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

        {/* 4. GRADIENT */}
        {bgSourceTab === "gradient" && (
          <Card className="border-white/10 bg-zinc-900/40 p-6 rounded-3xl">
            <div className="max-w-xl mx-auto space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Palette className="h-4 w-4 text-violet-400" />
                Configure Two-Tone Smooth Gradient
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Color 1</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={prefs.gradientFrom || "#7c3aed"}
                      onChange={(e) => {
                        handleUpdate("gradientFrom", e.target.value);
                        handleUpdate("backgroundType", "gradient");
                      }}
                      className="h-8 w-10 rounded border border-white/10 bg-zinc-900 cursor-pointer p-0.5"
                    />
                    <Input
                      value={prefs.gradientFrom || "#7c3aed"}
                      onChange={(e) => {
                        handleUpdate("gradientFrom", e.target.value);
                        handleUpdate("backgroundType", "gradient");
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
                      value={prefs.gradientTo || "#06b6d4"}
                      onChange={(e) => {
                        handleUpdate("gradientTo", e.target.value);
                        handleUpdate("backgroundType", "gradient");
                      }}
                      className="h-8 w-10 rounded border border-white/10 bg-zinc-900 cursor-pointer p-0.5"
                    />
                    <Input
                      value={prefs.gradientTo || "#06b6d4"}
                      onChange={(e) => {
                        handleUpdate("gradientTo", e.target.value);
                        handleUpdate("backgroundType", "gradient");
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
    </div>
  );
}
