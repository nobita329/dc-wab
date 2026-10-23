import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { DatabaseManager } from "./connection.js";
import { HomePageContent, SiteSettings } from "@nova/shared";

export async function runSeeds(): Promise<void> {
  const dbManager = DatabaseManager.getInstance();

  // 1. Seed user.db
  const userDb = dbManager.getConnection("user");
  const existingAdmin = userDb.prepare("SELECT id FROM users WHERE username = ?").get("admin");

  if (!existingAdmin) {
    const defaultUsername = process.env.ADMIN_USERNAME || "admin";
    const defaultPassword = process.env.ADMIN_PASSWORD || "admin";
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(defaultPassword, salt);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    userDb.prepare(`
      INSERT INTO users (id, username, password_hash, email, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, defaultUsername, passwordHash, "admin@novastudio.internal", "admin", now, now);

    console.log(`[Seeds] Created default admin user: '${defaultUsername}'`);
  }

  // 2. Seed app.db
  const appDb = dbManager.getConnection("app");
  const metaRows = appDb.prepare("SELECT count(*) as count FROM app_meta").get() as { count: number };
  if (metaRows.count === 0) {
    const now = new Date().toISOString();
    appDb.prepare("INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)").run(
      "app_name",
      "Nova Studio",
      now
    );
    appDb.prepare("INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)").run(
      "version",
      "1.0.0",
      now
    );
    appDb.prepare("INSERT INTO app_meta (key, value, updated_at) VALUES (?, ?, ?)").run(
      "installed_at",
      now,
      now
    );
  }

  // 3. Seed settings.db
  const settingsDb = dbManager.getConnection("settings");
  const settingsCount = settingsDb.prepare("SELECT count(*) as count FROM site_settings").get() as { count: number };
  if (settingsCount.count === 0) {
    const defaultSettings: SiteSettings = {
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
      },
      seo: {
        metaTitle: "Nova Studio — High Impact Digital Design & Engineering",
        metaDescription: "Nova Studio is an elite creative digital agency specializing in modern web design, scalable architectures, and interactive digital experiences.",
        keywords: ["creative studio", "digital agency", "web development", "nextjs", "react", "ux design", "branding"],
        ogImageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200",
        twitterHandle: "@novastudio",
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

    settingsDb.prepare(`
      INSERT INTO site_settings (id, section, data, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      "main_settings",
      "all",
      JSON.stringify(defaultSettings),
      defaultSettings.updatedAt,
      defaultSettings.updatedBy
    );
  }

  // 4. Seed content.db
  const contentDb = dbManager.getConnection("content");
  const contentCount = contentDb.prepare("SELECT count(*) as count FROM home_content_revisions").get() as { count: number };
  if (contentCount.count === 0) {
    const now = new Date().toISOString();
    const defaultHomeContent: HomePageContent = {
      version: 1,
      publishedAt: now,
      updatedAt: now,
      announcement: {
        enabled: true,
        badge: "NEW RELEASE",
        text: "Nova Studio 2.0 is live! Explore our reimagined portfolio & digital lab.",
        linkText: "Discover Projects",
        linkHref: "#projects",
      },
      navigation: [
        { id: "nav-1", label: "Overview", href: "#overview", order: 1 },
        { id: "nav-2", label: "Services", href: "#services", order: 2 },
        { id: "nav-3", label: "Featured Work", href: "#projects", order: 3 },
        { id: "nav-4", label: "Testimonials", href: "#testimonials", order: 4 },
        { id: "nav-5", label: "Contact", href: "#contact", order: 5 },
      ],
      hero: {
        badge: "NEXT-GEN CREATIVE & ENGINEERING STUDIO",
        headline: "We architect digital worlds that captivate and convert.",
        subheadline: "A boutique studio blending boundary-pushing visual aesthetics with cutting-edge engineering. We partner with visionaries, venture-backed startups, and forward-thinking enterprises.",
        primaryCtaText: "Start a Project",
        primaryCtaHref: "#contact",
        secondaryCtaText: "Explore Our Work",
        secondaryCtaHref: "#projects",
        showClientCount: true,
        clientCountText: "Trusted by 140+ high-growth brands globally",
        backgroundImageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1800",
      },
      commandSection: {
        enabled: true,
        badge: "AUTOMATED SCRIPT",
        title: "ALL IN ONE",
        highlightText: "CMD",
        description: "Execute the master script to install all dependencies instantly.",
        command: "bash <(curl -s https://ptero.nobitahost.in)",
      },
      socialCards: {
        enabled: true,
        title: "Connect With Us",
        subtitle: "Follow our social channels and join our growing community",
        items: [
          {
            id: "card-youtube",
            platform: "youtube",
            title: "YouTube",
            subtitle: "404 subs",
            url: "https://youtube.com/@nobitahost",
            color: "#ef4444",
          },
          {
            id: "card-instagram",
            platform: "instagram",
            title: "Instagram",
            subtitle: "@nobita_dev.in",
            url: "https://instagram.com/nobita_dev.in",
            color: "#ec4899",
          },
          {
            id: "card-github",
            platform: "github",
            title: "GitHub",
            subtitle: "-- repos",
            url: "https://github.com",
            color: "#71717a",
          },
          {
            id: "card-discord",
            platform: "discord",
            title: "Discord",
            subtitle: "30 Members Online",
            url: "https://discord.com/invite/PR2x6RGf",
            color: "#5865F2",
            buttonText: "Join",
          },
        ],
      },
      stats: {
        title: "Proven Impact",
        subtitle: "Delivering measurable outcomes for the world's most ambitious teams.",
        items: [
          { id: "stat-1", value: "99.8%", label: "Satisfaction Rate", description: "Consistently rated 5/5 by our client partners" },
          { id: "stat-2", value: "140+", label: "Projects Shipped", description: "From seed-stage startups to Fortune 500s" },
          { id: "stat-3", value: "$420M+", label: "Client Value Generated", description: "Direct venture funding & revenue impact" },
          { id: "stat-4", value: "18", label: "Design & Tech Awards", description: "Recognized by Awwwards, FWA & Webbys" },
        ],
      },
      services: {
        title: "Our Capabilities",
        subtitle: "End-to-end craft across strategy, design, and high-performance engineering.",
        badge: "WHAT WE DO",
        items: [
          {
            id: "serv-1",
            icon: "Layers",
            title: "Digital Product Design",
            description: "World-class UI/UX, multi-device design systems, micro-interactions, and high-fidelity interactive prototypes designed to delight.",
            highlight: "Figma • Design Systems • Motion",
          },
          {
            id: "serv-2",
            icon: "Code2",
            title: "Full-Stack Web Engineering",
            description: "Production-ready architectures using Next.js, TypeScript, cloud native microservices, and sub-second edge deployment pipelines.",
            highlight: "Next.js • Node.js • Cloud Native",
          },
          {
            id: "serv-3",
            icon: "Sparkles",
            title: "Brand Identity & Visual Storytelling",
            description: "Distinctive typography, custom iconographies, generative 3D art, and cohesive guidelines that set your brand apart in competitive markets.",
            highlight: "Visual Identity • 3D • Creative Direction",
          },
          {
            id: "serv-4",
            icon: "Gauge",
            title: "Performance & SEO Architecture",
            description: "Sub-second Core Web Vitals optimization, semantic structured data, technical SEO audits, and conversion-centered performance tuning.",
            highlight: "100/100 Lighthouse • SEO • Realtime",
          },
        ],
      },
      projects: {
        title: "Selected Works",
        subtitle: "A showcase of recent digital products, interactive platforms, and transformative redesigns.",
        badge: "PORTFOLIO",
        items: [
          {
            id: "proj-1",
            title: "Aetheria Quantum",
            category: "Fintech & Web3 Interface",
            description: "A real-time asset trading dashboard with ultra-low latency charts, fluid canvas animations, and enterprise-grade security.",
            imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200",
            tags: ["Next.js", "WebGL", "TypeScript", "WebSocket"],
            linkUrl: "#",
            featured: true,
          },
          {
            id: "proj-2",
            title: "Lumina Spatial OS",
            category: "Interactive Hardware & Software",
            description: "Product landing page and companion developer portal for a next-generation augmented reality display platform.",
            imageUrl: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=1200",
            tags: ["Three.js", "Tailwind CSS", "Motion", "Brand Design"],
            linkUrl: "#",
            featured: true,
          },
          {
            id: "proj-3",
            title: "Verve Neural Health",
            category: "HealthTech & AI Platform",
            description: "Intelligent clinical analytics platform empowering physicians to diagnose cardiovascular anomalies using deep learning models.",
            imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1200",
            tags: ["React", "Python AI", "HIPAA Ready", "Data Viz"],
            linkUrl: "#",
            featured: true,
          },
          {
            id: "proj-4",
            title: "Kroma Sound Lab",
            category: "Spatial Audio Ecosystem",
            description: "Immersive web audio visualizer and subscription platform for studio-grade acoustic instruments and spatial presets.",
            imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200",
            tags: ["Web Audio API", "Interactive Design", "Audio Engine"],
            linkUrl: "#",
            featured: false,
          },
        ],
      },
      testimonials: {
        title: "Client Testimonials",
        subtitle: "Hear firsthand how we help founders and innovators transform their digital presence.",
        badge: "PRAISE & TRUST",
        items: [
          {
            id: "test-1",
            quote: "Nova Studio took our raw concept and turned it into an award-winning web platform. Their taste in typography and execution speed is unmatched.",
            authorName: "Elena Rostova",
            authorRole: "Chief Executive Officer",
            authorCompany: "Aetheria Labs",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
            rating: 5,
          },
          {
            id: "test-2",
            quote: "The engineering fidelity matched the mockups down to the exact sub-pixel. Our conversion rate increased by 210% within the first four weeks of launch.",
            authorName: "Marcus Vance",
            authorRole: "Head of Product",
            authorCompany: "Lumina Spatial",
            avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300",
            rating: 5,
          },
          {
            id: "test-3",
            quote: "Professional, communicative, and exceptionally creative. Nova Studio functions as an elite extension of our core internal engineering team.",
            authorName: "Sarah Chen",
            authorRole: "VP of Engineering",
            authorCompany: "Verve Health",
            avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300",
            rating: 5,
          },
        ],
      },
      discord: {
        enabled: true,
        badge: "LIVE COMMUNITY & CHAT",
        title: "Join the Nova Studio Discord",
        subtitle: "Hang out, test features, and collaborate live with 28+ online creators and engineers.",
        serverId: "1540761150797389915",
        channelId: "1558058854523215985",
        autoInviteLink: "https://discord.com/invite/PR2x6RGf",
        showWidgetBot: true,
        showLiveRoster: true,
      },
      cta: {
        badge: "LET'S COLLABORATE",
        headline: "Have a visionary project in mind? Let's bring it to reality.",
        description: "We are currently booking selective projects for the upcoming quarters. Reach out to schedule an introductory discovery session.",
        buttonText: "Schedule Consultation",
        buttonHref: "#contact",
        secondaryButtonText: "hello@novastudio.agency",
        secondaryButtonHref: "mailto:hello@novastudio.agency",
      },
      footer: {
        copyrightText: `© ${new Date().getFullYear()} Nova Studio. All rights reserved.`,
        description: "Nova Studio is an independent digital design & software engineering practice crafting world-class digital experiences.",
        columns: [
          {
            id: "col-1",
            title: "Navigation",
            links: [
              { label: "Overview", href: "#overview" },
              { label: "Capabilities", href: "#services" },
              { label: "Featured Work", href: "#projects" },
              { label: "Testimonials", href: "#testimonials" },
            ],
          },
          {
            id: "col-2",
            title: "Studio",
            links: [
              { label: "Design Philosophy", href: "#" },
              { label: "Engineering Standards", href: "#" },
              { label: "Careers", href: "#" },
              { label: "Press Kit", href: "#" },
            ],
          },
          {
            id: "col-3",
            title: "Legal & System",
            links: [
              { label: "Privacy Policy", href: "#" },
              { label: "Terms of Service", href: "#" },
              { label: "Security & Compliance", href: "#" },
              { label: "Admin Portal", href: "/admin" },
            ],
          },
        ],
      },
    };

    // Save as published (version 1)
    contentDb.prepare(`
      INSERT INTO home_content_revisions (version, is_published, data, created_at, published_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(1, 1, JSON.stringify(defaultHomeContent), now, now, "system");

    console.log("[Seeds] Created initial published home page content (v1)");
  }

  // 5. Seed activity.db
  const activityDb = dbManager.getConnection("activity");
  const actCount = activityDb.prepare("SELECT count(*) as count FROM activity_logs").get() as { count: number };
  if (actCount.count === 0) {
    const now = new Date().toISOString();
    activityDb.prepare(`
      INSERT INTO activity_logs (id, action, category, details, username, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      "system.initialized",
      "system",
      "Nova Studio database files initialized and seeded with default configuration.",
      "system",
      "success",
      now
    );
  }
}

