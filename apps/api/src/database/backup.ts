import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseManager, DB_NAMES, DatabaseKey } from "./connection.js";
import { BackupItem } from "@nova/shared";

export class BackupService {
  private static instance: BackupService;
  private backupDir: string;

  private constructor() {
    this.backupDir = process.env.BACKUP_DIR
      ? path.resolve(process.env.BACKUP_DIR)
      : path.resolve(process.cwd(), "../../backups");

    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  public getBackupDir(): string {
    return this.backupDir;
  }

  public async listBackups(): Promise<BackupItem[]> {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const entries = fs.readdirSync(this.backupDir, { withFileTypes: true });
    const backups: BackupItem[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith("backup-")) {
        const dirPath = path.join(this.backupDir, entry.name);
        const metaPath = path.join(dirPath, "meta.json");

        if (fs.existsSync(metaPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8")) as BackupItem;
            backups.push(meta);
          } catch {
            // If meta is corrupt, fallback to directory stats
            backups.push(this.computeBackupItemFromDir(entry.name, dirPath));
          }
        } else {
          backups.push(this.computeBackupItemFromDir(entry.name, dirPath));
        }
      }
    }

    // Sort newest first
    return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private computeBackupItemFromDir(id: string, dirPath: string): BackupItem {
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".db"));
    let totalSize = 0;
    for (const f of files) {
      const stat = fs.statSync(path.join(dirPath, f));
      totalSize += stat.size;
    }
    const stat = fs.statSync(dirPath);
    return {
      id,
      filename: id,
      sizeBytes: totalSize,
      sizeFormatted: formatBytes(totalSize),
      createdAt: stat.mtime.toISOString(),
      includedDbs: files,
      checksum: "computed-" + id,
    };
  }

  public async createBackup(): Promise<BackupItem> {
    const dbManager = DatabaseManager.getInstance();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupId = `backup-${timestamp}`;
    const targetDir = path.join(this.backupDir, backupId);

    fs.mkdirSync(targetDir, { recursive: true });

    const includedDbs: string[] = [];
    let totalSizeBytes = 0;
    const hashes: string[] = [];

    // Verify integrity and copy each database
    for (const key of Object.keys(DB_NAMES) as DatabaseKey[]) {
      const srcPath = dbManager.getDbPath(key);
      if (fs.existsSync(srcPath)) {
        // Run checkpoint on WAL so the .db file contains all transactions
        const db = dbManager.getConnection(key);
        db.exec("PRAGMA wal_checkpoint(TRUNCATE);");

        const isHealthy = dbManager.checkIntegrity(key);
        if (!isHealthy) {
          throw new Error(`Database ${key} failed integrity check before backup. Backup aborted.`);
        }

        const destPath = path.join(targetDir, DB_NAMES[key]);
        fs.copyFileSync(srcPath, destPath);

        const fileStat = fs.statSync(destPath);
        totalSizeBytes += fileStat.size;
        includedDbs.push(DB_NAMES[key]);

        // Compute sha256 checksum
        const fileBuffer = fs.readFileSync(destPath);
        const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
        hashes.push(hash);
      }
    }

    const combinedHash = crypto.createHash("sha256").update(hashes.join("")).digest("hex");

    const backupItem: BackupItem = {
      id: backupId,
      filename: backupId,
      sizeBytes: totalSizeBytes,
      sizeFormatted: formatBytes(totalSizeBytes),
      createdAt: new Date().toISOString(),
      includedDbs,
      checksum: combinedHash,
    };

    fs.writeFileSync(path.join(targetDir, "meta.json"), JSON.stringify(backupItem, null, 2));

    return backupItem;
  }

  public async restoreBackup(backupId: string): Promise<{ success: boolean; message: string }> {
    const dbManager = DatabaseManager.getInstance();
    const backupDirPath = path.join(this.backupDir, backupId);

    if (!fs.existsSync(backupDirPath)) {
      throw new Error(`Backup "${backupId}" does not exist.`);
    }

    const dataDir = dbManager.getDataDir();
    const rollbackDir = path.join(this.backupDir, `rollback-${Date.now()}`);

    // Step 1: Close active connections
    dbManager.closeAll();

    // Step 2: Create a safety rollback snapshot
    fs.mkdirSync(rollbackDir, { recursive: true });
    for (const key of Object.keys(DB_NAMES) as DatabaseKey[]) {
      const src = dbManager.getDbPath(key);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(rollbackDir, DB_NAMES[key]));
      }
      const wal = src + "-wal";
      if (fs.existsSync(wal)) {
        fs.copyFileSync(wal, path.join(rollbackDir, DB_NAMES[key] + "-wal"));
      }
      const shm = src + "-shm";
      if (fs.existsSync(shm)) {
        fs.copyFileSync(shm, path.join(rollbackDir, DB_NAMES[key] + "-shm"));
      }
    }

    // Step 3: Copy backup files to dataDir
    try {
      for (const key of Object.keys(DB_NAMES) as DatabaseKey[]) {
        const backupFile = path.join(backupDirPath, DB_NAMES[key]);
        if (fs.existsSync(backupFile)) {
          const dest = dbManager.getDbPath(key);
          // Clean up WAL and SHM files to prevent out-of-sync state
          if (fs.existsSync(dest + "-wal")) fs.unlinkSync(dest + "-wal");
          if (fs.existsSync(dest + "-shm")) fs.unlinkSync(dest + "-shm");

          fs.copyFileSync(backupFile, dest);
        }
      }

      // Step 4: Verify integrity of newly restored databases
      for (const key of Object.keys(DB_NAMES) as DatabaseKey[]) {
        const ok = dbManager.checkIntegrity(key);
        if (!ok) {
          throw new Error(`Restored database ${key} failed integrity verification!`);
        }
      }

      // If successful, clean up rollback directory
      fs.rmSync(rollbackDir, { recursive: true, force: true });

      return {
        success: true,
        message: `Successfully restored database cluster from ${backupId}`,
      };
    } catch (err: any) {
      // Step 5: Rollback on error
      console.error("[BackupService] Restore failed, rolling back...", err);
      for (const key of Object.keys(DB_NAMES) as DatabaseKey[]) {
        const rollbackFile = path.join(rollbackDir, DB_NAMES[key]);
        if (fs.existsSync(rollbackFile)) {
          fs.copyFileSync(rollbackFile, dbManager.getDbPath(key));
        }
      }
      throw new Error(`Restore failed and was rolled back: ${err.message}`);
    }
  }
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

