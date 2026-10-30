"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wrench,
  Save,
  Globe,
  Sliders,
  FileCode,
  Share2,
  Search,
  Sparkles,
  Bot,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  Download,
  CheckCircle2,
  Layout,
  Menu,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminToolsPage() {
  const queryClient = useQueryClient();
  const [tools, setTools] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("header");

  const { data, isLoading } = useQuery({
    queryKey: ["adminTools"],
    queryFn: async () => (await api.get("/api/admin/tools")).data,
  });

  useEffect(() => {
    if (data?.tools) {
      setTools(JSON.parse(JSON.stringify(data.tools)));
      setIsDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.put("/api/admin/tools", payload)).data;
    },
    onSuccess: () => {
      toast.success("Tools configuration saved successfully");
      queryClient.invalidateQueries({ queryKey: ["adminTools"] });
      setIsDirty(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save tools settings");
    },
  });

  const handleUpdate = (section: string, key: string, val: any) => {
    setTools((prev: any) => ({
      ...prev,
      [section]: {
        ...(prev?.[section] || {}),
        [key]: val,
      },
    }));
    setIsDirty(true);
  };

  const handleAddHeaderLink = () => {
    const links = [...(tools?.header?.navLinks || []), { label: "New Link", href: "/#" }];
    handleUpdate("header", "navLinks", links);
  };

  const handleRemoveHeaderLink = (index: number) => {
    const links = (tools?.header?.navLinks || []).filter((_: any, i: number) => i !== index);
    handleUpdate("header", "navLinks", links);
  };

  const handleDownloadSitemap = () => {
    window.open("/api/sitemap.xml", "_blank");
  };

  const handleDownloadLlms = () => {
    window.open("/api/llms.txt", "_blank");
  };

  if (isLoading || !tools) {
    return (
      <div className="flex-1 flex flex-col">
        <AdminHeader title="Website Tools & Webmaster Hub" subtitle="Loading configurations..." />
        <div className="p-8 space-y-6">
          <Skeleton className="h-10 w-96 bg-zinc-800" />
          <Skeleton className="h-80 w-full bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Tools & Webmaster Hub"
        subtitle="Configure Header, Footer, Sidebar, SEO, Sitemap, LLMs.txt, OpenGraph, and Bing Webmaster"
        action={
          <Button
            size="sm"
            variant="studio"
            onClick={() => saveMutation.mutate(tools)}
            disabled={saveMutation.isPending || !isDirty}
            className="gap-1.5 h-8 text-xs shadow-md"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saveMutation.isPending ? "Saving..." : isDirty ? "Save Settings" : "Saved"}</span>
          </Button>
        }
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-white/10 p-1 flex-wrap h-auto">
            <TabsTrigger value="header" className="text-xs">Header & Bar</TabsTrigger>
            <TabsTrigger value="footer" className="text-xs">Footer Columns</TabsTrigger>
            <TabsTrigger value="sidebar" className="text-xs">Sidebar & Glass</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs">SEO & Metadata</TabsTrigger>
            <TabsTrigger value="sitemap" className="text-xs">XML Sitemap</TabsTrigger>
            <TabsTrigger value="llms" className="text-xs">llms.txt (AI Standard)</TabsTrigger>
            <TabsTrigger value="opengraph" className="text-xs">OpenGraph Preview</TabsTrigger>
            <TabsTrigger value="webmaster" className="text-xs">Bing & Search Engines</TabsTrigger>
          </TabsList>

          {/* TAB 1: HEADER */}
          <TabsContent value="header" className="space-y-6">
            <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-white">Header & Top Navigation</CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Configure brand logo, main menu navigation links, and announcement bar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Logo Text</label>
                    <Input
                      value={tools.header?.logoText || "NOVA STUDIO"}
                      onChange={(e) => handleUpdate("header", "logoText", e.target.value)}
                      className="bg-zinc-900 border-white/10 text-xs font-bold tracking-wider"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Logo Image URL (Optional)</label>
                    <Input
                      value={tools.header?.logoImage || ""}
                      onChange={(e) => handleUpdate("header", "logoImage", e.target.value)}
                      placeholder="/logo.png or https://..."
                      className="bg-zinc-900 border-white/10 text-xs"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white">Top Announcement Bar</h4>
                      <p className="text-[11px] text-zinc-400">Sticky banner at the top of the public website.</p>
                    </div>
                    <Switch
                      checked={tools.header?.showAnnouncement ?? true}
                      onCheckedChange={(checked) => handleUpdate("header", "showAnnouncement", checked)}
                    />
                  </div>

                  {tools.header?.showAnnouncement && (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-zinc-400 text-[11px] mb-1">Badge Text</label>
                          <Input
                            value={tools.header?.announcementBadge || ""}
                            onChange={(e) => handleUpdate("header", "announcementBadge", e.target.value)}
                            placeholder="e.g. New Release"
                            className="bg-zinc-900 border-white/10 text-xs"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-zinc-400 text-[11px] mb-1">Banner Announcement Text</label>
                          <Input
                            value={tools.header?.announcementText || ""}
                            onChange={(e) => handleUpdate("header", "announcementText", e.target.value)}
                            className="bg-zinc-900 border-white/10 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-zinc-400 text-[11px] mb-1">Target Link</label>
                        <Input
                          value={tools.header?.announcementLink || ""}
                          onChange={(e) => handleUpdate("header", "announcementLink", e.target.value)}
                          className="bg-zinc-900 border-white/10 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Header CTA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Header Button Label</label>
                    <Input
                      value={tools.header?.ctaText || "Start Project"}
                      onChange={(e) => handleUpdate("header", "ctaText", e.target.value)}
                      className="bg-zinc-900 border-white/10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Header Button Href</label>
                    <Input
                      value={tools.header?.ctaHref || "#contact"}
                      onChange={(e) => handleUpdate("header", "ctaHref", e.target.value)}
                      className="bg-zinc-900 border-white/10 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Nav Links Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-zinc-300 font-medium">Header Navigation Links</label>
                    <Button size="sm" variant="secondary" onClick={handleAddHeaderLink} className="h-7 text-xs gap-1">
                      <Plus className="h-3 w-3" />
                      <span>Add Menu Item</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {(tools.header?.navLinks || []).map((link: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-white/5">
                        <Input
                          value={link.label}
                          onChange={(e) => {
                            const copy = [...tools.header.navLinks];
                            copy[idx].label = e.target.value;
                            handleUpdate("header", "navLinks", copy);
                          }}
                          placeholder="Label"
                          className="bg-zinc-900 border-white/10 text-xs w-1/3"
                        />
                        <Input
                          value={link.href}
                          onChange={(e) => {
                            const copy = [...tools.header.navLinks];
                            copy[idx].href = e.target.value;
                            handleUpdate("header", "navLinks", copy);
                          }}
                          placeholder="/path"
                          className="bg-zinc-900 border-white/10 text-xs font-mono flex-1"
                        />
                        <button
                          onClick={() => handleRemoveHeaderLink(idx)}
                          className="p-2 text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: FOOTER */}
          <TabsContent value="footer" className="space-y-6">
            <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-white">Footer Columns & Legal Text</CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Manage footer column links, copyright notice, and branding tagline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Footer Tagline</label>
                    <Input
                      value={tools.footer?.tagline || ""}
                      onChange={(e) => handleUpdate("footer", "tagline", e.target.value)}
                      className="bg-zinc-900 border-white/10 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Copyright Notice</label>
                    <Input
                      value={tools.footer?.copyrightText || ""}
                      onChange={(e) => handleUpdate("footer", "copyrightText", e.target.value)}
                      className="bg-zinc-900 border-white/10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold text-white">Footer Navigation Columns</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(tools.footer?.columns || []).map((col: any, cIdx: number) => (
                      <Card key={cIdx} className="border-white/10 bg-zinc-950 p-3 space-y-3">
                        <Input
                          value={col.title}
                          onChange={(e) => {
                            const copy = [...tools.footer.columns];
                            copy[cIdx].title = e.target.value;
                            handleUpdate("footer", "columns", copy);
                          }}
                          className="bg-zinc-900 border-white/10 font-bold text-xs"
                        />
                        <div className="space-y-1.5">
                          {col.links.map((link: any, lIdx: number) => (
                            <div key={lIdx} className="flex items-center gap-1.5">
                              <Input
                                value={link.label}
                                onChange={(e) => {
                                  const copy = [...tools.footer.columns];
                                  copy[cIdx].links[lIdx].label = e.target.value;
                                  handleUpdate("footer", "columns", copy);
                                }}
                                className="bg-zinc-900 border-white/5 text-[11px] h-7"
                              />
                              <Input
                                value={link.href}
                                onChange={(e) => {
                                  const copy = [...tools.footer.columns];
                                  copy[cIdx].links[lIdx].href = e.target.value;
                                  handleUpdate("footer", "columns", copy);
                                }}
                                className="bg-zinc-900 border-white/5 font-mono text-[11px] h-7"
                              />
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: SIDEBAR / NAVBAR */}
          <TabsContent value="sidebar" className="space-y-6">
            <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-white">Sidebar & Navbar Visual Tokens</CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Control backdrop blur radius, panel transparency, and sticky constraints.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-xs max-w-2xl">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-zinc-300 font-medium">Panel Backdrop Blur</label>
                    <span className="font-mono text-violet-400">{tools.sidebar?.blur ?? 16}px</span>
                  </div>
                  <Slider
                    value={tools.sidebar?.blur ?? 16}
                    min={0}
                    max={40}
                    step={1}
                    onChange={(val) => handleUpdate("sidebar", "blur", val)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-zinc-300 font-medium">Panel Transparency</label>
                    <span className="font-mono text-cyan-400">{tools.sidebar?.transparency ?? 35}%</span>
                  </div>
                  <Slider
                    value={tools.sidebar?.transparency ?? 35}
                    min={0}
                    max={90}
                    step={1}
                    onChange={(val) => handleUpdate("sidebar", "transparency", val)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-white/5">
                  <div>
                    <h5 className="font-semibold text-white">Sticky Header Behavior</h5>
                    <p className="text-[11px] text-zinc-400">Pin top bar while scrolling page content.</p>
                  </div>
                  <Switch
                    checked={tools.sidebar?.enableSticky ?? true}
                    onCheckedChange={(checked) => handleUpdate("sidebar", "enableSticky", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: SEO */}
          <TabsContent value="seo" className="space-y-6">
            <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-white">Search Engine Optimization</CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Default meta tags indexed by Google, Bing, and web crawlers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Global Meta Title</label>
                  <Input
                    value={tools.seo?.metaTitle || ""}
                    onChange={(e) => handleUpdate("seo", "metaTitle", e.target.value)}
                    className="bg-zinc-900 border-white/10 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Meta Description</label>
                  <Textarea
                    value={tools.seo?.metaDescription || ""}
                    onChange={(e) => handleUpdate("seo", "metaDescription", e.target.value)}
                    rows={3}
                    className="bg-zinc-900 border-white/10 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Canonical URL</label>
                    <Input
                      value={tools.seo?.canonicalUrl || "http://localhost:3001"}
                      onChange={(e) => handleUpdate("seo", "canonicalUrl", e.target.value)}
                      className="bg-zinc-900 border-white/10 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Robots Directive</label>
                    <Input
                      value={tools.seo?.robotsDirective || "index, follow"}
                      onChange={(e) => handleUpdate("seo", "robotsDirective", e.target.value)}
                      className="bg-zinc-900 border-white/10 text-xs font-mono"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: SITEMAP */}
          <TabsContent value="sitemap" className="space-y-6">
            <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-semibold text-white">XML Sitemap Index</CardTitle>
                  <CardDescription className="text-xs text-zinc-400 mt-1">
                    Live dynamic XML sitemap generated at <code className="text-cyan-400">/api/sitemap.xml</code>
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={handleDownloadSitemap} className="gap-1.5 h-8 text-xs border-white/10">
                  <Download className="h-3.5 w-3.5" />
                  <span>Download sitemap.xml</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="divide-y divide-white/5 rounded-xl border border-white/5 bg-zinc-950 overflow-hidden">
                  {(tools.sitemap?.customUrls || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-cyan-400">{item.url}</span>
                        <Badge variant="outline" className="text-[10px] border-white/10">
                          {item.changefreq}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-zinc-400 text-[11px]">
                        <span>priority: {item.priority}</span>
                        <span className="text-zinc-600">|</span>
                        <span>{item.lastmod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: LLMS.TXT (AI AGENT STANDARD) */}
          <TabsContent value="llms" className="space-y-6">
            <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Bot className="h-4 w-4 text-violet-400" />
                    <span>llms.txt AI Agent Documentation Standard</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400 mt-1">
                    Standard specification for providing machine-readable studio context to LLMs, Gemini, and Claude.
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={handleDownloadLlms} className="gap-1.5 h-8 text-xs border-white/10">
                  <Download className="h-3.5 w-3.5" />
                  <span>Open /api/llms.txt</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Studio Summary (Markdown)</label>
                  <Textarea
                    value={tools.llmsTxt?.studioSummary || ""}
                    onChange={(e) => handleUpdate("llmsTxt", "studioSummary", e.target.value)}
                    rows={4}
                    className="bg-zinc-900 border-white/10 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Technical Guidelines & Architecture</label>
                  <Textarea
                    value={tools.llmsTxt?.guidelines || ""}
                    onChange={(e) => handleUpdate("llmsTxt", "guidelines", e.target.value)}
                    rows={4}
                    className="bg-zinc-900 border-white/10 font-mono text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 7: OPENGRAPH & SOCIAL PREVIEW */}
          <TabsContent value="opengraph" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-white">Social Graph Tags</CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Image and title cards generated when shared on Discord, Twitter/X, and WhatsApp.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">og:title</label>
                    <Input
                      value={tools.openGraph?.ogTitle || ""}
                      onChange={(e) => handleUpdate("openGraph", "ogTitle", e.target.value)}
                      className="bg-zinc-900 border-white/10 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">og:description</label>
                    <Textarea
                      value={tools.openGraph?.ogDescription || ""}
                      onChange={(e) => handleUpdate("openGraph", "ogDescription", e.target.value)}
                      rows={3}
                      className="bg-zinc-900 border-white/10 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">og:image (1200x630)</label>
                    <Input
                      value={tools.openGraph?.ogImage || ""}
                      onChange={(e) => handleUpdate("openGraph", "ogImage", e.target.value)}
                      className="bg-zinc-900 border-white/10 text-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Discord / Social Live Card Mockup */}
              <Card className="border-white/10 bg-zinc-950 p-6 flex flex-col justify-center">
                <h4 className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5 text-violet-400" />
                  <span>Discord / Social Embed Preview</span>
                </h4>

                <div className="border-l-4 border-violet-500 bg-zinc-900/90 rounded-r-xl p-4 space-y-2">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Nova Studio</span>
                  <h5 className="text-sm font-bold text-white hover:underline cursor-pointer">
                    {tools.openGraph?.ogTitle || "Nova Studio"}
                  </h5>
                  <p className="text-xs text-zinc-300 line-clamp-3">
                    {tools.openGraph?.ogDescription || "Crafting digital architectures and apps."}
                  </p>
                  {tools.openGraph?.ogImage && (
                    <div className="pt-2">
                      <img
                        src={tools.openGraph?.ogImage}
                        alt="OpenGraph Preview"
                        className="w-full h-36 object-cover rounded-lg border border-white/10"
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 8: BING & WEBMASTER */}
          <TabsContent value="webmaster" className="space-y-6">
            <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-white">Search Engine Webmaster Verification</CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Verify ownership with Bing Webmaster Tool, Google Search Console, and Yandex.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1 flex items-center justify-between">
                    <span>Bing Webmaster Verification Code (&lt;meta name=&quot;msvalidate.01&quot;&gt;)</span>
                    <a href="https://www.bing.com/webmasters" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                      <span>Bing Portal</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </label>
                  <Input
                    value={tools.bingWebmaster?.bingVerificationCode || ""}
                    onChange={(e) => handleUpdate("bingWebmaster", "bingVerificationCode", e.target.value)}
                    placeholder="e.g. 5A9E198547C392D8B38384918239"
                    className="bg-zinc-900 border-white/10 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1 flex items-center justify-between">
                    <span>Google Search Console (&lt;meta name=&quot;google-site-verification&quot;&gt;)</span>
                    <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                      <span>Google Console</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </label>
                  <Input
                    value={tools.bingWebmaster?.googleVerificationCode || ""}
                    onChange={(e) => handleUpdate("bingWebmaster", "googleVerificationCode", e.target.value)}
                    placeholder="google-site-verification=..."
                    className="bg-zinc-900 border-white/10 text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Yandex Verification</label>
                    <Input
                      value={tools.bingWebmaster?.yandexVerificationCode || ""}
                      onChange={(e) => handleUpdate("bingWebmaster", "yandexVerificationCode", e.target.value)}
                      className="bg-zinc-900 border-white/10 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Baidu Verification</label>
                    <Input
                      value={tools.bingWebmaster?.baiduVerificationCode || ""}
                      onChange={(e) => handleUpdate("bingWebmaster", "baiduVerificationCode", e.target.value)}
                      className="bg-zinc-900 border-white/10 text-xs font-mono"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
