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
  Bot,
  Boxes,
  FileCode2,
  Eye,
  Send,
  SlidersHorizontal,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, useWsStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SiteSettings } from "@nova/shared";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  exact?: boolean;
}

interface NavSection {
  title: string;
  badge?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Core & Content",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Home Page Editor", href: "/admin/editor", icon: FileEdit },
      { label: "Team Management", href: "/admin/team", icon: Users },
      { label: "Tutorials & YouTube", href: "/admin/tutorials", icon: Youtube },
      { label: "Command Library", href: "/admin/commands", icon: Terminal },
      { label: "Website Settings", href: "/admin/settings", icon: Sliders },
    ],
  },
  {
    title: "Bot Editor",
    badge: "Components V2",
    items: [
      { label: "Bot Dashboard", href: "/admin/bot", icon: Bot, exact: true },
      { label: "Bot Settings", href: "/admin/bot/settings", icon: SlidersHorizontal },
      { label: "Message Editor", href: "/admin/bot/messages", icon: FileCode2 },
      { label: "Components V2 Builder", href: "/admin/bot/builder", icon: Boxes },
      { label: "Preview", href: "/admin/bot/preview", icon: Eye },
      { label: "Deploy & Publish", href: "/admin/bot/publish", icon: Send },
      { label: "Command Settings", href: "/admin/bot/commands", icon: Terminal },
      { label: "Interaction Logs", href: "/admin/bot/logs", icon: ScrollText },
    ],
  },
  {
    title: "System & Health",
    items: [
      { label: "Database Cluster", href: "/admin/database", icon: Database },
      { label: "Activity & Audit", href: "/admin/activity", icon: History },
      { label: "API & System Health", href: "/admin/api-status", icon: Activity },
    ],
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
    <aside className="w-64 border-r border-white/5 bg-zinc-950/80 backdrop-blur-md flex flex-col justify-between h-screen sticky top-0 z-20 shrink-0 select-none">
      <div className="flex flex-col min-h-0 flex-1">
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
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
          <div className="px-4 py-2 border-b border-violet-500/10 bg-violet-950/30 shrink-0">
            <p className="text-[10px] font-medium text-violet-300 truncate" title={panelMotd}>
              📢 {panelMotd}
            </p>
          </div>
        )}

        {/* Live sync pill */}
        <div className="px-4 py-2.5 border-b border-white/5 bg-zinc-900/40 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <Radio
                className={cn(
                  "h-3 w-3",
                  isConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"
                )}
              />
              <span className="text-[11px] font-medium">
                {isConnected ? "Live Sync Active" : "Connecting WS..."}
              </span>
            </div>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isConnected ? "bg-emerald-400" : "bg-amber-400"
              )}
            />
          </div>
        </div>

        {/* Navigation list with scrollbar */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {section.title}
                </span>
                {section.badge && (
                  <span className="text-[9px] font-semibold bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/30 font-mono">
                    {section.badge}
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin");

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group",
                        isActive
                          ? "bg-violet-600/20 text-violet-200 border border-violet-500/30 font-semibold shadow-sm shadow-violet-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive ? "text-violet-400" : "text-zinc-400 group-hover:text-zinc-200"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="h-3 w-3 text-violet-400 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Account */}
      <div className="p-3 border-t border-white/5 bg-zinc-900/40 space-y-2 shrink-0">
        {/* Quick link to live public site */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
            <span>View Public Site</span>
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">:3001</span>
        </Link>

        {/* User Card */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 truncate">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-xs uppercase shrink-0">
              {user?.username?.slice(0, 1) || "A"}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.username || "admin"}
              </p>
              <p className="text-[9px] text-zinc-400 uppercase font-mono leading-tight">
                {user?.role || "admin"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            className="h-7 w-7 text-zinc-400 hover:text-red-400"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
