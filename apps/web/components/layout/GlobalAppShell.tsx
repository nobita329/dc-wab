"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { SiteSettings } from "@nova/shared";
import { Sparkles, ArrowRight, X } from "lucide-react";

export function GlobalAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [motdDismissed, setMotdDismissed] = useState(false);

  const { data } = useQuery<{ success: boolean; settings: SiteSettings }>({
    queryKey: ["siteSettings"],
    queryFn: async () => (await api.get("/api/settings")).data,
    staleTime: 1000 * 30,
  });

  const branding = data?.settings?.branding;
  const panelName = branding?.panelName || branding?.siteTitle || "Nova Studio";
  const panelFaviconName = branding?.panelFaviconName || "";
  const panelFaviconLogo = branding?.panelFaviconLogo || branding?.faviconUrl || "/favicon.ico";
  const panelMotd = branding?.panelMotd || "";
  const panelMotdEnabled = branding?.panelMotdEnabled !== false;
  const panelMotdImage = branding?.panelMotdImage || "";
  const panelMotdLink = branding?.panelMotdLink || "";

  const backgroundType = branding?.backgroundType || "image";
  const backgroundUrl = branding?.backgroundUrl || "";
  const backgroundOpacity = (branding?.backgroundOpacity ?? 100) / 100;
  const panelTransparency = (branding?.panelTransparency ?? 35) / 100;
  const panelBlur = branding?.panelBlur ?? 16;
  const surfaceAlpha = Math.max(0.12, 1 - panelTransparency);

  // Dynamically update document title and favicon in browser tab
  useEffect(() => {
    if (panelFaviconLogo) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement("link");
        link.type = "image/x-icon";
        link.rel = "shortcut icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = panelFaviconLogo;
    }

    if (panelName) {
      document.title = panelFaviconName
        ? `${panelName} — ${panelFaviconName}`
        : `${panelName} — Elite Engineering & Creative System`;
    }
  }, [panelFaviconLogo, panelName, panelFaviconName]);

  const isAdmin = pathname.startsWith("/admin");
  const showMotd = panelMotdEnabled && Boolean(panelMotd) && !motdDismissed && !isAdmin;

  return (
    <div
      className="relative min-h-screen text-zinc-100 antialiased overflow-x-hidden selection:bg-violet-500 selection:text-white"
      style={{
        backgroundColor: backgroundUrl ? "transparent" : "#09090b",
      }}
    >
      {/* Background Wallpaper / Video Layer (Applies to both normal & admin) */}
      {backgroundType === "image" && backgroundUrl && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none"
          style={{
            backgroundImage: `url(${backgroundUrl})`,
            opacity: backgroundOpacity,
          }}
        />
      )}

      {backgroundType === "video" && backgroundUrl && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 z-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none"
          style={{
            opacity: backgroundOpacity,
          }}
          src={backgroundUrl}
        />
      )}

      {backgroundType === "color" && backgroundUrl && (
        <div
          className="fixed inset-0 z-0 transition-colors duration-700 pointer-events-none"
          style={{
            backgroundColor: backgroundUrl,
            opacity: backgroundOpacity,
          }}
        />
      )}

      {/* Glassmorphism Tint & Backdrop Blur Overlay */}
      {backgroundUrl && (
        <div
          className="fixed inset-0 z-0 pointer-events-none transition-all duration-500"
          style={{
            backgroundColor: `rgba(9, 9, 11, ${surfaceAlpha})`,
            backdropFilter: `blur(${panelBlur}px)`,
            WebkitBackdropFilter: `blur(${panelBlur}px)`,
          }}
        />
      )}

      {/* Global MOTD Announcement Banner (Public normal site) */}
      {showMotd && (
        <div className="relative z-50 border-b border-violet-500/30 bg-gradient-to-r from-violet-950/90 via-zinc-950/90 to-indigo-950/90 backdrop-blur-xl px-4 py-2.5 shadow-lg shadow-violet-900/20 text-xs text-white">
          <div className="container mx-auto flex items-center justify-between gap-3 max-w-7xl">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {panelMotdImage ? (
                <img
                  src={panelMotdImage}
                  alt="MOTD"
                  className="h-6 w-6 rounded-md object-cover border border-violet-400/30 shrink-0 shadow-sm"
                />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-600/30 border border-violet-400/40 text-violet-300 shrink-0">
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                </span>
              )}
              <span className="font-semibold text-violet-300 uppercase tracking-wider text-[10px] hidden sm:inline">
                MOTD:
              </span>
              <p className="truncate font-medium text-zinc-200 text-xs sm:text-sm">{panelMotd}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {panelMotdLink && (
                <a
                  href={panelMotdLink}
                  className="inline-flex items-center gap-1 font-semibold text-xs text-cyan-400 hover:text-cyan-300 underline-offset-4 hover:underline"
                >
                  <span>Learn More</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setMotdDismissed(true)}
                className="h-6 w-6 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                title="Dismiss MOTD"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
