import crypto from "node:crypto";
import { DatabaseManager } from "../database/connection.js";
import {
  BotSettings,
  DEFAULT_BOT_SETTINGS,
  COMPONENTS_V2_PRESET_TEMPLATES,
  ComponentsV2Template,
  GuildConfig,
  PublishedBotMessage,
  BotInteractionLog,
  BotSlashCommand,
  BotDashboardSummary,
} from "@nova/shared";

export class BotRepository {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.ensureInitialized();
  }

  private getDb() {
    return this.dbManager.getConnection("bot");
  }

  private ensureInitialized() {
    const db = this.getDb();

    db.exec(`
      CREATE TABLE IF NOT EXISTS bot_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS guild_configs (
        guild_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon_url TEXT,
        default_channel_id TEXT,
        log_channel_id TEXT,
        welcome_channel_id TEXT,
        welcome_message TEXT,
        welcome_template_id TEXT,
        allowed_roles TEXT DEFAULT '[]',
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS components_v2_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        is_preset INTEGER NOT NULL DEFAULT 0,
        payload_json TEXT NOT NULL,
        tags TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bot_published_messages (
        id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        guild_name TEXT,
        channel_id TEXT NOT NULL,
        channel_name TEXT,
        message_id TEXT NOT NULL,
        template_id TEXT,
        template_name TEXT,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        published_by TEXT NOT NULL,
        published_at TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS bot_interaction_logs (
        id TEXT PRIMARY KEY,
        interaction_id TEXT NOT NULL,
        type TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        avatar_url TEXT,
        guild_id TEXT,
        guild_name TEXT,
        channel_id TEXT,
        channel_name TEXT,
        custom_id TEXT,
        selected_values TEXT,
        modal_inputs TEXT,
        command_name TEXT,
        status TEXT NOT NULL,
        latency_ms INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bot_slash_commands (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        options TEXT DEFAULT '[]',
        default_member_permissions TEXT,
        template_id_to_trigger TEXT,
        updated_at TEXT NOT NULL
      );
    `);

    // Seed default settings
    const settingsRow = db.prepare("SELECT value FROM bot_settings WHERE key = 'main'").get();
    if (!settingsRow) {
      db.prepare(`
        INSERT INTO bot_settings (key, value, updated_at, updated_by)
        VALUES ('main', ?, ?, 'system')
      `).run(JSON.stringify(DEFAULT_BOT_SETTINGS), new Date().toISOString());
    }

    // Seed preset templates
    const tplCount = (db.prepare("SELECT COUNT(*) as count FROM components_v2_templates").get() as { count: number })?.count ?? 0;
    if (tplCount === 0) {
      const insertTpl = db.prepare(`
        INSERT INTO components_v2_templates (id, name, description, category, is_preset, payload_json, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
      `);
      for (const tpl of COMPONENTS_V2_PRESET_TEMPLATES) {
        insertTpl.run(
          tpl.id,
          tpl.name,
          tpl.description,
          tpl.category,
          JSON.stringify(tpl.payload),
          JSON.stringify(tpl.tags || []),
          tpl.createdAt,
          tpl.updatedAt
        );
      }
    }

    // Seed default guild config
    const guildCount = (db.prepare("SELECT COUNT(*) as count FROM guild_configs").get() as { count: number })?.count ?? 0;
    if (guildCount === 0) {
      db.prepare(`
        INSERT INTO guild_configs (guild_id, name, icon_url, default_channel_id, log_channel_id, welcome_channel_id, welcome_message, welcome_template_id, allowed_roles, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "1540761150797389915",
        "Nova Studio Official",
        "https://cdn.discordapp.com/icons/1540761150797389915/a_sample.png",
        "1558058866883821674",
        "1558058854523215985",
        "1558058866883821674",
        "Welcome to Nova Studio! Check out our Components V2 message below.",
        "tpl-welcome-verify",
        JSON.stringify(["1540761150797389916"]),
        new Date().toISOString()
      );
    }

    // Seed default slash commands
    const cmdCount = (db.prepare("SELECT COUNT(*) as count FROM bot_slash_commands").get() as { count: number })?.count ?? 0;
    if (cmdCount === 0) {
      const insertCmd = db.prepare(`
        INSERT INTO bot_slash_commands (id, name, description, category, enabled, options, default_member_permissions, template_id_to_trigger, updated_at)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
      `);
      const defaultCommands = [
        {
          id: "cmd-1",
          name: "verify",
          description: "Display the server verification gate & agreement modal",
          category: "Security",
          options: [],
          defaultMemberPermissions: "8",
          templateIdToTrigger: "tpl-welcome-verify",
        },
        {
          id: "cmd-2",
          name: "status",
          description: "Display real-time cluster health and service metrics",
          category: "System",
          options: [],
          defaultMemberPermissions: null,
          templateIdToTrigger: "tpl-server-status",
        },
        {
          id: "cmd-3",
          name: "roles",
          description: "Open the interactive tech stack & notification role selector",
          category: "Community",
          options: [],
          defaultMemberPermissions: "268435456",
          templateIdToTrigger: "tpl-role-selector",
        },
        {
          id: "cmd-4",
          name: "announce",
          description: "Broadcast a Components V2 release announcement to a channel",
          category: "Moderation",
          options: [
            { name: "channel", description: "Target announcement channel", type: 7, required: true },
            { name: "template", description: "Components V2 template ID", type: 3, required: false },
          ],
          defaultMemberPermissions: "8",
          templateIdToTrigger: "tpl-product-showcase",
        },
      ];

      for (const cmd of defaultCommands) {
        insertCmd.run(
          cmd.id,
          cmd.name,
          cmd.description,
          cmd.category,
          JSON.stringify(cmd.options),
          cmd.defaultMemberPermissions,
          cmd.templateIdToTrigger,
          new Date().toISOString()
        );
      }
    }
  }

  // ==========================================
  // Bot Settings
  // ==========================================
  public getSettings(): BotSettings {
    const row = this.getDb().prepare("SELECT value FROM bot_settings WHERE key = 'main'").get() as { value: string } | undefined;
    if (!row) {
      return DEFAULT_BOT_SETTINGS;
    }
    try {
      const parsed = JSON.parse(row.value) as BotSettings;
      // Merge with default to guarantee all keys exist
      return {
        branding: { ...DEFAULT_BOT_SETTINGS.branding, ...parsed.branding },
        server: { ...DEFAULT_BOT_SETTINGS.server, ...parsed.server },
        seo: { ...DEFAULT_BOT_SETTINGS.seo, ...parsed.seo },
        features: { ...DEFAULT_BOT_SETTINGS.features, ...parsed.features },
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        updatedBy: parsed.updatedBy || "system",
      };
    } catch {
      return DEFAULT_BOT_SETTINGS;
    }
  }

  public updateSettings(partial: Partial<BotSettings>, updatedBy: string = "admin"): BotSettings {
    const current = this.getSettings();
    const merged: BotSettings = {
      branding: partial.branding ? { ...current.branding, ...partial.branding } : current.branding,
      server: partial.server ? { ...current.server, ...partial.server } : current.server,
      seo: partial.seo ? { ...current.seo, ...partial.seo } : current.seo,
      features: partial.features ? { ...current.features, ...partial.features } : current.features,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };

    this.getDb().prepare(`
      INSERT INTO bot_settings (key, value, updated_at, updated_by)
      VALUES ('main', ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `).run(JSON.stringify(merged), merged.updatedAt, merged.updatedBy);

    return merged;
  }

  public resetSettings(updatedBy: string = "admin"): BotSettings {
    const reset = {
      ...DEFAULT_BOT_SETTINGS,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    this.getDb().prepare(`
      UPDATE bot_settings SET value = ?, updated_at = ?, updated_by = ? WHERE key = 'main'
    `).run(JSON.stringify(reset), reset.updatedAt, reset.updatedBy);
    return reset;
  }

  // ==========================================
  // Guild Configurations
  // ==========================================
  public getGuildConfigs(): GuildConfig[] {
    const rows = this.getDb().prepare("SELECT * FROM guild_configs ORDER BY updated_at DESC").all() as any[];
    return rows.map((r) => ({
      guildId: r.guild_id,
      name: r.name,
      iconUrl: r.icon_url,
      defaultChannelId: r.default_channel_id,
      logChannelId: r.log_channel_id,
      welcomeChannelId: r.welcome_channel_id,
      welcomeMessage: r.welcome_message,
      welcomeTemplateId: r.welcome_template_id,
      allowedRoles: r.allowed_roles ? JSON.parse(r.allowed_roles) : [],
      updatedAt: r.updated_at,
    }));
  }

  public getGuildConfig(guildId: string): GuildConfig | null {
    const r = this.getDb().prepare("SELECT * FROM guild_configs WHERE guild_id = ?").get(guildId) as any;
    if (!r) return null;
    return {
      guildId: r.guild_id,
      name: r.name,
      iconUrl: r.icon_url,
      defaultChannelId: r.default_channel_id,
      logChannelId: r.log_channel_id,
      welcomeChannelId: r.welcome_channel_id,
      welcomeMessage: r.welcome_message,
      welcomeTemplateId: r.welcome_template_id,
      allowedRoles: r.allowed_roles ? JSON.parse(r.allowed_roles) : [],
      updatedAt: r.updated_at,
    };
  }

  public upsertGuildConfig(config: Partial<GuildConfig> & { guildId: string; name: string }): GuildConfig {
    const existing = this.getGuildConfig(config.guildId);
    const updated: GuildConfig = {
      guildId: config.guildId,
      name: config.name || existing?.name || "Discord Guild",
      iconUrl: config.iconUrl !== undefined ? config.iconUrl : existing?.iconUrl,
      defaultChannelId: config.defaultChannelId !== undefined ? config.defaultChannelId : existing?.defaultChannelId,
      logChannelId: config.logChannelId !== undefined ? config.logChannelId : existing?.logChannelId,
      welcomeChannelId: config.welcomeChannelId !== undefined ? config.welcomeChannelId : existing?.welcomeChannelId,
      welcomeMessage: config.welcomeMessage !== undefined ? config.welcomeMessage : existing?.welcomeMessage,
      welcomeTemplateId: config.welcomeTemplateId !== undefined ? config.welcomeTemplateId : existing?.welcomeTemplateId,
      allowedRoles: config.allowedRoles !== undefined ? config.allowedRoles : existing?.allowedRoles || [],
      updatedAt: new Date().toISOString(),
    };

    this.getDb().prepare(`
      INSERT INTO guild_configs (guild_id, name, icon_url, default_channel_id, log_channel_id, welcome_channel_id, welcome_message, welcome_template_id, allowed_roles, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET
        name = excluded.name,
        icon_url = excluded.icon_url,
        default_channel_id = excluded.default_channel_id,
        log_channel_id = excluded.log_channel_id,
        welcome_channel_id = excluded.welcome_channel_id,
        welcome_message = excluded.welcome_message,
        welcome_template_id = excluded.welcome_template_id,
        allowed_roles = excluded.allowed_roles,
        updated_at = excluded.updated_at
    `).run(
      updated.guildId,
      updated.name,
      updated.iconUrl || null,
      updated.defaultChannelId || null,
      updated.logChannelId || null,
      updated.welcomeChannelId || null,
      updated.welcomeMessage || null,
      updated.welcomeTemplateId || null,
      JSON.stringify(updated.allowedRoles || []),
      updated.updatedAt
    );

    return updated;
  }

  // ==========================================
  // Components V2 Templates
  // ==========================================
  public getTemplates(category?: string): ComponentsV2Template[] {
    let rows: any[];
    if (category && category !== "all") {
      rows = this.getDb().prepare("SELECT * FROM components_v2_templates WHERE category = ? ORDER BY is_preset DESC, updated_at DESC").all(category);
    } else {
      rows = this.getDb().prepare("SELECT * FROM components_v2_templates ORDER BY is_preset DESC, updated_at DESC").all();
    }

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
      isPreset: Boolean(r.is_preset),
      payload: JSON.parse(r.payload_json),
      tags: r.tags ? JSON.parse(r.tags) : [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public getTemplateById(id: string): ComponentsV2Template | null {
    const r = this.getDb().prepare("SELECT * FROM components_v2_templates WHERE id = ?").get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
      isPreset: Boolean(r.is_preset),
      payload: JSON.parse(r.payload_json),
      tags: r.tags ? JSON.parse(r.tags) : [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  public createTemplate(data: {
    name: string;
    description: string;
    category: ComponentsV2Template["category"];
    payload: any;
    tags?: string[];
  }): ComponentsV2Template {
    const id = `tpl-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const now = new Date().toISOString();
    const newTpl: ComponentsV2Template = {
      id,
      name: data.name,
      description: data.description || "",
      category: data.category || "custom",
      isPreset: false,
      payload: data.payload,
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    this.getDb().prepare(`
      INSERT INTO components_v2_templates (id, name, description, category, is_preset, payload_json, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)
    `).run(
      newTpl.id,
      newTpl.name,
      newTpl.description,
      newTpl.category,
      JSON.stringify(newTpl.payload),
      JSON.stringify(newTpl.tags),
      newTpl.createdAt,
      newTpl.updatedAt
    );

    return newTpl;
  }

  public updateTemplate(id: string, updates: Partial<ComponentsV2Template>): ComponentsV2Template | null {
    const existing = this.getTemplateById(id);
    if (!existing) return null;

    const merged: ComponentsV2Template = {
      ...existing,
      ...updates,
      id: existing.id, // Immutable
      isPreset: existing.isPreset, // Preserve preset flag
      updatedAt: new Date().toISOString(),
    };

    this.getDb().prepare(`
      UPDATE components_v2_templates SET
        name = ?,
        description = ?,
        category = ?,
        payload_json = ?,
        tags = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      merged.name,
      merged.description,
      merged.category,
      JSON.stringify(merged.payload),
      JSON.stringify(merged.tags || []),
      merged.updatedAt,
      id
    );

    return merged;
  }

  public deleteTemplate(id: string): boolean {
    const tpl = this.getTemplateById(id);
    if (!tpl || tpl.isPreset) return false;
    this.getDb().prepare("DELETE FROM components_v2_templates WHERE id = ?").run(id);
    return true;
  }

  public duplicateTemplate(id: string): ComponentsV2Template | null {
    const orig = this.getTemplateById(id);
    if (!orig) return null;

    return this.createTemplate({
      name: `${orig.name} (Copy)`,
      description: orig.description,
      category: orig.category,
      payload: orig.payload,
      tags: orig.tags,
    });
  }

  // ==========================================
  // Published Messages
  // ==========================================
  public getPublishedMessages(limit: number = 50): PublishedBotMessage[] {
    const rows = this.getDb().prepare(`
      SELECT * FROM bot_published_messages ORDER BY published_at DESC LIMIT ?
    `).all(limit) as any[];

    return rows.map((r) => ({
      id: r.id,
      guildId: r.guild_id,
      guildName: r.guild_name,
      channelId: r.channel_id,
      channelName: r.channel_name,
      messageId: r.message_id,
      templateId: r.template_id,
      templateName: r.template_name,
      payload: JSON.parse(r.payload_json),
      status: r.status,
      error: r.error,
      publishedBy: r.published_by,
      publishedAt: r.published_at,
      updatedAt: r.updated_at,
    }));
  }

  public recordPublishedMessage(msg: Omit<PublishedBotMessage, "id">): PublishedBotMessage {
    const id = `pub-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const entry: PublishedBotMessage = {
      id,
      ...msg,
    };

    this.getDb().prepare(`
      INSERT INTO bot_published_messages (id, guild_id, guild_name, channel_id, channel_name, message_id, template_id, template_name, payload_json, status, error, published_by, published_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.guildId,
      entry.guildName || null,
      entry.channelId,
      entry.channelName || null,
      entry.messageId,
      entry.templateId || null,
      entry.templateName || null,
      JSON.stringify(entry.payload),
      entry.status,
      entry.error || null,
      entry.publishedBy,
      entry.publishedAt,
      entry.updatedAt || null
    );

    return entry;
  }

  public updatePublishedMessageStatus(id: string, status: PublishedBotMessage["status"], error?: string): void {
    this.getDb().prepare(`
      UPDATE bot_published_messages SET status = ?, error = ?, updated_at = ? WHERE id = ?
    `).run(status, error || null, new Date().toISOString(), id);
  }

  public deletePublishedMessage(id: string): boolean {
    const res = this.getDb().prepare("DELETE FROM bot_published_messages WHERE id = ?").run(id);
    return res.changes > 0;
  }

  // ==========================================
  // Interaction Logs
  // ==========================================
  public getInteractionLogs(limit: number = 100, filter?: { type?: string; query?: string }): BotInteractionLog[] {
    let query = "SELECT * FROM bot_interaction_logs";
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter?.type && filter.type !== "all") {
      conditions.push("type = ?");
      params.push(filter.type);
    }
    if (filter?.query) {
      conditions.push("(username LIKE ? OR custom_id LIKE ? OR command_name LIKE ?)");
      params.push(`%${filter.query}%`, `%${filter.query}%`, `%${filter.query}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const rows = this.getDb().prepare(query).all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      interactionId: r.interaction_id,
      type: r.type,
      userId: r.user_id,
      username: r.username,
      avatarUrl: r.avatar_url,
      guildId: r.guild_id,
      guildName: r.guild_name,
      channelId: r.channel_id,
      channelName: r.channel_name,
      customId: r.custom_id,
      selectedValues: r.selected_values ? JSON.parse(r.selected_values) : undefined,
      modalInputs: r.modal_inputs ? JSON.parse(r.modal_inputs) : undefined,
      commandName: r.command_name,
      status: r.status,
      latencyMs: r.latency_ms,
      createdAt: r.created_at,
    }));
  }

  public recordInteraction(data: Omit<BotInteractionLog, "id" | "createdAt">): BotInteractionLog {
    const id = `int-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const now = new Date().toISOString();
    const entry: BotInteractionLog = {
      id,
      ...data,
      createdAt: now,
    };

    this.getDb().prepare(`
      INSERT INTO bot_interaction_logs (id, interaction_id, type, user_id, username, avatar_url, guild_id, guild_name, channel_id, channel_name, custom_id, selected_values, modal_inputs, command_name, status, latency_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.interactionId,
      entry.type,
      entry.userId,
      entry.username,
      entry.avatarUrl || null,
      entry.guildId || null,
      entry.guildName || null,
      entry.channelId || null,
      entry.channelName || null,
      entry.customId || null,
      entry.selectedValues ? JSON.stringify(entry.selectedValues) : null,
      entry.modalInputs ? JSON.stringify(entry.modalInputs) : null,
      entry.commandName || null,
      entry.status,
      entry.latencyMs,
      entry.createdAt
    );

    return entry;
  }

  public clearInteractionLogs(): void {
    this.getDb().prepare("DELETE FROM bot_interaction_logs").run();
  }

  // ==========================================
  // Slash Commands
  // ==========================================
  public getSlashCommands(): BotSlashCommand[] {
    const rows = this.getDb().prepare("SELECT * FROM bot_slash_commands ORDER BY name ASC").all() as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
      enabled: Boolean(r.enabled),
      options: r.options ? JSON.parse(r.options) : [],
      defaultMemberPermissions: r.default_member_permissions,
      templateIdToTrigger: r.template_id_to_trigger,
      updatedAt: r.updated_at,
    }));
  }

  public upsertSlashCommand(cmd: Omit<BotSlashCommand, "updatedAt">): BotSlashCommand {
    const id = cmd.id || `cmd-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
    const now = new Date().toISOString();
    const item: BotSlashCommand = {
      ...cmd,
      id,
      updatedAt: now,
    };

    this.getDb().prepare(`
      INSERT INTO bot_slash_commands (id, name, description, category, enabled, options, default_member_permissions, template_id_to_trigger, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        description = excluded.description,
        category = excluded.category,
        enabled = excluded.enabled,
        options = excluded.options,
        default_member_permissions = excluded.default_member_permissions,
        template_id_to_trigger = excluded.template_id_to_trigger,
        updated_at = excluded.updated_at
    `).run(
      item.id,
      item.name,
      item.description,
      item.category,
      item.enabled ? 1 : 0,
      JSON.stringify(item.options || []),
      item.defaultMemberPermissions || null,
      item.templateIdToTrigger || null,
      item.updatedAt
    );

    return item;
  }

  public deleteSlashCommand(id: string): boolean {
    const res = this.getDb().prepare("DELETE FROM bot_slash_commands WHERE id = ?").run(id);
    return res.changes > 0;
  }

  // ==========================================
  // Dashboard Summary
  // ==========================================
  public getDashboardSummary(botConnected: boolean = false, botUser: any = null): BotDashboardSummary {
    const db = this.getDb();
    const settings = this.getSettings();

    const tplCount = (db.prepare("SELECT COUNT(*) as count FROM components_v2_templates").get() as { count: number })?.count ?? 0;
    const pubCount = (db.prepare("SELECT COUNT(*) as count FROM bot_published_messages WHERE status = 'sent'").get() as { count: number })?.count ?? 0;
    const intCount = (db.prepare("SELECT COUNT(*) as count FROM bot_interaction_logs").get() as { count: number })?.count ?? 0;
    const guildCount = (db.prepare("SELECT COUNT(*) as count FROM guild_configs").get() as { count: number })?.count ?? 0;

    const recentPublished = this.getPublishedMessages(5);
    const recentInteractions = this.getInteractionLogs(6);

    return {
      botConnected,
      botUser,
      guildsCount: Math.max(guildCount, 1),
      totalMembers: 248,
      templatesCount: tplCount,
      publishedMessagesCount: pubCount,
      recentInteractionsCount: intCount,
      botStatus: settings.branding.status,
      activity: `${settings.branding.activityType} ${settings.branding.activityText}`,
      latencyMs: botConnected ? 28 : 0,
      recentPublished,
      recentInteractions,
    };
  }
}
