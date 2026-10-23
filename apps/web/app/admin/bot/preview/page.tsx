"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Eye,
  Boxes,
  Send,
  FolderOpen,
  Code2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ComponentsV2Template,
  COMPONENTS_V2_PRESET_TEMPLATES,
  BotSettings,
} from "@nova/shared";
import { ComponentsV2Preview } from "@/components/bot/ComponentsV2Preview";
import { toast } from "sonner";

export default function BotPreviewPage() {
  const { data: settingsData } = useQuery<{ success: boolean; settings: BotSettings }>({
    queryKey: ["botSettings"],
    queryFn: async () => (await api.get("/api/bot/settings")).data,
  });

  const { data: templatesData } = useQuery<{ success: boolean; templates: ComponentsV2Template[] }>({
    queryKey: ["botTemplates"],
    queryFn: async () => (await api.get("/api/bot/templates")).data,
  });

  const allTemplates = [
    ...COMPONENTS_V2_PRESET_TEMPLATES,
    ...(templatesData?.templates?.filter((t) => !t.isPreset) || []),
  ];

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    COMPONENTS_V2_PRESET_TEMPLATES[0].id
  );

  const selectedTemplate =
    allTemplates.find((t) => t.id === selectedTemplateId) || COMPONENTS_V2_PRESET_TEMPLATES[0];

  const branding = settingsData?.settings?.branding;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Eye className="h-7 w-7 text-violet-400" />
              Components V2 Preview
            </h1>
            <Badge variant="outline" className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-xs font-mono">
              Approximation Canvas
            </Badge>
          </div>
          <p className="text-sm text-zinc-400">
            High-fidelity interactive Discord message preview with responsive Desktop & Mobile viewports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/bot/builder">
            <Button variant="outline" className="border-white/10 text-zinc-300 text-xs gap-1.5">
              <Boxes className="h-4 w-4 text-violet-400" />
              <span>Open in Builder</span>
            </Button>
          </Link>

          <Link href="/admin/bot/publish">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold gap-1.5 shadow-lg shadow-violet-600/20">
              <Send className="h-4 w-4" />
              <span>Deploy to Discord</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Template Selector Bar */}
      <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FolderOpen className="h-4 w-4 text-cyan-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-white">Select Preview Template</p>
            <p className="text-[11px] text-zinc-400">Choose from preset layouts or custom saved templates</p>
          </div>
        </div>

        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none min-w-[260px]"
        >
          {allTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.category})
            </option>
          ))}
        </select>
      </div>

      {/* Main Preview Stage */}
      <ComponentsV2Preview
        payload={selectedTemplate.payload}
        botName={branding?.botName || "Nova Assistant"}
        botAvatar={branding?.avatarUrl}
        defaultAccentColor={branding?.defaultAccentColor || "#7c3aed"}
      />
    </div>
  );
}
