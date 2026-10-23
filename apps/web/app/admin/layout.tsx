"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useWebSocket } from "@/hooks/useWebSocket";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteSettings } from "@nova/shared";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Keep WebSocket connection active for live updates
  useWebSocket();

  // Query site settings to apply dynamic background, transparency, and blur
  const { data: settingsData } = useQuery<{ success: boolean; settings: SiteSettings }>({
    queryKey: ["siteSettings"],
    queryFn: async () => (await api.get("/api/admin/settings")).data,
    enabled: isAuthenticated,
  });

  const branding = settingsData?.settings?.branding;
  const bgType = branding?.backgroundType || "image";
  const bgUrl = branding?.backgroundUrl;
  const bgOpacity = (branding?.backgroundOpacity ?? 100) / 100;
  const panelTransparency = (branding?.panelTransparency ?? 35) / 100;
  const panelBlur = branding?.panelBlur ?? 16;
  const surfaceAlpha = Math.max(0.12, 1 - panelTransparency);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push("/admin/login?redirect=" + encodeURIComponent(pathname));
    }
  }, [isLoading, isAuthenticated, isLoginPage, pathname, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-zinc-950 text-white items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="text-sm text-zinc-400">Verifying admin session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div
      className="relative flex min-h-screen text-zinc-100 overflow-x-hidden"
      style={{
        backgroundColor: bgUrl ? "transparent" : "#09090b",
      }}
    >
      {/* Background Wallpaper / Video Layer */}
      {bgType === "image" && bgUrl && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none"
          style={{
            backgroundImage: `url(${bgUrl})`,
            opacity: bgOpacity,
          }}
        />
      )}
      {bgType === "video" && bgUrl && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed inset-0 z-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none"
          style={{
            opacity: bgOpacity,
          }}
          src={bgUrl}
        />
      )}

      {/* Glassmorphism Tint & Backdrop Blur Overlay */}
      {bgUrl && (
        <div
          className="fixed inset-0 z-0 pointer-events-none transition-all duration-500"
          style={{
            backgroundColor: `rgba(9, 9, 11, ${surfaceAlpha})`,
            backdropFilter: `blur(${panelBlur}px)`,
            WebkitBackdropFilter: `blur(${panelBlur}px)`,
          }}
        />
      )}

      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

