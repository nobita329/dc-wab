"use client";

import Link from "next/link";
import {
  Github,
  Twitter,
  Linkedin,
  Dribbble,
  Instagram,
  Youtube,
  Globe,
  Shield,
} from "lucide-react";
import { FooterSection as FooterType, SocialLink } from "@nova/shared";

interface FooterSectionProps {
  footer: FooterType;
  socials?: SocialLink[];
  logoText?: string;
}

const socialIcons: Record<string, any> = {
  github: Github,
  twitter: Twitter,
  linkedin: Linkedin,
  dribbble: Dribbble,
  instagram: Instagram,
  youtube: Youtube,
  other: Globe,
};

export function FooterSection({ footer, socials = [], logoText = "NOVA STUDIO" }: FooterSectionProps) {
  return (
    <footer className="border-t border-white/5 bg-zinc-950 pt-16 pb-12">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/5">
          {/* Studio Brand summary */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-sm">
                <span className="font-extrabold text-white text-sm">N</span>
              </div>
              <span className="text-sm font-bold tracking-wider text-white">
                {logoText}
              </span>
            </Link>

            <p className="mt-4 text-xs sm:text-sm text-zinc-400 max-w-sm leading-relaxed">
              {footer.description}
            </p>

            {/* Social Links */}
            {socials && socials.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                {socials
                  .filter((s) => s.enabled)
                  .map((social) => {
                    const Icon = socialIcons[social.platform] || Globe;
                    return (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-violet-500/40 hover:bg-zinc-800 transition-colors"
                        title={social.label}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Navigation Columns */}
          {footer.columns &&
            footer.columns.map((col) => (
              <div key={col.id} className="flex flex-col space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  {col.title}
                </h4>
                <ul className="space-y-2">
                  {col.links.map((link, idx) => (
                    <li key={idx}>
                      <a
                        href={link.href}
                        className="text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>{footer.copyrightText}</p>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hover:text-zinc-300 flex items-center gap-1 transition-colors">
              <Shield className="h-3 w-3 text-violet-400" />
              <span>Admin Management</span>
            </Link>
            <span>•</span>
            <span className="text-emerald-500/80 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

