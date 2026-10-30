"use client";

import { motion } from "framer-motion";
import {
  Layers,
  Code2,
  Sparkles,
  Gauge,
  Zap,
  Globe,
  Palette,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import { ServicesSection as ServicesType } from "@nova/shared";

interface ServicesSectionProps {
  services: ServicesType;
}

const iconMap: Record<string, LucideIcon> = {
  Layers,
  Code2,
  Sparkles,
  Gauge,
  Zap,
  Globe,
  Palette,
  Cpu,
};

export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section id="services" className="relative py-24 sm:py-32">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          {services.badge && (
            <span className="inline-block rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-400 mb-3">
              {services.badge}
            </span>
          )}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            {services.title}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400">
            {services.subtitle}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {services.items.map((item, index) => {
            const IconComponent = iconMap[item.icon] || Sparkles;

            return (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative rounded-2xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-sm transition-all duration-300 hover:border-violet-500/40 hover:bg-zinc-900/70 hover:shadow-2xl hover:shadow-violet-500/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300">
                  <IconComponent className="h-6 w-6" />
                </div>

                <h3 className="mt-6 text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                  {item.description}
                </p>

                {item.highlight && (
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500 group-hover:text-cyan-400 transition-colors">
                      {item.highlight}
                    </span>
                    <span className="text-xs font-semibold text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn more →
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

