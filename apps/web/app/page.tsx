"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { HomePageContent, BrandingSettings, SocialLink, SeoSettings } from "@nova/shared";
import { Navbar } from "@/components/home/Navbar";
import { AnnouncementBanner } from "@/components/home/AnnouncementBanner";
import { HeroSection } from "@/components/home/HeroSection";
import { CommandSection } from "@/components/home/CommandSection";
import { SocialCardsSection } from "@/components/home/SocialCardsSection";
import { StatsSection } from "@/components/home/StatsSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { ProjectsSection } from "@/components/home/ProjectsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { DiscordSection } from "@/components/home/DiscordSection";
import { CtaSection } from "@/components/home/CtaSection";
import { FooterSection } from "@/components/home/FooterSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface HomeApiResponse {
  success: boolean;
  content: HomePageContent;
  settings: BrandingSettings;
  seo: SeoSettings;
  socials: SocialLink[];
}

export default function HomePage() {
  // Real-time WebSocket connection to receive live publish notifications
  useWebSocket();

  const { data, isLoading, isError, error, refetch } = useQuery<HomeApiResponse>({
    queryKey: ["homeContent"],
    queryFn: async () => {
      const res = await api.get("/api/home");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between">
        <header className="h-16 border-b border-white/5 flex items-center px-8 justify-between">
          <Skeleton className="h-8 w-36 bg-zinc-800" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-20 bg-zinc-800" />
            <Skeleton className="h-8 w-20 bg-zinc-800" />
            <Skeleton className="h-8 w-24 bg-zinc-800" />
          </div>
        </header>

        <main className="container mx-auto max-w-4xl px-4 py-24 flex flex-col items-center space-y-8">
          <Skeleton className="h-6 w-48 rounded-full bg-zinc-800" />
          <Skeleton className="h-16 w-full max-w-2xl bg-zinc-800" />
          <Skeleton className="h-6 w-3/4 max-w-xl bg-zinc-800" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-12 w-36 rounded-xl bg-zinc-800" />
            <Skeleton className="h-12 w-36 rounded-xl bg-zinc-800" />
          </div>
        </main>

        <footer className="h-20 border-t border-white/5" />
      </div>
    );
  }

  if (isError || !data?.content) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-zinc-900/60 p-8 text-center backdrop-blur-xl">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Failed to Load Nova Studio</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {(error as any)?.message || "Unable to retrieve content from backend API on port 3002."}
          </p>
          <Button
            onClick={() => refetch()}
            className="mt-6 gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        </div>
      </div>
    );
  }

  const { content, settings, socials } = data;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-600 selection:text-white">
      {/* Announcement Banner */}
      <AnnouncementBanner banner={content.announcement} />

      {/* Navigation */}
      <Navbar branding={settings} navigation={content.navigation} />

      {/* Main Content Sections */}
      <main className="flex-1">
        <HeroSection hero={content.hero} />
        <CommandSection commandSection={content.commandSection} />
        <SocialCardsSection socialCards={content.socialCards} discordServerId={content.discord?.serverId} />
        <StatsSection stats={content.stats} />
        <ServicesSection services={content.services} />
        <ProjectsSection projects={content.projects} />
        <TestimonialsSection testimonials={content.testimonials} />
        <DiscordSection discord={content.discord} />
        <CtaSection cta={content.cta} />
      </main>

      {/* Footer */}
      <FooterSection
        footer={content.footer}
        socials={socials}
        logoText={settings.logoText}
      />
    </div>
  );
}

