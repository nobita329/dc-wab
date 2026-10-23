"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  TutorialItem,
  TutorialSettings,
  TutorialPageData,
  YouTubeDetectResult,
  YouTubeChannelDetectResult,
} from "@nova/shared";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Youtube,
  Search,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Save,
  RefreshCw,
  ExternalLink,
  Play,
  Eye,
  ThumbsUp,
  Clock,
  ArrowUp,
  ArrowDown,
  Key,
  Tv,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  EyeOff,
  Layers,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const standardCategories = [
  "Discord Bots",
  "Hosting & Cloud",
  "Development",
  "Minecraft Dev",
  "Tutorials",
];

export default function AdminTutorialsPage() {
  const queryClient = useQueryClient();

  // Local UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDetectingVideo, setIsDetectingVideo] = useState(false);
  const [isDetectingChannel, setIsDetectingChannel] = useState(false);

  // Quick Detect input bar
  const [quickDetectInput, setQuickDetectInput] = useState("");

  // Edit / Add Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<TutorialItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<TutorialSettings | null>(null);

  // 1. Fetch tutorials data from tutorials.db via /api/admin/tutorials
  const {
    data: adminData,
    isLoading,
    refetch,
  } = useQuery<{
    success: boolean;
    data: TutorialPageData;
  }>({
    queryKey: ["adminTutorialData"],
    queryFn: async () => {
      const res = await api.get("/api/admin/tutorials");
      if (res.data?.data?.settings && !settingsForm) {
        setSettingsForm(res.data.data.settings);
      }
      return res.data;
    },
  });

  const pageData = adminData?.data;
  const currentSettings = settingsForm || pageData?.settings || {
    channelName: "Nova Studio",
    channelId: "",
    apiKey: "",
    title: "Master Modern Development & Cloud Architecture",
    badge: "OFFICIAL VIDEO GUIDES & TUTORIALS",
    subtitle:
      "Explore comprehensive tutorials on Discord bot engineering, cloud infrastructure, full-stack Next.js systems, and Minecraft server development.",
    subscriberCount: "12.4K",
    videoCount: "48",
    viewCount: "350K",
    avatarUrl: "",
    bannerUrl: "",
    customUrl: "@NovaStudioHQ",
    autoSync: false,
    updatedAt: new Date().toISOString(),
    updatedBy: "admin",
  };

  const tutorials = pageData?.tutorials || [];

  // ==========================================
  // MUTATIONS
  // ==========================================

  // Save Settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: TutorialSettings) => {
      const res = await api.put("/api/admin/tutorials/settings", settings);
      return res.data;
    },
    onSuccess: () => {
      toast.success("YouTube channel & API settings saved to tutorials.db!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["tutorialPageData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save settings");
    },
  });

  // Save / Update Single Tutorial
  const saveTutorialMutation = useMutation({
    mutationFn: async (item: TutorialItem) => {
      const res = await api.post("/api/admin/tutorials", item);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Tutorial saved to tutorials.db!");
      setIsDialogOpen(false);
      setEditingTutorial(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["tutorialPageData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save tutorial");
    },
  });

  // Delete Tutorial
  const deleteTutorialMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/admin/tutorials/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Tutorial removed from tutorials.db");
      setDeleteConfirmId(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["tutorialPageData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete tutorial");
    },
  });

  // Restore Starter Tutorials
  const restoreDefaultsMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/admin/tutorials/restore-defaults", {});
      return res.data;
    },
    onSuccess: () => {
      toast.success("Starter official tutorial videos restored in tutorials.db!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["tutorialPageData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to restore defaults");
    },
  });

  // ==========================================
  // HANDLERS
  // ==========================================

  // Auto-detect single video from YouTube
  const handleDetectVideo = async (urlOrId: string) => {
    if (!urlOrId.trim()) {
      toast.error("Please enter a YouTube video URL or ID");
      return;
    }

    try {
      setIsDetectingVideo(true);
      const res = await api.post("/api/admin/tutorials/detect-video", {
        urlOrId: urlOrId.trim(),
      });

      if (res.data?.success && res.data.data) {
        const detected: YouTubeDetectResult = res.data.data;
        toast.success(`Detected: "${detected.title}" (${detected.likeCount} likes)`);

        // If editing in modal, update modal fields
        if (editingTutorial) {
          setEditingTutorial({
            ...editingTutorial,
            youtubeVideoId: detected.videoId,
            title: detected.title,
            description: detected.description,
            thumbnailUrl: detected.thumbnailUrl,
            duration: detected.duration,
            viewCount: detected.viewCount,
            likeCount: detected.likeCount,
            publishedAt: detected.publishedAt,
          });
        } else {
          // Open new dialog with detected video
          setEditingTutorial({
            id: `tut-${detected.videoId}`,
            youtubeVideoId: detected.videoId,
            title: detected.title,
            description: detected.description,
            category: "Tutorials",
            thumbnailUrl: detected.thumbnailUrl,
            duration: detected.duration,
            viewCount: detected.viewCount,
            likeCount: detected.likeCount,
            commentCount: 0,
            publishedAt: detected.publishedAt,
            featured: false,
            sortOrder: tutorials.length,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setIsDialogOpen(true);
          setQuickDetectInput("");
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Could not detect YouTube video");
    } finally {
      setIsDetectingVideo(false);
    }
  };

  // Auto-detect Channel details
  const handleDetectChannel = async () => {
    if (!currentSettings.channelId && !currentSettings.channelName) {
      toast.error("Enter a Channel ID or @handle first");
      return;
    }

    try {
      setIsDetectingChannel(true);
      const res = await api.post("/api/admin/tutorials/detect-channel", {
        channelId: currentSettings.channelId || currentSettings.channelName,
        apiKey: currentSettings.apiKey,
      });

      if (res.data?.success && res.data.data) {
        const ch: YouTubeChannelDetectResult = res.data.data;
        const updated = {
          ...currentSettings,
          channelId: ch.channelId || currentSettings.channelId,
          channelName: ch.channelName || currentSettings.channelName,
          customUrl: ch.customUrl || currentSettings.customUrl,
          subscriberCount: ch.subscriberCount || currentSettings.subscriberCount,
          videoCount: ch.videoCount || currentSettings.videoCount,
          viewCount: ch.viewCount || currentSettings.viewCount,
          avatarUrl: ch.avatarUrl || currentSettings.avatarUrl,
          bannerUrl: ch.bannerUrl || currentSettings.bannerUrl,
        };
        setSettingsForm(updated);
        toast.success(`Detected channel "${ch.channelName}" (${ch.subscriberCount} subscribers)! Click 'Save Settings' to persist.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to detect YouTube channel");
    } finally {
      setIsDetectingChannel(false);
    }
  };

  // Sync full video list from YouTube API
  const handleSyncFromYouTube = async () => {
    if (!currentSettings.apiKey) {
      toast.error("Please enter a YouTube Data API Key first to enable channel sync.");
      return;
    }
    if (!currentSettings.channelId) {
      toast.error("Please enter a YouTube Channel ID to sync.");
      return;
    }

    try {
      setIsSyncing(true);
      const res = await api.post("/api/admin/tutorials/sync-youtube", {
        channelId: currentSettings.channelId,
        apiKey: currentSettings.apiKey,
        replaceExisting: false,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Synced videos from YouTube!");
        refetch();
        queryClient.invalidateQueries({ queryKey: ["tutorialPageData"] });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to sync videos from YouTube");
    } finally {
      setIsSyncing(false);
    }
  };

  // Move tutorial up/down
  const handleMoveTutorial = (idx: number, direction: "up" | "down") => {
    const items = [...tutorials];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[idx];
    items[idx] = items[targetIdx];
    items[targetIdx] = temp;

    const reorderedIds = items.map((i) => i.id);
    api.post("/api/admin/tutorials/reorder", { ids: reorderedIds }).then(() => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["tutorialPageData"] });
    });
  };

  // Filter tutorials
  const filteredTutorials = tutorials.filter((t) => {
    const matchesCat =
      selectedCategoryFilter === "All" || t.category === selectedCategoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.youtubeVideoId.includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#0a0d14] text-zinc-100 flex flex-col">
      <AdminHeader
        title="Tutorials & YouTube Manager"
        subtitle="Manage video tutorials, auto-detect videos from YouTube, and sync live views & likes to tutorials.db."
        action={
          <div className="flex items-center gap-2">
            <Link href="/tutorials" target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs border-white/10 text-zinc-300"
              >
                <span>Live Tutorials Page</span>
                <ExternalLink className="h-3 w-3 text-red-400" />
              </Button>
            </Link>

            <Button
              size="sm"
              onClick={() => {
                setEditingTutorial({
                  id: `tut-${Date.now()}`,
                  youtubeVideoId: "",
                  title: "",
                  description: "",
                  category: "Tutorials",
                  thumbnailUrl: "",
                  duration: "10:00",
                  viewCount: 0,
                  likeCount: 0,
                  commentCount: 0,
                  publishedAt: new Date().toISOString(),
                  featured: false,
                  sortOrder: tutorials.length,
                  tags: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setIsDialogOpen(true);
              }}
              className="gap-1.5 h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Tutorial</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* ======================================================== */}
        {/* 1. CHANNEL CONFIGURATION & YOUTUBE API SETUP */}
        {/* ======================================================== */}
        <Card className="border-white/10 bg-zinc-900/60 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-40 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-red-500 fill-red-500" />
                  <span>YouTube Channel &amp; API Configuration</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Configure your YouTube channel and optional API key to auto-sync subscriber stats, likes, and full video catalogs directly into <code className="text-white">tutorials.db</code>.
                </CardDescription>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                  <span>tutorials.db Connected</span>
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Channel Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Channel Name
                </label>
                <Input
                  value={currentSettings.channelName}
                  onChange={(e) =>
                    setSettingsForm({ ...currentSettings, channelName: e.target.value })
                  }
                  placeholder="e.g. Nova Studio or Nobita Cloud"
                  className="h-9 text-xs bg-black/40 border-white/10"
                />
              </div>

              {/* Channel ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Channel ID or @Handle
                </label>
                <Input
                  value={currentSettings.channelId}
                  onChange={(e) =>
                    setSettingsForm({ ...currentSettings, channelId: e.target.value })
                  }
                  placeholder="e.g. UCxxxxxxxxxxxxxx or @NovaStudioHQ"
                  className="h-9 text-xs font-mono bg-black/40 border-white/10"
                />
              </div>

              {/* YouTube Data API Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                    <Key className="h-3 w-3 text-amber-400" />
                    <span>YouTube Data API v3 Key</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[10px] text-zinc-400 hover:text-white"
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                </div>
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={currentSettings.apiKey || ""}
                  onChange={(e) =>
                    setSettingsForm({ ...currentSettings, apiKey: e.target.value })
                  }
                  placeholder="AIzaSy..."
                  className="h-9 text-xs font-mono bg-black/40 border-white/10"
                />
              </div>
            </div>

            {/* Channel Live Stats Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  Subscribers
                </span>
                <p className="text-sm font-bold text-white mt-0.5">
                  {currentSettings.subscriberCount || "0"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  Total Videos
                </span>
                <p className="text-sm font-bold text-white mt-0.5">
                  {currentSettings.videoCount || `${tutorials.length}`}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  Total Views
                </span>
                <p className="text-sm font-bold text-white mt-0.5">
                  {currentSettings.viewCount || "0"}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  Custom Handle
                </span>
                <p className="text-sm font-bold text-red-400 mt-0.5 font-mono truncate">
                  {currentSettings.customUrl || "@NovaStudioHQ"}
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDetectChannel}
                  disabled={isDetectingChannel}
                  className="h-8 text-xs gap-1.5 border-white/10"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isDetectingChannel ? "animate-spin" : ""}`}
                  />
                  <span>Detect Channel Stats</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleSyncFromYouTube}
                  disabled={isSyncing}
                  className="h-8 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  <Youtube className="h-3.5 w-3.5 fill-white" />
                  <span>{isSyncing ? "Syncing..." : "Sync Channel Video List"}</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => restoreDefaultsMutation.mutate()}
                  className="h-8 text-xs text-zinc-400 hover:text-white"
                >
                  Restore Starter Guides
                </Button>

                <Button
                  size="sm"
                  onClick={() => saveSettingsMutation.mutate(currentSettings)}
                  disabled={saveSettingsMutation.isPending}
                  className="h-8 text-xs gap-1.5 bg-white text-black hover:bg-zinc-200 font-bold"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Channel Settings</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ======================================================== */}
        {/* 2. INSTANT YOUTUBE VIDEO DETECTOR BAR */}
        {/* ======================================================== */}
        <Card className="border-white/10 bg-zinc-900/60 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Instant Video Detector (YouTube se ditact video + like + sub)</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Paste any YouTube URL or 11-char Video ID. We automatically fetch the title, high-res thumbnail, duration, views, and like count.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDetectVideo(quickDetectInput);
              }}
              className="flex flex-col sm:flex-row items-center gap-2.5"
            >
              <div className="relative flex-1 w-full">
                <Youtube className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500 fill-red-500" />
                <Input
                  value={quickDetectInput}
                  onChange={(e) => setQuickDetectInput(e.target.value)}
                  placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=... or youtu.be/...)"
                  className="pl-10 h-10 text-xs bg-black/40 border-white/10 rounded-xl"
                />
              </div>

              <Button
                type="submit"
                disabled={isDetectingVideo || !quickDetectInput.trim()}
                className="w-full sm:w-auto h-10 px-5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white gap-2 shadow-lg shadow-red-600/20"
              >
                <Sparkles
                  className={`h-3.5 w-3.5 ${isDetectingVideo ? "animate-spin" : ""}`}
                />
                <span>{isDetectingVideo ? "Detecting..." : "Detect & Add Video"}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ======================================================== */}
        {/* 3. TUTORIALS LIST & EDITOR */}
        {/* ======================================================== */}
        <Card className="border-white/10 bg-zinc-900/60 shadow-xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Tv className="h-4 w-4 text-red-400" />
                  <span>Tutorial Videos ({tutorials.length})</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Manage the video show list displayed on <Link href="/tutorials" className="text-red-400 hover:underline">/tutorials</Link>. Changes save to <code className="text-white">tutorials.db</code>.
                </CardDescription>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
                  {["All", ...standardCategories].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                        selectedCategoryFilter === cat
                          ? "bg-red-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tutorials..."
                    className="pl-8 h-8 w-44 text-xs bg-black/40 border-white/10 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-zinc-500">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading tutorials from tutorials.db...</p>
              </div>
            ) : filteredTutorials.length === 0 ? (
              <div className="text-center py-12 border border-white/5 rounded-2xl bg-black/30">
                <Tv className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">No tutorial videos found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTutorials.map((video, idx) => (
                  <div
                    key={video.id}
                    className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 flex flex-col justify-between gap-3 group hover:border-red-500/30 transition-all"
                  >
                    <div className="space-y-3">
                      {/* Thumbnail & Badges */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-white">
                          {video.duration}
                        </div>
                        {video.featured && (
                          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-red-600 text-[9px] font-bold uppercase tracking-wider text-white shadow-md flex items-center gap-1">
                            <Star className="h-2.5 w-2.5 fill-white" />
                            <span>Featured</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-zinc-800 text-red-300 border border-red-500/20">
                            {video.category}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            ID: {video.youtubeVideoId}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-red-300 transition-colors">
                          {video.title}
                        </h4>
                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {video.description || "No description."}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-zinc-500" />
                          <span>{video.viewCount.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3 text-zinc-500" />
                          <span>{video.likeCount.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>

                    {/* Footer Actions: Reorder & Edit/Delete */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveTutorial(idx, "up")}
                          disabled={idx === 0}
                          className="h-7 w-7 text-zinc-400 hover:text-white"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveTutorial(idx, "down")}
                          disabled={idx === tutorials.length - 1}
                          className="h-7 w-7 text-zinc-400 hover:text-white"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTutorial(video);
                            setIsDialogOpen(true);
                          }}
                          className="h-7 px-2.5 text-xs gap-1 border-white/10"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(video.id)}
                          className="h-7 w-7 text-zinc-500 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* 4. ADD / EDIT TUTORIAL DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
            setEditingTutorial(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl border-white/10 bg-zinc-950/95 backdrop-blur-2xl p-6 text-zinc-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500 fill-red-500" />
              <span>
                {editingTutorial?.id?.startsWith("tut-") && !editingTutorial?.title
                  ? "Add New Tutorial"
                  : "Edit Tutorial Video"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Save video details to <code className="text-white">tutorials.db</code>. You can paste any YouTube URL to auto-detect details.
            </DialogDescription>
          </DialogHeader>

          {editingTutorial && (
            <div className="space-y-4 pt-2 text-xs">
              {/* YouTube Video URL / ID + Detect Button */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">
                  YouTube Video ID or Full Link
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={editingTutorial.youtubeVideoId}
                    onChange={(e) =>
                      setEditingTutorial({
                        ...editingTutorial,
                        youtubeVideoId: e.target.value,
                      })
                    }
                    placeholder="e.g. bdHE2wHT-gQ or https://youtube.com/watch?v=..."
                    className="h-9 text-xs font-mono bg-black/40 border-white/10"
                  />
                  <Button
                    type="button"
                    onClick={() => handleDetectVideo(editingTutorial.youtubeVideoId)}
                    disabled={isDetectingVideo || !editingTutorial.youtubeVideoId}
                    size="sm"
                    className="h-9 px-3 gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold shrink-0"
                  >
                    <Sparkles
                      className={`h-3.5 w-3.5 ${isDetectingVideo ? "animate-spin" : ""}`}
                    />
                    <span>Detect Details</span>
                  </Button>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">Tutorial Title</label>
                <Input
                  value={editingTutorial.title}
                  onChange={(e) =>
                    setEditingTutorial({ ...editingTutorial, title: e.target.value })
                  }
                  placeholder="e.g. Build an Advanced Discord Bot in Node.js"
                  className="h-9 text-xs bg-black/40 border-white/10"
                />
              </div>

              {/* Category & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300">Category</label>
                  <select
                    value={editingTutorial.category}
                    onChange={(e) =>
                      setEditingTutorial({
                        ...editingTutorial,
                        category: e.target.value,
                      })
                    }
                    className="w-full h-9 rounded-md border border-white/10 bg-zinc-900 px-3 text-xs text-white"
                  >
                    {standardCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300">Duration (MM:SS)</label>
                  <Input
                    value={editingTutorial.duration}
                    onChange={(e) =>
                      setEditingTutorial({
                        ...editingTutorial,
                        duration: e.target.value,
                      })
                    }
                    placeholder="e.g. 18:45"
                    className="h-9 text-xs font-mono bg-black/40 border-white/10"
                  />
                </div>
              </div>

              {/* Thumbnail URL */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">
                  Thumbnail URL (High Resolution)
                </label>
                <Input
                  value={editingTutorial.thumbnailUrl}
                  onChange={(e) =>
                    setEditingTutorial({
                      ...editingTutorial,
                      thumbnailUrl: e.target.value,
                    })
                  }
                  placeholder="https://i.ytimg.com/vi/.../maxresdefault.jpg"
                  className="h-9 text-xs font-mono bg-black/40 border-white/10"
                />
              </div>

              {/* Views & Likes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300">Views Count</label>
                  <Input
                    type="number"
                    value={editingTutorial.viewCount}
                    onChange={(e) =>
                      setEditingTutorial({
                        ...editingTutorial,
                        viewCount: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="h-9 text-xs font-mono bg-black/40 border-white/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300">Likes Count</label>
                  <Input
                    type="number"
                    value={editingTutorial.likeCount}
                    onChange={(e) =>
                      setEditingTutorial({
                        ...editingTutorial,
                        likeCount: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="h-9 text-xs font-mono bg-black/40 border-white/10"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">Description</label>
                <Textarea
                  value={editingTutorial.description}
                  onChange={(e) =>
                    setEditingTutorial({
                      ...editingTutorial,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Comprehensive walkthrough summary..."
                  className="text-xs bg-black/40 border-white/10"
                />
              </div>

              {/* Featured Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-white/5">
                <div>
                  <p className="font-semibold text-white">Feature in Hero Spotlight</p>
                  <p className="text-[11px] text-zinc-400">
                    Displays this tutorial as the top prominent video on /tutorials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingTutorial({
                      ...editingTutorial,
                      featured: !editingTutorial.featured,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    editingTutorial.featured
                      ? "bg-red-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {editingTutorial.featured ? "★ Featured" : "Standard"}
                </button>
              </div>

              {/* Live Preview Thumbnail */}
              {editingTutorial.thumbnailUrl && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400 text-[11px]">
                    Thumbnail Preview
                  </label>
                  <div className="aspect-video rounded-xl overflow-hidden bg-black border border-white/10 max-w-xs">
                    <img
                      src={editingTutorial.thumbnailUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-white/5 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingTutorial(null);
              }}
              className="border-white/10 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingTutorial) {
                  saveTutorialMutation.mutate(editingTutorial);
                }
              }}
              disabled={saveTutorialMutation.isPending || !editingTutorial?.title}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              <span>Save to tutorials.db</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 5. DELETE CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-sm border-white/10 bg-zinc-950 p-6 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-rose-500" />
              <span>Delete Tutorial Video</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mt-1">
              Are you sure you want to remove this tutorial from <code className="text-white">tutorials.db</code>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
              className="border-white/10 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (deleteConfirmId) {
                  deleteTutorialMutation.mutate(deleteConfirmId);
                }
              }}
              disabled={deleteTutorialMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
