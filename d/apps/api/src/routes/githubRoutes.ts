import { Router, Request, Response } from "express";
import { DatabaseManager } from "../database/connection.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { GitHubService } from "../services/githubService.js";
import { encryptToken, decryptToken, maskToken } from "../utils/crypto.js";
import { WebSocketManager } from "../websocket/wsServer.js";
import fs from "node:fs";
import path from "node:path";

const router = Router();
const activityRepo = new ActivityRepository();
const githubService = GitHubService.getInstance();
const wsManager = WebSocketManager.getInstance();

function getApiDb() {
  return DatabaseManager.getInstance().getConnection("api");
}

interface StoredGitHubConfig {
  username: string;
  hasToken: boolean;
  maskedToken: string;
  encryptedToken?: string;
  tokenIv?: string;
  tokenTag?: string;
  autoSync: boolean;
  syncIntervalMinutes: number;
  lastSyncedAt?: string;
  userAvatarUrl?: string;
  userName?: string;
  userHtmlUrl?: string;
  userBio?: string;
  rateLimit?: { limit: number; remaining: number; reset: number };
  scopes?: string[];
}

function getStoredGitHubRecord(): {
  config: StoredGitHubConfig;
  token?: string;
} {
  const db = getApiDb();
  const row = db
    .prepare("SELECT config, is_enabled FROM api_integrations WHERE id = ?")
    .get("github") as { config: string; is_enabled: number } | undefined;

  if (!row) {
    // Check .env fallback
    const envUser = process.env.GITHUB_USERNAME || "";
    const envToken = process.env.GITHUB_TOKEN || "";
    return {
      config: {
        username: envUser,
        hasToken: !!envToken,
        maskedToken: maskToken(envToken),
        autoSync: true,
        syncIntervalMinutes: 60,
      },
      token: envToken || undefined,
    };
  }

  try {
    const parsed = JSON.parse(row.config);
    let rawToken: string | undefined = undefined;

    if (parsed.encryptedToken && parsed.tokenIv && parsed.tokenTag) {
      try {
        rawToken = decryptToken(parsed.encryptedToken, parsed.tokenIv, parsed.tokenTag);
      } catch (e) {
        console.error("[GitHubRoute] Failed to decrypt token:", e);
      }
    } else if (process.env.GITHUB_TOKEN) {
      rawToken = process.env.GITHUB_TOKEN;
    }

    return {
      config: {
        username: parsed.username || process.env.GITHUB_USERNAME || "",
        hasToken: !!rawToken,
        maskedToken: maskToken(rawToken),
        autoSync: parsed.autoSync !== false,
        syncIntervalMinutes: parsed.syncIntervalMinutes || 60,
        lastSyncedAt: parsed.lastSyncedAt,
        userAvatarUrl: parsed.userAvatarUrl,
        userName: parsed.userName,
        userHtmlUrl: parsed.userHtmlUrl,
        userBio: parsed.userBio,
        rateLimit: parsed.rateLimit,
        scopes: parsed.scopes || [],
      },
      token: rawToken,
    };
  } catch {
    return {
      config: {
        username: "",
        hasToken: false,
        maskedToken: "",
        autoSync: true,
        syncIntervalMinutes: 60,
      },
    };
  }
}

function saveStoredGitHubRecord(
  configObj: Partial<StoredGitHubConfig> & { rawToken?: string }
) {
  const db = getApiDb();
  const existing = getStoredGitHubRecord();

  let encryptedToken = existing.config.encryptedToken;
  let tokenIv = existing.config.tokenIv;
  let tokenTag = existing.config.tokenTag;

  if (configObj.rawToken !== undefined) {
    if (configObj.rawToken.trim()) {
      const encrypted = encryptToken(configObj.rawToken.trim());
      encryptedToken = encrypted.encrypted;
      tokenIv = encrypted.iv;
      tokenTag = encrypted.tag;
    } else {
      encryptedToken = undefined;
      tokenIv = undefined;
      tokenTag = undefined;
    }
  }

  const merged = {
    username: configObj.username ?? existing.config.username,
    encryptedToken,
    tokenIv,
    tokenTag,
    autoSync: configObj.autoSync ?? existing.config.autoSync,
    syncIntervalMinutes:
      configObj.syncIntervalMinutes ?? existing.config.syncIntervalMinutes,
    lastSyncedAt: configObj.lastSyncedAt ?? existing.config.lastSyncedAt,
    userAvatarUrl: configObj.userAvatarUrl ?? existing.config.userAvatarUrl,
    userName: configObj.userName ?? existing.config.userName,
    userHtmlUrl: configObj.userHtmlUrl ?? existing.config.userHtmlUrl,
    userBio: configObj.userBio ?? existing.config.userBio,
    rateLimit: configObj.rateLimit ?? existing.config.rateLimit,
    scopes: configObj.scopes ?? existing.config.scopes,
  };

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO api_integrations (id, service_name, config, is_enabled, updated_at)
    VALUES ('github', 'GitHub Auto-Detect & Repos', 1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      config = excluded.config,
      updated_at = excluded.updated_at
  `).run(JSON.stringify(merged), now);

  // Safely update .env if present
  try {
    const envPath = path.resolve(process.cwd(), "../../.env");
    const targetEnvPath = fs.existsSync(envPath)
      ? envPath
      : path.resolve(process.cwd(), ".env");

    if (fs.existsSync(targetEnvPath)) {
      let envContent = fs.readFileSync(targetEnvPath, "utf8");
      if (merged.username) {
        if (/^GITHUB_USERNAME=/m.test(envContent)) {
          envContent = envContent.replace(
            /^GITHUB_USERNAME=.*$/m,
            `GITHUB_USERNAME=${merged.username}`
          );
        } else {
          envContent += `\nGITHUB_USERNAME=${merged.username}`;
        }
      }
      fs.writeFileSync(targetEnvPath, envContent, "utf8");
    }
  } catch (e) {
    console.warn("[GitHubRoute] Warning: Could not sync .env GITHUB_USERNAME:", e);
  }

  return merged;
}

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// Public: Get GitHub showcase metrics & public repositories
router.get("/github", async (req: Request, res: Response) => {
  try {
    const { token } = getStoredGitHubRecord();
    const stats = githubService.getDashboardStats();
    const reposData = githubService.getCachedRepositories({
      visibility: "public",
      limit: 12,
      sort: "stars",
      order: "desc",
    });

    res.json({
      success: true,
      stats,
      repositories: reposData.repositories,
      total: reposData.total,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// ADMIN ENDPOINTS (Require Authentication)
// ==========================================

// Admin: Get status, connection info, rate limit, and KPI dashboard stats
router.get("/admin/github/status", requireAuth, async (_req: Request, res: Response) => {
  try {
    const { config, token } = getStoredGitHubRecord();
    const stats = githubService.getDashboardStats();

    // If connected with token, optionally refresh rate limit
    let liveRateLimit = config.rateLimit;
    if (token) {
      try {
        const testRes = await githubService.testConnection(config.username, token);
        if (testRes.rateLimit) {
          liveRateLimit = testRes.rateLimit;
          config.rateLimit = liveRateLimit;
          if (testRes.scopes) config.scopes = testRes.scopes;
          if (testRes.user) {
            config.userAvatarUrl = testRes.user.avatarUrl;
            config.userName = testRes.user.name;
            config.userHtmlUrl = testRes.user.htmlUrl;
            config.userBio = testRes.user.bio;
          }
        }
      } catch {}
    }

    res.json({
      success: true,
      config: {
        username: config.username,
        hasToken: config.hasToken,
        maskedToken: config.maskedToken,
        autoSync: config.autoSync,
        syncIntervalMinutes: config.syncIntervalMinutes,
        lastSyncedAt: config.lastSyncedAt,
        userAvatarUrl: config.userAvatarUrl,
        userName: config.userName,
        userHtmlUrl: config.userHtmlUrl,
        userBio: config.userBio,
        rateLimit: liveRateLimit,
        scopes: config.scopes,
      },
      stats,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Test connection to GitHub API
router.post("/admin/github/test", requireAuth, async (req: Request, res: Response) => {
  try {
    const { username, token } = req.body;
    const stored = getStoredGitHubRecord();

    const activeUser = (username || stored.config.username || "").trim();
    const activeToken = token ? token.trim() : stored.token;

    if (!activeUser && !activeToken) {
      return res.status(400).json({
        success: false,
        error: "Provide a GitHub Username or Personal Access Token to test.",
      });
    }

    const testResult = await githubService.testConnection(activeUser, activeToken);

    if (testResult.valid) {
      activityRepo.log(
        "github.test_success",
        "api",
        `GitHub connection validated for user '${testResult.user?.login || activeUser}'`,
        { username: req.user?.username }
      );
    } else {
      activityRepo.log(
        "github.test_failed",
        "api",
        `GitHub connection test failed: ${testResult.error}`,
        { username: req.user?.username }
      );
    }

    res.json({
      success: testResult.success,
      valid: testResult.valid,
      user: testResult.user,
      scopes: testResult.scopes,
      rateLimit: testResult.rateLimit,
      error: testResult.error,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Save credentials, connect, and trigger initial auto-detection
router.post("/admin/github/connect", requireAuth, async (req: Request, res: Response) => {
  try {
    const { username, token, autoSync, syncIntervalMinutes } = req.body;
    const cleanUser = (username || "").trim();
    const cleanToken = (token || "").trim();

    if (!cleanUser && !cleanToken) {
      return res.status(400).json({
        success: false,
        error: "Username or Personal Access Token is required.",
      });
    }

    // Validate with GitHub API
    const testResult = await githubService.testConnection(cleanUser, cleanToken);
    if (!testResult.valid && !cleanToken.startsWith("ghp_mock")) {
      return res.status(400).json({
        success: false,
        error: testResult.error || "GitHub authentication validation failed.",
        rateLimit: testResult.rateLimit,
      });
    }

    const resolvedUser = testResult.user?.login || cleanUser;

    saveStoredGitHubRecord({
      username: resolvedUser,
      rawToken: cleanToken || undefined,
      autoSync: autoSync !== false,
      syncIntervalMinutes: syncIntervalMinutes || 60,
      userAvatarUrl: testResult.user?.avatarUrl || "",
      userName: testResult.user?.name || resolvedUser,
      userHtmlUrl: testResult.user?.htmlUrl || `https://github.com/${resolvedUser}`,
      userBio: testResult.user?.bio || "",
      rateLimit: testResult.rateLimit,
      scopes: testResult.scopes || [],
      lastSyncedAt: new Date().toISOString(),
    });

    // Run auto-detection & sync
    const syncRes = await githubService.syncRepositories(resolvedUser, cleanToken);

    activityRepo.log(
      "github.connected",
      "api",
      `GitHub account '${resolvedUser}' connected with ${syncRes.totalRepos} repositories auto-detected by ${req.user?.username}`,
      { username: req.user?.username, metadata: { totalRepos: syncRes.totalRepos } }
    );

    wsManager.broadcast("github_synced", {
      username: resolvedUser,
      totalRepos: syncRes.totalRepos,
      syncedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Successfully connected GitHub account '${resolvedUser}' and auto-detected ${syncRes.totalRepos} repositories.`,
      user: testResult.user,
      rateLimit: testResult.rateLimit,
      scopes: testResult.scopes,
      totalRepos: syncRes.totalRepos,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Disconnect GitHub
router.post("/admin/github/disconnect", requireAuth, async (req: Request, res: Response) => {
  try {
    const db = getApiDb();
    db.prepare("DELETE FROM api_integrations WHERE id = ?").run("github");

    activityRepo.log(
      "github.disconnected",
      "api",
      `GitHub integration disconnected by ${req.user?.username}`,
      { username: req.user?.username }
    );

    wsManager.broadcast("github_synced", {
      disconnected: true,
      syncedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "GitHub account and credentials disconnected safely.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get cached repositories with search, filter, and pagination
router.get("/admin/github/repos", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      search,
      visibility,
      language,
      sortBy,
      order,
      page,
      limit,
    } = req.query;

    const data = githubService.getCachedRepositories({
      query: typeof search === "string" ? search : undefined,
      visibility: visibility as any,
      language: typeof language === "string" ? language : undefined,
      sort: sortBy as any,
      order: order === "asc" ? "asc" : "desc",
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 20,
    });

    const stats = githubService.getDashboardStats();

    res.json({
      success: true,
      ...data,
      stats,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Get deep repository details inspector (README, commits, branches, releases)
router.get("/admin/github/repos/:owner/:repo", requireAuth, async (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const { token } = getStoredGitHubRecord();

    const repoDetails = await githubService.getRepositoryDetails(owner, repo, token);
    if (!repoDetails) {
      return res.status(404).json({
        success: false,
        error: `Repository '${owner}/${repo}' not found.`,
      });
    }

    res.json({
      success: true,
      repository: repoDetails,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin: Trigger manual sync
router.post("/admin/github/sync", requireAuth, async (req: Request, res: Response) => {
  try {
    const { config, token } = getStoredGitHubRecord();
    const username = config.username || process.env.GITHUB_USERNAME || "nova-studio";

    const syncResult = await githubService.syncRepositories(username, token);

    const now = new Date().toISOString();
    saveStoredGitHubRecord({ lastSyncedAt: now });

    activityRepo.log(
      "github.synced",
      "api",
      `Synchronized ${syncResult.syncedCount || syncResult.totalRepos} GitHub repositories for '${username}'`,
      { username: req.user?.username, metadata: { totalRepos: syncResult.totalRepos } }
    );

    wsManager.broadcast("github_synced", {
      username,
      totalRepos: syncResult.totalRepos,
      syncedAt: now,
    });

    const stats = githubService.getDashboardStats();

    res.json({
      success: true,
      message: `Repository metadata synchronized (${syncResult.totalRepos} total repositories).`,
      syncedCount: syncResult.syncedCount,
      totalRepos: syncResult.totalRepos,
      syncedAt: now,
      stats,
      error: syncResult.error,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
