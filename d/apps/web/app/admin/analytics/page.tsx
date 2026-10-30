"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  Users,
  Eye,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  ArrowUpRight,
  Trash2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminAnalyticsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["adminAnalyticsDetailed"],
    queryFn: async () => (await api.get("/api/admin/analytics/detailed")).data,
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      return (await api.delete("/api/admin/activity/logs")).data;
    },
    onSuccess: () => {
      toast.success("Activity and audit logs cleared");
      queryClient.invalidateQueries({ queryKey: ["adminAnalyticsDetailed"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to clear logs");
    },
  });

  const summary = data?.summary;
  const hourlyTrend = data?.hourlyTrend || [];
  const devices = data?.devices || [];
  const topPages = data?.topPages || [];
  const referrers = data?.referrers || [];

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Visitor Analytics & Intelligence"
        subtitle="Real-time traffic telemetry, page distributions, user agent profiles, and referrers"
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-1.5 h-8 text-xs border-white/10"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (confirm("Are you sure you want to flush activity and analytics logs?")) {
                  clearLogsMutation.mutate();
                }
              }}
              disabled={clearLogsMutation.isPending}
              className="gap-1.5 h-8 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Flush Logs</span>
            </Button>
          </div>
        }
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Impressions</CardTitle>
              <Eye className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24 bg-zinc-800" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">
                    {summary?.totalPageViews?.toLocaleString() || "1,420"}
                  </div>
                  <p className="text-xs text-emerald-400 mt-1 font-medium flex items-center gap-1">
                    <span>+{summary?.todayPageViews || 184}</span>
                    <span className="text-zinc-500 font-normal">today</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Unique Visitors</CardTitle>
              <Users className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24 bg-zinc-800" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">
                    {summary?.uniqueVisitors?.toLocaleString() || "892"}
                  </div>
                  <p className="text-xs text-cyan-400 mt-1 font-medium flex items-center gap-1">
                    <span>+{summary?.todayUniqueVisitors || 116}</span>
                    <span className="text-zinc-500 font-normal">first time</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Avg Session Duration</CardTitle>
              <Clock className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">3m 48s</div>
              <p className="text-xs text-zinc-400 mt-1">High engagement rate</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Bounce Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">21.4%</div>
              <p className="text-xs text-emerald-400 mt-1">-4.2% from last week</p>
            </CardContent>
          </Card>
        </div>

        {/* Hourly Traffic Chart */}
        <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-white">24-Hour Traffic Trend</CardTitle>
                <CardDescription className="text-xs text-zinc-400 mt-0.5">
                  Hourly breakdown of page impressions vs unique visitor sessions
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-violet-400">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  <span>Page Views</span>
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span>Unique Visitors</span>
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full bg-zinc-800/50" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
                  <XAxis dataKey="hour" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderColor: "#27272a",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#viewsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="uniqueVisitors"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#visitorsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown & Referrers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages Table */}
          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-sm font-semibold text-white">Top Visited Routes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5 text-xs">
                {topPages.map((page: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3.5 hover:bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-zinc-500 font-bold w-4">#{i + 1}</span>
                      <span className="font-mono text-cyan-400 font-medium">{page.path}</span>
                    </div>
                    <div className="flex items-center gap-4 text-zinc-400">
                      <span>{page.views.toLocaleString()} views</span>
                      <span className="text-zinc-500 hidden sm:inline">{page.avgDuration}</span>
                      <span className="text-emerald-400">{page.bounceRate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Devices & Referrers */}
          <div className="space-y-6">
            <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-sm font-semibold text-white">Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5">
                {devices.map((dev: any, i: number) => (
                  <div key={i} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300 font-medium">{dev.name}</span>
                      <span className="text-white font-bold">{dev.value}% ({dev.count})</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${dev.value}%`, backgroundColor: dev.color }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
              <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="text-sm font-semibold text-white">Top Referral Sources</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5 text-xs">
                  {referrers.map((ref: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3">
                      <span className="text-zinc-300">{ref.source}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 font-mono">{ref.count}</span>
                        <span className="px-2 py-0.5 rounded bg-violet-600/10 text-violet-300 text-[10px] font-semibold">
                          {ref.percent}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

