"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { TestimonialsSection as TestimonialsType } from "@nova/shared";

interface TestimonialsSectionProps {
  testimonials: TestimonialsType;
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          {testimonials.badge && (
            <span className="inline-block rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-400 mb-3">
              {testimonials.badge}
            </span>
          )}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            {testimonials.title}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400">
            {testimonials.subtitle}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.items.map((item, index) => (
            <motion.div
              key={item.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-sm relative"
            >
              <div>
                {/* Rating stars */}
                <div className="flex items-center gap-1 mb-4 text-amber-400">
                  {Array.from({ length: item.rating || 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>

                <Quote className="h-8 w-8 text-violet-500/30 mb-2" />

                <p className="text-sm text-zinc-300 italic leading-relaxed">
                  "{item.quote}"
                </p>
              </div>

              {/* Author footer */}
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3">
                <img
                  src={item.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300"}
                  alt={item.authorName}
                  className="h-10 w-10 rounded-full object-cover border border-white/10"
                />
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {item.authorName}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {item.authorRole} • {item.authorCompany}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

