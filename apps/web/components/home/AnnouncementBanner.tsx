"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { AnnouncementBanner as AnnouncementType } from "@nova/shared";

interface AnnouncementBannerProps {
  banner: AnnouncementType;
}

export function AnnouncementBanner({ banner }: AnnouncementBannerProps) {
  if (!banner.enabled || !banner.text) return null;

  return (
    <aside aria-label="Announcement" className="relative z-30 border-b border-violet-500/20 bg-gradient-to-r from-violet-950/80 via-zinc-950 to-indigo-950/80 py-2.5 px-4 text-center">
      <div className="container mx-auto flex items-center justify-center gap-2.5 text-xs sm:text-sm font-medium text-zinc-200">
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300 border border-violet-500/30">
          <Sparkles className="h-3 w-3 text-cyan-400" />
          {banner.badge}
        </span>
        <span className="truncate max-w-md sm:max-w-xl">{banner.text}</span>
        {banner.linkText && banner.linkHref && (
          <a
            href={banner.linkHref}
            className="inline-flex items-center gap-1 font-semibold text-cyan-400 hover:text-cyan-300 underline-offset-4 hover:underline ml-1"
          >
            <span>{banner.linkText}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </aside>
  );
}

