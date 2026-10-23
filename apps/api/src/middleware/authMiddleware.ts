import { Request, Response, NextFunction } from "express";
import { UserRepository } from "../repositories/userRepository.js";
import { User } from "@nova/shared";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

const userRepo = new UserRepository();

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Check authorization header or cookie
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.nova_auth_session) {
    token = req.cookies.nova_auth_session;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: "Authentication required. Please sign in.",
    });
    return;
  }

  const session = userRepo.findSession(token);
  if (!session) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired session. Please sign in again.",
    });
    return;
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    userRepo.deleteSession(token);
    res.status(401).json({
      success: false,
      error: "Session expired. Please sign in again.",
    });
    return;
  }

  const user = userRepo.findById(session.userId);
  if (!user) {
    res.status(401).json({
      success: false,
      error: "User not found.",
    });
    return;
  }

  req.user = user;
  req.token = token;
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: "Forbidden. Insufficient permissions.",
      });
      return;
    }
    next();
  };
}

