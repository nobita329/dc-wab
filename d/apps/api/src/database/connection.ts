import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { DatabaseInfo } from "@nova/shared";

export type DatabaseKey = "user" | "app" | "settings" | "content" | "activity" | "api" | "team" | "tutorials" | "command";

export const DB_NAMES: Record<DatabaseKey, string> = {
  user: "user.db",
  app: "app.db",
  settings: "settings.db",
  content: "content.db",
  activity: "activity.db",
  api: "api.db",
  team: "team.db",
  tutorials: "tutorials.db",
  command: "command.db",
};

export class DatabaseManager {
  private static instance: DatabaseManager;
  private connections: Map<DatabaseKey, DatabaseSync> = new Map();
  private dataDir: string;

  private constructor() {
    if (process.env.DATA_DIR) {
      this.dataDir = path.resolve(process.env.DATA_DIR);
    } else if (fs.existsSync(path.resolve(process.cwd(), "data"))) {
      this.dataDir = path.resolve(process.cwd(), "data");
    } else if (fs.existsSync(path.resolve(process.cwd(), "../../data"))) {
      this.dataDir = path.resolve(process.cwd(), "../../data");
    } else {
      this.dataDir = path.resolve(process.cwd(), "data");
    }

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getDataDir(): string {
    return this.dataDir;
  }

  public getDbPath(key: DatabaseKey): string {
    return path.join(this.dataDir, DB_NAMES[key]);
  }

  public getConnection(key: DatabaseKey): DatabaseSync {
    if (this.connections.has(key)) {
      return this.connections.get(key)!;
    }

    const filePath = this.getDbPath(key);
    const db = new DatabaseSync(filePath);

    // Apply performance and integrity pragmas
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA synchronous = NORMAL;");
    db.exec("PRAGMA foreign_keys = ON;");

    this.connections.set(key, db);
    return db;
  }

  public closeAll(): void {
    for (const [key, db] of this.connections.entries()) {
      try {
        db.close();
      } catch (err) {
        console.error(`Error closing database ${key}:`, err);
      }
    }
    this.connections.clear();
  }

  public closeConnection(key: DatabaseKey): void {
    const db = this.connections.get(key);
    if (db) {
      try {
        db.close();
      } catch (err) {
        console.error(`Error closing database ${key}:`, err);
      }
      this.connections.delete(key);
    }
  }

  public checkIntegrity(key: DatabaseKey): boolean {
    try {
      const db = this.getConnection(key);
      const row = db.prepare("PRAGMA integrity_check").get() as { integrity_check?: string } | undefined;
      return row?.integrity_check === "ok";
    } catch (err) {
      console.error(`Integrity check failed for ${key}:`, err);
      return false;
    }
  }

  public getDatabaseStats(): DatabaseInfo[] {
    const stats: DatabaseInfo[] = [];

    for (const key of Object.keys(DB_NAMES) as DatabaseKey[]) {
      const filename = DB_NAMES[key];
      const filePath = this.getDbPath(key);
      let sizeBytes = 0;
      let lastModified = new Date().toISOString();

      if (fs.existsSync(filePath)) {
        const fileStat = fs.statSync(filePath);
        sizeBytes = fileStat.size;
        lastModified = fileStat.mtime.toISOString();
      }

      let tables: string[] = [];
      let integrityOk = false;
      let version = 0;
      let status: "healthy" | "degraded" | "error" = "healthy";

      try {
        const db = this.getConnection(key);
        const rows = db.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        ).all() as { name: string }[];
        tables = rows.map((r) => r.name);

        const versionRow = db.prepare("PRAGMA user_version").get() as { user_version?: number } | undefined;
        version = versionRow?.user_version ?? 0;

        integrityOk = this.checkIntegrity(key);
        status = integrityOk ? "healthy" : "degraded";
      } catch (err) {
        status = "error";
        integrityOk = false;
      }

      stats.push({
        name: key,
        filename,
        sizeBytes,
        sizeFormatted: formatBytes(sizeBytes),
        tableCount: tables.length,
        tables,
        status,
        lastModified,
        integrityOk,
        version,
      });
    }

    return stats;
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

