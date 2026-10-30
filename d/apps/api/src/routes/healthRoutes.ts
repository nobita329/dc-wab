import { Router, Request, Response } from "express";
import { DatabaseManager } from "../database/connection.js";
import { WebSocketManager } from "../websocket/wsServer.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const startTime = Date.now();
const dbManager = DatabaseManager.getInstance();
const wsManager = WebSocketManager.getInstance();

let totalRequests = 0;
router.use((req, res, next) => {
  totalRequests++;
  next();
});

// Public health check
router.get("/health", (req: Request, res: Response) => {
  try {
    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    const isUserDbOk = dbManager.checkIntegrity("user");
    const isContentDbOk = dbManager.checkIntegrity("content");
    const isSettingsDbOk = dbManager.checkIntegrity("settings");

    const healthy = isUserDbOk && isContentDbOk && isSettingsDbOk;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? "healthy" : "degraded",
      service: "Nova Studio API",
      version: "1.0.0",
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      databases: {
        user: isUserDbOk ? "ok" : "error",
        content: isContentDbOk ? "ok" : "error",
        settings: isSettingsDbOk ? "ok" : "error",
      },
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Protected admin detailed health diagnostics
router.get("/admin/api-health", requireAuth, (req: Request, res: Response) => {
  try {
    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const dbs = dbManager.getDatabaseStats();

    res.json({
      success: true,
      diagnostics: {
        serverTime: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptimeSeconds,
        uptimeFormatted: formatUptime(uptimeSeconds),
        totalRequestsHandled: totalRequests,
        activeWsConnections: wsManager.getConnectedClientCount(),
        memoryUsage: {
          rssMb: (memory.rss / (1024 * 1024)).toFixed(2),
          heapTotalMb: (memory.heapTotal / (1024 * 1024)).toFixed(2),
          heapUsedMb: (memory.heapUsed / (1024 * 1024)).toFixed(2),
          externalMb: (memory.external / (1024 * 1024)).toFixed(2),
        },
        databases: dbs.map((d) => ({
          name: d.name,
          filename: d.filename,
          sizeFormatted: d.sizeFormatted,
          tables: d.tables,
          status: d.status,
          integrityOk: d.integrityOk,
        })),
        endpoints: [
          { method: "GET", path: "/api/health", auth: false, status: "active" },
          { method: "POST", path: "/api/auth/login", auth: false, status: "active" },
          { method: "POST", path: "/api/auth/logout", auth: true, status: "active" },
          { method: "GET", path: "/api/auth/me", auth: true, status: "active" },
          { method: "GET", path: "/api/home", auth: false, status: "active" },
          { method: "GET", path: "/api/admin/home", auth: true, status: "active" },
          { method: "PUT", path: "/api/admin/home", auth: true, status: "active" },
          { method: "POST", path: "/api/admin/home/publish", auth: true, status: "active" },
          { method: "POST", path: "/api/admin/home/reset", auth: true, status: "active" },
          { method: "GET", path: "/api/admin/settings", auth: true, status: "active" },
          { method: "PUT", path: "/api/admin/settings", auth: true, status: "active" },
          { method: "GET", path: "/api/admin/database/status", auth: true, status: "active" },
          { method: "POST", path: "/api/admin/database/backup", auth: true, status: "active" },
          { method: "POST", path: "/api/admin/database/restore", auth: true, status: "active" },
          { method: "GET", path: "/api/admin/activity", auth: true, status: "active" },
          { method: "GET", path: "/api/admin/analytics", auth: true, status: "active" },
          { method: "WS", path: "/ws", auth: false, status: "active" },
        ],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hrs = Math.floor((seconds % (3600 * 24)) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${days}d ${hrs}h ${mins}m ${secs}s`;
}

export default router;

