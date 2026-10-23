"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Database,
  HardDrive,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  FileCheck,
  RefreshCw,
  FolderOpen,
  Layers,
  Clock,
  Key,
} from "lucide-react";
import { api } from "@/lib/api";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { DatabaseStatusResponse, BackupItem } from "@nova/shared";

const dbDescriptions: Record<string, string> = {
  user: "Users, admin accounts, bcrypt password hashes, roles, and sessions",
  app: "Application metadata, installation timestamps, and system metrics",
  settings: "Website settings, typography tokens, color themes, and social links",
  content: "Home page revisions, published snapshots, and media records",
  activity: "Admin activity trail, audit logs, and anonymous pageview analytics",
  api: "API keys, rate limit records, and third-party integration configs",
};

export default function AdminDatabasePage() {
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);

  // Query database cluster status
  const { data: dbData, isLoading: loadingDb, refetch: refetchDb } = useQuery<{
    success: boolean;
    data: DatabaseStatusResponse;
  }>({
    queryKey: ["databaseStatus"],
    queryFn: async () => (await api.get("/api/admin/database/status")).data,
  });

  // Query backups list
  const { data: backupsData, isLoading: loadingBackups, refetch: refetchBackups } = useQuery<{
    success: boolean;
    backups: BackupItem[];
  }>({
    queryKey: ["databaseBackups"],
    queryFn: async () => (await api.get("/api/admin/database/backups")).data,
  });

  // Create Backup Mutation
  const backupMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/api/admin/database/backup");
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Database cluster backup completed!");
      refetchBackups();
      refetchDb();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Backup operation failed");
    },
  });

  // Restore Backup Mutation
  const restoreMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const res = await api.post("/api/admin/database/restore", { backupId });
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || "Database cluster restored successfully!");
      setRestoreModalOpen(false);
      setSelectedBackup(null);
      refetchDb();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Restore operation failed");
    },
  });

  const dbStatus = dbData?.data;
  const backups = backupsData?.backups || [];

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Database Cluster Management"
        subtitle="Independent SQLite persistent databases, integrity status, snapshots & restore"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchDb();
                refetchBackups();
              }}
              className="h-8 text-xs border-white/10 text-zinc-300 hover:text-white gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>

            <Button
              variant="studio"
              size="sm"
              disabled={backupMutation.isPending}
              onClick={() => backupMutation.mutate()}
              className="h-8 text-xs gap-1.5 shadow-md shadow-violet-600/30"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{backupMutation.isPending ? "Creating Snapshot..." : "Create Backup"}</span>
            </Button>
          </div>
        }
      />

      <main className="p-6 sm:p-8 space-y-8 max-w-7xl">
        {/* Cluster Architecture Banner */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-violet-950/40 via-zinc-900/60 to-cyan-950/40 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-bold text-white">
                File-Based SQLite Architecture: 6 Independent Stores
              </h2>
            </div>
            <p className="mt-1 text-xs text-zinc-400 max-w-2xl">
              Each domain maintains its own SQLite database with dedicated WAL journaling, schema versioning, foreign key constraints, and isolated write transactions.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="rounded-lg border border-white/10 bg-zinc-950/60 px-3.5 py-2">
              <span className="text-zinc-500 block text-[10px]">TOTAL CLUSTER SIZE</span>
              <span className="text-white font-bold">{dbStatus?.totalSizeFormatted || "176 KB"}</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-zinc-950/60 px-3.5 py-2">
              <span className="text-zinc-500 block text-[10px]">WAL JOURNALING</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* The 6 Database Cards Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-violet-400" />
            <span>Active Database Files</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loadingDb
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border-white/10 bg-zinc-900/40 p-5">
                    <Skeleton className="h-6 w-32 bg-zinc-800 mb-2" />
                    <Skeleton className="h-4 w-full bg-zinc-800 mb-4" />
                    <Skeleton className="h-8 w-24 bg-zinc-800" />
                  </Card>
                ))
              : dbStatus?.databases.map((db) => (
                  <Card
                    key={db.name}
                    className="border-white/10 bg-zinc-900/40 hover:border-violet-500/30 transition-all flex flex-col justify-between"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/15 border border-violet-500/20 text-violet-400 font-mono text-xs font-bold">
                            .db
                          </div>
                          <div>
                            <CardTitle className="text-sm font-bold font-mono text-white">
                              {db.filename}
                            </CardTitle>
                            <span className="text-[11px] text-zinc-500 font-sans">
                              Schema v{db.version}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={db.integrityOk ? "success" : "destructive"}
                          className="text-[10px] py-0 px-2"
                        >
                          {db.integrityOk ? "Integrity OK" : "Degraded"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-zinc-400 mt-2">
                        {dbDescriptions[db.name] || "SQLite persistent storage"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-3">
                      <div className="rounded-lg bg-zinc-950/60 p-2.5 border border-white/5 space-y-1.5 text-xs">
                        <div className="flex justify-between text-zinc-400">
                          <span>File Size:</span>
                          <span className="font-mono text-white font-medium">
                            {db.sizeFormatted}
                          </span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Tables ({db.tableCount}):</span>
                          <span className="font-mono text-violet-300 truncate max-w-[150px]">
                            {db.tables.join(", ")}
                          </span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Last Synced:</span>
                          <span className="font-mono text-zinc-400 text-[11px]">
                            {formatDate(db.lastModified)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </div>

        {/* Backups & Snapshots Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-cyan-400" />
              <span>Snapshot Backups History ({backups.length})</span>
            </h3>
            <span className="text-xs text-zinc-500 font-mono">Location: /workspaces/w/backups</span>
          </div>

          <Card className="border-white/10 bg-zinc-900/40 overflow-hidden">
            <CardContent className="p-0">
              {loadingBackups ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-8 w-full bg-zinc-800" />
                  <Skeleton className="h-8 w-full bg-zinc-800" />
                </div>
              ) : backups.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Database className="h-10 w-10 text-zinc-600 mx-auto" />
                  <p className="text-sm font-medium text-zinc-400">No snapshots recorded yet.</p>
                  <p className="text-xs text-zinc-500">
                    Click "Create Backup" in the header to create your first cluster snapshot.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 text-xs">
                  {backups.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-emerald-400" />
                          <span className="font-mono font-bold text-white">{b.id}</span>
                          <Badge variant="outline" className="text-[10px] py-0 border-white/10">
                            {b.sizeFormatted}
                          </Badge>
                        </div>
                        <div className="text-zinc-500 font-mono text-[11px] flex items-center gap-2">
                          <span>SHA256: {b.checksum.slice(0, 16)}...</span>
                          <span>•</span>
                          <span>{b.includedDbs.length} databases verified</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-zinc-400 text-xs font-mono">
                          {formatDate(b.createdAt)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBackup(b);
                            setRestoreModalOpen(true);
                          }}
                          className="h-8 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1.5"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restore</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Confirmation Dialog: Restore from Backup */}
      <Dialog open={restoreModalOpen} onOpenChange={setRestoreModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Confirm Cluster Database Restore</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              You are about to restore the database cluster from snapshot <code className="text-white font-mono">{selectedBackup?.id}</code>.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200/90 space-y-1.5">
            <p className="font-semibold text-white">Automated Safeguard Procedure:</p>
            <p>1. Existing database files will be safely snapshotted into an emergency rollback directory.</p>
            <p>2. Active connections will be cleanly unmounted.</p>
            <p>3. Files from snapshot will be verified with integrity checks.</p>
            <p>4. If any file fails verification, an automatic rollback will restore current state.</p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRestoreModalOpen(false);
                setSelectedBackup(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={restoreMutation.isPending}
              onClick={() => selectedBackup && restoreMutation.mutate(selectedBackup.id)}
            >
              {restoreMutation.isPending ? "Restoring Cluster..." : "Execute Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

