import { Router, Request, Response } from "express";
import { ExtendedRepository } from "../repositories/extendedRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const extRepo = new ExtendedRepository();
const activityRepo = new ActivityRepository();

// Public: Get published projects
router.get("/projects", (_req: Request, res: Response) => {
  try {
    const projects = extRepo.getProjects().filter((p) => p.status === "published");
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get all projects
router.get("/admin/projects", requireAuth, (_req: Request, res: Response) => {
  try {
    const projects = extRepo.getProjects();
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Create project
router.post("/admin/projects", requireAuth, (req: Request, res: Response) => {
  try {
    const created = extRepo.createProject(req.body);
    activityRepo.log(
      "project.created",
      "content",
      `Project '${created.title}' created by ${req.user?.username}`,
      { metadata: { projectId: created.id } }
    );
    res.json({ success: true, message: "Project created successfully", project: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Update project
router.put("/admin/projects/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = extRepo.updateProject(id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }
    activityRepo.log(
      "project.updated",
      "content",
      `Project '${updated.title}' updated by ${req.user?.username}`,
      { metadata: { projectId: updated.id } }
    );
    res.json({ success: true, message: "Project updated successfully", project: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Delete project
router.delete("/admin/projects/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = extRepo.deleteProject(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Project not found" });
      return;
    }
    activityRepo.log(
      "project.deleted",
      "content",
      `Project '${id}' deleted by ${req.user?.username}`,
      { metadata: { projectId: id } }
    );
    res.json({ success: true, message: "Project deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
