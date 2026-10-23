import { Router, Request, Response } from "express";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { ContentRepository } from "../repositories/contentRepository.js";
import { UserRepository } from "../repositories/userRepository.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const activityRepo = new ActivityRepository();
const contentRepo = new ContentRepository();
const userRepo = new UserRepository();

router.get("/admin/activity", requireAuth, (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const category = req.query.category as string | undefined;

    const logs = activityRepo.listLogs(limit, category);

    res.json({
      success: true,
      logs,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/admin/analytics", requireAuth, (req: Request, res: Response) => {
  try {
    const publishCount = contentRepo.getPublishCount();
    const activeSessions = userRepo.countActiveSessions();
    const summary = activityRepo.getAnalyticsSummary(publishCount, activeSessions);

    res.json({
      success: true,
      analytics: summary,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

