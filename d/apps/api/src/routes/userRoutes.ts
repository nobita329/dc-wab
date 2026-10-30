import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { UserRepository } from "../repositories/userRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getGravatarUrl } from "../utils/totp.js";

const router = Router();
const userRepo = new UserRepository();
const activityRepo = new ActivityRepository();

// Get all users
router.get("/admin/users", requireAuth, (_req: Request, res: Response) => {
  try {
    const users = userRepo.getAllUsers();
    const activeSessions = userRepo.countActiveSessions();
    res.json({
      success: true,
      users,
      activeSessions,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user details by ID
router.get("/admin/users/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = userRepo.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    const sessions = userRepo.getUserSessions(id);
    const history = userRepo.getLoginHistory(id, 50);

    res.json({
      success: true,
      user,
      sessions,
      history,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new user
router.post("/admin/users", requireAuth, (req: Request, res: Response) => {
  try {
    const { username, password, email, role, nameFirst, nameLast } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: "Username and password are required" });
      return;
    }

    const existing = userRepo.findByUsername(username);
    if (existing) {
      res.status(400).json({ success: false, error: "Username already exists" });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = crypto.randomUUID();
    const avatarUrl = getGravatarUrl(email);

    const created = userRepo.createUser({
      id: userId,
      username,
      passwordHash,
      email: email || undefined,
      nameFirst,
      nameLast,
      avatarUrl,
      role: role || "editor",
    });

    activityRepo.log(
      "user.created",
      "auth",
      `New user '${username}' (${role || "editor"}) created by ${req.user?.username}`,
      { userId: req.user?.id, username: req.user?.username }
    );

    res.json({
      success: true,
      message: `User '${username}' created successfully`,
      user: created,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update user identity and security
router.put("/admin/users/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, role, password, nameFirst, nameLast, language, country, isBanned, isSuspended } = req.body;

    let passwordHash: string | undefined;
    if (password && password.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      passwordHash = bcrypt.hashSync(password, salt);
    }

    const avatarUrl = email ? getGravatarUrl(email) : undefined;

    const updated = userRepo.updateUser(id, {
      username,
      email,
      nameFirst,
      nameLast,
      avatarUrl,
      role,
      passwordHash,
      language,
      country,
      isBanned,
      isSuspended,
    });

    if (!updated) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    activityRepo.log(
      "user.updated",
      "auth",
      `User '${updated.username}' updated by ${req.user?.username}`,
      { userId: req.user?.id, username: req.user?.username }
    );

    res.json({
      success: true,
      message: "User updated successfully",
      user: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin toggle or reset 2FA
router.patch("/admin/users/:id/2fa", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    userRepo.setTwoFactor(id, Boolean(enabled));

    activityRepo.log(
      "user.2fa_modified",
      "auth",
      `2FA status for user ID ${id} set to ${Boolean(enabled)} by ${req.user?.username}`,
      { userId: req.user?.id, username: req.user?.username, metadata: { targetId: id, enabled } }
    );

    res.json({ success: true, message: `Two-Factor Authentication ${enabled ? "enabled" : "disabled"}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Revoke user session
router.delete("/admin/users/:id/sessions/:sessionId", requireAuth, (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    userRepo.revokeUserSession(sessionId);
    res.json({ success: true, message: "Session revoked successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete user
router.delete("/admin/users/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      res.status(400).json({ success: false, error: "You cannot delete your own account" });
      return;
    }

    const targetUser = userRepo.findById(id);
    if (!targetUser) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const users = userRepo.getAllUsers();
    const adminCount = users.filter((u) => u.role === "admin").length;
    if (targetUser.role === "admin" && adminCount <= 1) {
      res.status(400).json({ success: false, error: "Cannot delete the sole administrator account" });
      return;
    }

    userRepo.deleteUser(id);

    activityRepo.log(
      "user.deleted",
      "auth",
      `User '${targetUser.username}' deleted by ${req.user?.username}`,
      { userId: req.user?.id, username: req.user?.username }
    );

    res.json({
      success: true,
      message: `User '${targetUser.username}' deleted successfully`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
