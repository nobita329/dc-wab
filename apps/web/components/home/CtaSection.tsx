"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail, Sparkles } from "lucide-react";
import { CtaSection as CtaType } from "@nova/shared";
import { Button } from "@/components/ui/button";

interface CtaSectionProps {
  cta: CtaType;
}

export function CtaSection({ cta }: CtaSectionProps) {
  return (
    <section id="contact" className="relative py-24 sm:py-32 overflow-hidden border-t border-white/5">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-600/20 to-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-10 sm:p-16 text-center shadow-2xl relative overflow-hidden backdrop-blur-xl"
        >
          {cta.badge && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              {cta.badge}
            </span>
          )}

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            {cta.headline}
          </h2>

          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {cta.description}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {cta.buttonText && (
              <a href={cta.buttonHref || "#"} className="w-full sm:w-auto">
                <Button size="lg" variant="studio" className="w-full sm:w-auto gap-2 px-8 py-6 rounded-xl font-semibold shadow-lg shadow-violet-600/30">
                  <span>{cta.buttonText}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            )}

            {cta.secondaryButtonText && (
              <a href={cta.secondaryButtonHref || "mailto:hello@novastudio.agency"} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 px-8 py-6 rounded-xl font-semibold border-white/10 hover:bg-white/5">
                  <Mail className="h-4 w-4 text-violet-400" />
                  <span>{cta.secondaryButtonText}</span>
                </Button>
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

