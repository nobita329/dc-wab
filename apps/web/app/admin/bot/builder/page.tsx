"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Boxes,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Save,
  Send,
  Eye,
  Undo2,
  Redo2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Type,
  Split,
  Image as ImageIcon,
  MousePointerClick,
  ListFilter,
  Check,
  FolderOpen,
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
  DiscordMessagePayload,
  DiscordComponentType,
  DiscordButtonStyle,
  DiscordSeparatorSpacing,
  DISCORD_MESSAGE_FLAGS,
  COMPONENTS_V2_PRESET_TEMPLATES,
  ComponentsV2Template,
  BotSettings,
} from "@nova/shared";
import { ComponentsV2Preview } from "@/components/bot/ComponentsV2Preview";

export default function ComponentsV2BuilderPage() {
  const queryClient = useQueryClient();

  // Load bot settings for avatar and theme
  const { data: settingsData } = useQuery<{ success: boolean; settings: BotSettings }>({
    queryKey: ["botSettings"],
    queryFn: async () => (await api.get("/api/bot/settings")).data,
  });

  // Load saved templates
  const { data: templatesData } = useQuery<{ success: boolean; templates: ComponentsV2Template[] }>({
    queryKey: ["botTemplates"],
    queryFn: async () => (await api.get("/api/bot/templates")).data,
  });

  // Current message payload state
  const [payload, setPayload] = useState<DiscordMessagePayload>(
    COMPONENTS_V2_PRESET_TEMPLATES[0].payload
  );

  // History stack for undo/redo
  const [history, setHistory] = useState<DiscordMessagePayload[]>([COMPONENTS_V2_PRESET_TEMPLATES[0].payload]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Selected component index path (e.g. [0] for top-level 0, [0, 1] for child 1 in container 0)
  const [selectedPath, setSelectedPath] = useState<number[]>([0]);

  // Save template dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState<ComponentsV2Template["category"]>("custom");

  // Push new state to history
  const pushState = (newPayload: DiscordMessagePayload) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newPayload);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setPayload(newPayload);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setPayload(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setPayload(history[historyIndex + 1]);
    }
  };

  // Add top-level component
  const addTopLevelComponent = (type: DiscordComponentType) => {
    const components = [...(payload.components || [])];

    if (type === DiscordComponentType.CONTAINER) {
      components.push({
        type: DiscordComponentType.CONTAINER,
        accent_color: 0x7c3aed,
        components: [
          {
            type: DiscordComponentType.TEXT_DISPLAY,
            content: "### New Container Section\nEnter rich text here...",
          },
        ],
      });
    } else if (type === DiscordComponentType.SECTION) {
      components.push({
        type: DiscordComponentType.SECTION,
        components: [
          {
            type: DiscordComponentType.TEXT_DISPLAY,
            content: "New section content...",
          },
        ],
        accessory: {
          type: DiscordComponentType.BUTTON,
          style: DiscordButtonStyle.PRIMARY,
          label: "Action",
          custom_id: `btn_${Date.now()}`,
        },
      });
    } else if (type === DiscordComponentType.TEXT_DISPLAY) {
      components.push({
        type: DiscordComponentType.TEXT_DISPLAY,
        content: "### New Announcement\nRich text formatted with markdown.",
      });
    } else if (type === DiscordComponentType.SEPARATOR) {
      components.push({
        type: DiscordComponentType.SEPARATOR,
        divider: true,
        spacing: DiscordSeparatorSpacing.SMALL,
      });
    } else if (type === DiscordComponentType.MEDIA_GALLERY) {
      components.push({
        type: DiscordComponentType.MEDIA_GALLERY,
        items: [
          {
            media: {
              url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800",
              description: "Media item",
            },
          },
        ],
      });
    } else if (type === DiscordComponentType.ACTION_ROW) {
      components.push({
        type: DiscordComponentType.ACTION_ROW,
        components: [
          {
            type: DiscordComponentType.BUTTON,
            style: DiscordButtonStyle.PRIMARY,
            label: "Click Me",
            custom_id: `btn_${Date.now()}`,
          },
          {
            type: DiscordComponentType.BUTTON,
            style: DiscordButtonStyle.SECONDARY,
            label: "Secondary",
            custom_id: `btn_sec_${Date.now()}`,
          },
        ],
      });
    }

    const next = { ...payload, components };
    pushState(next);
    setSelectedPath([components.length - 1]);
    toast.success("Component added!");
  };

  // Delete component at path
  const deleteComponent = (path: number[]) => {
    const components = JSON.parse(JSON.stringify(payload.components || []));
    if (path.length === 1) {
      components.splice(path[0], 1);
    } else if (path.length === 2) {
      components[path[0]].components.splice(path[1], 1);
    }
    pushState({ ...payload, components });
    setSelectedPath([0]);
    toast.info("Component removed");
  };

  // Move component up/down
  const moveComponent = (index: number, direction: "up" | "down") => {
    const components = [...(payload.components || [])];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= components.length) return;

    const [item] = components.splice(index, 1);
    components.splice(targetIdx, 0, item);
    pushState({ ...payload, components });
    setSelectedPath([targetIdx]);
  };

  // Duplicate component
  const duplicateComponent = (index: number) => {
    const components = [...(payload.components || [])];
    const clone = JSON.parse(JSON.stringify(components[index]));
    components.splice(index + 1, 0, clone);
    pushState({ ...payload, components });
    setSelectedPath([index + 1]);
    toast.success("Component duplicated");
  };

  // Load a preset template
  const loadPreset = (tpl: ComponentsV2Template) => {
    pushState(tpl.payload);
    setSelectedPath([0]);
    toast.success(`Loaded "${tpl.name}" template`);
  };

  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/bot/templates", {
        name: templateName,
        description: templateDescription,
        category: templateCategory,
        payload,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["botTemplates"] });
      setShowSaveDialog(false);
      setTemplateName("");
      setTemplateDescription("");
      toast.success(`Template "${data.template.name}" saved successfully!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save template");
    },
  });

  const branding = settingsData?.settings?.branding;
  const components = payload.components || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Boxes className="h-7 w-7 text-violet-400" />
              Components V2 Builder
            </h1>
            <Badge variant="outline" className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-xs">
              Drag & Drop Visual Engine
            </Badge>
          </div>
          <p className="text-sm text-zinc-400">
            Build official Discord Components V2 messages with Containers, Sections, Galleries, Buttons, and Select Menus.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="border-white/10 text-zinc-300 text-xs gap-1"
            title="Undo"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="border-white/10 text-zinc-300 text-xs gap-1"
            title="Redo"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            className="border-white/10 text-zinc-300 hover:text-white text-xs gap-1.5"
          >
            <Save className="h-3.5 w-3.5 text-violet-400" />
            <span>Save Template</span>
          </Button>

          <Link href="/admin/bot/publish">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold gap-1.5 shadow-lg shadow-violet-600/20">
              <Send className="h-3.5 w-3.5" />
              <span>Deploy Message</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Preset Quick Loader Bar */}
      <div className="p-3 rounded-xl border border-white/5 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-zinc-400 font-medium flex items-center gap-1.5">
          <FolderOpen className="h-4 w-4 text-cyan-400" />
          Load Starter Preset:
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {COMPONENTS_V2_PRESET_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => loadPreset(tpl)}
              className="px-2.5 py-1 rounded-md bg-black/40 border border-white/5 text-zinc-300 hover:text-white hover:border-violet-500/40 transition-colors text-xs font-medium"
            >
              {tpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Workspace: Left Builder Tree, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Component Tree & Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {/* Add Component Menu */}
          <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2 border-b border-white/5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-violet-400" />
                Add Official Component
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTopLevelComponent(DiscordComponentType.CONTAINER)}
                  className="border-white/10 hover:border-violet-500/40 hover:bg-violet-600/10 justify-start gap-2 h-8 text-xs text-zinc-200"
                >
                  <Boxes className="h-3.5 w-3.5 text-violet-400" />
                  <span>Container (15)</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTopLevelComponent(DiscordComponentType.SECTION)}
                  className="border-white/10 hover:border-cyan-500/40 hover:bg-cyan-600/10 justify-start gap-2 h-8 text-xs text-zinc-200"
                >
                  <Type className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Section (9)</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTopLevelComponent(DiscordComponentType.TEXT_DISPLAY)}
                  className="border-white/10 hover:border-indigo-500/40 hover:bg-indigo-600/10 justify-start gap-2 h-8 text-xs text-zinc-200"
                >
                  <Type className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Text Display (10)</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTopLevelComponent(DiscordComponentType.ACTION_ROW)}
                  className="border-white/10 hover:border-emerald-500/40 hover:bg-emerald-600/10 justify-start gap-2 h-8 text-xs text-zinc-200"
                >
                  <MousePointerClick className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Action Row (1)</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTopLevelComponent(DiscordComponentType.MEDIA_GALLERY)}
                  className="border-white/10 hover:border-amber-500/40 hover:bg-amber-600/10 justify-start gap-2 h-8 text-xs text-zinc-200"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                  <span>Media Gallery (12)</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTopLevelComponent(DiscordComponentType.SEPARATOR)}
                  className="border-white/10 hover:border-zinc-500/40 hover:bg-white/5 justify-start gap-2 h-8 text-xs text-zinc-200"
                >
                  <Split className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Separator (14)</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Component Hierarchy Tree */}
          <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm">
            <CardHeader className="p-4 pb-2 border-b border-white/5 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Message Component Tree ({components.length})
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-zinc-400 border-white/10">
                Flag: 32768
              </Badge>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {components.map((comp, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedPath[0] === idx
                      ? "border-violet-500/50 bg-violet-950/20 shadow-sm"
                      : "border-white/5 bg-black/30 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedPath([idx])}
                      className="flex items-center gap-2 text-left font-semibold text-xs text-white truncate"
                    >
                      <Badge className="bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                        #{idx + 1}
                      </Badge>
                      <span>
                        {comp.type === DiscordComponentType.CONTAINER
                          ? "Container Box"
                          : comp.type === DiscordComponentType.SECTION
                          ? "Section & Accessory"
                          : comp.type === DiscordComponentType.ACTION_ROW
                          ? "Action Row (Buttons/Select)"
                          : comp.type === DiscordComponentType.MEDIA_GALLERY
                          ? "Media Gallery"
                          : comp.type === DiscordComponentType.SEPARATOR
                          ? "Divider / Separator"
                          : "Text Display"}
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveComponent(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                        title="Move Up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveComponent(idx, "down")}
                        disabled={idx === components.length - 1}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                        title="Move Down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => duplicateComponent(idx)}
                        className="p-1 text-zinc-400 hover:text-white"
                        title="Duplicate"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteComponent([idx])}
                        className="p-1 text-zinc-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Quick Preview of Content */}
                  <div className="mt-2 text-[11px] text-zinc-400 line-clamp-1 font-mono">
                    {comp.type === DiscordComponentType.CONTAINER
                      ? `Accent: #${comp.accent_color?.toString(16) || "7c3aed"} • Children: ${comp.components?.length || 0}`
                      : comp.type === DiscordComponentType.TEXT_DISPLAY
                      ? comp.content
                      : comp.type === DiscordComponentType.ACTION_ROW
                      ? `Components: ${comp.components?.map((c: any) => c.label || c.custom_id).join(", ")}`
                      : "Configured"}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (7 cols): Live Components V2 Preview */}
        <div className="lg:col-span-7 space-y-4 sticky top-6">
          <ComponentsV2Preview
            payload={payload}
            botName={branding?.botName || "Nova Assistant"}
            botAvatar={branding?.avatarUrl}
            defaultAccentColor={branding?.defaultAccentColor || "#7c3aed"}
          />
        </div>
      </div>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Save className="h-5 w-5 text-violet-400" />
              Save As Reusable Template
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Save your Components V2 message layout to your template library for quick deployment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Template Name</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. VIP Server Welcome & Agreement"
                className="bg-black/30 border-white/10 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Category</label>
              <select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value as any)}
                className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="welcome">Welcome & Verification</option>
                <option value="announcements">Announcements</option>
                <option value="rules">Rules & Guidelines</option>
                <option value="status">Status & Health</option>
                <option value="roles">Roles & Tags</option>
                <option value="custom">Custom / Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Description</label>
              <textarea
                rows={2}
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Brief summary of what this message contains..."
                className="w-full bg-black/30 border border-white/10 rounded-md p-2 text-xs text-zinc-200 focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveDialog(false)}
              className="text-zinc-400 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => saveTemplateMutation.mutate()}
              disabled={!templateName.trim() || saveTemplateMutation.isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
            >
              {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
