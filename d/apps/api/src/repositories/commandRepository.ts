import fs from "node:fs";
import path from "node:path";
import { DatabaseManager } from "../database/connection.js";
import {
  CommandItem,
  CommandSettings,
  CommandPageData,
} from "@nova/shared";

const defaultSettings: CommandSettings = {
  title: "Command Library",
  badge: "SYSTEM & DEVELOPER COMMANDS",
  subtitle:
    "Access over 190+ system, VPS, Docker, Linux, and networking commands with instant 1-click execution copying.",
  updatedAt: new Date().toISOString(),
  updatedBy: "system",
};

interface RawCommand {
  cat: string;
  title: string;
  code: string;
  desc: string;
}

export class CommandRepository {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.ensureInitialized();
  }

  private getDb() {
    return this.dbManager.getConnection("command");
  }

  private ensureInitialized() {
    const db = this.getDb();

    // Ensure tables exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS command_settings (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        badge TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS commands (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        command TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        tags TEXT DEFAULT '[]',
        sort_order INTEGER NOT NULL DEFAULT 0,
        favorite INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_commands_cat ON commands(category);
      CREATE INDEX IF NOT EXISTS idx_commands_sort ON commands(sort_order);
      CREATE INDEX IF NOT EXISTS idx_commands_fav ON commands(favorite);
    `);

    // Check if settings table has entry
    const settingsRow = db
      .prepare("SELECT COUNT(*) as count FROM command_settings")
      .get() as { count: number };

    if (settingsRow.count === 0) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO command_settings (id, title, badge, subtitle, updated_at, updated_by)
        VALUES ('default', ?, ?, ?, ?, 'system')
      `).run(
        defaultSettings.title,
        defaultSettings.badge,
        defaultSettings.subtitle,
        now
      );
    }

    // Check if commands table has entries
    const commandsCount = db
      .prepare("SELECT COUNT(*) as count FROM commands")
      .get() as { count: number };

    if (commandsCount.count === 0) {
      this.seedFromHtmlOrSeedFile();
    }
  }

  /**
   * Reads and parses all commands from index (2).html or commands_seed.json
   */
  public seedFromHtmlOrSeedFile(): number {
    const db = this.getDb();
    let rawList: RawCommand[] = [];

    // Attempt 1: Read index (2).html from workspace
    const possibleHtmlPaths = [
      path.resolve(process.cwd(), "../../index (2).html"),
      path.resolve(process.cwd(), "index (2).html"),
      "/workspaces/w/index (2).html",
    ];

    for (const p of possibleHtmlPaths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, "utf-8");
          const startIdx = content.indexOf("const commandsDB = [");
          if (startIdx !== -1) {
            const endIdx = content.indexOf("];", startIdx);
            const arrayStr = content.slice(
              startIdx + "const commandsDB = ".length,
              endIdx + 1
            );
            // Safe JSON parse if standard or Function constructor
            const evaluated = new Function(`return ${arrayStr}`)();
            if (Array.isArray(evaluated) && evaluated.length > 0) {
              rawList = evaluated;
              console.log(`[CommandRepository] Extracted ${rawList.length} commands directly from ${p}`);
              break;
            }
          }
        } catch (e) {
          console.warn(`[CommandRepository] Could not parse from ${p}:`, e);
        }
      }
    }

    // Attempt 2: Fallback to commands_seed.json
    if (rawList.length === 0) {
      const seedJsonPath = path.resolve(
        import.meta.dirname || process.cwd(),
        "commands_seed.json"
      );
      if (fs.existsSync(seedJsonPath)) {
        try {
          rawList = JSON.parse(fs.readFileSync(seedJsonPath, "utf-8"));
          console.log(`[CommandRepository] Loaded ${rawList.length} commands from commands_seed.json`);
        } catch {
          // ignore
        }
      }
    }

    if (rawList.length === 0) {
      console.warn("[CommandRepository] No commands found to seed.");
      return 0;
    }

    const now = new Date().toISOString();
    db.exec("BEGIN TRANSACTION;");
    try {
      db.prepare("DELETE FROM commands").run();

      const insertStmt = db.prepare(`
        INSERT INTO commands (
          id, category, title, command, description, tags, sort_order, favorite, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);

      rawList.forEach((it, index) => {
        const id = `cmd-${index + 1}`;
        const cat = it.cat ? it.cat.toLowerCase().trim() : "general";
        const title = it.title || `Command ${index + 1}`;
        const cmd = it.code || "";
        const desc = it.desc || "";
        const tags = JSON.stringify([cat]);
        const favorite = cat === "useful" || index < 12 ? 1 : 0;

        insertStmt.run(
          id,
          cat,
          title,
          cmd,
          desc,
          tags,
          index,
          favorite,
          now,
          now
        );
      });

      db.exec("COMMIT;");
      console.log(`[CommandRepository] Successfully seeded ${rawList.length} commands into command.db!`);
      return rawList.length;
    } catch (err) {
      db.exec("ROLLBACK;");
      console.error("[CommandRepository] Failed seeding commands:", err);
      throw err;
    }
  }

  public getSettings(): CommandSettings {
    const db = this.getDb();
    const row = db
      .prepare("SELECT * FROM command_settings WHERE id = 'default'")
      .get() as any;

    if (!row) return defaultSettings;

    return {
      title: row.title || "Command Library",
      badge: row.badge || "SYSTEM & DEVELOPER COMMANDS",
      subtitle: row.subtitle || "",
      updatedAt: row.updated_at || new Date().toISOString(),
      updatedBy: row.updated_by || "system",
    };
  }

  public saveSettings(
    settings: Partial<CommandSettings>,
    updatedBy: string = "admin"
  ): CommandSettings {
    const db = this.getDb();
    const current = this.getSettings();
    const merged = { ...current, ...settings, updatedAt: new Date().toISOString(), updatedBy };

    db.prepare(`
      INSERT INTO command_settings (id, title, badge, subtitle, updated_at, updated_by)
      VALUES ('default', ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        badge = excluded.badge,
        subtitle = excluded.subtitle,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `).run(
      merged.title,
      merged.badge,
      merged.subtitle,
      merged.updatedAt,
      merged.updatedBy
    );

    return merged;
  }

  public getCommands(): CommandItem[] {
    const db = this.getDb();
    const rows = db
      .prepare("SELECT * FROM commands ORDER BY sort_order ASC, created_at ASC")
      .all() as any[];

    return rows.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      command: r.command,
      description: r.description || "",
      tags: r.tags ? JSON.parse(r.tags) : [],
      sortOrder: Number(r.sort_order || 0),
      favorite: Boolean(r.favorite),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public getCommandById(id: string): CommandItem | null {
    const db = this.getDb();
    const r = db.prepare("SELECT * FROM commands WHERE id = ?").get(id) as any;
    if (!r) return null;

    return {
      id: r.id,
      category: r.category,
      title: r.title,
      command: r.command,
      description: r.description || "",
      tags: r.tags ? JSON.parse(r.tags) : [],
      sortOrder: Number(r.sort_order || 0),
      favorite: Boolean(r.favorite),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  public getCommandPageData(): CommandPageData {
    const settings = this.getSettings();
    const commands = this.getCommands();

    // Standard ordering for categories matching index (2).html
    const standardCatOrder = [
      "all",
      "useful",
      "linux",
      "vps",
      "docker",
      "git",
      "networking",
      "system",
      "auto",
      "review",
      "suggestion",
    ];

    const uniqueCats = Array.from(new Set(commands.map((c) => c.category.toLowerCase())));
    const sortedCats = [
      "All",
      ...standardCatOrder
        .filter((c) => c !== "all" && uniqueCats.includes(c))
        .map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
      ...uniqueCats
        .filter((c) => !standardCatOrder.includes(c))
        .map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
    ];

    return {
      settings,
      categories: Array.from(new Set(sortedCats)),
      commands,
      totalCount: commands.length,
    };
  }

  public addOrUpdateCommand(
    item: Partial<CommandItem>,
    updatedBy: string = "admin"
  ): CommandItem {
    const db = this.getDb();
    const now = new Date().toISOString();
    const id = item.id && item.id.trim() ? item.id : `cmd-${Date.now()}`;

    const existing = this.getCommandById(id);
    const commandItem: CommandItem = {
      id,
      category: (item.category || existing?.category || "linux").toLowerCase().trim(),
      title: item.title || existing?.title || "New Command",
      command: item.command || existing?.command || "echo 'Hello World'",
      description: item.description ?? existing?.description ?? "",
      tags: item.tags || existing?.tags || [],
      sortOrder: item.sortOrder ?? existing?.sortOrder ?? 0,
      favorite: item.favorite ?? existing?.favorite ?? false,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    db.prepare(`
      INSERT INTO commands (
        id, category, title, command, description, tags, sort_order, favorite, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(id) DO UPDATE SET
        category = excluded.category,
        title = excluded.title,
        command = excluded.command,
        description = excluded.description,
        tags = excluded.tags,
        sort_order = excluded.sort_order,
        favorite = excluded.favorite,
        updated_at = excluded.updated_at
    `).run(
      commandItem.id,
      commandItem.category,
      commandItem.title,
      commandItem.command,
      commandItem.description,
      JSON.stringify(commandItem.tags || []),
      commandItem.sortOrder,
      commandItem.favorite ? 1 : 0,
      commandItem.createdAt || now,
      commandItem.updatedAt || now
    );

    return commandItem;
  }

  public deleteCommand(id: string): boolean {
    const db = this.getDb();
    const res = db.prepare("DELETE FROM commands WHERE id = ?").run(id);
    return res.changes > 0;
  }

  public reorderCommands(ids: string[]): void {
    const db = this.getDb();
    db.exec("BEGIN TRANSACTION;");
    try {
      const stmt = db.prepare("UPDATE commands SET sort_order = ? WHERE id = ?");
      ids.forEach((id, index) => {
        stmt.run(index, id);
      });
      db.exec("COMMIT;");
    } catch (err) {
      db.exec("ROLLBACK;");
      throw err;
    }
  }
}
