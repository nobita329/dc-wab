"use client";

import { motion } from "framer-motion";
import { StatsSection as StatsType } from "@nova/shared";

interface StatsSectionProps {
  stats: StatsType;
}

export function StatsSection({ stats }: StatsSectionProps) {
  if (!stats.items || stats.items.length === 0) return null;

  return (
    <section className="relative border-y border-white/5 bg-zinc-950/50 py-16">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {stats.items.map((item, index) => (
            <motion.div
              key={item.id || index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center pt-6 md:pt-0 px-4 first:pt-0"
            >
              <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                {item.value}
              </span>
              <span className="mt-2 text-sm font-semibold text-violet-400">
                {item.label}
              </span>
              <span className="mt-1 text-xs text-zinc-500 max-w-[180px]">
                {item.description}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

