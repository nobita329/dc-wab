"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Bot,
  Boxes,
  Send,
  SlidersHorizontal,
  ScrollText,
  Activity,
  Users,
  Server,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCode2,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BotDashboardSummary, BotSettings } from "@nova/shared";

export default function BotDashboardPage() {
  const { data: dashboardData, isLoading } = useQuery<{
    success: boolean;
    summary: BotDashboardSummary;
    tokenConfigured: boolean;
  }>({
    queryKey: ["botDashboard"],
    queryFn: async () => (await api.get("/api/bot/dashboard")).data,
    refetchInterval: 10000,
  });

  const { data: settingsData } = useQuery<{
    success: boolean;
    settings: BotSettings;
  }>({
    queryKey: ["botSettings"],
    queryFn: async () => (await api.get("/api/bot/settings")).data,
  });

  const summary = dashboardData?.summary;
  const settings = settingsData?.settings;
  const tokenConfigured = dashboardData?.tokenConfigured;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Bot className="h-7 w-7 text-violet-400" />
              Bot Dashboard
            </h1>
            <Badge
              variant="outline"
              className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-xs font-mono"
            >
              Discord Components V2
            </Badge>
          </div>
          <p className="text-sm text-zinc-400">
            Real-time Discord bot status, Components V2 visual message pipeline, and interaction metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/bot/builder">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white gap-2 text-xs font-semibold shadow-lg shadow-violet-600/20">
              <Boxes className="h-4 w-4" />
              Launch Builder
            </Button>
          </Link>

          <Link href="/admin/bot/publish">
            <Button variant="outline" className="border-white/10 text-zinc-300 hover:text-white gap-2 text-xs">
              <Send className="h-4 w-4 text-cyan-400" />
              Deploy Message
            </Button>
          </Link>

          <Link href="/admin/bot/settings">
            <Button variant="outline" size="icon" className="border-white/10 text-zinc-400 hover:text-white" title="Bot Settings">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Bot Token Configuration Notice (if token is not yet in .env) */}
      {!tokenConfigured && (
        <div className="p-4 rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-zinc-900/40 to-violet-950/40 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Visual Design & Test-Lab Mode Active</h3>
              <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                You can design, build, preview, and test Components V2 interactive messages immediately. To deliver messages directly to live Discord channels, add your <code className="bg-black/40 px-1 py-0.5 rounded text-cyan-300 font-mono">DISCORD_BOT_TOKEN</code> in your environment or Bot Settings.
              </p>
            </div>
          </div>
          <Link href="/admin/bot/settings?tab=server">
            <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs shrink-0 gap-1.5">
              <span>Setup Server & Token</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}

      {/* Stat Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="border-white/5 bg-zinc-900/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Bot Status</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-xl font-bold text-white flex items-center gap-1.5">
              <span>{summary?.botStatus || "Online"}</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1 font-mono">
              Latency: {summary?.latencyMs || 24}ms
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-900/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Guilds</span>
              <Server className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {summary?.guildsCount ?? 1}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Authorized servers</p>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-900/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Members Reach</span>
              <Users className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {summary?.totalMembers ?? 248}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Community members</p>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-900/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">V2 Templates</span>
              <Boxes className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {summary?.templatesCount ?? 4}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Ready to deploy</p>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-900/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Published</span>
              <Send className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {summary?.publishedMessagesCount ?? 0}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Live messages sent</p>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-zinc-900/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Interactions</span>
              <Activity className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {summary?.recentInteractionsCount ?? 0}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Buttons & selects</p>
          </CardContent>
        </Card>
      </div>

      {/* Bot Identity & Quick Pipelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Bot Profile Card */}
        <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="h-24 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 relative p-4">
              <div className="absolute -bottom-6 left-6">
                <img
                  src={summary?.botUser?.avatarUrl || settings?.branding?.avatarUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=256"}
                  alt="Bot Avatar"
                  className="h-16 w-16 rounded-full border-4 border-zinc-950 object-cover bg-zinc-800 shadow-xl"
                />
              </div>
            </div>

            <div className="pt-8 px-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {summary?.botUser?.username || settings?.branding?.botName || "Nova Assistant"}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    {summary?.botUser?.tag || `${settings?.branding?.botName || "Nova Assistant"}#0001`}
                  </p>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/20 text-[11px]">
                  Components V2 Active
                </Badge>
              </div>

              <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                {settings?.branding?.description || "Modular Discord bot system delivering ultra-rich interactive messages, automated workflows, and high-performance server tooling."}
              </p>

              <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Activity:</span>
                  <span className="text-zinc-200 font-medium">{summary?.activity || "Playing with Discord Components V2"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Announcement Channel:</span>
                  <span className="text-violet-300 font-mono">#announcements</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Default Accent Color:</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span
                      className="h-3 w-3 rounded-full border border-white/20"
                      style={{ backgroundColor: settings?.branding?.defaultAccentColor || "#7c3aed" }}
                    />
                    <span className="text-zinc-300">{settings?.branding?.defaultAccentColor || "#7c3aed"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-white/5 bg-zinc-950/40">
            <Link href="/admin/bot/settings" className="w-full">
              <Button variant="outline" className="w-full border-white/10 text-xs text-zinc-300 hover:text-white">
                Edit Bot Profile & Branding
              </Button>
            </Link>
          </div>
        </Card>

        {/* Right: Quick Features & Pipelines Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/admin/bot/builder" className="group">
            <div className="p-5 rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-violet-500/30 transition-all h-full flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20 w-fit mb-3 group-hover:scale-105 transition-transform">
                  <Boxes className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors flex items-center gap-1.5">
                  Components V2 Builder
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Visual drag-and-drop builder for Containers, Sections, Media Galleries, Separators, Buttons, and Select Menus.
                </p>
              </div>
              <span className="text-[11px] text-violet-400 font-semibold mt-4 block">
                Open Visual Canvas →
              </span>
            </div>
          </Link>

          <Link href="/admin/bot/messages" className="group">
            <div className="p-5 rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-cyan-500/30 transition-all h-full flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 w-fit mb-3 group-hover:scale-105 transition-transform">
                  <FileCode2 className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                  Message Templates & Presets
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Browse and duplicate ready-made presets for Server Welcome, Rules, System Health Uptime, and Role Selectors.
                </p>
              </div>
              <span className="text-[11px] text-cyan-400 font-semibold mt-4 block">
                Browse Templates →
              </span>
            </div>
          </Link>

          <Link href="/admin/bot/publish" className="group">
            <div className="p-5 rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-emerald-500/30 transition-all h-full flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 w-fit mb-3 group-hover:scale-105 transition-transform">
                  <Send className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  Deploy & Publish Workflow
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Publish validated Components V2 messages with flag 32768 to permitted Discord guild channels.
                </p>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold mt-4 block">
                Publish Message →
              </span>
            </div>
          </Link>

          <Link href="/admin/bot/logs" className="group">
            <div className="p-5 rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-amber-500/30 transition-all h-full flex flex-col justify-between">
              <div>
                <div className="p-2.5 rounded-lg bg-amber-600/10 text-amber-400 border border-amber-500/20 w-fit mb-3 group-hover:scale-105 transition-transform">
                  <ScrollText className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  Interaction Audit Logs
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Inspect incoming button clicks, menu selections, modal submissions, and response latencies in real time.
                </p>
              </div>
              <span className="text-[11px] text-amber-400 font-semibold mt-4 block">
                View Interaction Logs →
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Published Messages & Live Interaction Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Published Messages */}
        <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-white/5">
            <div>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-emerald-400" />
                Recent Published Messages
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Components V2 messages broadcast to Discord channels
              </CardDescription>
            </div>
            <Link href="/admin/bot/publish">
              <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white h-7">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {summary?.recentPublished && summary.recentPublished.length > 0 ? (
              <div className="divide-y divide-white/5">
                {summary.recentPublished.map((msg) => (
                  <div key={msg.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {msg.templateName || "Components V2 Broadcast"}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        ID: {msg.messageId} • Channel: #{msg.channelName || msg.channelId}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          msg.status === "sent"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : msg.status === "deleted"
                            ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {msg.status.toUpperCase()}
                      </Badge>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {new Date(msg.publishedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No messages published yet. Build your first template and deploy it to a channel!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time Interaction Feed */}
        <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-white/5">
            <div>
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-amber-400" />
                Live Interaction Feed
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Incoming member button clicks, selects & modals
              </CardDescription>
            </div>
            <Link href="/admin/bot/logs">
              <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white h-7">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {summary?.recentInteractions && summary.recentInteractions.length > 0 ? (
              <div className="divide-y divide-white/5">
                {summary.recentInteractions.map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center text-xs font-bold uppercase">
                        {log.username.slice(0, 1)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white flex items-center gap-1.5">
                          <span>{log.username}</span>
                          <span className="text-[10px] text-zinc-400">triggered</span>
                          <code className="text-[10px] bg-black/40 px-1 py-0.2 rounded text-cyan-300 font-mono">
                            {log.customId || log.commandName}
                          </code>
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Type: {log.type} • Latency: {log.latencyMs}ms
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No interactions logged yet. Test button clicks on the Live Preview to trigger events!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
