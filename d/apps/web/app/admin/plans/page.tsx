"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Plus,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  Zap,
  Star,
  ExternalLink,
  ShieldCheck,
  Layers,
  CheckCircle2,
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

interface PlanItem {
  id: string;
  name: string;
  price: number;
  billingPeriod: "monthly" | "yearly";
  badge: string;
  description: string;
  features: string[];
  isPopular: boolean;
  ctaText: string;
  ctaLink: string;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminPlansPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [featureInput, setFeatureInput] = useState("");

  // Form state
  const [formData, setFormData] = useState<Partial<PlanItem>>({
    name: "",
    price: 49,
    billingPeriod: "monthly",
    badge: "",
    description: "",
    features: [],
    isPopular: false,
    ctaText: "Get Started",
    ctaLink: "#contact",
    sortOrder: 0,
    isActive: true,
  });

  const { data, isLoading } = useQuery<{ success: boolean; plans: PlanItem[] }>({
    queryKey: ["adminPlans"],
    queryFn: async () => (await api.get("/api/admin/plans")).data,
  });

  const plans = data?.plans || [];

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<PlanItem>) => {
      return (await api.post("/api/admin/plans", payload)).data;
    },
    onSuccess: () => {
      toast.success("Pricing plan created successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPlans"] });
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create plan");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<PlanItem> }) => {
      return (await api.put(`/api/admin/plans/${id}`, payload)).data;
    },
    onSuccess: () => {
      toast.success("Pricing plan updated successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPlans"] });
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update plan");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/api/admin/plans/${id}`)).data;
    },
    onSuccess: () => {
      toast.success("Plan deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPlans"] });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete plan");
    },
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      price: 49,
      billingPeriod: "monthly",
      badge: "",
      description: "",
      features: [
        "Custom Next.js 15 Single-Page App",
        "SQLite Multi-Database Persistence",
        "Tailwind CSS Glassmorphism Design",
        "Priority Support & Setup",
      ],
      isPopular: false,
      ctaText: "Get Started",
      ctaLink: "#contact",
      sortOrder: (plans.length + 1),
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (plan: PlanItem) => {
    setEditingPlan(plan);
    setFormData({ ...plan });
    setModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      features: [...(prev.features || []), featureInput.trim()],
    }));
    setFeatureInput("");
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast.error("Plan name is required");
      return;
    }

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Plans & Pricing"
        subtitle="Configure subscription tiers, pricing features, and call-to-actions"
        action={
          <Button size="sm" variant="studio" onClick={handleOpenCreate} className="gap-1.5 h-8 text-xs shadow-md">
            <Plus className="h-3.5 w-3.5" />
            <span>Create Plan</span>
          </Button>
        }
      />

      <main className="p-6 sm:p-8 space-y-8 max-w-7xl">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Active Plans
              </CardTitle>
              <CreditCard className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{plans.filter((p) => p.isActive).length}</div>
              <p className="text-xs text-zinc-400 mt-1">Live tiers visible to public</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Featured / Popular Tier
              </CardTitle>
              <Star className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {plans.find((p) => p.isPopular)?.name || "None Set"}
              </div>
              <p className="text-xs text-amber-400 mt-1">Highlighted on showcase</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Billing Cycles
              </CardTitle>
              <Zap className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Monthly / Yearly</div>
              <p className="text-xs text-zinc-400 mt-1">Multi-currency supported</p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Configured Plans ({plans.length})</h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-96 w-full rounded-2xl bg-zinc-900" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <Card className="border-white/10 bg-zinc-900/30 p-12 text-center">
              <CreditCard className="h-10 w-10 text-zinc-500 mx-auto mb-3" />
              <p className="text-sm text-zinc-300 font-medium">No pricing plans found</p>
              <p className="text-xs text-zinc-500 mt-1">Click &ldquo;Create Plan&rdquo; to add your first subscription tier.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`border transition-all relative flex flex-col justify-between ${
                    plan.isPopular
                      ? "border-violet-500/50 bg-gradient-to-b from-violet-950/40 to-zinc-950/80 shadow-xl shadow-violet-950/30"
                      : "border-white/10 bg-zinc-900/40"
                  }`}
                >
                  <div>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={plan.isPopular ? "default" : "outline"}
                          className={plan.isPopular ? "bg-violet-600 text-white" : "border-white/10 text-zinc-400"}
                        >
                          {plan.badge || (plan.isPopular ? "Popular" : "Standard")}
                        </Badge>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(plan)}
                            className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            title="Edit plan"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(plan.id)}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Delete plan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <CardTitle className="text-xl font-bold text-white mt-3">{plan.name}</CardTitle>
                      <CardDescription className="text-xs text-zinc-400 mt-1">{plan.description}</CardDescription>

                      <div className="pt-4 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-white">${plan.price}</span>
                        <span className="text-xs text-zinc-400 font-medium">/{plan.billingPeriod}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-2">
                      <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                        Features Included:
                      </div>
                      <ul className="space-y-2">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </div>

                  <div className="p-6 pt-0 border-t border-white/5 mt-4">
                    <Button
                      variant={plan.isPopular ? "studio" : "outline"}
                      className="w-full justify-center text-xs h-9 mt-4"
                    >
                      <span>{plan.ctaText}</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl bg-zinc-950 border-white/10 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editingPlan ? "Edit Pricing Plan" : "Create Pricing Plan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Customize tier title, price, feature items, and marketing badge.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Plan Name *</label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Pro Studio"
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Price ($ USD) *</label>
                <Input
                  type="number"
                  value={formData.price ?? 49}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Billing Period</label>
                <select
                  value={formData.billingPeriod || "monthly"}
                  onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value as any })}
                  className="w-full h-9 rounded-md bg-zinc-900 border border-white/10 px-3 text-xs text-zinc-200"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Marketing Badge</label>
                <Input
                  value={formData.badge || ""}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  placeholder="e.g. Best Value, Most Popular"
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Description</label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short tagline explaining who this plan is for..."
                rows={2}
                className="bg-zinc-900 border-white/10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">CTA Button Text</label>
                <Input
                  value={formData.ctaText || "Get Started"}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-1">CTA Button Link</label>
                <Input
                  value={formData.ctaLink || "#contact"}
                  onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>
            </div>

            {/* Features Editor */}
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Features Checklist</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFeature())}
                  placeholder="Add feature and press Enter..."
                  className="bg-zinc-900 border-white/10 text-xs"
                />
                <Button size="sm" variant="secondary" onClick={handleAddFeature} className="h-9 px-3 text-xs">
                  Add
                </Button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {(formData.features || []).map((feat, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-md bg-zinc-900 border border-white/5 text-xs text-zinc-300"
                  >
                    <span className="truncate">{feat}</span>
                    <button
                      onClick={() => handleRemoveFeature(i)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="pt-2 flex items-center justify-between border-t border-white/5">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isPopular ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                />
                <span className="text-xs text-zinc-300">Highlight as Most Popular Tier</span>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.isActive ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <span className="text-xs text-zinc-300">Active / Published</span>
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
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm bg-zinc-950 border-white/10 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">Delete Pricing Plan?</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Are you sure you want to delete this plan? This action cannot be undone.
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

