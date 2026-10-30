"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Users,
  ExternalLink,
  RefreshCw,
  Maximize2,
  Minimize2,
  Radio,
  CheckCircle2,
  Sparkles,
  Gamepad2,
} from "lucide-react";
import { DiscordSection as DiscordSectionType, DiscordWidgetData } from "@nova/shared";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DiscordSectionProps {
  discord?: DiscordSectionType;
}

export function DiscordSection({ discord }: DiscordSectionProps) {
  // If no discord config or disabled, do not render
  if (!discord || discord.enabled === false) return null;

  const serverId = discord.serverId || "1540761150797389915";
  const channelId = discord.channelId || "1558058854523215985";

  const [activeTab, setActiveTab] = useState<"roster" | "official">("roster");
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch live Discord widget data from our backend proxy
  const { data: widgetResponse, isLoading, isFetching, refetch } = useQuery<{
    success: boolean;
    data: DiscordWidgetData;
  }>({
    queryKey: ["discordWidget", serverId],
    queryFn: async () => (await api.get(`/api/discord/widget?serverId=${serverId}`)).data,
    refetchInterval: 15000, // Poll every 15s for live online member sync
  });

  const widgetData = widgetResponse?.data;
  const onlineCount = widgetData?.presence_count || widgetData?.members?.length || 28;
  const serverName = widgetData?.name || "Nova Studio";

  // Use the auto-generated real invite link from Discord widget API or fallback
  const inviteLink =
    widgetData?.instant_invite ||
    discord.autoInviteLink ||
    `https://discord.com/invite/PR2x6RGf`;

  return (
    <section id="community" className="relative py-24 sm:py-32 bg-zinc-950/80 border-t border-white/5 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[350px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[300px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          {discord.badge && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-400 mb-3 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              {discord.badge}
            </span>
          )}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            {discord.title || "Join the Nova Studio Discord"}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400">
            {discord.subtitle || "Live community chat, interactive voice lobbies, and project support in real-time."}
          </p>
        </div>

        {/* 2-Column Split: LEFT = WidgetBot, RIGHT = Discord Live Roster / Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: WidgetBot Live Discord Chat (Span 7 cols) */}
          <div
            className={`lg:col-span-7 flex flex-col rounded-2xl border border-white/10 bg-[#0c0b11] shadow-2xl overflow-hidden transition-all duration-300 ${
              isFullscreen ? "fixed inset-4 z-50 rounded-2xl border-violet-500/40 bg-zinc-950" : ""
            }`}
          >
            {/* WidgetBot Header */}
            <div className="h-14 px-4 bg-zinc-900/80 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/20">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-wide">
                    WidgetBot Live Discord Chat
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Channel
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Reload Live Chat"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <a
                  href={`https://discord.com/channels/${serverId}/${channelId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Open in Discord"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* WidgetBot Iframe Container */}
            <div className={`w-full bg-[#1e1f22] relative ${isFullscreen ? "h-[calc(100vh-120px)]" : "h-[540px]"}`}>
              <iframe
                key={iframeKey}
                src={`https://e.widgetbot.io/channels/${serverId}/${channelId}`}
                title="WidgetBot Discord Chat"
                className="w-full h-full border-0"
                allow="clipboard-write"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              />
            </div>

            {/* WidgetBot Footer Metadata */}
            <div className="h-9 px-4 bg-zinc-950 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span className="truncate">
                Server ID: <span className="text-zinc-300 font-semibold">{serverId}</span>
              </span>
              <span className="truncate">
                Channel: <span className="text-violet-400 font-semibold">{channelId}</span>
              </span>
            </div>
          </div>

          {/* RIGHT: Live Roster & Discord Server Card (Span 5 cols) */}
          <div className="lg:col-span-5 flex flex-col rounded-2xl border border-white/10 bg-[#0e0d15] shadow-2xl overflow-hidden">
            {/* Discord Header Banner with Blurple Gradient */}
            <div className="p-6 bg-gradient-to-r from-[#5865F2] to-[#4752C4] text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md shadow-inner">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide leading-tight">
                    {serverName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-white/90">
                      {onlineCount} Members Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Join & Refresh Actions */}
              <div className="flex items-center gap-2">
                <a
                  href={inviteLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#4752C4] font-bold text-xs shadow-md hover:bg-zinc-100 transition-all hover:scale-105 active:scale-95"
                >
                  <span>Join</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => refetch()}
                  className="p-2 rounded-xl bg-black/20 text-white hover:bg-black/30 transition-colors"
                  title="Refresh Live Roster"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Subheader Navigation Bar (Tabs & Real-time Sync Badge) */}
            <div className="px-5 py-3 border-b border-white/5 bg-zinc-950/70 flex items-center justify-between">
              <div className="flex items-center bg-zinc-900/90 border border-white/10 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("roster")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "roster"
                      ? "bg-violet-600 text-white shadow-sm font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Live Roster ({onlineCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("official")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "official"
                      ? "bg-violet-600 text-white shadow-sm font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Official Widget
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
                <Radio className="h-3 w-3 animate-pulse" />
                <span className="hidden sm:inline">Real-time Sync</span>
              </div>
            </div>

            {/* Content Area */}
            {activeTab === "roster" ? (
              <div className="flex flex-col h-[480px]">
                <div className="px-5 py-3 text-[11px] font-bold tracking-wider uppercase text-zinc-500 border-b border-white/5">
                  Members Online ({widgetData?.members?.length || onlineCount})
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2">
                  {isLoading && !widgetData ? (
                    <div className="p-8 text-center text-xs text-zinc-500 space-y-2">
                      <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent animate-spin rounded-full mx-auto" />
                      <p>Connecting to Discord Guild API...</p>
                    </div>
                  ) : widgetData?.members && widgetData.members.length > 0 ? (
                    widgetData.members.map((member, idx) => {
                      const isIdle = member.status === "idle";
                      const isDnd = member.status === "dnd";
                      const statusColor = isIdle ? "bg-amber-400" : isDnd ? "bg-red-500" : "bg-emerald-400";
                      const statusLabel = isIdle ? "IDLE" : isDnd ? "DND" : "ONLINE";

                      return (
                        <div
                          key={member.id || idx}
                          className="px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 truncate">
                            {/* Avatar with Status Dot */}
                            <div className="relative shrink-0">
                              <img
                                src={member.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png"}
                                alt={member.username}
                                className="h-9 w-9 rounded-full object-cover bg-zinc-800 border border-white/10"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://cdn.discordapp.com/embed/avatars/0.png";
                                }}
                              />
                              <span
                                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-950 ${statusColor}`}
                              />
                            </div>

                            {/* Name & Custom Status */}
                            <div className="truncate">
                              <p className="text-sm font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
                                {member.username}
                              </p>
                              {member.game && (
                                <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1 font-sans">
                                  <Gamepad2 className="h-3 w-3 text-violet-400 shrink-0" />
                                  <span className="truncate">{member.game.name}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-400 shrink-0">
                            {statusLabel}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-zinc-500">
                      No members currently reporting presence.
                    </div>
                  )}
                </div>

                {/* Footer Join Bar */}
                <div className="p-4 border-t border-white/5 bg-zinc-950/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    Auto-Invite: <span className="font-mono text-cyan-400 font-semibold">{inviteLink}</span>
                  </span>
                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    <span>Connect Now</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ) : (
              /* TAB 2: Official Discord Widget Embed */
              <div className="h-[480px] w-full bg-[#2f3136] p-2">
                <iframe
                  src={`https://discord.com/widget?id=${serverId}&theme=dark`}
                  width="100%"
                  height="100%"
                  allowTransparency={true}
                  frameBorder="0"
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                  className="rounded-xl border border-white/10"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

