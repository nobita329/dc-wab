"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Scale,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  Check,
  Save,
  Clock,
  Shield,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  Link2,
  MessageSquare,
  Mail,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LegalPage } from "@nova/shared";
import { MarkdownRenderer } from "@/components/legal/MarkdownRenderer";

export default function AdminLegalPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"directory" | "editor" | "submissions">("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");

  // State for the editor
  const [selectedPage, setSelectedPage] = useState<LegalPage | null>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorSlug, setEditorSlug] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorStatus, setEditorStatus] = useState<"published" | "draft">("published");
  const [editorSeoTitle, setEditorSeoTitle] = useState("");
  const [editorSeoDesc, setEditorSeoDesc] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [previewMode, setPreviewMode] = useState<"split" | "edit" | "preview">("split");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<LegalPage | null>(null);

  // Textarea ref for inserting formatting
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch all legal pages
  const {
    data: pagesData,
    isLoading,
    refetch: refetchPages,
  } = useQuery<{ success: boolean; pages: LegalPage[] }>({
    queryKey: ["adminLegalPages"],
    queryFn: async () => (await api.get("/api/admin/legal")).data,
  });

  // Fetch contact inquiries
  const { data: submissionsData, refetch: refetchSubmissions } = useQuery<{
    success: boolean;
    submissions: any[];
  }>({
    queryKey: ["adminContactSubmissions"],
    queryFn: async () => (await api.get("/api/admin/contact-submissions")).data,
  });

  const legalPages = pagesData?.pages || [];
  const submissions = submissionsData?.submissions || [];

  // Statistics
  const totalCount = legalPages.length;
  const publishedCount = legalPages.filter((p) => p.status === "published").length;
  const draftCount = legalPages.filter((p) => p.status === "draft").length;
  const submissionsCount = submissions.length;

  // Save / Update mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: {
      id?: string;
      title: string;
      slug: string;
      content: string;
      status: "published" | "draft";
      seo_title?: string;
      seo_description?: string;
    }) => {
      if (payload.id) {
        return (await api.put(`/api/admin/legal/${payload.id}`, payload)).data;
      } else {
        return (await api.post("/api/admin/legal", payload)).data;
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Legal page saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminLegalPages"] });
      queryClient.invalidateQueries({ queryKey: ["publishedLegalPages"] });
      if (data.page) {
        setSelectedPage(data.page);
        setIsCreatingNew(false);
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to save legal page");
    },
  });

  // Quick Status Toggle mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "published" | "draft" }) => {
      return (await api.patch(`/api/admin/legal/${id}/status`, { status })).data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["adminLegalPages"] });
      queryClient.invalidateQueries({ queryKey: ["publishedLegalPages"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to toggle status");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/api/admin/legal/${id}`)).data;
    },
    onSuccess: () => {
      toast.success("Legal page deleted successfully");
      setDeleteDialogOpen(false);
      setPageToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["adminLegalPages"] });
      queryClient.invalidateQueries({ queryKey: ["publishedLegalPages"] });
      if (selectedPage?.id === pageToDelete?.id) {
        setSelectedPage(null);
        setActiveTab("directory");
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Failed to delete page");
    },
  });

  // Load page into editor
  const handleEditPage = (page: LegalPage) => {
    setSelectedPage(page);
    setIsCreatingNew(false);
    setEditorTitle(page.title);
    setEditorSlug(page.slug);
    setEditorContent(page.content);
    setEditorStatus(page.status);
    setEditorSeoTitle(page.seo_title || "");
    setEditorSeoDesc(page.seo_description || "");
    setActiveTab("editor");
  };

  // Start new page
  const handleStartNewPage = () => {
    setSelectedPage(null);
    setIsCreatingNew(true);
    setEditorTitle("");
    setEditorSlug("");
    setEditorContent("# Document Title\n\n**Effective Date:** October 30, 2026\n\nProvide the policy details here...");
    setEditorStatus("published");
    setEditorSeoTitle("");
    setEditorSeoDesc("");
    setActiveTab("editor");
  };

  // Auto-slugify title
  const handleTitleChange = (val: string) => {
    setEditorTitle(val);
    if (isCreatingNew || !editorSlug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setEditorSlug(generated);
      if (!editorSeoTitle) {
        setEditorSeoTitle(`${val} — Nova Studio`);
      }
    }
  };

  // Save current editor
  const handleSave = () => {
    if (!editorTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!editorSlug.trim()) {
      toast.error("URL Slug is required");
      return;
    }
    if (!editorContent.trim()) {
      toast.error("Content is required");
      return;
    }

    saveMutation.mutate({
      id: selectedPage?.id,
      title: editorTitle.trim(),
      slug: editorSlug.trim().toLowerCase(),
      content: editorContent,
      status: editorStatus,
      seo_title: editorSeoTitle.trim(),
      seo_description: editorSeoDesc.trim(),
    });
  };

  // Helper to insert markdown tokens at cursor
  const insertToken = (before: string, after: string = "", defaultText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editorContent.substring(start, end) || defaultText;
    const replacement = `${before}${selectedText}${after}`;

    const newContent =
      editorContent.substring(0, start) + replacement + editorContent.substring(end);
    setEditorContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 50);
  };

  // Filtered pages
  const filteredPages = legalPages.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <AdminHeader
        title="Legal Pages Management"
        subtitle="Author, configure, draft, publish, and audit legal policies, GDPR compliance, and terms of service."
        action={
          <div className="flex items-center gap-2">
            <Link href="/privacy-policy" target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5 border-white/10 hover:bg-white/5">
                <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden sm:inline">View Public Directory</span>
              </Button>
            </Link>
            <Button
              variant="studio"
              size="sm"
              onClick={handleStartNewPage}
              className="gap-1.5 shadow-md shadow-violet-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>New Legal Page</span>
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-semibold text-zinc-400 tracking-wider font-mono">
                  Total Policies
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">{totalCount}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Managed legal records</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/15 text-violet-400 border border-violet-500/20">
                <Scale className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-semibold text-zinc-400 tracking-wider font-mono">
                  Published Pages
                </p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">{publishedCount}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Active on public site</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-semibold text-zinc-400 tracking-wider font-mono">
                  Draft Documents
                </p>
                <h3 className="text-2xl font-bold text-amber-400 mt-1">{draftCount}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Unpublished revisions</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                <EyeOff className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/50 backdrop-blur-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-semibold text-zinc-400 tracking-wider font-mono">
                  Contact Inquiries
                </p>
                <h3 className="text-2xl font-bold text-cyan-400 mt-1">{submissionsCount}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Submitted user requests</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                <Mail className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface Tabs */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
          <TabsList className="bg-zinc-900/80 border border-white/10 p-1 rounded-xl">
            <TabsTrigger value="directory" className="text-xs gap-1.5 py-2">
              <FileText className="h-3.5 w-3.5" />
              <span>Policy Directory ({totalCount})</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="text-xs gap-1.5 py-2">
              <Edit3 className="h-3.5 w-3.5" />
              <span>
                {isCreatingNew ? "Create New Page" : selectedPage ? `Edit: ${selectedPage.title}` : "Rich Editor"}
              </span>
            </TabsTrigger>
            <TabsTrigger value="submissions" className="text-xs gap-1.5 py-2">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>User Inquiries ({submissionsCount})</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Policy Directory */}
          <TabsContent value="directory" className="space-y-4 mt-6">
            <Card className="border-white/10 bg-zinc-900/40">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Scale className="h-4 w-4 text-violet-400" />
                    <span>Published & Draft Legal Policies</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Live legal pages are automatically integrated into the public website footer and navigation.
                  </CardDescription>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                    <Input
                      type="text"
                      placeholder="Search policies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9 text-xs w-48 bg-zinc-950/60 border-white/10"
                    />
                  </div>

                  <select
                    value={filterStatus}
                    onChange={(e: any) => setFilterStatus(e.target.value)}
                    className="h-9 px-2.5 rounded-lg bg-zinc-950/60 border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-violet-500"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refetchPages()}
                    className="h-9 w-9 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                    title="Refresh policies"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-12 w-full bg-zinc-800" />
                    <Skeleton className="h-12 w-full bg-zinc-800" />
                    <Skeleton className="h-12 w-full bg-zinc-800" />
                  </div>
                ) : filteredPages.length === 0 ? (
                  <div className="p-12 text-center">
                    <Scale className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                    <h4 className="text-sm font-semibold text-white">No Legal Pages Found</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? "No policies matched your search criteria."
                        : "Click 'New Legal Page' to create your first policy."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-y border-white/5 bg-zinc-950/50 text-[11px] font-semibold text-zinc-400 uppercase font-mono">
                          <th className="py-3 px-6">Document Title</th>
                          <th className="py-3 px-4">URL Route</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Last Updated</th>
                          <th className="py-3 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredPages.map((page) => {
                          const isPublished = page.status === "published";
                          const formattedDate = new Date(page.updated_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          });

                          return (
                            <tr
                              key={page.id}
                              className="hover:bg-white/[0.02] transition-colors group"
                            >
                              <td className="py-3.5 px-6 font-semibold text-white">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20 shrink-0">
                                    <FileText className="h-3.5 w-3.5" />
                                  </div>
                                  <div>
                                    <span className="block text-zinc-100">{page.title}</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">ID: {page.id}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-mono text-zinc-300">
                                <Link
                                  href={`/${page.slug}`}
                                  target="_blank"
                                  className="text-cyan-400 hover:text-cyan-300 hover:underline inline-flex items-center gap-1"
                                >
                                  <span>/{page.slug}</span>
                                  <ExternalLink className="h-3 w-3 opacity-70" />
                                </Link>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={
                                      isPublished
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium"
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium"
                                    }
                                  >
                                    {isPublished ? "Published" : "Draft"}
                                  </Badge>

                                  <button
                                    onClick={() =>
                                      statusMutation.mutate({
                                        id: page.id,
                                        status: isPublished ? "draft" : "published",
                                      })
                                    }
                                    title={isPublished ? "Unpublish page" : "Publish page"}
                                    className="text-zinc-500 hover:text-white transition-colors"
                                  >
                                    {isPublished ? (
                                      <EyeOff className="h-3.5 w-3.5" />
                                    ) : (
                                      <Eye className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-zinc-400 flex items-center gap-1.5 font-mono text-[11px]">
                                <Clock className="h-3 w-3 text-zinc-500" />
                                <span>{formattedDate}</span>
                              </td>

                              <td className="py-3.5 px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditPage(page)}
                                    className="h-7 px-2.5 text-xs border-white/10 hover:bg-white/5 text-zinc-300 gap-1"
                                  >
                                    <Edit3 className="h-3 w-3 text-violet-400" />
                                    <span>Edit</span>
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setPageToDelete(page);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                                    title="Delete policy"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Rich Text & Markdown Editor */}
          <TabsContent value="editor" className="space-y-4 mt-6">
            <Card className="border-white/10 bg-zinc-900/40">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-violet-400" />
                    <span>
                      {isCreatingNew
                        ? "Create New Legal Document"
                        : `Editing Policy: ${selectedPage?.title || "Document"}`}
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Format with Markdown, manage SEO metadata, configure URL slug, and preview before publishing.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="bg-zinc-950 p-0.5 rounded-lg border border-white/10 flex items-center">
                    <button
                      onClick={() => setPreviewMode("edit")}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        previewMode === "edit"
                          ? "bg-violet-600 text-white"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Editor Only
                    </button>
                    <button
                      onClick={() => setPreviewMode("split")}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        previewMode === "split"
                          ? "bg-violet-600 text-white"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Split View
                    </button>
                    <button
                      onClick={() => setPreviewMode("preview")}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        previewMode === "preview"
                          ? "bg-violet-600 text-white"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Live Preview
                    </button>
                  </div>

                  <Button
                    variant="studio"
                    size="sm"
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="gap-1.5 shadow-md shadow-violet-600/20"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saveMutation.isPending ? "Saving..." : "Save Policy"}</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Meta Configuration Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Policy Title <span className="text-violet-400">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Security & Compliance"
                      value={editorTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="h-9 text-xs bg-zinc-900 border-white/10 focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                      <span>URL Slug</span>
                      <span className="text-[10px] text-zinc-500 font-mono">/{editorSlug || "slug"}</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., security-compliance"
                      value={editorSlug}
                      onChange={(e) => setEditorSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      className="h-9 text-xs bg-zinc-900 border-white/10 font-mono focus:border-violet-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      Publication Status
                    </label>
                    <div className="flex items-center justify-between h-9 px-3 rounded-lg bg-zinc-900 border border-white/10">
                      <span className="text-xs font-medium text-zinc-300">
                        {editorStatus === "published" ? "Live / Published" : "Draft / Hidden"}
                      </span>
                      <Switch
                        checked={editorStatus === "published"}
                        onCheckedChange={(checked) => setEditorStatus(checked ? "published" : "draft")}
                      />
                    </div>
                  </div>
                </div>

                {/* SEO Configuration Expandable */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-950/40 border border-white/5 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-300 flex items-center justify-between">
                      <span>SEO Meta Title</span>
                      <span className="text-[10px] text-zinc-500">{editorSeoTitle.length}/60 chars</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Policy Title — Nova Studio"
                      value={editorSeoTitle}
                      onChange={(e) => setEditorSeoTitle(e.target.value)}
                      className="h-8 text-xs bg-zinc-900 border-white/10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-300 flex items-center justify-between">
                      <span>SEO Meta Description</span>
                      <span className="text-[10px] text-zinc-500">{editorSeoDesc.length}/160 chars</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Short summary for Google and social previews..."
                      value={editorSeoDesc}
                      onChange={(e) => setEditorSeoDesc(e.target.value)}
                      className="h-8 text-xs bg-zinc-900 border-white/10"
                    />
                  </div>
                </div>

                {/* Formatting Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 rounded-xl bg-zinc-950 border border-white/10 text-zinc-300">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => insertToken("**", "**", "bold text")}
                    className="h-7 w-7 text-zinc-400 hover:text-white"
                    title="Bold (**text**)"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => insertToken("*", "*", "italic text")}
                    className="h-7 w-7 text-zinc-400 hover:text-white"
                    title="Italic (*text*)"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </Button>
                  <span className="h-4 w-px bg-white/10 mx-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => insertToken("# ", "", "Heading 1")}
                    className="h-7 w-7 text-zinc-400 hover:text-white"
                    title="Heading 1 (#)"
                  >
                    <Heading1 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => insertToken("## ", "", "Heading 2")}
                    className="h-7 w-7 text-zinc-400 hover:text-white"
                    title="Heading 2 (##)"
                  >
                    <Heading2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => insertToken("### ", "", "Heading 3")}
                    className="h-7 w-7 text-zinc-400 hover:text-white"
                    title="Heading 3 (###)"
                  >
                    <Heading3 className="h-3.5 w-3.5" />
                  </Button>
                  <span className="h-4 w-px bg-white/10 mx-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => insertToken("- ", "", "List item")}
                    className="h-7 w-7 text-zinc-400 hover:text-white"
                    title="Bullet List (-)"
                  >
                    <List className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => insertToken("1. ", "", "First item")}
                    className="h-7 w-7 text-zinc-400 hover:text-white"
                    title="Numbered List (1.)"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => insertToken("> ", "", "Blockquote")}
                    className="h-7 w-7 text-zinc-400 hover:text-white"
                    title="Blockquote (>)"
                  >
                    <Quote className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => insertToken("`", "`", "code")}
                    className="h-7 w-7 text-zinc-400 hover:text-white"
                    title="Inline Code (`)"
                  >
                    <Code className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => insertToken("[", "](https://example.com)", "link title")}
                    className="h-7 w-7 text-zinc-400 hover:text-white"
                    title="Link [text](url)"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => insertToken("\n---\n", "", "")}
                    className="h-7 w-7 text-zinc-400 hover:text-white"
                    title="Horizontal Divider (---)"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>

                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        insertToken(
                          "\n\n## Data Subject Rights (GDPR & CCPA)\nUnder applicable privacy regulations, you have the right to request access, correction, or deletion of your data through our [Data Deletion Portal](/data-deletion).\n",
                          "",
                          ""
                        )
                      }
                      className="h-7 text-[11px] border-white/10 hover:bg-white/5 text-cyan-300"
                    >
                      + GDPR Clause
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        insertToken(
                          "\n\n## Contact Information\nFor inquiries concerning this policy:\n- **Email:** [privacy@novastudio.agency](mailto:privacy@novastudio.agency)\n- **Web Form:** [/contact](/contact)\n",
                          "",
                          ""
                        )
                      }
                      className="h-7 text-[11px] border-white/10 hover:bg-white/5 text-violet-300"
                    >
                      + Contact Clause
                    </Button>
                  </div>
                </div>

                {/* Editor & Preview Area */}
                <div
                  className={`grid gap-6 ${
                    previewMode === "split"
                      ? "grid-cols-1 lg:grid-cols-2"
                      : "grid-cols-1"
                  }`}
                >
                  {/* Markdown Input */}
                  {(previewMode === "split" || previewMode === "edit") && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="font-semibold text-zinc-300">Policy Content (Markdown)</span>
                        <span className="font-mono text-[11px]">{editorContent.length} characters</span>
                      </div>
                      <Textarea
                        ref={textareaRef}
                        rows={22}
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        placeholder="Write your policy in Markdown..."
                        className="font-mono text-xs leading-relaxed bg-zinc-950/80 border-white/10 focus:border-violet-500 rounded-2xl resize-y"
                      />
                    </div>
                  )}

                  {/* Real-time Preview */}
                  {(previewMode === "split" || previewMode === "preview") && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5 text-cyan-400" />
                          <span>Live Public Presentation</span>
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            editorStatus === "published"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]"
                          }
                        >
                          {editorStatus === "published" ? "Will be Public" : "Draft Preview"}
                        </Badge>
                      </div>

                      <div className="h-[480px] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/90 p-6 backdrop-blur-sm shadow-inner">
                        <article className="prose prose-invert max-w-none">
                          <MarkdownRenderer content={editorContent} />
                        </article>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: User Inquiries */}
          <TabsContent value="submissions" className="space-y-4 mt-6">
            <Card className="border-white/10 bg-zinc-900/40">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Mail className="h-4 w-4 text-cyan-400" />
                    <span>Inquiries & Data Deletion Requests</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Messages transmitted from the public /contact and /data-deletion endpoints.
                  </CardDescription>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchSubmissions()}
                  className="gap-1.5 border-white/10 hover:bg-white/5 text-zinc-300"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh Inquiries</span>
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                {submissions.length === 0 ? (
                  <div className="p-12 text-center">
                    <Mail className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                    <h4 className="text-sm font-semibold text-white">No Inquiries Received Yet</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                      Submissions from the public contact page will appear here for administrative review.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-y border-white/5 bg-zinc-950/50 text-[11px] font-semibold text-zinc-400 uppercase font-mono">
                          <th className="py-3 px-6">Sender</th>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-6">Message Excerpt</th>
                          <th className="py-3 px-4">Received</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {submissions.map((sub: any) => {
                          const date = new Date(sub.created_at).toLocaleString();
                          return (
                            <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3.5 px-6 font-semibold text-white">
                                <div>
                                  <span>{sub.name}</span>
                                  <a
                                    href={`mailto:${sub.email}`}
                                    className="block text-[11px] text-cyan-400 hover:underline font-mono"
                                  >
                                    {sub.email}
                                  </a>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-medium text-zinc-300">
                                {sub.subject || "General Inquiry"}
                              </td>

                              <td className="py-3.5 px-6 text-zinc-400 max-w-md truncate">
                                {sub.message}
                              </td>

                              <td className="py-3.5 px-4 text-zinc-500 font-mono text-[11px]">
                                {date}
                              </td>

                              <td className="py-3.5 px-4">
                                <Badge
                                  variant="outline"
                                  className={
                                    sub.status === "unread"
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                      : "bg-zinc-800 text-zinc-400 border-white/10"
                                  }
                                >
                                  {sub.status || "unread"}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md border-white/10 bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Confirm Policy Deletion</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 pt-2">
              Are you sure you want to delete{" "}
              <strong className="text-white">"{pageToDelete?.title}"</strong> (/{pageToDelete?.slug})?
              This will permanently purge this policy from the database and remove it from the public website footer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-white/10 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => pageToDelete && deleteMutation.mutate(pageToDelete.id)}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{deleteMutation.isPending ? "Purging..." : "Delete Permanently"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

