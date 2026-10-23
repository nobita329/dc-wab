"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Send,
  Boxes,
  Server,
  Hash,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  RotateCcw,
  Clock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ComponentsV2Template,
  COMPONENTS_V2_PRESET_TEMPLATES,
  PublishedBotMessage,
  DiscordGuildInfo,
  DiscordChannelInfo,
} from "@nova/shared";
import { toast } from "sonner";

export default function BotPublishPage() {
  const queryClient = useQueryClient();

  // Load guilds
  const { data: guildsData } = useQuery<{ success: boolean; guilds: DiscordGuildInfo[] }>({
    queryKey: ["botGuilds"],
    queryFn: async () => (await api.get("/api/bot/guilds")).data,
  });

  // Selected guild state
  const [selectedGuildId, setSelectedGuildId] = useState<string>("1540761150797389915");

  // Load channels for selected guild
  const { data: channelsData } = useQuery<{ success: boolean; channels: DiscordChannelInfo[] }>({
    queryKey: ["botChannels", selectedGuildId],
    queryFn: async () => (await api.get(`/api/bot/guilds/${selectedGuildId}/channels`)).data,
    enabled: Boolean(selectedGuildId),
  });

  // Selected channel state
  const [selectedChannelId, setSelectedChannelId] = useState<string>("1558058866883821674");

  // Load templates
  const { data: templatesData } = useQuery<{ success: boolean; templates: ComponentsV2Template[] }>({
    queryKey: ["botTemplates"],
    queryFn: async () => (await api.get("/api/bot/templates")).data,
  });

  const allTemplates = [
    ...COMPONENTS_V2_PRESET_TEMPLATES,
    ...(templatesData?.templates?.filter((t) => !t.isPreset) || []),
  ];

  // Selected template state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    COMPONENTS_V2_PRESET_TEMPLATES[0].id
  );

  const activeTemplate =
    allTemplates.find((t) => t.id === selectedTemplateId) || COMPONENTS_V2_PRESET_TEMPLATES[0];

  // Load published messages history
  const { data: publishedData, refetch: refetchPublished } = useQuery<{
    success: boolean;
    messages: PublishedBotMessage[];
  }>({
    queryKey: ["botPublishedMessages"],
    queryFn: async () => (await api.get("/api/bot/published?limit=50")).data,
    refetchInterval: 10000,
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (isTest: boolean = false) => {
      const res = await api.post("/api/bot/publish", {
        guildId: selectedGuildId,
        channelId: selectedChannelId,
        payload: activeTemplate.payload,
        templateId: activeTemplate.id,
        templateName: activeTemplate.name,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["botPublishedMessages"] });
      queryClient.invalidateQueries({ queryKey: ["botDashboard"] });
      if (data.isSimulated) {
        toast.success(
          `Message simulated for channel #${selectedChannelId} (ID: ${data.messageId})`
        );
      } else {
        toast.success(
          `Components V2 message successfully published to Discord! (ID: ${data.messageId})`
        );
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to publish message");
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/bot/published/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["botPublishedMessages"] });
      toast.success("Message marked as deleted");
    },
    onError: () => {
      toast.error("Failed to delete message");
    },
  });

  const publishedMessages = publishedData?.messages || [];
  const selectedGuild = guildsData?.guilds?.find((g) => g.id === selectedGuildId);
  const selectedChannel = channelsData?.channels?.find((c) => c.id === selectedChannelId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Send className="h-7 w-7 text-emerald-400" />
              Deploy & Publish Workflow
            </h1>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-xs font-mono">
              Live Discord Delivery
            </Badge>
          </div>
          <p className="text-sm text-zinc-400">
            Select an authorized guild, choose target text channel, and broadcast validated Components V2 messages.
          </p>
        </div>

        <Link href="/admin/bot/builder">
          <Button variant="outline" className="border-white/10 text-zinc-300 text-xs gap-1.5">
            <Boxes className="h-4 w-4 text-violet-400" />
            <span>Open Builder</span>
          </Button>
        </Link>
      </div>

      {/* 3-Step Publishing Stepper Card */}
      <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-white/5 bg-zinc-950/40">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            3-Step Discord Publish Pipeline
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Validated message delivery enforcing flag 32768 (IS_COMPONENTS_V2).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: Guild & Channel */}
            <div className="space-y-3 p-4 rounded-xl bg-black/30 border border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <span className="h-5 w-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">1</span>
                <span>Select Target Channel</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400">Discord Guild</label>
                <select
                  value={selectedGuildId}
                  onChange={(e) => setSelectedGuildId(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-md p-2 text-xs text-zinc-200 focus:outline-none"
                >
                  {guildsData?.guilds?.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400">Target Channel</label>
                <select
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-md p-2 text-xs text-zinc-200 focus:outline-none"
                >
                  {channelsData?.channels?.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      #{ch.name} ({ch.type === 5 ? "Announcement" : "Text"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 text-[10px] text-zinc-500 font-mono">
                Permissions: Send Messages ✓ • Embed Links ✓
              </div>
            </div>

            {/* Step 2: Choose Template */}
            <div className="space-y-3 p-4 rounded-xl bg-black/30 border border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-400">
                <span className="h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px]">2</span>
                <span>Choose Template</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400">Components V2 Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-md p-2 text-xs text-zinc-200 focus:outline-none"
                >
                  {allTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 rounded bg-zinc-900 border border-white/5 text-xs space-y-1">
                <p className="font-semibold text-white truncate">{activeTemplate.name}</p>
                <p className="text-[11px] text-zinc-400 line-clamp-2">{activeTemplate.description}</p>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Components V2 Validated (Flag 32768)</span>
              </div>
            </div>

            {/* Step 3: Broadcast & Deploy */}
            <div className="space-y-3 p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">3</span>
                  <span>Confirm & Deploy</span>
                </div>

                <div className="mt-3 p-3 rounded bg-zinc-900 border border-white/5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Server:</span>
                    <span className="text-white font-medium truncate max-w-[140px]">{selectedGuild?.name || "Selected Guild"}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Channel:</span>
                    <span className="text-violet-300 font-mono">#{selectedChannel?.name || selectedChannelId}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Top-level items:</span>
                    <span className="text-zinc-200 font-mono">{activeTemplate.payload.components?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => publishMutation.mutate(false)}
                  disabled={publishMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Send className="h-4 w-4" />
                  <span>{publishMutation.isPending ? "Broadcasting..." : "Publish to Discord Channel"}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => publishMutation.mutate(true)}
                  disabled={publishMutation.isPending}
                  className="w-full border-white/10 text-zinc-400 hover:text-white text-[11px]"
                >
                  Send Dry-Run / Test Check
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Published Messages History Table */}
      <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm">
        <CardHeader className="p-5 pb-3 border-b border-white/5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              Published Messages History
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Audit log of Components V2 messages sent to Discord with message IDs and deletion controls.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchPublished()}
            className="text-xs text-zinc-400 hover:text-white h-7 gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Refresh</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {publishedMessages.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/60 border-b border-white/5 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Message ID</th>
                    <th className="py-3 px-4">Template Title</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Published By</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {publishedMessages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                        {msg.messageId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {msg.templateName || "Components V2 Payload"}
                      </td>
                      <td className="py-3 px-4 font-mono text-violet-300">
                        #{msg.channelName || msg.channelId}
                      </td>
                      <td className="py-3 px-4">
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
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {msg.publishedBy}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {new Date(msg.publishedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {msg.status === "sent" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMessageMutation.mutate(msg.id)}
                            className="h-7 text-xs text-zinc-400 hover:text-red-400 gap-1"
                            title="Delete Message"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500 text-xs">
              No message published yet. Complete the 3 steps above to deploy your first Components V2 message!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
