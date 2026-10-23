"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  Bot,
  Server,
  Search,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  ShieldAlert,
  ExternalLink,
  Upload,
  Copy,
  Hash,
  MessageSquare,
  Globe,
  Radio,
  Sliders,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { BotSettings, DiscordGuildInfo, DiscordChannelInfo } from "@nova/shared";

const COLOR_PRESETS = [
  { name: "Cyberpunk Violet", hex: "#7c3aed" },
  { name: "Neon Emerald", hex: "#10b981" },
  { name: "Ocean Cyan", hex: "#06b6d4" },
  { name: "Crimson Rose", hex: "#f43f5e" },
  { name: "Solar Amber", hex: "#f59e0b" },
  { name: "Obsidian Dark", hex: "#18181b" },
];

export default function BotSettingsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"branding" | "server" | "seo" | "features">(
    (tabParam as any) || "branding"
  );

  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery<{
    success: boolean;
    settings: BotSettings;
    tokenConfigured: boolean;
  }>({
    queryKey: ["botSettings"],
    queryFn: async () => (await api.get("/api/bot/settings")).data,
  });

  // Fetch guilds
  const { data: guildsData } = useQuery<{
    success: boolean;
    guilds: DiscordGuildInfo[];
  }>({
    queryKey: ["botGuilds"],
    queryFn: async () => (await api.get("/api/bot/guilds")).data,
  });

  // Fetch channels for selected guild
  const selectedGuildId = settings?.server?.selectedGuildId || "1540761150797389915";
  const { data: channelsData } = useQuery<{
    success: boolean;
    channels: DiscordChannelInfo[];
  }>({
    queryKey: ["botChannels", selectedGuildId],
    queryFn: async () => (await api.get(`/api/bot/guilds/${selectedGuildId}/channels`)).data,
    enabled: Boolean(selectedGuildId),
  });

  useEffect(() => {
    if (settingsData?.settings) {
      setSettings(settingsData.settings);
    }
  }, [settingsData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (updated: BotSettings) => {
      const res = await api.put("/api/bot/settings", updated);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["botSettings"], { success: true, settings: data.settings });
      setIsDirty(false);
      toast.success("Bot settings saved successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save bot settings");
    },
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/bot/settings/reset");
      return res.data;
    },
    onSuccess: (data) => {
      setSettings(data.settings);
      queryClient.setQueryData(["botSettings"], { success: true, settings: data.settings });
      setShowResetModal(false);
      setIsDirty(false);
      toast.success("Bot settings reset to default!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to reset settings");
    },
  });

  const handleSave = () => {
    if (settings) {
      saveMutation.mutate(settings);
    }
  };

  const updateBranding = (fields: Partial<BotSettings["branding"]>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        branding: { ...prev.branding, ...fields },
      };
    });
    setIsDirty(true);
  };

  const updateServer = (fields: Partial<BotSettings["server"]>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        server: { ...prev.server, ...fields },
      };
    });
    setIsDirty(true);
  };

  const updateSeo = (fields: Partial<BotSettings["seo"]>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        seo: { ...prev.seo, ...fields },
      };
    });
    setIsDirty(true);
  };

  const updateFeatures = (fields: Partial<BotSettings["features"]>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        features: { ...prev.features, ...fields },
      };
    });
    setIsDirty(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, SVG, WebP)");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/api/content/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.url) {
        if (target === "avatar") {
          updateBranding({ avatarUrl: res.data.url });
        } else {
          updateBranding({ bannerUrl: res.data.url });
        }
        toast.success(`${target === "avatar" ? "Avatar" : "Banner"} uploaded successfully!`);
      }
    } catch {
      toast.error("File upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="p-12 text-center text-zinc-400 text-sm">
        Loading Bot Settings...
      </div>
    );
  }

  const selectedGuild = guildsData?.guilds?.find((g) => g.id === selectedGuildId) || guildsData?.guilds?.[0];
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=1540761150797389914&permissions=534723950656&scope=bot%20applications.commands`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Save Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <SlidersHorizontal className="h-7 w-7 text-violet-400" />
            Bot Settings
          </h1>
          <p className="text-sm text-zinc-400">
            Configure Discord bot branding, server guild integrations, public SEO metadata, and Components V2 features.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResetModal(true)}
            className="border-white/10 text-zinc-400 hover:text-white text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </Button>

          <Button
            onClick={handleSave}
            disabled={!isDirty || saveMutation.isPending}
            className={`text-xs font-semibold gap-1.5 shadow-lg ${
              isDirty
                ? "bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20"
                : "bg-zinc-800 text-zinc-400 cursor-not-allowed"
            }`}
          >
            <Save className="h-3.5 w-3.5" />
            {saveMutation.isPending ? "Saving..." : isDirty ? "Save Changes" : "Saved"}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900/60 rounded-xl border border-white/5 max-w-fit select-none">
        <button
          onClick={() => setActiveTab("branding")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "branding"
              ? "bg-violet-600/20 text-violet-200 border border-violet-500/30 shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Bot className="h-3.5 w-3.5" />
          <span>Branding</span>
        </button>

        <button
          onClick={() => setActiveTab("server")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "server"
              ? "bg-violet-600/20 text-violet-200 border border-violet-500/30 shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Server className="h-3.5 w-3.5" />
          <span>Server</span>
        </button>

        <button
          onClick={() => setActiveTab("seo")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "seo"
              ? "bg-violet-600/20 text-violet-200 border border-violet-500/30 shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          <span>SEO</span>
        </button>

        <button
          onClick={() => setActiveTab("features")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "features"
              ? "bg-violet-600/20 text-violet-200 border border-violet-500/30 shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Features</span>
        </button>
      </div>

      {/* TAB 1: BRANDING */}
      {activeTab === "branding" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm">
              <CardHeader className="p-5 pb-3 border-b border-white/5">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Bot className="h-4 w-4 text-violet-400" />
                  Bot Identity & Appearance
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Customize the bot display name, avatar, banner, and default accent theme.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Bot Display Name</label>
                    <Input
                      value={settings.branding.botName}
                      onChange={(e) => updateBranding({ botName: e.target.value })}
                      placeholder="e.g. Nova Assistant"
                      className="bg-black/30 border-white/10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Tagline</label>
                    <Input
                      value={settings.branding.tagline}
                      onChange={(e) => updateBranding({ tagline: e.target.value })}
                      placeholder="e.g. Interactive Components V2 Agent"
                      className="bg-black/30 border-white/10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Description</label>
                  <textarea
                    rows={2}
                    value={settings.branding.description}
                    onChange={(e) => updateBranding({ description: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-md p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                    placeholder="Short description of bot capabilities..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Avatar Image</label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={settings.branding.avatarUrl}
                        onChange={(e) => updateBranding({ avatarUrl: e.target.value })}
                        placeholder="https://..."
                        className="bg-black/30 border-white/10 text-xs"
                      />
                      <label className="shrink-0 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "avatar")}
                          disabled={isUploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-white/10 text-zinc-300 text-xs"
                        >
                          <Upload className="h-3.5 w-3.5" />
                        </Button>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Banner Artwork URL</label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={settings.branding.bannerUrl}
                        onChange={(e) => updateBranding({ bannerUrl: e.target.value })}
                        placeholder="https://..."
                        className="bg-black/30 border-white/10 text-xs"
                      />
                      <label className="shrink-0 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "banner")}
                          disabled={isUploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-white/10 text-zinc-300 text-xs"
                        >
                          <Upload className="h-3.5 w-3.5" />
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Default Accent Color */}
                <div className="pt-2 space-y-2">
                  <label className="text-xs font-medium text-zinc-300">Default Container Accent Color</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-1.5">
                      <input
                        type="color"
                        value={settings.branding.defaultAccentColor}
                        onChange={(e) => updateBranding({ defaultAccentColor: e.target.value })}
                        className="h-6 w-6 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-mono text-zinc-300">{settings.branding.defaultAccentColor}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => updateBranding({ defaultAccentColor: preset.hex })}
                          className={`h-7 px-2.5 rounded-md text-[11px] font-medium border flex items-center gap-1.5 transition-transform active:scale-95 ${
                            settings.branding.defaultAccentColor.toLowerCase() === preset.hex.toLowerCase()
                              ? "border-white bg-white/10 text-white"
                              : "border-white/5 bg-zinc-950/40 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: preset.hex }} />
                          <span>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status & Activity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Bot Online Status</label>
                    <select
                      value={settings.branding.status}
                      onChange={(e) => updateBranding({ status: e.target.value as any })}
                      className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="online">Online (Green)</option>
                      <option value="idle">Idle (Yellow)</option>
                      <option value="dnd">Do Not Disturb (Red)</option>
                      <option value="invisible">Invisible / Offline</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Activity Type</label>
                    <select
                      value={settings.branding.activityType}
                      onChange={(e) => updateBranding({ activityType: e.target.value as any })}
                      className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-xs text-zinc-200 focus:outline-none"
                    >
                      <option value="Playing">Playing</option>
                      <option value="Streaming">Streaming</option>
                      <option value="Listening">Listening to</option>
                      <option value="Watching">Watching</option>
                      <option value="Competing">Competing in</option>
                      <option value="Custom">Custom Status</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Activity Text</label>
                    <Input
                      value={settings.branding.activityText}
                      onChange={(e) => updateBranding({ activityText: e.target.value })}
                      placeholder="e.g. with Discord Components V2"
                      className="bg-black/30 border-white/10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-medium text-zinc-300">Footer Text & Branding</label>
                  <Input
                    value={settings.branding.footerText}
                    onChange={(e) => updateBranding({ footerText: e.target.value })}
                    placeholder="e.g. Powered by Nova Studio • Components V2 Engine"
                    className="bg-black/30 border-white/10 text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Note on Website vs Discord Profile Settings */}
            <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/30 text-xs text-zinc-400 space-y-1.5">
              <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                <Radio className="h-4 w-4 text-violet-400" />
                <span>Website Branding vs. Discord API Profile</span>
              </div>
              <p className="leading-relaxed">
                Branding settings here control the web panel appearance, live visual canvas, and message footer templates. Updating your bot&apos;s real global Discord username and avatar requires owner permissions inside the{" "}
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-400 underline hover:text-violet-300 inline-flex items-center gap-0.5"
                >
                  Discord Developer Portal
                  <ExternalLink className="h-3 w-3" />
                </a>.
              </p>
            </div>
          </div>

          {/* Right Column: Live Discord Bot Profile Mockup */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Live Bot Profile Preview
            </h3>

            <div className="rounded-2xl bg-[#111214] border border-[#232428] overflow-hidden shadow-2xl">
              {/* Banner */}
              <div
                className="h-28 bg-cover bg-center relative"
                style={{
                  backgroundImage: settings.branding.bannerUrl
                    ? `url(${settings.branding.bannerUrl})`
                    : "linear-gradient(to right, #7c3aed, #4f46e5)",
                }}
              >
                <div className="absolute -bottom-8 left-4">
                  <div className="relative">
                    <img
                      src={settings.branding.avatarUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256"}
                      alt="Avatar"
                      className="h-16 w-16 rounded-full border-4 border-[#111214] object-cover bg-zinc-800"
                    />
                    <span
                      className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#111214] ${
                        settings.branding.status === "online"
                          ? "bg-[#23a55a]"
                          : settings.branding.status === "idle"
                          ? "bg-[#f0b232]"
                          : settings.branding.status === "dnd"
                          ? "bg-[#f23f43]"
                          : "bg-[#80848e]"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Profile Card Body */}
              <div className="p-4 pt-10 space-y-3 bg-[#232428]/40">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                    {settings.branding.botName || "Nova Assistant"}
                    <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 py-0.5 rounded uppercase leading-none">
                      BOT
                    </span>
                  </h4>
                  <p className="text-xs text-[#949ba4] font-mono">
                    {settings.branding.botName.toLowerCase().replace(/\s+/g, "")}#0001
                  </p>
                </div>

                <div className="p-2.5 rounded bg-[#111214] border border-white/5 space-y-1 text-xs">
                  <p className="text-[10px] uppercase font-bold text-[#b5bac1]">About Me</p>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    {settings.branding.description}
                  </p>
                  <p className="text-[11px] text-violet-400 font-semibold pt-1">
                    {settings.branding.tagline}
                  </p>
                </div>

                <div className="p-2.5 rounded bg-[#111214] border border-white/5 text-xs">
                  <p className="text-[10px] uppercase font-bold text-[#b5bac1]">Activity</p>
                  <p className="text-white text-xs font-medium flex items-center gap-1.5 mt-0.5">
                    <span>🎮</span>
                    <span>{settings.branding.activityType} {settings.branding.activityText}</span>
                  </p>
                </div>

                <div className="text-[10px] text-zinc-500 text-center font-mono pt-1">
                  {settings.branding.footerText}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVER */}
      {activeTab === "server" && (
        <div className="space-y-6">
          <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm">
            <CardHeader className="p-5 pb-3 border-b border-white/5">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-cyan-400" />
                Discord Guild & Channels Integration
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Authorize your server, map announcement channels, and configure welcome automated workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Guild Selection & Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Selected Discord Server (Guild)</label>
                  <select
                    value={settings.server.selectedGuildId}
                    onChange={(e) => updateServer({ selectedGuildId: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-md p-2.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    {guildsData?.guilds?.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} (ID: {g.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Command Prefix</label>
                  <Input
                    value={settings.server.commandPrefix}
                    onChange={(e) => updateServer({ commandPrefix: e.target.value })}
                    placeholder="!"
                    className="bg-black/30 border-white/10 text-xs w-28"
                  />
                </div>
              </div>

              {/* Active Guild Card */}
              {selectedGuild && (
                <div className="p-4 rounded-xl border border-white/10 bg-zinc-950/60 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    {selectedGuild.iconUrl ? (
                      <img
                        src={selectedGuild.iconUrl}
                        alt={selectedGuild.name}
                        className="h-12 w-12 rounded-xl object-cover border border-white/10"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center font-bold text-lg">
                        {selectedGuild.name.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{selectedGuild.name}</span>
                        {selectedGuild.owner && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                            Server Owner
                          </Badge>
                        )}
                      </h4>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        Guild ID: {selectedGuild.id} • Members: {selectedGuild.approximate_member_count || 248}
                      </p>
                    </div>
                  </div>

                  <a href={inviteUrl} target="_blank" rel="noreferrer">
                    <Button size="sm" className="bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs gap-1.5">
                      <span>Bot Invite Link</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              )}

              {/* Channels Mapping */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-violet-400" />
                    Default Announcement Channel
                  </label>
                  <select
                    value={settings.server.announcementChannelId}
                    onChange={(e) => updateServer({ announcementChannelId: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-md p-2.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    {channelsData?.channels?.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        #{ch.name} (ID: {ch.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-cyan-400" />
                    Moderation & Interaction Log Channel
                  </label>
                  <select
                    value={settings.server.logChannelId}
                    onChange={(e) => updateServer({ logChannelId: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-md p-2.5 text-xs text-zinc-200 focus:outline-none"
                  >
                    {channelsData?.channels?.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        #{ch.name} (ID: {ch.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Automated Welcome & Verification Pipeline */}
              <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Automated Welcome & Verification Pipeline
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Automatically send a Components V2 verification message when a new member joins the server.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.server.welcomeEnabled}
                    onChange={(e) => updateServer({ welcomeEnabled: e.target.checked })}
                    className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
                  />
                </div>

                {settings.server.welcomeEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">Welcome Channel</label>
                      <select
                        value={settings.server.welcomeChannelId}
                        onChange={(e) => updateServer({ welcomeChannelId: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-xs text-zinc-200 focus:outline-none"
                      >
                        {channelsData?.channels?.map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            #{ch.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-300">Linked Components V2 Template</label>
                      <select
                        value={settings.server.welcomeTemplateId || "tpl-welcome-verify"}
                        onChange={(e) => updateServer({ welcomeTemplateId: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-xs text-zinc-200 focus:outline-none"
                      >
                        <option value="tpl-welcome-verify">Server Welcome & Verification Gate</option>
                        <option value="tpl-server-status">System Status & Service Health</option>
                        <option value="tpl-role-selector">Notification & Role Assignment Menu</option>
                        <option value="tpl-product-showcase">Media Showcase & Feature Release</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Bot Permissions Audit Checklist */}
              <div className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Bot Permissions Audit Checklist
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded bg-black/30 border border-white/5 text-emerald-300">
                    <Check className="h-3.5 w-3.5" />
                    <span>Send Messages</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-black/30 border border-white/5 text-emerald-300">
                    <Check className="h-3.5 w-3.5" />
                    <span>Embed Links</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-black/30 border border-white/5 text-emerald-300">
                    <Check className="h-3.5 w-3.5" />
                    <span>Attach Files</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-black/30 border border-white/5 text-emerald-300">
                    <Check className="h-3.5 w-3.5" />
                    <span>Use Slash Commands</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: SEO */}
      {activeTab === "seo" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm">
              <CardHeader className="p-5 pb-3 border-b border-white/5">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Search className="h-4 w-4 text-emerald-400" />
                  Public Bot Page SEO & Social Graph
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Metadata and Open Graph tags for public bot discovery and invitation links.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Website & Bot Title</label>
                  <Input
                    value={settings.seo.metaTitle}
                    onChange={(e) => updateSeo({ metaTitle: e.target.value })}
                    placeholder="e.g. Nova Bot — Next-Gen Discord Components V2 Studio"
                    className="bg-black/30 border-white/10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Meta Description</label>
                  <textarea
                    rows={3}
                    value={settings.seo.metaDescription}
                    onChange={(e) => updateSeo({ metaDescription: e.target.value })}
                    placeholder="Clear description for search engines and social cards..."
                    className="w-full bg-black/30 border border-white/10 rounded-md p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Open Graph Social Title</label>
                    <Input
                      value={settings.seo.ogTitle}
                      onChange={(e) => updateSeo({ ogTitle: e.target.value })}
                      placeholder="Title on Discord & Twitter embeds"
                      className="bg-black/30 border-white/10 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Theme Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.seo.themeColor}
                        onChange={(e) => updateSeo({ themeColor: e.target.value })}
                        className="h-8 w-8 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <Input
                        value={settings.seo.themeColor}
                        onChange={(e) => updateSeo({ themeColor: e.target.value })}
                        className="bg-black/30 border-white/10 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">OG Share Image URL</label>
                  <Input
                    value={settings.seo.ogImageUrl}
                    onChange={(e) => updateSeo({ ogImageUrl: e.target.value })}
                    placeholder="https://..."
                    className="bg-black/30 border-white/10 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Robots Indexing</label>
                  <select
                    value={settings.seo.robotsIndex}
                    onChange={(e) => updateSeo({ robotsIndex: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value="index, follow">index, follow (Recommended)</option>
                    <option value="noindex, nofollow">noindex, nofollow</option>
                    <option value="noindex, follow">noindex, follow</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: SERP & Embed Previews */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Search & Social Card Previews
            </h3>

            {/* Google Search Result Preview */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono">Google SERP</span>
              <p className="text-xs text-zinc-400 truncate">https://novastudio.dev/bot</p>
              <h4 className="text-sm font-medium text-[#8ab4f8] hover:underline cursor-pointer line-clamp-1">
                {settings.seo.metaTitle}
              </h4>
              <p className="text-xs text-zinc-300 line-clamp-2">
                {settings.seo.metaDescription}
              </p>
            </div>

            {/* Discord Link Embed Preview */}
            <div className="p-4 rounded-xl bg-[#2b2d31] border-l-4 border-l-[#7c3aed] border border-[#3f4147] space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#b5bac1] font-mono">Discord Embed</span>
              <p className="text-xs font-bold text-white">{settings.seo.ogTitle || settings.seo.metaTitle}</p>
              <p className="text-xs text-[#dbdee1] line-clamp-2">{settings.seo.ogDescription || settings.seo.metaDescription}</p>
              {settings.seo.ogImageUrl && (
                <img
                  src={settings.seo.ogImageUrl}
                  alt="OG Preview"
                  className="rounded aspect-video w-full object-cover bg-zinc-900 border border-white/5"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FEATURES */}
      {activeTab === "features" && (
        <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm">
          <CardHeader className="p-5 pb-3 border-b border-white/5">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Bot Editor Features & Permission Toggles
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Enable or disable specific Discord Components V2 capabilities, builder tools, and automated pipelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="divide-y divide-white/5">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Components V2 Builder</h4>
                  <p className="text-[11px] text-zinc-400">Enable the visual drag-and-drop Discord Components V2 message designer</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.features.enableComponentsV2Builder}
                  onChange={(e) => updateFeatures({ enableComponentsV2Builder: e.target.checked })}
                  className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Preset Message Templates</h4>
                  <p className="text-[11px] text-zinc-400">Allow loading and saving reusable Components V2 templates</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.features.enableMessageTemplates}
                  onChange={(e) => updateFeatures({ enableMessageTemplates: e.target.checked })}
                  className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Interactive Buttons</h4>
                  <p className="text-[11px] text-zinc-400">Support Primary, Secondary, Success, Danger, and Link buttons</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.features.enableInteractiveButtons}
                  onChange={(e) => updateFeatures({ enableInteractiveButtons: e.target.checked })}
                  className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Select Menus</h4>
                  <p className="text-[11px] text-zinc-400">Support String, User, Role, Channel, and Mentionable Select menus</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.features.enableSelectMenus}
                  onChange={(e) => updateFeatures({ enableSelectMenus: e.target.checked })}
                  className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Modal Workflows & Text Inputs</h4>
                  <p className="text-[11px] text-zinc-400">Support interactive popup modals and text input components</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.features.enableModals}
                  onChange={(e) => updateFeatures({ enableModals: e.target.checked })}
                  className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Live Interaction Logging</h4>
                  <p className="text-[11px] text-zinc-400">Record incoming button clicks and select menu changes to the database</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.features.enableLiveInteractionLogger}
                  onChange={(e) => updateFeatures({ enableLiveInteractionLogger: e.target.checked })}
                  className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Restrict Publishing to Authorized Admins</h4>
                  <p className="text-[11px] text-zinc-400">Only authorized administrators can publish messages to Discord channels</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.features.allowGuildAdminsOnly}
                  onChange={(e) => updateFeatures({ allowGuildAdminsOnly: e.target.checked })}
                  className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Reset Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <RotateCcw className="h-5 w-5" />
              Reset Bot Settings to Default?
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              This will restore all bot branding, server preferences, and feature flags back to their factory defaults. Custom templates will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetModal(false)}
              className="text-zinc-400 text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="text-xs"
            >
              {resetMutation.isPending ? "Resetting..." : "Yes, Reset to Default"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
