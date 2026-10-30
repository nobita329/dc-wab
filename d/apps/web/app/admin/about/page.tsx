"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  Edit2,
  Layers,
  History,
  Target,
  Eye,
  Award,
  Users,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface AboutSettings {
  id: string;
  story: string;
  mission: string;
  vision: string;
  yearsExperience: number;
  projectsDelivered: number;
  happyClients: number;
  coreValues: Array<{ id: string; title: string; description: string; icon: string }>;
  milestones: Array<{ id: string; year: string; title: string; description: string }>;
  updatedAt: string;
  updatedBy: string;
}

export default function AdminAboutPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<AboutSettings>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Modals for Core Values and Milestones
  const [valueModalOpen, setValueModalOpen] = useState(false);
  const [editingValueIndex, setEditingValueIndex] = useState<number | null>(null);
  const [valueForm, setValueForm] = useState({ title: "", description: "", icon: "Sparkles" });

  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [editingMilestoneIndex, setEditingMilestoneIndex] = useState<number | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({ year: "2026", title: "", description: "" });

  const { data, isLoading } = useQuery<{ success: boolean; about: AboutSettings }>({
    queryKey: ["adminAbout"],
    queryFn: async () => (await api.get("/api/admin/about")).data,
  });

  useEffect(() => {
    if (data?.about) {
      setFormData(JSON.parse(JSON.stringify(data.about)));
      setIsDirty(false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<AboutSettings>) => {
      return (await api.put("/api/admin/about", payload)).data;
    },
    onSuccess: () => {
      toast.success("About studio information saved successfully");
      queryClient.invalidateQueries({ queryKey: ["adminAbout"] });
      setIsDirty(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save about information");
    },
  });

  const handleChange = (field: keyof AboutSettings, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setIsDirty(true);
  };

  // Core Value Actions
  const handleOpenAddValue = () => {
    setEditingValueIndex(null);
    setValueForm({ title: "", description: "", icon: "Zap" });
    setValueModalOpen(true);
  };

  const handleOpenEditValue = (index: number) => {
    setEditingValueIndex(index);
    const item = formData.coreValues?.[index];
    if (item) {
      setValueForm({ title: item.title, description: item.description, icon: item.icon });
    }
    setValueModalOpen(true);
  };

  const handleSaveValue = () => {
    if (!valueForm.title.trim()) {
      toast.error("Value title is required");
      return;
    }

    const currentValues = [...(formData.coreValues || [])];
    if (editingValueIndex !== null) {
      currentValues[editingValueIndex] = {
        ...currentValues[editingValueIndex],
        ...valueForm,
      };
    } else {
      currentValues.push({
        id: "val-" + Date.now(),
        ...valueForm,
      });
    }

    handleChange("coreValues", currentValues);
    setValueModalOpen(false);
  };

  const handleDeleteValue = (index: number) => {
    const filtered = (formData.coreValues || []).filter((_, i) => i !== index);
    handleChange("coreValues", filtered);
  };

  // Milestone Actions
  const handleOpenAddMilestone = () => {
    setEditingMilestoneIndex(null);
    setMilestoneForm({ year: new Date().getFullYear().toString(), title: "", description: "" });
    setMilestoneModalOpen(true);
  };

  const handleOpenEditMilestone = (index: number) => {
    setEditingMilestoneIndex(index);
    const item = formData.milestones?.[index];
    if (item) {
      setMilestoneForm({ year: item.year, title: item.title, description: item.description });
    }
    setMilestoneModalOpen(true);
  };

  const handleSaveMilestone = () => {
    if (!milestoneForm.title.trim() || !milestoneForm.year.trim()) {
      toast.error("Year and milestone title are required");
      return;
    }

    const currentMilestones = [...(formData.milestones || [])];
    if (editingMilestoneIndex !== null) {
      currentMilestones[editingMilestoneIndex] = {
        ...currentMilestones[editingMilestoneIndex],
        ...milestoneForm,
      };
    } else {
      currentMilestones.push({
        id: "mile-" + Date.now(),
        ...milestoneForm,
      });
    }

    handleChange("milestones", currentMilestones);
    setMilestoneModalOpen(false);
  };

  const handleDeleteMilestone = (index: number) => {
    const filtered = (formData.milestones || []).filter((_, i) => i !== index);
    handleChange("milestones", filtered);
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="About Studio & Milestones"
        subtitle="Manage brand story, core values, studio metrics, and historical timeline"
        action={
          <Button
            size="sm"
            variant="studio"
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending || !isDirty}
            className="gap-1.5 h-8 text-xs shadow-md"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saveMutation.isPending ? "Saving..." : isDirty ? "Save Changes" : "Saved"}</span>
          </Button>
        }
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full bg-zinc-900" />
            <Skeleton className="h-64 w-full bg-zinc-900" />
          </div>
        ) : (
          <Tabs defaultValue="story" className="space-y-6">
            <TabsList className="bg-zinc-900 border border-white/10 p-1">
              <TabsTrigger value="story" className="text-xs">Story & Vision</TabsTrigger>
              <TabsTrigger value="metrics" className="text-xs">Stats & Counters</TabsTrigger>
              <TabsTrigger value="values" className="text-xs">Core Values ({formData.coreValues?.length || 0})</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">Milestones ({formData.milestones?.length || 0})</TabsTrigger>
            </TabsList>

            {/* Story & Vision Tab */}
            <TabsContent value="story" className="space-y-6">
              <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-white">Brand Narrative</CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    The background story and mission statements presented to clients.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1.5">Studio Origin Story</label>
                    <Textarea
                      value={formData.story || ""}
                      onChange={(e) => handleChange("story", e.target.value)}
                      rows={4}
                      className="bg-zinc-900 border-white/10 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1.5">Mission Statement</label>
                      <Textarea
                        value={formData.mission || ""}
                        onChange={(e) => handleChange("mission", e.target.value)}
                        rows={3}
                        className="bg-zinc-900 border-white/10 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-300 font-medium mb-1.5">Vision Statement</label>
                      <Textarea
                        value={formData.vision || ""}
                        onChange={(e) => handleChange("vision", e.target.value)}
                        rows={3}
                        className="bg-zinc-900 border-white/10 text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="space-y-6">
              <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-white">Key Studio Numbers</CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Public figures highlighting studio achievements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1.5">Years of Experience</label>
                    <Input
                      type="number"
                      value={formData.yearsExperience ?? 5}
                      onChange={(e) => handleChange("yearsExperience", parseInt(e.target.value, 10) || 0)}
                      className="bg-zinc-900 border-white/10 text-xs text-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1.5">Projects Delivered</label>
                    <Input
                      type="number"
                      value={formData.projectsDelivered ?? 140}
                      onChange={(e) => handleChange("projectsDelivered", parseInt(e.target.value, 10) || 0)}
                      className="bg-zinc-900 border-white/10 text-xs text-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-medium mb-1.5">Happy Clients</label>
                    <Input
                      type="number"
                      value={formData.happyClients ?? 95}
                      onChange={(e) => handleChange("happyClients", parseInt(e.target.value, 10) || 0)}
                      className="bg-zinc-900 border-white/10 text-xs text-lg font-bold"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Core Values Tab */}
            <TabsContent value="values" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Engineering & Design Values</h3>
                  <p className="text-xs text-zinc-400">Principles that guide how Nova Studio builds software.</p>
                </div>
                <Button size="sm" variant="studio" onClick={handleOpenAddValue} className="gap-1.5 h-8 text-xs">
                  <Plus className="h-3 w-3" />
                  <span>Add Value</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(formData.coreValues || []).map((val, idx) => (
                  <Card key={val.id} className="border-white/10 bg-zinc-900/40 relative group">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditValue(idx)}
                            className="p-1 rounded text-zinc-400 hover:text-white"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteValue(idx)}
                            className="p-1 rounded text-zinc-400 hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <CardTitle className="text-sm font-bold text-white mt-2">{val.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-zinc-400">{val.description}</CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Milestones Tab */}
            <TabsContent value="timeline" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Company Milestones & Timeline</h3>
                  <p className="text-xs text-zinc-400">Historical journey from founding to latest major releases.</p>
                </div>
                <Button size="sm" variant="studio" onClick={handleOpenAddMilestone} className="gap-1.5 h-8 text-xs">
                  <Plus className="h-3 w-3" />
                  <span>Add Milestone</span>
                </Button>
              </div>

              <div className="space-y-4">
                {(formData.milestones || []).map((item, idx) => (
                  <Card key={item.id} className="border-white/10 bg-zinc-900/40 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <span className="px-3 py-1 rounded-md bg-violet-600/15 border border-violet-500/20 text-violet-300 font-mono font-bold text-xs">
                          {item.year}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white">{item.title}</h4>
                          <p className="text-xs text-zinc-400 mt-1">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditMilestone(idx)}
                          className="p-1.5 rounded text-zinc-400 hover:text-white"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMilestone(idx)}
                          className="p-1.5 rounded text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Core Value Modal */}
      <Dialog open={valueModalOpen} onOpenChange={setValueModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              {editingValueIndex !== null ? "Edit Core Value" : "Add Core Value"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Title *</label>
              <Input
                value={valueForm.title}
                onChange={(e) => setValueForm({ ...valueForm, title: e.target.value })}
                placeholder="e.g. Architectural Integrity"
                className="bg-zinc-900 border-white/10 text-xs"
              />
            </div>
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Description *</label>
              <Textarea
                value={valueForm.description}
                onChange={(e) => setValueForm({ ...valueForm, description: e.target.value })}
                rows={3}
                className="bg-zinc-900 border-white/10 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setValueModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="studio" size="sm" onClick={handleSaveValue} className="text-xs">
              Save Value
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Milestone Modal */}
      <Dialog open={milestoneModalOpen} onOpenChange={setMilestoneModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              {editingMilestoneIndex !== null ? "Edit Milestone" : "Add Milestone"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Year *</label>
              <Input
                value={milestoneForm.year}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, year: e.target.value })}
                placeholder="2026"
                className="bg-zinc-900 border-white/10 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Title *</label>
              <Input
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                placeholder="e.g. Studio Founded"
                className="bg-zinc-900 border-white/10 text-xs"
              />
            </div>
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Description</label>
              <Textarea
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                rows={2}
                className="bg-zinc-900 border-white/10 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setMilestoneModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="studio" size="sm" onClick={handleSaveMilestone} className="text-xs">
              Save Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

