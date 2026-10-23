"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Sparkles, CheckCircle2 } from "lucide-react";
import { HeroSection as HeroType } from "@nova/shared";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  hero: HeroType;
}

export function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section id="overview" className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36">
      {/* Background radial glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        {hero.badge && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-violet-300 uppercase mb-8 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>{hero.badge}</span>
          </motion.div>
        )}

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.08]"
        >
          {hero.headline}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed"
        >
          {hero.subheadline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {hero.primaryCtaText && (
            <a href={hero.primaryCtaHref || "#contact"} className="w-full sm:w-auto">
              <Button size="lg" variant="studio" className="w-full sm:w-auto gap-2 text-base px-8 py-6 rounded-xl font-semibold shadow-xl shadow-violet-600/25">
                <span>{hero.primaryCtaText}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          )}
          {hero.secondaryCtaText && (
            <a href={hero.secondaryCtaHref || "#projects"} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 text-base px-8 py-6 rounded-xl font-semibold border-white/10 hover:bg-white/5">
                <span>{hero.secondaryCtaText}</span>
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              </Button>
            </a>
          )}
        </motion.div>

        {/* Trust pill */}
        {hero.showClientCount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-900/60 backdrop-blur-md px-4 py-2 text-xs text-zinc-400"
          >
            <div className="flex -space-x-1.5 overflow-hidden">
              <span className="inline-block h-5 w-5 rounded-full ring-2 ring-zinc-950 bg-gradient-to-tr from-violet-500 to-indigo-500" />
              <span className="inline-block h-5 w-5 rounded-full ring-2 ring-zinc-950 bg-gradient-to-tr from-cyan-500 to-blue-500" />
              <span className="inline-block h-5 w-5 rounded-full ring-2 ring-zinc-950 bg-gradient-to-tr from-emerald-500 to-teal-500" />
            </div>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 ml-1" />
            <span>{hero.clientCountText}</span>
          </motion.div>
        )}
      </div>
    </section>
  );
}

