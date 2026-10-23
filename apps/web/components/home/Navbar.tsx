"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, ArrowRight, ShieldCheck, Users } from "lucide-react";
import { NavItem, BrandingSettings } from "@nova/shared";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/lib/store";

interface NavbarProps {
  branding: BrandingSettings;
  navigation: NavItem[];
}

export function Navbar({ branding, navigation }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();
  const pathname = usePathname();

  // Ensure "Team", "Tutorials", and "Commands" are always present in navigation if not already added
  let navItems = [...navigation];
  if (!navItems.some((item) => item.href === "/team" || item.label.toLowerCase() === "team")) {
    navItems.splice(1, 0, {
      id: "nav-team",
      label: "Team",
      href: "/team",
      order: 1.5,
    });
  }
  if (!navItems.some((item) => item.href === "/tutorials" || item.label.toLowerCase() === "tutorials")) {
    navItems.splice(2, 0, {
      id: "nav-tutorials",
      label: "Tutorials",
      href: "/tutorials",
      order: 1.8,
    });
  }
  if (!navItems.some((item) => item.href === "/commands" || item.label.toLowerCase() === "commands")) {
    navItems.splice(3, 0, {
      id: "nav-commands",
      label: "Commands",
      href: "/commands",
      order: 1.9,
    });
  }
  if (!navItems.some((item) => item.href === "/settings" || item.label.toLowerCase() === "appearance")) {
    navItems.push({
      id: "nav-appearance",
      label: "Appearance",
      href: "/settings",
      order: 4.0,
    });
  }

  const sortedNav = navItems.sort((a, b) => a.order - b.order);

  const getHref = (href: string) => {
    if (href.startsWith("#") && pathname !== "/") {
      return `/${href}`;
    }
    return href;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {branding.panelLogo || branding.logoImageUrl ? (
            <img
              src={branding.panelLogo || branding.logoImageUrl}
              alt={branding.panelName || branding.logoText || "Logo"}
              className="h-9 w-9 rounded-xl object-cover shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform border border-white/10"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-white text-base">
                {(branding.panelName || branding.logoText || "N").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wider text-white">
              {branding.panelName || branding.logoText || "NOVA STUDIO"}
            </span>
            <span className="text-[10px] tracking-widest uppercase text-violet-400 font-semibold">
              {branding.panelFaviconName || branding.siteTagline || "Design & Tech"}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {sortedNav.map((item) => {
            const targetHref = getHref(item.href);
            const isInternal = targetHref.startsWith("/");
            const isActive =
              (item.href === "/team" && pathname === "/team") ||
              (item.href === "/" && pathname === "/");

            if (isInternal) {
              return (
                <Link
                  key={item.id}
                  href={targetHref}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? "text-cyan-400 font-semibold"
                      : "text-zinc-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <a
                key={item.id}
                href={targetHref}
                className="text-sm font-medium text-zinc-300 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Right Actions: Theme Toggle & Admin Access */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link href="/admin">
            <Button variant="outline" size="sm" className="gap-1.5 border-white/10 text-zinc-300 hover:text-white">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
              <span>Admin Portal</span>
            </Button>
          </Link>

          <a href={pathname === "/" ? "#contact" : "/#contact"}>
            <Button size="sm" variant="studio" className="gap-1.5 shadow-md">
              <span>Start Project</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
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
        <div className="md:hidden border-b border-white/10 bg-zinc-950 px-4 py-6 shadow-2xl">
          <div className="flex flex-col space-y-4">
            {sortedNav.map((item) => {
              const targetHref = getHref(item.href);
              const isInternal = targetHref.startsWith("/");
              const isActive =
                (item.href === "/team" && pathname === "/team") ||
                (item.href === "/" && pathname === "/");

              if (isInternal) {
                return (
                  <Link
                    key={item.id}
                    href={targetHref}
                    onClick={() => setMobileOpen(false)}
                    className={`text-base font-medium py-1 transition-colors ${
                      isActive ? "text-cyan-400 font-semibold" : "text-zinc-200 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <a
                  key={item.id}
                  href={targetHref}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-zinc-200 hover:text-white py-1"
                >
                  {item.label}
                </a>
              );
            })}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <Link href="/admin" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full justify-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-violet-400" />
                  <span>Admin Dashboard</span>
                </Button>
              </Link>
              <a href={pathname === "/" ? "#contact" : "/#contact"} onClick={() => setMobileOpen(false)}>
                <Button variant="studio" className="w-full justify-center gap-2">
                  <span>Start Project</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


