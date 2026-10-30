"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Scale,
  Shield,
  Clock,
  ChevronRight,
  Share2,
  Printer,
  Check,
  FileText,
  Mail,
  AlertCircle,
  ExternalLink,
  Lock,
} from "lucide-react";
import { LegalPage, BrandingSettings, HomePageContent } from "@nova/shared";
import { api } from "@/lib/api";
import { Navbar } from "@/components/home/Navbar";
import { FooterSection } from "@/components/home/FooterSection";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface LegalPageLayoutProps {
  slug: string;
  fallbackTitle?: string;
}

export function LegalPageLayout({ slug, fallbackTitle }: LegalPageLayoutProps) {
  const [copied, setCopied] = useState(false);

  // 1. Fetch current legal page by slug
  const {
    data: pageData,
    isLoading: isPageLoading,
    isError,
  } = useQuery<{ success: boolean; page: LegalPage }>({
    queryKey: ["legalPage", slug],
    queryFn: async () => {
      const res = await api.get(`/api/legal/${slug}`);
      return res.data;
    },
  });

  // 2. Fetch list of all published legal pages for sidebar navigation
  const { data: allPagesData } = useQuery<{ success: boolean; pages: LegalPage[] }>({
    queryKey: ["publishedLegalPages"],
    queryFn: async () => {
      const res = await api.get("/api/legal");
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  // 3. Fetch site settings & navigation for header/footer
  const { data: homeData } = useQuery<{
    success: boolean;
    content: HomePageContent;
    settings: BrandingSettings;
  }>({
    queryKey: ["homeContent"],
    queryFn: async () => (await api.get("/api/home")).data,
    staleTime: 5 * 60 * 1000,
  });

  const page = pageData?.page;
  const allPages = allPagesData?.pages || [];
  const branding = homeData?.settings || {
    logoText: "NOVA STUDIO",
    siteTitle: "Nova Studio",
    siteTagline: "Next-gen Digital Architecture",
    primaryColor: "#8b5cf6",
    accentColor: "#06b6d4",
  };
  const navigation = homeData?.content?.navigation || [];
  const footer = homeData?.content?.footer || {
    copyrightText: `© ${new Date().getFullYear()} Nova Studio. All rights reserved.`,
    description: "Nova Studio is an independent digital design & software engineering practice.",
    columns: [],
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Page link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const formattedDate = page?.updated_at
    ? new Date(page.updated_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "October 30, 2026";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-600 selection:text-white">
      {/* Public Navbar */}
      <Navbar branding={branding as any} navigation={navigation} />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-white/5 bg-zinc-900/40 py-12 sm:py-16">
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[200px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-6 font-medium">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-zinc-600" />
            <span className="text-zinc-500">Legal & Compliance</span>
            <ChevronRight className="h-3 w-3 text-zinc-600" />
            <span className="text-cyan-400 font-semibold">{page?.title || fallbackTitle || "Legal"}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 uppercase tracking-wider mb-4">
                <Scale className="h-3.5 w-3.5 text-cyan-400" />
                <span>Official Policy Document</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                {isPageLoading ? (
                  <Skeleton className="h-12 w-80 bg-zinc-800" />
                ) : (
                  page?.title || fallbackTitle
                )}
              </h1>

              <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
                {page?.seo_description ||
                  "Review our legally compliant documentation governing user data, platform security, and operational standards."}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2 border-white/10 hover:bg-white/5 text-zinc-300"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Share"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2 border-white/10 hover:bg-white/5 text-zinc-300 hidden sm:flex"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </Button>
            </div>
          </div>

          {/* Meta Badges */}
          <div className="mt-8 flex flex-wrap items-center gap-4 pt-6 border-t border-white/5 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-violet-400" />
              <span>Last Updated: <strong className="text-zinc-200">{formattedDate}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>GDPR & CCPA Aligned</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-cyan-400" />
              <span>Enforceable Service Policy</span>
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Primary Document Body */}
            <div className="lg:col-span-8 bg-zinc-900/30 border border-white/5 rounded-2xl p-6 sm:p-10 backdrop-blur-sm shadow-xl">
              {isPageLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-8 w-3/4 bg-zinc-800" />
                  <Skeleton className="h-4 w-full bg-zinc-800" />
                  <Skeleton className="h-4 w-5/6 bg-zinc-800" />
                  <Skeleton className="h-32 w-full bg-zinc-800" />
                  <Skeleton className="h-8 w-1/2 bg-zinc-800" />
                  <Skeleton className="h-4 w-full bg-zinc-800" />
                </div>
              ) : isError || !page ? (
                <div className="p-8 text-center">
                  <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white">Policy Not Available</h3>
                  <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
                    This legal page is either in draft status or has not been published yet.
                  </p>
                  <Link href="/contact" className="mt-6 inline-block">
                    <Button variant="outline" size="sm">
                      Contact Legal Office
                    </Button>
                  </Link>
                </div>
              ) : (
                <article className="prose prose-invert max-w-none">
                  <MarkdownRenderer content={page.content} />
                </article>
              )}
            </div>

            {/* Sidebar Navigator & Support Desk */}
            <aside className="lg:col-span-4 space-y-6 sticky top-24">
              {/* Table of Legal Documents */}
              <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-md">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-400" />
                  <span>Legal Documents Index</span>
                </h3>

                <nav className="space-y-1">
                  {allPages.map((item) => {
                    const isActive = item.slug === slug;
                    return (
                      <Link
                        key={item.id || item.slug}
                        href={`/${item.slug}`}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? "bg-violet-600/15 text-cyan-300 border border-violet-500/25 font-semibold"
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span className="truncate">{item.title}</span>
                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Data Rights & Inquiries Card */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-950/30 to-zinc-900/60 p-6 backdrop-blur-md space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Have a Privacy or Legal Question?</h4>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                    Our compliance team responds to all data subject inquiries and legal requests within 24 to 48 hours.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Privacy Desk:</span>
                    <a
                      href="mailto:privacy@novastudio.agency"
                      className="text-cyan-400 hover:underline font-mono"
                    >
                      privacy@novastudio.agency
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Legal / DMCA:</span>
                    <a
                      href="mailto:legal@novastudio.agency"
                      className="text-cyan-400 hover:underline font-mono"
                    >
                      legal@novastudio.agency
                    </a>
                  </div>
                </div>

                <Link href="/contact" className="block pt-2">
                  <Button variant="studio" size="sm" className="w-full justify-center text-xs">
                    <span>Submit Legal Inquiry</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>

              {/* Security Trust Seal */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-xs text-zinc-400 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-200">Zero Commercial Data Brokering</p>
                  <p className="text-[11px] text-zinc-400">We do not sell user data to advertising exchanges.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Public Footer */}
      <FooterSection footer={footer} />
    </div>
  );
}

