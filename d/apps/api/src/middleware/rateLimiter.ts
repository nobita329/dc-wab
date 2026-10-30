import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export function rateLimiter(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = "Too many requests, please try again later." } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${ip}:${req.baseUrl || ""}`;
    const now = Date.now();

    const record = memoryStore.get(key);

    if (!record || now > record.resetAt) {
      memoryStore.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", max - 1);
      return next();
    }

    record.count++;
    const remaining = Math.max(0, max - record.count);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetAt / 1000));

    if (record.count > max) {
      res.status(429).json({
        success: false,
        error: message,
        retryAfterMs: record.resetAt - now,
      });
      return;
    }

    next();
  };
}

