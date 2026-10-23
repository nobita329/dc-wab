"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Server,
  Cpu,
  Radio,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  HardDrive,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWsStore } from "@/lib/store";

interface HealthDiagnostics {
  serverTime: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  pid: number;
  uptimeSeconds: number;
  uptimeFormatted: string;
  totalRequestsHandled: number;
  activeWsConnections: number;
  memoryUsage: {
    rssMb: string;
    heapTotalMb: string;
    heapUsedMb: string;
    externalMb: string;
  };
  databases: {
    name: string;
    filename: string;
    sizeFormatted: string;
    tables: string[];
    status: string;
    integrityOk: boolean;
  }[];
  endpoints: {
    method: string;
    path: string;
    auth: boolean;
    status: string;
  }[];
}

export default function AdminApiStatusPage() {
  const { isConnected } = useWsStore();

  const { data, isLoading, refetch } = useQuery<{
    success: boolean;
    diagnostics: HealthDiagnostics;
  }>({
    queryKey: ["apiHealthDiagnostics"],
    queryFn: async () => (await api.get("/api/admin/api-health")).data,
    refetchInterval: 5000, // auto poll every 5s
  });

  const diag = data?.diagnostics;

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="API & System Health"
        subtitle="Real-time Node.js diagnostics, memory profiles, endpoint health, and WebSocket hub"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 text-xs border-white/10 text-zinc-300 hover:text-white gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Diagnostics</span>
          </Button>
        }
      />

      <main className="p-6 sm:p-8 space-y-8 max-w-7xl">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-white/10 bg-zinc-900/40">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Service Uptime
              </CardTitle>
              <Clock className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              {isLoading || !diag ? (
                <Skeleton className="h-8 w-24 bg-zinc-800" />
              ) : (
                <>
                  <div className="text-xl font-bold font-mono text-white">
                    {diag.uptimeFormatted}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">PID: {diag.pid} • Node {diag.nodeVersion}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Memory Footprint (RSS)
              </CardTitle>
              <Cpu className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              {isLoading || !diag ? (
                <Skeleton className="h-8 w-24 bg-zinc-800" />
              ) : (
                <>
                  <div className="text-xl font-bold font-mono text-white">
                    {diag.memoryUsage.rssMb} MB
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Heap: {diag.memoryUsage.heapUsedMb} / {diag.memoryUsage.heapTotalMb} MB
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                WebSocket Hub
              </CardTitle>
              <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            </CardHeader>
            <CardContent>
              {isLoading || !diag ? (
                <Skeleton className="h-8 w-24 bg-zinc-800" />
              ) : (
                <>
                  <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
                    <span>{diag.activeWsConnections} Connected</span>
                    <Badge variant="success" className="text-[10px] py-0">
                      LIVE
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Path: /ws on port 3002
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Processed Requests
              </CardTitle>
              <Zap className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              {isLoading || !diag ? (
                <Skeleton className="h-8 w-24 bg-zinc-800" />
              ) : (
                <>
                  <div className="text-xl font-bold font-mono text-white">
                    {diag.totalRequestsHandled.toLocaleString()} reqs
                  </div>
                  <p className="text-xs text-emerald-400 mt-1">Rate limiting active (300/m)</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* REST & WebSocket Endpoints Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Server className="h-4 w-4 text-violet-400" />
              <span>Registered API Endpoints</span>
            </h3>
            <span className="text-xs text-zinc-500 font-mono">Backend Port: 3002</span>
          </div>

          <Card className="border-white/10 bg-zinc-900/40 overflow-hidden">
            <CardContent className="p-0">
              {isLoading || !diag ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-8 w-full bg-zinc-800" />
                  <Skeleton className="h-8 w-full bg-zinc-800" />
                </div>
              ) : (
                <div className="divide-y divide-white/5 text-xs font-mono">
                  {diag.endpoints.map((ep, idx) => {
                    const methodColor =
                      ep.method === "GET"
                        ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
                        : ep.method === "POST"
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : ep.method === "PUT"
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-violet-400 bg-violet-500/10 border-violet-500/20";

                    return (
                      <div
                        key={idx}
                        className="p-3.5 sm:px-6 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded border text-[11px] font-bold ${methodColor}`}
                          >
                            {ep.method}
                          </span>
                          <span className="text-white font-medium">{ep.path}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {ep.auth ? (
                            <Badge variant="outline" className="text-[10px] py-0 border-violet-500/30 text-violet-300">
                              Auth Required
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] py-0 border-white/10 text-zinc-400">
                              Public
                            </Badge>
                          )}
                          <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {ep.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

