import { DatabaseManager } from "../database/connection.js";
import {
  TutorialItem,
  TutorialSettings,
  TutorialPageData,
} from "@nova/shared";

const defaultSettings: TutorialSettings = {
  channelName: "Nova Studio",
  channelId: "",
  apiKey: "",
  title: "Master Modern Development & Cloud Architecture",
  badge: "OFFICIAL VIDEO GUIDES & MASTERCLASSES",
  subtitle:
    "Explore comprehensive tutorials on Discord bot engineering, cloud infrastructure, full-stack Next.js systems, and Minecraft server development.",
  subscriberCount: "12.4K",
  videoCount: "48",
  viewCount: "350K",
  avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png",
  bannerUrl: "",
  customUrl: "@NovaStudioHQ",
  autoSync: false,
  updatedAt: new Date().toISOString(),
  updatedBy: "system",
};

const defaultTutorials: TutorialItem[] = [
  {
    id: "tut-discord-bot-v14",
    youtubeVideoId: "bdHE2wHT-gQ",
    title: "Build an Advanced Discord Bot with Discord.js v14 & Slash Commands",
    description:
      "A complete guide to building a scalable Discord bot from scratch using Discord.js v14, button interactions, embed builders, and MongoDB integration.",
    category: "Discord Bots",
    thumbnailUrl: "https://i.ytimg.com/vi/bdHE2wHT-gQ/maxresdefault.jpg",
    duration: "24:18",
    viewCount: 18450,
    likeCount: 1420,
    commentCount: 182,
    publishedAt: "2026-09-15T12:00:00Z",
    featured: true,
    sortOrder: 0,
    tags: ["discord.js", "bot", "nodejs", "slash-commands"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tut-vps-hosting-setup",
    youtubeVideoId: "bZ6rTepxS1Y",
    title: "How to Deploy and Host 24/7 Discord Bots & Web Apps on Ubuntu VPS",
    description:
      "Step-by-step masterclass on setting up an Ubuntu cloud server, configuring UFW firewall, installing Node.js, and running apps under PM2 with zero downtime.",
    category: "Hosting & Cloud",
    thumbnailUrl: "https://i.ytimg.com/vi/bZ6rTepxS1Y/maxresdefault.jpg",
    duration: "18:42",
    viewCount: 12900,
    likeCount: 980,
    commentCount: 95,
    publishedAt: "2026-09-28T14:30:00Z",
    featured: false,
    sortOrder: 1,
    tags: ["vps", "hosting", "ubuntu", "pm2", "cloud"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tut-nextjs-fullstack",
    youtubeVideoId: "wm5gMKuwSYk",
    title: "Next.js 15 Full Stack Application with SQLite WAL & Tailwind CSS",
    description:
      "Learn how to build high-performance web applications with Next.js App Router, server components, Tailwind CSS v4, and transactional SQLite databases.",
    category: "Development",
    thumbnailUrl: "https://i.ytimg.com/vi/wm5gMKuwSYk/maxresdefault.jpg",
    duration: "32:15",
    viewCount: 22100,
    likeCount: 1890,
    commentCount: 230,
    publishedAt: "2026-10-05T10:15:00Z",
    featured: false,
    sortOrder: 2,
    tags: ["nextjs", "react", "sqlite", "fullstack", "tailwind"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tut-mc-server-setup",
    youtubeVideoId: "8x8X9kF3yB8",
    title: "Create a High-Performance Paper/Purpur Minecraft Server with Plugins",
    description:
      "Everything you need to know about setting up, optimizing, and securing a modern Minecraft multiplayer server with performance flags and custom plugins.",
    category: "Minecraft Dev",
    thumbnailUrl: "https://i.ytimg.com/vi/8x8X9kF3yB8/maxresdefault.jpg",
    duration: "15:20",
    viewCount: 9400,
    likeCount: 710,
    commentCount: 64,
    publishedAt: "2026-10-12T16:00:00Z",
    featured: false,
    sortOrder: 3,
    tags: ["minecraft", "purpur", "paper", "server", "plugins"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tut-discord-ticket-bot",
    youtubeVideoId: "1yKCv_A6o7U",
    title: "Build an Advanced Ticket System Bot with Transcript Logging",
    description:
      "Create a professional Discord support ticket bot with custom channel permissions, ephemeral messages, HTML transcript generation, and ticket close reasons.",
    category: "Discord Bots",
    thumbnailUrl: "https://i.ytimg.com/vi/1yKCv_A6o7U/maxresdefault.jpg",
    duration: "21:05",
    viewCount: 11200,
    likeCount: 840,
    commentCount: 112,
    publishedAt: "2026-10-18T18:00:00Z",
    featured: false,
    sortOrder: 4,
    tags: ["discord", "ticket-bot", "support", "transcripts"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "tut-docker-reverse-proxy",
    youtubeVideoId: "e1B2x3C4d5E",
    title: "Nginx Reverse Proxy & SSL Certificates with Docker Compose",
    description:
      "Protect your APIs and web apps with automated Let's Encrypt SSL certificates, rate limiting, and reverse proxy routing using Docker.",
    category: "Hosting & Cloud",
    thumbnailUrl: "https://i.ytimg.com/vi/wm5gMKuwSYk/hqdefault.jpg",
    duration: "16:50",
    viewCount: 8700,
    likeCount: 650,
    commentCount: 58,
    publishedAt: "2026-10-20T11:00:00Z",
    featured: false,
    sortOrder: 5,
    tags: ["docker", "nginx", "ssl", "security", "devops"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class TutorialRepository {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.ensureInitialized();
  }

  private getDb() {
    return this.dbManager.getConnection("tutorials");
  }

  private ensureInitialized() {
    const db = this.getDb();

    // Ensure tables exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS tutorial_settings (
        id TEXT PRIMARY KEY,
        channel_name TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        api_key TEXT,
        title TEXT NOT NULL,
        badge TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        subscriber_count TEXT DEFAULT '0',
        video_count TEXT DEFAULT '0',
        view_count TEXT DEFAULT '0',
        avatar_url TEXT,
        banner_url TEXT,
        custom_url TEXT,
        auto_sync INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tutorials (
        id TEXT PRIMARY KEY,
        youtube_video_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL,
        thumbnail_url TEXT NOT NULL DEFAULT '',
        duration TEXT NOT NULL DEFAULT '00:00',
        view_count INTEGER NOT NULL DEFAULT 0,
        like_count INTEGER NOT NULL DEFAULT 0,
        comment_count INTEGER NOT NULL DEFAULT 0,
        published_at TEXT NOT NULL,
        featured INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        tags TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tutorials_video_id ON tutorials(youtube_video_id);
      CREATE INDEX IF NOT EXISTS idx_tutorials_category ON tutorials(category);
      CREATE INDEX IF NOT EXISTS idx_tutorials_featured ON tutorials(featured);
      CREATE INDEX IF NOT EXISTS idx_tutorials_sort ON tutorials(sort_order);
    `);

    // Check if settings table has entry
    const settingsRow = db
      .prepare("SELECT COUNT(*) as count FROM tutorial_settings")
      .get() as { count: number };

    if (settingsRow.count === 0) {
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO tutorial_settings (
          id, channel_name, channel_id, api_key, title, badge, subtitle,
          subscriber_count, video_count, view_count, avatar_url, banner_url, custom_url, auto_sync,
          updated_at, updated_by
        ) VALUES (
          'default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'system'
        )`
      ).run(
        defaultSettings.channelName,
        defaultSettings.channelId,
        defaultSettings.apiKey || "",
        defaultSettings.title,
        defaultSettings.badge,
        defaultSettings.subtitle,
        defaultSettings.subscriberCount || "0",
        defaultSettings.videoCount || "0",
        defaultSettings.viewCount || "0",
        defaultSettings.avatarUrl || "",
        defaultSettings.bannerUrl || "",
        defaultSettings.customUrl || "",
        now
      );
    }

    // Check if tutorials table has entries
    const tutorialsCount = db
      .prepare("SELECT COUNT(*) as count FROM tutorials")
      .get() as { count: number };

    if (tutorialsCount.count === 0) {
      this.seedDefaultTutorials();
    }
  }

  public seedDefaultTutorials() {
    const db = this.getDb();
    db.exec("BEGIN TRANSACTION;");
    try {
      db.prepare("DELETE FROM tutorials").run();

      const insertStmt = db.prepare(`
        INSERT INTO tutorials (
          id, youtube_video_id, title, description, category,
          thumbnail_url, duration, view_count, like_count, comment_count,
          published_at, featured, sort_order, tags, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);

      for (const t of defaultTutorials) {
        insertStmt.run(
          t.id,
          t.youtubeVideoId,
          t.title,
          t.description,
          t.category,
          t.thumbnailUrl,
          t.duration,
          t.viewCount,
          t.likeCount,
          t.commentCount || 0,
          t.publishedAt,
          t.featured ? 1 : 0,
          t.sortOrder,
          JSON.stringify(t.tags || []),
          t.createdAt,
          t.updatedAt
        );
      }

      db.exec("COMMIT;");
      console.log(`[TutorialRepository] Seeded ${defaultTutorials.length} tutorials in tutorials.db`);
    } catch (err) {
      db.exec("ROLLBACK;");
      console.error("[TutorialRepository] Failed seeding tutorials:", err);
      throw err;
    }
  }

  public getSettings(): TutorialSettings {
    const db = this.getDb();
    const row = db
      .prepare("SELECT * FROM tutorial_settings WHERE id = 'default'")
      .get() as any;

    if (!row) {
      return defaultSettings;
    }

    return {
      channelName: row.channel_name || "Nova Studio",
      channelId: row.channel_id || "",
      apiKey: row.api_key || "",
      title: row.title || "Master Modern Development",
      badge: row.badge || "OFFICIAL VIDEO GUIDES & TUTORIALS",
      subtitle: row.subtitle || "",
      subscriberCount: row.subscriber_count || "0",
      videoCount: row.video_count || "0",
      viewCount: row.view_count || "0",
      avatarUrl: row.avatar_url || "",
      bannerUrl: row.banner_url || "",
      customUrl: row.custom_url || "",
      autoSync: Boolean(row.auto_sync),
      updatedAt: row.updated_at || new Date().toISOString(),
      updatedBy: row.updated_by || "system",
    };
  }

  public saveSettings(
    settings: Partial<TutorialSettings>,
    updatedBy: string = "admin"
  ): TutorialSettings {
    const db = this.getDb();
    const current = this.getSettings();
    const merged = { ...current, ...settings, updatedAt: new Date().toISOString(), updatedBy };

    db.prepare(`
      INSERT INTO tutorial_settings (
        id, channel_name, channel_id, api_key, title, badge, subtitle,
        subscriber_count, video_count, view_count, avatar_url, banner_url, custom_url, auto_sync,
        updated_at, updated_by
      ) VALUES (
        'default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        channel_name = excluded.channel_name,
        channel_id = excluded.channel_id,
        api_key = excluded.api_key,
        title = excluded.title,
        badge = excluded.badge,
        subtitle = excluded.subtitle,
        subscriber_count = excluded.subscriber_count,
        video_count = excluded.video_count,
        view_count = excluded.view_count,
        avatar_url = excluded.avatar_url,
        banner_url = excluded.banner_url,
        custom_url = excluded.custom_url,
        auto_sync = excluded.auto_sync,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `).run(
      merged.channelName,
      merged.channelId,
      merged.apiKey || "",
      merged.title,
      merged.badge,
      merged.subtitle,
      merged.subscriberCount || "0",
      merged.videoCount || "0",
      merged.viewCount || "0",
      merged.avatarUrl || "",
      merged.bannerUrl || "",
      merged.customUrl || "",
      merged.autoSync ? 1 : 0,
      merged.updatedAt,
      merged.updatedBy
    );

    return merged;
  }

  public getTutorials(): TutorialItem[] {
    const db = this.getDb();
    const rows = db
      .prepare("SELECT * FROM tutorials ORDER BY sort_order ASC, published_at DESC")
      .all() as any[];

    return rows.map((r) => ({
      id: r.id,
      youtubeVideoId: r.youtube_video_id,
      title: r.title,
      description: r.description || "",
      category: r.category,
      thumbnailUrl: r.thumbnail_url || `https://i.ytimg.com/vi/${r.youtube_video_id}/hqdefault.jpg`,
      duration: r.duration || "00:00",
      viewCount: Number(r.view_count || 0),
      likeCount: Number(r.like_count || 0),
      commentCount: Number(r.comment_count || 0),
      publishedAt: r.published_at || new Date().toISOString(),
      featured: Boolean(r.featured),
      sortOrder: Number(r.sort_order || 0),
      tags: r.tags ? JSON.parse(r.tags) : [],
      createdAt: r.created_at || new Date().toISOString(),
      updatedAt: r.updated_at || new Date().toISOString(),
    }));
  }

  public getTutorialById(id: string): TutorialItem | null {
    const db = this.getDb();
    const r = db.prepare("SELECT * FROM tutorials WHERE id = ?").get(id) as any;
    if (!r) return null;

    return {
      id: r.id,
      youtubeVideoId: r.youtube_video_id,
      title: r.title,
      description: r.description || "",
      category: r.category,
      thumbnailUrl: r.thumbnail_url || `https://i.ytimg.com/vi/${r.youtube_video_id}/hqdefault.jpg`,
      duration: r.duration || "00:00",
      viewCount: Number(r.view_count || 0),
      likeCount: Number(r.like_count || 0),
      commentCount: Number(r.comment_count || 0),
      publishedAt: r.published_at || new Date().toISOString(),
      featured: Boolean(r.featured),
      sortOrder: Number(r.sort_order || 0),
      tags: r.tags ? JSON.parse(r.tags) : [],
      createdAt: r.created_at || new Date().toISOString(),
      updatedAt: r.updated_at || new Date().toISOString(),
    };
  }

  public getTutorialPageData(): TutorialPageData {
    const settings = this.getSettings();
    const tutorials = this.getTutorials();

    const rawCategories = [
      "All",
      "Discord Bots",
      "Hosting & Cloud",
      "Development",
      "Minecraft Dev",
      ...tutorials.map((t) => t.category),
    ];
    const categories = Array.from(new Set(rawCategories));

    return {
      settings,
      categories,
      tutorials,
      totalCount: tutorials.length,
    };
  }

  public addOrUpdateTutorial(
    tutorial: Partial<TutorialItem>,
    updatedBy: string = "admin"
  ): TutorialItem {
    const db = this.getDb();
    const now = new Date().toISOString();
    const id = tutorial.id && tutorial.id.trim() ? tutorial.id : `tut-${Date.now()}`;

    const existing = this.getTutorialById(id);
    const item: TutorialItem = {
      id,
      youtubeVideoId: tutorial.youtubeVideoId || existing?.youtubeVideoId || "",
      title: tutorial.title || existing?.title || "New Tutorial",
      description: tutorial.description ?? existing?.description ?? "",
      category: tutorial.category || existing?.category || "Tutorials",
      thumbnailUrl:
        tutorial.thumbnailUrl ||
        existing?.thumbnailUrl ||
        `https://i.ytimg.com/vi/${tutorial.youtubeVideoId}/hqdefault.jpg`,
      duration: tutorial.duration || existing?.duration || "10:00",
      viewCount: tutorial.viewCount ?? existing?.viewCount ?? 0,
      likeCount: tutorial.likeCount ?? existing?.likeCount ?? 0,
      commentCount: tutorial.commentCount ?? existing?.commentCount ?? 0,
      publishedAt: tutorial.publishedAt || existing?.publishedAt || now,
      featured: tutorial.featured ?? existing?.featured ?? false,
      sortOrder: tutorial.sortOrder ?? existing?.sortOrder ?? 0,
      tags: tutorial.tags || existing?.tags || [],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    db.prepare(`
      INSERT INTO tutorials (
        id, youtube_video_id, title, description, category,
        thumbnail_url, duration, view_count, like_count, comment_count,
        published_at, featured, sort_order, tags, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        youtube_video_id = excluded.youtube_video_id,
        title = excluded.title,
        description = excluded.description,
        category = excluded.category,
        thumbnail_url = excluded.thumbnail_url,
        duration = excluded.duration,
        view_count = excluded.view_count,
        like_count = excluded.like_count,
        comment_count = excluded.comment_count,
        published_at = excluded.published_at,
        featured = excluded.featured,
        sort_order = excluded.sort_order,
        tags = excluded.tags,
        updated_at = excluded.updated_at
    `).run(
      item.id,
      item.youtubeVideoId,
      item.title,
      item.description,
      item.category,
      item.thumbnailUrl,
      item.duration,
      item.viewCount,
      item.likeCount,
      item.commentCount || 0,
      item.publishedAt,
      item.featured ? 1 : 0,
      item.sortOrder,
      JSON.stringify(item.tags),
      item.createdAt,
      item.updatedAt
    );

    return item;
  }

  public deleteTutorial(id: string): boolean {
    const db = this.getDb();
    const res = db.prepare("DELETE FROM tutorials WHERE id = ?").run(id);
    return res.changes > 0;
  }

  public reorderTutorials(ids: string[]): void {
    const db = this.getDb();
    db.exec("BEGIN TRANSACTION;");
    try {
      const stmt = db.prepare("UPDATE tutorials SET sort_order = ? WHERE id = ?");
      ids.forEach((id, index) => {
        stmt.run(index, id);
      });
      db.exec("COMMIT;");
    } catch (err) {
      db.exec("ROLLBACK;");
      throw err;
    }
  }

  public batchSaveTutorials(
    tutorials: Array<Omit<TutorialItem, "id" | "createdAt" | "updatedAt">>,
    replaceExisting: boolean = false
  ): TutorialItem[] {
    const db = this.getDb();
    const now = new Date().toISOString();

    db.exec("BEGIN TRANSACTION;");
    try {
      if (replaceExisting) {
        db.prepare("DELETE FROM tutorials").run();
      }

      const savedItems: TutorialItem[] = [];
      const insertStmt = db.prepare(`
        INSERT INTO tutorials (
          id, youtube_video_id, title, description, category,
          thumbnail_url, duration, view_count, like_count, comment_count,
          published_at, featured, sort_order, tags, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          category = excluded.category,
          thumbnail_url = excluded.thumbnail_url,
          duration = excluded.duration,
          view_count = excluded.view_count,
          like_count = excluded.like_count,
          comment_count = excluded.comment_count,
          published_at = excluded.published_at,
          updated_at = excluded.updated_at
      `);

      for (let i = 0; i < tutorials.length; i++) {
        const t = tutorials[i];
        const id = `tut-${t.youtubeVideoId}`;
        const item: TutorialItem = {
          ...t,
          id,
          sortOrder: i,
          createdAt: now,
          updatedAt: now,
        };

        insertStmt.run(
          item.id,
          item.youtubeVideoId,
          item.title,
          item.description,
          item.category,
          item.thumbnailUrl,
          item.duration,
          item.viewCount,
          item.likeCount,
          item.commentCount || 0,
          item.publishedAt,
          item.featured ? 1 : 0,
          item.sortOrder,
          JSON.stringify(item.tags || []),
          item.createdAt,
          item.updatedAt
        );

        savedItems.push(item);
      }

      db.exec("COMMIT;");
      return savedItems;
    } catch (err) {
      db.exec("ROLLBACK;");
      throw err;
    }
  }
}
