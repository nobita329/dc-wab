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
  Globe,
  Layout,
  ExternalLink,
  Lock,
  FileImage,
  X,
  Database,
  Server,
  HardDrive,
  Terminal,
  FileCode,
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
  const [activeTab, setActiveTab] = useState("panel-assets");
  const [bgSourceTab, setBgSourceTab] = useState<"browser" | "upload" | "url" | "color">("browser");
  const [isDirty, setIsDirty] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Panel Logo & Favicon upload refs and states
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const faviconFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);

  // .env Manager states, query, and live updater
  const [rawEnvState, setRawEnvState] = useState("");
  const [envEditMode, setEnvEditMode] = useState<"fields" | "raw">("fields");

  const { data: envData, refetch: refetchEnv, isLoading: isEnvLoading } = useQuery<{
    success: boolean;
    rawEnv: string;
    parsed: Record<string, string>;
    scan: any;
  }>({
    queryKey: ["adminEnv"],
    queryFn: async () => (await api.get("/api/admin/env")).data,
  });

  useEffect(() => {
    if (envData?.rawEnv) {
      setRawEnvState(envData.rawEnv);
    }
  }, [envData]);

  const saveEnvMutation = useMutation({
    mutationFn: async (rawEnv: string) => {
      const res = await api.post("/api/admin/env", { rawEnv });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || ".env updated successfully!");
      refetchEnv();
      queryClient.invalidateQueries({ queryKey: ["adminEnv"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update .env");
    },
  });

  const handleUpdateEnvVar = (key: string, value: string) => {
    setRawEnvState((prev) => {
      const lines = prev.split("\n");
      let found = false;
      const updatedLines = lines.map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith(`${key}=`)) {
          found = true;
          return `${key}=${value}`;
        }
        return line;
      });
      if (!found) {
        updatedLines.push(`${key}=${value}`);
      }
      return updatedLines.join("\n");
    });
  };

  const getEnvValue = (key: string): string => {
    const lines = rawEnvState.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith(`${key}=`)) {
        return trimmed.slice(key.length + 1).replace(/^["']|["']$/g, "");
      }
    }
    return envData?.parsed?.[key] || "";
  };

  const { data, isLoading, refetch } = useQuery<{ success: boolean; settings: SiteSettings }>({
    queryKey: ["siteSettings"],
    queryFn: async () => (await api.get("/api/admin/settings")).data,
  });

  useEffect(() => {
    if (data?.settings) {
      const cloned = JSON.parse(JSON.stringify(data.settings));
      // Ensure defaults for panel branding & background customization
      if (cloned.branding) {
        cloned.branding.panelName = cloned.branding.panelName || "NOVA STUDIO";
        cloned.branding.panelLogoUrl = cloned.branding.panelLogoUrl || "";
        cloned.branding.panelFaviconName = cloned.branding.panelFaviconName || "Nova Panel";
        cloned.branding.panelFaviconUrl = cloned.branding.panelFaviconUrl || "";

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

  // Handle Logo & Favicon Uploads
  const handleAssetUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    assetType: "logo" | "favicon"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size exceeds 20MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        if (assetType === "logo") setIsUploadingLogo(true);
        if (assetType === "favicon") setIsUploadingFavicon(true);

        const res = await api.post("/api/admin/upload-asset", {
          fileData: reader.result as string,
          fileName: file.name,
          mimeType: file.type,
          assetType,
        });

        if (res.data?.success) {
          if (assetType === "logo") {
            handleUpdateBranding("panelLogoUrl", res.data.url);
            toast.success("Panel logo uploaded and applied!");
          } else {
            handleUpdateBranding("panelFaviconUrl", res.data.url);
            toast.success("Panel favicon uploaded and applied!");
          }
        }
      } catch (err: any) {
        toast.error(err.response?.data?.error || `Failed to upload ${assetType}`);
      } finally {
        if (assetType === "logo") {
          setIsUploadingLogo(false);
          if (logoFileInputRef.current) logoFileInputRef.current.value = "";
        }
        if (assetType === "favicon") {
          setIsUploadingFavicon(false);
          if (faviconFileInputRef.current) faviconFileInputRef.current.value = "";
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
            <TabsTrigger value="panel-assets" className="text-xs gap-2 py-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span>Panel Identity & Favicons</span>
            </TabsTrigger>
            <TabsTrigger value="env-scan" className="text-xs gap-2 py-2">
              <Sliders className="h-3.5 w-3.5 text-emerald-400" />
              <span>.env Scan & Update</span>
            </TabsTrigger>
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
          {/* TAB 0: PANEL ASSETS (NAME, LOGO, FAVICON WITH LIVE PREVIEW) */}
          {/* ========================================================= */}
          <TabsContent value="panel-assets" className="space-y-8 mt-6">
            {/* Hidden file inputs for upload */}
            <input
              type="file"
              ref={logoFileInputRef}
              onChange={(e) => handleAssetUpload(e, "logo")}
              accept="image/*,.svg,.ico,.webp"
              className="hidden"
            />
            <input
              type="file"
              ref={faviconFileInputRef}
              onChange={(e) => handleAssetUpload(e, "favicon")}
              accept="image/*,.ico,.svg,.png,.webp"
              className="hidden"
            />

            {/* SECTION 1: PANEL NAME & PANEL LOGO */}
            <Card className="border-white/15 bg-zinc-900/50 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Layout className="h-4 w-4 text-violet-400" />
                      Panel Name & Visual Logo
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Configure the administrative panel display title and custom brand logo with live real-time preview
                    </CardDescription>
                  </div>
                  <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-[10px]">
                    Sidebar & Header Asset
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Form Controls */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Panel Name */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Panel Name / Title
                      </label>
                      <Input
                        value={branding.panelName || ""}
                        onChange={(e) => handleUpdateBranding("panelName", e.target.value)}
                        placeholder="e.g. NOVA STUDIO"
                        className="bg-zinc-950/70 border-white/10 text-sm font-semibold text-white placeholder:text-zinc-600"
                      />
                      <p className="mt-1.5 text-[11px] text-zinc-500">
                        Rendered in the upper-left brand card of the admin sidebar and top navigation bars.
                      </p>
                    </div>

                    {/* Panel Logo: Upload + URL */}
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-zinc-300">
                          Panel Logo Asset
                        </label>
                        {branding.panelLogoUrl && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBranding("panelLogoUrl", "")}
                            className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Remove Logo</span>
                          </button>
                        )}
                      </div>

                      {/* Upload Button & Dropzone */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isUploadingLogo}
                          onClick={() => logoFileInputRef.current?.click()}
                          className="w-full sm:w-auto h-10 px-4 text-xs font-semibold gap-2 border-dashed border-violet-500/40 hover:border-violet-400 bg-violet-600/5 hover:bg-violet-600/10 text-violet-300"
                        >
                          <Upload className="h-4 w-4 text-violet-400" />
                          <span>{isUploadingLogo ? "Uploading Logo..." : "Upload Logo Image"}</span>
                        </Button>
                        <span className="text-xs text-zinc-500 hidden sm:inline">or enter URL</span>
                      </div>

                      {/* URL Input */}
                      <div className="relative">
                        <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                          type="text"
                          value={branding.panelLogoUrl || ""}
                          onChange={(e) => handleUpdateBranding("panelLogoUrl", e.target.value)}
                          placeholder="https://example.com/logo.png or /uploads/logo.png"
                          className="pl-9 bg-zinc-950/70 border-white/10 text-xs font-mono text-zinc-200 placeholder:text-zinc-600"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Supported: PNG, SVG, WEBP, JPG, GIF</span>
                        <span>Max recommended: 512 × 512 px</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Interactive Live Preview */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Live Sidebar Preview</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Real-Time
                      </span>
                    </div>

                    {/* Simulated Sidebar Header */}
                    <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 shadow-2xl space-y-3">
                      <div className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                        Sidebar Brand Header View
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/60 border border-white/5">
                        {branding.panelLogoUrl ? (
                          <img
                            src={branding.panelLogoUrl}
                            alt="Logo preview"
                            className="h-10 w-10 rounded-xl object-contain bg-zinc-950 border border-white/10 p-1 shadow-md shrink-0"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = "none";
                              if (target.nextElementSibling) {
                                (target.nextElementSibling as HTMLElement).style.display = "flex";
                              }
                            }}
                          />
                        ) : null}
                        <div
                          style={{ display: branding.panelLogoUrl ? "none" : "flex" }}
                          className="h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-extrabold text-base shadow-lg shadow-violet-500/20 shrink-0"
                        >
                          {(branding.panelName || "N").slice(0, 1)}
                        </div>
                        <div className="truncate">
                          <span className="text-sm font-bold text-white tracking-wide truncate block">
                            {branding.panelName || "NOVA STUDIO"}
                          </span>
                          <span className="block text-[10px] uppercase font-semibold text-violet-400 tracking-wider">
                            Admin Area
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dual Canvas: Dark vs Light background test */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-medium text-zinc-400">
                        Transparency Contrast Canvas
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
                        <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 flex flex-col items-center justify-center min-h-[90px]">
                          {branding.panelLogoUrl ? (
                            <img
                              src={branding.panelLogoUrl}
                              alt="Dark canvas"
                              className="h-10 w-10 object-contain"
                            />
                          ) : (
                            <span className="text-zinc-600">Default Avatar</span>
                          )}
                          <span className="text-zinc-500 mt-2">Dark Mode</span>
                        </div>

                        <div className="p-4 rounded-xl bg-zinc-100 border border-zinc-300 flex flex-col items-center justify-center min-h-[90px]">
                          {branding.panelLogoUrl ? (
                            <img
                              src={branding.panelLogoUrl}
                              alt="Light canvas"
                              className="h-10 w-10 object-contain"
                            />
                          ) : (
                            <span className="text-zinc-400">Default Avatar</span>
                          )}
                          <span className="text-zinc-600 mt-2">Light Mode</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 2: PANEL FAVICONS NAME & FAVICON LOGO */}
            <Card className="border-white/15 bg-zinc-900/50 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Globe className="h-4 w-4 text-cyan-400" />
                      Panel Favicons Name & Logo
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Configure browser tab title and favicon logo displayed in bookmarks, browser tabs, and desktop taskbars
                    </CardDescription>
                  </div>
                  <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[10px]">
                    Browser Tab Asset
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Form Controls */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Favicon Name (Browser Tab Title) */}
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Panel Favicons Name (Browser Tab Title)
                      </label>
                      <Input
                        value={branding.panelFaviconName || ""}
                        onChange={(e) => handleUpdateBranding("panelFaviconName", e.target.value)}
                        placeholder="e.g. Nova Panel • Studio Admin"
                        className="bg-zinc-950/70 border-white/10 text-sm font-semibold text-white placeholder:text-zinc-600"
                      />
                      <p className="mt-1.5 text-[11px] text-zinc-500">
                        Appears as the document title on the browser window or tab.
                      </p>
                    </div>

                    {/* Favicon Logo: Upload + URL */}
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-zinc-300">
                          Panel Favicon Logo (.ico / .png / .svg)
                        </label>
                        {branding.panelFaviconUrl && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBranding("panelFaviconUrl", "")}
                            className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Remove Favicon</span>
                          </button>
                        )}
                      </div>

                      {/* Upload Button */}
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isUploadingFavicon}
                          onClick={() => faviconFileInputRef.current?.click()}
                          className="w-full sm:w-auto h-10 px-4 text-xs font-semibold gap-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-600/5 hover:bg-cyan-600/10 text-cyan-300"
                        >
                          <Upload className="h-4 w-4 text-cyan-400" />
                          <span>{isUploadingFavicon ? "Uploading Favicon..." : "Upload Favicon File"}</span>
                        </Button>
                        <span className="text-xs text-zinc-500 hidden sm:inline">or enter URL</span>
                      </div>

                      {/* URL Input */}
                      <div className="relative">
                        <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                          type="text"
                          value={branding.panelFaviconUrl || ""}
                          onChange={(e) => handleUpdateBranding("panelFaviconUrl", e.target.value)}
                          placeholder="https://example.com/favicon.ico or /favicon.ico"
                          className="pl-9 bg-zinc-950/70 border-white/10 text-xs font-mono text-zinc-200 placeholder:text-zinc-600"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Supported: .ico, .png, .svg, .webp</span>
                        <span>Multi-size: 16×16, 32×32, 64×64 px</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Realistic Browser Chrome Live Preview */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Live Browser Tab Preview</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        Simulated Tab
                      </span>
                    </div>

                    {/* Simulated Realistic Browser Window */}
                    <div className="rounded-xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden">
                      {/* Window Chrome Titlebar */}
                      <div className="bg-zinc-900/90 px-3 py-2 border-b border-white/5 flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                        </div>

                        {/* Active Tab */}
                        <div className="ml-2 flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-t-lg border-t border-x border-white/10 text-xs max-w-[200px] truncate shadow-sm">
                          {branding.panelFaviconUrl ? (
                            <img
                              src={branding.panelFaviconUrl}
                              alt="Favicon"
                              className="h-3.5 w-3.5 object-contain shrink-0 rounded-sm"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = "none";
                                if (target.nextElementSibling) {
                                  (target.nextElementSibling as HTMLElement).style.display = "block";
                                }
                              }}
                            />
                          ) : null}
                          <Globe
                            style={{ display: branding.panelFaviconUrl ? "none" : "block" }}
                            className="h-3.5 w-3.5 text-violet-400 shrink-0"
                          />
                          <span className="truncate font-medium text-white text-[11px]">
                            {branding.panelFaviconName || "Nova Panel"}
                          </span>
                          <X className="h-3 w-3 text-zinc-500 hover:text-white shrink-0 ml-auto cursor-pointer" />
                        </div>

                        {/* Inactive Tab */}
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-zinc-500 text-[10px]">
                          <span>Nova Studio Home</span>
                        </div>
                      </div>

                      {/* Address bar mockup */}
                      <div className="p-2.5 bg-zinc-950 border-b border-white/5 flex items-center gap-2">
                        <div className="flex-1 bg-zinc-900/80 rounded-md px-2.5 py-1 flex items-center gap-2 text-[11px] font-mono text-zinc-400 border border-white/5">
                          <Lock className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span className="text-zinc-200">http://localhost:3001</span>
                          <span className="text-zinc-500">/admin/settings</span>
                        </div>
                      </div>

                      {/* Multi-Resolution Scale Test */}
                      <div className="p-3 bg-zinc-950/60">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono block mb-2">
                          Multi-Resolution Render Matrix
                        </span>
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                          <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 flex flex-col items-center justify-center">
                            {branding.panelFaviconUrl ? (
                              <img
                                src={branding.panelFaviconUrl}
                                alt="16px"
                                className="h-4 w-4 object-contain"
                              />
                            ) : (
                              <Globe className="h-4 w-4 text-zinc-500" />
                            )}
                            <span className="text-zinc-400 mt-1">16px</span>
                          </div>

                          <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 flex flex-col items-center justify-center">
                            {branding.panelFaviconUrl ? (
                              <img
                                src={branding.panelFaviconUrl}
                                alt="32px"
                                className="h-8 w-8 object-contain"
                              />
                            ) : (
                              <Globe className="h-8 w-8 text-zinc-500" />
                            )}
                            <span className="text-zinc-400 mt-1">32px</span>
                          </div>

                          <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 flex flex-col items-center justify-center">
                            {branding.panelFaviconUrl ? (
                              <img
                                src={branding.panelFaviconUrl}
                                alt="48px"
                                className="h-10 w-10 object-contain"
                              />
                            ) : (
                              <Globe className="h-10 w-10 text-zinc-500" />
                            )}
                            <span className="text-zinc-400 mt-1">48px</span>
                          </div>

                          <div className="p-2 rounded-lg bg-zinc-900 border border-white/5 flex flex-col items-center justify-center">
                            {branding.panelFaviconUrl ? (
                              <img
                                src={branding.panelFaviconUrl}
                                alt="64px"
                                className="h-12 w-12 object-contain"
                              />
                            ) : (
                              <Globe className="h-12 w-12 text-zinc-500" />
                            )}
                            <span className="text-zinc-400 mt-1">64px</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========================================================= */}
          {/* TAB: .ENV SCAN & LIVE WEB UPDATE */}
          {/* ========================================================= */}
          <TabsContent value="env-scan" className="space-y-6 mt-6">
            {/* Health & Scan KPI Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Scanned Variables
                  </CardTitle>
                  <FileCode className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {envData?.scan?.totalKeys ?? "..."}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 font-mono">
                    .env ({envData?.scan?.configuredKeys ?? 0} active)
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Database Engine
                  </CardTitle>
                  <Database className="h-4 w-4 text-cyan-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-400 uppercase font-mono">
                    {getEnvValue("DB_CONNECTION") || "mariadb"}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">MariaDB / MySQL (No MongoDB)</p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    MariaDB Port & Host
                  </CardTitle>
                  <Server className="h-4 w-4 text-violet-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white font-mono">
                    {getEnvValue("DB_PORT") || "3306"}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 font-mono">
                    {getEnvValue("DB_HOST") || "127.0.0.1"} ({getEnvValue("DB_DATABASE") || "novastudio"})
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Live Web Sync
                  </CardTitle>
                  <Sparkles className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                    <span>Active</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">Auto-backup before update</p>
                </CardContent>
              </Card>
            </div>

            {/* Main .env Editor Card */}
            <Card className="border-white/15 bg-zinc-900/50 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-emerald-400" />
                      Live .env Scanner & Configuration Manager
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Scan, edit, and update the server's environment configuration directly from the browser without terminal access
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mode Toggle */}
                    <div className="flex rounded-lg bg-zinc-950 p-1 border border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => setEnvEditMode("fields")}
                        className={`px-3 py-1 rounded-md font-medium transition-colors ${
                          envEditMode === "fields"
                            ? "bg-violet-600 text-white shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Form Fields
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnvEditMode("raw")}
                        className={`px-3 py-1 rounded-md font-medium transition-colors ${
                          envEditMode === "raw"
                            ? "bg-violet-600 text-white shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Raw .env Code
                      </button>
                    </div>

                    {/* Reload Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isEnvLoading}
                      onClick={() => {
                        refetchEnv();
                        toast.info(".env scanned and refreshed from disk");
                      }}
                      className="h-8 text-xs gap-1 border-white/10 text-zinc-300 hover:text-white"
                      title="Rescan file from disk"
                    >
                      <RefreshCw className={`h-3 w-3 ${isEnvLoading ? "animate-spin" : ""}`} />
                      <span>Rescan</span>
                    </Button>

                    {/* Save Button */}
                    <Button
                      size="sm"
                      variant="studio"
                      disabled={saveEnvMutation.isPending}
                      onClick={() => saveEnvMutation.mutate(rawEnvState)}
                      className="h-8 text-xs gap-1.5 shadow-md shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{saveEnvMutation.isPending ? "Saving .env..." : "Save .env Live"}</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {envEditMode === "fields" ? (
                  <div className="space-y-8">
                    {/* SECTION 1: MARIADB / MYSQL DATABASE CONFIGURATION */}
                    <div className="p-5 rounded-2xl bg-zinc-950/70 border border-cyan-500/20 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-cyan-400" />
                          <h4 className="text-sm font-bold text-white">
                            MariaDB / MySQL Database Configuration
                          </h4>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px] font-mono">
                          DB_CONNECTION=mariadb
                        </Badge>
                      </div>

                      <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200/90 leading-relaxed">
                        ✨ <strong>Notice:</strong> MongoDB (<code className="font-mono text-cyan-300">MONGODB_URI</code>) has been removed. MariaDB is the designated high-performance relational database engine.
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Database Connection
                          </label>
                          <Input
                            value={getEnvValue("DB_CONNECTION") || "mariadb"}
                            onChange={(e) => handleUpdateEnvVar("DB_CONNECTION", e.target.value)}
                            placeholder="mariadb"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Host Address
                          </label>
                          <Input
                            value={getEnvValue("DB_HOST") || "127.0.0.1"}
                            onChange={(e) => handleUpdateEnvVar("DB_HOST", e.target.value)}
                            placeholder="127.0.0.1"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Port
                          </label>
                          <Input
                            value={getEnvValue("DB_PORT") || "3306"}
                            onChange={(e) => handleUpdateEnvVar("DB_PORT", e.target.value)}
                            placeholder="3306"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Database Name
                          </label>
                          <Input
                            value={getEnvValue("DB_DATABASE") || "novastudio"}
                            onChange={(e) => handleUpdateEnvVar("DB_DATABASE", e.target.value)}
                            placeholder="novastudio"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Database Username
                          </label>
                          <Input
                            value={getEnvValue("DB_USERNAME") || "root"}
                            onChange={(e) => handleUpdateEnvVar("DB_USERNAME", e.target.value)}
                            placeholder="root"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Database Password
                          </label>
                          <Input
                            type="password"
                            value={getEnvValue("DB_PASSWORD")}
                            onChange={(e) => handleUpdateEnvVar("DB_PASSWORD", e.target.value)}
                            placeholder="••••••••••••"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: DISCORD & YOUTUBE INTEGRATIONS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Discord Setup */}
                      <div className="p-5 rounded-2xl bg-zinc-950/70 border border-indigo-500/20 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                          <Share2 className="h-4 w-4 text-indigo-400" />
                          <h4 className="text-sm font-bold text-white">Discord Community Setup</h4>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Discord Guild ID
                          </label>
                          <Input
                            value={getEnvValue("DISCORD_GUILD_ID")}
                            onChange={(e) => handleUpdateEnvVar("DISCORD_GUILD_ID", e.target.value)}
                            placeholder="e.g. 1540761150797389915"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Discord Channel ID
                          </label>
                          <Input
                            value={getEnvValue("DISCORD_CHANNEL_ID")}
                            onChange={(e) => handleUpdateEnvVar("DISCORD_CHANNEL_ID", e.target.value)}
                            placeholder="e.g. 104052349028392100"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Bot Token (Optional)
                          </label>
                          <Input
                            type="password"
                            value={getEnvValue("DISCORD_BOT_TOKEN")}
                            onChange={(e) => handleUpdateEnvVar("DISCORD_BOT_TOKEN", e.target.value)}
                            placeholder="••••••••••••"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* YouTube Setup */}
                      <div className="p-5 rounded-2xl bg-zinc-950/70 border border-red-500/20 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                          <Video className="h-4 w-4 text-red-400" />
                          <h4 className="text-sm font-bold text-white">YouTube Data API v3 Setup</h4>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            YouTube Channel ID
                          </label>
                          <Input
                            value={getEnvValue("YOUTUBE_CHANNEL_ID")}
                            onChange={(e) => handleUpdateEnvVar("YOUTUBE_CHANNEL_ID", e.target.value)}
                            placeholder="e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            YouTube Data API Key
                          </label>
                          <Input
                            type="password"
                            value={getEnvValue("YOUTUBE_API_KEY")}
                            onChange={(e) => handleUpdateEnvVar("YOUTUBE_API_KEY", e.target.value)}
                            placeholder="AIzaSy••••••••••••"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: GITHUB & SUPABASE SETUP */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* GitHub Setup */}
                      <div className="p-5 rounded-2xl bg-zinc-950/70 border border-white/10 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                          <ExternalLink className="h-4 w-4 text-zinc-300" />
                          <h4 className="text-sm font-bold text-white">GitHub Deployment Sync</h4>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            GitHub Username
                          </label>
                          <Input
                            value={getEnvValue("GITHUB_USERNAME")}
                            onChange={(e) => handleUpdateEnvVar("GITHUB_USERNAME", e.target.value)}
                            placeholder="e.g. nobita329"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Personal Access Token (PAT)
                          </label>
                          <Input
                            type="password"
                            value={getEnvValue("GITHUB_PERSONAL_ACCESS_TOKEN")}
                            onChange={(e) =>
                              handleUpdateEnvVar("GITHUB_PERSONAL_ACCESS_TOKEN", e.target.value)
                            }
                            placeholder="ghp_••••••••••••"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Supabase Setup */}
                      <div className="p-5 rounded-2xl bg-zinc-950/70 border border-emerald-500/20 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                          <Database className="h-4 w-4 text-emerald-400" />
                          <h4 className="text-sm font-bold text-white">Supabase Cloud Setup</h4>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Supabase Project URL
                          </label>
                          <Input
                            value={getEnvValue("SUPABASE_URL")}
                            onChange={(e) => handleUpdateEnvVar("SUPABASE_URL", e.target.value)}
                            placeholder="https://xyz.supabase.co"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Supabase Anon Public Key
                          </label>
                          <Input
                            type="password"
                            value={getEnvValue("SUPABASE_ANON_KEY")}
                            onChange={(e) => handleUpdateEnvVar("SUPABASE_ANON_KEY", e.target.value)}
                            placeholder="eyJhbGciOi••••••••••••"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: MAIL (SMTP) SETUP */}
                    <div className="p-5 rounded-2xl bg-zinc-950/70 border border-white/10 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                        <Share2 className="h-4 w-4 text-amber-400" />
                        <h4 className="text-sm font-bold text-white">SMTP Email Gateway</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Mail Host
                          </label>
                          <Input
                            value={getEnvValue("MAIL_HOST")}
                            onChange={(e) => handleUpdateEnvVar("MAIL_HOST", e.target.value)}
                            placeholder="smtp.example.com"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Port
                          </label>
                          <Input
                            value={getEnvValue("MAIL_PORT") || "25"}
                            onChange={(e) => handleUpdateEnvVar("MAIL_PORT", e.target.value)}
                            placeholder="25 or 587"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Username
                          </label>
                          <Input
                            value={getEnvValue("MAIL_USERNAME")}
                            onChange={(e) => handleUpdateEnvVar("MAIL_USERNAME", e.target.value)}
                            placeholder="apikey or user"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-300 mb-1">
                            Password
                          </label>
                          <Input
                            type="password"
                            value={getEnvValue("MAIL_PASSWORD")}
                            onChange={(e) => handleUpdateEnvVar("MAIL_PASSWORD", e.target.value)}
                            placeholder="••••••••••••"
                            className="bg-zinc-900 border-white/10 font-mono text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Raw Code Editor Mode */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Editing exact contents of <code className="font-mono text-cyan-400">/workspaces/w/d/.env</code></span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(rawEnvState);
                          toast.success(".env copied to clipboard!");
                        }}
                        className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Copy .env</span>
                      </button>
                    </div>

                    <Textarea
                      value={rawEnvState}
                      onChange={(e) => setRawEnvState(e.target.value)}
                      rows={26}
                      className="font-mono text-xs bg-zinc-950 border-white/10 text-emerald-400 p-4 leading-relaxed tracking-wide select-all focus-visible:ring-emerald-500"
                    />
                  </div>
                )}

                {/* Bottom Save Bar */}
                <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-zinc-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Changes take effect immediately upon saving without server interruption.</span>
                  </div>

                  <Button
                    type="button"
                    variant="studio"
                    disabled={saveEnvMutation.isPending}
                    onClick={() => saveEnvMutation.mutate(rawEnvState)}
                    className="w-full sm:w-auto h-11 px-8 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saveEnvMutation.isPending ? "Applying Updates..." : "Save & Update .env Live"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
