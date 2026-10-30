import crypto from "node:crypto";
import { DatabaseManager } from "../database/connection.js";

export interface PlanItem {
  id: string;
  name: string;
  price: number;
  billingPeriod: "monthly" | "yearly";
  badge: string;
  description: string;
  features: string[];
  isPopular: boolean;
  ctaText: string;
  ctaLink: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  imageUrl: string;
  tags: string[];
  demoUrl: string;
  githubUrl: string;
  starsCount: number;
  featured: boolean;
  sortOrder: number;
  status: "published" | "draft";
  createdAt: string;
  updatedAt: string;
}

export interface CustomLinkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  icon: string;
  description: string;
  clickCount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AboutSettings {
  id: string;
  story: string;
  mission: string;
  vision: string;
  yearsExperience: number;
  projectsDelivered: number;
  happyClients: number;
  coreValues: Array<{ id: string; title: string; description: string; icon: string }>;
  milestones: Array<{ id: string; year: string; title: string; description: string }>;
  updatedAt: string;
  updatedBy: string;
}

export interface ToolSettings {
  header: {
    logoText: string;
    logoImage: string;
    announcementText: string;
    announcementBadge: string;
    announcementLink: string;
    showAnnouncement: boolean;
    navLinks: Array<{ label: string; href: string }>;
    ctaText: string;
    ctaHref: string;
  };
  footer: {
    tagline: string;
    copyrightText: string;
    columns: Array<{
      title: string;
      links: Array<{ label: string; href: string }>;
    }>;
  };
  sidebar: {
    blur: number;
    transparency: number;
    enableSticky: boolean;
    style: "glass" | "solid" | "minimal";
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl: string;
    author: string;
    robotsDirective: string;
  };
  sitemap: {
    autoGenerate: boolean;
    changeFrequency: string;
    priority: number;
    customUrls: Array<{ url: string; lastmod: string; changefreq: string; priority: number }>;
  };
  llmsTxt: {
    studioSummary: string;
    guidelines: string;
    docLinks: Array<{ title: string; url: string; description: string }>;
    enableEndpoint: boolean;
  };
  openGraph: {
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    twitterCard: "summary_large_image" | "summary";
    fbAppId?: string;
  };
  bingWebmaster: {
    bingVerificationCode: string;
    googleVerificationCode: string;
    yandexVerificationCode: string;
    baiduVerificationCode: string;
    autoSubmitUrls: boolean;
  };
}

export class ExtendedRepository {
  private getContentDb() {
    return DatabaseManager.getInstance().getConnection("content");
  }

  private getSettingsDb() {
    return DatabaseManager.getInstance().getConnection("settings");
  }

  private getApiDb() {
    return DatabaseManager.getInstance().getConnection("api");
  }

  // ========================================================
  // Plans
  // ========================================================
  public getPlans(): PlanItem[] {
    const rows = this.getContentDb()
      .prepare("SELECT * FROM pricing_plans ORDER BY sort_order ASC, created_at ASC")
      .all() as any[];

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      price: r.price,
      billingPeriod: r.billing_period,
      badge: r.badge || "",
      description: r.description || "",
      features: JSON.parse(r.features || "[]"),
      isPopular: Boolean(r.is_popular),
      ctaText: r.cta_text || "Get Started",
      ctaLink: r.cta_link || "#contact",
      sortOrder: r.sort_order || 0,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public createPlan(data: Partial<PlanItem>): PlanItem {
    const now = new Date().toISOString();
    const id = data.id || crypto.randomUUID();
    const name = data.name || "New Plan";
    const price = data.price ?? 49;
    const billingPeriod = data.billingPeriod || "monthly";
    const badge = data.badge || "";
    const description = data.description || "";
    const features = JSON.stringify(data.features || ["Feature 1", "Feature 2"]);
    const isPopular = data.isPopular ? 1 : 0;
    const ctaText = data.ctaText || "Get Started";
    const ctaLink = data.ctaLink || "#contact";
    const sortOrder = data.sortOrder ?? 0;
    const isActive = data.isActive !== false ? 1 : 0;

    this.getContentDb()
      .prepare(`
        INSERT INTO pricing_plans (id, name, price, billing_period, badge, description, features, is_popular, cta_text, cta_link, sort_order, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(id, name, price, billingPeriod, badge, description, features, isPopular, ctaText, ctaLink, sortOrder, isActive, now, now);

    return {
      id,
      name,
      price,
      billingPeriod,
      badge,
      description,
      features: JSON.parse(features),
      isPopular: Boolean(isPopular),
      ctaText,
      ctaLink,
      sortOrder,
      isActive: Boolean(isActive),
      createdAt: now,
      updatedAt: now,
    };
  }

  public updatePlan(id: string, data: Partial<PlanItem>): PlanItem | null {
    const existing = this.getContentDb()
      .prepare("SELECT * FROM pricing_plans WHERE id = ?")
      .get(id) as any;
    if (!existing) return null;

    const now = new Date().toISOString();
    const name = data.name !== undefined ? data.name : existing.name;
    const price = data.price !== undefined ? data.price : existing.price;
    const billingPeriod = data.billingPeriod !== undefined ? data.billingPeriod : existing.billing_period;
    const badge = data.badge !== undefined ? data.badge : existing.badge;
    const description = data.description !== undefined ? data.description : existing.description;
    const features = data.features !== undefined ? JSON.stringify(data.features) : existing.features;
    const isPopular = data.isPopular !== undefined ? (data.isPopular ? 1 : 0) : existing.is_popular;
    const ctaText = data.ctaText !== undefined ? data.ctaText : existing.cta_text;
    const ctaLink = data.ctaLink !== undefined ? data.ctaLink : existing.cta_link;
    const sortOrder = data.sortOrder !== undefined ? data.sortOrder : existing.sort_order;
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : existing.is_active;

    this.getContentDb()
      .prepare(`
        UPDATE pricing_plans
        SET name = ?, price = ?, billing_period = ?, badge = ?, description = ?, features = ?, is_popular = ?, cta_text = ?, cta_link = ?, sort_order = ?, is_active = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(name, price, billingPeriod, badge, description, features, isPopular, ctaText, ctaLink, sortOrder, isActive, now, id);

    return {
      id,
      name,
      price,
      billingPeriod,
      badge,
      description,
      features: JSON.parse(features),
      isPopular: Boolean(isPopular),
      ctaText,
      ctaLink,
      sortOrder,
      isActive: Boolean(isActive),
      createdAt: existing.created_at,
      updatedAt: now,
    };
  }

  public deletePlan(id: string): boolean {
    const res = this.getContentDb().prepare("DELETE FROM pricing_plans WHERE id = ?").run(id);
    return (res.changes ?? 0) > 0;
  }

  // ========================================================
  // Projects
  // ========================================================
  public getProjects(): ProjectItem[] {
    const rows = this.getContentDb()
      .prepare("SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC")
      .all() as any[];

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      category: r.category || "Web Application",
      description: r.description || "",
      imageUrl: r.image_url || "",
      tags: JSON.parse(r.tags || "[]"),
      demoUrl: r.demo_url || "",
      githubUrl: r.github_url || "",
      starsCount: r.stars_count || 0,
      featured: Boolean(r.featured),
      sortOrder: r.sort_order || 0,
      status: r.status || "published",
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public createProject(data: Partial<ProjectItem>): ProjectItem {
    const now = new Date().toISOString();
    const id = data.id || crypto.randomUUID();
    const title = data.title || "New Project";
    const slug =
      data.slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
        "-" +
        Date.now().toString().slice(-4);
    const category = data.category || "Web Application";
    const description = data.description || "";
    const imageUrl = data.imageUrl || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800";
    const tags = JSON.stringify(data.tags || ["Next.js", "TypeScript"]);
    const demoUrl = data.demoUrl || "";
    const githubUrl = data.githubUrl || "";
    const starsCount = data.starsCount ?? 12;
    const featured = data.featured ? 1 : 0;
    const sortOrder = data.sortOrder ?? 0;
    const status = data.status || "published";

    this.getContentDb()
      .prepare(`
        INSERT INTO projects (id, title, slug, category, description, image_url, tags, demo_url, github_url, stars_count, featured, sort_order, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(id, title, slug, category, description, imageUrl, tags, demoUrl, githubUrl, starsCount, featured, sortOrder, status, now, now);

    return {
      id,
      title,
      slug,
      category,
      description,
      imageUrl,
      tags: JSON.parse(tags),
      demoUrl,
      githubUrl,
      starsCount,
      featured: Boolean(featured),
      sortOrder,
      status,
      createdAt: now,
      updatedAt: now,
    };
  }

  public updateProject(id: string, data: Partial<ProjectItem>): ProjectItem | null {
    const existing = this.getContentDb()
      .prepare("SELECT * FROM projects WHERE id = ?")
      .get(id) as any;
    if (!existing) return null;

    const now = new Date().toISOString();
    const title = data.title !== undefined ? data.title : existing.title;
    const slug = data.slug !== undefined ? data.slug : existing.slug;
    const category = data.category !== undefined ? data.category : existing.category;
    const description = data.description !== undefined ? data.description : existing.description;
    const imageUrl = data.imageUrl !== undefined ? data.imageUrl : existing.image_url;
    const tags = data.tags !== undefined ? JSON.stringify(data.tags) : existing.tags;
    const demoUrl = data.demoUrl !== undefined ? data.demoUrl : existing.demo_url;
    const githubUrl = data.githubUrl !== undefined ? data.githubUrl : existing.github_url;
    const starsCount = data.starsCount !== undefined ? data.starsCount : existing.stars_count;
    const featured = data.featured !== undefined ? (data.featured ? 1 : 0) : existing.featured;
    const sortOrder = data.sortOrder !== undefined ? data.sortOrder : existing.sort_order;
    const status = data.status !== undefined ? data.status : existing.status;

    this.getContentDb()
      .prepare(`
        UPDATE projects
        SET title = ?, slug = ?, category = ?, description = ?, image_url = ?, tags = ?, demo_url = ?, github_url = ?, stars_count = ?, featured = ?, sort_order = ?, status = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(title, slug, category, description, imageUrl, tags, demoUrl, githubUrl, starsCount, featured, sortOrder, status, now, id);

    return {
      id,
      title,
      slug,
      category,
      description,
      imageUrl,
      tags: JSON.parse(tags),
      demoUrl,
      githubUrl,
      starsCount,
      featured: Boolean(featured),
      sortOrder,
      status,
      createdAt: existing.created_at,
      updatedAt: now,
    };
  }

  public deleteProject(id: string): boolean {
    const res = this.getContentDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
    return (res.changes ?? 0) > 0;
  }

  // ========================================================
  // Custom Links
  // ========================================================
  public getLinks(): CustomLinkItem[] {
    const rows = this.getContentDb()
      .prepare("SELECT * FROM custom_links ORDER BY sort_order ASC, created_at ASC")
      .all() as any[];

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      category: r.category || "General",
      icon: r.icon || "Globe",
      description: r.description || "",
      clickCount: r.click_count || 0,
      sortOrder: r.sort_order || 0,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public createLink(data: Partial<CustomLinkItem>): CustomLinkItem {
    const now = new Date().toISOString();
    const id = data.id || crypto.randomUUID();
    const title = data.title || "New Link";
    const url = data.url || "https://novastudio.internal";
    const category = data.category || "General";
    const icon = data.icon || "Globe";
    const description = data.description || "";
    const clickCount = data.clickCount ?? 0;
    const sortOrder = data.sortOrder ?? 0;
    const isActive = data.isActive !== false ? 1 : 0;

    this.getContentDb()
      .prepare(`
        INSERT INTO custom_links (id, title, url, category, icon, description, click_count, sort_order, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(id, title, url, category, icon, description, clickCount, sortOrder, isActive, now, now);

    return {
      id,
      title,
      url,
      category,
      icon,
      description,
      clickCount,
      sortOrder,
      isActive: Boolean(isActive),
      createdAt: now,
      updatedAt: now,
    };
  }

  public updateLink(id: string, data: Partial<CustomLinkItem>): CustomLinkItem | null {
    const existing = this.getContentDb()
      .prepare("SELECT * FROM custom_links WHERE id = ?")
      .get(id) as any;
    if (!existing) return null;

    const now = new Date().toISOString();
    const title = data.title !== undefined ? data.title : existing.title;
    const url = data.url !== undefined ? data.url : existing.url;
    const category = data.category !== undefined ? data.category : existing.category;
    const icon = data.icon !== undefined ? data.icon : existing.icon;
    const description = data.description !== undefined ? data.description : existing.description;
    const clickCount = data.clickCount !== undefined ? data.clickCount : existing.click_count;
    const sortOrder = data.sortOrder !== undefined ? data.sortOrder : existing.sort_order;
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : existing.is_active;

    this.getContentDb()
      .prepare(`
        UPDATE custom_links
        SET title = ?, url = ?, category = ?, icon = ?, description = ?, click_count = ?, sort_order = ?, is_active = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(title, url, category, icon, description, clickCount, sortOrder, isActive, now, id);

    return {
      id,
      title,
      url,
      category,
      icon,
      description,
      clickCount,
      sortOrder,
      isActive: Boolean(isActive),
      createdAt: existing.created_at,
      updatedAt: now,
    };
  }

  public deleteLink(id: string): boolean {
    const res = this.getContentDb().prepare("DELETE FROM custom_links WHERE id = ?").run(id);
    return (res.changes ?? 0) > 0;
  }

  // ========================================================
  // About Settings
  // ========================================================
  public getAbout(): AboutSettings {
    const row = this.getSettingsDb()
      .prepare("SELECT * FROM about_settings WHERE id = 'main_about'")
      .get() as any;

    if (!row) {
      const defaultAbout: AboutSettings = {
        id: "main_about",
        story:
          "Founded in 2021, Nova Studio crafts high-performance digital architectures, bespoke web applications, and immersive digital brand experiences for forward-thinking engineering teams worldwide.",
        mission:
          "To empower digital creators and tech startups with resilient, lightning-fast digital tools and sublime visual designs.",
        vision:
          "A borderless creative technology ecosystem where design aesthetics and engineering rigor merge effortlessly.",
        yearsExperience: 5,
        projectsDelivered: 140,
        happyClients: 95,
        coreValues: [
          {
            id: "1",
            title: "Obsession with Performance",
            description: "Sub-second load times and silky 60fps animations across all screen sizes.",
            icon: "Zap",
          },
          {
            id: "2",
            title: "Architectural Integrity",
            description: "Modular, typed SQLite and Next.js foundations engineered to scale without bloat.",
            icon: "Layers",
          },
          {
            id: "3",
            title: "Design Precision",
            description: "Glassmorphism, custom typography, and purposeful micro-interactions.",
            icon: "Sparkles",
          },
        ],
        milestones: [
          {
            id: "1",
            year: "2021",
            title: "Studio Founded",
            description: "Nova Studio opened with 2 software architects in Singapore.",
          },
          {
            id: "2",
            year: "2023",
            title: "50+ Enterprise Clients",
            description: "Expanded global operations across web engineering and custom Discord bots.",
          },
          {
            id: "3",
            year: "2026",
            title: "Nova 2.0 Monorepo Release",
            description: "Unveiled full SQLite cluster, Next.js 15, and real-time WebSocket infrastructure.",
          },
        ],
        updatedAt: new Date().toISOString(),
        updatedBy: "system",
      };

      this.saveAbout(defaultAbout, "system");
      return defaultAbout;
    }

    return {
      id: row.id,
      story: row.story,
      mission: row.mission,
      vision: row.vision,
      yearsExperience: row.years_experience,
      projectsDelivered: row.projects_delivered,
      happyClients: row.happy_clients,
      coreValues: JSON.parse(row.core_values || "[]"),
      milestones: JSON.parse(row.milestones || "[]"),
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    };
  }

  public saveAbout(data: Partial<AboutSettings>, updatedBy: string): AboutSettings {
    const now = new Date().toISOString();
    const story = data.story || "";
    const mission = data.mission || "";
    const vision = data.vision || "";
    const yearsExperience = data.yearsExperience ?? 5;
    const projectsDelivered = data.projectsDelivered ?? 140;
    const happyClients = data.happyClients ?? 95;
    const coreValues = JSON.stringify(data.coreValues || []);
    const milestones = JSON.stringify(data.milestones || []);

    this.getSettingsDb()
      .prepare(`
        INSERT INTO about_settings (id, story, mission, vision, years_experience, projects_delivered, happy_clients, core_values, milestones, updated_at, updated_by)
        VALUES ('main_about', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          story = excluded.story,
          mission = excluded.mission,
          vision = excluded.vision,
          years_experience = excluded.years_experience,
          projects_delivered = excluded.projects_delivered,
          happy_clients = excluded.happy_clients,
          core_values = excluded.core_values,
          milestones = excluded.milestones,
          updated_at = excluded.updated_at,
          updated_by = excluded.updated_by
      `)
      .run(story, mission, vision, yearsExperience, projectsDelivered, happyClients, coreValues, milestones, now, updatedBy);

    return this.getAbout();
  }

  // ========================================================
  // Tools Settings (Header, Footer, Sidebar, SEO, Sitemap, llms.txt, OpenGraph, Bing)
  // ========================================================
  public getToolSettings(): ToolSettings {
    const row = this.getSettingsDb()
      .prepare("SELECT config FROM tool_settings WHERE tool_name = 'all_tools'")
      .get() as any;

    if (!row) {
      const defaults: ToolSettings = {
        header: {
          logoText: "NOVA STUDIO",
          logoImage: "",
          announcementText: "✦ Introducing Nova Studio 2.0 with Real-time SQLite & Modern Dashboard",
          announcementBadge: "New Release",
          announcementLink: "/admin",
          showAnnouncement: true,
          navLinks: [
            { label: "Home", href: "/" },
            { label: "Team", href: "/team" },
            { label: "Tutorials", href: "/tutorials" },
            { label: "Commands", href: "/commands" },
            { label: "Admin", href: "/admin" },
          ],
          ctaText: "Start Project",
          ctaHref: "#contact",
        },
        footer: {
          tagline: "High-performance digital design & web software studio.",
          copyrightText: "© 2026 Nova Studio. All rights reserved.",
          columns: [
            {
              title: "Product",
              links: [
                { label: "Showcase", href: "/" },
                { label: "Command Library", href: "/commands" },
                { label: "Tutorials", href: "/tutorials" },
              ],
            },
            {
              title: "Community",
              links: [
                { label: "Discord Server", href: "https://discord.gg" },
                { label: "Team Presence", href: "/team" },
                { label: "GitHub Repository", href: "https://github.com/nobita329/dc-wab" },
              ],
            },
            {
              title: "Admin",
              links: [
                { label: "Control Panel", href: "/admin" },
                { label: "Visual Editor", href: "/admin/editor" },
                { label: "System Status", href: "/admin/api-status" },
              ],
            },
          ],
        },
        sidebar: {
          blur: 16,
          transparency: 35,
          enableSticky: true,
          style: "glass",
        },
        seo: {
          metaTitle: "Nova Studio — Modern Creative & Engineering Studio",
          metaDescription:
            "Nova Studio crafts high-performance digital experiences, modern web applications, and immersive brand designs.",
          keywords: ["creative studio", "digital agency", "web development", "nextjs", "react", "ux design", "branding"],
          canonicalUrl: "http://localhost:3001",
          author: "Nova Studio Team",
          robotsDirective: "index, follow",
        },
        sitemap: {
          autoGenerate: true,
          changeFrequency: "weekly",
          priority: 0.8,
          customUrls: [
            { url: "/", lastmod: new Date().toISOString().split("T")[0], changefreq: "daily", priority: 1.0 },
            { url: "/team", lastmod: new Date().toISOString().split("T")[0], changefreq: "weekly", priority: 0.8 },
            { url: "/tutorials", lastmod: new Date().toISOString().split("T")[0], changefreq: "weekly", priority: 0.8 },
            { url: "/commands", lastmod: new Date().toISOString().split("T")[0], changefreq: "weekly", priority: 0.8 },
          ],
        },
        llmsTxt: {
          studioSummary:
            "# Nova Studio\n> Modern Creative Digital Agency & High-Performance Web Software\n\nNova Studio specializes in modern Next.js 15 architectures, SQLite file clusters, TypeScript, Discord API integrations, and immersive glassmorphic UI designs.",
          guidelines:
            "## Architecture\n- Monorepo structure using NPM Workspaces (`apps/web`, `apps/api`, `shared`)\n- SQLite multi-database engine with WAL mode\n- REST & WebSocket real-time event pipeline",
          docLinks: [
            { title: "Team Showcase API", url: "/api/team", description: "Team members & Lanyard presence" },
            { title: "Discord Commands API", url: "/api/commands", description: "192 categorised commands" },
            { title: "API Health Diagnostics", url: "/api/health", description: "Node diagnostics & DB status" },
          ],
          enableEndpoint: true,
        },
        openGraph: {
          ogTitle: "Nova Studio ✦ Digital Architecture & Web Application",
          ogDescription: "Crafting transcendent digital experiences, immersive brands, and high-performance web applications.",
          ogImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
          twitterCard: "summary_large_image",
          fbAppId: "",
        },
        bingWebmaster: {
          bingVerificationCode: "BING_VERIFICATION_TOKEN_NOVA_STUDIO",
          googleVerificationCode: "google-site-verification=NOVA_STUDIO_TOKEN",
          yandexVerificationCode: "yandex-verification-token",
          baiduVerificationCode: "",
          autoSubmitUrls: true,
        },
      };

      this.saveToolSettings(defaults, "system");
      return defaults;
    }

    return JSON.parse(row.config);
  }

  public saveToolSettings(settings: ToolSettings, updatedBy: string): ToolSettings {
    const now = new Date().toISOString();
    this.getSettingsDb()
      .prepare(`
        INSERT INTO tool_settings (id, tool_name, config, updated_at, updated_by)
        VALUES ('tool_settings_main', 'all_tools', ?, ?, ?)
        ON CONFLICT(tool_name) DO UPDATE SET
          config = excluded.config,
          updated_at = excluded.updated_at,
          updated_by = excluded.updated_by
      `)
      .run(JSON.stringify(settings), now, updatedBy);

    return settings;
  }

  // ========================================================
  // GitHub Integration Settings
  // ========================================================
  public getGitHubConfig(): {
    repoOwner: string;
    repoName: string;
    githubToken: string;
    autoSync: boolean;
    webhookSecret: string;
    syncStars: boolean;
    syncReleases: boolean;
    lastSyncedAt: string;
  } {
    const row = this.getApiDb()
      .prepare("SELECT config, updated_at FROM api_integrations WHERE service_name = 'github'")
      .get() as any;

    if (!row) {
      return {
        repoOwner: "nobita329",
        repoName: "dc-wab",
        githubToken: "",
        autoSync: true,
        webhookSecret: "whsec_nova_studio_github_sync",
        syncStars: true,
        syncReleases: true,
        lastSyncedAt: new Date().toISOString(),
      };
    }

    return {
      ...JSON.parse(row.config),
      lastSyncedAt: row.updated_at,
    };
  }

  public saveGitHubConfig(config: any): void {
    const now = new Date().toISOString();
    this.getApiDb()
      .prepare(`
        INSERT INTO api_integrations (id, service_name, config, is_enabled, updated_at)
        VALUES ('int_github', 'github', ?, 1, ?)
        ON CONFLICT(id) DO UPDATE SET
          config = excluded.config,
          updated_at = excluded.updated_at
      `)
      .run(JSON.stringify(config), now);
  }

  // ========================================================
  // Supabase Integration Settings
  // ========================================================
  public getSupabaseConfig(): {
    projectUrl: string;
    anonKey: string;
    serviceRoleKey: string;
    dbHost: string;
    dbPort: string;
    dbName: string;
    dbUser: string;
    dbPassword: string;
    syncEnabled: boolean;
    lastSyncedAt: string;
  } {
    const row = this.getApiDb()
      .prepare("SELECT config, updated_at FROM api_integrations WHERE service_name = 'supabase'")
      .get() as any;

    if (!row) {
      return {
        projectUrl: "https://xyzcompany.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        serviceRoleKey: "",
        dbHost: "db.xyzcompany.supabase.co",
        dbPort: "5432",
        dbName: "postgres",
        dbUser: "postgres",
        dbPassword: "••••••••••••",
        syncEnabled: false,
        lastSyncedAt: new Date().toISOString(),
      };
    }

    return {
      ...JSON.parse(row.config),
      lastSyncedAt: row.updated_at,
    };
  }

  public saveSupabaseConfig(config: any): void {
    const now = new Date().toISOString();
    this.getApiDb()
      .prepare(`
        INSERT INTO api_integrations (id, service_name, config, is_enabled, updated_at)
        VALUES ('int_supabase', 'supabase', ?, 1, ?)
        ON CONFLICT(id) DO UPDATE SET
          config = excluded.config,
          updated_at = excluded.updated_at
      `)
      .run(JSON.stringify(config), now);
  }

  // ========================================================
  // Legal Pages
  // ========================================================
  public getLegalPages(onlyPublished = false): any[] {
    const query = onlyPublished
      ? "SELECT * FROM legal_pages WHERE status = 'published' ORDER BY title ASC"
      : "SELECT * FROM legal_pages ORDER BY updated_at DESC";
    return this.getContentDb().prepare(query).all();
  }

  public getLegalPageBySlug(slug: string, onlyPublished = false): any | null {
    const query = onlyPublished
      ? "SELECT * FROM legal_pages WHERE slug = ? AND status = 'published' LIMIT 1"
      : "SELECT * FROM legal_pages WHERE slug = ? LIMIT 1";
    const row = this.getContentDb().prepare(query).get(slug);
    return row || null;
  }

  public getLegalPageById(id: string): any | null {
    const row = this.getContentDb()
      .prepare("SELECT * FROM legal_pages WHERE id = ? LIMIT 1")
      .get(id);
    return row || null;
  }

  public createLegalPage(data: any): any {
    const id = data.id || `legal-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    this.getContentDb().prepare(`
      INSERT INTO legal_pages (id, title, slug, content, status, seo_title, seo_description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.title,
      data.slug,
      data.content,
      data.status || "published",
      data.seo_title || `${data.title} — Nova Studio`,
      data.seo_description || "",
      now,
      now
    );
    return this.getLegalPageById(id);
  }

  public updateLegalPage(id: string, data: any): any | null {
    const existing = this.getLegalPageById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    this.getContentDb().prepare(`
      UPDATE legal_pages SET
        title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        content = COALESCE(?, content),
        status = COALESCE(?, status),
        seo_title = COALESCE(?, seo_title),
        seo_description = COALESCE(?, seo_description),
        updated_at = ?
      WHERE id = ?
    `).run(
      data.title ?? null,
      data.slug ?? null,
      data.content ?? null,
      data.status ?? null,
      data.seo_title ?? null,
      data.seo_description ?? null,
      now,
      id
    );
    return this.getLegalPageById(id);
  }

  public setLegalPageStatus(id: string, status: "published" | "draft"): any | null {
    const existing = this.getLegalPageById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    this.getContentDb().prepare(`
      UPDATE legal_pages SET status = ?, updated_at = ? WHERE id = ?
    `).run(status, now, id);
    return this.getLegalPageById(id);
  }

  public deleteLegalPage(id: string): boolean {
    const res = this.getContentDb().prepare("DELETE FROM legal_pages WHERE id = ?").run(id);
    return (res as any).changes > 0;
  }

  // ========================================================
  // Contact Submissions
  // ========================================================
  public saveContactSubmission(data: { name: string; email: string; subject?: string; message: string; ipAddress?: string }): any {
    const id = `contact-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    this.getContentDb().prepare(`
      INSERT INTO contact_submissions (id, name, email, subject, message, ip_address, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'unread', ?)
    `).run(
      id,
      data.name,
      data.email,
      data.subject || "General Inquiry",
      data.message,
      data.ipAddress || "",
      now
    );
    return { id, createdAt: now };
  }

  public getContactSubmissions(limit = 50): any[] {
    return this.getContentDb().prepare("SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT ?").all(limit);
  }

  public updateContactSubmissionStatus(id: string, status: string): boolean {
    const res = this.getContentDb().prepare("UPDATE contact_submissions SET status = ? WHERE id = ?").run(status, id);
    return (res as any).changes > 0;
  }
}

