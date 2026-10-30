"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Mail,
  Send,
  MessageSquare,
  Shield,
  Clock,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Scale,
  Sparkles,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import { Navbar } from "@/components/home/Navbar";
import { FooterSection } from "@/components/home/FooterSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { HomePageContent, BrandingSettings } from "@nova/shared";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "General Inquiry",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  // Fetch home data for navbar & footer
  const { data: homeData } = useQuery<{
    success: boolean;
    content: HomePageContent;
    settings: BrandingSettings;
  }>({
    queryKey: ["homeContent"],
    queryFn: async () => (await api.get("/api/home")).data,
    staleTime: 5 * 60 * 1000,
  });

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

  const submitMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post("/api/contact", payload);
      return res.data;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Your message has been sent successfully. We will reply shortly!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to send message. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!formData.message.trim() || formData.message.length < 5) {
      toast.error("Message must be at least 5 characters long");
      return;
    }
    submitMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-violet-600 selection:text-white">
      {/* Public Navbar */}
      <Navbar branding={branding as any} navigation={navigation} />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-white/5 bg-zinc-900/40 py-16 sm:py-20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="container relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <nav className="inline-flex items-center gap-2 text-xs text-zinc-400 mb-6 font-medium">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-zinc-600" />
            <span className="text-cyan-400 font-semibold">Contact & Inquiries</span>
          </nav>

          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-300 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>Connect With Nova Studio</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Let's discuss your next breakthrough project.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Whether you are booking digital engineering consultation, inquiring about privacy rights, or submitting a legal notice, our specialized team is here to assist.
          </p>
        </div>
      </section>

      {/* Form & Studio Information Section */}
      <main className="flex-1 py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: Interactive Form */}
            <div className="lg:col-span-7 bg-zinc-900/40 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-md shadow-2xl">
              {submitted ? (
                <div className="py-12 text-center space-y-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Message Transmitted</h3>
                  <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out to Nova Studio. Your inquiry has been routed to our compliance and technical teams. We typically reply within 24 to 48 business hours.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        subject: "General Inquiry",
                        message: "",
                      });
                    }}
                    className="border-white/10 hover:bg-white/5 text-zinc-300"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Mail className="h-5 w-5 text-violet-400" />
                      <span>Send a Message</span>
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400">
                      All communications are encrypted in transit via TLS 1.3.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300">
                        Your Name <span className="text-violet-400">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Alex Morgan"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-zinc-950/60 border-white/10 focus:border-violet-500 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300">
                        Email Address <span className="text-violet-400">*</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="alex@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="bg-zinc-950/60 border-white/10 focus:border-violet-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300">
                      Inquiry Category
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-zinc-950/60 border border-white/10 text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Project Partnership">Project Partnership / Consultation</option>
                      <option value="Privacy & Data Deletion">Privacy & Data Deletion Request</option>
                      <option value="Legal & DMCA Notice">Legal & DMCA Copyright Notice</option>
                      <option value="Security Disclosure">Security & Vulnerability Disclosure</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300">
                      Your Message <span className="text-violet-400">*</span>
                    </label>
                    <Textarea
                      rows={5}
                      placeholder="Share details about your project timeline, requirements, or legal inquiry..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      className="bg-zinc-950/60 border-white/10 focus:border-violet-500 text-sm"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-xs text-zinc-400">
                    <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      By submitting this form, you acknowledge our{" "}
                      <Link href="/privacy-policy" className="text-cyan-400 underline hover:text-cyan-300">
                        Privacy Policy
                      </Link>
                      . We will only use your information to reply to your inquiry.
                    </span>
                  </div>

                  <Button
                    type="submit"
                    disabled={submitMutation.isPending}
                    variant="studio"
                    className="w-full justify-center gap-2 py-6 text-sm font-semibold shadow-lg shadow-violet-600/20"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Transmitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Transmission</span>
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Right: Studio Directory & Trust Standards */}
            <div className="lg:col-span-5 space-y-6">
              {/* Direct Channels */}
              <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 sm:p-8 backdrop-blur-md space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    <span>Studio Information</span>
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Direct communication points across specialized departments.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <div className="text-xs font-semibold text-zinc-300">New Projects & Partnerships</div>
                    <a
                      href="mailto:hello@novastudio.agency"
                      className="text-sm text-cyan-400 hover:underline font-mono"
                    >
                      hello@novastudio.agency
                    </a>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <div className="text-xs font-semibold text-zinc-300">Privacy & Data Compliance Office</div>
                    <a
                      href="mailto:privacy@novastudio.agency"
                      className="text-sm text-cyan-400 hover:underline font-mono"
                    >
                      privacy@novastudio.agency
                    </a>
                    <p className="text-[11px] text-zinc-400">
                      Handles GDPR, CCPA, and data deletion requests.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                    <div className="text-xs font-semibold text-zinc-300">Legal Counsel & DMCA Copyright Agent</div>
                    <a
                      href="mailto:legal@novastudio.agency"
                      className="text-sm text-cyan-400 hover:underline font-mono"
                    >
                      legal@novastudio.agency
                    </a>
                  </div>
                </div>

                {/* Response SLA */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/5 text-xs text-zinc-400">
                  <Clock className="h-4 w-4 text-violet-400" />
                  <span>Standard Response Time: <strong>24–48 Business Hours</strong></span>
                </div>
              </div>

              {/* Discord Live Hub */}
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-zinc-950 p-6 sm:p-8 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Live Community Hub</h4>
                    <p className="text-xs text-zinc-400">Join our Discord server for instant chats</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Interact directly with our engineers, view command script release notes, and engage with over 15,000+ creators.
                </p>

                <a
                  href="https://discord.gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" size="sm" className="w-full justify-center gap-2 border-white/10 text-zinc-200 hover:bg-white/5">
                    <span>Join Discord Server</span>
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Public Footer */}
      <FooterSection footer={footer} />
    </div>
  );
}

