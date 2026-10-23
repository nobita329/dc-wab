"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ScrollText,
  Search,
  RotateCcw,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Hash,
  MousePointerClick,
  ListFilter,
  FileText,
  Terminal,
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
import { BotInteractionLog } from "@nova/shared";

export default function BotLogsPage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inspectingLog, setInspectingLog] = useState<BotInteractionLog | null>(null);

  const { data: logsData, isLoading, refetch } = useQuery<{
    success: boolean;
    logs: BotInteractionLog[];
  }>({
    queryKey: ["botInteractionLogs", filterType, searchQuery],
    queryFn: async () => {
      let url = `/api/bot/logs?limit=100`;
      if (filterType !== "all") url += `&type=${filterType}`;
      if (searchQuery.trim()) url += `&query=${encodeURIComponent(searchQuery)}`;
      return (await api.get(url)).data;
    },
    refetchInterval: 8000,
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete("/api/bot/logs");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["botInteractionLogs"] });
      toast.success("Interaction audit logs cleared");
    },
    onError: () => {
      toast.error("Failed to clear logs");
    },
  });

  const logs = logsData?.logs || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <ScrollText className="h-7 w-7 text-amber-400" />
              Interaction Audit Logs
            </h1>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-xs font-mono">
              Live Gateway Feed
            </Badge>
          </div>
          <p className="text-sm text-zinc-400">
            Real-time audit log of Discord member button clicks, menu selections, modal submissions, and response latencies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="border-white/10 text-zinc-300 hover:text-white text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => clearMutation.mutate()}
            disabled={clearMutation.isPending || logs.length === 0}
            className="border-white/10 text-zinc-400 hover:text-red-400 text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Logs</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-white/5 bg-zinc-900/40">
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-3" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user, custom_id, or command name..."
            className="pl-9 bg-black/40 border-white/10 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Events" },
            { id: "button_click", label: "Button Clicks" },
            { id: "select_option", label: "Select Menus" },
            { id: "modal_submit", label: "Modals" },
            { id: "slash_command", label: "Commands" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === item.id
                  ? "bg-amber-500/20 text-amber-200 border border-amber-500/30 font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm">
        <CardContent className="p-0">
          {logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/60 border-b border-white/5 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Component Target / Custom ID</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono capitalize ${
                            log.type === "button_click"
                              ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                              : log.type === "select_option"
                              ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                              : log.type === "modal_submit"
                              ? "bg-violet-500/10 text-violet-300 border-violet-500/20"
                              : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                          }`}
                        >
                          {log.type.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center font-bold text-[10px] uppercase">
                            {log.username.slice(0, 1)}
                          </div>
                          <div>
                            <p className="font-semibold text-white leading-tight">{log.username}</p>
                            <p className="text-[10px] text-zinc-500 font-mono leading-tight">{log.userId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <code className="text-cyan-300 bg-black/40 px-1.5 py-0.5 rounded text-[11px]">
                          {log.customId || log.commandName || "interactive_action"}
                        </code>
                        {log.selectedValues && log.selectedValues.length > 0 && (
                          <span className="text-[10px] text-zinc-400 block mt-0.5">
                            Values: {log.selectedValues.join(", ")}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-mono">
                        #{log.channelName || log.channelId || "announcements"}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-emerald-400">
                        {log.latencyMs}ms
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectingLog(log)}
                          className="h-7 text-xs text-zinc-400 hover:text-white"
                          title="Inspect Payload"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-zinc-500 text-xs">
              No interaction logs found matching criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspect Log Modal */}
      <Dialog open={Boolean(inspectingLog)} onOpenChange={() => setInspectingLog(null)}>
        <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ScrollText className="h-5 w-5 text-amber-400" />
              Interaction Payload Inspector
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Raw interaction JSON callback from Discord Gateway.
            </DialogDescription>
          </DialogHeader>

          {inspectingLog && (
            <div className="py-2">
              <pre className="p-3 bg-black/50 border border-white/10 rounded-md text-xs font-mono text-zinc-300 overflow-auto max-h-[360px] whitespace-pre-wrap">
                {JSON.stringify(inspectingLog, null, 2)}
              </pre>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInspectingLog(null)}
              className="border-white/10 text-xs text-zinc-300"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
