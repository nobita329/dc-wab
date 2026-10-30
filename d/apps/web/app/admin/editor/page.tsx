"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Save,
  Send,
  RotateCcw,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Plus,
  Trash2,
  Sparkles,
  TrendingUp,
  Megaphone,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Terminal,
  Share2,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEditorStore, PreviewDevice } from "@/lib/store";
import { HomePageContent } from "@nova/shared";

// Preview components
import { AnnouncementBanner } from "@/components/home/AnnouncementBanner";
import { Navbar } from "@/components/home/Navbar";
import { HeroSection } from "@/components/home/HeroSection";
import { CommandSection } from "@/components/home/CommandSection";
import { SocialCardsSection } from "@/components/home/SocialCardsSection";
import { StatsSection } from "@/components/home/StatsSection";
import { DiscordSection } from "@/components/home/DiscordSection";
import { CtaSection } from "@/components/home/CtaSection";
import { FooterSection } from "@/components/home/FooterSection";

export default function AdminEditorPage() {
  const {
    draft,
    isDirty,
    setDraft,
    updateDraft,
    previewDevice,
    setPreviewDevice,
    activeSection,
    setActiveSection,
  } = useEditorStore();

  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");

  // Fetch draft & published content
  const { data, isLoading, refetch } = useQuery<{
    success: boolean;
    published: HomePageContent;
    draft: HomePageContent | null;
    hasDraft: boolean;
  }>({
    queryKey: ["adminHome"],
    queryFn: async () => (await api.get("/api/admin/home")).data,
  });

  useEffect(() => {
    if (data?.draft) {
      setDraft(data.draft);
    } else if (data?.published) {
      setDraft(data.published);
    }
  }, [data, setDraft]);

  // Save Draft Mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (content: HomePageContent) => {
      const res = await api.put("/api/admin/home", content);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Draft saved successfully");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save draft");
    },
  });

  // Publish Mutation
  const publishMutation = useMutation({
    mutationFn: async (content: HomePageContent) => {
      const res = await api.post("/api/admin/home/publish", content);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Content published to live website!");
      setPublishDialogOpen(false);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to publish");
    },
  });

  // Reset Mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/admin/home/reset");
      return res.data;
    },
    onSuccess: (res) => {
      toast.success("Home page restored to default template");
      setResetDialogOpen(false);
      if (res.published) {
        setDraft(res.published);
      }
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to reset");
    },
  });

  if (isLoading || !draft) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Home Page Editor" subtitle="Loading content schema..." />
        <div className="p-8 space-y-6">
          <Skeleton className="h-10 w-96 bg-zinc-800" />
          <Skeleton className="h-64 w-full bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Top Header with Action Bar */}
      <AdminHeader
        title="Home Page Visual Editor"
        subtitle={`Editing revision v${draft.version} • ${isDirty ? "Unsaved changes" : "Draft synced"}`}
        action={
          <div className="flex items-center gap-2">
            {/* View Mode Selectors */}
            <div className="hidden md:flex items-center bg-zinc-900 border border-white/10 rounded-lg p-0.5 mr-2">
              <button
                onClick={() => setViewMode("split")}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  viewMode === "split" ? "bg-violet-600 text-white font-medium" : "text-zinc-400 hover:text-white"
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setViewMode("editor")}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  viewMode === "editor" ? "bg-violet-600 text-white font-medium" : "text-zinc-400 hover:text-white"
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  viewMode === "preview" ? "bg-violet-600 text-white font-medium" : "text-zinc-400 hover:text-white"
                }`}
              >
                Live Preview
              </button>
            </div>

            {/* Reset Defaults button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetDialogOpen(true)}
              className="h-8 text-xs border-white/10 text-zinc-400 hover:text-white gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </Button>

            {/* Save Draft button */}
            <Button
              variant="secondary"
              size="sm"
              disabled={saveDraftMutation.isPending}
              onClick={() => saveDraftMutation.mutate(draft)}
              className="h-8 text-xs gap-1.5 border border-white/10"
            >
              <Save className="h-3.5 w-3.5 text-cyan-400" />
              <span>{saveDraftMutation.isPending ? "Saving..." : "Save Draft"}</span>
              {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />}
            </Button>

            {/* Publish Live button */}
            <Button
              variant="studio"
              size="sm"
              disabled={publishMutation.isPending}
              onClick={() => setPublishDialogOpen(true)}
              className="h-8 text-xs gap-1.5 shadow-md shadow-violet-600/30"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Publish to Live</span>
            </Button>
          </div>
        }
      />

      {/* Editor & Preview Workspace Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Section Form Editor */}
        {(viewMode === "split" || viewMode === "editor") && (
          <div
            className={`${
              viewMode === "split" ? "w-full lg:w-1/2 border-r border-white/5" : "w-full max-w-4xl mx-auto"
            } flex flex-col h-[calc(100vh-64px)] overflow-y-auto p-6 space-y-6`}
          >
            {/* Section Category Tabs */}
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
              <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 h-auto p-1 bg-zinc-900 border border-white/10 gap-1 rounded-xl">
                <TabsTrigger value="hero" className="text-xs py-2">
                  Hero
                </TabsTrigger>
                <TabsTrigger value="cmd" className="text-xs py-2 text-cyan-400 font-semibold">
                  CMD
                </TabsTrigger>
                <TabsTrigger value="socials" className="text-xs py-2 text-pink-400 font-semibold">
                  Socials
                </TabsTrigger>
                <TabsTrigger value="discord" className="text-xs py-2 text-indigo-400 font-semibold">
                  Discord
                </TabsTrigger>
                <TabsTrigger value="announcement" className="text-xs py-2">
                  Banner
                </TabsTrigger>
                <TabsTrigger value="stats" className="text-xs py-2">
                  Stats
                </TabsTrigger>
                <TabsTrigger value="cta" className="text-xs py-2">
                  CTA
                </TabsTrigger>
              </TabsList>

              {/* SECTION: HERO */}
              <TabsContent value="hero" className="space-y-4 mt-6">
                <Card className="border-white/10 bg-zinc-900/60">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      Hero Section Configuration
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Main headline, subtext, and primary conversion call-to-actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Section Badge</label>
                      <Input
                        value={draft.hero.badge}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, badge: e.target.value },
                          }))
                        }
                        className="mt-1"
                        placeholder="e.g. NEXT-GEN CREATIVE STUDIO"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Main Headline</label>
                      <Textarea
                        rows={2}
                        value={draft.hero.headline}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, headline: e.target.value },
                          }))
                        }
                        className="mt-1 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Subheadline & Value Prop</label>
                      <Textarea
                        rows={3}
                        value={draft.hero.subheadline}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, subheadline: e.target.value },
                          }))
                        }
                        className="mt-1 text-sm text-zinc-300"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Primary CTA Text</label>
                        <Input
                          value={draft.hero.primaryCtaText}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, primaryCtaText: e.target.value },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Primary CTA Target (#)</label>
                        <Input
                          value={draft.hero.primaryCtaHref}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, primaryCtaHref: e.target.value },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Secondary CTA Text</label>
                        <Input
                          value={draft.hero.secondaryCtaText}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, secondaryCtaText: e.target.value },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Secondary CTA Target (#)</label>
                        <Input
                          value={draft.hero.secondaryCtaHref}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, secondaryCtaHref: e.target.value },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-zinc-300">Show Client Proof Pill</p>
                        <p className="text-[11px] text-zinc-500">Display trusted client count banner</p>
                      </div>
                      <Switch
                        checked={draft.hero.showClientCount}
                        onCheckedChange={(checked) =>
                          updateDraft((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, showClientCount: checked },
                          }))
                        }
                      />
                    </div>

                    {draft.hero.showClientCount && (
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Client Count Label</label>
                        <Input
                          value={draft.hero.clientCountText}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              hero: { ...prev.hero, clientCountText: e.target.value },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SECTION: CMD (ALL IN ONE) */}
              <TabsContent value="cmd" className="space-y-4 mt-6">
                <Card className="border-white/10 bg-zinc-900/60">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-cyan-400" />
                          ALL IN ONE CMD Script Section
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Configure the quick terminal copy command section on the home page
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">Enabled</span>
                        <Switch
                          checked={draft.commandSection?.enabled ?? true}
                          onCheckedChange={(checked) =>
                            updateDraft((prev) => ({
                              ...prev,
                              commandSection: {
                                ...(prev.commandSection || {
                                  enabled: true,
                                  badge: "AUTOMATED SCRIPT",
                                  title: "ALL IN ONE",
                                  highlightText: "CMD",
                                  description: "Execute the master script to install all dependencies instantly.",
                                  command: "bash <(curl -s https://ptero.nobitahost.in)",
                                }),
                                enabled: checked,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Badge Text</label>
                        <Input
                          value={draft.commandSection?.badge || "AUTOMATED SCRIPT"}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              commandSection: {
                                ...(prev.commandSection || {
                                  enabled: true,
                                  badge: "AUTOMATED SCRIPT",
                                  title: "ALL IN ONE",
                                  highlightText: "CMD",
                                  description: "Execute the master script to install all dependencies instantly.",
                                  command: "bash <(curl -s https://ptero.nobitahost.in)",
                                }),
                                badge: e.target.value,
                              },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Title Prefix</label>
                        <Input
                          value={draft.commandSection?.title || "ALL IN ONE"}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              commandSection: {
                                ...(prev.commandSection || {
                                  enabled: true,
                                  badge: "AUTOMATED SCRIPT",
                                  title: "ALL IN ONE",
                                  highlightText: "CMD",
                                  description: "Execute the master script to install all dependencies instantly.",
                                  command: "bash <(curl -s https://ptero.nobitahost.in)",
                                }),
                                title: e.target.value,
                              },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Highlighted Word</label>
                        <Input
                          value={draft.commandSection?.highlightText || "CMD"}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              commandSection: {
                                ...(prev.commandSection || {
                                  enabled: true,
                                  badge: "AUTOMATED SCRIPT",
                                  title: "ALL IN ONE",
                                  highlightText: "CMD",
                                  description: "Execute the master script to install all dependencies instantly.",
                                  command: "bash <(curl -s https://ptero.nobitahost.in)",
                                }),
                                highlightText: e.target.value,
                              },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Description</label>
                      <Input
                        value={draft.commandSection?.description || "Execute the master script to install all dependencies instantly."}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            commandSection: {
                              ...(prev.commandSection || {
                                enabled: true,
                                badge: "AUTOMATED SCRIPT",
                                title: "ALL IN ONE",
                                highlightText: "CMD",
                                description: "Execute the master script to install all dependencies instantly.",
                                command: "bash <(curl -s https://ptero.nobitahost.in)",
                              }),
                              description: e.target.value,
                            },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Terminal Command to Copy</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={draft.commandSection?.command || "bash <(curl -s https://ptero.nobitahost.in)"}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              commandSection: {
                                ...(prev.commandSection || {
                                  enabled: true,
                                  badge: "AUTOMATED SCRIPT",
                                  title: "ALL IN ONE",
                                  highlightText: "CMD",
                                  description: "Execute the master script to install all dependencies instantly.",
                                  command: "bash <(curl -s https://ptero.nobitahost.in)",
                                }),
                                command: e.target.value,
                              },
                            }))
                          }
                          className="font-mono text-cyan-400 bg-black/50 border-white/10"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SECTION: SOCIALS */}
              <TabsContent value="socials" className="space-y-4 mt-6">
                <Card className="border-white/10 bg-zinc-900/60">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                          <Share2 className="h-4 w-4 text-pink-400" />
                          Social Connect Cards
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Configure the 4 social cards (YouTube, Instagram, GitHub, Discord)
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">Enabled</span>
                        <Switch
                          checked={draft.socialCards?.enabled ?? true}
                          onCheckedChange={(checked) =>
                            updateDraft((prev) => ({
                              ...prev,
                              socialCards: {
                                ...(prev.socialCards || {
                                  enabled: true,
                                  items: [],
                                }),
                                enabled: checked,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {(
                      draft.socialCards?.items || [
                        {
                          id: "card-youtube",
                          platform: "youtube" as const,
                          title: "YouTube",
                          subtitle: "404 subs",
                          url: "https://youtube.com/@nobitahost",
                          color: "#ef4444",
                        },
                        {
                          id: "card-instagram",
                          platform: "instagram" as const,
                          title: "Instagram",
                          subtitle: "@nobita_dev.in",
                          url: "https://instagram.com/nobita_dev.in",
                          color: "#ec4899",
                        },
                        {
                          id: "card-github",
                          platform: "github" as const,
                          title: "GitHub",
                          subtitle: "-- repos",
                          url: "https://github.com",
                          color: "#71717a",
                        },
                        {
                          id: "card-discord",
                          platform: "discord" as const,
                          title: "Discord",
                          subtitle: "30 Members Online",
                          url: "https://discord.com/invite/PR2x6RGf",
                          color: "#5865F2",
                          buttonText: "Join",
                        },
                      ]
                    ).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="rounded-xl border border-white/5 bg-zinc-950/40 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: item.color || "#888" }}
                            />
                            {item.title || item.platform} Card
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500">
                            platform: {item.platform}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-zinc-300">Title</label>
                            <Input
                              value={item.title}
                              onChange={(e) => {
                                const newItems = [
                                  ...(draft.socialCards?.items || [
                                    {
                                      id: "card-youtube",
                                      platform: "youtube" as const,
                                      title: "YouTube",
                                      subtitle: "404 subs",
                                      url: "https://youtube.com/@nobitahost",
                                      color: "#ef4444",
                                    },
                                    {
                                      id: "card-instagram",
                                      platform: "instagram" as const,
                                      title: "Instagram",
                                      subtitle: "@nobita_dev.in",
                                      url: "https://instagram.com/nobita_dev.in",
                                      color: "#ec4899",
                                    },
                                    {
                                      id: "card-github",
                                      platform: "github" as const,
                                      title: "GitHub",
                                      subtitle: "-- repos",
                                      url: "https://github.com",
                                      color: "#71717a",
                                    },
                                    {
                                      id: "card-discord",
                                      platform: "discord" as const,
                                      title: "Discord",
                                      subtitle: "30 Members Online",
                                      url: "https://discord.com/invite/PR2x6RGf",
                                      color: "#5865F2",
                                      buttonText: "Join",
                                    },
                                  ]),
                                ];
                                newItems[idx] = { ...newItems[idx], title: e.target.value };
                                updateDraft((prev) => ({
                                  ...prev,
                                  socialCards: {
                                    ...(prev.socialCards || { enabled: true, items: [] }),
                                    items: newItems,
                                  },
                                }));
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-zinc-300">
                              Subtitle / Counter (e.g. &quot;404 subs&quot;, &quot;@nobita_dev.in&quot;)
                            </label>
                            <Input
                              value={item.subtitle}
                              onChange={(e) => {
                                const newItems = [
                                  ...(draft.socialCards?.items || [
                                    {
                                      id: "card-youtube",
                                      platform: "youtube" as const,
                                      title: "YouTube",
                                      subtitle: "404 subs",
                                      url: "https://youtube.com/@nobitahost",
                                      color: "#ef4444",
                                    },
                                    {
                                      id: "card-instagram",
                                      platform: "instagram" as const,
                                      title: "Instagram",
                                      subtitle: "@nobita_dev.in",
                                      url: "https://instagram.com/nobita_dev.in",
                                      color: "#ec4899",
                                    },
                                    {
                                      id: "card-github",
                                      platform: "github" as const,
                                      title: "GitHub",
                                      subtitle: "-- repos",
                                      url: "https://github.com",
                                      color: "#71717a",
                                    },
                                    {
                                      id: "card-discord",
                                      platform: "discord" as const,
                                      title: "Discord",
                                      subtitle: "30 Members Online",
                                      url: "https://discord.com/invite/PR2x6RGf",
                                      color: "#5865F2",
                                      buttonText: "Join",
                                    },
                                  ]),
                                ];
                                newItems[idx] = { ...newItems[idx], subtitle: e.target.value };
                                updateDraft((prev) => ({
                                  ...prev,
                                  socialCards: {
                                    ...(prev.socialCards || { enabled: true, items: [] }),
                                    items: newItems,
                                  },
                                }));
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-zinc-300">Destination Link URL</label>
                            <Input
                              value={item.url}
                              onChange={(e) => {
                                const newItems = [
                                  ...(draft.socialCards?.items || [
                                    {
                                      id: "card-youtube",
                                      platform: "youtube" as const,
                                      title: "YouTube",
                                      subtitle: "404 subs",
                                      url: "https://youtube.com/@nobitahost",
                                      color: "#ef4444",
                                    },
                                    {
                                      id: "card-instagram",
                                      platform: "instagram" as const,
                                      title: "Instagram",
                                      subtitle: "@nobita_dev.in",
                                      url: "https://instagram.com/nobita_dev.in",
                                      color: "#ec4899",
                                    },
                                    {
                                      id: "card-github",
                                      platform: "github" as const,
                                      title: "GitHub",
                                      subtitle: "-- repos",
                                      url: "https://github.com",
                                      color: "#71717a",
                                    },
                                    {
                                      id: "card-discord",
                                      platform: "discord" as const,
                                      title: "Discord",
                                      subtitle: "30 Members Online",
                                      url: "https://discord.com/invite/PR2x6RGf",
                                      color: "#5865F2",
                                      buttonText: "Join",
                                    },
                                  ]),
                                ];
                                newItems[idx] = { ...newItems[idx], url: e.target.value };
                                updateDraft((prev) => ({
                                  ...prev,
                                  socialCards: {
                                    ...(prev.socialCards || { enabled: true, items: [] }),
                                    items: newItems,
                                  },
                                }));
                              }}
                              className="mt-1"
                            />
                          </div>
                          {item.platform === "discord" && (
                            <div>
                              <label className="text-xs font-semibold text-zinc-300">Button Text</label>
                              <Input
                                value={item.buttonText || "Join"}
                                onChange={(e) => {
                                  const newItems = [
                                    ...(draft.socialCards?.items || [
                                      {
                                        id: "card-youtube",
                                        platform: "youtube" as const,
                                        title: "YouTube",
                                        subtitle: "404 subs",
                                        url: "https://youtube.com/@nobitahost",
                                        color: "#ef4444",
                                      },
                                      {
                                        id: "card-instagram",
                                        platform: "instagram" as const,
                                        title: "Instagram",
                                        subtitle: "@nobita_dev.in",
                                        url: "https://instagram.com/nobita_dev.in",
                                        color: "#ec4899",
                                      },
                                      {
                                        id: "card-github",
                                        platform: "github" as const,
                                        title: "GitHub",
                                        subtitle: "-- repos",
                                        url: "https://github.com",
                                        color: "#71717a",
                                      },
                                      {
                                        id: "card-discord",
                                        platform: "discord" as const,
                                        title: "Discord",
                                        subtitle: "30 Members Online",
                                        url: "https://discord.com/invite/PR2x6RGf",
                                        color: "#5865F2",
                                        buttonText: "Join",
                                      },
                                    ]),
                                  ];
                                  newItems[idx] = { ...newItems[idx], buttonText: e.target.value };
                                  updateDraft((prev) => ({
                                    ...prev,
                                    socialCards: {
                                      ...(prev.socialCards || { enabled: true, items: [] }),
                                      items: newItems,
                                    },
                                  }));
                                }}
                                className="mt-1"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SECTION: ANNOUNCEMENT BANNER */}
              <TabsContent value="announcement" className="space-y-4 mt-6">
                <Card className="border-white/10 bg-zinc-900/60">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-cyan-400" />
                      Top Announcement Banner
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Optional alert strip displayed above the main navigation bar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div>
                        <p className="text-xs font-semibold text-zinc-300">Enable Announcement Banner</p>
                        <p className="text-[11px] text-zinc-500">Toggle visibility on the live site</p>
                      </div>
                      <Switch
                        checked={draft.announcement.enabled}
                        onCheckedChange={(checked) =>
                          updateDraft((prev) => ({
                            ...prev,
                            announcement: { ...prev.announcement, enabled: checked },
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Banner Badge</label>
                      <Input
                        value={draft.announcement.badge}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            announcement: { ...prev.announcement, badge: e.target.value },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Announcement Text</label>
                      <Input
                        value={draft.announcement.text}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            announcement: { ...prev.announcement, text: e.target.value },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Action Link Label</label>
                        <Input
                          value={draft.announcement.linkText}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              announcement: { ...prev.announcement, linkText: e.target.value },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Target URL / Hash</label>
                        <Input
                          value={draft.announcement.linkHref}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              announcement: { ...prev.announcement, linkHref: e.target.value },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SECTION: DISCORD & WIDGETBOT */}
              <TabsContent value="discord" className="space-y-4 mt-6">
                <Card className="border-white/10 bg-zinc-900/60">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-[#5865F2]" />
                          Discord Community & WidgetBot Setup
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Configure live WidgetBot chat (Left) and Discord Widget roster (Right)
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">Enable Section:</span>
                        <Switch
                          checked={draft.discord?.enabled ?? true}
                          onCheckedChange={(checked) =>
                            updateDraft((prev) => ({
                              ...prev,
                              discord: {
                                ...(prev.discord || {
                                  serverId: "1540761150797389915",
                                  channelId: "1558058854523215985",
                                  badge: "LIVE COMMUNITY & CHAT",
                                  title: "Join the Nova Studio Discord",
                                  subtitle: "Hang out, test features, and collaborate live with 28+ online creators and engineers.",
                                  autoInviteLink: "https://discord.com/invite/PR2x6RGf",
                                  showWidgetBot: true,
                                  showLiveRoster: true,
                                }),
                                enabled: checked,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">
                          Discord Server ID (Guild ID)
                        </label>
                        <Input
                          value={draft.discord?.serverId || "1540761150797389915"}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDraft((prev) => ({
                              ...prev,
                              discord: {
                                ...(prev.discord || {
                                  enabled: true,
                                  channelId: "1558058854523215985",
                                  badge: "LIVE COMMUNITY & CHAT",
                                  title: "Join the Nova Studio Discord",
                                  subtitle: "Hang out, test features, and collaborate live with 28+ online creators and engineers.",
                                  showWidgetBot: true,
                                  showLiveRoster: true,
                                }),
                                serverId: val,
                              },
                            }));
                          }}
                          className="mt-1 font-mono text-xs"
                          placeholder="1540761150797389915"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-300">
                          Default Chat Channel ID
                        </label>
                        <Input
                          value={draft.discord?.channelId || "1558058854523215985"}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDraft((prev) => ({
                              ...prev,
                              discord: {
                                ...(prev.discord || {
                                  enabled: true,
                                  serverId: "1540761150797389915",
                                  badge: "LIVE COMMUNITY & CHAT",
                                  title: "Join the Nova Studio Discord",
                                  subtitle: "Hang out, test features, and collaborate live with 28+ online creators and engineers.",
                                  showWidgetBot: true,
                                  showLiveRoster: true,
                                }),
                                channelId: val,
                              },
                            }));
                          }}
                          className="mt-1 font-mono text-xs"
                          placeholder="1558058854523215985"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Section Badge</label>
                        <Input
                          value={draft.discord?.badge || "LIVE COMMUNITY & CHAT"}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDraft((prev) => ({
                              ...prev,
                              discord: {
                                ...(prev.discord || {
                                  enabled: true,
                                  serverId: "1540761150797389915",
                                  channelId: "1558058854523215985",
                                  title: "Join the Nova Studio Discord",
                                  subtitle: "Hang out, test features, and collaborate live with 28+ online creators and engineers.",
                                  showWidgetBot: true,
                                  showLiveRoster: true,
                                }),
                                badge: val,
                              },
                            }));
                          }}
                          className="mt-1 text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-zinc-300">
                          Auto-Invite Link (Override / Instant Invite)
                        </label>
                        <Input
                          value={draft.discord?.autoInviteLink || "https://discord.com/invite/PR2x6RGf"}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDraft((prev) => ({
                              ...prev,
                              discord: {
                                ...(prev.discord || {
                                  enabled: true,
                                  serverId: "1540761150797389915",
                                  channelId: "1558058854523215985",
                                  badge: "LIVE COMMUNITY & CHAT",
                                  title: "Join the Nova Studio Discord",
                                  subtitle: "Hang out, test features, and collaborate live with 28+ online creators and engineers.",
                                  showWidgetBot: true,
                                  showLiveRoster: true,
                                }),
                                autoInviteLink: val,
                              },
                            }));
                          }}
                          className="mt-1 font-mono text-xs"
                          placeholder="https://discord.com/invite/PR2x6RGf"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Section Title</label>
                      <Input
                        value={draft.discord?.title || "Join the Nova Studio Discord"}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDraft((prev) => ({
                            ...prev,
                            discord: {
                              ...(prev.discord || {
                                enabled: true,
                                serverId: "1540761150797389915",
                                channelId: "1558058854523215985",
                                badge: "LIVE COMMUNITY & CHAT",
                                subtitle: "Hang out, test features, and collaborate live with 28+ online creators and engineers.",
                                showWidgetBot: true,
                                showLiveRoster: true,
                              }),
                              title: val,
                            },
                          }));
                        }}
                        className="mt-1 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Section Subtitle</label>
                      <Textarea
                        rows={2}
                        value={
                          draft.discord?.subtitle ||
                          "Hang out, test features, and collaborate live with 28+ online creators and engineers."
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          updateDraft((prev) => ({
                            ...prev,
                            discord: {
                              ...(prev.discord || {
                                enabled: true,
                                serverId: "1540761150797389915",
                                channelId: "1558058854523215985",
                                badge: "LIVE COMMUNITY & CHAT",
                                title: "Join the Nova Studio Discord",
                                showWidgetBot: true,
                                showLiveRoster: true,
                              }),
                              subtitle: val,
                            },
                          }));
                        }}
                        className="mt-1 text-xs"
                      />
                    </div>

                    {/* Discord Live Sync Diagnostics */}
                    <div className="rounded-xl border border-violet-500/20 bg-zinc-950/70 p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Discord API & Widget Integration
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          LIVE SYNC READY
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 space-y-1">
                        <p>
                          • Widget JSON Endpoint:{" "}
                          <span className="text-zinc-300">
                            https://discord.com/api/guilds/{draft.discord?.serverId || "1540761150797389915"}/widget.json
                          </span>
                        </p>
                        <p>
                          • WidgetBot Embed:{" "}
                          <span className="text-violet-300">
                            https://e.widgetbot.io/channels/{draft.discord?.serverId || "1540761150797389915"}/{draft.discord?.channelId || "1558058854523215985"}
                          </span>
                        </p>
                        <p>
                          • Auto-Generated Invite:{" "}
                          <span className="text-cyan-400">
                            {draft.discord?.autoInviteLink || "https://discord.com/invite/PR2x6RGf"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="stats" className="space-y-4 mt-6">
                <Card className="border-white/10 bg-zinc-900/60">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      Metrics & Impact
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Key studio achievements and numbers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {draft.stats.items.map((stat, idx) => (
                        <div key={stat.id} className="p-3 rounded-lg border border-white/5 bg-zinc-950/60 space-y-2">
                          <label className="text-xs font-semibold text-emerald-400">Stat #{idx + 1}</label>
                          <Input
                            placeholder="Value (e.g. 99.8%)"
                            value={stat.value}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDraft((prev) => ({
                                ...prev,
                                stats: {
                                  ...prev.stats,
                                  items: prev.stats.items.map((s) =>
                                    s.id === stat.id ? { ...s, value: val } : s
                                  ),
                                },
                              }));
                            }}
                            className="text-xs font-bold"
                          />
                          <Input
                            placeholder="Label (e.g. Satisfaction)"
                            value={stat.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateDraft((prev) => ({
                                ...prev,
                                stats: {
                                  ...prev.stats,
                                  items: prev.stats.items.map((s) =>
                                    s.id === stat.id ? { ...s, label: val } : s
                                  ),
                                },
                              }));
                            }}
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SECTION: CTA */}
              <TabsContent value="cta" className="space-y-4 mt-6">
                <Card className="border-white/10 bg-zinc-900/60">
                  <CardHeader>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Send className="h-4 w-4 text-violet-400" />
                      Bottom Call To Action
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Conversion banner before the footer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Badge</label>
                      <Input
                        value={draft.cta.badge}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            cta: { ...prev.cta, badge: e.target.value },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Headline</label>
                      <Input
                        value={draft.cta.headline}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            cta: { ...prev.cta, headline: e.target.value },
                          }))
                        }
                        className="mt-1 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300">Description</label>
                      <Textarea
                        rows={2}
                        value={draft.cta.description}
                        onChange={(e) =>
                          updateDraft((prev) => ({
                            ...prev,
                            cta: { ...prev.cta, description: e.target.value },
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Button Text</label>
                        <Input
                          value={draft.cta.buttonText}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              cta: { ...prev.cta, buttonText: e.target.value },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-300">Secondary Email</label>
                        <Input
                          value={draft.cta.secondaryButtonText || ""}
                          onChange={(e) =>
                            updateDraft((prev) => ({
                              ...prev,
                              cta: { ...prev.cta, secondaryButtonText: e.target.value },
                            }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* RIGHT COLUMN: Interactive Live Preview Frame */}
        {(viewMode === "split" || viewMode === "preview") && (
          <div
            className={`${
              viewMode === "split" ? "hidden lg:flex lg:w-1/2" : "w-full"
            } flex-col bg-zinc-950/80 border-l border-white/5 h-[calc(100vh-64px)] overflow-hidden`}
          >
            {/* Viewport Control Bar */}
            <div className="h-12 border-b border-white/5 bg-zinc-950 px-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Eye className="h-3.5 w-3.5 text-cyan-400" />
                <span className="font-semibold text-white">Live Preview</span>
                <span className="text-zinc-600">•</span>
                <span className="text-[11px] text-zinc-500">Updates live as you type</span>
              </div>

              {/* Device switcher */}
              <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1.5 rounded-md transition-colors ${
                    previewDevice === "desktop" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPreviewDevice("tablet")}
                  className={`p-1.5 rounded-md transition-colors ${
                    previewDevice === "tablet" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Tablet View"
                >
                  <Tablet className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1.5 rounded-md transition-colors ${
                    previewDevice === "mobile" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Viewport Canvas Frame */}
            <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-zinc-900/30">
              <div
                className={`transition-all duration-300 bg-zinc-950 rounded-2xl border border-white/10 shadow-2xl overflow-y-auto ${
                  previewDevice === "desktop"
                    ? "w-full max-w-5xl"
                    : previewDevice === "tablet"
                    ? "w-[768px] max-w-full"
                    : "w-[390px] max-w-full"
                }`}
                style={{ height: "calc(100vh - 140px)" }}
              >
                {/* Simulated Public Home Rendering */}
                <div className="min-h-full flex flex-col pointer-events-auto">
                  <AnnouncementBanner banner={draft.announcement} />
                  <Navbar
                    branding={{
                      siteTitle: "Nova Studio",
                      siteTagline: "",
                      logoText: "NOVA STUDIO",
                      logoImageUrl: "",
                      faviconUrl: "/favicon.ico",
                      primaryColor: "#7c3aed",
                      accentColor: "#06b6d4",
                      fontFamily: "Inter",
                      borderRadius: "0.5rem",
                      defaultTheme: "dark",
                    }}
                    navigation={draft.navigation}
                  />
                  <HeroSection hero={draft.hero} />
                  <CommandSection commandSection={draft.commandSection} />
                  <SocialCardsSection socialCards={draft.socialCards} discordServerId={draft.discord?.serverId} />
                  <StatsSection stats={draft.stats} />
                  <DiscordSection discord={draft.discord} />
                  <CtaSection cta={draft.cta} />
                  <FooterSection footer={draft.footer} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog: Publish Changes */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-violet-400" />
              <span>Publish Changes to Live Website?</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              This will update the live public Home page at http://localhost:3001 immediately. A new immutable revision snapshot will be created in <code className="text-white">content.db</code>.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-xs text-zinc-300 space-y-1">
            <p className="font-semibold text-white">Publish Revision Summary:</p>
            <p>• Promotes draft to live version v{(draft.version || 1) + 1}</p>
            <p>• Broadcasts WebSocket update to all connected clients</p>
            <p>• Logs audit entry in activity.db</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="studio"
              size="sm"
              disabled={publishMutation.isPending}
              onClick={() => publishMutation.mutate(draft)}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{publishMutation.isPending ? "Publishing..." : "Confirm & Publish"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Reset to Defaults */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Reset Home Page to Defaults?</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              This will overwrite your existing draft and live Home page with Nova Studio's default template. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={resetMutation.isPending}
              onClick={() => resetMutation.mutate()}
            >
              {resetMutation.isPending ? "Resetting..." : "Reset to Studio Defaults"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

