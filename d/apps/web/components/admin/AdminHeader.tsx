"use client";

import Link from "next/link";
import { Sun, Moon, ExternalLink, ShieldCheck, Database, Menu } from "lucide-react";
import { useThemeStore, useAuthStore, useUIStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, action }: AdminHeaderProps) {
  const { theme, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="h-16 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Open menu"
          aria-label="Toggle navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>{title}</span>
          </h1>
          {subtitle && (
            <p className="text-xs text-zinc-400 font-normal">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {action && <div>{action}</div>}

        {/* Database Quick Health Badge */}
        <Link href="/admin/database">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors">
            <Database className="h-3.5 w-3.5" />
            <span>9 DBs Active (inc. command.db)</span>
          </div>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* View live public site */}
        <Link href="/" target="_blank">
          <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 h-8 text-xs border-white/10">
            <span>Public Site</span>
            <ExternalLink className="h-3 w-3 text-cyan-400" />
          </Button>
        </Link>
      </div>
    </header>
  );
}

