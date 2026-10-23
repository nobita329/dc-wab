import { Router, Request, Response } from "express";
import { TutorialRepository } from "../repositories/tutorialRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { WebSocketManager } from "../websocket/wsServer.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { YouTubeService, extractVideoId } from "../services/youtubeService.js";
import {
  TutorialItemSchema,
  TutorialSettingsSchema,
} from "@nova/shared";

export const tutorialRoutes = Router();
const tutorialRepo = new TutorialRepository();
const activityRepo = new ActivityRepository();
const wsManager = WebSocketManager.getInstance();

// ==========================================
// 1. PUBLIC ENDPOINTS
// ==========================================

// GET /api/tutorials
tutorialRoutes.get("/tutorials", (_req: Request, res: Response) => {
  try {
    const data = tutorialRepo.getTutorialPageData();
    res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to retrieve tutorials",
    });
  }
});

// GET /api/tutorials/:id
tutorialRoutes.get("/tutorials/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tutorial = tutorialRepo.getTutorialById(id);
    if (!tutorial) {
      return res.status(404).json({ success: false, error: "Tutorial not found" });
    }
    res.json({
      success: true,
      data: tutorial,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to retrieve tutorial",
    });
  }
});

// ==========================================
// 2. ADMIN ENDPOINTS
// ==========================================

// GET /api/admin/tutorials
tutorialRoutes.get("/admin/tutorials", requireAuth, (_req: Request, res: Response) => {
  try {
    const data = tutorialRepo.getTutorialPageData();
    res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to load tutorials from tutorials.db",
    });
  }
});

// PUT /api/admin/tutorials/settings
tutorialRoutes.put("/admin/tutorials/settings", requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = TutorialSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid tutorial settings",
        details: parsed.error.issues,
      });
    }

    const username = (req as any).user?.username || "admin";
    const updated = tutorialRepo.saveSettings(parsed.data, username);

    activityRepo.log(
      "UPDATE_TUTORIAL_SETTINGS",
      "content",
      `Admin ${username} updated YouTube channel settings (${updated.channelName || "Nova Studio"}) in tutorials.db`,
      {
        userId: (req as any).user?.id,
        username,
      }
    );

    const fullData = tutorialRepo.getTutorialPageData();
    wsManager.broadcast("tutorial_updated" as any, fullData);

    res.json({
      success: true,
      message: "Tutorial settings saved successfully",
      data: fullData,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to update tutorial settings",
    });
  }
});

// POST /api/admin/tutorials (Add or Edit single tutorial video)
tutorialRoutes.post("/admin/tutorials", requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body;
    // Extract video ID if user pasted full YouTube URL
    if (body.youtubeVideoId) {
      const extracted = extractVideoId(body.youtubeVideoId);
      if (extracted) {
        body.youtubeVideoId = extracted;
      }
    }

    const parsed = TutorialItemSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid tutorial format",
        details: parsed.error.issues,
      });
    }

    const username = (req as any).user?.username || "admin";
    const saved = tutorialRepo.addOrUpdateTutorial(parsed.data, username);

    activityRepo.log(
      "SET_TUTORIAL",
      "content",
      `Admin ${username} saved tutorial "${saved.title}" in tutorials.db`,
      {
        userId: (req as any).user?.id,
        username,
      }
    );

    const fullData = tutorialRepo.getTutorialPageData();
    wsManager.broadcast("tutorial_updated" as any, fullData);

    res.json({
      success: true,
      message: `Tutorial "${saved.title}" saved in tutorials.db`,
      tutorial: saved,
      data: fullData,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to save tutorial",
    });
  }
});

// DELETE /api/admin/tutorials/:id
tutorialRoutes.delete("/admin/tutorials/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const username = (req as any).user?.username || "admin";
    const success = tutorialRepo.deleteTutorial(id);

    if (!success) {
      return res.status(404).json({ success: false, error: "Tutorial not found" });
    }

    activityRepo.log(
      "DELETE_TUTORIAL",
      "content",
      `Admin ${username} deleted tutorial ${id} from tutorials.db`,
      {
        userId: (req as any).user?.id,
        username,
      }
    );

    const fullData = tutorialRepo.getTutorialPageData();
    wsManager.broadcast("tutorial_updated" as any, fullData);

    res.json({
      success: true,
      message: "Tutorial removed from tutorials.db",
      data: fullData,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to delete tutorial",
    });
  }
});

// POST /api/admin/tutorials/reorder
tutorialRoutes.post("/admin/tutorials/reorder", requireAuth, (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ success: false, error: "Array of tutorial IDs required" });
    }

    tutorialRepo.reorderTutorials(ids);
    const fullData = tutorialRepo.getTutorialPageData();
    wsManager.broadcast("tutorial_updated" as any, fullData);

    res.json({
      success: true,
      message: "Tutorials reordered successfully",
      data: fullData,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to reorder tutorials",
    });
  }
});

// POST /api/admin/tutorials/detect-video
// Detects video info (title, description, thumbnail, duration, likes, views) from YouTube
tutorialRoutes.post("/admin/tutorials/detect-video", requireAuth, async (req: Request, res: Response) => {
  try {
    const { urlOrId } = req.body;
    if (!urlOrId) {
      return res.status(400).json({ success: false, error: "YouTube Video URL or ID is required" });
    }

    const settings = tutorialRepo.getSettings();
    const result = await YouTubeService.detectVideo(urlOrId, settings.apiKey);

    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || "Failed to detect YouTube video",
    });
  }
});

// POST /api/admin/tutorials/detect-channel
// Detects channel stats (subscribers, views, video count, avatar, banner) from YouTube
tutorialRoutes.post("/admin/tutorials/detect-channel", requireAuth, async (req: Request, res: Response) => {
  try {
    const { channelId, apiKey } = req.body;
    const settings = tutorialRepo.getSettings();
    const effectiveKey = apiKey !== undefined ? apiKey : settings.apiKey;
    const effectiveChannel = channelId || settings.channelId;

    if (!effectiveChannel) {
      return res.status(400).json({ success: false, error: "Channel ID or handle is required" });
    }

    const result = await YouTubeService.detectChannel(effectiveChannel, effectiveKey);
    res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || "Failed to detect YouTube channel",
    });
  }
});

// POST /api/admin/tutorials/sync-youtube
// Uses YouTube API to import/sync full video show list from the channel
tutorialRoutes.post("/admin/tutorials/sync-youtube", requireAuth, async (req: Request, res: Response) => {
  try {
    const settings = tutorialRepo.getSettings();
    const channelId = req.body.channelId || settings.channelId;
    const apiKey = req.body.apiKey !== undefined ? req.body.apiKey : settings.apiKey;
    const replaceExisting = Boolean(req.body.replaceExisting);

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "YouTube API Key is required to sync channel videos. Please save your API key in settings.",
      });
    }

    if (!channelId) {
      return res.status(400).json({
        success: false,
        error: "Channel ID is required to sync channel videos.",
      });
    }

    // Fetch channel metadata first
    const channelMeta = await YouTubeService.detectChannel(channelId, apiKey);

    // Fetch up to 25 latest videos
    const videos = await YouTubeService.fetchChannelVideos(channelId, apiKey, 25);
    if (videos.length === 0) {
      return res.json({
        success: true,
        message: "No videos found for this channel.",
        syncedCount: 0,
      });
    }

    // Save channel stats in settings
    tutorialRepo.saveSettings({
      channelName: channelMeta.channelName || settings.channelName,
      channelId,
      apiKey,
      subscriberCount: channelMeta.subscriberCount,
      videoCount: channelMeta.videoCount,
      viewCount: channelMeta.viewCount,
      avatarUrl: channelMeta.avatarUrl || settings.avatarUrl,
      bannerUrl: channelMeta.bannerUrl || settings.bannerUrl,
    });

    // Save videos to tutorials.db
    const saved = tutorialRepo.batchSaveTutorials(videos, replaceExisting);
    const fullData = tutorialRepo.getTutorialPageData();

    // Real-time broadcast
    wsManager.broadcast("tutorial_updated" as any, fullData);

    res.json({
      success: true,
      message: `Successfully synced ${saved.length} videos from YouTube!`,
      syncedCount: saved.length,
      data: fullData,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to sync videos from YouTube",
    });
  }
});

// POST /api/admin/tutorials/restore-defaults
tutorialRoutes.post("/admin/tutorials/restore-defaults", requireAuth, (req: Request, res: Response) => {
  try {
    tutorialRepo.seedDefaultTutorials();
    const fullData = tutorialRepo.getTutorialPageData();
    wsManager.broadcast("tutorial_updated" as any, fullData);

    res.json({
      success: true,
      message: "Tutorials restored to default official guides.",
      data: fullData,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to restore default tutorials",
    });
  }
});
