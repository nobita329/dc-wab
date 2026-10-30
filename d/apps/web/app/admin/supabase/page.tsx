"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  Radio,
  Zap,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Server,
  Code2,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminSupabasePage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<any>({
    projectUrl: "https://xyzcompany.supabase.co",
    anonKey: "",
    serviceRoleKey: "",
    dbHost: "db.xyzcompany.supabase.co",
    dbPort: "5432",
    dbName: "postgres",
    dbUser: "postgres",
    dbPassword: "",
    syncEnabled: false,
  });

  const [testResult, setTestResult] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["adminSupabase"],
    queryFn: async () => (await api.get("/api/admin/supabase")).data,
  });

  useEffect(() => {
    if (data?.config) {
      setConfig(data.config);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.put("/api/admin/supabase", payload)).data;
    },
    onSuccess: () => {
      toast.success("Supabase configuration saved successfully");
      queryClient.invalidateQueries({ queryKey: ["adminSupabase"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save Supabase settings");
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      return (
        await api.post("/api/admin/supabase/test", {
          projectUrl: config.projectUrl,
          anonKey: config.anonKey,
        })
      ).data;
    },
    onSuccess: (res) => {
      setTestResult(res);
      if (res.connected) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    },
    onError: (err: any) => {
      setTestResult({ connected: false, message: err.message });
      toast.error("Connection test failed");
    },
  });

  const handleCopyEnv = () => {
    const envString = `NEXT_PUBLIC_SUPABASE_URL="${config.projectUrl || ""}"\nNEXT_PUBLIC_SUPABASE_ANON_KEY="${config.anonKey || ""}"\nSUPABASE_SERVICE_ROLE_KEY="${config.serviceRoleKey || ""}"\nDATABASE_URL="postgresql://${config.dbUser || "postgres"}:${config.dbPassword || "password"}@${config.dbHost || "localhost"}:${config.dbPort || "5432"}/${config.dbName || "postgres"}"`;
    navigator.clipboard.writeText(envString);
    toast.success("Copied Supabase .env snippet to clipboard");
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Supabase Cloud Database Setup"
        subtitle="Configure Supabase REST endpoints, Anon/Service keys, PostgreSQL connections, and SQLite cluster sync"
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="gap-1.5 h-8 text-xs border-white/10"
            >
              <Zap className={`h-3.5 w-3.5 text-amber-400 ${testMutation.isPending ? "animate-pulse" : ""}`} />
              <span>{testMutation.isPending ? "Testing..." : "Test Connection"}</span>
            </Button>
            <Button
              size="sm"
              variant="studio"
              onClick={() => saveMutation.mutate(config)}
              disabled={saveMutation.isPending}
              className="gap-1.5 h-8 text-xs shadow-md"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saveMutation.isPending ? "Saving..." : "Save Config"}</span>
            </Button>
          </div>
        }
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
        {/* Connection Status Card */}
        <Card className="border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-emerald-950/20 backdrop-blur-md p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Database className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">Supabase Cluster Coordinator</h2>
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]"
                  >
                    Active Coordinator
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                  Hybrid persistence layer: Lightning-fast local SQLite files for 0ms reads, with Supabase PostgreSQL replication and cloud snapshots.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-white/5 flex items-center gap-2 text-xs">
                <Server className="h-3.5 w-3.5 text-cyan-400" />
                <span className="font-bold text-white">9 SQLite DBs</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-white/5 flex items-center gap-2 text-xs">
                <Radio className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-bold text-emerald-400">WAL Mode Active</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Live Test Result Banner */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              testResult.connected
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {testResult.connected ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
            {testResult.latencyMs && (
              <span className="font-mono text-[11px] bg-zinc-950/60 px-2 py-0.5 rounded">
                Latency: {testResult.latencyMs}ms
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Credentials Card */}
          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-white">Project API Credentials</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Obtained from your Supabase Dashboard &gt; Project Settings &gt; API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">Project URL</label>
                <Input
                  value={config.projectUrl || ""}
                  onChange={(e) => setConfig({ ...config, projectUrl: e.target.value })}
                  placeholder="https://yourproject.supabase.co"
                  className="bg-zinc-900 border-white/10 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">Anon Public Key (client-side)</label>
                <Input
                  type="password"
                  value={config.anonKey || ""}
                  onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="bg-zinc-900 border-white/10 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">Service Role Secret Key (server-side only)</label>
                <Input
                  type="password"
                  value={config.serviceRoleKey || ""}
                  onChange={(e) => setConfig({ ...config, serviceRoleKey: e.target.value })}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="bg-zinc-900 border-white/10 text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-white/5">
                <div>
                  <h4 className="text-xs font-semibold text-white">Enable Cloud Sync</h4>
                  <p className="text-[11px] text-zinc-400">Mirror SQLite state changes to Supabase.</p>
                </div>
                <Switch
                  checked={config.syncEnabled ?? false}
                  onCheckedChange={(checked) => setConfig({ ...config, syncEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Direct PostgreSQL Connection Card */}
          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-semibold text-white">PostgreSQL Direct URI</CardTitle>
                <CardDescription className="text-xs text-zinc-400 mt-0.5">
                  Direct database connection parameters.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={handleCopyEnv} className="gap-1.5 h-8 text-xs border-white/10">
                <Copy className="h-3.5 w-3.5" />
                <span>Copy .env</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-zinc-300 font-medium mb-1">Database Host</label>
                  <Input
                    value={config.dbHost || ""}
                    onChange={(e) => setConfig({ ...config, dbHost: e.target.value })}
                    className="bg-zinc-900 border-white/10 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Port</label>
                  <Input
                    value={config.dbPort || "5432"}
                    onChange={(e) => setConfig({ ...config, dbPort: e.target.value })}
                    className="bg-zinc-900 border-white/10 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Database Name</label>
                  <Input
                    value={config.dbName || "postgres"}
                    onChange={(e) => setConfig({ ...config, dbName: e.target.value })}
                    className="bg-zinc-900 border-white/10 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Database User</label>
                  <Input
                    value={config.dbUser || "postgres"}
                    onChange={(e) => setConfig({ ...config, dbUser: e.target.value })}
                    className="bg-zinc-900 border-white/10 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Database Password</label>
                <Input
                  type="password"
                  value={config.dbPassword || ""}
                  onChange={(e) => setConfig({ ...config, dbPassword: e.target.value })}
                  placeholder="••••••••••••"
                  className="bg-zinc-900 border-white/10 text-xs font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-white/5 font-mono text-[11px] text-zinc-400 break-all">
                postgresql://{config.dbUser || "postgres"}:••••••••@{config.dbHost || "localhost"}:{config.dbPort || "5432"}/{config.dbName || "postgres"}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

