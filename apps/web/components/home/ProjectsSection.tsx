"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ProjectsSection as ProjectsType } from "@nova/shared";

interface ProjectsSectionProps {
  projects: ProjectsType;
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <section id="projects" className="relative py-24 sm:py-32 bg-zinc-950/70 border-t border-white/5">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            {projects.badge && (
              <span className="inline-block rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3">
                {projects.badge}
              </span>
            )}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
              {projects.title}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-2xl">
              {projects.subtitle}
            </p>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.items.map((project, index) => (
            <motion.div
              key={project.id || index}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative flex flex-col rounded-2xl border border-white/10 bg-zinc-900/50 overflow-hidden hover:border-violet-500/40 transition-all duration-300"
            >
              {/* Image Preview Container */}
              <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-zinc-900">
                <img
                  src={project.imageUrl || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200"}
                  alt={project.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />

                {/* Category badge */}
                <span className="absolute top-4 left-4 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-xs font-medium text-zinc-300">
                  {project.category}
                </span>

                {/* External link button */}
                <div className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-violet-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/5">
                    {project.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="rounded-md bg-zinc-800/80 px-2.5 py-1 text-[11px] font-medium text-zinc-300 border border-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

