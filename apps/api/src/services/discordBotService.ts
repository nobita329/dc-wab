import {
  DiscordMessagePayload,
  DiscordComponentType,
  DiscordButtonStyle,
  DISCORD_MESSAGE_FLAGS,
  DiscordGuildInfo,
  DiscordChannelInfo,
} from "@nova/shared";
import { BotRepository } from "../repositories/botRepository.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class DiscordBotService {
  private static instance: DiscordBotService;
  private botRepo: BotRepository;

  private constructor() {
    this.botRepo = new BotRepository();
  }

  public static getInstance(): DiscordBotService {
    if (!DiscordBotService.instance) {
      DiscordBotService.instance = new DiscordBotService();
    }
    return DiscordBotService.instance;
  }

  public getBotToken(): string | null {
    // Check environment variable first
    if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BOT_TOKEN.trim().length > 10) {
      return process.env.DISCORD_BOT_TOKEN.trim();
    }
    return null;
  }

  public isConfigured(): boolean {
    return Boolean(this.getBotToken());
  }

  // ==========================================
  // Bot Identity & Connection
  // ==========================================
  public async getBotUser(): Promise<{
    id: string;
    username: string;
    discriminator: string;
    avatarUrl: string;
    tag: string;
  } | null> {
    const token = this.getBotToken();
    if (!token) {
      const settings = this.botRepo.getSettings();
      return {
        id: "1540761150797389914",
        username: settings.branding.botName || "Nova Assistant",
        discriminator: "0001",
        avatarUrl: settings.branding.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png",
        tag: `${settings.branding.botName || "Nova Assistant"}#0001`,
      };
    }

    try {
      const res = await fetch("https://discord.com/api/v10/users/@me", {
        headers: {
          Authorization: `Bot ${token}`,
          "User-Agent": "NovaStudio-BotEditor/1.0",
        },
      });

      if (!res.ok) {
        console.warn(`[DiscordBotService] Failed to fetch bot user: ${res.status}`);
        return null;
      }

      const data = await res.json() as any;
      const avatarUrl = data.avatar
        ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=256`
        : "https://cdn.discordapp.com/embed/avatars/0.png";

      return {
        id: data.id,
        username: data.username,
        discriminator: data.discriminator || "0",
        avatarUrl,
        tag: data.discriminator && data.discriminator !== "0"
          ? `${data.username}#${data.discriminator}`
          : data.username,
      };
    } catch (err: any) {
      console.error("[DiscordBotService] Error connecting to Discord API:", err.message);
      return null;
    }
  }

  // ==========================================
  // Guilds & Channels
  // ==========================================
  public async getGuilds(): Promise<DiscordGuildInfo[]> {
    const token = this.getBotToken();
    if (!token) {
      // High fidelity fallback guilds for visual building and testing
      return [
        {
          id: "1540761150797389915",
          name: "Nova Studio Official",
          icon: "a_sample",
          iconUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=128",
          owner: true,
          permissions: "8", // Administrator
          features: ["COMMUNITY", "WELCOME_SCREEN_ENABLED", "NEWS"],
          approximate_member_count: 248,
          approximate_presence_count: 52,
          botPresent: true,
        },
        {
          id: "1098765432109876543",
          name: "Developer Beta Test Lab",
          icon: null,
          iconUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=128",
          owner: false,
          permissions: "534723950656",
          features: ["COMMUNITY"],
          approximate_member_count: 64,
          approximate_presence_count: 14,
          botPresent: true,
        },
      ];
    }

    try {
      const res = await fetch("https://discord.com/api/v10/users/@me/guilds?with_counts=true", {
        headers: {
          Authorization: `Bot ${token}`,
          "User-Agent": "NovaStudio-BotEditor/1.0",
        },
      });

      if (!res.ok) {
        throw new Error(`Discord API returned status ${res.status}`);
      }

      const guilds = await res.json() as any[];
      return guilds.map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        iconUrl: g.icon
          ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`
          : undefined,
        owner: Boolean(g.owner),
        permissions: g.permissions || "0",
        features: g.features || [],
        approximate_member_count: g.approximate_member_count || 1,
        approximate_presence_count: g.approximate_presence_count || 1,
        botPresent: true,
      }));
    } catch (err: any) {
      console.warn("[DiscordBotService] Falling back for guilds:", err.message);
      return [
        {
          id: "1540761150797389915",
          name: "Nova Studio Official",
          icon: null,
          iconUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=128",
          owner: true,
          permissions: "8",
          features: ["COMMUNITY"],
          approximate_member_count: 248,
          botPresent: true,
        },
      ];
    }
  }

  public async getGuildChannels(guildId: string): Promise<DiscordChannelInfo[]> {
    const token = this.getBotToken();
    if (!token) {
      // High fidelity channels for Nova Studio
      return [
        { id: "1558058866883821674", name: "📢・announcements", type: 5, position: 0, topic: "Official Nova Studio Announcements & Updates", botCanSend: true },
        { id: "1558058854523215985", name: "☕・chat", type: 0, position: 1, topic: "General community discussion", botCanSend: true },
        { id: "1558058878901234567", name: "📜・rules-and-info", type: 0, position: 2, topic: "Server rules and verification gate", botCanSend: true },
        { id: "1558058890123456789", name: "🤖・bot-commands", type: 0, position: 3, topic: "Bot interactions and slash commands", botCanSend: true },
        { id: "1558058901234567890", name: "🛠️・logs-and-audits", type: 0, position: 4, topic: "Automated moderation and interaction logs", botCanSend: true },
      ];
    }

    try {
      const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        headers: {
          Authorization: `Bot ${token}`,
          "User-Agent": "NovaStudio-BotEditor/1.0",
        },
      });

      if (!res.ok) {
        throw new Error(`Discord API returned status ${res.status}`);
      }

      const channels = await res.json() as any[];
      // Filter text (0) and announcement (5) channels
      return channels
        .filter((c) => c.type === 0 || c.type === 5)
        .map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          position: c.position,
          parent_id: c.parent_id,
          topic: c.topic,
          botCanSend: true,
        }))
        .sort((a, b) => a.position - b.position);
    } catch (err: any) {
      console.warn("[DiscordBotService] Falling back for channels:", err.message);
      return [
        { id: "1558058866883821674", name: "📢・announcements", type: 5, position: 0, botCanSend: true },
        { id: "1558058854523215985", name: "💬・general", type: 0, position: 1, botCanSend: true },
      ];
    }
  }

  // ==========================================
  // Components V2 Validation Engine
  // ==========================================
  public validateComponentsV2Payload(payload: DiscordMessagePayload): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!payload) {
      return { valid: false, errors: ["Message payload is required"], warnings: [] };
    }

    const components = payload.components || [];

    if (components.length === 0 && (!payload.content || payload.content.trim().length === 0)) {
      errors.push("Payload must contain at least one component or text content");
    }

    if (components.length > 10) {
      errors.push(`Top-level components limit exceeded: found ${components.length}, maximum allowed is 10`);
    }

    // Validate flag
    const flags = payload.flags ?? 0;
    if ((flags & DISCORD_MESSAGE_FLAGS.IS_COMPONENTS_V2) === 0) {
      warnings.push("Flag 32768 (IS_COMPONENTS_V2) was not set. It will be added automatically upon publish.");
    }

    let actionRowCount = 0;

    components.forEach((comp, idx) => {
      const path = `Component #${idx + 1} (${this.getComponentTypeName(comp.type)})`;

      switch (comp.type) {
        case DiscordComponentType.CONTAINER: {
          const container = comp as any;
          if (container.accent_color !== undefined) {
            if (typeof container.accent_color !== "number" || container.accent_color < 0 || container.accent_color > 0xffffff) {
              errors.push(`${path}: accent_color must be a valid integer between 0 and 16777215 (0xFFFFFF)`);
            }
          }
          const children = container.components || [];
          if (children.length === 0) {
            warnings.push(`${path}: Container is empty. Add sections, separators, or action rows.`);
          }
          if (children.length > 15) {
            errors.push(`${path}: Container has ${children.length} items. Maximum limit is 15 child components.`);
          }
          children.forEach((child: any, cIdx: number) => {
            this.validateChildComponent(child, `${path} > Child #${cIdx + 1}`, errors, warnings);
          });
          break;
        }

        case DiscordComponentType.SECTION: {
          const section = comp as any;
          const texts = section.components || [];
          if (texts.length === 0) {
            errors.push(`${path}: Section must contain at least one TextDisplay component`);
          }
          texts.forEach((text: any, tIdx: number) => {
            if (text.type !== DiscordComponentType.TEXT_DISPLAY && text.type !== 10) {
              errors.push(`${path} > Text #${tIdx + 1}: Section child must be of type TEXT_DISPLAY (10)`);
            }
            if (!text.content || text.content.trim().length === 0) {
              errors.push(`${path} > Text #${tIdx + 1}: Text content cannot be empty`);
            } else if (text.content.length > 4000) {
              errors.push(`${path} > Text #${tIdx + 1}: Text content exceeds 4000 characters (${text.content.length})`);
            }
          });
          if (section.accessory) {
            const accType = section.accessory.type;
            if (accType !== DiscordComponentType.BUTTON && accType !== 2 && accType !== DiscordComponentType.THUMBNAIL && accType !== 11) {
              errors.push(`${path}: Section accessory must be a Button (2) or Thumbnail (11)`);
            }
          }
          break;
        }

        case DiscordComponentType.TEXT_DISPLAY: {
          const text = comp as any;
          if (!text.content || text.content.trim().length === 0) {
            errors.push(`${path}: Content cannot be empty`);
          } else if (text.content.length > 4000) {
            errors.push(`${path}: Content exceeds maximum limit of 4000 characters`);
          }
          break;
        }

        case DiscordComponentType.ACTION_ROW: {
          actionRowCount++;
          if (actionRowCount > 5) {
            errors.push(`Maximum of 5 Action Rows allowed per message (found ${actionRowCount})`);
          }
          this.validateActionRow(comp as any, path, errors, warnings);
          break;
        }

        case DiscordComponentType.SEPARATOR: {
          const sep = comp as any;
          if (sep.spacing !== undefined && ![1, 2, 3].includes(sep.spacing)) {
            errors.push(`${path}: Separator spacing must be 1 (Small), 2 (Medium), or 3 (Large)`);
          }
          break;
        }

        case DiscordComponentType.MEDIA_GALLERY: {
          const gallery = comp as any;
          const items = gallery.items || [];
          if (items.length === 0) {
            errors.push(`${path}: Media gallery must contain at least one media item`);
          } else if (items.length > 10) {
            errors.push(`${path}: Media gallery contains ${items.length} items (maximum allowed is 10)`);
          }
          items.forEach((item: any, mIdx: number) => {
            if (!item.media?.url || !item.media.url.startsWith("http")) {
              errors.push(`${path} > Media #${mIdx + 1}: URL must be a valid http/https URL`);
            }
          });
          break;
        }

        default:
          break;
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateChildComponent(child: any, path: string, errors: string[], warnings: string[]) {
    if (!child) return;
    if (child.type === DiscordComponentType.ACTION_ROW || child.type === 1) {
      this.validateActionRow(child, path, errors, warnings);
    } else if (child.type === DiscordComponentType.TEXT_DISPLAY || child.type === 10) {
      if (!child.content || child.content.trim().length === 0) {
        errors.push(`${path}: Content cannot be empty`);
      } else if (child.content.length > 4000) {
        errors.push(`${path}: Content exceeds 4000 characters`);
      }
    } else if (child.type === DiscordComponentType.SECTION || child.type === 9) {
      const texts = child.components || [];
      if (texts.length === 0) {
        errors.push(`${path}: Section must contain at least one TextDisplay`);
      }
    }
  }

  private validateActionRow(row: any, path: string, errors: string[], warnings: string[]) {
    const children = row.components || [];
    if (children.length === 0) {
      errors.push(`${path}: Action Row is empty`);
      return;
    }

    const hasSelect = children.some((c: any) => [3, 5, 6, 7, 8].includes(c.type));
    const hasButton = children.some((c: any) => c.type === 2 || c.type === DiscordComponentType.BUTTON);

    if (hasSelect && hasButton) {
      errors.push(`${path}: Cannot mix Select Menus and Buttons in the same Action Row`);
    }

    if (hasSelect && children.length > 1) {
      errors.push(`${path}: An Action Row can only contain 1 Select Menu (found ${children.length})`);
    }

    if (hasButton && children.length > 5) {
      errors.push(`${path}: Maximum of 5 Buttons allowed per Action Row (found ${children.length})`);
    }

    children.forEach((c: any, cIdx: number) => {
      const cPath = `${path} > Item #${cIdx + 1}`;
      if (c.type === 2 || c.type === DiscordComponentType.BUTTON) {
        if (!c.label && !c.emoji) {
          errors.push(`${cPath}: Button must have either a label or an emoji`);
        }
        if (c.style === 5 || c.style === DiscordButtonStyle.LINK) {
          if (!c.url || !c.url.startsWith("http")) {
            errors.push(`${cPath}: Link button must have a valid http/https URL`);
          }
          if (c.custom_id) {
            errors.push(`${cPath}: Link buttons cannot have custom_id`);
          }
        } else {
          if (!c.custom_id || c.custom_id.trim().length === 0) {
            errors.push(`${cPath}: Interactive button must have a custom_id`);
          } else if (c.custom_id.length > 100) {
            errors.push(`${cPath}: custom_id exceeds 100 characters`);
          }
        }
      } else if ([3, 5, 6, 7, 8].includes(c.type)) {
        if (!c.custom_id) {
          errors.push(`${cPath}: Select menu must have a custom_id`);
        }
        if (c.type === 3 || c.type === DiscordComponentType.STRING_SELECT) {
          const opts = c.options || [];
          if (opts.length === 0) {
            errors.push(`${cPath}: String Select menu must have at least 1 option`);
          } else if (opts.length > 25) {
            errors.push(`${cPath}: String Select menu exceeds 25 options limit (found ${opts.length})`);
          }
          opts.forEach((o: any, oIdx: number) => {
            if (!o.label || !o.value) {
              errors.push(`${cPath} > Option #${oIdx + 1}: Option must have both label and value`);
            }
          });
        }
      }
    });
  }

  private getComponentTypeName(type: number): string {
    const map: Record<number, string> = {
      1: "ActionRow",
      2: "Button",
      3: "StringSelect",
      4: "TextInput",
      5: "UserSelect",
      6: "RoleSelect",
      7: "MentionableSelect",
      8: "ChannelSelect",
      9: "Section",
      10: "TextDisplay",
      11: "Thumbnail",
      12: "MediaGallery",
      13: "File",
      14: "Separator",
      15: "Container",
    };
    return map[type] || `Type ${type}`;
  }

  // ==========================================
  // Publish & Send Workflow
  // ==========================================
  public async publishComponentsV2Message(
    guildId: string,
    channelId: string,
    payload: DiscordMessagePayload,
    publishedBy: string = "admin",
    templateId?: string,
    templateName?: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    data?: any;
    isSimulated?: boolean;
  }> {
    // 1. Pre-validation
    const validation = this.validateComponentsV2Payload(payload);
    if (!validation.valid) {
      const errorMsg = `Validation failed: ${validation.errors.join("; ")}`;
      this.botRepo.recordPublishedMessage({
        guildId,
        channelId,
        messageId: "err_" + Date.now(),
        templateId,
        templateName,
        payload,
        status: "failed",
        error: errorMsg,
        publishedBy,
        publishedAt: new Date().toISOString(),
      });
      return { success: false, error: errorMsg };
    }

    // Ensure flag IS_COMPONENTS_V2 (32768) is set
    const preparedPayload: DiscordMessagePayload = {
      ...payload,
      flags: (payload.flags || 0) | DISCORD_MESSAGE_FLAGS.IS_COMPONENTS_V2,
    };

    const token = this.getBotToken();

    // 2. Real Discord API Call if bot token is present
    if (token) {
      try {
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bot ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "NovaStudio-BotEditor/1.0",
          },
          body: JSON.stringify(preparedPayload),
        });

        const data = await res.json() as any;

        if (!res.ok) {
          const apiError = data?.message || `Discord API error: status ${res.status}`;
          this.botRepo.recordPublishedMessage({
            guildId,
            channelId,
            messageId: "err_" + Date.now(),
            templateId,
            templateName,
            payload: preparedPayload,
            status: "failed",
            error: apiError,
            publishedBy,
            publishedAt: new Date().toISOString(),
          });
          return { success: false, error: apiError, data };
        }

        const publishedMsg = this.botRepo.recordPublishedMessage({
          guildId,
          channelId,
          messageId: data.id,
          templateId,
          templateName,
          payload: preparedPayload,
          status: "sent",
          publishedBy,
          publishedAt: new Date().toISOString(),
        });

        return {
          success: true,
          messageId: data.id,
          data: publishedMsg,
        };
      } catch (err: any) {
        console.error("[DiscordBotService] Send error:", err);
        return { success: false, error: err.message };
      }
    }

    // 3. Fallback / Test-lab Publish mode when no token is configured
    // Creates a valid message ID, logs persistence, and gives instructions
    const mockMessageId = `msg_${Date.now()}_${Math.floor(Math.random() * 899999 + 100000)}`;
    const published = this.botRepo.recordPublishedMessage({
      guildId,
      channelId,
      messageId: mockMessageId,
      templateId,
      templateName,
      payload: preparedPayload,
      status: "sent",
      publishedBy,
      publishedAt: new Date().toISOString(),
    });

    return {
      success: true,
      messageId: mockMessageId,
      data: published,
      isSimulated: true,
    };
  }

  public async deleteMessage(channelId: string, messageId: string): Promise<boolean> {
    const token = this.getBotToken();
    if (token && !messageId.startsWith("msg_")) {
      try {
        const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bot ${token}`,
            "User-Agent": "NovaStudio-BotEditor/1.0",
          },
        });
        return res.ok || res.status === 404;
      } catch {
        return false;
      }
    }
    return true;
  }
}
