import { Router, Request, Response } from "express";
import { SettingsRepository } from "../repositories/settingsRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { WebSocketManager } from "../websocket/wsServer.js";
import { SiteSettingsSchema, UserPanelPreferencesSchema } from "@nova/shared";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();
const settingsRepo = new SettingsRepository();
const activityRepo = new ActivityRepository();
const wsManager = WebSocketManager.getInstance();

const requireAdmin = requireRole(["admin"]);

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

// Admin: Get current global settings
router.get("/admin/settings", requireAuth, requireAdmin, (req: Request, res: Response) => {
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

// Admin: Update global settings
router.put("/admin/settings", requireAuth, requireAdmin, (req: Request, res: Response) => {
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
      `Global website customization & branding updated by ${req.user?.username}`,
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
      message: "Global settings saved successfully",
      settings: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Reset global settings to defaults
router.post("/admin/settings/reset", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const reset = settingsRepo.resetGlobalSettings(req.user?.username || "admin");

    activityRepo.log(
      "settings.reset",
      "settings",
      `Global website settings were reset to defaults by ${req.user?.username}`,
      {
        userId: req.user?.id,
        username: req.user?.username,
        ipAddress: req.ip,
      }
    );

    wsManager.broadcast("settings_updated", {
      settings: reset,
      author: req.user?.username,
    });

    res.json({
      success: true,
      message: "Global settings reset to defaults successfully",
      settings: reset,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Normal User: Personal Preferences Endpoints
// ==========================================

// Get logged-in user's personal appearance preferences
router.get("/user/preferences", requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const preferences = settingsRepo.getUserPreferences(userId);
    const globalSettings = settingsRepo.getSettings();

    res.json({
      success: true,
      preferences,
      permissions: globalSettings.features,
      defaults: globalSettings.branding,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update logged-in user's personal appearance preferences
router.put("/user/preferences", requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const globalSettings = settingsRepo.getSettings();
    const features = globalSettings.features || {
      allowUserCustomBackground: true,
      allowUserTransparency: true,
      allowUserBlur: true,
      allowUserTheme: true,
    };

    // Filter permitted preferences based on global features configured by Admin
    const incoming = req.body || {};
    const sanitized: any = { userId };

    if (features.allowUserTheme && incoming.theme) {
      sanitized.theme = incoming.theme;
    }
    if (features.allowUserCustomBackground) {
      if (incoming.backgroundType) sanitized.backgroundType = incoming.backgroundType;
      if (incoming.backgroundUrl !== undefined) sanitized.backgroundUrl = incoming.backgroundUrl;
      if (incoming.backgroundFit) sanitized.backgroundFit = incoming.backgroundFit;
      if (incoming.backgroundPosition) sanitized.backgroundPosition = incoming.backgroundPosition;
      if (incoming.backgroundOpacity !== undefined) sanitized.backgroundOpacity = incoming.backgroundOpacity;
      if (incoming.overlayColor) sanitized.overlayColor = incoming.overlayColor;
      if (incoming.overlayOpacity !== undefined) sanitized.overlayOpacity = incoming.overlayOpacity;
      if (incoming.gradientFrom) sanitized.gradientFrom = incoming.gradientFrom;
      if (incoming.gradientTo) sanitized.gradientTo = incoming.gradientTo;
      if (incoming.gradientAngle !== undefined) sanitized.gradientAngle = incoming.gradientAngle;
    }
    if (features.allowUserTransparency && incoming.panelTransparency !== undefined) {
      sanitized.panelTransparency = incoming.panelTransparency;
    }
    if (features.allowUserBlur && incoming.panelBlur !== undefined) {
      sanitized.panelBlur = incoming.panelBlur;
    }

    const updated = settingsRepo.updateUserPreferences(userId, sanitized);

    res.json({
      success: true,
      message: "Personal appearance preferences saved",
      preferences: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reset logged-in user's personal preferences to global default
router.post("/user/preferences/reset", requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    settingsRepo.resetUserPreferences(userId);

    res.json({
      success: true,
      message: "Personal appearance preferences reset to global defaults",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get logged-in user's wallpaper favorites
router.get("/user/favorites", requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const favorites = settingsRepo.getUserFavorites(userId);
    res.json({ success: true, favorites });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Toggle wallpaper favorite for logged-in user
router.post("/user/favorites/toggle", requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { wallpaperId, wallpaperUrl } = req.body;

    if (!wallpaperId && !wallpaperUrl) {
      res.status(400).json({ success: false, error: "wallpaperId or wallpaperUrl required" });
      return;
    }

    const result = settingsRepo.toggleUserFavorite(
      userId,
      wallpaperId || wallpaperUrl,
      wallpaperUrl || wallpaperId
    );

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
