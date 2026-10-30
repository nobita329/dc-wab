"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  TutorialItem,
  TutorialPageData,
  HomePageContent,
  BrandingSettings,
  SocialLink,
} from "@nova/shared";
import { Navbar } from "@/components/home/Navbar";
import { AnnouncementBanner } from "@/components/home/AnnouncementBanner";
import { FooterSection } from "@/components/home/FooterSection";
import {
  Youtube,
  Play,
  Search,
  Sparkles,
  Eye,
  ThumbsUp,
  Clock,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Filter,
  Tv,
  Layers,
  CheckCircle2,
  BookmarkCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function TutorialsPage() {
  // Connect to live WebSocket for real-time tutorial updates
  useWebSocket();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeVideo, setActiveVideo] = useState<TutorialItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch Home page content for Navbar and Footer branding
  const { data: homeData } = useQuery<{
    success: boolean;
    content: HomePageContent;
    settings: BrandingSettings;
    socials: SocialLink[];
  }>({
    queryKey: ["homeContent"],
    queryFn: async () => (await api.get("/api/home")).data,
  });

  // Fetch live Tutorials data directly from tutorials.db
  const { data: tutorialApiData, isLoading } = useQuery<{
    success: boolean;
    data: TutorialPageData;
  }>({
    queryKey: ["tutorialPageData"],
    queryFn: async () => (await api.get("/api/tutorials")).data,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const pageData = tutorialApiData?.data;
  const settings = pageData?.settings || {
    channelName: "Nova Studio",
    channelId: "",
    title: "Master Modern Development & Cloud Architecture",
    badge: "OFFICIAL VIDEO GUIDES & MASTERCLASSES",
    subtitle:
      "Explore comprehensive tutorials on Discord bot engineering, cloud infrastructure, full-stack Next.js systems, and Minecraft server development.",
    subscriberCount: "12.4K",
    videoCount: "48",
    viewCount: "350K",
    avatarUrl: "",
    bannerUrl: "",
    customUrl: "@NovaStudioHQ",
  };

  const tutorials = pageData?.tutorials || [];
  const categories = pageData?.categories || ["All", "Discord Bots", "Hosting & Cloud", "Development", "Minecraft Dev"];

  // Filter tutorials by category and search
  const filteredTutorials = useMemo(() => {
    return tutorials.filter((item) => {
      const matchesCat =
        selectedCategory === "All" || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [tutorials, selectedCategory, searchQuery]);

  // Featured tutorial (first featured or newest)
  const featuredTutorial = useMemo(() => {
    return tutorials.find((t) => t.featured) || tutorials[0];
  }, [tutorials]);

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

  const handleShareVideo = (video: TutorialItem) => {
    const url = `https://www.youtube.com/watch?v= ${video.youtubeVideoId}`.replace(" ", "");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("YouTube video link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getSubscribeUrl = () => {
    if (settings.channelId) {
      return `https://www.youtube.com/channel/${settings.channelId}?sub_confirmation=1`;
    }
    if (settings.customUrl) {
      const handle = settings.customUrl.startsWith("@")
        ? settings.customUrl
        : `@${settings.customUrl}`;
      return `https://www.youtube.com/${handle}?sub_confirmation=1`;
    }
    return "https://www.youtube.com";
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-zinc-100 flex flex-col selection:bg-red-600 selection:text-white">
      {/* Top Banner */}
      {homeData?.content?.announcement && (
        <AnnouncementBanner banner={homeData.content.announcement} />
      )}

      {/* Navigation */}
      <Navbar branding={branding} navigation={nav} />

      {/* Hero Header */}
      <section className="relative pt-16 pb-12 sm:pt-20 sm:pb-16 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[360px] bg-gradient-to-r from-red-600/15 via-violet-600/15 to-cyan-500/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="container relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-red-950/60 border border-red-500/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-red-400 shadow-sm mb-6">
            <Youtube className="h-4 w-4 text-red-500 fill-red-500" />
            <span>{settings.badge || "OFFICIAL VIDEO GUIDES & TUTORIALS"}</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Level Up With{" "}
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              Video Tutorials
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            {settings.subtitle ||
              "Explore comprehensive tutorials on Discord bot engineering, cloud infrastructure, full-stack Next.js systems, and Minecraft server development."}
          </p>

          {/* YouTube Channel Stats Banner */}
          <div className="mt-10 max-w-3xl mx-auto rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:p-5 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-left">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center p-0.5 shadow-md">
                  {settings.avatarUrl ? (
                    <img
                      src={settings.avatarUrl}
                      alt={settings.channelName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Youtube className="h-6 w-6 text-white fill-white" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-white text-base">
                    {settings.channelName || "Nova Studio"}
                  </h3>
                  <CheckCircle2 className="h-4 w-4 text-zinc-400 fill-zinc-400 text-zinc-900" />
                </div>
                <p className="text-xs text-zinc-400 font-mono">
                  {settings.customUrl || "@NovaStudioHQ"}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-4 sm:gap-6 text-center">
              <div>
                <p className="text-sm sm:text-base font-extrabold text-white">
                  {settings.subscriberCount || "10K+"}
                </p>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  Subscribers
                </p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="text-sm sm:text-base font-extrabold text-white">
                  {settings.videoCount || `${tutorials.length}+`}
                </p>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  Videos
                </p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <p className="text-sm sm:text-base font-extrabold text-white">
                  {settings.viewCount || "350K+"}
                </p>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  Total Views
                </p>
              </div>
            </div>

            {/* Subscribe Button */}
            <a
              href={getSubscribeUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 w-full sm:w-auto"
            >
              <Button className="w-full sm:w-auto gap-2 bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/25 active:scale-95 transition-transform">
                <Youtube className="h-4 w-4 fill-white" />
                <span>Subscribe</span>
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20 space-y-12">
        {/* Featured Video Spotlight */}
        {featuredTutorial && !searchQuery && selectedCategory === "All" && (
          <div
            onClick={() => setActiveVideo(featuredTutorial)}
            className="group relative rounded-3xl border border-red-500/20 bg-gradient-to-r from-red-950/40 via-zinc-950/80 to-zinc-950/90 p-5 sm:p-7 backdrop-blur-xl shadow-2xl cursor-pointer hover:border-red-500/40 transition-all overflow-hidden"
          >
            {/* Glow accent */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Thumbnail Container */}
              <div className="lg:col-span-7 relative rounded-2xl overflow-hidden aspect-video bg-zinc-900 border border-white/10 group-hover:shadow-2xl transition-shadow">
                <img
                  src={featuredTutorial.thumbnailUrl}
                  alt={featuredTutorial.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="h-7 w-7 fill-white translate-x-0.5" />
                  </div>
                </div>
                {/* Duration badge */}
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[11px] font-mono font-bold text-white">
                  {featuredTutorial.duration}
                </div>
                {/* Category badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-red-600 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                  Featured Masterclass
                </div>
              </div>

              {/* Info Container */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                  {featuredTutorial.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-red-300 transition-colors leading-snug">
                  {featuredTutorial.title}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed">
                  {featuredTutorial.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-zinc-400 pt-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{featuredTutorial.viewCount.toLocaleString()} views</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{featuredTutorial.likeCount.toLocaleString()} likes</span>
                  </span>
                </div>

                <div className="pt-2">
                  <Button
                    size="sm"
                    className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Watch Tutorial Now</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const count =
                cat === "All"
                  ? tutorials.length
                  : tutorials.filter((t) => t.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                      : "bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === cat
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

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tutorial, tag, topic..."
              className="pl-10 h-10 bg-zinc-900/80 border-white/10 text-xs text-zinc-100 placeholder:text-zinc-500 rounded-xl focus:border-red-500/50"
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

        {/* Video Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 space-y-3 animate-pulse"
              >
                <div className="aspect-video bg-zinc-800 rounded-xl" />
                <div className="h-4 w-3/4 bg-zinc-800 rounded" />
                <div className="h-3 w-full bg-zinc-800/60 rounded" />
              </div>
            ))}
          </div>
        ) : filteredTutorials.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl">
            <Tv className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No tutorials found</h3>
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
              className="mt-4 gap-2 border-white/10"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((video) => (
              <div
                key={video.id}
                onClick={() => setActiveVideo(video)}
                className="group rounded-2xl border border-white/5 bg-zinc-900/40 hover:border-red-500/30 hover:bg-zinc-900/70 p-4 backdrop-blur-xl transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-lg hover:shadow-red-950/20"
              >
                <div className="space-y-3">
                  {/* Thumbnail Container */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-950 border border-white/10 group-hover:scale-[1.02] transition-transform duration-300">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 fill-white translate-x-0.5" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-white">
                      {video.duration}
                    </div>

                    {/* Category Tag */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-zinc-900/80 backdrop-blur-md text-[10px] font-bold text-red-300 border border-red-500/20">
                      {video.category}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-red-300 transition-colors line-clamp-2 leading-snug">
                      {video.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {video.description}
                    </p>
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3 text-zinc-500" />
                      <span>{video.viewCount.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3 text-zinc-500" />
                      <span>{video.likeCount.toLocaleString()}</span>
                    </span>
                  </div>

                  <span className="text-[10px] font-medium text-zinc-500">
                    {new Date(video.publishedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Interactive YouTube Video Player Modal */}
      <Dialog open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
        <DialogContent className="sm:max-w-4xl border-white/10 bg-zinc-950/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          {activeVideo && (
            <div>
              {/* Responsive IFrame Embed */}
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeVideoId}?autoplay=1&rel=0`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              {/* Video Details & Actions */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                        {activeVideo.category}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        Duration: {activeVideo.duration}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {activeVideo.title}
                    </h2>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareVideo(activeVideo)}
                      className="gap-1.5 h-8 text-xs border-white/10"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3.5 w-3.5" />
                          <span>Share</span>
                        </>
                      )}
                    </Button>

                    <a
                      href={`https://www.youtube.com/watch?v=${activeVideo.youtubeVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="gap-1.5 h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-bold"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>YouTube</span>
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-4 text-xs text-zinc-400 py-2 border-y border-white/5">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-zinc-400" />
                    <span>{activeVideo.viewCount.toLocaleString()} views</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="h-4 w-4 text-zinc-400" />
                    <span>{activeVideo.likeCount.toLocaleString()} likes</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    <span>
                      Published{" "}
                      {new Date(activeVideo.publishedAt).toLocaleDateString()}
                    </span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-zinc-300 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                  {activeVideo.description || "No description provided."}
                </p>

                {/* Tags */}
                {activeVideo.tags && activeVideo.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2">
                    {activeVideo.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
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
