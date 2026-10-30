"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Link2,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Globe,
  Share2,
  BarChart2,
  CheckCircle2,
  Layers,
  Search,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface CustomLinkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  icon: string;
  description: string;
  clickCount: number;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminLinksPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<CustomLinkItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [formData, setFormData] = useState<Partial<CustomLinkItem>>({
    title: "",
    url: "https://",
    category: "General",
    icon: "Globe",
    description: "",
    clickCount: 0,
    sortOrder: 0,
    isActive: true,
  });

  const { data, isLoading } = useQuery<{ success: boolean; links: CustomLinkItem[] }>({
    queryKey: ["adminLinks"],
    queryFn: async () => (await api.get("/api/admin/links")).data,
  });

  const links = data?.links || [];

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<CustomLinkItem>) => {
      return (await api.post("/api/admin/links", payload)).data;
    },
    onSuccess: () => {
      toast.success("Link added successfully");
      queryClient.invalidateQueries({ queryKey: ["adminLinks"] });
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create link");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CustomLinkItem> }) => {
      return (await api.put(`/api/admin/links/${id}`, payload)).data;
    },
    onSuccess: () => {
      toast.success("Link updated successfully");
      queryClient.invalidateQueries({ queryKey: ["adminLinks"] });
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update link");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/api/admin/links/${id}`)).data;
    },
    onSuccess: () => {
      toast.success("Link deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminLinks"] });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete link");
    },
  });

  const handleOpenCreate = () => {
    setEditingLink(null);
    setFormData({
      title: "",
      url: "https://",
      category: "Social",
      icon: "Globe",
      description: "",
      clickCount: 0,
      sortOrder: links.length + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (link: CustomLinkItem) => {
    setEditingLink(link);
    setFormData({ ...link });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title?.trim() || !formData.url?.trim()) {
      toast.error("Title and URL are required");
      return;
    }

    if (editingLink) {
      updateMutation.mutate({ id: editingLink.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const categories = ["all", ...Array.from(new Set(links.map((l) => l.category)))];

  const filteredLinks = links.filter((l) => {
    const matchesCategory = selectedCategory === "all" || l.category === selectedCategory;
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Quick Links & Navigation Cards"
        subtitle="Manage studio shortcuts, external documentation resources, and social redirects"
        action={
          <Button size="sm" variant="studio" onClick={handleOpenCreate} className="gap-1.5 h-8 text-xs shadow-md">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Link</span>
          </Button>
        }
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Links</CardTitle>
              <Link2 className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{links.length}</div>
              <p className="text-xs text-zinc-400 mt-1">Configured resources</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Clicks</CardTitle>
              <BarChart2 className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {links.reduce((acc, l) => acc + (l.clickCount || 0), 0)}
              </div>
              <p className="text-xs text-cyan-400 mt-1">Total visitor click-throughs</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active Links</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{links.filter((l) => l.isActive).length}</div>
              <p className="text-xs text-emerald-400 mt-1">Live & enabled</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search links..."
              className="bg-zinc-900 border-white/10 pl-8 text-xs h-9"
            />
          </div>
        </div>

        {/* Links List / Table */}
        <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className="text-sm font-semibold text-white">Active Links ({filteredLinks.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full bg-zinc-800" />
                ))}
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="p-12 text-center">
                <Link2 className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">No links matching your filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-white/[0.02] transition-colors gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20 shrink-0 mt-0.5 sm:mt-0">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">{link.title}</span>
                          <Badge variant="outline" className="text-[10px] py-0 border-white/10 text-zinc-400">
                            {link.category}
                          </Badge>
                          {!link.isActive && (
                            <Badge variant="destructive" className="text-[10px] py-0">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                          <span className="truncate text-cyan-400/90 font-mono text-[11px] max-w-xs">{link.url}</span>
                          {link.description && <span className="hidden md:inline truncate text-zinc-500">• {link.description}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <span className="text-xs text-zinc-400 font-mono flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-md border border-white/5">
                        <BarChart2 className="h-3 w-3 text-cyan-400" />
                        <span>{link.clickCount} clicks</span>
                      </span>

                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition-colors"
                        title="Open link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      <button
                        onClick={() => handleOpenEdit(link)}
                        className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition-colors"
                        title="Edit link"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteId(link.id)}
                        className="p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Delete link"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editingLink ? "Edit Link" : "Add New Resource Link"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Configure destination URL, label, category, and active visibility.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Title *</label>
              <Input
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Official Discord Community"
                className="bg-zinc-900 border-white/10 text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Destination URL *</label>
              <Input
                value={formData.url || ""}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                className="bg-zinc-900 border-white/10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Category</label>
                <Input
                  value={formData.category || ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Social, Community, Docs"
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Sort Order</label>
                <Input
                  type="number"
                  value={formData.sortOrder ?? 0}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Short Description</label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary displayed to visitors..."
                rows={2}
                className="bg-zinc-900 border-white/10 text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/5">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isActive ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <span className="text-xs text-zinc-300">Active / Enabled</span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="studio"
              size="sm"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="text-xs"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm bg-zinc-950 border-white/10 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">Delete Link?</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Are you sure you want to delete this resource link?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              className="text-xs"
            >
              {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

