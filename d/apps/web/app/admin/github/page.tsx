"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Github,
  GitBranch,
  Star,
  GitFork,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Globe,
  Search,
  Filter,
  ArrowUpDown,
  BookOpen,
  GitCommit,
  Tag,
  KeyRound,
  Eye,
  EyeOff,
  Clock,
  Code2,
  Radio,
  FileCode,
  ShieldAlert,
  Unplug,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { GitHubRepository, GitHubDashboardStats } from "@nova/shared";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3572A5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  Shell: "#89e051",
  PHP: "#4F5D95",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Dart: "#00B4AB",
};

export default function AdminGitHubPage() {
  const queryClient = useQueryClient();

  // Search, Filter, Sort state
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<"all" | "public" | "private">("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"stars" | "updated" | "forks" | "name">("stars");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Auth form state
  const [usernameInput, setUsernameInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [autoSyncToggle, setAutoSyncToggle] = useState(true);

  // Inspector modal state
  const [inspectingRepo, setInspectingRepo] = useState<{ owner: string; name: string } | null>(null);

  // 1. Status & Auth info query
  const {
    data: statusData,
    isLoading: isStatusLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["adminGithubStatus"],
    queryFn: async () => {
      const res = await api.get("/api/admin/github/status");
      return res.data;
    },
  });

  const config = statusData?.config;
  const stats: GitHubDashboardStats | undefined = statusData?.stats;
  const isConnected = !!(config?.username || config?.hasToken);

  // 2. Repositories query with search/filter/sort
  const {
    data: reposData,
    isLoading: isReposLoading,
    refetch: refetchRepos,
    isRefetching: isReposRefetching,
  } = useQuery({
    queryKey: [
      "adminGithubRepos",
      search,
      visibility,
      selectedLanguage,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (visibility !== "all") params.append("visibility", visibility);
      if (selectedLanguage !== "all") params.append("language", selectedLanguage);
      params.append("sortBy", sortBy);
      params.append("order", sortOrder);
      params.append("limit", "100");

      const res = await api.get(`/api/admin/github/repos?${params.toString()}`);
      return res.data;
    },
  });

  // 3. Inspect deep repository details query
  const {
    data: inspectData,
    isLoading: isInspectLoading,
  } = useQuery({
    queryKey: ["adminGithubInspect", inspectingRepo?.owner, inspectingRepo?.name],
    queryFn: async () => {
      if (!inspectingRepo) return null;
      const res = await api.get(`/api/admin/github/repos/${inspectingRepo.owner}/${inspectingRepo.name}`);
      return res.data?.repository as GitHubRepository;
    },
    enabled: !!inspectingRepo,
  });

  // Mutations
  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/admin/github/test", {
        username: usernameInput || config?.username,
        token: tokenInput || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.valid) {
        toast.success(`Connection verified! Found GitHub account @${data.user?.login || "user"}`);
      } else {
        toast.error(data.error || "GitHub validation failed");
      }
      refetchStatus();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Connection test failed");
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/admin/github/connect", {
        username: usernameInput || config?.username,
        token: tokenInput || undefined,
        autoSync: autoSyncToggle,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Connected to GitHub & auto-detected repositories!");
      setTokenInput("");
      refetchStatus();
      refetchRepos();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to connect to GitHub");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/admin/github/disconnect");
      return res.data;
    },
    onSuccess: () => {
      toast.info("GitHub credentials removed safely.");
      setUsernameInput("");
      setTokenInput("");
      refetchStatus();
      refetchRepos();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Disconnect failed");
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/admin/github/sync");
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Repositories synchronized successfully!");
      refetchStatus();
      refetchRepos();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Sync failed");
    },
  });

  // Available languages list from returned repos
  const repositories: GitHubRepository[] = reposData?.repositories || [];
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    repositories.forEach((r) => {
      if (r.language) set.add(r.language);
    });
    return Array.from(set).sort();
  }, [repositories]);

  // Rate limit calculations
  const rateLimit = config?.rateLimit;
  const ratePercent = rateLimit?.limit
    ? Math.round((rateLimit.remaining / rateLimit.limit) * 100)
    : 100;
  const rateColor =
    ratePercent > 50
      ? "bg-emerald-500"
      : ratePercent > 20
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top Admin Header */}
      <AdminHeader
        title="GitHub Auto Detect & Repository Management"
        subtitle="Automatic repository discovery, encrypted token storage, private/public synchronization, and deep inspection"
        action={
          <div className="flex items-center gap-2">
            {config?.userHtmlUrl && (
              <a
                href={config.userHtmlUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs border-white/10 hover:border-white/20 text-zinc-300 hover:text-white"
                >
                  <Github className="h-3.5 w-3.5" />
                  <span>@{config.username || "github"}</span>
                  <ExternalLink className="h-3 w-3 text-zinc-500" />
                </Button>
              </a>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || isReposRefetching}
              className="gap-1.5 h-8 text-xs border-white/10 hover:border-violet-500/40 text-zinc-300 hover:text-white"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  syncMutation.isPending || isReposRefetching ? "animate-spin" : ""
                }`}
              />
              <span>
                {syncMutation.isPending
                  ? "Syncing Repositories..."
                  : "Manual Sync"}
              </span>
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl">
        {/* KPI Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-xl">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase text-zinc-400">Total Repos</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-white font-mono">
                  {stats?.totalRepos ?? repositories.length}
                </span>
                <Github className="h-4 w-4 text-violet-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-xl">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase text-emerald-400">Public Repos</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-white font-mono">
                  {stats?.publicRepos ?? 0}
                </span>
                <Globe className="h-4 w-4 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-xl">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase text-amber-400">Private Repos</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-white font-mono">
                  {stats?.privateRepos ?? 0}
                </span>
                <Lock className="h-4 w-4 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-xl">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase text-yellow-400">Total Stars</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-white font-mono">
                  {stats?.totalStars ?? 0}
                </span>
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-xl">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase text-cyan-400">Total Forks</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-bold text-white font-mono">
                  {stats?.totalForks ?? 0}
                </span>
                <GitFork className="h-4 w-4 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/60 backdrop-blur-xl">
            <CardContent className="p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold uppercase text-violet-400">Last Synced</span>
              <div className="mt-2 truncate">
                <span className="text-xs font-mono text-zinc-300">
                  {config?.lastSyncedAt
                    ? new Date(config.lastSyncedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Not yet"}
                </span>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                  {stats?.recentlyUpdated?.name || "Auto sync ready"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Authentication, Personal Access Token & Rate Limit Box */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* GitHub Connection Configuration */}
          <Card className="lg:col-span-2 border-white/10 bg-zinc-900/50 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-white">
                      GitHub Authentication & Auto Detection
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Configure your Personal Access Token (PAT) to auto-detect both public and private repositories.
                    </CardDescription>
                  </div>
                </div>

                {/* Connection Status Badge */}
                <Badge
                  variant="outline"
                  className={`text-xs px-2.5 py-1 font-mono flex items-center gap-1.5 ${
                    isConnected
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isConnected ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                    }`}
                  />
                  <span>{isConnected ? "Connected" : "Disconnected"}</span>
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username Input */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    GitHub Username or Organization
                  </label>
                  <Input
                    placeholder={config?.username || "e.g. nobita329 or octocat"}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 text-xs font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Current user: <strong className="text-zinc-300">{config?.username || "Not configured"}</strong>
                  </span>
                </div>

                {/* Personal Access Token Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Personal Access Token (PAT)
                    </label>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo,read:org,user"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                    >
                      <span>Create Token</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>

                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      placeholder={
                        config?.maskedToken
                          ? config.maskedToken
                          : "ghp_xxxxxxxxxxxxxxxxxxxx"
                      }
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="bg-zinc-950/70 border-white/10 text-white placeholder:text-zinc-600 text-xs font-mono pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-200"
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-zinc-500">
                      Status:{" "}
                      {config?.hasToken ? (
                        <span className="text-emerald-400 font-mono">
                          AES-256 Encrypted ({config.maskedToken})
                        </span>
                      ) : (
                        <span className="text-zinc-500">No token saved</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons & scopes info */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Switch
                    checked={autoSyncToggle}
                    onCheckedChange={setAutoSyncToggle}
                    id="auto-sync"
                  />
                  <label htmlFor="auto-sync" className="cursor-pointer select-none">
                    Automatic synchronization (Hourly)
                  </label>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testMutation.mutate()}
                    disabled={testMutation.isPending}
                    className="border-white/10 text-xs h-9 flex-1 sm:flex-none gap-1.5"
                  >
                    <Zap className={`h-3.5 w-3.5 ${testMutation.isPending ? "animate-pulse" : ""}`} />
                    <span>{testMutation.isPending ? "Testing..." : "Test Connection"}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="studio"
                    onClick={() => connectMutation.mutate()}
                    disabled={connectMutation.isPending}
                    className="text-xs h-9 flex-1 sm:flex-none gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                      {connectMutation.isPending
                        ? "Connecting..."
                        : "Save & Auto Detect"}
                    </span>
                  </Button>

                  {isConnected && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => disconnectMutation.mutate()}
                      disabled={disconnectMutation.isPending}
                      className="text-xs h-9 px-3"
                      title="Disconnect GitHub credentials"
                    >
                      <Unplug className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limits & Token Scopes Card */}
          <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-xl flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Radio className="h-4 w-4 text-cyan-400" />
                  <span>GitHub API Rate Limit</span>
                </CardTitle>
                <span className="text-[11px] font-mono text-zinc-400">
                  {rateLimit?.remaining ?? 60} / {rateLimit?.limit ?? 60} req/hr
                </span>
              </div>
              <CardDescription className="text-xs text-zinc-400">
                Official limits enforced by GitHub per authorization level.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress bar */}
              <div>
                <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full transition-all duration-500 ${rateColor}`}
                    style={{ width: `${Math.min(100, Math.max(0, ratePercent))}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1 font-mono">
                  <span>Quota remaining: {ratePercent}%</span>
                  <span>
                    {rateLimit?.reset
                      ? `Resets ${new Date(rateLimit.reset * 1000).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "Resets every hour"}
                  </span>
                </div>
              </div>

              {/* Scope chips */}
              <div className="pt-2 border-t border-white/5">
                <span className="text-[11px] text-zinc-400 font-medium block mb-1.5">
                  Authorized Token Scopes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {config?.scopes && config.scopes.length > 0 ? (
                    config.scopes.map((s: string) => (
                      <Badge
                        key={s}
                        variant="secondary"
                        className="text-[10px] px-2 py-0.5 font-mono bg-violet-600/15 text-violet-300 border-violet-500/20"
                      >
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[11px] text-zinc-500 italic">
                      Public access only (60 req/hr). Add PAT with 'repo' scope for 5,000 req/hr & private repos.
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Repository Management Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-xl border border-white/5">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search repositories by name, topic, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-950/70 border-white/10 text-xs text-white placeholder:text-zinc-500 h-9"
            />
          </div>

          {/* Visibility filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400 hidden sm:inline">Visibility:</span>
            <div className="inline-flex rounded-lg bg-zinc-950 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setVisibility("all")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  visibility === "all"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  visibility === "public"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  visibility === "private"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Private
              </button>
            </div>
          </div>

          {/* Language filter */}
          {availableLanguages.length > 0 && (
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              aria-label="Filter repositories by programming language"
              className="bg-zinc-950 text-xs text-zinc-300 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500"
            >
              <option value="all">All Languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          )}

          {/* Sort dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort repositories by criteria"
              className="bg-zinc-950 text-xs text-zinc-300 border border-white/10 rounded-lg px-2.5 py-1.5 outline-none focus:border-violet-500"
            >
              <option value="stars">Most Stars</option>
              <option value="updated">Recently Updated</option>
              <option value="forks">Most Forks</option>
              <option value="name">Repository Name</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-1.5 rounded-lg border border-white/10 bg-zinc-950 text-zinc-400 hover:text-white hover:border-white/20 transition-colors"
              title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Repository Grid / Cards */}
        {isReposLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-xl bg-zinc-900/40 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : repositories.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-zinc-900/20">
            <Github className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">No repositories found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {search || visibility !== "all" || selectedLanguage !== "all"
                ? "Try adjusting your search query, language, or visibility filter."
                : "Connect your GitHub account or click 'Manual Sync' above to auto-detect your repositories."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repositories.map((repo) => (
              <Card
                key={repo.id}
                className="border-white/10 bg-zinc-900/50 hover:border-violet-500/30 hover:bg-zinc-900/80 transition-all flex flex-col justify-between group"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs text-zinc-400 font-mono truncate">
                          {repo.owner?.login || repo.fullName.split("/")[0]} /
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 font-mono ${
                            repo.isPrivate
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          }`}
                        >
                          {repo.isPrivate ? (
                            <span className="flex items-center gap-1">
                              <Lock className="h-2.5 w-2.5" />
                              <span>Private</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Globe className="h-2.5 w-2.5" />
                              <span>Public</span>
                            </span>
                          )}
                        </Badge>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                        {repo.name}
                      </h4>
                    </div>

                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg border border-white/5 bg-zinc-950 hover:bg-white/10 text-zinc-400 hover:text-white shrink-0 transition-colors"
                      title="Open on GitHub"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 mt-2 leading-relaxed min-h-[2rem]">
                    {repo.description || "No repository description provided."}
                  </p>
                </CardHeader>

                <CardContent className="pt-2 space-y-3">
                  {/* Topics chips */}
                  {repo.topics && repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {repo.topics.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-950 text-cyan-300/80 border border-cyan-500/20 font-mono"
                        >
                          #{topic}
                        </span>
                      ))}
                      {repo.topics.length > 3 && (
                        <span className="text-[10px] text-zinc-500 font-mono self-center">
                          +{repo.topics.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Metrics bar */}
                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-white/5 font-mono">
                    <div className="flex items-center gap-3">
                      {repo.language && (
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor:
                                LANGUAGE_COLORS[repo.language] || "#8b5cf6",
                            }}
                          />
                          <span className="text-[11px] text-zinc-300">
                            {repo.language}
                          </span>
                        </div>
                      )}

                      <span className="flex items-center gap-1 text-[11px] text-yellow-400">
                        <Star className="h-3 w-3 fill-yellow-400/20" />
                        <span>{repo.stars}</span>
                      </span>

                      <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <GitFork className="h-3 w-3" />
                        <span>{repo.forks}</span>
                      </span>
                    </div>

                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(repo.updatedAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </span>
                  </div>

                  {/* Inspector Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setInspectingRepo({
                        owner: repo.owner?.login || repo.fullName.split("/")[0],
                        name: repo.name,
                      })
                    }
                    className="w-full h-8 text-xs border-white/10 hover:border-violet-500/30 hover:bg-violet-600/10 text-zinc-300 hover:text-white gap-1.5"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-violet-400" />
                    <span>Inspect Details & README</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Deep Repository Details Modal Dialog */}
      <Dialog
        open={!!inspectingRepo}
        onOpenChange={(open) => !open && setInspectingRepo(null)}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto border-white/10 bg-zinc-950 p-6">
          <DialogHeader>
            <div className="flex items-start justify-between pr-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono ${
                      inspectData?.isPrivate
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    }`}
                  >
                    {inspectData?.isPrivate ? "Private" : "Public"}
                  </Badge>
                  <span className="text-xs text-zinc-500 font-mono">
                    Branch: {inspectData?.defaultBranch || "main"}
                  </span>
                  {inspectData?.license && (
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {inspectData.license}
                    </Badge>
                  )}
                </div>

                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{inspectingRepo?.owner} / {inspectingRepo?.name}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 mt-1">
                  {inspectData?.description || "No repository description provided."}
                </DialogDescription>
              </div>

              {inspectData?.htmlUrl && (
                <a
                  href={inspectData.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex"
                >
                  <Button size="sm" variant="studio" className="gap-1.5 h-8 text-xs">
                    <Github className="h-3.5 w-3.5" />
                    <span>Open GitHub</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              )}
            </div>
          </DialogHeader>

          {isInspectLoading ? (
            <div className="py-16 space-y-4">
              <Skeleton className="h-8 w-1/3 bg-zinc-900" />
              <Skeleton className="h-32 w-full bg-zinc-900" />
            </div>
          ) : (
            <Tabs defaultValue="readme" className="w-full mt-4">
              <TabsList className="bg-zinc-900 border border-white/10">
                <TabsTrigger value="readme" className="text-xs gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>README</span>
                </TabsTrigger>
                <TabsTrigger value="languages" className="text-xs gap-1.5">
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Languages</span>
                </TabsTrigger>
                <TabsTrigger value="commits" className="text-xs gap-1.5">
                  <GitCommit className="h-3.5 w-3.5" />
                  <span>Commits ({inspectData?.recentCommits?.length || 0})</span>
                </TabsTrigger>
                <TabsTrigger value="releases" className="text-xs gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Releases ({inspectData?.releases?.length || 0})</span>
                </TabsTrigger>
              </TabsList>

              {/* README Tab */}
              <TabsContent value="readme" className="mt-4">
                <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto selection:bg-violet-600">
                  {inspectData?.readme ||
                    "No README.md content found or file is empty in this repository."}
                </div>
              </TabsContent>

              {/* Languages Tab */}
              <TabsContent value="languages" className="mt-4 space-y-4">
                <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 space-y-4">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                    Code Language Breakdown
                  </h4>
                  {inspectData?.languages && Object.keys(inspectData.languages).length > 0 ? (
                    <div className="space-y-3">
                      {/* Language bar */}
                      <div className="h-3 w-full rounded-full overflow-hidden flex bg-zinc-950 border border-white/10">
                        {(() => {
                          const langs = inspectData.languages || {};
                          const totalBytes = Object.values(langs).reduce((a, b) => a + b, 0);
                          return Object.entries(langs).map(([lang, bytes]) => {
                            const pct = totalBytes > 0 ? (bytes / totalBytes) * 100 : 0;
                            return (
                              <div
                                key={lang}
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: LANGUAGE_COLORS[lang] || "#8b5cf6",
                                }}
                                title={`${lang}: ${pct.toFixed(1)}%`}
                              />
                            );
                          });
                        })()}
                      </div>

                      {/* Language list */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                        {(() => {
                          const langs = inspectData.languages || {};
                          const totalBytes = Object.values(langs).reduce((a, b) => a + b, 0);
                          return Object.entries(langs).map(([lang, bytes]) => {
                            const pct = totalBytes > 0 ? (bytes / totalBytes) * 100 : 0;
                            return (
                              <div
                                key={lang}
                                className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-white/5 text-xs"
                              >
                                <span className="flex items-center gap-1.5 text-zinc-300">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{
                                      backgroundColor: LANGUAGE_COLORS[lang] || "#8b5cf6",
                                    }}
                                  />
                                  <span>{lang}</span>
                                </span>
                                <span className="text-zinc-500 font-mono">
                                  {pct.toFixed(1)}%
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">
                      Primary language: {inspectData?.language || "Undetermined"}
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Commits Tab */}
              <TabsContent value="commits" className="mt-4">
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {inspectData?.recentCommits && inspectData.recentCommits.length > 0 ? (
                    inspectData.recentCommits.map((c) => (
                      <div
                        key={c.sha}
                        className="p-3 rounded-xl border border-white/5 bg-zinc-900/60 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-zinc-200 font-medium leading-snug">
                            {c.message}
                          </p>
                          <span className="text-[10px] text-zinc-500 mt-1 block">
                            Authored by <strong className="text-zinc-400">{c.author}</strong> •{" "}
                            {new Date(c.date).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <Badge variant="outline" className="font-mono text-[10px] text-cyan-400 shrink-0">
                          {c.sha.slice(0, 7)}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-zinc-500">
                      No recent commits fetched for this repository.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Releases Tab */}
              <TabsContent value="releases" className="mt-4">
                <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                  {inspectData?.releases && inspectData.releases.length > 0 ? (
                    inspectData.releases.map((rel) => (
                      <div
                        key={rel.id}
                        className="p-4 rounded-xl border border-white/5 bg-zinc-900/60 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {rel.tagName}
                            </Badge>
                            <h5 className="font-semibold text-white">{rel.name}</h5>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(rel.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-[11px] whitespace-pre-wrap">
                          {rel.body}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-zinc-500">
                      No published releases detected on this repository.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
