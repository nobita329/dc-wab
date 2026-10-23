import { Router, Request, Response } from "express";
import { BotRepository } from "../repositories/botRepository.js";
import { DiscordBotService } from "../services/discordBotService.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { WebSocketManager } from "../websocket/wsServer.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { DiscordMessagePayload } from "@nova/shared";

const router = Router();
const botRepo = new BotRepository();
const botService = DiscordBotService.getInstance();
const activityRepo = new ActivityRepository();
const wsManager = WebSocketManager.getInstance();

const requireAdmin = requireRole(["admin"]);

// ==========================================
// Dashboard
// ==========================================
router.get("/bot/dashboard", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const isConfigured = botService.isConfigured();
    const botUser = await botService.getBotUser();
    const summary = botRepo.getDashboardSummary(isConfigured || Boolean(botUser), botUser);

    res.json({
      success: true,
      summary,
      tokenConfigured: isConfigured,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Bot Settings (Branding, Server, SEO, Features)
// ==========================================
router.get("/bot/settings", requireAuth, requireAdmin, (_req: Request, res: Response) => {
  try {
    const settings = botRepo.getSettings();
    const isConfigured = botService.isConfigured();
    res.json({
      success: true,
      settings,
      tokenConfigured: isConfigured,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/bot/settings", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const updatedBy = req.user?.username || "admin";
    const updated = botRepo.updateSettings(req.body, updatedBy);

    activityRepo.log(
      "bot.settings_updated",
      "settings",
      `Bot settings updated by ${updatedBy}`,
      {
        userId: req.user?.id,
        username: updatedBy,
        status: "success",
      }
    );

    wsManager.broadcast("bot_settings_updated", updated);

    res.json({
      success: true,
      settings: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/bot/settings/reset", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const updatedBy = req.user?.username || "admin";
    const reset = botRepo.resetSettings(updatedBy);

    activityRepo.log(
      "bot.settings_reset",
      "settings",
      `Bot settings reset to default by ${updatedBy}`,
      {
        userId: req.user?.id,
        username: updatedBy,
        status: "warning",
      }
    );

    wsManager.broadcast("bot_settings_updated", reset);

    res.json({
      success: true,
      settings: reset,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Guilds & Channels
// ==========================================
router.get("/bot/guilds", requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const guilds = await botService.getGuilds();
    res.json({
      success: true,
      guilds,
      tokenConfigured: botService.isConfigured(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/bot/guilds/:guildId/channels", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    const channels = await botService.getGuildChannels(guildId);
    res.json({
      success: true,
      channels,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/bot/guilds/:guildId/config", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    const config = botRepo.getGuildConfig(guildId);
    res.json({
      success: true,
      config: config || {
        guildId,
        name: "Discord Guild",
        allowedRoles: [],
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/bot/guilds/:guildId/config", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    const updated = botRepo.upsertGuildConfig({
      ...req.body,
      guildId,
    });

    activityRepo.log(
      "bot.guild_config_updated",
      "settings",
      `Guild config updated for ${updated.name} (${guildId})`,
      {
        userId: req.user?.id,
        username: req.user?.username || "admin",
        status: "success",
      }
    );

    res.json({
      success: true,
      config: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Components V2 Templates
// ==========================================
router.get("/bot/templates", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const templates = botRepo.getTemplates(category);
    res.json({
      success: true,
      templates,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/bot/templates/:id", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const template = botRepo.getTemplateById(req.params.id);
    if (!template) {
      res.status(404).json({ success: false, error: "Template not found" });
      return;
    }
    res.json({
      success: true,
      template,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/bot/templates", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const { name, description, category, payload, tags } = req.body;
    if (!name || !payload) {
      res.status(400).json({ success: false, error: "Template name and payload are required" });
      return;
    }

    const created = botRepo.createTemplate({
      name,
      description: description || "",
      category: category || "custom",
      payload,
      tags: tags || [],
    });

    wsManager.broadcast("bot_template_updated", created);

    res.json({
      success: true,
      template: created,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/bot/templates/:id", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const updated = botRepo.updateTemplate(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: "Template not found" });
      return;
    }

    wsManager.broadcast("bot_template_updated", updated);

    res.json({
      success: true,
      template: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/bot/templates/:id", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const deleted = botRepo.deleteTemplate(req.params.id);
    if (!deleted) {
      res.status(400).json({ success: false, error: "Cannot delete preset templates or template not found" });
      return;
    }

    res.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/bot/templates/:id/duplicate", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const duplicated = botRepo.duplicateTemplate(req.params.id);
    if (!duplicated) {
      res.status(404).json({ success: false, error: "Template not found" });
      return;
    }

    res.json({
      success: true,
      template: duplicated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Validation & Publishing
// ==========================================
router.post("/bot/validate", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const payload = req.body as DiscordMessagePayload;
    const result = botService.validateComponentsV2Payload(payload);
    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/bot/publish", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { guildId, channelId, payload, templateId, templateName } = req.body;
    if (!guildId || !channelId || !payload) {
      res.status(400).json({ success: false, error: "guildId, channelId, and payload are required" });
      return;
    }

    const publishedBy = req.user?.username || "admin";
    const result = await botService.publishComponentsV2Message(
      guildId,
      channelId,
      payload,
      publishedBy,
      templateId,
      templateName
    );

    if (result.success) {
      activityRepo.log(
        "bot.message_published",
        "content",
        `Published Components V2 message ${result.messageId} to channel ${channelId}`,
        {
          userId: req.user?.id,
          username: publishedBy,
          status: "success",
        }
      );

      wsManager.broadcast("bot_message_published", result.data);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/bot/published", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const messages = botRepo.getPublishedMessages(limit);
    res.json({
      success: true,
      messages,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/bot/published/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const messages = botRepo.getPublishedMessages(100);
    const target = messages.find((m) => m.id === id);

    if (target) {
      await botService.deleteMessage(target.channelId, target.messageId);
      botRepo.updatePublishedMessageStatus(id, "deleted");
    }

    res.json({
      success: true,
      message: "Message marked as deleted",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Interaction Logs & Simulation
// ==========================================
router.get("/bot/logs", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const type = req.query.type as string | undefined;
    const query = req.query.query as string | undefined;

    const logs = botRepo.getInteractionLogs(limit, { type, query });
    res.json({
      success: true,
      logs,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/bot/logs", requireAuth, requireAdmin, (_req: Request, res: Response) => {
  try {
    botRepo.clearInteractionLogs();
    res.json({
      success: true,
      message: "Interaction logs cleared",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/bot/test-interaction", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const { type, customId, selectedValues, modalInputs, commandName } = req.body;

    const log = botRepo.recordInteraction({
      interactionId: `test-int-${Date.now()}`,
      type: type || "button_click",
      userId: req.user?.id || "admin_user",
      username: req.user?.username || "admin",
      avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
      guildId: "1540761150797389915",
      guildName: "Nova Studio Official",
      channelId: "1558058866883821674",
      channelName: "📢・announcements",
      customId: customId || "btn_test",
      selectedValues,
      modalInputs,
      commandName,
      status: "success",
      latencyMs: Math.floor(Math.random() * 30 + 15),
    });

    wsManager.broadcast("bot_interaction_received", log);

    res.json({
      success: true,
      message: "Test interaction processed and logged",
      log,
      response: {
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: {
          content: `✅ Interaction handled successfully for \`${customId || commandName || "component"}\``,
          flags: 64, // EPHEMERAL
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Slash Commands
// ==========================================
router.get("/bot/commands", requireAuth, requireAdmin, (_req: Request, res: Response) => {
  try {
    const commands = botRepo.getSlashCommands();
    res.json({
      success: true,
      commands,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/bot/commands", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const command = botRepo.upsertSlashCommand(req.body);
    res.json({
      success: true,
      command,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/bot/commands/:id", requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const deleted = botRepo.deleteSlashCommand(req.params.id);
    res.json({
      success: deleted,
      message: deleted ? "Command deleted" : "Command not found",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Public/Discord Interactions Webhook Endpoint
// ==========================================
router.post("/bot/interactions", (req: Request, res: Response) => {
  const interaction = req.body;
  if (!interaction) {
    res.status(400).send("Bad Request");
    return;
  }

  // Handle Discord Ping (type 1)
  if (interaction.type === 1) {
    res.json({ type: 1 });
    return;
  }

  // Handle Component interaction (type 3)
  if (interaction.type === 3) {
    const customId = interaction.data?.custom_id;
    const userId = interaction.member?.user?.id || interaction.user?.id || "unknown";
    const username = interaction.member?.user?.username || interaction.user?.username || "unknown";

    botRepo.recordInteraction({
      interactionId: interaction.id || `int-${Date.now()}`,
      type: interaction.data?.component_type === 3 ? "select_option" : "button_click",
      userId,
      username,
      guildId: interaction.guild_id,
      channelId: interaction.channel_id,
      customId,
      selectedValues: interaction.data?.values,
      status: "success",
      latencyMs: 24,
    });

    // Acknowledge interaction (type 6: DEFERRED_UPDATE_MESSAGE or type 4)
    res.json({
      type: 4,
      data: {
        content: `✨ Acknowledged interaction: \`${customId}\``,
        flags: 64, // EPHEMERAL
      },
    });
    return;
  }

  // Handle Modal submit (type 5)
  if (interaction.type === 5) {
    res.json({
      type: 4,
      data: {
        content: "📝 Modal submitted successfully!",
        flags: 64,
      },
    });
    return;
  }

  // Default response
  res.json({ type: 1 });
});

export default router;
