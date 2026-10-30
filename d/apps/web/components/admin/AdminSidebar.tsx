"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SiteSettings } from "@nova/shared";
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
  X,
  CreditCard,
  FolderGit2,
  Link2,
  BookOpen,
  Wrench,
  BarChart3,
  Github,
  UserCog,
  Server,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, useWsStore, useUIStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { getGravatarUrl } from "@/lib/gravatar";

const navSections = [
  {
    title: "Content & Showcase",
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Home Page Editor", href: "/admin/editor", icon: FileEdit },
      { label: "Legal Pages", href: "/admin/legal", icon: Scale },
      { label: "Team Management", href: "/admin/team", icon: Users },
      { label: "Tutorials & Videos", href: "/admin/tutorials", icon: Youtube },
      { label: "Command Library", href: "/admin/commands", icon: Terminal },
      { label: "Plans & Pricing", href: "/admin/plans", icon: CreditCard },
      { label: "Projects & Showcase", href: "/admin/projects", icon: FolderGit2 },
      { label: "Quick Links", href: "/admin/links", icon: Link2 },
      { label: "About Studio", href: "/admin/about", icon: BookOpen },
    ],
  },
  {
    title: "Platform, Tools & Cloud",
    items: [
      { label: "Tools Hub (SEO/Meta)", href: "/admin/tools", icon: Wrench },
      { label: "Website Settings", href: "/admin/settings", icon: Sliders },
      { label: "Visitor Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "GitHub Deployments", href: "/admin/github", icon: Github },
      { label: "Supabase Setup", href: "/admin/supabase", icon: Database },
      { label: "User Manager", href: "/admin/users", icon: UserCog },
      { label: "Database Cluster", href: "/admin/database", icon: Server },
      { label: "Activity Audit Logs", href: "/admin/activity", icon: History },
      { label: "API & System Health", href: "/admin/api-status", icon: Activity },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { isConnected } = useWsStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const [port, setPort] = useState<string>(":3001");

  // Query dynamic panel branding
  const { data: settingsData } = useQuery<{ success: boolean; settings: SiteSettings }>({
    queryKey: ["siteSettings"],
    queryFn: async () => (await api.get("/api/admin/settings")).data,
    staleTime: 60 * 1000,
  });

  const branding = settingsData?.settings?.branding;
  const panelName = branding?.panelName || branding?.siteTitle || "NOVA STUDIO";
  const panelLogo = branding?.panelLogoUrl || branding?.logoImageUrl;

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.port) {
      setPort(`:${window.location.port}`);
    }
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const sidebarContent = (
    <>
      <div className="shrink-0">
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <Link href="/admin" className="flex items-center gap-2.5 max-w-[200px]">
            {panelLogo ? (
              <img
                src={panelLogo}
                alt={panelName}
                className="h-8 w-8 rounded-lg object-contain bg-zinc-900 border border-white/10 p-0.5 shrink-0"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  if (target.nextElementSibling) {
                    (target.nextElementSibling as HTMLElement).style.display = "flex";
                  }
                }}
              />
            ) : null}
            <div
              style={{ display: panelLogo ? "none" : "flex" }}
              className="h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-md shadow-violet-500/20 shrink-0"
            >
              <span className="font-extrabold text-white text-sm">
                {panelName.slice(0, 1) || "N"}
              </span>
            </div>
            <div className="truncate">
              <span className="text-sm font-bold text-white tracking-wide truncate block">
                {panelName}
              </span>
              <span className="block text-[10px] uppercase font-semibold text-violet-400 tracking-wider">
                Admin Area
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Close sidebar"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live sync pill */}
        <div className="px-4 py-2.5 border-b border-white/5 bg-zinc-900/40">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <Radio
                className={cn(
                  "h-3.5 w-3.5",
                  isConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"
                )}
              />
              <span className="text-[11px] font-medium">{isConnected ? "Live Sync Active" : "Connecting WS..."}</span>
            </div>
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-emerald-400 shadow-sm shadow-emerald-500" : "bg-amber-400"
              )}
            />
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto min-h-0 p-3 space-y-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                    isActive
                      ? "bg-violet-600/15 text-violet-300 border border-violet-500/20 font-semibold"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isActive ? "text-violet-400" : "text-zinc-400"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-3 w-3 text-violet-400" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / Account */}
      <div className="shrink-0 p-3 border-t border-white/5 bg-zinc-900/40 space-y-2.5 mt-auto">
        {/* Quick link to live public site */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
            <span>View Public Site</span>
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">{port}</span>
        </Link>

        {/* User Card with Gravatar Email Usericon and 2FA indicator */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:border-violet-500/30 transition-all">
          <Link
            href="/admin/users"
            className="flex items-center gap-2.5 truncate flex-1 hover:opacity-90 transition-opacity"
            title="Manage user security & 2FA"
          >
            <div className="relative shrink-0">
              <img
                src={
                  user?.avatarUrl ||
                  getGravatarUrl(
                    user?.email ||
                      (user?.username === "admin"
                        ? "admin@novastudio.internal"
                        : `${user?.username || "user"}@novastudio.internal`),
                    80
                  )
                }
                alt={user?.username || "Avatar"}
                className="h-8 w-8 rounded-full border border-white/10 object-cover shadow-sm bg-zinc-800"
                onError={(e) => {
                  // Fallback if network or gravatar blocked
                  const target = e.currentTarget;
                  target.style.display = "none";
                  if (target.nextElementSibling) {
                    (target.nextElementSibling as HTMLElement).style.display = "flex";
                  }
                }}
              />
              <div
                style={{ display: "none" }}
                className="h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-xs uppercase shrink-0 shadow-sm"
              >
                {user?.username?.slice(0, 1) || "A"}
              </div>
              {user?.useTotp ? (
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-zinc-950"
                  title="2FA Protected (TOTP Enabled)"
                />
              ) : null}
            </div>

            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.username || "admin"}
                </p>
                {user?.useTotp ? (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono font-medium">
                    2FA
                  </span>
                ) : null}
              </div>
              <p className="text-[10px] text-zinc-400 font-mono truncate">
                {user?.email || user?.role || "admin"}
              </p>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 shrink-0 transition-colors ml-1"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - Always full height, pinned to the left */}
      <aside className="hidden md:flex w-64 h-full border-r border-white/5 bg-zinc-950/75 backdrop-blur-md flex-col shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in-0 duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-white/10 flex flex-col md:hidden transition-transform duration-300 ease-in-out shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
