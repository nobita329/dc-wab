"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  CommandItem,
  CommandSettings,
  CommandPageData,
} from "@nova/shared";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Terminal,
  Search,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Save,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  Layers,
  FileCode,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const standardCategories = [
  "useful",
  "linux",
  "vps",
  "docker",
  "git",
  "networking",
  "system",
  "auto",
  "review",
  "suggestion",
];

export default function AdminCommandsPage() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<CommandItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<CommandSettings | null>(null);

  // 1. Fetch commands from command.db
  const {
    data: adminData,
    isLoading,
    refetch,
  } = useQuery<{
    success: boolean;
    data: CommandPageData;
  }>({
    queryKey: ["adminCommandData"],
    queryFn: async () => {
      const res = await api.get("/api/admin/commands");
      if (res.data?.data?.settings && !settingsForm) {
        setSettingsForm(res.data.data.settings);
      }
      return res.data;
    },
  });

  const pageData = adminData?.data;
  const currentSettings = settingsForm || pageData?.settings || {
    title: "Command Library",
    badge: "SYSTEM & DEVELOPER COMMANDS",
    subtitle:
      "Access over 190+ system, VPS, Docker, Linux, and networking commands with instant 1-click execution copying.",
  };

  const commands = pageData?.commands || [];

  // ==========================================
  // MUTATIONS
  // ==========================================

  // Save Settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: CommandSettings) => {
      const res = await api.put("/api/admin/commands/settings", settings);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Command library settings saved to command.db!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["commandPageData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save settings");
    },
  });

  // Save or Add Command (admin add Command edit set seve)
  const saveCommandMutation = useMutation({
    mutationFn: async (item: CommandItem) => {
      const res = await api.post("/api/admin/commands", item);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Command saved to command.db!");
      setIsDialogOpen(false);
      setEditingCommand(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["commandPageData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save command");
    },
  });

  // Delete Command
  const deleteCommandMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/admin/commands/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Command removed from command.db");
      setDeleteConfirmId(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["commandPageData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete command");
    },
  });

  // Import from index (2).html (or index (2).html isme se all Command list move full)
  const importHtmlMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/admin/commands/import-html", {});
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Commands imported from index (2).html!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["commandPageData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to import from HTML");
    },
  });

  // Move command up / down
  const handleMoveCommand = (idx: number, direction: "up" | "down") => {
    const items = [...commands];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[idx];
    items[idx] = items[targetIdx];
    items[targetIdx] = temp;

    const reorderedIds = items.map((i) => i.id);
    api.post("/api/admin/commands/reorder", { ids: reorderedIds }).then(() => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["commandPageData"] });
    });
  };

  const handleCopyCommand = async (cmd: CommandItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(cmd.command);
      }
      setCopiedId(cmd.id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Filter commands
  const filteredCommands = commands.filter((c) => {
    const matchesCat =
      selectedCategoryFilter === "all" ||
      c.category.toLowerCase().trim() === selectedCategoryFilter.toLowerCase().trim();
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.command.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#0a0d14] text-zinc-100 flex flex-col">
      <AdminHeader
        title="Command Library Manager"
        subtitle="Manage developer commands stored in command.db. Move and sync directly from index (2).html."
        action={
          <div className="flex items-center gap-2">
            <Link href="/commands" target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs border-white/10 text-zinc-300"
              >
                <span>Live Commands Page</span>
                <ExternalLink className="h-3 w-3 text-cyan-400" />
              </Button>
            </Link>

            <Button
              size="sm"
              onClick={() => {
                setEditingCommand({
                  id: `cmd-${Date.now()}`,
                  category: "linux",
                  title: "",
                  command: "",
                  description: "",
                  tags: [],
                  sortOrder: commands.length,
                  favorite: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setIsDialogOpen(true);
              }}
              className="gap-1.5 h-8 text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Command</span>
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* ======================================================== */}
        {/* 1. SYNC & SETTINGS HEADER BAR                            */}
        {/* ======================================================== */}
        <Card className="border-white/10 bg-zinc-900/60 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-40 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-cyan-400" />
                  <span>Command Library Settings &amp; HTML Importer</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Backed by <code className="text-white">command.db</code>. Use the importer below to sync or reload all 192 commands from <code className="text-white">index (2).html</code>.
                </CardDescription>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>command.db Connected</span>
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Page Headline
                </label>
                <Input
                  value={currentSettings.title}
                  onChange={(e) =>
                    setSettingsForm({ ...currentSettings, title: e.target.value })
                  }
                  placeholder="e.g. Command Library"
                  className="h-9 text-xs bg-black/40 border-white/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Badge Text
                </label>
                <Input
                  value={currentSettings.badge}
                  onChange={(e) =>
                    setSettingsForm({ ...currentSettings, badge: e.target.value })
                  }
                  placeholder="e.g. SYSTEM & DEVELOPER COMMANDS"
                  className="h-9 text-xs bg-black/40 border-white/10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Subtitle Description
                </label>
                <Input
                  value={currentSettings.subtitle}
                  onChange={(e) =>
                    setSettingsForm({ ...currentSettings, subtitle: e.target.value })
                  }
                  placeholder="Subtitle..."
                  className="h-9 text-xs bg-black/40 border-white/10"
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2 flex-wrap">
                {/* 1-Click Import from index (2).html */}
                <Button
                  size="sm"
                  onClick={() => importHtmlMutation.mutate()}
                  disabled={importHtmlMutation.isPending}
                  className="h-8 text-xs gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-md shadow-cyan-600/20"
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>
                    {importHtmlMutation.isPending
                      ? "Importing..."
                      : "Sync All 192 Commands from index (2).html"}
                  </span>
                </Button>

                <span className="text-[11px] text-zinc-400">
                  Total in Database: <strong className="text-white font-bold">{commands.length}</strong> commands
                </span>
              </div>

              <Button
                size="sm"
                onClick={() => saveSettingsMutation.mutate(currentSettings)}
                disabled={saveSettingsMutation.isPending}
                className="h-8 text-xs gap-1.5 bg-white text-black hover:bg-zinc-200 font-bold"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ======================================================== */}
        {/* 2. COMMANDS TABLE & EDITOR                               */}
        {/* ======================================================== */}
        <Card className="border-white/10 bg-zinc-900/60 shadow-xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-cyan-400" />
                  <span>System Commands Library ({commands.length})</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Search, reorder, edit, and delete commands. Edits save to <code className="text-white">command.db</code>.
                </CardDescription>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-full">
                  {["all", ...standardCategories].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                        selectedCategoryFilter === cat
                          ? "bg-cyan-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search commands..."
                    className="pl-8 h-8 w-44 text-xs bg-black/40 border-white/10 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-zinc-500">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading commands from command.db...</p>
              </div>
            ) : filteredCommands.length === 0 ? (
              <div className="text-center py-12 border border-white/5 rounded-2xl bg-black/30">
                <Terminal className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">No commands match your filter.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden divide-y divide-white/5">
                {filteredCommands.map((cmd, idx) => {
                  const isCopied = copiedId === cmd.id;

                  return (
                    <div
                      key={cmd.id}
                      className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Left: Info */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400 uppercase tracking-wider">
                            {cmd.category}
                          </span>
                          <h4 className="font-bold text-sm text-white truncate">
                            {cmd.title}
                          </h4>
                          {cmd.favorite && (
                            <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-bold">
                              <Flame className="h-3 w-3 fill-amber-400" />
                              <span>Essential</span>
                            </span>
                          )}
                        </div>

                        {cmd.description && (
                          <p className="text-xs text-zinc-400 truncate">
                            {cmd.description}
                          </p>
                        )}

                        {/* Command Code snippet */}
                        <div className="p-2 rounded-lg bg-zinc-950 border border-white/5 font-mono text-xs text-cyan-300 flex items-center gap-2 max-w-2xl overflow-x-auto">
                          <span className="text-zinc-500 select-none">$</span>
                          <code className="truncate">{cmd.command}</code>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveCommand(idx, "up")}
                          disabled={idx === 0}
                          className="h-8 w-8 text-zinc-400 hover:text-white"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleMoveCommand(idx, "down")}
                          disabled={idx === commands.length - 1}
                          className="h-8 w-8 text-zinc-400 hover:text-white"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleCopyCommand(cmd, e)}
                          className="h-8 px-2.5 text-xs gap-1 border-white/10"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingCommand(cmd);
                            setIsDialogOpen(true);
                          }}
                          className="h-8 px-2.5 text-xs gap-1 border-white/10 text-cyan-400"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(cmd.id)}
                          className="h-8 w-8 text-zinc-500 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* 3. ADD / EDIT COMMAND MODAL DIALOG                      */}
      {/* ======================================================== */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
            setEditingCommand(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg border-white/10 bg-zinc-950/95 backdrop-blur-2xl p-6 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="h-5 w-5 text-cyan-400" />
              <span>
                {editingCommand?.id?.startsWith("cmd-") && !editingCommand?.title
                  ? "Add New Command"
                  : "Edit Command"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Save command definition to <code className="text-white">command.db</code>.
            </DialogDescription>
          </DialogHeader>

          {editingCommand && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300">Category</label>
                  <select
                    value={editingCommand.category}
                    onChange={(e) =>
                      setEditingCommand({
                        ...editingCommand,
                        category: e.target.value.toLowerCase(),
                      })
                    }
                    className="w-full h-9 rounded-md border border-white/10 bg-zinc-900 px-3 text-xs text-white"
                  >
                    {standardCategories.map((c) => (
                      <option key={c} value={c}>
                        {c.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-300">Title</label>
                  <Input
                    value={editingCommand.title}
                    onChange={(e) =>
                      setEditingCommand({ ...editingCommand, title: e.target.value })
                    }
                    placeholder="e.g. Update System"
                    className="h-9 text-xs bg-black/40 border-white/10"
                  />
                </div>
              </div>

              {/* Command Code */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">Command String (Executable Code)</label>
                <Textarea
                  value={editingCommand.command}
                  onChange={(e) =>
                    setEditingCommand({ ...editingCommand, command: e.target.value })
                  }
                  rows={3}
                  placeholder="e.g. sudo apt update && sudo apt upgrade -y"
                  className="font-mono text-xs bg-black border-white/10 text-cyan-300"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-300">Description</label>
                <Input
                  value={editingCommand.description}
                  onChange={(e) =>
                    setEditingCommand({
                      ...editingCommand,
                      description: e.target.value,
                    })
                  }
                  placeholder="e.g. Update and upgrade all packages"
                  className="h-9 text-xs bg-black/40 border-white/10"
                />
              </div>

              {/* Favorite toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-white/5">
                <div>
                  <p className="font-semibold text-white">Mark as Essential / Useful</p>
                  <p className="text-[11px] text-zinc-400">
                    Highlights this command with an Essential badge.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingCommand({
                      ...editingCommand,
                      favorite: !editingCommand.favorite,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    editingCommand.favorite
                      ? "bg-amber-500 text-black"
                      : "bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {editingCommand.favorite ? "★ Essential" : "Standard"}
                </button>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-white/5 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setEditingCommand(null);
              }}
              className="border-white/10 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingCommand) {
                  saveCommandMutation.mutate(editingCommand);
                }
              }}
              disabled={
                saveCommandMutation.isPending ||
                !editingCommand?.title ||
                !editingCommand?.command
              }
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              <span>Save to command.db</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 4. DELETE CONFIRMATION DIALOG                            */}
      {/* ======================================================== */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-sm border-white/10 bg-zinc-950 p-6 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-rose-500" />
              <span>Delete Command</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mt-1">
              Are you sure you want to remove this command from <code className="text-white">command.db</code>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
              className="border-white/10 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (deleteConfirmId) {
                  deleteCommandMutation.mutate(deleteConfirmId);
                }
              }}
              disabled={deleteCommandMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

