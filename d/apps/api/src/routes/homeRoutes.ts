import { Router, Request, Response } from "express";
import { ContentRepository } from "../repositories/contentRepository.js";
import { SettingsRepository } from "../repositories/settingsRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { WebSocketManager } from "../websocket/wsServer.js";
import { HomePageContentSchema } from "@nova/shared";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const contentRepo = new ContentRepository();
const settingsRepo = new SettingsRepository();
const activityRepo = new ActivityRepository();
const wsManager = WebSocketManager.getInstance();

// Public: Get published home content and site settings
router.get("/home", (req: Request, res: Response) => {
  try {
    const content = contentRepo.getPublished();
    const settings = settingsRepo.getSettings();

    // Record anonymous pageview asynchronously
    activityRepo.recordPageView(
      "/",
      req.ip,
      req.headers["user-agent"] as string | undefined,
      req.headers["x-visitor-id"] as string | undefined
    );

    res.json({
      success: true,
      content,
      settings: settings.branding,
      seo: settings.seo,
      socials: settings.socials,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get draft & published content
router.get("/admin/home", requireAuth, (req: Request, res: Response) => {
  try {
    const published = contentRepo.getPublished();
    const draft = contentRepo.getDraft();
    const revisions = contentRepo.getRevisions();

    res.json({
      success: true,
      published,
      draft,
      hasDraft: Boolean(draft),
      revisions,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Save draft content
router.put("/admin/home", requireAuth, (req: Request, res: Response) => {
  try {
    const parseResult = HomePageContentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: "Validation error in home content",
        details: parseResult.error.errors,
      });
      return;
    }

    const contentData = {
      ...parseResult.data,
      updatedAt: parseResult.data.updatedAt || new Date().toISOString(),
    };
    const savedDraft = contentRepo.saveDraft(contentData as any, req.user?.username || "admin");

    activityRepo.log(
      "content.draft_saved",
      "content",
      `Saved draft for Home Page (version ${savedDraft.version})`,
      {
        userId: req.user?.id,
        username: req.user?.username,
        ipAddress: req.ip,
        metadata: { version: savedDraft.version },
      }
    );

    wsManager.broadcast("draft_saved", {
      version: savedDraft.version,
      updatedAt: savedDraft.updatedAt,
      author: req.user?.username,
    });

    res.json({
      success: true,
      message: "Draft saved successfully",
      draft: savedDraft,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Publish content
router.post("/admin/home/publish", requireAuth, (req: Request, res: Response) => {
  try {
    // Can publish either the payload provided in body, or the latest saved draft
    let contentToPublish = req.body;
    if (!contentToPublish || !contentToPublish.hero) {
      const draft = contentRepo.getDraft();
      if (!draft) {
        res.status(400).json({
          success: false,
          error: "No draft available to publish and no content payload was provided.",
        });
        return;
      }
      contentToPublish = draft;
    }

    const parseResult = HomePageContentSchema.safeParse(contentToPublish);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: "Validation error in home content",
        details: parseResult.error.errors,
      });
      return;
    }

    const contentData = {
      ...parseResult.data,
      updatedAt: parseResult.data.updatedAt || new Date().toISOString(),
    };
    const published = contentRepo.publish(contentData as any, req.user?.username || "admin");

    activityRepo.log(
      "content.published",
      "content",
      `Published Home Page revision v${published.version}`,
      {
        userId: req.user?.id,
        username: req.user?.username,
        ipAddress: req.ip,
        metadata: { version: published.version, publishedAt: published.publishedAt },
      }
    );

    wsManager.broadcast("content_published", {
      version: published.version,
      publishedAt: published.publishedAt,
      author: req.user?.username,
    });

    res.json({
      success: true,
      message: `Home page revision v${published.version} published successfully!`,
      published,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Reset to default content
router.post("/admin/home/reset", requireAuth, (req: Request, res: Response) => {
  try {
    const defaultHomeContent = {
      version: 1,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

    const published = contentRepo.publish(defaultHomeContent, req.user?.username || "admin");

    activityRepo.log(
      "content.reset",
      "content",
      "Reset Home Page content to default studio template",
      {
        userId: req.user?.id,
        username: req.user?.username,
        ipAddress: req.ip,
      }
    );

    wsManager.broadcast("content_published", {
      version: published.version,
      publishedAt: published.publishedAt,
      author: req.user?.username,
    });

    res.json({
      success: true,
      message: "Home page reset to default configuration successfully",
      published,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
