"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  FileCode2,
  Boxes,
  Plus,
  Send,
  Copy,
  Trash2,
  ExternalLink,
  Download,
  Upload,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
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
import {
  ComponentsV2Template,
  COMPONENTS_V2_PRESET_TEMPLATES,
  DISCORD_MESSAGE_FLAGS,
  DiscordComponentType,
} from "@nova/shared";

export default function MessageEditorPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importName, setImportName] = useState("");

  const { data: templatesData, isLoading } = useQuery<{
    success: boolean;
    templates: ComponentsV2Template[];
  }>({
    queryKey: ["botTemplates"],
    queryFn: async () => (await api.get("/api/bot/templates")).data,
  });

  const templates = templatesData?.templates || COMPONENTS_V2_PRESET_TEMPLATES;

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    const matchesCat = selectedCategory === "all" || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/bot/templates/${id}/duplicate`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["botTemplates"] });
      toast.success(`Duplicated "${data.template.name}"!`);
    },
    onError: () => {
      toast.error("Failed to duplicate template");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/bot/templates/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["botTemplates"] });
      toast.success("Template deleted");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Cannot delete preset templates");
    },
  });

  // Import JSON mutation
  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importJson);
      const res = await api.post("/api/bot/templates", {
        name: importName || `Imported Template (${Date.now()})`,
        description: "Imported Components V2 payload",
        category: "custom",
        payload: parsed,
      });

      if (res.data?.success) {
        queryClient.invalidateQueries({ queryKey: ["botTemplates"] });
        setShowImportDialog(false);
        setImportJson("");
        setImportName("");
        toast.success("Template imported successfully!");
      }
    } catch {
      toast.error("Invalid JSON format. Please paste a valid Discord message payload.");
    }
  };

  const exportTemplateJson = (tpl: ComponentsV2Template) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tpl.payload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${tpl.name.toLowerCase().replace(/\s+/g, "-")}-components-v2.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Downloaded payload JSON");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <FileCode2 className="h-7 w-7 text-cyan-400" />
              Message Editor & Templates
            </h1>
            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-xs font-mono">
              Components V2 Library
            </Badge>
          </div>
          <p className="text-sm text-zinc-400">
            Create, duplicate, export, and manage reusable Discord interactive message templates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
            className="border-white/10 text-zinc-300 hover:text-white text-xs gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import JSON</span>
          </Button>

          <Link href="/admin/bot/builder">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold gap-1.5 shadow-lg shadow-violet-600/20">
              <Plus className="h-4 w-4" />
              <span>Create New in Builder</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-white/5 bg-zinc-900/40">
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-3" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by title, description, or tag..."
            className="pl-9 bg-black/40 border-white/10 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {["all", "welcome", "announcements", "rules", "status", "roles", "custom"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-violet-600 text-white font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => (
          <Card
            key={tpl.id}
            className="border-white/5 bg-zinc-900/40 backdrop-blur-sm flex flex-col justify-between hover:border-violet-500/30 transition-all group"
          >
            <div>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <Badge
                    variant="outline"
                    className="capitalize text-[10px] bg-black/40 border-white/10 text-zinc-300 font-mono"
                  >
                    {tpl.category}
                  </Badge>
                  {tpl.isPreset && (
                    <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[10px] font-medium">
                      Official Preset
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                  {tpl.name}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400 line-clamp-2 mt-1">
                  {tpl.description || "Components V2 interactive message template."}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-1">
                {/* Tags */}
                {tpl.tags && tpl.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    {tpl.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] text-zinc-500 font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Structure info */}
                <div className="mt-3 p-2.5 rounded bg-black/30 border border-white/5 text-[11px] text-zinc-400 font-mono flex items-center justify-between">
                  <span>Components: {tpl.payload.components?.length || 0}</span>
                  <span>Flag: {tpl.payload.flags || 32768}</span>
                </div>
              </CardContent>
            </div>

            {/* Actions Bar */}
            <div className="p-3 border-t border-white/5 bg-zinc-950/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Link href={`/admin/bot/builder`}>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-violet-300 hover:text-white gap-1" title="Edit in Builder">
                    <Boxes className="h-3 w-3" />
                    <span>Edit</span>
                  </Button>
                </Link>

                <Link href={`/admin/bot/preview`}>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-zinc-400 hover:text-white" title="Preview">
                    <Eye className="h-3 w-3" />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => duplicateMutation.mutate(tpl.id)}
                  className="h-7 px-2 text-xs text-zinc-400 hover:text-white"
                  title="Duplicate Template"
                >
                  <Copy className="h-3 w-3" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => exportTemplateJson(tpl)}
                  className="h-7 px-2 text-xs text-zinc-400 hover:text-white"
                  title="Download JSON"
                >
                  <Download className="h-3 w-3" />
                </Button>

                {!tpl.isPreset && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(tpl.id)}
                    className="h-7 px-2 text-xs text-zinc-400 hover:text-red-400"
                    title="Delete Template"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <Link href={`/admin/bot/publish`}>
                <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white h-7 px-2.5 text-xs gap-1 font-semibold">
                  <Send className="h-3 w-3 text-cyan-400" />
                  <span>Deploy</span>
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Import JSON Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Upload className="h-5 w-5 text-cyan-400" />
              Import Components V2 JSON Payload
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Paste a raw Discord message payload JSON containing Components V2 structures.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Template Title</label>
              <Input
                value={importName}
                onChange={(e) => setImportName(e.target.value)}
                placeholder="e.g. Community Rules 2026"
                className="bg-black/30 border-white/10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Raw JSON</label>
              <textarea
                rows={10}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder={`{\n  "flags": 32768,\n  "components": [\n    ...\n  ]\n}`}
                className="w-full bg-black/40 border border-white/10 rounded-md p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImportDialog(false)}
              className="text-zinc-400 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleImport}
              disabled={!importJson.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
            >
              Import Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
