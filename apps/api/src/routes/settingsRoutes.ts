import { Router, Request, Response } from "express";
import { SettingsRepository } from "../repositories/settingsRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
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

export default router;

