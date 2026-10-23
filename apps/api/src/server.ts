import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { runMigrations } from "./database/migrations.js";
import { runSeeds } from "./database/seeds.js";
import { DatabaseManager } from "./database/connection.js";
import { WebSocketManager } from "./websocket/wsServer.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import homeRoutes from "./routes/homeRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import databaseRoutes from "./routes/databaseRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import discordRoutes from "./routes/discordRoutes.js";
import { teamRoutes } from "./routes/teamRoutes.js";
import { tutorialRoutes } from "./routes/tutorialRoutes.js";
import { commandRoutes } from "./routes/commandRoutes.js";
import { wallpaperRoutes } from "./routes/wallpaperRoutes.js";
import botRoutes from "./routes/botRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any requesting origin (localhost, 127.0.0.1, Codespaces, custom domain) with credentials
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static uploads directory serving
const uploadsDir = path.join(DatabaseManager.getInstance().getDataDir(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));
app.use("/api/uploads", express.static(uploadsDir));

// Rate limiter (300 requests per minute)
app.use(rateLimiter({ windowMs: 60 * 1000, max: 300 }));

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api", homeRoutes);
app.use("/api", settingsRoutes);
app.use("/api", databaseRoutes);
app.use("/api", activityRoutes);
app.use("/api", healthRoutes);
app.use("/api", discordRoutes);
app.use("/api", teamRoutes);
app.use("/api", tutorialRoutes);
app.use("/api", commandRoutes);
app.use("/api", wallpaperRoutes);
app.use("/api", botRoutes);

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Central Error Handler
app.use(errorHandler);

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wsManager = WebSocketManager.getInstance();
wsManager.init(server);

// Boot function
async function startServer() {
  try {
    console.log("[Nova API] Running database migrations...");
    runMigrations();

    console.log("[Nova API] Checking database seeds...");
    await runSeeds();

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Nova Studio API Server listening on port ${PORT}`);
      console.log(`📡 WebSocket endpoint ready at ws://localhost:${PORT}/ws`);
      console.log(`🔒 Admin authentication ready (default: admin / admin)`);
      console.log(`📁 Database directory: ${DatabaseManager.getInstance().getDataDir()}`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error("[Nova API] Startup error:", err);
    process.exit(1);
  }
}

// Graceful shutdown handling
function shutdown(signal: string) {
  console.log(`\n[Nova API] Received ${signal}. Initiating graceful shutdown...`);

  server.close(() => {
    console.log("[Nova API] HTTP and WebSocket server closed.");
    try {
      DatabaseManager.getInstance().closeAll();
      console.log("[Nova API] Database connections closed safely.");
    } catch (err) {
      console.error("[Nova API] Error during database cleanup:", err);
    }
    process.exit(0);
  });

  // Force exit after 5 seconds if graceful close hangs
  setTimeout(() => {
    console.error("[Nova API] Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();

