"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Sparkles,
  Target,
  Compass,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  Shield,
  Clock,
  Heart,
} from "lucide-react";
import { api } from "@/lib/api";
import { Navbar } from "@/components/home/Navbar";
import { FooterSection } from "@/components/home/FooterSection";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HomePageContent, BrandingSettings } from "@nova/shared";

export default function AboutPage() {
  const { data: aboutData, isLoading } = useQuery<{
    success: boolean;
    about: any;
  }>({
    queryKey: ["publicAbout"],
    queryFn: async () => (await api.get("/api/about")).data,
  });

  const { data: homeData } = useQuery<{
    success: boolean;
    content: HomePageContent;
    settings: BrandingSettings;
  }>({
    queryKey: ["homeContent"],
    queryFn: async () => (await api.get("/api/home")).data,
  });

  const about = aboutData?.about || {
    story: "Nova Studio is an independent creative software engineering practice founded on the belief that digital architecture should be as aesthetically transcendent as it is mathematically robust.",
    mission: "To eliminate friction between vision and engineering by delivering zero-dependency, high-velocity digital experiences.",
    vision: "To set the benchmark for modern agency craft across distributed systems, realtime tools, and bespoke interactive design.",
    yearsExperience: 6,
    projectsDelivered: 140,
    happyClients: 98,
    coreValues: [
      { title: "Craft Over Expediency", desc: "We refuse superficial shortcuts. Every layout token, SQLite query, and WebSocket handshake is engineered with intention." },
      { title: "Zero Lock-in Architecture", desc: "We prioritize file-based storage, open-source foundations, and self-hosted runtimes." },
      { title: "Absolute Transparency", desc: "No opaque black boxes. We share live system metrics, source repositories, and clear compliance policies." },
    ],
    milestones: [
      { year: "2024", title: "Nova Studio Founded", desc: "Established as an independent creative tech boutique." },
      { year: "2025", title: "100+ Enterprise Deployments", desc: "Scaled distributed applications across gaming, SaaS, and web3 ecosystems." },
      { year: "2026", title: "Nova Studio 2.0 Monorepo", desc: "Launched unified Next.js 15 App Router architecture with 9 multi-database SQLite clusters." },
    ],
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-600 selection:text-white">
      <Navbar branding={branding as any} />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-white/5 bg-zinc-900/40 py-16 sm:py-24 text-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="container relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-300 mb-6 shadow-sm">
            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
            <span>Philosophy, Ethos & Heritage</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Crafting digital worlds with mathematical precision.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {about.story}
          </p>

          {/* Quick Stats Ticker */}
          <div className="mt-12 grid grid-cols-3 max-w-2xl mx-auto gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-white/10 shadow-xl backdrop-blur-md">
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold text-white">
                {about.yearsExperience || about.years_experience || 6}+
              </span>
              <p className="text-xs text-zinc-400 uppercase font-mono mt-1">Years Active</p>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400">
                {about.projectsDelivered || about.projects_delivered || 140}+
              </span>
              <p className="text-xs text-zinc-400 uppercase font-mono mt-1">Projects Built</p>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                {about.happyClients || about.happy_clients || 98}%
              </span>
              <p className="text-xs text-zinc-400 uppercase font-mono mt-1">Client Retention</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <main className="flex-1 py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 sm:p-10 backdrop-blur-md space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/15 text-violet-400 border border-violet-500/20">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">Our Mission</h3>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                {about.mission}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 sm:p-10 backdrop-blur-md space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                <Compass className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">Our Vision</h3>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                {about.vision}
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold text-white">Our Core Principles</h2>
              <p className="mt-2 text-sm text-zinc-400">
                The non-negotiable architectural standards guiding every release.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(Array.isArray(about.coreValues) ? about.coreValues : []).map((val: any, idx: number) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-white/10 bg-zinc-900/30 backdrop-blur-sm space-y-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-cyan-400 font-mono font-bold text-xs">
                    0{idx + 1}
                  </div>
                  <h4 className="text-base font-bold text-white">{val.title}</h4>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Heritage Timeline */}
          <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 sm:p-12 backdrop-blur-md space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2.5">
                <Clock className="h-5 w-5 text-violet-400" />
                <span>Studio Milestones & Timeline</span>
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                Our evolution from specialized boutique to full-scale platform ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              {(Array.isArray(about.milestones) ? about.milestones : []).map((m: any, idx: number) => (
                <div key={idx} className="space-y-2 border-l-2 border-violet-500/30 pl-4 py-1">
                  <span className="text-xs font-mono font-bold text-cyan-400">{m.year}</span>
                  <h4 className="text-sm font-bold text-white">{m.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Collaboration CTA */}
          <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-950/40 via-zinc-900/70 to-indigo-950/40 p-8 sm:p-12 text-center space-y-6">
            <h3 className="text-3xl font-extrabold text-white">Ready to partner with Nova Studio?</h3>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto">
              Meet our guild members or book an introductory discovery sprint for your next milestone.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href="/team">
                <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
                  <Users className="h-4 w-4" />
                  <span>Meet The Team</span>
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="studio" className="gap-2">
                  <span>Start A Project</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <FooterSection footer={footer} />
    </div>
  );
}

