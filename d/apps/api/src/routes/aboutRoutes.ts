import { Router, Request, Response } from "express";
import { ExtendedRepository } from "../repositories/extendedRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const extRepo = new ExtendedRepository();
const activityRepo = new ActivityRepository();

// Public: Get about details
router.get("/about", (_req: Request, res: Response) => {
  try {
    const about = extRepo.getAbout();
    res.json({ success: true, about });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get about details
router.get("/admin/about", requireAuth, (_req: Request, res: Response) => {
  try {
    const about = extRepo.getAbout();
    res.json({ success: true, about });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Update about details
router.put("/admin/about", requireAuth, (req: Request, res: Response) => {
  try {
    const updated = extRepo.saveAbout(req.body, req.user?.username || "admin");
    activityRepo.log(
      "about.updated",
      "settings",
      `Studio about page story & milestones updated by ${req.user?.username}`,
      { username: req.user?.username }
    );
    res.json({ success: true, message: "About information saved successfully", about: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

