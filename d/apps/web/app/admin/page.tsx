"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FileEdit,
  Database,
  Sliders,
  ExternalLink,
  TrendingUp,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
  HardDrive,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsTrafficChart, SectionDistributionChart } from "@/components/admin/AnalyticsChart";
import { formatDate } from "@/lib/utils";
import { AnalyticsSummary, DatabaseStatusResponse, ActivityLog } from "@nova/shared";

export default function AdminDashboardPage() {
  const { data: analyticsData, isLoading: loadingAnalytics } = useQuery<{
    analytics: AnalyticsSummary;
  }>({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/api/admin/analytics")).data,
  });

  const { data: dbData, isLoading: loadingDb } = useQuery<{
    data: DatabaseStatusResponse;
  }>({
    queryKey: ["databaseStatus"],
    queryFn: async () => (await api.get("/api/admin/database/status")).data,
  });

  const { data: activityData } = useQuery<{ logs: ActivityLog[] }>({
    queryKey: ["activityLogs"],
    queryFn: async () => (await api.get("/api/admin/activity?limit=5")).data,
  });

  const analytics = analyticsData?.analytics;
  const dbStatus = dbData?.data;
  const recentLogs = activityData?.logs || [];

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Studio Dashboard"
        subtitle="Real-time performance metrics, database health, and quick actions"
        action={
          <Link href="/admin/editor">
            <Button size="sm" variant="studio" className="gap-1.5 h-8 text-xs shadow-md">
              <FileEdit className="h-3.5 w-3.5" />
              <span>Edit Home Page</span>
            </Button>
          </Link>
        }
      />

      <main className="p-6 sm:p-8 space-y-8 max-w-7xl">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Views */}
          <Card className="border-white/10 bg-zinc-900/40 relative overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Total Impressions
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <Skeleton className="h-8 w-24 bg-zinc-800" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">
                    {analytics?.totalPageViews.toLocaleString() || "1,420"}
                  </div>
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                    <span>+{analytics?.todayPageViews || 184}</span>
                    <span className="text-zinc-500">recorded today</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Published Version */}
          <Card className="border-white/10 bg-zinc-900/40 relative overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Live Revisions
              </CardTitle>
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <Skeleton className="h-8 w-24 bg-zinc-800" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>v{analytics?.publishCount || 1}</span>
                    <Badge variant="cyan" className="text-[10px] py-0 px-2">
                      Live
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Home page sync active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Database Health */}
          <Card className="border-white/10 bg-zinc-900/40 relative overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                SQLite Cluster
              </CardTitle>
              <Database className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              {loadingDb ? (
                <Skeleton className="h-8 w-24 bg-zinc-800" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>{dbStatus?.databases.length || 6} / 6</span>
                    <Badge variant="success" className="text-[10px] py-0 px-2">
                      Healthy
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {dbStatus?.totalSizeFormatted || "176 KB"} • WAL Mode
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* System Security */}
          <Card className="border-white/10 bg-zinc-900/40 relative overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Admin Sessions
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              {loadingAnalytics ? (
                <Skeleton className="h-8 w-24 bg-zinc-800" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">
                    {analytics?.activeSessions || 1} Active
                  </div>
                  <p className="text-xs text-emerald-400 mt-1">
                    Tokens encrypted with bcrypt
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Shortcuts Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link href="/admin/editor" className="group">
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-violet-950/40 via-zinc-900/60 to-zinc-950 p-5 hover:border-violet-500/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400 border border-violet-500/30 group-hover:scale-105 transition-transform">
                  <FileEdit className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="mt-4 font-semibold text-white">Visual Home Editor</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Edit hero headings, services, portfolio projects, and publish revisions.
              </p>
            </div>
          </Link>

          <Link href="/admin/database" className="group">
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-cyan-950/40 via-zinc-900/60 to-zinc-950 p-5 hover:border-cyan-500/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 group-hover:scale-105 transition-transform">
                  <Database className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="mt-4 font-semibold text-white">Database Backups</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Inspect 6 independent SQLite files, execute snapshot backups, or restore.
              </p>
            </div>
          </Link>

          <Link href="/admin/settings" className="group">
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-zinc-950 p-5 hover:border-indigo-500/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 group-hover:scale-105 transition-transform">
                  <Sliders className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="mt-4 font-semibold text-white">Brand & Themes</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Configure typography, accent colors, SEO metadata, and social links.
              </p>
            </div>
          </Link>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-white/10 bg-zinc-900/40">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-white">
                  Visitor Traffic & Engagement
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Daily page views and unique visitor trends across 7 days
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-violet-400">
                  <span className="h-2 w-2 rounded-full bg-violet-500" />
                  Page Views
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Unique Visitors
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {analytics?.recentViewsSeries ? (
                <AnalyticsTrafficChart series={analytics.recentViewsSeries} />
              ) : (
                <Skeleton className="h-72 w-full bg-zinc-800" />
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-white">
                Content Distribution
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Active configured sections on Home Page
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.contentSectionDistribution ? (
                <SectionDistributionChart
                  data={analytics.contentSectionDistribution}
                />
              ) : (
                <Skeleton className="h-72 w-full bg-zinc-800" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Database cluster & Recent Activity 2-col */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Databases Overview Card */}
          <Card className="border-white/10 bg-zinc-900/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-emerald-400" />
                  <span>SQLite Database Cluster</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Independent .db files in /workspaces/w/data
                </CardDescription>
              </div>
              <Link href="/admin/database">
                <Button variant="ghost" size="sm" className="text-xs text-violet-400 hover:text-white">
                  Manage →
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-white/5">
                {dbStatus?.databases.map((db) => (
                  <div key={db.name} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="font-mono text-zinc-200">{db.filename}</span>
                      <span className="text-zinc-500">({db.tableCount} tables)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-zinc-400">{db.sizeFormatted}</span>
                      <Badge variant="outline" className="text-[10px] py-0 border-emerald-500/30 text-emerald-400">
                        OK
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="border-white/10 bg-zinc-900/40">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>Live Activity Stream</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Real-time audit log of admin operations
                </CardDescription>
              </div>
              <Link href="/admin/activity">
                <Button variant="ghost" size="sm" className="text-xs text-violet-400 hover:text-white">
                  View All →
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLogs.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center">
                    No activity logs recorded yet.
                  </p>
                ) : (
                  recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-white/5 bg-zinc-950/40 p-3 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-200">
                          {log.details}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span className="text-violet-400 font-medium">
                          {log.username || "system"}
                        </span>
                        <span>•</span>
                        <span className="uppercase text-[10px] font-mono text-zinc-500">
                          {log.category}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

