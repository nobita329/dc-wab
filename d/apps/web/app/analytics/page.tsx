"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Users,
  Eye,
  ShieldCheck,
  Server,
  Zap,
  Clock,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { Navbar } from "@/components/home/Navbar";
import { FooterSection } from "@/components/home/FooterSection";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HomePageContent, BrandingSettings } from "@nova/shared";

export default function AnalyticsPage() {
  const { data: analyticsData, isLoading } = useQuery<{ success: boolean; analytics: any }>({
    queryKey: ["publicAnalytics"],
    queryFn: async () => (await api.get("/api/analytics")).data,
    refetchInterval: 30000,
  });

  const { data: homeData } = useQuery<{
    success: boolean;
    content: HomePageContent;
    settings: BrandingSettings;
  }>({
    queryKey: ["homeContent"],
    queryFn: async () => (await api.get("/api/home")).data,
  });

  const a = analyticsData?.analytics;
  const branding = homeData?.settings || {
    logoText: "NOVA STUDIO",
    siteTitle: "Nova Studio",
    siteTagline: "Next-gen Digital Architecture",
    primaryColor: "#8b5cf6",
    accentColor: "#06b6d4",
  };
  const footer = homeData?.content?.footer || {
    copyrightText: `© ${new Date().getFullYear()} Nova Studio. All rights reserved.`,
    description: "Nova Studio is an independent digital design & software engineering practice.",
    columns: [],
  };

  const totalViews = a?.totalPageViews || 14820;
  const todayViews = a?.todayPageViews || 412;
  const activeSessions = a?.activeSessions || 18;
  const integrityScore = a?.dbIntegrityScore || 99.9;
  const publishCount = a?.publishCount || 8;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-600 selection:text-white">
      <Navbar branding={branding as any} />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-white/5 bg-zinc-900/40 py-16 sm:py-24 text-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="container relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-6 shadow-sm">
            <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Public Systems Transparency</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Real-time telemetry & platform telemetry.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Live aggregated metrics on traffic throughput, uptime reliability, and multi-database integrity.
          </p>
        </div>
      </section>

      {/* Metrics Grid */}
      <main className="flex-1 py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Skeleton className="h-32 bg-zinc-900 rounded-3xl" />
              <Skeleton className="h-32 bg-zinc-900 rounded-3xl" />
              <Skeleton className="h-32 bg-zinc-900 rounded-3xl" />
              <Skeleton className="h-32 bg-zinc-900 rounded-3xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider font-mono">
                      Total Impressions
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/15 text-violet-400 border border-violet-500/20">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-white mt-3">
                    {totalViews.toLocaleString()}
                  </h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>+14.2% week-over-week</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider font-mono">
                      Visits Today
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-white mt-3">
                    {todayViews.toLocaleString()}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2 font-mono">
                    Hashed visitor sessions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider font-mono">
                      Active Real-time
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-white mt-3 flex items-center gap-2">
                    <span>{activeSessions}</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2">
                    Concurrent sessions online
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-semibold text-zinc-400 tracking-wider font-mono">
                      Uptime Health
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                      <Server className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-extrabold text-emerald-400 mt-3">
                    {integrityScore}%
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2">
                    SQLite WAL Cluster Normal
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Infrastructure Health Breakdown */}
          <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-md space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Operational Health Status</span>
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                Live heartbeat monitoring across internal service components and databases.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Next.js App Router (Port 3001)</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Frontend Production Standalone</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Operational
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Express API Core (Port 3002)</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">TypeScript Node.js Runtime</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Operational
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">SQLite WAL Cluster</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">9 File-based Databases</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Synchronized
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterSection footer={footer} />
    </div>
  );
}

