import { Router, Request, Response } from "express";
import { ExtendedRepository } from "../repositories/extendedRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const extRepo = new ExtendedRepository();
const activityRepo = new ActivityRepository();

// Public: Get active links
router.get("/links", (_req: Request, res: Response) => {
  try {
    const links = extRepo.getLinks().filter((l) => l.isActive);
    res.json({ success: true, links });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Public: Track link click
router.post("/links/:id/click", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const links = extRepo.getLinks();
    const target = links.find((l) => l.id === id);
    if (target) {
      extRepo.updateLink(id, { clickCount: target.clickCount + 1 });
    }
    res.json({ success: true });
  } catch {
    res.status(200).json({ success: true });
  }
});

// Admin: Get all links
router.get("/admin/links", requireAuth, (_req: Request, res: Response) => {
  try {
    const links = extRepo.getLinks();
    res.json({ success: true, links });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Create link
router.post("/admin/links", requireAuth, (req: Request, res: Response) => {
  try {
    const created = extRepo.createLink(req.body);
    activityRepo.log(
      "link.created",
      "content",
      `Quick link '${created.title}' created by ${req.user?.username}`,
      { metadata: { linkId: created.id } }
    );
    res.json({ success: true, message: "Link created successfully", link: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Update link
router.put("/admin/links/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = extRepo.updateLink(id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: "Link not found" });
      return;
    }
    activityRepo.log(
      "link.updated",
      "content",
      `Quick link '${updated.title}' updated by ${req.user?.username}`,
      { metadata: { linkId: updated.id } }
    );
    res.json({ success: true, message: "Link updated successfully", link: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Delete link
router.delete("/admin/links/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = extRepo.deleteLink(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Link not found" });
      return;
    }
    activityRepo.log(
      "link.deleted",
      "content",
      `Quick link '${id}' deleted by ${req.user?.username}`,
      { metadata: { linkId: id } }
    );
    res.json({ success: true, message: "Link deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
