"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderGit2,
  Plus,
  ExternalLink,
  Github,
  Star,
  Edit2,
  Trash2,
  Sparkles,
  Layers,
  Search,
  CheckCircle2,
  Eye,
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

interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  imageUrl: string;
  tags: string[];
  demoUrl: string;
  githubUrl: string;
  starsCount: number;
  featured: boolean;
  sortOrder: number;
  status: "published" | "draft";
}

export default function AdminProjectsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tagInput, setTagInput] = useState("");

  const [formData, setFormData] = useState<Partial<ProjectItem>>({
    title: "",
    slug: "",
    category: "Web Application",
    description: "",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800",
    tags: ["Next.js", "TypeScript"],
    demoUrl: "",
    githubUrl: "",
    starsCount: 15,
    featured: false,
    sortOrder: 0,
    status: "published",
  });

  const { data, isLoading } = useQuery<{ success: boolean; projects: ProjectItem[] }>({
    queryKey: ["adminProjects"],
    queryFn: async () => (await api.get("/api/admin/projects")).data,
  });

  const projects = data?.projects || [];

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<ProjectItem>) => {
      return (await api.post("/api/admin/projects", payload)).data;
    },
    onSuccess: () => {
      toast.success("Project created successfully");
      queryClient.invalidateQueries({ queryKey: ["adminProjects"] });
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create project");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<ProjectItem> }) => {
      return (await api.put(`/api/admin/projects/${id}`, payload)).data;
    },
    onSuccess: () => {
      toast.success("Project updated successfully");
      queryClient.invalidateQueries({ queryKey: ["adminProjects"] });
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update project");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/api/admin/projects/${id}`)).data;
    },
    onSuccess: () => {
      toast.success("Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminProjects"] });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete project");
    },
  });

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({
      title: "",
      slug: "",
      category: "Web Application",
      description: "",
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800",
      tags: ["Next.js 15", "React 19", "Tailwind CSS"],
      demoUrl: "",
      githubUrl: "",
      starsCount: 24,
      featured: false,
      sortOrder: projects.length + 1,
      status: "published",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (project: ProjectItem) => {
    setEditingProject(project);
    setFormData({ ...project });
    setModalOpen(true);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), tagInput.trim()],
    }));
    setTagInput("");
  };

  const handleRemoveTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!formData.title?.trim()) {
      toast.error("Project title is required");
      return;
    }

    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const categories = ["all", ...Array.from(new Set(projects.map((p) => p.category)))];

  const filteredProjects = projects.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Projects & Showcase"
        subtitle="Manage portfolio case studies, demo applications, and open-source releases"
        action={
          <Button size="sm" variant="studio" onClick={handleOpenCreate} className="gap-1.5 h-8 text-xs shadow-md">
            <Plus className="h-3.5 w-3.5" />
            <span>New Project</span>
          </Button>
        }
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Projects</CardTitle>
              <FolderGit2 className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{projects.length}</div>
              <p className="text-xs text-zinc-400 mt-1">Archived & Live</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Published</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {projects.filter((p) => p.status === "published").length}
              </div>
              <p className="text-xs text-emerald-400 mt-1">Live on showcase</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Featured</CardTitle>
              <Sparkles className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{projects.filter((p) => p.featured).length}</div>
              <p className="text-xs text-amber-400 mt-1">Hero spot carousel</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Stars</CardTitle>
              <Star className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {projects.reduce((acc, p) => acc + (p.starsCount || 0), 0)}
              </div>
              <p className="text-xs text-zinc-400 mt-1">Across all repos</p>
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
              placeholder="Search projects..."
              className="bg-zinc-900 border-white/10 pl-8 text-xs h-9"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 w-full rounded-2xl bg-zinc-900" />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="border-white/10 bg-zinc-900/30 p-12 text-center">
            <FolderGit2 className="h-10 w-10 text-zinc-500 mx-auto mb-3" />
            <p className="text-sm text-zinc-300 font-medium">No projects found</p>
            <p className="text-xs text-zinc-500 mt-1">Add a project to showcase your engineering achievements.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="border border-white/10 bg-zinc-900/40 backdrop-blur-md overflow-hidden flex flex-col justify-between group hover:border-violet-500/30 transition-all"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="h-44 w-full relative bg-zinc-950 overflow-hidden">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <FolderGit2 className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <Badge variant="secondary" className="bg-zinc-950/80 backdrop-blur-md border-white/10 text-[10px]">
                        {project.category}
                      </Badge>
                      {project.featured && (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] gap-1">
                          <Star className="h-2.5 w-2.5 fill-amber-400" />
                          <span>Featured</span>
                        </Badge>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(project)}
                        className="p-1.5 rounded-lg bg-zinc-950/80 backdrop-blur-md hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
                        title="Edit project"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setDeleteId(project.id)}
                        className="p-1.5 rounded-lg bg-zinc-950/80 backdrop-blur-md hover:bg-red-500/20 text-zinc-300 hover:text-red-400 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-base font-bold text-white flex items-center justify-between">
                      <span className="truncate">{project.title}</span>
                      <span className="flex items-center gap-1 text-xs text-amber-400 font-normal shrink-0">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <span>{project.starsCount}</span>
                      </span>
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400 line-clamp-2 mt-1">
                      {project.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pb-3">
                    <div className="flex flex-wrap gap-1">
                      {project.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Github className="h-3.5 w-3.5" />
                        <span>Repo</span>
                      </a>
                    )}
                    {project.demoUrl && (
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-cyan-400 transition-colors flex items-center gap-1 ml-2"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      project.status === "published"
                        ? "border-emerald-500/20 text-emerald-400"
                        : "border-zinc-700 text-zinc-500"
                    }`}
                  >
                    {project.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl bg-zinc-950 border-white/10 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editingProject ? "Edit Project" : "Create Showcase Project"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Configure portfolio display title, category, tags, demo URL, and GitHub repository.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Project Title *</label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Discord Bot Engine"
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Category</label>
                <Input
                  value={formData.category || ""}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Web App, AI, Design System"
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Description</label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="High impact overview of features and architecture..."
                rows={2}
                className="bg-zinc-900 border-white/10 text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Cover Image URL</label>
              <Input
                value={formData.imageUrl || ""}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                className="bg-zinc-900 border-white/10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Demo / Preview URL</label>
                <Input
                  value={formData.demoUrl || ""}
                  onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                  placeholder="https://preview.novastudio.internal"
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">GitHub Repository URL</label>
                <Input
                  value={formData.githubUrl || ""}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  placeholder="https://github.com/..."
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Stars Count</label>
                <Input
                  type="number"
                  value={formData.starsCount ?? 12}
                  onChange={(e) => setFormData({ ...formData, starsCount: parseInt(e.target.value, 10) || 0 })}
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Publish Status</label>
                <select
                  value={formData.status || "published"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full h-9 rounded-md bg-zinc-900 border border-white/10 px-3 text-xs text-zinc-200"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>
            </div>

            {/* Tags Editor */}
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Tech Stack Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  placeholder="Add technology tag and press Enter..."
                  className="bg-zinc-900 border-white/10 text-xs"
                />
                <Button size="sm" variant="secondary" onClick={handleAddTag} className="h-9 px-3 text-xs">
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {(formData.tags || []).map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-600/15 border border-violet-500/20 text-violet-300 text-xs"
                  >
                    <span>{t}</span>
                    <button onClick={() => handleRemoveTag(idx)} className="hover:text-red-400">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Featured toggle */}
            <div className="pt-2 flex items-center justify-between border-t border-white/5">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.featured ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <span className="text-xs text-zinc-300">Feature on Home Page & Carousel</span>
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
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm bg-zinc-950 border-white/10 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">Delete Project?</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Are you sure you want to delete this project? This will remove it from the showcase.
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

