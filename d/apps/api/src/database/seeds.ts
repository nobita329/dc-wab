import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { DatabaseManager } from "./connection.js";
import { HomePageContent, SiteSettings } from "@nova/shared";

export async function runSeeds(): Promise<void> {
  const dbManager = DatabaseManager.getInstance();

  // User accounts are created via CLI: `npm run createuser`
  // as per requirement: "Default pelese na ho cmd se bane"

  // 1. Seed app.db
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
        linkText: "Discover Overview",
        linkHref: "#overview",
      },
      navigation: [
        { id: "nav-1", label: "Overview", href: "#overview", order: 1 },
        { id: "nav-5", label: "Contact", href: "#contact", order: 2 },
      ],
      hero: {
        badge: "NEXT-GEN CREATIVE & ENGINEERING STUDIO",
        headline: "We architect digital worlds that captivate and convert.",
        subheadline: "A boutique studio blending boundary-pushing visual aesthetics with cutting-edge engineering. We partner with visionaries, venture-backed startups, and forward-thinking enterprises.",
        primaryCtaText: "Start a Project",
        primaryCtaHref: "#contact",
        secondaryCtaText: "Explore Overview",
        secondaryCtaHref: "#overview",
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
              { label: "Contact", href: "#contact" },
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

  // 6. Seed pricing_plans in content.db
  const planCount = contentDb.prepare("SELECT count(*) as count FROM pricing_plans").get() as { count: number };
  if (planCount.count === 0) {
    const plans = [
      {
        id: "plan-starter",
        name: "Starter Studio",
        price: 29,
        billing_period: "monthly",
        badge: "Essential",
        description: "Ideal for early-stage digital products, solo creators, and landing page showcases.",
        features: JSON.stringify([
          "Custom Single-Page Architecture",
          "Next.js 15 & Tailwind Styling",
          "Fast SQLite Persistence",
          "Discord Presence Widget",
          "Standard Email Support",
        ]),
        is_popular: 0,
        cta_text: "Choose Starter",
        cta_link: "#contact",
        sort_order: 1,
        is_active: 1,
      },
      {
        id: "plan-pro",
        name: "Pro Production",
        price: 79,
        billing_period: "monthly",
        badge: "Most Popular",
        description: "Complete modern digital architecture with full Admin Dashboard, database cluster, and real-time WebSocket.",
        features: JSON.stringify([
          "Everything in Starter",
          "Protected Admin Area (/admin)",
          "Real-time WebSocket Live Sync",
          "6-File SQLite Cluster with WAL Mode",
          "YouTube Data API & Video Gallery",
          "Automated DB Backups & Snapshots",
          "Priority Discord & Slack Support",
        ]),
        is_popular: 1,
        cta_text: "Get Pro Access",
        cta_link: "#contact",
        sort_order: 2,
        is_active: 1,
      },
      {
        id: "plan-enterprise",
        name: "Enterprise Custom",
        price: 199,
        billing_period: "monthly",
        badge: "Full Power",
        description: "Bespoke digital architecture, dedicated multi-tenant setups, and high-frequency real-time pipelines.",
        features: JSON.stringify([
          "Everything in Pro",
          "Custom Monorepo Integrations",
          "Supabase & External DB Connectors",
          "High-Frequency WebSocket Streams",
          "Dedicated Reverse Proxy / Docker Setup",
          "SLA & 24/7 Dedicated Architect",
        ]),
        is_popular: 0,
        cta_text: "Contact Architects",
        cta_link: "#contact",
        sort_order: 3,
        is_active: 1,
      },
    ];

    const now = new Date().toISOString();
    for (const p of plans) {
      contentDb.prepare(`
        INSERT INTO pricing_plans (id, name, price, billing_period, badge, description, features, is_popular, cta_text, cta_link, sort_order, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(p.id, p.name, p.price, p.billing_period, p.badge, p.description, p.features, p.is_popular, p.cta_text, p.cta_link, p.sort_order, p.is_active, now, now);
    }
  }

  // 7. Seed projects in content.db
  const projectCount = contentDb.prepare("SELECT count(*) as count FROM projects").get() as { count: number };
  if (projectCount.count === 0) {
    const projects = [
      {
        id: "proj-1",
        title: "Nova Discord Bot Engine",
        slug: "nova-discord-engine",
        category: "Discord & Real-time",
        description: "High-performance bot engine powering 190+ commands with Lanyard presence and live member streaming.",
        image_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800",
        tags: JSON.stringify(["Node.js", "Discord.js", "WebSocket", "SQLite"]),
        demo_url: "https://discord.com",
        github_url: "https://github.com/nobita329/dc-wab",
        stars_count: 142,
        featured: 1,
        sort_order: 1,
        status: "published",
      },
      {
        id: "proj-2",
        title: "Aura UI Design System",
        slug: "aura-ui-design-system",
        category: "Design System",
        description: "Glassmorphic component kit engineered for high-performance React and Tailwind CSS applications.",
        image_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800",
        tags: JSON.stringify(["React", "Tailwind CSS", "Framer Motion"]),
        demo_url: "/admin",
        github_url: "https://github.com/nobita329/dc-wab",
        stars_count: 89,
        featured: 1,
        sort_order: 2,
        status: "published",
      },
      {
        id: "proj-3",
        title: "SQLite Cluster Manager",
        slug: "sqlite-cluster-manager",
        category: "Backend & Systems",
        description: "Zero-dependency multi-database SQLite coordinator with automated snapshots and WAL journaling.",
        image_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800",
        tags: JSON.stringify(["TypeScript", "node:sqlite", "Express"]),
        demo_url: "/admin/database",
        github_url: "https://github.com/nobita329/dc-wab",
        stars_count: 210,
        featured: 1,
        sort_order: 3,
        status: "published",
      },
    ];

    const now = new Date().toISOString();
    for (const p of projects) {
      contentDb.prepare(`
        INSERT INTO projects (id, title, slug, category, description, image_url, tags, demo_url, github_url, stars_count, featured, sort_order, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(p.id, p.title, p.slug, p.category, p.description, p.image_url, p.tags, p.demo_url, p.github_url, p.stars_count, p.featured, p.sort_order, p.status, now, now);
    }
  }

  // 8. Seed custom_links in content.db
  const linkCount = contentDb.prepare("SELECT count(*) as count FROM custom_links").get() as { count: number };
  if (linkCount.count === 0) {
    const links = [
      { id: "link-1", title: "GitHub Organization", url: "https://github.com/nobita329", category: "Social", icon: "Github", description: "Open-source repositories & automated CI workflows", sort_order: 1 },
      { id: "link-2", title: "Discord Community", url: "https://discord.gg", category: "Community", icon: "MessageSquare", description: "Join 15,000+ members in our live developer hub", sort_order: 2 },
      { id: "link-3", title: "YouTube Tutorials", url: "https://youtube.com", category: "Learning", icon: "Youtube", description: "Step-by-step full-stack walkthroughs", sort_order: 3 },
      { id: "link-4", title: "Architecture Docs", url: "/admin/editor", category: "Documentation", icon: "BookOpen", description: "Design tokens, database schemas, and API guides", sort_order: 4 },
    ];
    const now = new Date().toISOString();
    for (const l of links) {
      contentDb.prepare(`
        INSERT INTO custom_links (id, title, url, category, icon, description, click_count, sort_order, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1, ?, ?)
      `).run(l.id, l.title, l.url, l.category, l.icon, l.description, l.sort_order, now, now);
    }
  }

  // 9. Seed legal_pages in content.db
  const legalCount = contentDb.prepare("SELECT count(*) as count FROM legal_pages").get() as { count: number };
  if (legalCount.count === 0) {
    const legalPages = [
      {
        id: "legal-privacy-policy",
        title: "Privacy Policy",
        slug: "privacy-policy",
        seo_title: "Privacy Policy — Nova Studio",
        seo_description: "Learn how Nova Studio collects, safeguards, and processes your data in compliance with GDPR, CCPA, and global privacy standards.",
        status: "published",
        content: `# Privacy Policy

**Effective Date:** October 30, 2026  
**Last Updated:** October 30, 2026

Welcome to Nova Studio. We are committed to transparency in our data processing practices and respecting your privacy rights under applicable data protection regulations, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).

---

## 1. Information We Collect

### A. Technical & Analytics Data
When you browse Nova Studio, our servers automatically collect non-personally identifiable technical telemetry:
- **IP Addresses:** Anonymized and cryptographically hashed before persistent storage to safeguard visitor identity while mitigating Distributed Denial of Service (DDoS) and brute force attacks.
- **Browser User-Agent & Device Attributes:** Browser type, version, operating system, and screen viewport dimensions.
- **Referral & Interaction URLs:** Referrer header paths and internal navigation timestamps to gauge aggregate page popularity.

### B. User Account & Authentication Data
For authorized administrators and content managers:
- **Credentials:** Username, administrative email address, and cryptographically salted password hashes (utilizing bcrypt with 10 salt rounds). Plaintext passwords are never stored.
- **Session Tokens:** Cryptographically signed JSON Web Tokens (JWT) stored in HTTP-only, secure cookies with strict SameSite constraints.

### C. Direct Communications & Inquiries
When submitting inquiries through our contact or project consultation channels:
- Your name, provided email address, subject matter, and message content.

### D. Third-Party Embedded Services
- **Discord WidgetBot:** Interactive community chat embed. If you interact with the Discord widget, Discord Inc. processes your Discord user profile and messages according to their own Privacy Policy.
- **Embedded Media:** YouTube tutorial embeds and external GitHub repository links.

---

## 2. Why We Collect Your Data
We collect and process your information exclusively for legitimate operational purposes:
1. **Service Delivery & Reliability:** Ensuring the platform loads swiftly, executes scripts without error, and maintains 99.9% uptime.
2. **Security & Threat Defense:** Defending against unauthorized administrative access attempts, spam submissions, and network abuse.
3. **Communication:** Responding to inquiries, creative project requests, and technical support submissions.
4. **Platform Optimization:** Evaluating aggregated traffic trends to refine documentation and user workflows.

---

## 3. Data Sharing & Disclosure
**We do not sell, rent, or trade your personal information to third parties or advertising brokers.**

We disclose information solely under the following verified conditions:
- **Hosting & Infrastructure Providers:** Dedicated cloud instances powering the Linux runtime, Node.js server, and file-based SQLite database cluster.
- **Legal Compliance:** In strict adherence to valid subpoenas, court orders, or enforceable governmental requests where mandated by law.
- **Integrated Services:** If you voluntarily engage with third-party widgets (e.g., Discord chat), data is handled by that third party under their published terms.

---

## 4. Data Retention Periods
- **Analytics & Web Logs:** Aggregated metrics and hashed access records are retained for a maximum of ninety (90) days before automatic rotation and deletion.
- **Session Tokens:** Active administrative sessions expire and are purged after seven (7) days of inactivity.
- **Contact Inquiries:** Message records are retained for up to twelve (12) months for auditing and project continuity, after which they are permanently expunged upon resolution.

---

## 5. Your Privacy Rights
Under global data protection standards (GDPR, CCPA, and equivalent frameworks), you retain the right to:
- **Access:** Request a copy of the personal data we hold relating to you.
- **Rectification:** Request correction of inaccurate or incomplete personal records.
- **Erasure ("Right to be Forgotten"):** Request permanent deletion of your data through our [Data Deletion Portal](/data-deletion).
- **Objection & Restriction:** Object to data processing based on legitimate interests.

---

## 6. Contact Our Privacy Office
For questions, data access requests, or privacy concerns:
- **Email:** [privacy@novastudio.agency](mailto:privacy@novastudio.agency)
- **Web Form:** [Contact & Support](/contact)
- **Physical Address:** Nova Studio Architecture & Engineering, 100 Innovation Boulevard, Tech District.`,
      },
      {
        id: "legal-terms-conditions",
        title: "Terms and Conditions",
        slug: "terms-and-conditions",
        seo_title: "Terms and Conditions — Nova Studio",
        seo_description: "Review the terms and conditions governing the use of Nova Studio's website, showcases, and digital services.",
        status: "published",
        content: `# Terms and Conditions

**Effective Date:** October 30, 2026  
**Last Updated:** October 30, 2026

Please read these Terms and Conditions ("Terms") carefully before using the Nova Studio website and associated digital services operated by Nova Studio ("we", "us", or "our").

---

## 1. Acceptance of Terms
By accessing or using Nova Studio, you agree to be bound by these Terms and our Privacy Policy. If you disagree with any portion of these Terms, you must immediately discontinue use of the platform.

---

## 2. Permitted Use & Codebase Utilities
- Nova Studio grants you a revocable, non-exclusive, non-transferable license to access our portfolio, tutorials, and public showcase materials.
- Automated scripts, terminal commands, and system deployment snippets (including commands provided in the Command Library) are provided for technical demonstration and development purposes. You are solely responsible for executing commands on servers and machines under your authorized control.
- You agree not to use the platform to conduct unauthorized vulnerability scans, interfere with server infrastructure, or transmit malicious code.

---

## 3. Intellectual Property Rights
- All brand logos, UI designs, graphics, visual layout tokens, custom software architectures, and written documentation are the proprietary intellectual property of Nova Studio.
- Open-source components utilized within the platform remain governed by their respective licenses (e.g., MIT, Apache 2.0).
- You may not reproduce, duplicate, copy, or redistribute our proprietary creative assets without express written consent.

---

## 4. Third-Party Integrations & Links
Our website provides links and embedded interfaces to third-party services including GitHub, Discord, YouTube, and Supabase. We exercise no control over the content, security practices, or policies of any external services and accept no responsibility for them.

---

## 5. Disclaimer of Warranties
Nova Studio and its digital tools are provided on an **"AS IS"** and **"AS AVAILABLE"** basis without warranties of any kind, whether express, statutory, or implied, including fitness for a particular purpose or non-infringement.

---

## 6. Limitation of Liability
To the maximum extent permitted by applicable law, Nova Studio and its operators shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your access to or inability to use our platform or executed scripts.

---

## 7. Governing Law & Dispute Resolution
These Terms shall be governed and construed in accordance with the laws applicable to digital commerce and software services, without regard to its conflict of law principles.

---

## 8. Amendments & Updates
We reserve the right to modify these Terms at any time. When modifications occur, the "Last Updated" timestamp at the top will be updated. Continued use of Nova Studio after modifications indicates acceptance of the revised Terms.

---

## 9. Contact Information
For legal inquiries regarding these Terms:
- **Email:** [legal@novastudio.agency](mailto:legal@novastudio.agency)
- **Support Channel:** [/contact](/contact)`,
      },
      {
        id: "legal-cookie-policy",
        title: "Cookie Policy",
        slug: "cookie-policy",
        seo_title: "Cookie Policy — Nova Studio",
        seo_description: "Understand how Nova Studio uses cookies and browser storage to power core functionality and security.",
        status: "published",
        content: `# Cookie Policy

**Effective Date:** October 30, 2026  
**Last Updated:** October 30, 2026

Nova Studio uses cookies, web storage, and related technologies to provide essential functionality, maintain secure administrator sessions, and monitor website health. This Cookie Policy explains what cookies are, how we use them, and how you can manage your preferences.

---

## 1. What Are Cookies?
Cookies are small text files stored on your computer or mobile device when you browse websites. Local storage and session storage are similar browser mechanisms enabling fast, client-side state preservation.

---

## 2. Categories of Storage We Use

### A. Strictly Necessary Cookies
These cookies and storage items are essential for security and platform operation. Without them, authenticated services cannot function:
- **\`nova_token\`:** An encrypted session identifier used to verify authenticated administrative access. It is delivered with \`HttpOnly\`, \`Secure\`, and \`SameSite=Lax\` or \`Strict\` attributes to prevent cross-site scripting (XSS) attacks.

### B. Functional & Preference Storage
These mechanisms remember your custom configuration preferences across visits:
- **\`theme\` (Local Storage):** Preserves your chosen UI display theme (\`dark\` or \`light\`).
- **\`nova_editor_view\` (Local Storage):** Remembers preferred admin interface layout preferences (such as preview split-ratio).

### C. First-Party Analytics Storage
- Transient session identifiers utilized to aggregate page view statistics within our on-premises SQLite analytics system. We do not employ cross-site tracking cookies or third-party advertising cookies (e.g., Google AdSense or Meta Pixel).

---

## 3. Third-Party Cookies
When you interact with integrated external features on our site, third parties may issue cookies:
- **Discord WidgetBot:** If you log into Discord through the embedded chat widget, Discord sets authentication and security cookies necessary for messaging.
- **YouTube Embeds:** Video players may deposit functional cookies to retain playback progress and stream resolution.

---

## 4. How to Manage and Disable Cookies
Most modern browsers allow you to manage cookie settings:
- You can block or delete cookies via your browser's settings (Chrome: Settings → Privacy & Security → Cookies; Firefox: Options → Privacy & Security; Safari: Preferences → Privacy).
- **Please note:** Blocking strictly necessary cookies will prevent login to administrative areas of Nova Studio.

---

## 5. Contact Us
If you have questions about our use of cookies:
- **Email:** [privacy@novastudio.agency](mailto:privacy@novastudio.agency)`,
      },
      {
        id: "legal-copyright-policy",
        title: "Copyright Policy",
        slug: "copyright-policy",
        seo_title: "DMCA & Copyright Policy — Nova Studio",
        seo_description: "Review Nova Studio's DMCA takedown procedures, copyright notices, and intellectual property protection policies.",
        status: "published",
        content: `# DMCA & Copyright Policy

**Effective Date:** October 30, 2026  
**Last Updated:** October 30, 2026

Nova Studio respects the intellectual property rights of creators, developers, and organizations. We expect our visitors and community members to do the same. This Copyright Policy outlines our copyright ownership and procedures for reporting alleged copyright infringement in accordance with the Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512.

---

## 1. Ownership of Materials
Unless otherwise noted, all original graphics, interface elements, typography, digital media, software architecture patterns, and authored text published on Nova Studio are the exclusive property of Nova Studio. All rights are reserved worldwide.

---

## 2. Notification of Alleged Copyright Infringement
If you believe that your copyrighted work has been copied or displayed on Nova Studio in a manner that constitutes copyright infringement, please submit a written notification to our Designated Copyright Agent containing the following information:
1. **Identification of the copyrighted work** claimed to have been infringed, or a representative list if multiple works are involved.
2. **Identification of the material** claimed to be infringing, including the specific URL or location on Nova Studio so we can locate it.
3. **Your contact information:** Full name, mailing address, telephone number, and email address.
4. **Good faith statement:** A statement that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.
5. **Accuracy statement:** A statement made under penalty of perjury that the information in the notification is accurate and that you are the copyright owner or authorized to act on the owner's behalf.
6. **Physical or electronic signature** of the copyright owner or authorized representative.

---

## 3. Designated Copyright Agent
Submit infringement notices to:
- **Attn:** Legal Department — DMCA Agent  
- **Organization:** Nova Studio  
- **Email:** [legal@novastudio.agency](mailto:legal@novastudio.agency)  
- **Subject Line:** *DMCA Copyright Takedown Notice*

---

## 4. Counter-Notification Procedure
If material you submitted or posted has been removed or disabled due to a copyright notice and you believe this was due to mistake or misidentification, you may submit a formal counter-notification to our Designated Copyright Agent containing:
1. Identification of the material removed and its former location.
2. A statement under penalty of perjury that you have a good faith belief the material was removed by mistake or misidentification.
3. Your consent to the jurisdiction of the appropriate federal or local court.
4. Your physical or electronic signature.

Upon receipt of a valid counter-notification, we will forward it to the original complaining party. If no legal action is filed within fourteen (14) business days, we may restore the material.`,
      },
      {
        id: "legal-disclaimer",
        title: "Disclaimer",
        slug: "disclaimer",
        seo_title: "Website & Service Disclaimer — Nova Studio",
        seo_description: "General disclaimer regarding automated shell scripts, technical demonstrations, and external tools.",
        status: "published",
        content: `# Website & Service Disclaimer

**Effective Date:** October 30, 2026  
**Last Updated:** October 30, 2026

The information, software snippets, commands, tutorials, and services provided by Nova Studio are for general technical information and demonstration purposes only.

---

## 1. Technical Commands & Automated Scripts
- The automated bash scripts, CLI commands, and deployment scripts featured in the Command Library and tutorials are provided on an **"AS IS"** basis.
- While our engineering team tests and verifies scripts in controlled environments, executing shell scripts or command-line instructions directly against production servers, game hosts, or virtual machines carries inherent risks.
- **You are solely responsible** for backing up your data, reviewing shell scripts before execution, and ensuring compatibility with your operating environment.
- Nova Studio disclaims all liability for data loss, server downtime, system misconfiguration, or security incidents arising from the execution of referenced commands.

---

## 2. No Professional Advice
Content published on Nova Studio does not constitute formal legal, financial, architectural, or enterprise security advice. Consult with qualified legal counsel or certified systems architects before deploying enterprise-grade infrastructure.

---

## 3. Third-Party Links & External Software
Nova Studio contains references and links to third-party tools, repositories, and software distributions. We do not endorse, guarantee, or assume responsibility for the accuracy or reliability of any information offered by third-party websites or tools linked through our platform.

---

## 4. Limitation of Liability
In no event shall Nova Studio, its developers, contributors, or partners be liable for any direct, indirect, special, incidental, or consequential damages resulting from the use or inability to use the content, documentation, or code available on this site.`,
      },
      {
        id: "legal-data-deletion",
        title: "Data Deletion",
        slug: "data-deletion",
        seo_title: "Account & Data Deletion Instructions — Nova Studio",
        seo_description: "Step-by-step instructions for requesting permanent erasure of your personal data and accounts under GDPR and CCPA.",
        status: "published",
        content: `# Data Deletion & Account Erasure Instructions

**Effective Date:** October 30, 2026  
**Last Updated:** October 30, 2026

At Nova Studio, we respect your right to control your personal data. In compliance with the General Data Protection Regulation (GDPR Article 17 - "Right to Erasure") and California Consumer Privacy Act (CCPA), this page provides clear, actionable instructions on how to request the permanent deletion of your data from our systems.

---

## 1. What Data Can Be Deleted
Upon receiving and verifying your erasure request, we permanently delete:
- **Administrative & User Accounts:** Username, associated email address, salted password hashes, active session tokens, and audit associations.
- **Contact Inquiries & Submissions:** Name, email correspondence, messages, and inquiry records stored in our database.
- **Analytics & IP Hash Records:** Any pseudonymized IP hash identifiers and telemetry entries associated with your sessions.

---

## 2. How to Request Data Deletion

### Method 1: Direct Email Request (Fastest)
Send an email to our dedicated privacy desk:
- **To:** [privacy@novastudio.agency](mailto:privacy@novastudio.agency)
- **Subject:** \`Data Deletion Request — [Your Name or Email]\`
- **Include in Email:**
  1. Your full name.
  2. The email address you used when contacting us or registering an admin account.
  3. A clear statement: *"I hereby request the permanent deletion of all personal data held by Nova Studio associated with this email address."*

### Method 2: Web Submission
You can also initiate your deletion request directly via our [Contact Form](/contact):
1. Select the subject: **Privacy & Data Erasure**.
2. Provide your verified email address.
3. In the message box, specify your request for account or data erasure.

---

## 3. Verification & Processing Timeline
1. **Identity Verification:** To protect your security and prevent fraudulent deletion requests, we may send a confirmation link or verification code to the email address on record.
2. **Processing Window:** Once verified, your request is processed within **thirty (30) calendar days** at no charge to you.
3. **Written Confirmation:** Once the purge is complete, our compliance team will transmit an official confirmation email documenting that your personal data has been permanently expunged from our active databases and backup rotations.

---

## 4. Exceptions Required by Law
Certain minimal records may be retained temporarily where strictly required to fulfill statutory legal obligations (such as tax/financial records if commercial work was contracted) or to establish defense against active legal disputes, in accordance with GDPR Article 17(3).

---

## 5. Contact Privacy Compliance
If you have any questions regarding our data deletion workflow:
- **Email:** [privacy@novastudio.agency](mailto:privacy@novastudio.agency)
- **Help Center:** [Contact Page](/contact)`,
      },
      {
        id: "legal-contact",
        title: "Contact & Inquiries",
        slug: "contact",
        seo_title: "Contact & Legal Inquiries — Nova Studio",
        seo_description: "Connect with Nova Studio for design partnerships, technical consulting, and legal or privacy compliance requests.",
        status: "published",
        content: `# Contact & Legal Inquiries

Have questions regarding our architectural engineering, design services, or privacy and legal compliance? Get in touch with our team directly.

---

## Direct Inquiries
- **General & New Projects:** [hello@novastudio.agency](mailto:hello@novastudio.agency)
- **Privacy & Data Requests:** [privacy@novastudio.agency](mailto:privacy@novastudio.agency)
- **Legal & Copyright (DMCA):** [legal@novastudio.agency](mailto:legal@novastudio.agency)

---

## Studio Headquarters
Nova Studio Creative Design & Engineering  
100 Innovation Boulevard, Tech District  
Open Monday – Friday, 09:00 to 18:00 UTC`,
      },
    ];

    const now = new Date().toISOString();
    for (const page of legalPages) {
      contentDb.prepare(`
        INSERT INTO legal_pages (id, title, slug, content, status, seo_title, seo_description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(page.id, page.title, page.slug, page.content, page.status, page.seo_title, page.seo_description, now, now);
    }
    console.log("[Seeds] Seeded 7 default legal pages.");
  }
}

