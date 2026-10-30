"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FolderGit2,
  ExternalLink,
  Github,
  Sparkles,
  ArrowRight,
  Star,
  Layers,
} from "lucide-react";
import { api } from "@/lib/api";
import { Navbar } from "@/components/home/Navbar";
import { FooterSection } from "@/components/home/FooterSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HomePageContent, BrandingSettings } from "@nova/shared";

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: projectsData, isLoading } = useQuery<{
    success: boolean;
    projects: any[];
  }>({
    queryKey: ["publicProjects"],
    queryFn: async () => (await api.get("/api/projects")).data,
  });

  const { data: homeData } = useQuery<{
    success: boolean;
    content: HomePageContent;
    settings: BrandingSettings;
  }>({
    queryKey: ["homeContent"],
    queryFn: async () => (await api.get("/api/home")).data,
  });

  const projects = projectsData?.projects || [];
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

  const categories = [
    "All",
    ...Array.from(new Set(projects.map((p) => p.category).filter(Boolean))),
  ];

  const filtered =
    selectedCategory === "All"
      ? projects
      : projects.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-600 selection:text-white">
      <Navbar branding={branding as any} />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-white/5 bg-zinc-900/40 py-16 sm:py-24 text-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="container relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Curated Engineering & Design Lab</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Featured architecture, tools & web apps.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Explore our open portfolio of full-stack monorepos, SQLite database coordinators, and design systems.
          </p>

          {/* Category Filters */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                    : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <main className="flex-1 py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Skeleton className="h-80 bg-zinc-900 rounded-3xl" />
              <Skeleton className="h-80 bg-zinc-900 rounded-3xl" />
              <Skeleton className="h-80 bg-zinc-900 rounded-3xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((project: any) => {
                const tags: string[] = Array.isArray(project.tags)
                  ? project.tags
                  : typeof project.tags === "string"
                  ? JSON.parse(project.tags || "[]")
                  : [];

                return (
                  <div
                    key={project.id}
                    className="group rounded-3xl border border-white/10 bg-zinc-900/40 overflow-hidden hover:border-violet-500/40 transition-all duration-300 flex flex-col justify-between shadow-xl backdrop-blur-md"
                  >
                    <div>
                      {/* Image Header */}
                      <div className="relative h-48 w-full overflow-hidden bg-zinc-950">
                        <img
                          src={project.image_url || project.imageUrl || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800"}
                          alt={project.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="text-[10px] font-semibold uppercase tracking-wider bg-black/60 backdrop-blur-md text-cyan-300 px-2.5 py-1 rounded-full border border-white/10">
                            {project.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {project.title}
                        </h3>

                        <p className="mt-2 text-xs sm:text-sm text-zinc-400 line-clamp-3 leading-relaxed">
                          {project.description}
                        </p>

                        {/* Tags */}
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="text-[10px] font-mono bg-white/[0.03] text-zinc-400 px-2 py-0.5 rounded border border-white/5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-6 pt-0 border-t border-white/5 flex items-center justify-between mt-4">
                      {project.demo_url || project.demoUrl ? (
                        <Link href={project.demo_url || project.demoUrl}>
                          <Button variant="studio" size="sm" className="h-8 gap-1.5 text-xs">
                            <span>Live Showcase</span>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      ) : (
                        <span />
                      )}

                      {(project.github_url || project.githubUrl) && (
                        <a
                          href={project.github_url || project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-zinc-400 hover:text-white">
                            <Github className="h-3.5 w-3.5" />
                            <span>Code</span>
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <FooterSection footer={footer} />
    </div>
  );
}

