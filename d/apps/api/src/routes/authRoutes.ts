import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { UserRepository } from "../repositories/userRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import {
  LoginRequestSchema,
  RegisterRequestSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@nova/shared";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  generateBase32Secret,
  generateTOTP,
  verifyTOTP,
  generateBackupCodes,
  getOtpAuthUrl,
  getGravatarUrl,
} from "../utils/totp.js";

const router = Router();
const userRepo = new UserRepository();
const activityRepo = new ActivityRepository();

// ==========================================
// 1. LOGIN (with 2FA / TOTP Support)
// ==========================================
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

    const { username, password, twoFactorCode } = parseResult.data;
    const user = userRepo.findByUsernameOrEmail(username);

    if (!user) {
      activityRepo.log("auth.login_failed", "auth", `Failed login attempt for unknown user: ${username}`, {
        username,
        ipAddress: req.ip,
        status: "warning",
      });
      res.status(401).json({
        success: false,
        error: "Invalid username/email or password",
      });
      return;
    }

    if (user.is_banned) {
      res.status(403).json({
        success: false,
        error: "This account has been permanently suspended by an administrator.",
      });
      return;
    }

    if (user.is_suspended && user.suspended_until) {
      const until = new Date(user.suspended_until);
      if (until > new Date()) {
        res.status(403).json({
          success: false,
          error: `This account is suspended until ${until.toLocaleString()}.`,
        });
        return;
      }
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
        error: "Invalid username/email or password",
      });
      return;
    }

    // Check if Two-Factor Authentication is enabled
    if (user.use_totp === 1) {
      if (!twoFactorCode) {
        // Prompt for 2FA verification step
        res.json({
          success: false,
          requireTwoFactor: true,
          userId: user.id,
          message: "Please enter your 6-digit Two-Factor Authentication code or backup code.",
        });
        return;
      }

      // Verify TOTP or Backup Code
      const isTotpValid = user.totp_secret ? verifyTOTP(twoFactorCode, user.totp_secret) : false;
      const isBackupCodeValid = isTotpValid ? false : userRepo.verifyAndConsumeBackupCode(user.id, twoFactorCode);

      if (!isTotpValid && !isBackupCodeValid) {
        activityRepo.log("auth.2fa_failed", "auth", `Invalid 2FA code entered for user: ${username}`, {
          userId: user.id,
          username,
          ipAddress: req.ip,
          status: "warning",
        });
        res.status(401).json({
          success: false,
          requireTwoFactor: true,
          error: "Invalid Two-Factor code or backup recovery code. Please try again.",
        });
        return;
      }
    }

    // Create session (valid for 7 days)
    const sessionId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const userAgent = (req.headers["user-agent"] as string) || "unknown";
    const ipAddress = req.ip || (req.socket.remoteAddress as string) || "127.0.0.1";

    userRepo.createSession(sessionId, user.id, token, expiresAt, userAgent, ipAddress);
    userRepo.updateLastLogin(user.id, ipAddress);
    userRepo.logLoginHistory(user.id, ipAddress, userAgent);

    // Set secure HTTP-only cookie
    res.cookie("nova_auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    activityRepo.log("auth.login_success", "auth", `User '${user.username}' signed in successfully`, {
      userId: user.id,
      username: user.username,
      ipAddress,
      status: "success",
    });

    const userObj = userRepo.findById(user.id);
    res.json({
      success: true,
      token,
      user: userObj,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Authentication service error: " + err.message,
    });
  }
});

// ==========================================
// 2. REGISTER
// ==========================================
router.post("/register", async (req: Request, res: Response) => {
  try {
    const parseResult = RegisterRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    const { username, email, password, nameFirst, nameLast } = parseResult.data;

    if (userRepo.findByUsername(username)) {
      res.status(400).json({ success: false, error: "Username is already registered." });
      return;
    }

    if (userRepo.findByEmail(email)) {
      res.status(400).json({ success: false, error: "Email address is already registered." });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = crypto.randomUUID();
    const avatarUrl = getGravatarUrl(email);

    const created = userRepo.createUser({
      id: userId,
      username,
      email,
      passwordHash,
      nameFirst,
      nameLast,
      avatarUrl,
      role: "editor",
    });

    // Auto-login session creation
    const sessionId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const userAgent = (req.headers["user-agent"] as string) || "unknown";
    const ipAddress = req.ip || (req.socket.remoteAddress as string) || "127.0.0.1";

    userRepo.createSession(sessionId, userId, token, expiresAt, userAgent, ipAddress);
    userRepo.updateLastLogin(userId, ipAddress);
    userRepo.logLoginHistory(userId, ipAddress, userAgent);

    res.cookie("nova_auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    activityRepo.log("auth.registered", "auth", `New user registered: '${username}' (${email})`, {
      userId,
      username,
      ipAddress,
      status: "success",
    });

    res.json({
      success: true,
      message: "Account registered successfully!",
      token,
      user: created,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Registration error: " + err.message,
    });
  }
});

// ==========================================
// 3. FORGOT PASSWORD
// ==========================================
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const parseResult = ForgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: "Please enter your registered email or username." });
      return;
    }

    const { emailOrUsername } = parseResult.data;
    const user = userRepo.findByUsernameOrEmail(emailOrUsername);

    if (!user) {
      // Return neutral message for security / anti-enumeration
      res.json({
        success: true,
        message: "If an account matching that identifier exists, a password reset authorization has been generated.",
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour validity

    userRepo.setResetToken(user.id, resetToken, expiresAt);

    const resetUrl = `/admin/reset-password?token=${resetToken}`;

    activityRepo.log("auth.reset_requested", "auth", `Password reset requested for '${user.username}'`, {
      userId: user.id,
      username: user.username,
      ipAddress: req.ip,
      status: "success",
    });

    // Provide reset URL directly in response for instant demo access
    res.json({
      success: true,
      message: "Password reset authorization generated successfully.",
      resetToken,
      resetUrl,
      demoFastPass: `Click here to reset immediately: ${resetUrl}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. RESET PASSWORD
// ==========================================
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const parseResult = ResetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: parseResult.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }

    const { token, password } = parseResult.data;
    const user = userRepo.findByResetToken(token);

    if (!user) {
      res.status(400).json({
        success: false,
        error: "This password reset token is invalid or has expired. Please request a new one.",
      });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    userRepo.updateUser(user.id, { passwordHash });
    userRepo.clearResetToken(user.id);

    activityRepo.log("auth.password_reset", "auth", `Password was successfully reset for user '${user.username}'`, {
      userId: user.id,
      username: user.username,
      ipAddress: req.ip,
      status: "success",
    });

    res.json({
      success: true,
      message: "Your password has been reset successfully. You may now sign in with your new credentials.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. TWO-FACTOR AUTH SETUP (GET & POST)
// ==========================================
router.get("/2fa/setup", requireAuth, (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const secret = generateBase32Secret(20);
    const otpAuthUrl = getOtpAuthUrl("Nova Studio", user.username, secret);
    const backupCodes = generateBackupCodes(8);
    const currentCode = generateTOTP(secret);

    res.json({
      success: true,
      secret,
      otpAuthUrl,
      backupCodes,
      currentSampleCode: currentCode,
      message: "Scan the QR code or enter the secret key into Google Authenticator or Authy.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/2fa/verify", requireAuth, (req: Request, res: Response) => {
  try {
    const { secret, token, backupCodes } = req.body;
    if (!secret || !token) {
      res.status(400).json({ success: false, error: "Secret and 6-digit verification code are required" });
      return;
    }

    const isValid = verifyTOTP(token, secret);
    if (!isValid) {
      res.status(400).json({
        success: false,
        error: "Invalid 6-digit code. Please verify against your authenticator app and try again.",
      });
      return;
    }

    userRepo.setTwoFactor(req.user!.id, true, secret, backupCodes || generateBackupCodes(8));

    activityRepo.log("auth.2fa_enabled", "auth", `Two-factor authentication enabled for user '${req.user!.username}'`, {
      userId: req.user!.id,
      username: req.user!.username,
      ipAddress: req.ip,
      status: "success",
    });

    res.json({
      success: true,
      message: "Two-Factor Authentication has been successfully enabled on your account!",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/2fa/disable", requireAuth, (req: Request, res: Response) => {
  try {
    userRepo.setTwoFactor(req.user!.id, false);

    activityRepo.log("auth.2fa_disabled", "auth", `Two-factor authentication disabled for user '${req.user!.username}'`, {
      userId: req.user!.id,
      username: req.user!.username,
      ipAddress: req.ip,
      status: "warning",
    });

    res.json({
      success: true,
      message: "Two-Factor Authentication has been disabled on your account.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 6. IMPERSONATE (Login as User)
// ==========================================
router.post("/impersonate/:id", requireAuth, (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      res.status(403).json({ success: false, error: "Only administrators can impersonate accounts." });
      return;
    }

    const targetUser = userRepo.findById(req.params.id);
    if (!targetUser) {
      res.status(404).json({ success: false, error: "Target user not found" });
      return;
    }

    const sessionId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const userAgent = (req.headers["user-agent"] as string) || "impersonated";
    const ipAddress = req.ip || "127.0.0.1";

    userRepo.createSession(sessionId, targetUser.id, token, expiresAt, userAgent, ipAddress);

    res.cookie("nova_auth_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    activityRepo.log("auth.impersonate", "auth", `Admin '${req.user.username}' impersonated user '${targetUser.username}'`, {
      userId: req.user.id,
      username: req.user.username,
      metadata: { targetUserId: targetUser.id },
      status: "warning",
    });

    res.json({
      success: true,
      token,
      user: targetUser,
      message: `Now logged in as ${targetUser.username}`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 7. LOGOUT & CURRENT SESSION (/me)
// ==========================================
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
  const fullUser = userRepo.findById(req.user!.id);
  res.json({
    success: true,
    user: fullUser,
  });
});

export default router;
