"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Terminal,
  Plus,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  ShieldCheck,
  FolderOpen,
  Boxes,
  Zap,
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
import { BotSlashCommand, ComponentsV2Template } from "@nova/shared";

export default function BotCommandsPage() {
  const queryClient = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Partial<BotSlashCommand> | null>(null);

  // Fetch slash commands
  const { data: commandsData, isLoading } = useQuery<{
    success: boolean;
    commands: BotSlashCommand[];
  }>({
    queryKey: ["botSlashCommands"],
    queryFn: async () => (await api.get("/api/bot/commands")).data,
  });

  // Fetch templates for dropdown linking
  const { data: templatesData } = useQuery<{
    success: boolean;
    templates: ComponentsV2Template[];
  }>({
    queryKey: ["botTemplates"],
    queryFn: async () => (await api.get("/api/bot/templates")).data,
  });

  const commands = commandsData?.commands || [];
  const templates = templatesData?.templates || [];

  // Upsert mutation
  const upsertMutation = useMutation({
    mutationFn: async (cmd: any) => {
      const res = await api.post("/api/bot/commands", cmd);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["botSlashCommands"] });
      setShowEditModal(false);
      setEditingCommand(null);
      toast.success(`Slash command "/${data.command.name}" saved!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save command");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/bot/commands/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["botSlashCommands"] });
      toast.success("Slash command removed");
    },
    onError: () => {
      toast.error("Failed to delete command");
    },
  });

  const openCreateModal = () => {
    setEditingCommand({
      name: "",
      description: "",
      category: "General",
      enabled: true,
      options: [],
      templateIdToTrigger: "tpl-welcome-verify",
    });
    setShowEditModal(true);
  };

  const openEditModal = (cmd: BotSlashCommand) => {
    setEditingCommand(cmd);
    setShowEditModal(true);
  };

  const handleToggleEnabled = (cmd: BotSlashCommand) => {
    upsertMutation.mutate({
      ...cmd,
      enabled: !cmd.enabled,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Terminal className="h-7 w-7 text-violet-400" />
              Discord Slash Command Settings
            </h1>
            <Badge variant="outline" className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-xs font-mono">
              Interactions API
            </Badge>
          </div>
          <p className="text-sm text-zinc-400">
            Configure Discord application slash commands that trigger automated Components V2 interactive responses.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold gap-1.5 shadow-lg shadow-violet-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Add Slash Command</span>
        </Button>
      </div>

      {/* Command List Card */}
      <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm">
        <CardHeader className="p-5 pb-3 border-b border-white/5">
          <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            Registered Application Slash Commands ({commands.length})
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Commands supported by the bot&apos;s interaction handler.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 border-b border-white/5 text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Command Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Linked V2 Template</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {commands.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      /{cmd.name}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="bg-black/30 border-white/10 text-zinc-400 text-[10px]">
                        {cmd.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-zinc-300 max-w-xs truncate">
                      {cmd.description}
                    </td>
                    <td className="py-3 px-4 text-violet-300 font-mono text-[11px]">
                      {cmd.templateIdToTrigger || "Builtin Handler"}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleEnabled(cmd)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          cmd.enabled
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${cmd.enabled ? "bg-emerald-400" : "bg-zinc-500"}`} />
                        <span>{cmd.enabled ? "ENABLED" : "DISABLED"}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(cmd)}
                          className="h-7 text-xs text-zinc-400 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(cmd.id)}
                          className="h-7 text-xs text-zinc-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit / Create Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Terminal className="h-5 w-5 text-violet-400" />
              {editingCommand?.id ? "Edit Slash Command" : "Create New Slash Command"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Configure command name, options, and linked Components V2 response payload.
            </DialogDescription>
          </DialogHeader>

          {editingCommand && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Command Name</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-zinc-500 font-mono text-xs">/</span>
                    <Input
                      value={editingCommand.name || ""}
                      onChange={(e) =>
                        setEditingCommand({
                          ...editingCommand,
                          name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                        })
                      }
                      placeholder="e.g. verify"
                      className="pl-6 bg-black/30 border-white/10 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Category</label>
                  <Input
                    value={editingCommand.category || ""}
                    onChange={(e) => setEditingCommand({ ...editingCommand, category: e.target.value })}
                    placeholder="e.g. Security"
                    className="bg-black/30 border-white/10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Description</label>
                <textarea
                  rows={2}
                  value={editingCommand.description || ""}
                  onChange={(e) => setEditingCommand({ ...editingCommand, description: e.target.value })}
                  placeholder="Explain what the command does..."
                  className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-xs text-zinc-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Trigger Components V2 Template</label>
                <select
                  value={editingCommand.templateIdToTrigger || ""}
                  onChange={(e) => setEditingCommand({ ...editingCommand, templateIdToTrigger: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-xs text-zinc-200 focus:outline-none"
                >
                  <option value="">None (Standard Text Response)</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-300 font-medium">Enable Command</span>
                <input
                  type="checkbox"
                  checked={editingCommand.enabled !== false}
                  onChange={(e) => setEditingCommand({ ...editingCommand, enabled: e.target.checked })}
                  className="h-4 w-4 rounded accent-violet-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditModal(false)}
              className="text-zinc-400 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => upsertMutation.mutate(editingCommand)}
              disabled={!editingCommand?.name?.trim() || upsertMutation.isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
            >
              {upsertMutation.isPending ? "Saving..." : "Save Command"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
