"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  CommandItem,
  CommandPageData,
  HomePageContent,
  BrandingSettings,
  SocialLink,
} from "@nova/shared";
import { Navbar } from "@/components/home/Navbar";
import { AnnouncementBanner } from "@/components/home/AnnouncementBanner";
import { FooterSection } from "@/components/home/FooterSection";
import {
  Terminal,
  Search,
  Copy,
  Check,
  Sparkles,
  Layers,
  Code2,
  Server,
  Cpu,
  Globe,
  GitBranch,
  ShieldCheck,
  Sliders,
  Filter,
  CheckCircle2,
  LayoutGrid,
  List,
  Flame,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useWebSocket } from "@/hooks/useWebSocket";

// Category Color & Icon Mapping matching index (2).html aesthetics
const categoryStyles: Record<
  string,
  { label: string; bg: string; text: string; border: string; glow: string; icon: any }
> = {
  all: {
    label: "All Commands",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/20",
    icon: Terminal,
  },
  useful: {
    label: "Useful",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/20",
    icon: Flame,
  },
  linux: {
    label: "Linux",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    glow: "shadow-yellow-500/20",
    icon: Terminal,
  },
  vps: {
    label: "VPS",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/20",
    icon: Server,
  },
  docker: {
    label: "Docker",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/20",
    icon: Layers,
  },
  git: {
    label: "Git",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/20",
    icon: GitBranch,
  },
  networking: {
    label: "Networking",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    glow: "shadow-purple-500/20",
    icon: Globe,
  },
  system: {
    label: "System",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20",
    icon: Cpu,
  },
  auto: {
    label: "Auto",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
    glow: "shadow-indigo-500/20",
    icon: Sliders,
  },
  review: {
    label: "Review",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    glow: "shadow-rose-500/20",
    icon: ShieldCheck,
  },
  suggestion: {
    label: "Suggestion",
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    border: "border-teal-500/30",
    glow: "shadow-teal-500/20",
    icon: Sparkles,
  },
};

export default function CommandsPage() {
  // Real-time synchronization
  useWebSocket();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [activeCommand, setActiveCommand] = useState<CommandItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Home page branding for Navbar & Footer
  const { data: homeData } = useQuery<{
    success: boolean;
    content: HomePageContent;
    settings: BrandingSettings;
    socials: SocialLink[];
  }>({
    queryKey: ["homeContent"],
    queryFn: async () => (await api.get("/api/home")).data,
  });

  // Fetch live Commands from command.db
  const { data: commandApiData, isLoading } = useQuery<{
    success: boolean;
    data: CommandPageData;
  }>({
    queryKey: ["commandPageData"],
    queryFn: async () => (await api.get("/api/commands")).data,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const pageData = commandApiData?.data;
  const settings = pageData?.settings || {
    title: "Command Library",
    badge: "SYSTEM & DEVELOPER COMMANDS",
    subtitle:
      "Access over 190+ system, VPS, Docker, Linux, and networking commands with instant 1-click execution copying.",
  };

  const commands = pageData?.commands || [];

  // Filter commands by category and search
  const filteredCommands = useMemo(() => {
    return commands.filter((cmd) => {
      const catLower = cmd.category.toLowerCase().trim();
      const matchesCat =
        selectedCategory === "all" || catLower === selectedCategory.toLowerCase().trim();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cmd.title.toLowerCase().includes(q) ||
        cmd.command.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [commands, selectedCategory, searchQuery]);

  const handleCopyCommand = async (cmd: CommandItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(cmd.command);
      }
      setCopiedId(cmd.id);
      toast.success(`Copied to clipboard: "${cmd.command}"`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy command");
    }
  };

  const branding = homeData?.settings || {
    siteTitle: "Nova Studio",
    siteTagline: "",
    logoText: "NOVA STUDIO",
    logoImageUrl: "",
    faviconUrl: "/favicon.ico",
    primaryColor: "#7c3aed",
    accentColor: "#06b6d4",
    fontFamily: "Inter",
    borderRadius: "0.5rem",
    defaultTheme: "dark" as const,
  };

  const nav = homeData?.content?.navigation || [];

  const categoriesList = [
    "all",
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

  return (
    <div className="min-h-screen bg-[#0a0d14] text-zinc-100 flex flex-col selection:bg-cyan-600 selection:text-white">
      {/* Top Announcement */}
      {homeData?.content?.announcement && (
        <AnnouncementBanner banner={homeData.content.announcement} />
      )}

      {/* Navigation */}
      <Navbar branding={branding} navigation={nav} />

      {/* Hero Header */}
      <section className="relative pt-16 pb-12 sm:pt-20 sm:pb-16 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[360px] bg-gradient-to-r from-cyan-600/15 via-violet-600/15 to-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="container relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-950/60 border border-cyan-500/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 shadow-sm mb-6">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <span>{settings.badge || "SYSTEM & DEVELOPER COMMANDS"}</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Developer &amp; System{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Command Library
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            {settings.subtitle ||
              "Access over 190+ system, VPS, Docker, Linux, and networking commands with instant 1-click execution copying."}
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 text-zinc-300 font-semibold flex items-center gap-2 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{commands.length} Commands Synced</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 text-zinc-300 font-semibold flex items-center gap-2 backdrop-blur-md">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span>10 Core Categories</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 text-zinc-300 font-semibold flex items-center gap-2 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>1-Click Copy Ready</span>
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20 space-y-6">
        {/* Category Filter Pills (matching index (2).html layout) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoriesList.map((catKey) => {
            const style = categoryStyles[catKey] || categoryStyles.linux;
            const isSelected = selectedCategory.toLowerCase() === catKey;
            const count =
              catKey === "all"
                ? commands.length
                : commands.filter((c) => c.category.toLowerCase().trim() === catKey).length;

            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSelected
                    ? "bg-cyan-600 text-white border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-105"
                    : "bg-black/40 text-zinc-400 hover:text-white hover:bg-white/5 border-white/10 backdrop-blur-sm"
                }`}
              >
                <span>{style.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-black/30 text-white"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commands, syntax, keywords (e.g. docker, kill, apt)..."
              className="pl-10 h-10 bg-zinc-900/80 border-white/10 text-xs text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:border-cyan-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-medium">
              Showing <strong className="text-white font-bold">{filteredCommands.length}</strong> of {commands.length}
            </span>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === "table"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Table List View (like index (2).html)"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === "grid"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Cards Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Commands Display: Table or Grid */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl border border-white/5 bg-zinc-900/40 animate-pulse"
              />
            ))}
          </div>
        ) : filteredCommands.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl">
            <Terminal className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No commands found</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Try adjusting your category filter or search keywords.
            </p>
            <Button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              variant="outline"
              size="sm"
              className="mt-4 gap-2 border-white/10"
            >
              Reset Filters
            </Button>
          </div>
        ) : viewMode === "table" ? (
          /* ======================================================== */
          /* 1. TABLE LIST VIEW (Exact Layout from index (2).html)   */
          /* ======================================================== */
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-zinc-950/80 p-3 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-white/10">
              <div className="col-span-2 hidden sm:block">Category</div>
              <div className="col-span-4 sm:col-span-3">Title &amp; Info</div>
              <div className="col-span-6 sm:col-span-5">Command Code</div>
              <div className="col-span-2 text-right hidden sm:block">Action</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/5">
              {filteredCommands.map((cmd) => {
                const catKey = cmd.category.toLowerCase().trim();
                const style = categoryStyles[catKey] || categoryStyles.linux;
                const isCopied = copiedId === cmd.id;

                return (
                  <div
                    key={cmd.id}
                    onClick={() => setActiveCommand(cmd)}
                    className="grid grid-cols-12 items-center p-3 text-xs hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    {/* Category Badge */}
                    <div className="col-span-2 hidden sm:flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}
                      >
                        {cmd.category}
                      </span>
                    </div>

                    {/* Title & Desc */}
                    <div className="col-span-4 sm:col-span-3 pr-2 min-w-0">
                      <p className="font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {cmd.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {cmd.description || "System command"}
                      </p>
                    </div>

                    {/* Command Code Snippet with $ prefix */}
                    <div className="col-span-6 sm:col-span-5 pr-2 min-w-0">
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-zinc-950/80 border border-white/5 font-mono text-zinc-200 text-[11px] truncate group-hover:border-cyan-500/30 transition-colors">
                        <span className="text-zinc-500 select-none">$</span>
                        <code className="truncate text-cyan-300">
                          {cmd.command}
                        </code>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="col-span-2 text-right hidden sm:flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleCopyCommand(cmd, e)}
                        className={`h-8 px-3 text-xs gap-1.5 border transition-all ${
                          isCopied
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-cyan-500/40"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* 2. GRID CARDS VIEW                                      */
          /* ======================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommands.map((cmd) => {
              const catKey = cmd.category.toLowerCase().trim();
              const style = categoryStyles[catKey] || categoryStyles.linux;
              const isCopied = copiedId === cmd.id;

              return (
                <div
                  key={cmd.id}
                  onClick={() => setActiveCommand(cmd)}
                  className="rounded-2xl border border-white/10 bg-zinc-900/40 hover:bg-zinc-900/70 p-4 backdrop-blur-xl flex flex-col justify-between gap-3 group hover:border-cyan-500/30 transition-all cursor-pointer shadow-lg"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}
                      >
                        {cmd.category}
                      </span>
                      {cmd.favorite && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5 font-bold">
                          <Flame className="h-3 w-3 fill-amber-400" />
                          <span>Essential</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                        {cmd.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
                        {cmd.description}
                      </p>
                    </div>

                    {/* Monospace Command Code Block */}
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/5 font-mono text-xs text-cyan-300 flex items-start justify-between gap-2 overflow-x-auto">
                      <div className="flex items-start gap-1.5 truncate">
                        <span className="text-zinc-500 select-none">$</span>
                        <code className="truncate">{cmd.command}</code>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Click for details
                    </span>
                    <Button
                      size="sm"
                      onClick={(e) => handleCopyCommand(cmd, e)}
                      className={`h-7 px-2.5 text-xs gap-1.5 ${
                        isCopied
                          ? "bg-emerald-600 text-white"
                          : "bg-white/10 hover:bg-cyan-600 hover:text-white text-zinc-200"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Command</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Interactive Command Detail Modal */}
      <Dialog
        open={!!activeCommand}
        onOpenChange={(open) => !open && setActiveCommand(null)}
      >
        <DialogContent className="sm:max-w-lg border-white/10 bg-zinc-950/95 backdrop-blur-2xl p-6 shadow-2xl">
          {activeCommand && (() => {
            const catKey = activeCommand.category.toLowerCase().trim();
            const style = categoryStyles[catKey] || categoryStyles.linux;
            const isCopied = copiedId === activeCommand.id;

            return (
              <div className="space-y-4">
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}
                    >
                      {activeCommand.category}
                    </span>
                  </div>
                  <DialogTitle className="text-xl font-bold text-white mt-2">
                    {activeCommand.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-400">
                    {activeCommand.description || "System execution command."}
                  </DialogDescription>
                </DialogHeader>

                {/* Command Shell Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                    <span>Terminal Command:</span>
                    <span>Bash / Shell</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black border border-white/10 font-mono text-xs text-cyan-300 break-all select-all flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-zinc-500 select-none">$</span>
                      <code>{activeCommand.command}</code>
                    </div>
                  </div>
                </div>

                {/* Tags if any */}
                {activeCommand.tags && activeCommand.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {activeCommand.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Modal Actions */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveCommand(null)}
                    className="border-white/10 text-xs"
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleCopyCommand(activeCommand)}
                    className={`gap-1.5 text-xs font-bold ${
                      isCopied
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-cyan-600 hover:bg-cyan-700 text-white"
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Full Command</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <FooterSection
        footer={
          homeData?.content?.footer || {
            copyrightText: "© 2026 Nova Studio. All rights reserved.",
            description:
              "Nova Studio is an independent digital design & software engineering practice crafting world-class digital experiences.",
            columns: [],
          }
        }
        socials={homeData?.socials || []}
        logoText={branding.logoText}
      />
    </div>
  );
}

