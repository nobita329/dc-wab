"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Link2,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Github,
  MessageSquare,
  Youtube,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { Navbar } from "@/components/home/Navbar";
import { FooterSection } from "@/components/home/FooterSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { HomePageContent, BrandingSettings } from "@nova/shared";

const iconMap: Record<string, any> = {
  Github: Github,
  MessageSquare: MessageSquare,
  Youtube: Youtube,
  BookOpen: BookOpen,
  Globe: Globe,
};

export default function LinksPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: linksData, isLoading } = useQuery<{
    success: boolean;
    links: any[];
  }>({
    queryKey: ["publicLinks"],
    queryFn: async () => (await api.get("/api/links")).data,
  });

  const { data: homeData } = useQuery<{
    success: boolean;
    content: HomePageContent;
    settings: BrandingSettings;
  }>({
    queryKey: ["homeContent"],
    queryFn: async () => (await api.get("/api/home")).data,
  });

  const links = linksData?.links || [];
  const branding = homeData?.settings || {
    logoText: "NOVA STUDIO",
    siteTitle: "Nova Studio",
    siteTagline: "Next-gen Digital Architecture",
    primaryColor: "#8b5cf6",
    accentColor: "#06b6d4",
  };
  const footer = homeData?.content?.footer || {
    copyrightText: `© ${new Date().getFullYear()} Nova Studio. All rights reserved.`,
    description: "Nova Studio is an independent digital design & software engineering practice.",
    columns: [],
  };

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-600 selection:text-white">
      <Navbar branding={branding as any} />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-white/5 bg-zinc-900/40 py-16 sm:py-24 text-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="container relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-300 mb-6 shadow-sm">
            <Link2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Curated Directory & Quick Links</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Connect to the Nova Studio ecosystem.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Essential hubs, community channels, repositories, and documentation shortcuts in one unified directory.
          </p>
        </div>
      </section>

      {/* Links List */}
      <main className="flex-1 py-16 sm:py-24">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 bg-zinc-900 rounded-2xl" />
              <Skeleton className="h-24 bg-zinc-900 rounded-2xl" />
              <Skeleton className="h-24 bg-zinc-900 rounded-2xl" />
            </div>
          ) : (
            links.map((link: any) => {
              const Icon = iconMap[link.icon] || Globe;
              const isCopied = copiedId === link.id;

              return (
                <div
                  key={link.id}
                  className="group p-5 sm:p-6 rounded-2xl border border-white/10 bg-zinc-900/40 hover:border-violet-500/40 hover:bg-zinc-900/70 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/15 text-violet-400 border border-violet-500/20 group-hover:scale-105 transition-transform shrink-0">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {link.title}
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase px-2 py-0.5 rounded bg-white/[0.03] border border-white/5">
                          {link.category}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                        {link.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(link.id, link.url)}
                      className="h-9 w-9 text-zinc-400 hover:text-white border border-white/5 hover:bg-white/5"
                      title="Copy URL"
                    >
                      {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </Button>

                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="studio" size="sm" className="gap-1.5 h-9 text-xs px-4">
                        <span>Visit Resource</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <FooterSection footer={footer} />
    </div>
  );
}

