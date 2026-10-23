import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { UserRepository } from "../repositories/userRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { LoginRequestSchema } from "@nova/shared";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const userRepo = new UserRepository();
const activityRepo = new ActivityRepository();

router.post("/login", async (req: Request, res: Response) => {
  try {
    const parseResult = LoginRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: "Invalid request payload",
        details: parseResult.error.errors,
      });
      return;
    }

    const { username, password } = parseResult.data;
    const user = userRepo.findByUsername(username);

    if (!user) {
      activityRepo.log("auth.login_failed", "auth", `Failed login attempt for unknown user: ${username}`, {
        username,
        ipAddress: req.ip,
        status: "warning",
      });
      res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
      return;
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      activityRepo.log("auth.login_failed", "auth", `Failed password verification for user: ${username}`, {
        userId: user.id,
        username,
        ipAddress: req.ip,
        status: "warning",
      });
      res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
      return;
    }

    // Create session (valid for 7 days)
    const sessionId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const userAgent = req.headers["user-agent"] || "unknown";

    userRepo.createSession(sessionId, user.id, token, expiresAt, userAgent, req.ip);
    userRepo.updateLastLogin(user.id);

    // Set secure HTTP-only cookie
    res.cookie("nova_auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    activityRepo.log("auth.login_success", "auth", `Admin user '${username}' signed in successfully`, {
      userId: user.id,
      username,
      ipAddress: req.ip,
      status: "success",
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email ?? undefined,
        role: user.role,
        createdAt: user.created_at,
        lastLoginAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Authentication service error: " + err.message,
    });
  }
});

router.post("/logout", requireAuth, (req: Request, res: Response) => {
  try {
    if (req.token) {
      userRepo.deleteSession(req.token);
    }

    res.clearCookie("nova_auth_session");

    if (req.user) {
      activityRepo.log("auth.logout", "auth", `User '${req.user.username}' signed out`, {
        userId: req.user.id,
        username: req.user.username,
        ipAddress: req.ip,
        status: "success",
      });
    }

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

export default router;

