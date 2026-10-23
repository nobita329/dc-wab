import { DatabaseManager } from "../database/connection.js";
import { SiteSettings, UserPanelPreferences, FeatureSettings } from "@nova/shared";

export const DEFAULT_GLOBAL_SETTINGS: SiteSettings = {
  branding: {
    siteTitle: "Nova Studio — Creative Digital Agency",
    siteTagline: "Crafting transcendent digital experiences, immersive brands, and high-performance web applications.",
    logoText: "NOVA STUDIO",
    logoImageUrl: "",
    faviconUrl: "/favicon.ico",
    primaryColor: "#7c3aed",
    accentColor: "#06b6d4",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
    defaultTheme: "dark",
    panelName: "NOVA STUDIO",
    panelLogo: "",
    panelFaviconName: "Nova Web Panel",
    panelFaviconLogo: "/favicon.ico",
    panelMotd: "Welcome to Nova Studio — Elite Engineering & Creative System",
    panelMotdSubtitle: "Latest stable architecture release active",
    panelMotdPosition: "left",
    panelMotdEnabled: true,
    panelMotdImage: "",
    panelMotdLink: "",
    backgroundType: "image",
    backgroundUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=3840&auto=format&fit=crop",
    backgroundFit: "cover",
    backgroundPosition: "center",
    backgroundOpacity: 100,
    panelTransparency: 35,
    panelBlur: 16,
    overlayColor: "#09090b",
    overlayOpacity: 0,
    gradientFrom: "#7c3aed",
    gradientTo: "#06b6d4",
    gradientAngle: 135,
    favoriteWallpapers: [],
    glassTint: "#12111a",
    enablePublicBackground: true,
    videoAutoplay: true,
    videoLoop: true,
    videoMuted: true,
  },
  seo: {
    metaTitle: "Nova Studio — High Impact Digital Design & Engineering",
    metaDescription: "Nova Studio is an elite creative digital agency specializing in modern web design, scalable architectures, and interactive digital experiences.",
    keywords: ["creative studio", "digital agency", "web development", "nextjs", "react", "ux design", "branding"],
    ogImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
    twitterHandle: "@novastudio",
    canonicalUrl: "",
    ogTitle: "Nova Studio — High Impact Digital Design & Engineering",
    ogDescription: "Elite creative digital agency specializing in modern web design and interactive systems.",
    themeColor: "#7c3aed",
    robotsIndex: "index, follow",
  },
  features: {
    allowUserCustomBackground: true,
    allowUserTransparency: true,
    allowUserBlur: true,
    allowUserTheme: true,
    allowUserWallpapers: true,
    enablePublicBackground: true,
    enableVideoBackground: true,
    enableMotdBanner: true,
    enableGlassmorphism: true,
    defaultUserTheme: "dark",
    lastSavedTime: new Date().toISOString(),
  },
  socials: [
    { id: "1", platform: "github", label: "GitHub", url: "https://github.com", enabled: true },
    { id: "2", platform: "twitter", label: "X / Twitter", url: "https://twitter.com", enabled: true },
    { id: "3", platform: "dribbble", label: "Dribbble", url: "https://dribbble.com", enabled: true },
    { id: "4", platform: "linkedin", label: "LinkedIn", url: "https://linkedin.com", enabled: true },
  ],
  updatedAt: new Date().toISOString(),
  updatedBy: "system",
};

export class SettingsRepository {
  private getDb() {
    return DatabaseManager.getInstance().getConnection("settings");
  }

  public getSettings(): SiteSettings {
    const row = this.getDb().prepare(`
      SELECT data, updated_at, updated_by FROM site_settings WHERE section = 'all'
    `).get() as { data: string; updated_at: string; updated_by: string } | undefined;

    if (!row) {
      return DEFAULT_GLOBAL_SETTINGS;
    }

    const parsed = JSON.parse(row.data) as SiteSettings;
    if (parsed.branding) {
      parsed.branding.panelName =
        parsed.branding.panelName !== undefined
          ? parsed.branding.panelName
          : parsed.branding.siteTitle || "NOVA STUDIO";
      parsed.branding.panelLogo =
        parsed.branding.panelLogo !== undefined
          ? parsed.branding.panelLogo
          : parsed.branding.logoImageUrl || "";
      parsed.branding.panelFaviconName =
        parsed.branding.panelFaviconName !== undefined
          ? parsed.branding.panelFaviconName
          : parsed.branding.siteTitle || "Nova Panel";
      parsed.branding.panelFaviconLogo =
        parsed.branding.panelFaviconLogo !== undefined
          ? parsed.branding.panelFaviconLogo
          : parsed.branding.faviconUrl || "/favicon.ico";
      parsed.branding.panelMotd =
        parsed.branding.panelMotd !== undefined
          ? parsed.branding.panelMotd
          : "Welcome to Nova Studio — Elite Engineering & Creative System";
      parsed.branding.panelMotdEnabled =
        parsed.branding.panelMotdEnabled !== undefined ? parsed.branding.panelMotdEnabled : true;
      parsed.branding.panelMotdImage =
        parsed.branding.panelMotdImage !== undefined ? parsed.branding.panelMotdImage : "";
      parsed.branding.panelMotdLink =
        parsed.branding.panelMotdLink !== undefined ? parsed.branding.panelMotdLink : "";
      parsed.branding.glassTint =
        parsed.branding.glassTint !== undefined ? parsed.branding.glassTint : "#12111a";
      parsed.branding.enablePublicBackground =
        parsed.branding.enablePublicBackground !== undefined
          ? parsed.branding.enablePublicBackground
          : true;

      parsed.branding.backgroundType = parsed.branding.backgroundType || "image";
      parsed.branding.backgroundUrl =
        parsed.branding.backgroundUrl !== undefined
          ? parsed.branding.backgroundUrl
          : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=3840&auto=format&fit=crop";
      parsed.branding.backgroundFit = parsed.branding.backgroundFit || "cover";
      parsed.branding.backgroundPosition = parsed.branding.backgroundPosition || "center";
      parsed.branding.backgroundOpacity =
        parsed.branding.backgroundOpacity !== undefined ? parsed.branding.backgroundOpacity : 100;
      parsed.branding.panelTransparency =
        parsed.branding.panelTransparency !== undefined ? parsed.branding.panelTransparency : 35;
      parsed.branding.panelBlur =
        parsed.branding.panelBlur !== undefined ? parsed.branding.panelBlur : 16;
      parsed.branding.overlayColor = parsed.branding.overlayColor || "#09090b";
      parsed.branding.overlayOpacity = parsed.branding.overlayOpacity !== undefined ? parsed.branding.overlayOpacity : 0;
      parsed.branding.favoriteWallpapers = parsed.branding.favoriteWallpapers || [];
      parsed.branding.videoAutoplay = parsed.branding.videoAutoplay !== false;
      parsed.branding.videoLoop = parsed.branding.videoLoop !== false;
      parsed.branding.videoMuted = parsed.branding.videoMuted !== false;
    }

    if (!parsed.features) {
      parsed.features = DEFAULT_GLOBAL_SETTINGS.features;
    }

    parsed.updatedAt = row.updated_at;
    parsed.updatedBy = row.updated_by;
    return parsed;
  }

  public updateSettings(settings: SiteSettings, updatedBy: string): SiteSettings {
    const now = new Date().toISOString();
    const payload: SiteSettings = {
      ...settings,
      features: {
        ...(settings.features || DEFAULT_GLOBAL_SETTINGS.features!),
        lastSavedTime: now,
      },
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

  public resetGlobalSettings(updatedBy: string): SiteSettings {
    return this.updateSettings(DEFAULT_GLOBAL_SETTINGS, updatedBy);
  }

  // ==========================================
  // Normal User Personal Preferences
  // ==========================================
  public getUserPreferences(userId: string): UserPanelPreferences | null {
    try {
      const row = this.getDb().prepare(`
        SELECT preferences FROM user_panel_preferences WHERE user_id = ?
      `).get(userId) as { preferences: string } | undefined;

      if (!row) return null;
      return JSON.parse(row.preferences) as UserPanelPreferences;
    } catch {
      return null;
    }
  }

  public updateUserPreferences(
    userId: string,
    prefs: Partial<UserPanelPreferences>
  ): UserPanelPreferences {
    const now = new Date().toISOString();
    const current = this.getUserPreferences(userId) || { userId };
    const updated: UserPanelPreferences = {
      ...current,
      ...prefs,
      userId,
      updatedAt: now,
    };

    this.getDb().prepare(`
      INSERT INTO user_panel_preferences (user_id, preferences, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        preferences = excluded.preferences,
        updated_at = excluded.updated_at
    `).run(userId, JSON.stringify(updated), now);

    return updated;
  }

  public resetUserPreferences(userId: string): void {
    try {
      this.getDb().prepare(`DELETE FROM user_panel_preferences WHERE user_id = ?`).run(userId);
    } catch {
      // Ignored if table or user not found
    }
  }

  // ==========================================
  // User Wallpaper Favorites
  // ==========================================
  public getUserFavorites(userId: string): string[] {
    try {
      const rows = this.getDb().prepare(`
        SELECT wallpaper_id, wallpaper_url FROM user_wallpaper_favorites WHERE user_id = ? ORDER BY created_at DESC
      `).all(userId) as { wallpaper_id: string; wallpaper_url: string }[];

      return rows.map((r) => r.wallpaper_url || r.wallpaper_id);
    } catch {
      return [];
    }
  }

  public toggleUserFavorite(
    userId: string,
    wallpaperId: string,
    wallpaperUrl: string
  ): { isFavorite: boolean; favorites: string[] } {
    const existing = this.getDb().prepare(`
      SELECT id FROM user_wallpaper_favorites WHERE user_id = ? AND (wallpaper_id = ? OR wallpaper_url = ?)
    `).get(userId, wallpaperId, wallpaperUrl) as { id: string } | undefined;

    if (existing) {
      this.getDb().prepare(`
        DELETE FROM user_wallpaper_favorites WHERE id = ?
      `).run(existing.id);
      return { isFavorite: false, favorites: this.getUserFavorites(userId) };
    } else {
      const id = `fav-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      this.getDb().prepare(`
        INSERT INTO user_wallpaper_favorites (id, user_id, wallpaper_id, wallpaper_url, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, userId, wallpaperId, wallpaperUrl, now);
      return { isFavorite: true, favorites: this.getUserFavorites(userId) };
    }
  }
}
