import { Router, Request, Response } from "express";
import { ExtendedRepository } from "../repositories/extendedRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const extRepo = new ExtendedRepository();
const activityRepo = new ActivityRepository();

// Public: Get tools configuration
router.get("/tools", (_req: Request, res: Response) => {
  try {
    const tools = extRepo.getToolSettings();
    res.json({ success: true, tools });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get tools configuration
router.get("/admin/tools", requireAuth, (_req: Request, res: Response) => {
  try {
    const tools = extRepo.getToolSettings();
    res.json({ success: true, tools });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Update tools configuration
router.put("/admin/tools", requireAuth, (req: Request, res: Response) => {
  try {
    const updated = extRepo.saveToolSettings(req.body, req.user?.username || "admin");
    activityRepo.log(
      "tools.updated",
      "settings",
      `Website Tools (Header, Footer, Sidebar, SEO, Sitemap, LLMs.txt, OpenGraph, Webmaster) updated by ${req.user?.username}`,
      { username: req.user?.username }
    );
    res.json({ success: true, message: "Tools configuration saved successfully", tools: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dynamic XML Sitemap Endpoint (/api/sitemap.xml or /sitemap.xml)
router.get("/sitemap.xml", (req: Request, res: Response) => {
  try {
    const tools = extRepo.getToolSettings();
    const domain = tools.seo.canonicalUrl || `${req.protocol}://${req.get("host")}`;
    const urls = tools.sitemap.customUrls || [
      { url: "/", lastmod: new Date().toISOString().split("T")[0], changefreq: "daily", priority: 1.0 },
      { url: "/team", lastmod: new Date().toISOString().split("T")[0], changefreq: "weekly", priority: 0.8 },
      { url: "/tutorials", lastmod: new Date().toISOString().split("T")[0], changefreq: "weekly", priority: 0.8 },
      { url: "/commands", lastmod: new Date().toISOString().split("T")[0], changefreq: "weekly", priority: 0.8 },
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (item) => `  <url>
    <loc>${domain.replace(/\/$/, "")}${item.url.startsWith("/") ? item.url : "/" + item.url}</loc>
    <lastmod>${item.lastmod || new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${item.changefreq || "weekly"}</changefreq>
    <priority>${item.priority || 0.8}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err: any) {
    res.status(500).send("Error generating sitemap");
  }
});

// Dynamic llms.txt Endpoint (/api/llms.txt or /llms.txt)
router.get("/llms.txt", (req: Request, res: Response) => {
  try {
    const tools = extRepo.getToolSettings();
    const domain = tools.seo.canonicalUrl || `${req.protocol}://${req.get("host")}`;

    const text = `${tools.llmsTxt.studioSummary}

${tools.llmsTxt.guidelines}

## Documentation Links
${tools.llmsTxt.docLinks
  .map((link) => `- [${link.title}](${domain.replace(/\/$/, "")}${link.url}): ${link.description}`)
  .join("\n")}

## API Health & Public Routes
- [API Health Diagnostics](${domain.replace(/\/$/, "")}/api/health): JSON response with node uptime & database status
- [XML Sitemap](${domain.replace(/\/$/, "")}/api/sitemap.xml): Full site index
`;

    res.header("Content-Type", "text/plain; charset=utf-8");
    res.send(text);
  } catch (err: any) {
    res.status(500).send("Error generating llms.txt");
  }
});

// Dynamic robots.txt Endpoint
router.get("/robots.txt", (req: Request, res: Response) => {
  try {
    const tools = extRepo.getToolSettings();
    const domain = tools.seo.canonicalUrl || `${req.protocol}://${req.get("host")}`;

    const text = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /api/*
Allow: /api/sitemap.xml
Allow: /api/llms.txt

Sitemap: ${domain.replace(/\/$/, "")}/api/sitemap.xml
`;

    res.header("Content-Type", "text/plain; charset=utf-8");
    res.send(text);
  } catch (err: any) {
    res.status(500).send("Error generating robots.txt");
  }
});

export default router;

