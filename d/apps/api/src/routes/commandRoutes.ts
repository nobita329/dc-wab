import { Router, Request, Response } from "express";
import { CommandRepository } from "../repositories/commandRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { WebSocketManager } from "../websocket/wsServer.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  CommandItemSchema,
  CommandSettingsSchema,
} from "@nova/shared";

export const commandRoutes = Router();
const commandRepo = new CommandRepository();
const activityRepo = new ActivityRepository();
const wsManager = WebSocketManager.getInstance();

// ==========================================
// 1. PUBLIC ENDPOINTS
// ==========================================

// GET /api/commands
commandRoutes.get("/commands", (_req: Request, res: Response) => {
  try {
    const data = commandRepo.getCommandPageData();
    res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to retrieve commands",
    });
  }
});

// GET /api/commands/:id
commandRoutes.get("/commands/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = commandRepo.getCommandById(id);
    if (!item) {
      return res.status(404).json({ success: false, error: "Command not found" });
    }
    res.json({
      success: true,
      data: item,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to retrieve command",
    });
  }
});

// ==========================================
// 2. ADMIN ENDPOINTS
// ==========================================

// GET /api/admin/commands
commandRoutes.get("/admin/commands", requireAuth, (_req: Request, res: Response) => {
  try {
    const data = commandRepo.getCommandPageData();
    res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to load commands from command.db",
    });
  }
});

// PUT /api/admin/commands/settings
commandRoutes.put("/admin/commands/settings", requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = CommandSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid command settings payload",
        details: parsed.error.issues,
      });
    }

    const username = (req as any).user?.username || "admin";
    const updated = commandRepo.saveSettings(parsed.data, username);

    activityRepo.log(
      "UPDATE_COMMAND_SETTINGS",
      "content",
      `Admin ${username} updated command library settings in command.db`,
      {
        userId: (req as any).user?.id,
        username,
      }
    );

    const fullData = commandRepo.getCommandPageData();
    wsManager.broadcast("command_updated" as any, fullData);

    res.json({
      success: true,
      message: "Command settings saved to command.db",
      data: fullData,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to save command settings",
    });
  }
});

// POST /api/admin/commands (Add or Edit single command)
commandRoutes.post("/admin/commands", requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = CommandItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid command format",
        details: parsed.error.issues,
      });
    }

    const username = (req as any).user?.username || "admin";
    const saved = commandRepo.addOrUpdateCommand(parsed.data, username);

    activityRepo.log(
      "SET_COMMAND",
      "content",
      `Admin ${username} saved command "${saved.title}" (${saved.category}) in command.db`,
      {
        userId: (req as any).user?.id,
        username,
      }
    );

    const fullData = commandRepo.getCommandPageData();
    wsManager.broadcast("command_updated" as any, fullData);

    res.json({
      success: true,
      message: `Command "${saved.title}" saved in command.db`,
      command: saved,
      data: fullData,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to save command to command.db",
    });
  }
});

// DELETE /api/admin/commands/:id
commandRoutes.delete("/admin/commands/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const username = (req as any).user?.username || "admin";
    const success = commandRepo.deleteCommand(id);

    if (!success) {
      return res.status(404).json({ success: false, error: "Command not found" });
    }

    activityRepo.log(
      "DELETE_COMMAND",
      "content",
      `Admin ${username} removed command ${id} from command.db`,
      {
        userId: (req as any).user?.id,
        username,
      }
    );

    const fullData = commandRepo.getCommandPageData();
    wsManager.broadcast("command_updated" as any, fullData);

    res.json({
      success: true,
      message: "Command removed from command.db",
      data: fullData,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to delete command",
    });
  }
});

// POST /api/admin/commands/reorder
commandRoutes.post("/admin/commands/reorder", requireAuth, (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ success: false, error: "Array of command IDs required" });
    }

    commandRepo.reorderCommands(ids);
    const fullData = commandRepo.getCommandPageData();
    wsManager.broadcast("command_updated" as any, fullData);

    res.json({
      success: true,
      message: "Commands reordered successfully",
      data: fullData,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to reorder commands",
    });
  }
});

// POST /api/admin/commands/import-html
// Moves / syncs all 192 commands from index (2).html into command.db
commandRoutes.post("/admin/commands/import-html", requireAuth, (_req: Request, res: Response) => {
  try {
    const username = (_req as any).user?.username || "admin";
    const count = commandRepo.seedFromHtmlOrSeedFile();

    activityRepo.log(
      "IMPORT_COMMANDS_FROM_HTML",
      "content",
      `Admin ${username} imported ${count} commands from index (2).html into command.db`,
      {
        userId: (_req as any).user?.id,
        username,
      }
    );

    const fullData = commandRepo.getCommandPageData();
    wsManager.broadcast("command_updated" as any, fullData);

    res.json({
      success: true,
      message: `Successfully imported ${count} commands from index (2).html into command.db!`,
      count,
      data: fullData,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to import commands from index (2).html",
    });
  }
});

