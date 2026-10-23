"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileEdit,
  Sliders,
  Database,
  History,
  Activity,
  Users,
  Youtube,
  Terminal,
  ExternalLink,
  Radio,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, useWsStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SiteSettings } from "@nova/shared";

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Home Page Editor",
    href: "/admin/editor",
    icon: FileEdit,
  },
  {
    label: "Team Management",
    href: "/admin/team",
    icon: Users,
  },
  {
    label: "Tutorials & YouTube",
    href: "/admin/tutorials",
    icon: Youtube,
  },
  {
    label: "Command Library",
    href: "/admin/commands",
    icon: Terminal,
  },
  {
    label: "Website Settings",
    href: "/admin/settings",
    icon: Sliders,
  },
  {
    label: "Database Cluster",
    href: "/admin/database",
    icon: Database,
  },
  {
    label: "Activity & Audit",
    href: "/admin/activity",
    icon: History,
  },
  {
    label: "API & System Health",
    href: "/admin/api-status",
    icon: Activity,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { isConnected } = useWsStore();

  const { data: settingsData } = useQuery<{ success: boolean; settings: SiteSettings }>({
    queryKey: ["siteSettings"],
    queryFn: async () => (await api.get("/api/settings")).data,
  });

  const branding = settingsData?.settings?.branding;
  const panelName = branding?.panelName || branding?.logoText || "NOVA STUDIO";
  const panelLogo = branding?.panelLogo || branding?.logoImageUrl;
  const panelFaviconName = branding?.panelFaviconName || "Admin Area";
  const panelMotd = branding?.panelMotd;
  const panelMotdEnabled = branding?.panelMotdEnabled !== false;

  return (
    <aside className="w-64 border-r border-white/5 bg-zinc-950/75 backdrop-blur-md flex flex-col justify-between h-screen sticky top-0 z-20">
      <div>
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            {panelLogo ? (
              <img
                src={panelLogo}
                alt={panelName}
                className="h-8 w-8 rounded-lg object-cover shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform border border-white/10"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                <span className="font-extrabold text-white text-sm">
                  {panelName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <span className="text-sm font-bold text-white tracking-wide block truncate max-w-[150px]">
                {panelName}
              </span>
              <span className="block text-[10px] uppercase font-semibold text-violet-400 tracking-wider truncate max-w-[150px]">
                {panelFaviconName}
              </span>
            </div>
          </Link>
        </div>

        {/* MOTD Pill (if enabled) */}
        {panelMotdEnabled && panelMotd && (
          <div className="px-4 py-2 border-b border-violet-500/10 bg-violet-950/30">
            <p className="text-[10px] font-medium text-violet-300 truncate" title={panelMotd}>
              📢 {panelMotd}
            </p>
          </div>
        )}

        {/* Live sync pill */}
        <div className="px-4 py-3 border-b border-white/5 bg-zinc-900/40">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <Radio
                className={cn(
                  "h-3.5 w-3.5",
                  isConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"
                )}
              />
              <span>{isConnected ? "Live Sync Active" : "Connecting WS..."}</span>
            </div>
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-emerald-400" : "bg-amber-400"
              )}
            />
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-violet-600/15 text-violet-300 border border-violet-500/20 font-semibold"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-violet-400" : "text-zinc-400"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-violet-400" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Account */}
      <div className="p-4 border-t border-white/5 bg-zinc-900/30 space-y-3">
        {/* Quick link to live public site */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
            <span>View Public Site</span>
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">:3001</span>
        </Link>

        {/* User Card */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5 truncate">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-xs uppercase">
              {user?.username?.slice(0, 1) || "A"}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">
                {user?.username || "admin"}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase font-mono">
                {user?.role || "admin"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            className="h-8 w-8 text-zinc-400 hover:text-red-400"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

