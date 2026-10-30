import { Router, Request, Response } from "express";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { SettingsRepository } from "../repositories/settingsRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { DatabaseManager } from "../database/connection.js";
import { WebSocketManager } from "../websocket/wsServer.js";
import { SiteSettingsSchema } from "@nova/shared";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const settingsRepo = new SettingsRepository();
const activityRepo = new ActivityRepository();
const wsManager = WebSocketManager.getInstance();

// Public: Get current settings
router.get("/settings", (_req: Request, res: Response) => {
  try {
    const settings = settingsRepo.getSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get current settings
router.get("/admin/settings", requireAuth, (req: Request, res: Response) => {
  try {
    const settings = settingsRepo.getSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Update settings
router.put("/admin/settings", requireAuth, (req: Request, res: Response) => {
  try {
    const parseResult = SiteSettingsSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: "Validation failed for website settings",
        details: parseResult.error.errors,
      });
      return;
    }

    const updated = settingsRepo.updateSettings(
      parseResult.data as any,
      req.user?.username || "admin"
    );

    activityRepo.log(
      "settings.updated",
      "settings",
      `Website settings & theme configuration updated by ${req.user?.username}`,
      {
        userId: req.user?.id,
        username: req.user?.username,
        ipAddress: req.ip,
      }
    );

    wsManager.broadcast("settings_updated", {
      settings: updated,
      author: req.user?.username,
    });

    res.json({
      success: true,
      message: "Website settings saved successfully",
      settings: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Upload asset (Panel Logo, Favicon, Brand Media)
router.post("/admin/upload-asset", requireAuth, (req: Request, res: Response) => {
  try {
    const { fileData, fileName, mimeType, assetType } = req.body;

    if (!fileData || typeof fileData !== "string") {
      res.status(400).json({ success: false, error: "fileData (base64 string) is required" });
      return;
    }

    const allowedMimes: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "image/svg+xml": ".svg",
      "image/x-icon": ".ico",
      "image/vnd.microsoft.icon": ".ico",
    };

    let ext = "";
    let cleanBase64 = fileData;

    const dataUrlMatch = fileData.match(/^data:([a-zA-Z0-9-+/.]+);base64,/);
    if (dataUrlMatch) {
      const detectedMime = dataUrlMatch[1].toLowerCase();
      if (allowedMimes[detectedMime]) {
        ext = allowedMimes[detectedMime];
      }
      cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, "");
    }

    if (!ext && mimeType && allowedMimes[mimeType.toLowerCase()]) {
      ext = allowedMimes[mimeType.toLowerCase()];
    }

    if (!ext && fileName) {
      const parsedExt = path.extname(fileName).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".ico"].includes(parsedExt)) {
        ext = parsedExt === ".jpeg" ? ".jpg" : parsedExt;
      }
    }

    if (!ext) {
      ext = assetType === "favicon" ? ".ico" : ".png";
    }

    const buffer = Buffer.from(cleanBase64, "base64");
    if (buffer.length === 0) {
      res.status(400).json({ success: false, error: "Empty file payload" });
      return;
    }

    // Limit to 20MB for logo/favicons
    if (buffer.length > 20 * 1024 * 1024) {
      res.status(400).json({ success: false, error: "File exceeds 20MB limit" });
      return;
    }

    const prefix = assetType ? `${assetType}-` : "asset-";
    const uniqueId = crypto.randomBytes(6).toString("hex");
    const safeName = `${prefix}${Date.now()}-${uniqueId}${ext}`;

    const dataUploadsDir = path.join(DatabaseManager.getInstance().getDataDir(), "uploads");
    if (!fs.existsSync(dataUploadsDir)) {
      fs.mkdirSync(dataUploadsDir, { recursive: true });
    }

    const targetPath = path.join(dataUploadsDir, safeName);
    fs.writeFileSync(targetPath, buffer);

    // Also mirror to apps/web/public/uploads if dir exists
    const webPublicUploads = path.resolve(process.cwd(), "../web/public/uploads");
    try {
      if (!fs.existsSync(webPublicUploads)) {
        fs.mkdirSync(webPublicUploads, { recursive: true });
      }
      fs.writeFileSync(path.join(webPublicUploads, safeName), buffer);
    } catch {
      // Ignore in prod if cwd differs
    }

    res.json({
      success: true,
      message: `${assetType || "Asset"} uploaded successfully`,
      url: `/uploads/${safeName}`,
      fileName: safeName,
      fileSize: buffer.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to resolve .env file location
function getEnvPath(): string {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    "/workspaces/w/d/.env",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

// Admin: Scan and read .env file
router.get("/admin/env", requireAuth, (_req: Request, res: Response) => {
  try {
    const envFile = getEnvPath();
    let rawEnv = "";
    if (fs.existsSync(envFile)) {
      rawEnv = fs.readFileSync(envFile, "utf-8");
    }

    const parsed: Record<string, string> = {};
    const lines = rawEnv.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        parsed[key] = val;
      }
    }

    const totalKeys = Object.keys(parsed).length;
    const configuredKeys = Object.values(parsed).filter((v) => v.length > 0).length;

    const scan = {
      filePath: envFile,
      totalKeys,
      configuredKeys,
      emptyKeys: totalKeys - configuredKeys,
      databaseType: parsed.DB_CONNECTION || "sqlite",
      services: {
        mariadb: {
          configured: Boolean(parsed.DB_HOST && parsed.DB_DATABASE),
          connection: parsed.DB_CONNECTION || "mariadb",
          host: parsed.DB_HOST || "127.0.0.1",
          port: parsed.DB_PORT || "3306",
          database: parsed.DB_DATABASE || "novastudio",
          username: parsed.DB_USERNAME || "root",
        },
        supabase: {
          configured: Boolean(parsed.SUPABASE_URL && parsed.SUPABASE_ANON_KEY),
          url: parsed.SUPABASE_URL || "",
        },
        discord: {
          configured: Boolean(parsed.DISCORD_GUILD_ID),
          guildId: parsed.DISCORD_GUILD_ID || "",
        },
        youtube: {
          configured: Boolean(parsed.YOUTUBE_API_KEY),
          channelId: parsed.YOUTUBE_CHANNEL_ID || "",
        },
        github: {
          configured: Boolean(parsed.GITHUB_USERNAME),
          username: parsed.GITHUB_USERNAME || "",
        },
        mail: {
          configured: Boolean(parsed.MAIL_HOST && parsed.MAIL_FROM_ADDRESS),
          host: parsed.MAIL_HOST || "",
          port: parsed.MAIL_PORT || "25",
          mailer: parsed.MAIL_MAILER || "smtp",
        },
      },
    };

    res.json({
      success: true,
      rawEnv,
      parsed,
      scan,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Update .env file live from web panel
router.post("/admin/env", requireAuth, (req: Request, res: Response) => {
  try {
    const { rawEnv, envVars } = req.body;
    const envFile = getEnvPath();

    let contentToWrite = "";

    if (typeof rawEnv === "string") {
      contentToWrite = rawEnv;
    } else if (envVars && typeof envVars === "object") {
      // Reconstruct .env format from key-value map
      contentToWrite = Object.entries(envVars)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");
    } else {
      res.status(400).json({ success: false, error: "Either rawEnv or envVars must be provided" });
      return;
    }

    // Backup current .env before overwriting
    try {
      const backupDir = path.resolve(DatabaseManager.getInstance().getDataDir(), "../backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      if (fs.existsSync(envFile)) {
        const backupFile = path.join(backupDir, `.env-backup-${Date.now()}`);
        fs.copyFileSync(envFile, backupFile);
      }
    } catch {
      // Backup error shouldn't block update
    }

    // Write updated .env file
    fs.writeFileSync(envFile, contentToWrite, "utf-8");

    // Mirror to /workspaces/w/.env if it exists
    const rootMirror = "/workspaces/w/.env";
    try {
      fs.writeFileSync(rootMirror, contentToWrite, "utf-8");
    } catch {}

    // Reload into process.env
    const lines = contentToWrite.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }

    activityRepo.log(
      "env.updated",
      "settings",
      `Environment configuration (.env) updated via web panel by ${req.user?.username}`,
      {
        userId: req.user?.id,
        username: req.user?.username,
        ipAddress: req.ip,
      }
    );

    wsManager.broadcast("env_updated", {
      author: req.user?.username,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: ".env configuration file saved and reloaded successfully!",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

