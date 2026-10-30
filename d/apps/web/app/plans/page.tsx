"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Check,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  HelpCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { Navbar } from "@/components/home/Navbar";
import { FooterSection } from "@/components/home/FooterSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HomePageContent, BrandingSettings } from "@nova/shared";

export default function PlansPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // Fetch plans from API
  const { data: plansData, isLoading } = useQuery<{ success: boolean; plans: any[] }>({
    queryKey: ["publicPlans"],
    queryFn: async () => (await api.get("/api/plans")).data,
  });

  // Fetch home content for navbar & footer
  const { data: homeData } = useQuery<{
    success: boolean;
    content: HomePageContent;
    settings: BrandingSettings;
  }>({
    queryKey: ["homeContent"],
    queryFn: async () => (await api.get("/api/home")).data,
  });

  const plans = plansData?.plans || [];
  const branding = homeData?.settings || {
    logoText: "NOVA STUDIO",
    siteTitle: "Nova Studio",
    siteTagline: "Next-gen Digital Architecture",
    primaryColor: "#8b5cf6",
    accentColor: "#06b6d4",
  };
  const footer = homeData?.content?.footer || {
    copyrightText: `© ${new Date().getFullYear()} Nova Studio. All rights reserved.`,
    description: "Nova Studio is an independent digital design & software engineering practice.",
    columns: [],
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-600 selection:text-white">
      <Navbar branding={branding as any} />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-white/5 bg-zinc-900/40 py-16 sm:py-24 text-center">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="container relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-300 mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Transparent Pricing & Plans</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Predictable investment for world-class digital craft.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Choose the dedicated engagement model that aligns with your engineering velocity and architectural ambitions.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-10 inline-flex items-center p-1 rounded-xl bg-zinc-900 border border-white/10 shadow-lg">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                billingCycle === "monthly"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <main className="flex-1 py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Skeleton className="h-96 w-full bg-zinc-900 rounded-3xl" />
              <Skeleton className="h-96 w-full bg-zinc-900 rounded-3xl" />
              <Skeleton className="h-96 w-full bg-zinc-900 rounded-3xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan: any) => {
                const price =
                  billingCycle === "yearly" ? Math.round(plan.price * 0.8) : plan.price;
                const features: string[] = Array.isArray(plan.features)
                  ? plan.features
                  : typeof plan.features === "string"
                  ? JSON.parse(plan.features || "[]")
                  : [];

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 backdrop-blur-md ${
                      plan.isPopular || plan.is_popular
                        ? "bg-gradient-to-b from-violet-950/40 via-zinc-900/80 to-zinc-950 border-2 border-violet-500/40 shadow-2xl shadow-violet-600/20 scale-105 z-10"
                        : "bg-zinc-900/40 border border-white/10 hover:border-white/20 shadow-xl"
                    }`}
                  >
                    {(plan.isPopular || plan.is_popular || plan.badge) && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-xs px-3 py-1 shadow-md">
                          {plan.badge || "Most Popular"}
                        </Badge>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        <CreditCard className="h-5 w-5 text-zinc-400" />
                      </div>

                      <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed min-h-[40px]">
                        {plan.description}
                      </p>

                      {/* Pricing */}
                      <div className="mt-6 flex items-baseline gap-1">
                        <span className="text-4xl sm:text-5xl font-extrabold text-white">
                          ${price}
                        </span>
                        <span className="text-xs sm:text-sm text-zinc-400">
                          /{billingCycle === "yearly" ? "mo billed annually" : "month"}
                        </span>
                      </div>

                      {/* Feature List */}
                      <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                          Included Capabilities
                        </p>
                        <ul className="space-y-2.5">
                          {features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-8 pt-6">
                      <Link href={plan.ctaLink || plan.cta_link || "/contact"} className="block">
                        <Button
                          variant={plan.isPopular || plan.is_popular ? "studio" : "outline"}
                          className="w-full justify-center gap-2 py-6 text-sm font-semibold rounded-xl"
                        >
                          <span>{plan.ctaText || plan.cta_text || "Get Started"}</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Guarantee & Trust Assurance */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-white/5">
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-zinc-900/30 border border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/15 text-violet-400 border border-violet-500/20 shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Direct Production SLA</h4>
                <p className="text-xs text-zinc-400 mt-1">99.9% availability contract backed by direct developer support.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 rounded-2xl bg-zinc-900/30 border border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 shrink-0">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Rapid Deployment</h4>
                <p className="text-xs text-zinc-400 mt-1">Onboarding and development sprint kickoff within 48 business hours.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 rounded-2xl bg-zinc-900/30 border border-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No Hidden Fees</h4>
                <p className="text-xs text-zinc-400 mt-1">Clear monthly retainer without surprise billing or lock-in contracts.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterSection footer={footer} />
    </div>
  );
}
