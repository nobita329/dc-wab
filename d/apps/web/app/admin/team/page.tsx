"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TeamMember, TeamPageData, DiscordMember } from "@nova/shared";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useLanyard } from "@/hooks/useLanyard";
import { LanyardAvatar, SpotifyPlayerCard } from "@/components/team/LanyardPresence";
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
  Users,
  Search,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Save,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Database,
  ArrowUp,
  ArrowDown,
  Activity,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const availableColors = [
  { id: "yellow", name: "Yellow (Owner/Lead)", hex: "#eab308", class: "bg-yellow-500 text-black" },
  { id: "purple", name: "Purple (Co-Owner)", hex: "#a855f7", class: "bg-purple-500 text-white" },
  { id: "blue", name: "Blue (Developer)", hex: "#3b82f6", class: "bg-blue-500 text-white" },
  { id: "indigo", name: "Indigo (Code Dev)", hex: "#6366f1", class: "bg-indigo-500 text-white" },
  { id: "orange", name: "Orange (Hosting)", hex: "#f97316", class: "bg-orange-500 text-white" },
  { id: "green", name: "Green (MC Dev)", hex: "#22c55e", class: "bg-green-500 text-white" },
  { id: "cyan", name: "Cyan (Backend)", hex: "#06b6d4", class: "bg-cyan-500 text-black" },
  { id: "pink", name: "Pink (Frontend/UI)", hex: "#ec4899", class: "bg-pink-500 text-white" },
  { id: "teal", name: "Teal (Moderator)", hex: "#14b8a6", class: "bg-teal-500 text-black" },
  { id: "emerald", name: "Emerald (Support)", hex: "#10b981", class: "bg-emerald-500 text-white" },
  { id: "violet", name: "Violet (Community)", hex: "#8b5cf6", class: "bg-violet-500 text-white" },
  { id: "red", name: "Red (Security)", hex: "#ef4444", class: "bg-red-500 text-white" },
];

const standardDepartments = [
  "Leadership",
  "Development",
  "Moderation & Support",
];

const defaultCoreMembers: TeamMember[] = [
  {
    id: "123456789",
    category: "Leadership",
    name: "Nobita",
    role: "Owner",
    roleShort: "OWNER",
    desc: "Lead Developer",
    status: "dnd",
    game: "VS Code",
    color: "yellow",
    avatar: "https://i.ibb.co/Y4RWVTbY/discord-fake-avatar-decorations-1767018696456.gif",
    discordId: "123456789",
  },
  {
    id: "2233445566",
    category: "Leadership",
    name: "Miss Riya",
    role: "Co-Owner",
    roleShort: "CO-OWNER",
    desc: "SRV DB Manager",
    status: "online",
    game: "Database",
    color: "purple",
    avatar: "https://images-ext-1.discordapp.net/external/ZmGWbUSsE2_E9WD33Esb3J10IXJp25j_NXLnsygJjuE/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/872153892425707600/a6f2d4795f453d725babbcd8156bf4ce.png?format=webp&quality=lossless&width=356&height=356",
    discordId: "2233445566",
  },
  {
    id: "987654321",
    category: "Development",
    name: "You",
    role: "Developer",
    roleShort: "DEVELOPER",
    desc: "Full Stack Dev",
    status: "online",
    game: "Visual Studio",
    color: "blue",
    avatar: "https://i.ibb.co/YT42zXt3/discord-fake-avatar-decorations-1767631301047.gif",
    discordId: "987654321",
  },
  {
    id: "4455667788",
    category: "Development",
    name: "Aarma",
    role: "Code Dev",
    roleShort: "CODE DEV",
    desc: "Code Developer",
    status: "dnd",
    game: "Coding",
    color: "indigo",
    avatar: "https://images-ext-1.discordapp.net/external/M_rcqoMZOdLdzssbG_3EsQrQJQKIOo4Ibwdzd6K1OZs/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1073795910645071872/a_a6aac3b9a5aae6cf41ea4c0f2bafdbad.gif?width=278&height=278",
    discordId: "4455667788",
  },
  {
    id: "3344556677",
    category: "Development",
    name: "Kabeer",
    role: "Script Host",
    roleShort: "HOST",
    desc: "Script Hosting",
    status: "idle",
    game: "Hosting",
    color: "orange",
    avatar: "https://images-ext-1.discordapp.net/external/ISfYn9ifwzCy45cTLRx7EAJmcAuR4DnBwk7Kx0FhaOE/%3Fsize%3D256/https/cdn.discordapp.com/avatars/1327154284965396543/d40ccbe89c54f74764e57edc0cc6cb50.png?format=webp&quality=lossless&width=176&height=176",
    discordId: "3344556677",
  },
  {
    id: "1122334455",
    category: "Development",
    name: "Deadishere",
    role: "Minecraft Dev",
    roleShort: "MC DEV",
    desc: "Minecraft Developer",
    status: "online",
    game: "Minecraft",
    color: "green",
    avatar: "https://media.discordapp.net/attachments/1454865252226306168/1463244170830418106/Cropped_Image.png?ex=69711fd4&is=696fce54&hm=349467620720638b8fb57d105385eb5cba4b11de62c84125ca6fa9dbb22402e3&=&format=webp&quality=lossless&width=580&height=579",
    discordId: "1122334455",
  },
  {
    id: "5566778899",
    category: "Development",
    name: "Shadow",
    role: "Backend Dev",
    roleShort: "BACKEND",
    desc: "API & Backend Development",
    status: "online",
    game: "Terminal",
    color: "cyan",
    avatar: "https://cdn.discordapp.com/embed/avatars/1.png",
    discordId: "5566778899",
  },
  {
    id: "6677889900",
    category: "Development",
    name: "Luna",
    role: "Frontend Dev",
    roleShort: "FRONTEND",
    desc: "UI/UX & Frontend Development",
    status: "idle",
    game: "Figma",
    color: "pink",
    avatar: "https://cdn.discordapp.com/embed/avatars/2.png",
    discordId: "6677889900",
  },
  {
    id: "7788990011",
    category: "Moderation & Support",
    name: "Zen",
    role: "Server Moderator",
    roleShort: "MOD",
    desc: "Community Moderation",
    status: "online",
    game: "Discord",
    color: "teal",
    avatar: "https://cdn.discordapp.com/embed/avatars/3.png",
    discordId: "7788990011",
  },
  {
    id: "8899001122",
    category: "Moderation & Support",
    name: "Max",
    role: "Support Agent",
    roleShort: "SUPPORT",
    desc: "Member Support",
    status: "online",
    game: "Ticket System",
    color: "emerald",
    avatar: "https://cdn.discordapp.com/embed/avatars/4.png",
    discordId: "8899001122",
  },
  {
    id: "9900112233",
    category: "Moderation & Support",
    name: "Nova",
    role: "Community Manager",
    roleShort: "CM",
    desc: "Community Engagement",
    status: "idle",
    game: "Social Media",
    color: "violet",
    avatar: "https://cdn.discordapp.com/embed/avatars/5.png",
    discordId: "9900112233",
  },
  {
    id: "0011223344",
    category: "Moderation & Support",
    name: "Rex",
    role: "Security Lead",
    roleShort: "SECURITY",
    desc: "Server Security",
    status: "dnd",
    game: "Security Audit",
    color: "red",
    avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
    discordId: "0011223344",
  },
];

export default function AdminTeamPage() {
  const queryClient = useQueryClient();
  const [serverId, setServerId] = useState("1540761150797389915");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("All");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [discordSearchQuery, setDiscordSearchQuery] = useState("");
  const [showDiscordPanel, setShowDiscordPanel] = useState(true);

  // Edit / Add Member Dialog State
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 1. Fetch Team data from team.db via /api/admin/team
  const { data: teamData, isLoading: isLoadingTeam, refetch: refetchTeam } = useQuery<{
    success: boolean;
    data: TeamPageData;
  }>({
    queryKey: ["adminTeamData"],
    queryFn: async () => (await api.get("/api/admin/team")).data,
  });

  // 2. Fetch detected Discord users from https://discord.com/api/guilds/{$serverid}/widget.json
  const {
    data: discordDetected,
    isLoading: isLoadingDiscord,
    refetch: refetchDiscord,
    isFetching: isFetchingDiscord,
  } = useQuery<{
    success: boolean;
    serverId: string;
    name: string;
    instant_invite: string | null;
    presence_count: number;
    members: DiscordMember[];
  }>({
    queryKey: ["adminDiscordMembers", serverId],
    queryFn: async () => (await api.get(`/api/admin/team/discord-members?serverId=${serverId}`)).data,
    retry: 1,
  });

  // Local draft of team page content
  const currentTeam: TeamPageData = teamData?.data || {
    title: "Meet Our Team",
    badge: "THE MINDS BEHIND NOVA & NOBITA CLOUD",
    subtitle: "A collective of visionary leaders, full-stack developers, infrastructure specialists, and community architects.",
    stats: [],
    categories: standardDepartments,
    members: [],
  };

  // Subscribe to Lanyard live presence for all team members and detected members
  const allDiscordIds = useMemo(() => {
    const fromTeam = currentTeam.members
      .map((m) => m.discordId)
      .filter((id): id is string => !!id && /^\d+$/.test(id));
    const fromDetected = (discordDetected?.members || [])
      .map((m) => m.id)
      .filter((id): id is string => !!id && /^\d+$/.test(id));
    return Array.from(new Set([...fromTeam, ...fromDetected]));
  }, [currentTeam.members, discordDetected?.members]);

  const { getPresence, isMonitored } = useLanyard(allDiscordIds);

  // Mutation: Save Member into team.db
  const saveMemberMutation = useMutation({
    mutationFn: async (member: TeamMember) => {
      const res = await api.post("/api/admin/team/member", member);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Member saved to team.db!");
      setIsMemberDialogOpen(false);
      setEditingMember(null);
      refetchTeam();
      queryClient.invalidateQueries({ queryKey: ["teamPageData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save member");
    },
  });

  // Mutation: Delete Member from team.db
  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await api.delete(`/api/admin/team/member/${memberId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Member removed from team.db");
      setDeleteConfirmId(null);
      refetchTeam();
      queryClient.invalidateQueries({ queryKey: ["teamPageData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete member");
    },
  });

  // Mutation: Save entire team settings & order into team.db
  const saveAllTeamMutation = useMutation({
    mutationFn: async (data: TeamPageData) => {
      const res = await api.put("/api/admin/team", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("All team changes persisted in team.db!");
      refetchTeam();
      queryClient.invalidateQueries({ queryKey: ["teamPageData"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to persist team in team.db");
    },
  });

  // Open dialog to create brand new member
  const handleAddNewMember = () => {
    setEditingMember({
      id: `member-${Date.now()}`,
      category: "Development",
      name: "",
      role: "Developer",
      roleShort: "DEVELOPER",
      desc: "Full Stack Engineer",
      status: "online",
      game: "VS Code",
      color: "blue",
      avatar: "https://cdn.discordapp.com/embed/avatars/0.png",
      discordId: "",
    });
    setIsMemberDialogOpen(true);
  };

  // Open dialog from detected Discord user ("selt + role de")
  const handleSelectDiscordUser = (dm: DiscordMember) => {
    // Generate role and color presets based on activity or existing name
    setEditingMember({
      id: dm.id && dm.id !== "0" ? dm.id : `discord-${Date.now()}`,
      category: "Development",
      name: dm.username,
      role: "Community Member",
      roleShort: "STAFF",
      desc: dm.game?.name ? `Active on ${dm.game.name}` : "Team Contributor",
      status: dm.status === "offline" ? "online" : dm.status,
      game: dm.game?.name || "Discord",
      color: "cyan",
      avatar: dm.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png",
      discordId: dm.id && dm.id !== "0" ? dm.id : "",
    });
    setIsMemberDialogOpen(true);
    toast.info(`Selected Discord user ${dm.username}. Assign department and role!`);
  };

  // Move member position up/down
  const handleMoveMember = (idx: number, direction: "up" | "down") => {
    const members = [...currentTeam.members];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= members.length) return;

    const temp = members[idx];
    members[idx] = members[targetIdx];
    members[targetIdx] = temp;

    saveAllTeamMutation.mutate({
      ...currentTeam,
      members,
    });
  };

  // Filtered members list
  const filteredMembers = currentTeam.members.filter((m) => {
    const matchesDept =
      selectedDeptFilter === "All" || m.category === selectedDeptFilter;
    const query = teamSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      m.name.toLowerCase().includes(query) ||
      m.role.toLowerCase().includes(query) ||
      m.roleShort.toLowerCase().includes(query) ||
      m.desc.toLowerCase().includes(query) ||
      (m.discordId && m.discordId.includes(query));
    return matchesDept && matchesSearch;
  });

  // Filtered detected Discord users
  const detectedMembers = discordDetected?.members || [];
  const filteredDiscordUsers = detectedMembers.filter((dm) => {
    const q = discordSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      dm.username.toLowerCase().includes(q) ||
      (dm.game?.name && dm.game.name.toLowerCase().includes(q)) ||
      dm.id.includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header */}
      <AdminHeader
        title="Team Management"
        subtitle="Configure team members, roles, departments, and sync live users from Discord (persisted in team.db)"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiscordPanel(!showDiscordPanel)}
              className="gap-1.5 border-[#5865F2]/40 bg-[#5865F2]/10 text-indigo-400 hover:bg-[#5865F2]/20 text-xs"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{showDiscordPanel ? "Hide Discord Scanner" : "Detect Discord Users"}</span>
            </Button>
            <Button
              onClick={handleAddNewMember}
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/10 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Member</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                saveAllTeamMutation.mutate({
                  ...currentTeam,
                  members: defaultCoreMembers,
                });
                toast.success("Restored 12 core team members in team.db!");
              }}
              className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Restore Core Members</span>
            </Button>
            <Link href="/team" target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View /team</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Status Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-white/10 bg-zinc-900/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 font-medium">Core Team Members</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {currentTeam.members.length}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Saved in <code className="text-cyan-400 font-mono">data/team.db</code>
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 font-medium">Database Persistence</p>
                <p className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>team.db Active</span>
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">SQLite WAL Engine</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Database className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 font-medium">Discord Server Sync</p>
                <p className="text-base font-bold text-indigo-400 mt-1 flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>{discordDetected?.name || "Nova Studio"}</span>
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                  ID: {serverId}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
                <MessageSquare className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 font-medium">Detected Discord Users</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">
                  {discordDetected?.presence_count ?? detectedMembers.length}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Available for 1-click role assignment
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <UserCheck className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ======================================================== */}
        {/* DISCORD DETECTOR PANEL ("ditact kar ge role de + selt + set + edit") */}
        {/* ======================================================== */}
        {showDiscordPanel && (
          <Card className="border-[#5865F2]/30 bg-gradient-to-b from-[#5865F2]/10 via-zinc-900/80 to-zinc-950 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5865F2] via-cyan-400 to-violet-500" />
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-[#5865F2]" />
                    <span>Live Discord User Detection (widget.json)</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/40 font-mono">
                      Real-time Sync
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400 mt-1">
                    Detect live Discord users from{" "}
                    <code className="text-cyan-400 font-mono text-[11px]">
                      https://discord.com/api/guilds/{serverId}/widget.json
                    </code>
                    , then click <strong>&quot;Select &amp; Assign Role&quot;</strong> to set them directly into <code className="text-white">team.db</code>!
                  </CardDescription>
                </div>

                {/* Server ID & Scan Trigger */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Input
                      value={serverId}
                      onChange={(e) => setServerId(e.target.value.trim())}
                      placeholder="Server ID"
                      className="h-9 w-48 font-mono text-xs bg-black/60 border-white/10"
                    />
                  </div>
                  <Button
                    onClick={() => refetchDiscord()}
                    disabled={isFetchingDiscord}
                    size="sm"
                    className="gap-1.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isFetchingDiscord ? "animate-spin" : ""}`} />
                    <span>Scan Discord</span>
                  </Button>
                </div>
              </div>

              {/* Search inside detected users */}
              <div className="pt-2">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <Input
                    value={discordSearchQuery}
                    onChange={(e) => setDiscordSearchQuery(e.target.value)}
                    placeholder="Search detected users by name or game..."
                    className="pl-9 h-8 text-xs bg-black/40 border-white/10 rounded-lg placeholder:text-zinc-500"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isLoadingDiscord ? (
                <div className="py-12 text-center text-zinc-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="h-6 w-6 text-[#5865F2] animate-spin" />
                  <span>Detecting active members from Discord API...</span>
                </div>
              ) : filteredDiscordUsers.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs border border-white/5 rounded-xl bg-black/30">
                  No Discord users detected. Verify that the Discord Widget is enabled in Server Settings &gt; Widget.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1 pr-2 scrollbar-thin">
                  {filteredDiscordUsers.map((dm) => {
                    const isAlreadyTeam = currentTeam.members.some(
                      (m) => m.name.toLowerCase() === dm.username.toLowerCase() || (m.discordId && m.discordId === dm.id)
                    );

                    return (
                      <div
                        key={dm.id || dm.username}
                        className={`rounded-xl border p-3 flex flex-col justify-between gap-3 backdrop-blur-md transition-all ${
                          isAlreadyTeam
                            ? "border-emerald-500/30 bg-emerald-950/20"
                            : "border-white/10 bg-zinc-950/60 hover:border-indigo-500/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={dm.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png"}
                              alt={dm.username}
                              className="w-10 h-10 rounded-full object-cover bg-zinc-800 border border-white/10"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5">
                              <span
                                className={`inline-flex rounded-full h-3 w-3 border-2 border-black ${
                                  dm.status === "online"
                                    ? "bg-emerald-500"
                                    : dm.status === "idle"
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                              <span>{dm.username}</span>
                              {isAlreadyTeam && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                                  IN TEAM
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                              {dm.game?.name ? `🎮 ${dm.game.name}` : dm.status}
                            </p>
                          </div>
                        </div>

                        {/* Action: Select and Assign Role ("selt + role de") */}
                        <Button
                          size="sm"
                          onClick={() => handleSelectDiscordUser(dm)}
                          className="w-full h-7 text-[11px] font-bold bg-[#5865F2] hover:bg-[#4752c4] text-white gap-1.5 shadow-sm"
                        >
                          <UserCheck className="h-3 w-3" />
                          <span>{isAlreadyTeam ? "Update Role" : "Select & Assign Role"}</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ======================================================== */}
        {/* CORE TEAM MEMBERS EDITOR SECTION */}
        {/* ======================================================== */}
        <Card className="border-white/10 bg-zinc-900/60 shadow-xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-violet-400" />
                  <span>Core Team Members ({currentTeam.members.length})</span>
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Manage members displayed on the public <Link href="/team" className="text-cyan-400 hover:underline">/team</Link> page. Edits persist directly to <code className="text-white">team.db</code>.
                </CardDescription>
              </div>

              {/* Department Filters & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
                  {["All", ...standardDepartments].map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setSelectedDeptFilter(dept)}
                      className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                        selectedDeptFilter === dept
                          ? "bg-violet-600 text-white shadow-sm"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <Input
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    placeholder="Search team..."
                    className="pl-8 h-8 w-44 text-xs bg-black/40 border-white/10 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 border border-white/5 rounded-2xl bg-black/30">
                <Users className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">No members match your filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member, idx) => {
                  const colorMatch = availableColors.find((c) => c.id === member.color) || availableColors[0];
                  const presence = getPresence(member.discordId);
                  const live = isMonitored(member.discordId);
                  const hasSpotify = presence?.listening_to_spotify && presence?.spotify;
                  const liveActivity = presence?.activities?.find((a) => a.type !== 4);

                  return (
                    <div
                      key={member.id}
                      className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 flex flex-col justify-between gap-4 group hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Avatar with live decoration & status */}
                        <LanyardAvatar
                          presence={presence}
                          fallbackAvatar={member.avatar}
                          borderColor={colorMatch.hex}
                          size="sm"
                        />

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap justify-between">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <h4 className="font-bold text-sm text-white truncate">
                                {member.name}
                              </h4>
                              <span
                                className="text-[10px] font-extrabold px-2 py-0.5 rounded border tracking-wider uppercase"
                                style={{
                                  borderColor: `${colorMatch.hex}40`,
                                  backgroundColor: `${colorMatch.hex}20`,
                                  color: colorMatch.hex,
                                }}
                              >
                                {member.roleShort}
                              </span>
                            </div>

                            {live ? (
                              <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Lanyard</span>
                              </span>
                            ) : member.discordId ? (
                              <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/5">
                                ID Sync
                              </span>
                            ) : null}
                          </div>

                          <p className="text-xs text-zinc-300 font-medium mt-0.5 truncate">
                            {member.role}
                          </p>

                          <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                            {member.desc}
                          </p>

                          {hasSpotify ? (
                            <p className="text-[10px] text-emerald-400 mt-1 truncate font-medium flex items-center gap-1">
                              <span>🎵</span>
                              <span className="truncate">{presence.spotify?.song} - {presence.spotify?.artist}</span>
                            </p>
                          ) : liveActivity ? (
                            <p className="text-[10px] text-cyan-400 mt-1 truncate font-mono">
                              ⚡ {liveActivity.name} {liveActivity.details ? `(${liveActivity.details})` : ""}
                            </p>
                          ) : member.game ? (
                            <p className="text-[10px] text-zinc-500 mt-1 truncate font-mono">
                              🎮 {member.game}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* Footer Actions: Reorder & Edit/Delete */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        {/* Department Badge */}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/5">
                          {member.category}
                        </span>

                        {/* Buttons */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveMember(idx, "up")}
                            disabled={idx === 0}
                            className="h-7 w-7 text-zinc-400 hover:text-white"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveMember(idx, "down")}
                            disabled={idx === currentTeam.members.length - 1}
                            className="h-7 w-7 text-zinc-400 hover:text-white"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingMember(member);
                              setIsMemberDialogOpen(true);
                            }}
                            className="h-7 px-2 text-xs gap-1 border-white/10"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(member.id)}
                            className="h-7 w-7 text-zinc-500 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ======================================================== */}
        {/* TEAM PAGE HEADLINE & METADATA SETTINGS */}
        {/* ======================================================== */}
        <Card className="border-white/10 bg-zinc-900/60 shadow-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Team Page Header &amp; SEO Configuration</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Headline, badge, and intro copy presented on the public /team page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300">Section Badge</label>
                <Input
                  value={currentTeam.badge}
                  onChange={(e) => {
                    const updated = { ...currentTeam, badge: e.target.value };
                    queryClient.setQueryData(["adminTeamData"], { success: true, data: updated });
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300">Main Title</label>
                <Input
                  value={currentTeam.title}
                  onChange={(e) => {
                    const updated = { ...currentTeam, title: e.target.value };
                    queryClient.setQueryData(["adminTeamData"], { success: true, data: updated });
                  }}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300">Subtitle Description</label>
              <Textarea
                rows={2}
                value={currentTeam.subtitle}
                onChange={(e) => {
                  const updated = { ...currentTeam, subtitle: e.target.value };
                  queryClient.setQueryData(["adminTeamData"], { success: true, data: updated });
                }}
                className="mt-1"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => saveAllTeamMutation.mutate(currentTeam)}
                disabled={saveAllTeamMutation.isPending}
                className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs"
              >
                <Save className="h-4 w-4" />
                <span>Save All to team.db</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ======================================================== */}
      {/* EDIT / SET MEMBER DIALOG ("role de + selt + set + edit") */}
      {/* ======================================================== */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent className="sm:max-w-lg border-white/10 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-cyan-400" />
              <span>{editingMember?.name ? `Set & Edit: ${editingMember.name}` : "Add New Team Member"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Configure department, role, short tag, and styling. Saves to <code className="text-white">team.db</code>.
            </DialogDescription>
          </DialogHeader>

          {editingMember && (
            <div className="space-y-4 py-2 text-xs">
              {/* Preview Avatar & Name Banner */}
              <div className="p-3 rounded-xl border border-white/10 bg-black/50 flex items-center gap-3">
                <img
                  src={editingMember.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"}
                  alt={editingMember.name}
                  className="w-12 h-12 rounded-full object-cover border-2"
                  style={{
                    borderColor:
                      availableColors.find((c) => c.id === editingMember.color)?.hex || "#3b82f6",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-white truncate">
                    {editingMember.name || "Member Name"}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {editingMember.role || "Role"} • {editingMember.category}
                  </p>
                </div>
                <span
                  className="text-[10px] font-extrabold px-2.5 py-1 rounded border uppercase tracking-wider"
                  style={{
                    borderColor:
                      availableColors.find((c) => c.id === editingMember.color)?.hex || "#3b82f6",
                    color:
                      availableColors.find((c) => c.id === editingMember.color)?.hex || "#3b82f6",
                  }}
                >
                  {editingMember.roleShort || "ROLE"}
                </span>
              </div>

              {/* Quick Role Presets ("role de") */}
              <div className="p-2.5 rounded-xl border border-white/5 bg-zinc-900/60">
                <label className="font-semibold text-zinc-300 block mb-1.5 text-[11px]">
                  ⚡ Quick Role Presets (Click to Auto-Assign Role &amp; Color):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "OWNER", role: "Owner", dept: "Leadership", color: "yellow", desc: "Lead Developer" },
                    { label: "CO-OWNER", role: "Co-Owner", dept: "Leadership", color: "purple", desc: "SRV DB Manager" },
                    { label: "DEVELOPER", role: "Developer", dept: "Development", color: "blue", desc: "Full Stack Dev" },
                    { label: "CODE DEV", role: "Code Dev", dept: "Development", color: "indigo", desc: "Code Developer" },
                    { label: "HOST", role: "Script Host", dept: "Development", color: "orange", desc: "Script Hosting" },
                    { label: "MC DEV", role: "Minecraft Dev", dept: "Development", color: "green", desc: "Minecraft Developer" },
                    { label: "BACKEND", role: "Backend Dev", dept: "Development", color: "cyan", desc: "API & Backend Development" },
                    { label: "FRONTEND", role: "Frontend Dev", dept: "Development", color: "pink", desc: "UI/UX & Frontend Development" },
                    { label: "MOD", role: "Server Moderator", dept: "Moderation & Support", color: "teal", desc: "Community Moderation" },
                    { label: "SUPPORT", role: "Support Agent", dept: "Moderation & Support", color: "emerald", desc: "Member Support" },
                    { label: "CM", role: "Community Manager", dept: "Moderation & Support", color: "violet", desc: "Community Engagement" },
                    { label: "SECURITY", role: "Security Lead", dept: "Moderation & Support", color: "red", desc: "Server Security" },
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset.label}
                      onClick={() => {
                        setEditingMember({
                          ...editingMember,
                          category: preset.dept,
                          role: preset.role,
                          roleShort: preset.label,
                          color: preset.color,
                          desc: editingMember.desc || preset.desc,
                        });
                        toast.info(`Assigned role: ${preset.label} (${preset.dept})`);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-extrabold border transition-all hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: `${availableColors.find((c) => c.id === preset.color)?.hex}20`,
                        borderColor: `${availableColors.find((c) => c.id === preset.color)?.hex}50`,
                        color: availableColors.find((c) => c.id === preset.color)?.hex,
                      }}
                    >
                      +{preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-300">Member Name</label>
                  <Input
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    placeholder="e.g. Nobita"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-300">Department / Category</label>
                  <select
                    value={editingMember.category}
                    onChange={(e) => setEditingMember({ ...editingMember, category: e.target.value })}
                    className="mt-1 w-full h-9 rounded-md border border-white/10 bg-zinc-900 px-3 py-1 text-xs text-white"
                  >
                    <option value="Leadership">Leadership</option>
                    <option value="Development">Development</option>
                    <option value="Moderation & Support">Moderation &amp; Support</option>
                    <option value="Creative & Design">Creative &amp; Design</option>
                    <option value="Community Staff">Community Staff</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-300">Role Title (role de)</label>
                  <Input
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    placeholder="e.g. Lead Developer, Owner, Moderator"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-300">Role Short Badge (e.g. OWNER, DEV)</label>
                  <Input
                    value={editingMember.roleShort}
                    onChange={(e) => setEditingMember({ ...editingMember, roleShort: e.target.value.toUpperCase() })}
                    placeholder="e.g. OWNER, DEV, MOD"
                    className="mt-1 h-9 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-300">Bio / Specialization</label>
                  <Input
                    value={editingMember.desc}
                    onChange={(e) => setEditingMember({ ...editingMember, desc: e.target.value })}
                    placeholder="e.g. Full Stack Engineer, Community Lead"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-300">Activity / Playing (Game/Tool)</label>
                  <Input
                    value={editingMember.game || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, game: e.target.value })}
                    placeholder="e.g. VS Code, Minecraft, Figma"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-300">Avatar Image URL</label>
                  <Input
                    value={editingMember.avatar}
                    onChange={(e) => setEditingMember({ ...editingMember, avatar: e.target.value })}
                    placeholder="https://..."
                    className="mt-1 h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-300">Discord User ID</label>
                  <Input
                    value={editingMember.discordId || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, discordId: e.target.value })}
                    placeholder="e.g. 1540761150797389915"
                    className="mt-1 h-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Lanyard Presence Status Card for Editing Member */}
              {editingMember.discordId && (() => {
                const previewPresence = getPresence(editingMember.discordId);
                const isLive = isMonitored(editingMember.discordId);

                return (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                      isLive
                        ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                        : "bg-zinc-900/50 border-white/10 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          isLive ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                        }`}
                      />
                      <div className="truncate">
                        <p className="font-semibold text-white truncate">
                          {isLive
                            ? `Lanyard Active (${previewPresence?.discord_status?.toUpperCase()})`
                            : "Lanyard Status: Not Monitored Yet"}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {isLive
                            ? previewPresence?.listening_to_spotify
                              ? `🎵 Spotify: ${previewPresence.spotify?.song} - ${previewPresence.spotify?.artist}`
                              : previewPresence?.activities?.[0]?.name
                              ? `⚡ Activity: ${previewPresence.activities[0].name}`
                              : "Live profile presence active"
                            : "User must be in discord.gg/lanyard for live rich presence"}
                        </p>
                      </div>
                    </div>

                    {!isLive && (
                      <a
                        href="https://discord.gg/lanyard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[10px] px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1"
                      >
                        <span>Join Lanyard</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                );
              })()}

              {/* Status & Color Selection */}
              <div className="space-y-2 pt-1">
                <label className="font-semibold text-zinc-300">Color Theme (Border &amp; Glow)</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {availableColors.map((col) => (
                    <button
                      type="button"
                      key={col.id}
                      onClick={() => setEditingMember({ ...editingMember, color: col.id })}
                      className={`h-8 rounded-lg border flex items-center justify-center text-[10px] font-bold transition-all ${
                        editingMember.color === col.id
                          ? "ring-2 ring-white scale-105 border-white shadow-md"
                          : "border-white/10 opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: `${col.hex}30`, borderColor: col.hex, color: col.hex }}
                    >
                      {col.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {(["online", "idle", "dnd"] as const).map((st) => (
                  <button
                    type="button"
                    key={st}
                    onClick={() => setEditingMember({ ...editingMember, status: st })}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-semibold capitalize flex items-center justify-center gap-2 ${
                      editingMember.status === st
                        ? "bg-white/10 border-white text-white"
                        : "border-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        st === "online"
                          ? "bg-emerald-500"
                          : st === "idle"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    />
                    <span>{st}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMemberDialogOpen(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => editingMember && saveMemberMutation.mutate(editingMember)}
              disabled={saveMemberMutation.isPending || !editingMember?.name}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold"
            >
              <Save className="h-4 w-4 mr-1.5" />
              <span>Save Member to team.db</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-md border-rose-500/30 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle className="text-rose-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>Delete Team Member?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              This will permanently remove the member from <code className="text-white">data/team.db</code> and the public /team page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => deleteConfirmId && deleteMemberMutation.mutate(deleteConfirmId)}
              disabled={deleteMemberMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

