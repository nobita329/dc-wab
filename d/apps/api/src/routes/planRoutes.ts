import { Router, Request, Response } from "express";
import { ExtendedRepository } from "../repositories/extendedRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const extRepo = new ExtendedRepository();
const activityRepo = new ActivityRepository();

// Public: Get active plans
router.get("/plans", (_req: Request, res: Response) => {
  try {
    const plans = extRepo.getPlans().filter((p) => p.isActive);
    res.json({ success: true, plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get all plans
router.get("/admin/plans", requireAuth, (_req: Request, res: Response) => {
  try {
    const plans = extRepo.getPlans();
    res.json({ success: true, plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Create plan
router.post("/admin/plans", requireAuth, (req: Request, res: Response) => {
  try {
    const created = extRepo.createPlan(req.body);
    activityRepo.log(
      "plan.created",
      "content",
      `Pricing plan '${created.name}' created by ${req.user?.username}`,
      { metadata: { planId: created.id } }
    );
    res.json({ success: true, message: "Plan created successfully", plan: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Update plan
router.put("/admin/plans/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = extRepo.updatePlan(id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: "Plan not found" });
      return;
    }
    activityRepo.log(
      "plan.updated",
      "content",
      `Pricing plan '${updated.name}' updated by ${req.user?.username}`,
      { metadata: { planId: updated.id } }
    );
    res.json({ success: true, message: "Plan updated successfully", plan: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Delete plan
router.delete("/admin/plans/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = extRepo.deletePlan(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Plan not found" });
      return;
    }
    activityRepo.log(
      "plan.deleted",
      "content",
      `Pricing plan '${id}' deleted by ${req.user?.username}`,
      { metadata: { planId: id } }
    );
    res.json({ success: true, message: "Plan deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
