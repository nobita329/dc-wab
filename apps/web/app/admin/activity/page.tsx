"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  FileEdit,
  Database,
  Sliders,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { ActivityLog } from "@nova/shared";

const categoryColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "cyan"> = {
  auth: "cyan",
  content: "default",
  settings: "secondary",
  database: "outline",
  system: "success",
  api: "outline",
};

export default function AdminActivityPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch } = useQuery<{ success: boolean; logs: ActivityLog[] }>({
    queryKey: ["activityLogs", selectedCategory],
    queryFn: async () => {
      const url =
        selectedCategory === "all"
          ? "/api/admin/activity?limit=100"
          : `/api/admin/activity?limit=100&category=${selectedCategory}`;
      return (await api.get(url)).data;
    },
  });

  const logs = data?.logs || [];

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.details.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.username && log.username.toLowerCase().includes(q)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Activity & Audit Logs"
        subtitle="Immutable audit trail of administrator activities, logins, and cluster events"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 text-xs border-white/10 text-zinc-300 hover:text-white gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Feed</span>
          </Button>
        }
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions, users, IPs..."
              className="pl-9 text-xs bg-zinc-900 border-white/10 text-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {["all", "auth", "content", "settings", "database", "system"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors ${
                  selectedCategory === cat
                    ? "bg-violet-600 text-white font-semibold"
                    : "bg-zinc-900/60 border border-white/5 text-zinc-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table / List */}
        <Card className="border-white/10 bg-zinc-900/40 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full bg-zinc-800" />
                <Skeleton className="h-10 w-full bg-zinc-800" />
                <Skeleton className="h-10 w-full bg-zinc-800" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <History className="h-10 w-10 text-zinc-600 mx-auto" />
                <p className="text-sm font-medium text-zinc-400">No logs found</p>
                <p className="text-xs text-zinc-500">Try adjusting your filter or search criteria.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 text-xs">
                {filteredLogs.map((log) => {
                  const isSuccess = log.status === "success";
                  const isWarning = log.status === "warning";

                  return (
                    <div
                      key={log.id}
                      className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        {isSuccess ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                        ) : isWarning ? (
                          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5 sm:mt-0" />
                        )}

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white">{log.details}</span>
                            <Badge
                              variant={categoryColors[log.category] || "secondary"}
                              className="text-[10px] py-0 px-1.5 uppercase font-mono"
                            >
                              {log.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                            <span className="text-violet-400">{log.action}</span>
                            <span>•</span>
                            <span>User: {log.username || "system"}</span>
                            {log.ipAddress && (
                              <>
                                <span>•</span>
                                <span>IP: {log.ipAddress}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-zinc-500 font-mono text-[11px] shrink-0 sm:text-right">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

