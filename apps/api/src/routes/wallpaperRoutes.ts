import { Router, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { WallpaperService } from "../services/wallpaperService.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { DatabaseManager } from "../database/connection.js";

const router = Router();
const wallpaperService = WallpaperService.getInstance();

// Public: Get 4K wallpapers with category filter, search, and pagination
router.get("/wallpapers", (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string) || "all";
    const q = (req.query.q as string) || "";
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;

    const result = wallpaperService.getWallpapers({
      category,
      q,
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 12 : limit,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Public: Get list of wallpaper categories
router.get("/wallpapers/categories", (_req: Request, res: Response) => {
  try {
    const categories = wallpaperService.getCategories();
    res.json({ success: true, categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Upload background image or video
router.post("/admin/upload-background", requireAuth, (req: Request, res: Response) => {
  try {
    const { fileData, fileName, mimeType } = req.body;

    if (!fileData || typeof fileData !== "string") {
      res.status(400).json({ success: false, error: "fileData (base64 string) is required" });
      return;
    }

    // Supported mime types: images & videos
    const allowedMimes: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/jpg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
      "video/mp4": ".mp4",
      "video/webm": ".webm",
      "video/quicktime": ".mov",
    };

    let ext = "";
    let cleanBase64 = fileData;

    // Check for data URL header
    const dataUrlMatch = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (dataUrlMatch) {
      const detectedMime = dataUrlMatch[1].toLowerCase();
      if (!allowedMimes[detectedMime]) {
        res.status(400).json({
          success: false,
          error: `Unsupported file type: ${detectedMime}. Only images (JPG, PNG, WEBP, GIF) and videos (MP4, WEBM) are supported.`,
        });
        return;
      }
      ext = allowedMimes[detectedMime];
      cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, "");
    } else if (mimeType && allowedMimes[mimeType.toLowerCase()]) {
      ext = allowedMimes[mimeType.toLowerCase()];
    } else if (fileName) {
      const parsedExt = path.extname(fileName).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".webm"].includes(parsedExt)) {
        ext = parsedExt === ".jpeg" ? ".jpg" : parsedExt;
      }
    }

    if (!ext) {
      ext = ".jpg"; // fallback default
    }

    const buffer = Buffer.from(cleanBase64, "base64");
    if (buffer.length === 0) {
      res.status(400).json({ success: false, error: "Empty file payload" });
      return;
    }

    // Limit to 50MB
    if (buffer.length > 50 * 1024 * 1024) {
      res.status(400).json({ success: false, error: "File exceeds maximum size limit of 50MB" });
      return;
    }

    const uniqueId = crypto.randomBytes(8).toString("hex");
    const safeName = `bg-${Date.now()}-${uniqueId}${ext}`;

    const dataUploadsDir = path.join(DatabaseManager.getInstance().getDataDir(), "uploads");
    if (!fs.existsSync(dataUploadsDir)) {
      fs.mkdirSync(dataUploadsDir, { recursive: true });
    }

    // Write to data/uploads
    const targetPath = path.join(dataUploadsDir, safeName);
    fs.writeFileSync(targetPath, buffer);

    // Also mirror to apps/web/public/uploads if exists
    const webPublicUploads = path.resolve(process.cwd(), "../web/public/uploads");
    try {
      if (!fs.existsSync(webPublicUploads)) {
        fs.mkdirSync(webPublicUploads, { recursive: true });
      }
      fs.writeFileSync(path.join(webPublicUploads, safeName), buffer);
    } catch {
      // Ignore if web public dir is different in prod
    }

    const isVideo = [".mp4", ".webm", ".mov"].includes(ext);

    res.json({
      success: true,
      message: `${isVideo ? "Video" : "Image"} uploaded successfully`,
      url: `/uploads/${safeName}`,
      fileName: safeName,
      fileType: isVideo ? "video" : "image",
      fileSize: buffer.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export { router as wallpaperRoutes };

