import { DatabaseManager, DatabaseKey } from "./connection.js";

interface Migration {
  version: number;
  up: (db: any) => void;
}

const userMigrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          email TEXT,
          role TEXT NOT NULL DEFAULT 'admin',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          last_login_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          user_agent TEXT,
          ip_address TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      `);
    },
  },
];

const appMigrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS app_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS system_metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          metric_type TEXT NOT NULL,
          metric_value REAL NOT NULL,
          details TEXT,
          recorded_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_metrics_type_date ON system_metrics(metric_type, recorded_at);
      `);
    },
  },
];

const settingsMigrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id TEXT PRIMARY KEY,
          section TEXT UNIQUE NOT NULL,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          updated_by TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_settings_section ON site_settings(section);
      `);
    },
  },
  {
    version: 2,
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_panel_preferences (
          user_id TEXT PRIMARY KEY,
          preferences TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_user_prefs_user_id ON user_panel_preferences(user_id);

        CREATE TABLE IF NOT EXISTS user_wallpaper_favorites (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          wallpaper_id TEXT NOT NULL,
          wallpaper_url TEXT NOT NULL,
          created_at TEXT NOT NULL,
          UNIQUE(user_id, wallpaper_id)
        );
        CREATE INDEX IF NOT EXISTS idx_user_favs_user_id ON user_wallpaper_favorites(user_id);
      `);
    },
  },
];

const contentMigrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS home_content_revisions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version INTEGER NOT NULL,
          is_published INTEGER NOT NULL DEFAULT 0,
          data TEXT NOT NULL,
          created_at TEXT NOT NULL,
          published_at TEXT,
          created_by TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_home_published ON home_content_revisions(is_published);
        CREATE INDEX IF NOT EXISTS idx_home_version ON home_content_revisions(version);

        CREATE TABLE IF NOT EXISTS media_assets (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          url TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `);
    },
  },
];

const activityMigrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          category TEXT NOT NULL,
          details TEXT NOT NULL,
          ip_address TEXT,
          user_id TEXT,
          username TEXT,
          status TEXT NOT NULL DEFAULT 'success',
          metadata TEXT,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_logs(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_activity_category ON activity_logs(category);

        CREATE TABLE IF NOT EXISTS analytics_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT NOT NULL,
          path TEXT NOT NULL,
          visitor_id TEXT,
          ip_hash TEXT,
          user_agent TEXT,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
      `);
    },
  },
];

const apiMigrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS api_keys (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          key_hash TEXT NOT NULL,
          permissions TEXT NOT NULL,
          created_at TEXT NOT NULL,
          expires_at TEXT,
          last_used_at TEXT
        );

        CREATE TABLE IF NOT EXISTS rate_limits (
          key TEXT PRIMARY KEY,
          count INTEGER NOT NULL,
          reset_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS api_integrations (
          id TEXT PRIMARY KEY,
          service_name TEXT NOT NULL,
          config TEXT NOT NULL,
          is_enabled INTEGER NOT NULL DEFAULT 1,
          updated_at TEXT NOT NULL
        );
      `);
    },
  },
];

const teamMigrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS team_settings (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          badge TEXT NOT NULL,
          subtitle TEXT NOT NULL,
          discord_server_id TEXT NOT NULL DEFAULT '1540761150797389915',
          updated_at TEXT NOT NULL,
          updated_by TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS team_members (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          role TEXT NOT NULL,
          role_short TEXT NOT NULL,
          desc TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'online',
          game TEXT,
          color TEXT NOT NULL DEFAULT 'blue',
          avatar TEXT NOT NULL,
          discord_id TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_team_category ON team_members(category);
        CREATE INDEX IF NOT EXISTS idx_team_sort ON team_members(sort_order);
      `);
    },
  },
];

const tutorialMigrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
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
    },
  },
];

const commandMigrations: Migration[] = [
  {
    version: 1,
    up: (db) => {
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
    },
  },
];

const migrationsMap: Record<DatabaseKey, Migration[]> = {
  user: userMigrations,
  app: appMigrations,
  settings: settingsMigrations,
  content: contentMigrations,
  activity: activityMigrations,
  api: apiMigrations,
  team: teamMigrations,
  tutorials: tutorialMigrations,
  command: commandMigrations,
};

export function runMigrations(): void {
  const dbManager = DatabaseManager.getInstance();

  for (const [key, migrations] of Object.entries(migrationsMap) as [DatabaseKey, Migration[]][]) {
    const db = dbManager.getConnection(key);

    const versionRow = db.prepare("PRAGMA user_version").get() as { user_version?: number } | undefined;
    const currentVersion = versionRow?.user_version ?? 0;

    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        db.exec("BEGIN TRANSACTION;");
        try {
          migration.up(db);
          db.exec(`PRAGMA user_version = ${migration.version};`);
          db.exec("COMMIT;");
          console.log(`[Database] Migrated ${key}.db to version ${migration.version}`);
        } catch (error) {
          db.exec("ROLLBACK;");
          console.error(`[Database] Failed migrating ${key}.db to version ${migration.version}:`, error);
          throw error;
        }
      }
    }
  }
}

