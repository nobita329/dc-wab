"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
  Home,
  Users,
  Youtube,
  Terminal,
  CreditCard,
  BarChart3,
  Github,
  FolderGit2,
  Link2,
  BookOpen,
} from "lucide-react";
import { NavItem, BrandingSettings } from "@nova/shared";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/lib/store";

interface NavbarProps {
  branding: BrandingSettings;
  navigation?: NavItem[];
}

export const CUSTOM_PAGE_LIST = [
  { id: "nav-home", label: "Home", href: "/", order: 1, icon: Home },
  { id: "nav-team", label: "Team", href: "/team", order: 2, icon: Users },
  { id: "nav-tutorials", label: "Tutorials", href: "/tutorials", order: 3, icon: Youtube },
  { id: "nav-command", label: "Command", href: "/commands", order: 4, icon: Terminal },
  { id: "nav-plan", label: "Plan", href: "/plans", order: 5, icon: CreditCard },
  { id: "nav-analytics", label: "Analytics", href: "/analytics", order: 6, icon: BarChart3 },
  { id: "nav-github", label: "GitHub", href: "/github", order: 7, icon: Github },
  { id: "nav-projects", label: "Projects", href: "/projects", order: 8, icon: FolderGit2 },
  { id: "nav-links", label: "Links", href: "/links", order: 9, icon: Link2 },
  { id: "nav-about", label: "About", href: "/about", order: 10, icon: BookOpen },
];

export function Navbar({ branding }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();
  const pathname = usePathname();

  const sortedNav = CUSTOM_PAGE_LIST;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-white text-base">N</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wider text-white">
              {branding.logoText || "NOVA STUDIO"}
            </span>
            <span className="text-[10px] tracking-widest uppercase text-violet-400 font-semibold">
              Design & Tech
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {sortedNav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`px-2.5 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-violet-600/15 text-cyan-400 font-semibold border border-violet-500/20 shadow-sm"
                    : "text-zinc-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Theme Toggle & Admin Access */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link href="/admin">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 border-white/10 text-zinc-300 hover:text-white text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
              <span>Admin</span>
            </Button>
          </Link>

          <Link href="/contact">
            <Button size="sm" variant="studio" className="h-8 gap-1.5 shadow-md text-xs px-3">
              <span>Start Project</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-300 hover:text-white"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-b border-white/10 bg-zinc-950 px-4 py-6 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2">
            {sortedNav.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-violet-600/20 text-cyan-400 font-semibold border border-violet-500/30"
                      : "text-zinc-300 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-zinc-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 flex flex-col gap-2.5">
            <Link href="/admin" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full justify-center gap-2 text-xs h-9">
                <ShieldCheck className="h-4 w-4 text-violet-400" />
                <span>Admin Portal</span>
              </Button>
            </Link>
            <Link href="/contact" onClick={() => setMobileOpen(false)}>
              <Button variant="studio" className="w-full justify-center gap-2 text-xs h-9">
                <span>Start Project</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
