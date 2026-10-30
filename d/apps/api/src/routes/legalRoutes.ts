import { Router, Request, Response } from "express";
import { ExtendedRepository } from "../repositories/extendedRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { WebSocketManager } from "../websocket/wsServer.js";
import { LegalPageSchema, ContactMessageSchema } from "@nova/shared";

const router = Router();
const extRepo = new ExtendedRepository();
const activityRepo = new ActivityRepository();
const wsManager = WebSocketManager.getInstance();

// ========================================================
// Public Endpoints
// ========================================================

// GET /api/legal - Get all published legal pages
router.get("/legal", (_req: Request, res: Response) => {
  try {
    const pages = extRepo.getLegalPages(true);
    res.json({ success: true, pages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/legal/:slug - Get a single published legal page by slug
router.get("/legal/:slug", (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const page = extRepo.getLegalPageBySlug(slug, true);
    if (!page) {
      res.status(404).json({ success: false, error: "Legal page not found or unpublished" });
      return;
    }
    res.json({ success: true, page });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/contact - Public contact & privacy inquiry submission
router.post("/contact", (req: Request, res: Response) => {
  try {
    const parsed = ContactMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    const ipAddress = req.ip || req.socket.remoteAddress || "";
    const submission = extRepo.saveContactSubmission({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
      ipAddress,
    });

    activityRepo.log(
      "contact.submitted",
      "content",
      `New contact message from '${parsed.data.name}' (${parsed.data.email})`,
      { ipAddress, metadata: { submissionId: submission.id } }
    );

    res.json({
      success: true,
      message: "Thank you for contacting Nova Studio. Your message has been received.",
      submissionId: submission.id,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================================
// Admin Endpoints (Protected)
// ========================================================

// GET /api/admin/legal - Get all legal pages (published and draft)
router.get("/admin/legal", requireAuth, (_req: Request, res: Response) => {
  try {
    const pages = extRepo.getLegalPages(false);
    res.json({ success: true, pages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/legal/:id - Get a specific legal page by ID
router.get("/admin/legal/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = extRepo.getLegalPageById(id);
    if (!page) {
      res.status(404).json({ success: false, error: "Legal page not found" });
      return;
    }
    res.json({ success: true, page });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/legal - Create a new legal page
router.post("/admin/legal", requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = LegalPageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    // Check slug uniqueness
    const existing = extRepo.getLegalPageBySlug(parsed.data.slug, false);
    if (existing) {
      res.status(400).json({ success: false, error: `Slug '${parsed.data.slug}' is already in use` });
      return;
    }

    const created = extRepo.createLegalPage(parsed.data);

    activityRepo.log(
      "legal.created",
      "content",
      `Legal page '${created.title}' (/${created.slug}) created by ${req.user?.username}`,
      { username: req.user?.username, metadata: { pageId: created.id, slug: created.slug } }
    );

    wsManager.broadcast("legal_page_updated", { action: "created", page: created });

    res.json({ success: true, message: "Legal page created successfully", page: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/legal/:id - Update an existing legal page
router.put("/admin/legal/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = LegalPageSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    // If slug is being updated, verify uniqueness
    if (parsed.data.slug) {
      const existing = extRepo.getLegalPageBySlug(parsed.data.slug, false);
      if (existing && existing.id !== id) {
        res.status(400).json({ success: false, error: `Slug '${parsed.data.slug}' is already in use by another page` });
        return;
      }
    }

    const updated = extRepo.updateLegalPage(id, parsed.data);
    if (!updated) {
      res.status(404).json({ success: false, error: "Legal page not found" });
      return;
    }

    activityRepo.log(
      "legal.updated",
      "content",
      `Legal page '${updated.title}' updated by ${req.user?.username}`,
      { username: req.user?.username, metadata: { pageId: updated.id, slug: updated.slug } }
    );

    wsManager.broadcast("legal_page_updated", { action: "updated", page: updated });

    res.json({ success: true, message: "Legal page updated successfully", page: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/legal/:id/status - Quick publish / unpublish toggle
router.patch("/admin/legal/:id/status", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status !== "published" && status !== "draft") {
      res.status(400).json({ success: false, error: "Status must be 'published' or 'draft'" });
      return;
    }

    const updated = extRepo.setLegalPageStatus(id, status);
    if (!updated) {
      res.status(404).json({ success: false, error: "Legal page not found" });
      return;
    }

    activityRepo.log(
      status === "published" ? "legal.published" : "legal.unpublished",
      "content",
      `Legal page '${updated.title}' set to ${status} by ${req.user?.username}`,
      { username: req.user?.username, metadata: { pageId: updated.id, status } }
    );

    wsManager.broadcast("legal_page_updated", { action: "status_changed", page: updated });

    res.json({ success: true, message: `Legal page ${status} successfully`, page: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/admin/legal/:id - Delete a legal page
router.delete("/admin/legal/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = extRepo.getLegalPageById(id);
    if (!page) {
      res.status(404).json({ success: false, error: "Legal page not found" });
      return;
    }

    const deleted = extRepo.deleteLegalPage(id);
    if (!deleted) {
      res.status(500).json({ success: false, error: "Failed to delete legal page" });
      return;
    }

    activityRepo.log(
      "legal.deleted",
      "content",
      `Legal page '${page.title}' deleted by ${req.user?.username}`,
      { username: req.user?.username, metadata: { pageId: id, title: page.title } }
    );

    wsManager.broadcast("legal_page_updated", { action: "deleted", pageId: id });

    res.json({ success: true, message: "Legal page deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/contact-submissions - View contact & privacy submissions
router.get("/admin/contact-submissions", requireAuth, (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const submissions = extRepo.getContactSubmissions(limit);
    res.json({ success: true, submissions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/contact-submissions/:id/status - Update submission status (e.g. read/resolved)
router.patch("/admin/contact-submissions/:id/status", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: "Status is required" });
      return;
    }
    const updated = extRepo.updateContactSubmissionStatus(id, status);
    if (!updated) {
      res.status(404).json({ success: false, error: "Submission not found" });
      return;
    }
    res.json({ success: true, message: "Submission status updated" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
