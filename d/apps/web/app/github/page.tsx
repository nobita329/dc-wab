"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Github,
  Star,
  GitFork,
  GitCommit,
  Tag,
  ExternalLink,
  Copy,
  Check,
  Code2,
  Sparkles,
  Clock,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { api } from "@/lib/api";
import { Navbar } from "@/components/home/Navbar";
import { FooterSection } from "@/components/home/FooterSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { HomePageContent, BrandingSettings } from "@nova/shared";

export default function GitHubPage() {
  const [copiedClone, setCopiedClone] = useState(false);

  const { data: githubData, isLoading } = useQuery<{
    success: boolean;
    repository: any;
    config: any;
  }>({
    queryKey: ["publicGitHub"],
    queryFn: async () => (await api.get("/api/github")).data,
  });

  const { data: homeData } = useQuery<{
    success: boolean;
    content: HomePageContent;
    settings: BrandingSettings;
  }>({
    queryKey: ["homeContent"],
    queryFn: async () => (await api.get("/api/home")).data,
  });

  const repo = githubData?.repository || {
    name: "nobita329/dc-wab",
    description: "Nova Studio — Modern Creative & Engineering Studio Web Application & Multi-Database Cluster",
    html_url: "https://github.com/nobita329/dc-wab",
    stars: 142,
    forks: 38,
    default_branch: "main",
    license: "MIT",
    language: "TypeScript",
    releases: [],
    recent_commits: [],
  };

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

  const handleCopyClone = () => {
    navigator.clipboard.writeText(`git clone ${repo.html_url || "https://github.com/nobita329/dc-wab"}.git`);
    setCopiedClone(true);
    toast.success("Clone command copied to clipboard!");
    setTimeout(() => setCopiedClone(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-600 selection:text-white">
      <Navbar branding={branding as any} />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-white/5 bg-zinc-900/40 py-16 sm:py-24 text-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-zinc-700/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="container relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-6 shadow-sm">
            <Github className="h-3.5 w-3.5 text-white" />
            <span>Open Source & Engineering Showcase</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight font-mono">
            {repo.name}
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {repo.description}
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-amber-400">
              <Star className="h-3.5 w-3.5" />
              <span>{repo.stars} Stars</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300">
              <GitFork className="h-3.5 w-3.5 text-cyan-400" />
              <span>{repo.forks} Forks</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300">
              <Code2 className="h-3.5 w-3.5 text-violet-400" />
              <span>{repo.language}</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{repo.license} License</span>
            </span>
          </div>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
              <Button variant="studio" className="gap-2">
                <Github className="h-4 w-4" />
                <span>View on GitHub</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>

            <Button
              variant="outline"
              onClick={handleCopyClone}
              className="gap-2 border-white/10 hover:bg-white/5 font-mono text-xs"
            >
              {copiedClone ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>git clone repository</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Commits & Releases Grid */}
      <main className="flex-1 py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Releases */}
            <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8 backdrop-blur-md space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Tag className="h-5 w-5 text-violet-400" />
                  <span>Official Tagged Releases</span>
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Semantic version milestones deployed to production environments.
                </p>
              </div>

              <div className="space-y-4">
                {(repo.releases || []).map((rel: any) => (
                  <div
                    key={rel.id || rel.tag_name}
                    className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                        {rel.tag_name}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {new Date(rel.published_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{rel.name}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{rel.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Commits */}
            <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8 backdrop-blur-md space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <GitCommit className="h-5 w-5 text-cyan-400" />
                  <span>Recent Commit History</span>
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Continuous development stream recorded on the main branch.
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {(repo.recent_commits || []).map((c: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-zinc-200 font-medium">{c.message}</p>
                      <p className="text-[11px] text-zinc-500">by {c.author}</p>
                    </div>
                    <span className="text-[10px] bg-violet-600/10 text-violet-300 px-2 py-0.5 rounded border border-violet-500/20 shrink-0">
                      {c.sha}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterSection footer={footer} />
    </div>
  );
}

