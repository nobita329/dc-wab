"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  Mail,
  User as UserIcon,
  Clock,
  CheckCircle2,
  Radio,
  LogIn,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Globe,
  Monitor,
  Copy,
  Search,
  ExternalLink,
  Sparkles,
  QrCode,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { User as UserType } from "@nova/shared";
import { getGravatarUrl } from "@/lib/gravatar";
import { useAuthStore } from "@/lib/store";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser, setAuth } = useAuthStore();

  // Dialog States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Selected User for Management & Active Tab
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [manageTab, setManageTab] = useState<string>("identity");

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [twoFaFilter, setTwoFaFilter] = useState<string>("all");

  // Forms
  const [createFormData, setCreateFormData] = useState({
    username: "",
    password: "",
    email: "",
    nameFirst: "",
    nameLast: "",
    role: "editor" as "admin" | "editor" | "viewer",
  });

  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    nameFirst: "",
    nameLast: "",
    role: "editor" as "admin" | "editor" | "viewer",
    password: "",
    language: "en",
    country: "US",
    isBanned: false,
    isSuspended: false,
  });

  // 2FA Setup State for Current Admin
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{
    secret: string;
    otpAuthUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [twoFactorVerifyCode, setTwoFactorVerifyCode] = useState("");
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  // 1. Fetch Users List
  const { data: usersData, isLoading: usersLoading } = useQuery<{
    success: boolean;
    users: UserType[];
    activeSessions: number;
  }>({
    queryKey: ["adminUsers"],
    queryFn: async () => (await api.get("/api/admin/users")).data,
  });

  const users = usersData?.users || [];
  const activeSessionsCount = usersData?.activeSessions || 1;

  // 2. Fetch Detailed User Data (Sessions & Login History) for selected user
  const { data: userDetails, refetch: refetchUserDetails } = useQuery<{
    success: boolean;
    user: UserType;
    sessions: any[];
    history: any[];
  }>({
    queryKey: ["adminUserDetails", selectedUserId],
    queryFn: async () => (await api.get(`/api/admin/users/${selectedUserId}`)).data,
    enabled: Boolean(selectedUserId),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await api.post("/api/admin/users", payload)).data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "User created successfully");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setCreateModalOpen(false);
      setCreateFormData({
        username: "",
        password: "",
        email: "",
        nameFirst: "",
        nameLast: "",
        role: "editor",
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return (await api.put(`/api/admin/users/${id}`, payload)).data;
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      refetchUserDetails();
      setManageModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update user");
    },
  });

  const toggle2FAMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return (await api.patch(`/api/admin/users/${id}/2fa`, { enabled })).data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "2FA status updated");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      refetchUserDetails();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to toggle 2FA");
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async ({ userId, sessionId }: { userId: string; sessionId: string }) => {
      return (await api.delete(`/api/admin/users/${userId}/sessions/${sessionId}`)).data;
    },
    onSuccess: () => {
      toast.success("Session revoked successfully");
      refetchUserDetails();
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to revoke session");
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      return (await api.post(`/api/auth/impersonate/${userId}`)).data;
    },
    onSuccess: (res) => {
      if (res.token && res.user) {
        setAuth(res.user, res.token);
        toast.success(`Switched identity! You are now logged in as ${res.user.username}`);
        window.location.reload();
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to impersonate user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await api.delete(`/api/admin/users/${id}`)).data;
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete user");
    },
  });

  // Handlers
  const handleOpenManage = (u: UserType) => {
    setSelectedUserId(u.id);
    setEditFormData({
      username: u.username,
      email: u.email || "",
      nameFirst: u.nameFirst || "",
      nameLast: u.nameLast || "",
      role: u.role,
      password: "",
      language: u.language || "en",
      country: u.country || "US",
      isBanned: Boolean(u.isBanned),
      isSuspended: Boolean(u.isSuspended),
    });
    setManageTab("identity");
    setManageModalOpen(true);
  };

  const handleOpen2FASetup = async () => {
    try {
      const res = await api.get("/api/auth/2fa/setup");
      if (res.data?.success) {
        setTwoFactorSetupData({
          secret: res.data.secret,
          otpAuthUrl: res.data.otpAuthUrl,
          backupCodes: res.data.backupCodes || [],
        });
        setTwoFactorVerifyCode("");
        setTwoFactorModalOpen(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Unable to start 2FA setup");
    }
  };

  const handleVerifyAndEnable2FA = async () => {
    if (!twoFactorSetupData || !twoFactorVerifyCode.trim()) {
      toast.error("Please enter the 6-digit TOTP code");
      return;
    }
    setIsVerifying2FA(true);
    try {
      const res = await api.post("/api/auth/2fa/verify", {
        code: twoFactorVerifyCode.trim(),
        secret: twoFactorSetupData.secret,
        backupCodes: twoFactorSetupData.backupCodes,
      });
      if (res.data?.success) {
        toast.success("Two-Factor Authentication is now ENABLED for your account!");
        queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
        if (currentUser) {
          currentUser.useTotp = true;
        }
        setTwoFactorModalOpen(false);
      } else {
        toast.error(res.data?.error || "Invalid 2FA code");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Verification failed");
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDisableMy2FA = async () => {
    try {
      const res = await api.post("/api/auth/2fa/disable");
      if (res.data?.success) {
        toast.success("Two-Factor Authentication disabled");
        queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
        if (currentUser) {
          currentUser.useTotp = false;
        }
        setTwoFactorModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to disable 2FA");
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.nameFirst && u.nameFirst.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.nameLast && u.nameLast.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    const matches2FA =
      twoFaFilter === "all" ||
      (twoFaFilter === "enabled" && u.useTotp) ||
      (twoFaFilter === "disabled" && !u.useTotp);

    return matchesSearch && matchesRole && matches2FA;
  });

  const totpCount = users.filter((u) => u.useTotp).length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="User Manager & Authentication Control"
        subtitle="Full Laravel-inspired user control: Gravatar email usericons, 2FA verification, active sessions & login history"
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpen2FASetup}
              className="gap-1.5 h-8 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 shadow-sm"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Two-Factor Setup</span>
            </Button>

            <Button
              size="sm"
              variant="studio"
              onClick={() => setCreateModalOpen(true)}
              className="gap-1.5 h-8 text-xs shadow-md shadow-violet-600/25"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create New User</span>
            </Button>
          </div>
        }
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Total Accounts
              </CardTitle>
              <Users className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{users.length}</div>
              <p className="text-xs text-zinc-400 mt-1">Authorized database profiles</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                2FA Protected
              </CardTitle>
              <Lock className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {totpCount}
                <span className="text-xs font-normal text-zinc-400 ml-1.5">
                  ({users.length ? Math.round((totpCount / users.length) * 100) : 0}%)
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">RFC 6238 TOTP enforced</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Active Sessions
              </CardTitle>
              <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activeSessionsCount}</div>
              <p className="text-xs text-cyan-400 mt-1">Live SQLite token sessions</p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Root Administrators
              </CardTitle>
              <Shield className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{adminCount}</div>
              <p className="text-xs text-amber-400 mt-1">Full root system authority</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-xl border border-white/5 backdrop-blur-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search by username, email, or client name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-950/60 border-white/10 text-xs h-9 text-white placeholder:text-zinc-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-lg bg-zinc-950/60 border border-white/10 px-3 text-xs text-zinc-300"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="editor">Editors</option>
              <option value="viewer">Viewers</option>
            </select>

            <select
              value={twoFaFilter}
              onChange={(e) => setTwoFaFilter(e.target.value)}
              className="h-9 rounded-lg bg-zinc-950/60 border border-white/10 px-3 text-xs text-zinc-300"
            >
              <option value="all">All 2FA States</option>
              <option value="enabled">2FA Enabled</option>
              <option value="disabled">2FA Disabled</option>
            </select>
          </div>
        </div>

        {/* User Table (matching users/index.blade.php) */}
        <Card className="border-white/10 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-white">
                User List ({filteredUsers.length})
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                All registered accounts with email Gravatars, 2FA badges, and session tracking
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {usersLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full bg-zinc-800/60 rounded-xl" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs">
                No users found matching current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-zinc-950/40 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      <th className="py-3 px-4">Avatar & Email</th>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4 text-center">2FA</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Last Seen</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((u) => {
                      const gravatarSrc =
                        u.avatarUrl ||
                        getGravatarUrl(
                          u.email ||
                            (u.username === "admin"
                              ? "admin@novastudio.internal"
                              : `${u.username}@novastudio.internal`),
                          64
                        );

                      const clientName =
                        u.nameLast || u.nameFirst
                          ? `${u.nameLast || ""}${u.nameLast && u.nameFirst ? ", " : ""}${u.nameFirst || ""}`
                          : "—";

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* Avatar & Email */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <img
                                  src={gravatarSrc}
                                  alt={u.username}
                                  className="h-8 w-8 rounded-full border border-white/10 object-cover shadow-sm bg-zinc-800"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = "none";
                                    if (target.nextElementSibling) {
                                      (target.nextElementSibling as HTMLElement).style.display = "flex";
                                    }
                                  }}
                                />
                                <div
                                  style={{ display: "none" }}
                                  className="h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white font-bold text-xs uppercase shrink-0 shadow-sm"
                                >
                                  {u.username[0]}
                                </div>
                              </div>

                              <div className="truncate max-w-[200px]">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenManage(u)}
                                    className="font-semibold text-white hover:text-cyan-400 transition-colors truncate text-left"
                                  >
                                    {u.email || "No email assigned"}
                                  </button>
                                  {u.role === "admin" && (
                                    <span title="Administrator">
                                      <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
                                    </span>
                                  )}
                                  {u.isBanned && (
                                    <span
                                      className="h-2 w-2 rounded-full bg-red-500 shrink-0"
                                      title="Banned Account"
                                    />
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono block">
                                  ID: {u.id.slice(0, 8)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Client Name */}
                          <td className="py-3.5 px-4 text-zinc-300 font-medium">
                            {clientName}
                          </td>

                          {/* Username */}
                          <td className="py-3.5 px-4 font-mono text-zinc-300">
                            {u.username}
                          </td>

                          {/* 2FA Badge */}
                          <td className="py-3.5 px-4 text-center">
                            {u.useTotp ? (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 gap-1 text-[10px] font-mono">
                                <Lock className="h-3 w-3" />
                                <span>2FA</span>
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-zinc-800/40 text-zinc-400 border-zinc-700/50 gap-1 text-[10px] font-mono"
                              >
                                <Unlock className="h-3 w-3 text-amber-500" />
                                <span>Off</span>
                              </Badge>
                            )}
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={u.role === "admin" ? "default" : "outline"}
                              className={`text-[10px] capitalize font-medium ${
                                u.role === "admin"
                                  ? "bg-violet-600/20 text-violet-300 border-violet-500/30"
                                  : u.role === "editor"
                                  ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10"
                                  : "border-zinc-700 text-zinc-400 bg-zinc-800/30"
                              }`}
                            >
                              {u.role}
                            </Badge>
                          </td>

                          {/* Last Seen */}
                          <td className="py-3.5 px-4 text-zinc-400">
                            {u.lastLoginAt ? (
                              <div>
                                <span className="text-zinc-200">
                                  {new Date(u.lastLoginAt).toLocaleDateString()}
                                </span>
                                {u.lastLoginIp && (
                                  <span className="text-[10px] text-zinc-500 font-mono block">
                                    {u.lastLoginIp}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-500">Never</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Impersonate: Login as User */}
                              <button
                                onClick={() => impersonateMutation.mutate(u.id)}
                                disabled={impersonateMutation.isPending}
                                className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                title={`Login as ${u.username}`}
                              >
                                <LogIn className="h-3.5 w-3.5" />
                              </button>

                              {/* Manage User Modal */}
                              <button
                                onClick={() => handleOpenManage(u)}
                                className="p-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white transition-colors"
                                title="Manage user details"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              {/* Delete User */}
                              <button
                                onClick={() => setDeleteId(u.id)}
                                className="p-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 hover:text-red-400 transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
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
      </main>

      {/* ======================================================== */}
      {/* MANAGE USER MODAL (matching users/view.blade.php) */}
      {/* ======================================================== */}
      <Dialog open={manageModalOpen} onOpenChange={setManageModalOpen}>
        <DialogContent className="max-w-2xl bg-zinc-950 border-white/10 text-zinc-100 p-0 overflow-hidden">
          {/* Header with Gravatar Banner */}
          <div className="p-6 bg-gradient-to-r from-violet-950/40 via-zinc-900 to-zinc-950 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={
                  userDetails?.user.avatarUrl ||
                  getGravatarUrl(
                    userDetails?.user.email ||
                      (userDetails?.user.username === "admin"
                        ? "admin@novastudio.internal"
                        : `${userDetails?.user.username}@novastudio.internal`),
                    120
                  )
                }
                alt="Gravatar"
                className="h-14 w-14 rounded-2xl border-2 border-white/10 shadow-lg object-cover bg-zinc-900"
              />
              <div>
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <span>
                    {userDetails?.user.nameFirst} {userDetails?.user.nameLast}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 font-normal">
                    (@{userDetails?.user.username})
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                  ID: <code className="text-zinc-300">{userDetails?.user.id}</code>
                </DialogDescription>
              </div>
            </div>

            {selectedUserId && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => impersonateMutation.mutate(selectedUserId)}
                className="gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Login as User</span>
              </Button>
            )}
          </div>

          <Tabs value={manageTab} onValueChange={setManageTab} className="p-6 space-y-4">
            <TabsList className="grid grid-cols-4 w-full bg-zinc-900 border-white/10">
              <TabsTrigger value="identity" className="text-xs">Identity</TabsTrigger>
              <TabsTrigger value="security" className="text-xs">Security & 2FA</TabsTrigger>
              <TabsTrigger value="sessions" className="text-xs">Active Sessions</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">Login History</TabsTrigger>
            </TabsList>

            {/* TAB 1: IDENTITY */}
            <TabsContent value="identity" className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">First Name</label>
                  <Input
                    value={editFormData.nameFirst}
                    onChange={(e) => setEditFormData({ ...editFormData, nameFirst: e.target.value })}
                    placeholder="e.g. Alex"
                    className="bg-zinc-900 border-white/10 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Last Name</label>
                  <Input
                    value={editFormData.nameLast}
                    onChange={(e) => setEditFormData({ ...editFormData, nameLast: e.target.value })}
                    placeholder="e.g. Morgan"
                    className="bg-zinc-900 border-white/10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Username *</label>
                  <Input
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    className="bg-zinc-900 border-white/10 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Email Address (Gravatar)</label>
                  <Input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="bg-zinc-900 border-white/10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Role Authority</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                    className="w-full h-9 rounded-md bg-zinc-900 border border-white/10 px-3 text-xs text-zinc-200"
                  >
                    <option value="admin">Administrator (Full root access)</option>
                    <option value="editor">Editor (Studio Content Editor)</option>
                    <option value="viewer">Viewer (Read-only access)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Default Language</label>
                  <select
                    value={editFormData.language}
                    onChange={(e) => setEditFormData({ ...editFormData, language: e.target.value })}
                    className="w-full h-9 rounded-md bg-zinc-900 border border-white/10 px-3 text-xs text-zinc-200"
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Spanish (Español)</option>
                    <option value="fr">French (Français)</option>
                    <option value="de">German (Deutsch)</option>
                    <option value="ja">Japanese (日本語)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">
                  Change Password (leave empty to retain current)
                </label>
                <Input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setManageModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="studio"
                  size="sm"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    if (selectedUserId) {
                      updateMutation.mutate({ id: selectedUserId, payload: editFormData });
                    }
                  }}
                >
                  {updateMutation.isPending ? "Updating..." : "Save Identity Changes"}
                </Button>
              </div>
            </TabsContent>

            {/* TAB 2: SECURITY & 2FA */}
            <TabsContent value="security" className="space-y-4 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <Lock className="h-4 w-4 text-emerald-400" />
                      <span>Two-Factor Authentication (2FA) Status</span>
                    </h4>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      Enforce Google Authenticator or RFC 6238 TOTP at login
                    </p>
                  </div>

                  {userDetails?.user.useTotp ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                      Inactive
                    </Badge>
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  {userDetails?.user.useTotp ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs h-8"
                      disabled={toggle2FAMutation.isPending}
                      onClick={() =>
                        selectedUserId &&
                        toggle2FAMutation.mutate({ id: selectedUserId, enabled: false })
                      }
                    >
                      Disable 2FA for User
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="studio"
                      className="text-xs h-8"
                      disabled={toggle2FAMutation.isPending}
                      onClick={() =>
                        selectedUserId &&
                        toggle2FAMutation.mutate({ id: selectedUserId, enabled: true })
                      }
                    >
                      Enable 2FA for User
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: ACTIVE SESSIONS */}
            <TabsContent value="sessions" className="space-y-3 pt-2 text-xs">
              <p className="text-zinc-400 text-[11px]">
                Active token sessions stored in the SQLite user database for this account.
              </p>

              {userDetails?.sessions && userDetails.sessions.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {userDetails.sessions.map((sess: any) => (
                    <div
                      key={sess.id}
                      className="p-3 rounded-lg bg-zinc-900/60 border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Monitor className="h-4 w-4 text-cyan-400 shrink-0" />
                        <div>
                          <div className="font-mono text-zinc-200">
                            {sess.ip_address}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate max-w-xs">
                            {sess.user_agent}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-[11px] px-2.5"
                        onClick={() =>
                          selectedUserId &&
                          revokeSessionMutation.mutate({
                            userId: selectedUserId,
                            sessionId: sess.id,
                          })
                        }
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  No active session tokens for this user.
                </div>
              )}
            </TabsContent>

            {/* TAB 4: LOGIN HISTORY */}
            <TabsContent value="history" className="space-y-3 pt-2 text-xs">
              <p className="text-zinc-400 text-[11px]">
                Historical login log table with IP addresses, platform, and browser timestamps.
              </p>

              {userDetails?.history && userDetails.history.length > 0 ? (
                <div className="max-h-60 overflow-y-auto divide-y divide-white/5 border border-white/10 rounded-lg">
                  {userDetails.history.map((hist: any) => (
                    <div
                      key={hist.id}
                      className="p-2.5 flex items-center justify-between text-[11px] hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-3.5 w-3.5 text-zinc-400" />
                        <div>
                          <span className="font-semibold text-zinc-200">
                            {hist.device_type} • {hist.platform} ({hist.browser})
                          </span>
                          <span className="text-zinc-500 font-mono block text-[10px]">
                            IP: {hist.ip_address}
                          </span>
                        </div>
                      </div>

                      <span className="text-zinc-400 text-[10px]">
                        {new Date(hist.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  No login history recorded yet.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 2FA SETUP MODAL (FOR CURRENT USER) */}
      {/* ======================================================== */}
      <Dialog open={twoFactorModalOpen} onOpenChange={setTwoFactorModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-zinc-100">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mb-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <DialogTitle className="text-lg font-bold text-center text-white">
              Two-Factor Authentication Setup
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-zinc-400">
              Protect your Nova Studio administrator account with RFC 6238 TOTP
            </DialogDescription>
          </DialogHeader>

          {twoFactorSetupData && (
            <div className="space-y-4 py-2 text-xs">
              {/* Step 1: Base32 Secret Key */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-white/10 space-y-2">
                <span className="text-[11px] font-semibold text-zinc-300 block">
                  1. Add Key to Google Authenticator / 1Password:
                </span>
                <div className="flex items-center justify-between gap-2 bg-zinc-950 p-2 rounded-lg border border-white/5 font-mono text-cyan-400 font-bold select-all tracking-wider text-center">
                  <span>{twoFactorSetupData.secret}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(twoFactorSetupData.secret);
                      toast.success("Secret copied!");
                    }}
                    className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Step 2: Emergency Backup Codes */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-300">
                    2. Emergency Backup Codes:
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(twoFactorSetupData.backupCodes.join("\n"));
                      toast.success("Backup codes copied!");
                    }}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copy All</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-zinc-300 bg-zinc-950 p-2 rounded-lg">
                  {twoFactorSetupData.backupCodes.map((code, idx) => (
                    <span key={idx} className="tracking-wider">
                      {code}
                    </span>
                  ))}
                </div>
              </div>

              {/* Step 3: Enter 6-digit Code to Activate */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  3. Enter 6-Digit Verification Code to Confirm:
                </label>
                <Input
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={twoFactorVerifyCode}
                  onChange={(e) => setTwoFactorVerifyCode(e.target.value)}
                  className="bg-zinc-900 border-white/10 text-center font-mono text-base tracking-widest text-white h-10"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="studio"
                  onClick={handleVerifyAndEnable2FA}
                  disabled={isVerifying2FA}
                  className="w-full py-5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20"
                >
                  <ShieldCheck className="h-4 w-4 mr-1.5" />
                  <span>{isVerifying2FA ? "Verifying..." : "Verify & Enable 2FA"}</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleDisableMy2FA}
                  className="w-full text-xs text-zinc-500 hover:text-red-400"
                >
                  Disable 2FA on this account
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* CREATE NEW USER MODAL (matching users/new.blade.php) */}
      {/* ======================================================== */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-violet-400" />
              <span>Create New User</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              New accounts automatically generate a unique Gravatar profile avatar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">First Name</label>
                <Input
                  value={createFormData.nameFirst}
                  onChange={(e) => setCreateFormData({ ...createFormData, nameFirst: e.target.value })}
                  placeholder="e.g. Jordan"
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Last Name</label>
                <Input
                  value={createFormData.nameLast}
                  onChange={(e) => setCreateFormData({ ...createFormData, nameLast: e.target.value })}
                  placeholder="e.g. Smith"
                  className="bg-zinc-900 border-white/10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Username *</label>
              <Input
                value={createFormData.username}
                onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                placeholder="e.g. dev_jordan"
                className="bg-zinc-900 border-white/10 text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Email Address *</label>
              <Input
                type="email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                placeholder="jordan@novastudio.internal"
                className="bg-zinc-900 border-white/10 text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Password *</label>
              <Input
                type="password"
                value={createFormData.password}
                onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                placeholder="••••••••••••"
                className="bg-zinc-900 border-white/10 text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Role Permissions</label>
              <select
                value={createFormData.role}
                onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as any })}
                className="w-full h-9 rounded-md bg-zinc-900 border border-white/10 px-3 text-xs text-zinc-200"
              >
                <option value="admin">Admin (Full root privileges)</option>
                <option value="editor">Editor (Studio Content Editor)</option>
                <option value="viewer">Viewer (Read-only)</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="studio"
              size="sm"
              disabled={createMutation.isPending}
              onClick={() => {
                if (!createFormData.username.trim() || !createFormData.password.trim()) {
                  toast.error("Username and password are required");
                  return;
                }
                createMutation.mutate(createFormData);
              }}
            >
              {createMutation.isPending ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      <Dialog open={Boolean(deleteId)} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm bg-zinc-950 border-white/10 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span>Delete User Account?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Are you sure you want to delete this user? All active sessions and login history will be permanently revoked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
