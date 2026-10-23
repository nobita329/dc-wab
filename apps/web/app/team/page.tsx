"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  TeamMember,
  TeamPageData,
  HomePageContent,
  BrandingSettings,
  SocialLink,
  DiscordWidgetData,
} from "@nova/shared";
import { Navbar } from "@/components/home/Navbar";
import { AnnouncementBanner } from "@/components/home/AnnouncementBanner";
import { FooterSection } from "@/components/home/FooterSection";
import { useLanyard } from "@/hooks/useLanyard";
import {
  SpotifyPlayerCard,
  ActivityCard,
  DeviceBadges,
  LanyardAvatar,
} from "@/components/team/LanyardPresence";
import {
  Users,
  Search,
  Sparkles,
  Terminal,
  Code2,
  Database,
  Gamepad2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Filter,
  Activity,
  Layers,
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useWebSocket } from "@/hooks/useWebSocket";

const defaultTeamMembers: TeamMember[] = [
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
    avatar:
      "https://i.ibb.co/Y4RWVTbY/discord-fake-avatar-decorations-1767018696456.gif",
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
    avatar:
      "https://images-ext-1.discordapp.net/external/ZmGWbUSsE2_E9WD33Esb3J10IXJp25j_NXLnsygJjuE/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/872153892425707600/a6f2d4795f453d725babbcd8156bf4ce.png?format=webp&quality=lossless&width=356&height=356",
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
    avatar:
      "https://i.ibb.co/YT42zXt3/discord-fake-avatar-decorations-1767631301047.gif",
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
    avatar:
      "https://images-ext-1.discordapp.net/external/M_rcqoMZOdLdzssbG_3EsQrQJQKIOo4Ibwdzd6K1OZs/%3Fsize%3D4096/https/cdn.discordapp.com/avatars/1073795910645071872/a_a6aac3b9a5aae6cf41ea4c0f2bafdbad.gif?width=278&height=278",
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
    avatar:
      "https://images-ext-1.discordapp.net/external/ISfYn9ifwzCy45cTLRx7EAJmcAuR4DnBwk7Kx0FhaOE/%3Fsize%3D256/https/cdn.discordapp.com/avatars/1327154284965396543/d40ccbe89c54f74764e57edc0cc6cb50.png?format=webp&quality=lossless&width=176&height=176",
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
    avatar:
      "https://media.discordapp.net/attachments/1454865252226306168/1463244170830418106/Cropped_Image.png?ex=69711fd4&is=696fce54&hm=349467620720638b8fb57d105385eb5cba4b11de62c84125ca6fa9dbb22402e3&=&format=webp&quality=lossless&width=580&height=579",
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

const colorStyles: Record<
  string,
  {
    border: string;
    bg: string;
    text: string;
    badge: string;
    hex: string;
    glow: string;
  }
> = {
  yellow: {
    border: "border-yellow-500/40 hover:border-yellow-400",
    bg: "bg-yellow-500/5 hover:bg-yellow-500/10",
    text: "text-yellow-400",
    badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    hex: "#eab308",
    glow: "shadow-[0_0_25px_rgba(234,179,8,0.2)]",
  },
  purple: {
    border: "border-purple-500/40 hover:border-purple-400",
    bg: "bg-purple-500/5 hover:bg-purple-500/10",
    text: "text-purple-400",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    hex: "#a855f7",
    glow: "shadow-[0_0_25px_rgba(168,85,247,0.2)]",
  },
  blue: {
    border: "border-blue-500/40 hover:border-blue-400",
    bg: "bg-blue-500/5 hover:bg-blue-500/10",
    text: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    hex: "#3b82f6",
    glow: "shadow-[0_0_25px_rgba(59,130,246,0.2)]",
  },
  indigo: {
    border: "border-indigo-500/40 hover:border-indigo-400",
    bg: "bg-indigo-500/5 hover:bg-indigo-500/10",
    text: "text-indigo-400",
    badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    hex: "#6366f1",
    glow: "shadow-[0_0_25px_rgba(99,102,241,0.2)]",
  },
  orange: {
    border: "border-orange-500/40 hover:border-orange-400",
    bg: "bg-orange-500/5 hover:bg-orange-500/10",
    text: "text-orange-400",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    hex: "#f97316",
    glow: "shadow-[0_0_25px_rgba(249,115,22,0.2)]",
  },
  green: {
    border: "border-green-500/40 hover:border-green-400",
    bg: "bg-green-500/5 hover:bg-green-500/10",
    text: "text-green-400",
    badge: "bg-green-500/20 text-green-300 border-green-500/40",
    hex: "#22c55e",
    glow: "shadow-[0_0_25px_rgba(34,197,94,0.2)]",
  },
  cyan: {
    border: "border-cyan-500/40 hover:border-cyan-400",
    bg: "bg-cyan-500/5 hover:bg-cyan-500/10",
    text: "text-cyan-400",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    hex: "#06b6d4",
    glow: "shadow-[0_0_25px_rgba(6,182,212,0.2)]",
  },
  pink: {
    border: "border-pink-500/40 hover:border-pink-400",
    bg: "bg-pink-500/5 hover:bg-pink-500/10",
    text: "text-pink-400",
    badge: "bg-pink-500/20 text-pink-300 border-pink-500/40",
    hex: "#ec4899",
    glow: "shadow-[0_0_25px_rgba(236,72,153,0.2)]",
  },
  teal: {
    border: "border-teal-500/40 hover:border-teal-400",
    bg: "bg-teal-500/5 hover:bg-teal-500/10",
    text: "text-teal-400",
    badge: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    hex: "#14b8a6",
    glow: "shadow-[0_0_25px_rgba(20,184,166,0.2)]",
  },
  emerald: {
    border: "border-emerald-500/40 hover:border-emerald-400",
    bg: "bg-emerald-500/5 hover:bg-emerald-500/10",
    text: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    hex: "#10b981",
    glow: "shadow-[0_0_25px_rgba(16,185,129,0.2)]",
  },
  violet: {
    border: "border-violet-500/40 hover:border-violet-400",
    bg: "bg-violet-500/5 hover:bg-violet-500/10",
    text: "text-violet-400",
    badge: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    hex: "#8b5cf6",
    glow: "shadow-[0_0_25px_rgba(139,92,246,0.2)]",
  },
  red: {
    border: "border-red-500/40 hover:border-red-400",
    bg: "bg-red-500/5 hover:bg-red-500/10",
    text: "text-red-400",
    badge: "bg-red-500/20 text-red-300 border-red-500/40",
    hex: "#ef4444",
    glow: "shadow-[0_0_25px_rgba(239,68,68,0.2)]",
  },
};

export default function TeamPage() {
  useWebSocket();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Fetch Home metadata for Navbar branding and footer
  const { data: homeData } = useQuery<{
    success: boolean;
    content: HomePageContent;
    settings: BrandingSettings;
    socials: SocialLink[];
  }>({
    queryKey: ["homeContent"],
    queryFn: async () => (await api.get("/api/home")).data,
  });

  // Fetch live Team data directly from team.db
  const { data: teamApiData, isLoading: isLoadingTeam } = useQuery<{
    success: boolean;
    data: TeamPageData;
  }>({
    queryKey: ["teamPageData"],
    queryFn: async () => (await api.get("/api/team")).data,
    refetchOnMount: "always",
    staleTime: 0,
  });

  // Real-time Discord Server Widget for presence sync
  const serverId = homeData?.content?.discord?.serverId || "1540761150797389915";
  const { data: discordWidget } = useQuery<DiscordWidgetData>({
    queryKey: ["discordWidgetData", serverId],
    queryFn: async () => (await api.get(`/api/discord/widget?serverId=${serverId}`)).data,
    refetchInterval: 30000,
  });

  const teamData = teamApiData?.data;
  const allMembers = teamData?.members ?? [];

  // Extract Discord IDs to subscribe to live Lanyard presence (Spotify, VS Code, rich status)
  const discordUserIds = useMemo(() => {
    return allMembers
      .map((m) => m.discordId)
      .filter((id): id is string => !!id && /^\d+$/.test(id));
  }, [allMembers]);

  const { getPresence, isMonitored } = useLanyard(discordUserIds);

  const rawCategories = [
    "All",
    ...(teamData?.categories && teamData.categories.length > 0
      ? teamData.categories
      : ["Leadership", "Development", "Moderation & Support"]),
  ];
  const categories = Array.from(new Set(rawCategories));

  // Filter members based on category and search query
  const filteredMembers = allMembers.filter((m) => {
    const matchesCategory =
      selectedCategory === "All" || m.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      m.name.toLowerCase().includes(query) ||
      m.role.toLowerCase().includes(query) ||
      m.roleShort.toLowerCase().includes(query) ||
      m.desc.toLowerCase().includes(query) ||
      (m.game && m.game.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  // Group by category if "All" is selected
  const groupedMembers = categories
    .filter((c) => c !== "All")
    .map((cat) => ({
      category: cat,
      members: filteredMembers.filter((m) => m.category === cat),
    }))
    .filter((g) => g.members.length > 0);

  const handleCopyId = async (id: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(id);
      }
      setCopiedId(true);
      toast.success(`Copied Discord ID: ${id}`);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      toast.error("Failed to copy ID");
    }
  };

  const renderStatusDot = (status: string) => {
    switch (status) {
      case "online":
        return (
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0f111a]"></span>
          </span>
        );
      case "idle":
        return (
          <span className="inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-[#0f111a]" />
        );
      case "dnd":
        return (
          <span className="inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-[#0f111a]" />
        );
      default:
        return (
          <span className="inline-flex rounded-full h-3.5 w-3.5 bg-zinc-500 border-2 border-[#0f111a]" />
        );
    }
  };

  const getActivityIcon = (game?: string) => {
    if (!game) return <Activity className="h-3 w-3" />;
    const g = game.toLowerCase();
    if (g.includes("code") || g.includes("visual studio"))
      return <Code2 className="h-3 w-3 text-cyan-400" />;
    if (g.includes("terminal") || g.includes("coding"))
      return <Terminal className="h-3 w-3 text-emerald-400" />;
    if (g.includes("database") || g.includes("hosting"))
      return <Database className="h-3 w-3 text-purple-400" />;
    if (g.includes("minecraft"))
      return <Gamepad2 className="h-3 w-3 text-green-400" />;
    return <Sparkles className="h-3 w-3 text-amber-400" />;
  };

  const renderMemberCard = (member: TeamMember) => {
    const style = colorStyles[member.color] || colorStyles.blue;
    const presence = getPresence(member.discordId);
    const live = isMonitored(member.discordId);
    const effectiveStatus = presence?.discord_status || member.status;
    const hasSpotify = presence?.listening_to_spotify && presence?.spotify;
    const customStatus = presence?.activities?.find((a) => a.type === 4);
    const gameActivity = presence?.activities?.find((a) => a.type !== 4);

    return (
      <div
        key={member.id}
        onClick={() => setSelectedMember(member)}
        className={`group relative rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 cursor-pointer flex flex-col justify-between ${style.border} ${style.bg} ${style.glow}`}
      >
        <div>
          <div className="flex items-start gap-3.5">
            {/* Avatar with Status & Live Discord Decoration Preset */}
            <LanyardAvatar
              presence={presence}
              fallbackAvatar={member.avatar}
              borderColor={style.hex}
              size="md"
            />

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap justify-between">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <h3 className="font-bold text-base text-white truncate group-hover:text-cyan-300 transition-colors">
                    {member.name}
                  </h3>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border tracking-wider uppercase ${style.badge}`}
                  >
                    {member.roleShort}
                  </span>
                </div>

                {live && (
                  <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-zinc-300 mt-0.5 truncate font-medium">
                {member.desc}
              </p>

              {/* Custom Discord Status */}
              {customStatus?.state && (
                <p className="text-[11px] text-zinc-400 italic mt-1 truncate">
                  &ldquo;{customStatus.state}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Live Activity / Spotify / Configured Game */}
        <div className="mt-3.5 pt-2.5 border-t border-white/5">
          {hasSpotify ? (
            <SpotifyPlayerCard spotify={presence!.spotify!} compact />
          ) : gameActivity ? (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 bg-black/40 border border-white/5 rounded-lg px-2.5 py-1.5 w-full truncate">
              {getActivityIcon(gameActivity.name)}
              <span className="font-semibold text-white truncate">{gameActivity.name}</span>
              {gameActivity.details && (
                <span className="text-zinc-400 truncate text-[10px]">
                  • {gameActivity.details}
                </span>
              )}
            </div>
          ) : member.game ? (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-black/40 border border-white/5 rounded-lg px-2.5 py-1.5 w-fit max-w-full">
              {getActivityIcon(member.game)}
              <span className="truncate">{member.game}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  effectiveStatus === "online"
                    ? "bg-emerald-400"
                    : effectiveStatus === "idle"
                    ? "bg-amber-400"
                    : effectiveStatus === "dnd"
                    ? "bg-rose-400"
                    : "bg-zinc-500"
                }`}
              />
              <span className="capitalize">{effectiveStatus}</span>
            </div>
          )}
        </div>
      </div>
    );
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
  const inviteLink =
    discordWidget?.instant_invite || "https://discord.com/invite/PR2x6RGf";

  return (
    <div className="min-h-screen bg-[#0a0d14] text-zinc-100 flex flex-col selection:bg-violet-600 selection:text-white">
      {/* Top Banner */}
      {homeData?.content?.announcement && (
        <AnnouncementBanner banner={homeData.content.announcement} />
      )}

      {/* Navigation */}
      <Navbar branding={branding} navigation={nav} />

      {/* Hero Header */}
      <section className="relative pt-16 pb-12 sm:pt-24 sm:pb-16 overflow-hidden">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-violet-600/15 via-cyan-500/15 to-pink-500/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="container relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-950/60 border border-cyan-500/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 shadow-sm mb-6">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>{teamData?.badge || "THE MINDS BEHIND NOVA & NOBITA CLOUD"}</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Meet Our{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              Core Team
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            {teamData?.subtitle ||
              "A collective of visionary leaders, full-stack developers, infrastructure specialists, and community architects shaping next-generation digital experiences."}
          </p>

          {/* Key Stats Bar */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 backdrop-blur-xl">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">
                {allMembers.length}
              </p>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Core Team Members
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 backdrop-blur-xl">
              <p className="text-2xl sm:text-3xl font-extrabold text-cyan-400">
                3
              </p>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Departments
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 backdrop-blur-xl">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                {discordWidget?.presence_count !== undefined
                  ? `${discordWidget.presence_count}+`
                  : "30+"}
              </p>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Online Community
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 backdrop-blur-xl">
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-400">
                99.9%
              </p>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Cloud Service SLA
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Search Toolbar */}
      <section className="sticky top-16 z-30 border-y border-white/5 bg-[#0a0d14]/90 backdrop-blur-2xl py-4">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Department Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 border ${
                    isSelected
                      ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-500/25 scale-105"
                      : "bg-zinc-900/80 text-zinc-400 border-white/5 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {cat}
                  <span className="ml-1.5 text-[10px] opacity-75">
                    ({cat === "All"
                      ? allMembers.length
                      : allMembers.filter((m) => m.category === cat).length})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member, role, skill..."
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
        </div>
      </section>

      {/* Team Members Grid */}
      <main className="flex-1 container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {isLoadingTeam ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 flex items-center gap-4 animate-pulse"
              >
                <div className="w-14 h-14 rounded-full bg-zinc-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-zinc-800 rounded" />
                  <div className="h-3 w-40 bg-zinc-800/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl">
            <Users className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No members found</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Try adjusting your category filter or search keywords.
            </p>
            <Button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
            >
              Reset Filters
            </Button>
          </div>
        ) : selectedCategory === "All" && !searchQuery ? (
          /* Grouped by Department when viewing All */
          groupedMembers.map((group) => (
            <div key={group.category} className="space-y-6">
              {/* Category Header */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                <div className="h-5 w-1.5 rounded-full bg-cyan-400" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {group.category}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/5">
                  {group.members.length} members
                </span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {group.members.map((member) => renderMemberCard(member))}
              </div>
            </div>
          ))
        ) : (
          /* Filtered or Searched Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMembers.map((member) => renderMemberCard(member))}
          </div>
        )}

        {/* Discord Live Community Members Section */}
        {discordWidget?.members && discordWidget.members.length > 0 && (
          <section className="pt-12 border-t border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  Discord Community Live Roster
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Active server members online right now. Synced directly from our Discord API.
                </p>
              </div>

              <a
                href={inviteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center gap-2 w-fit active:scale-95"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Join Official Server</span>
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {discordWidget.members.slice(0, 18).map((dm) => (
                <div
                  key={dm.id}
                  className="rounded-xl border border-white/5 bg-zinc-900/40 p-3 flex items-center gap-2.5 backdrop-blur-md hover:border-indigo-500/40 transition-colors"
                >
                  <div className="relative shrink-0">
                    <img
                      src={dm.avatar_url || "https://cdn.discordapp.com/embed/avatars/0.png"}
                      alt={dm.username}
                      className="w-8 h-8 rounded-full object-cover bg-zinc-800"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5">
                      {renderStatusDot(dm.status)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {dm.username}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {dm.game?.name || dm.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Join The Team CTA */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-violet-950/40 via-zinc-950/80 to-cyan-950/40 p-8 sm:p-12 text-center backdrop-blur-xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-950/60 border border-violet-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-violet-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Careers & Community</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Want to Build with Nova Studio?
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              We are constantly scouting talented developers, creative designers, and community leaders. Hop into our Discord server to connect with our core team.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href={inviteLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="studio" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Join Our Discord</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="/#contact">
                <Button variant="outline" className="border-white/10 text-zinc-300">
                  Contact Leadership
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Interactive Member Modal with Live Lanyard Presence */}
      <Dialog
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      >
        <DialogContent className="sm:max-w-md border-white/10 bg-zinc-950/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
          {selectedMember && (() => {
            const memberPresence = getPresence(selectedMember.discordId);
            const liveMonitored = isMonitored(selectedMember.discordId);
            const style = colorStyles[selectedMember.color] || colorStyles.blue;
            const activities = memberPresence?.activities || [];
            const nonSpotifyActivities = activities.filter(
              (a) => a.type !== 2 && a.id !== "spotify:1"
            );

            return (
              <div>
                {/* Modal Banner */}
                <div
                  className="h-28 w-full relative"
                  style={{
                    backgroundColor: style.hex || "#6366f1",
                    opacity: 0.85,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/40 to-zinc-950" />
                  {liveMonitored && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>LANYARD LIVE</span>
                    </div>
                  )}
                </div>

                {/* Profile Card Body */}
                <div className="px-6 pb-6 pt-0 relative space-y-4">
                  {/* Avatar & Badges */}
                  <div className="relative -mt-14 flex items-end justify-between">
                    <LanyardAvatar
                      presence={memberPresence}
                      fallbackAvatar={selectedMember.avatar}
                      borderColor={style.hex}
                      size="xl"
                    />

                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-lg border uppercase tracking-wider ${
                          style.badge || "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {selectedMember.roleShort}
                      </span>
                      {memberPresence && <DeviceBadges presence={memberPresence} />}
                    </div>
                  </div>

                  {/* Name & Discord Identity */}
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>{selectedMember.name}</span>
                      {memberPresence?.discord_user?.global_name &&
                        memberPresence.discord_user.global_name !== selectedMember.name && (
                          <span className="text-xs text-zinc-400 font-normal">
                            ({memberPresence.discord_user.global_name})
                          </span>
                        )}
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium">
                      {selectedMember.role} • {selectedMember.category}
                    </p>
                    {memberPresence?.discord_user?.username && (
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        @{memberPresence.discord_user.username}
                      </p>
                    )}
                  </div>

                  {/* Live Spotify Player */}
                  {memberPresence?.listening_to_spotify && memberPresence.spotify && (
                    <SpotifyPlayerCard spotify={memberPresence.spotify} />
                  )}

                  {/* Other Live Activities */}
                  {nonSpotifyActivities.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Live Discord Activity
                      </span>
                      {nonSpotifyActivities.map((act) => (
                        <ActivityCard key={act.id || act.name} activity={act} />
                      ))}
                    </div>
                  )}

                  {/* Details Card */}
                  <div className="rounded-xl border border-white/5 bg-zinc-900/60 p-4 space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        Specialization
                      </span>
                      <p className="text-zinc-200 mt-0.5 font-medium">
                        {selectedMember.desc}
                      </p>
                    </div>

                    {selectedMember.game && !nonSpotifyActivities.length && (
                      <div>
                        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                          Primary Role Focus
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-zinc-200 font-medium">
                          {getActivityIcon(selectedMember.game)}
                          <span>{selectedMember.game}</span>
                        </div>
                      </div>
                    )}

                    {selectedMember.discordId && (
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                            Discord User ID
                          </span>
                          <p className="text-zinc-300 font-mono text-[11px] mt-0.5">
                            {selectedMember.discordId}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyId(selectedMember.discordId!)}
                          className="h-7 px-2.5 text-xs gap-1 border-white/10"
                        >
                          {copiedId ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy ID</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href={inviteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button className="w-full gap-2 bg-[#5865F2] hover:bg-[#4752c4] text-white">
                        <MessageSquare className="h-4 w-4" />
                        <span>Chat on Discord</span>
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMember(null)}
                      className="border-white/10"
                    >
                      Close
                    </Button>
                  </div>
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

