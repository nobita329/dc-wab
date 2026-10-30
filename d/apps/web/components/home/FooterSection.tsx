"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Github,
  Twitter,
  Linkedin,
  Dribbble,
  Instagram,
  Youtube,
  Globe,
  Shield,
  Scale,
} from "lucide-react";
import { FooterSection as FooterType, SocialLink, LegalPage } from "@nova/shared";
import { api } from "@/lib/api";

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

const defaultLegalFallbacks = [
  { id: "1", title: "Privacy Policy", slug: "privacy-policy" },
  { id: "2", title: "Terms and Conditions", slug: "terms-and-conditions" },
  { id: "3", title: "Cookie Policy", slug: "cookie-policy" },
  { id: "4", title: "Copyright Policy", slug: "copyright-policy" },
  { id: "5", title: "Disclaimer", slug: "disclaimer" },
  { id: "6", title: "Data Deletion", slug: "data-deletion" },
  { id: "7", title: "Contact", slug: "contact" },
];

export function FooterSection({ footer, socials = [], logoText = "NOVA STUDIO" }: FooterSectionProps) {
  // Automatically retrieve published legal pages
  const { data: legalData } = useQuery<{ success: boolean; pages: LegalPage[] }>({
    queryKey: ["publishedLegalPages"],
    queryFn: async () => {
      const res = await api.get("/api/legal");
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  const legalPages = (legalData?.pages && legalData.pages.length > 0)
    ? legalData.pages
    : defaultLegalFallbacks;

  return (
    <footer className="border-t border-white/5 bg-zinc-950 pt-16 pb-12">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-10 pb-12 border-b border-white/5">
          {/* Studio Brand summary */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 shadow-sm group-hover:scale-105 transition-transform">
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

          {/* Quick Navigation Columns */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Explore
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Overview</Link>
              </li>
              <li>
                <Link href="/team" className="hover:text-white transition-colors">Team & Guild</Link>
              </li>
              <li>
                <Link href="/tutorials" className="hover:text-white transition-colors">Tutorials</Link>
              </li>
              <li>
                <Link href="/commands" className="hover:text-white transition-colors">Command Library</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Start a Project</Link>
              </li>
            </ul>
          </div>

          {/* Dedicated Legal & Compliance Section */}
          <div className="md:col-span-2 flex flex-col space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-violet-400" />
              <span>Legal & Policies</span>
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm text-zinc-400">
              {legalPages.map((page) => (
                <li key={page.id || page.slug}>
                  <Link
                    href={`/${page.slug}`}
                    className="hover:text-cyan-400 transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="h-1 w-1 rounded-full bg-zinc-600 group-hover:bg-cyan-400 transition-colors" />
                    <span className="truncate">{page.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin & Security Column */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>Security</span>
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-400">
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  <span>Admin Portal</span>
                </Link>
              </li>
              <li>
                <Link href="/data-deletion" className="hover:text-white transition-colors">
                  <span>Data Erasure</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  <span>Report Vulnerability</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>{footer.copyrightText || `© ${new Date().getFullYear()} Nova Studio. All rights reserved.`}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/privacy-policy" className="hover:text-zinc-300 transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms-and-conditions" className="hover:text-zinc-300 transition-colors">
              Terms
            </Link>
            <span>•</span>
            <Link href="/cookie-policy" className="hover:text-zinc-300 transition-colors">
              Cookies
            </Link>
            <span>•</span>
            <Link href="/data-deletion" className="hover:text-zinc-300 transition-colors">
              Data Deletion
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-zinc-300 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
