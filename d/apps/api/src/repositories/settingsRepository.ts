import { DatabaseManager } from "../database/connection.js";
import { SiteSettings } from "@nova/shared";

export class SettingsRepository {
  private getDb() {
    return DatabaseManager.getInstance().getConnection("settings");
  }

  public getSettings(): SiteSettings {
    const row = this.getDb().prepare(`
      SELECT data, updated_at, updated_by FROM site_settings WHERE section = 'all'
    `).get() as { data: string; updated_at: string; updated_by: string } | undefined;

    if (!row) {
      throw new Error("Site settings not initialized");
    }

    const parsed = JSON.parse(row.data) as SiteSettings;
    if (parsed.branding) {
      parsed.branding.backgroundType = parsed.branding.backgroundType || "image";
      parsed.branding.backgroundUrl =
        parsed.branding.backgroundUrl !== undefined
          ? parsed.branding.backgroundUrl
          : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=3840&auto=format&fit=crop";
      parsed.branding.backgroundOpacity =
        parsed.branding.backgroundOpacity !== undefined ? parsed.branding.backgroundOpacity : 100;
      parsed.branding.panelTransparency =
        parsed.branding.panelTransparency !== undefined ? parsed.branding.panelTransparency : 35;
      parsed.branding.panelBlur =
        parsed.branding.panelBlur !== undefined ? parsed.branding.panelBlur : 16;
      parsed.branding.favoriteWallpapers = parsed.branding.favoriteWallpapers || [];
    }
    parsed.updatedAt = row.updated_at;
    parsed.updatedBy = row.updated_by;
    return parsed;
  }

  public updateSettings(settings: SiteSettings, updatedBy: string): SiteSettings {
    const now = new Date().toISOString();
    const payload = {
      ...settings,
      updatedAt: now,
      updatedBy,
    };

    this.getDb().prepare(`
      INSERT INTO site_settings (id, section, data, updated_at, updated_by)
      VALUES ('main_settings', 'all', ?, ?, ?)
      ON CONFLICT(section) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `).run(JSON.stringify(payload), now, updatedBy);

    return payload;
  }
}

