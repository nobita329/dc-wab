import { Router, Request, Response } from "express";
import { DatabaseManager } from "../database/connection.js";
import { BackupService } from "../database/backup.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { WebSocketManager } from "../websocket/wsServer.js";
import { DatabaseStatusResponse } from "@nova/shared";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const dbManager = DatabaseManager.getInstance();
const backupService = BackupService.getInstance();
const activityRepo = new ActivityRepository();
const wsManager = WebSocketManager.getInstance();

// Admin: Get status of all SQLite databases
router.get("/admin/database/status", requireAuth, (req: Request, res: Response) => {
  try {
    const databases = dbManager.getDatabaseStats();
    let totalSizeBytes = 0;
    let allHealthy = true;

    for (const db of databases) {
      totalSizeBytes += db.sizeBytes;
      if (db.status !== "healthy") {
        allHealthy = false;
      }
    }

    const response: DatabaseStatusResponse = {
      databases,
      totalSizeBytes,
      totalSizeFormatted: formatBytes(totalSizeBytes),
      allHealthy,
      walEnabled: true,
      storagePath: dbManager.getDataDir(),
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: List all backups
router.get("/admin/database/backups", requireAuth, async (req: Request, res: Response) => {
  try {
    const backups = await backupService.listBackups();
    res.json({
      success: true,
      backups,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Create a new backup
router.post("/admin/database/backup", requireAuth, async (req: Request, res: Response) => {
  try {
    const backupItem = await backupService.createBackup();

    activityRepo.log(
      "database.backup_created",
      "database",
      `Created database backup '${backupItem.id}' (${backupItem.sizeFormatted})`,
      {
        userId: req.user?.id,
        username: req.user?.username,
        ipAddress: req.ip,
        metadata: { backupId: backupItem.id, checksum: backupItem.checksum },
      }
    );

    wsManager.broadcast("database_backed_up", {
      backup: backupItem,
      author: req.user?.username,
    });

    res.json({
      success: true,
      message: `Database backup created successfully: ${backupItem.id}`,
      backup: backupItem,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Restore from backup
router.post("/admin/database/restore", requireAuth, async (req: Request, res: Response) => {
  try {
    const { backupId } = req.body;
    if (!backupId || typeof backupId !== "string") {
      res.status(400).json({ success: false, error: "Valid backupId is required" });
      return;
    }

    const result = await backupService.restoreBackup(backupId);

    activityRepo.log(
      "database.restored",
      "database",
      `Restored database cluster from backup '${backupId}'`,
      {
        userId: req.user?.id,
        username: req.user?.username,
        ipAddress: req.ip,
        metadata: { backupId },
      }
    );

    wsManager.broadcast("database_restored", {
      backupId,
      author: req.user?.username,
    });

    res.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export default router;

