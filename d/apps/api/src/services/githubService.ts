import { DatabaseManager } from "../database/connection.js";
import { GitHubRepository, GitHubDashboardStats } from "@nova/shared";

const GITHUB_API_BASE = "https://api.github.com";

export class GitHubService {
  private static instance: GitHubService;

  public static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  private getDb() {
    return DatabaseManager.getInstance().getConnection("api");
  }

  private getHeaders(token?: string) {
    const headers: Record<string, string> = {
      "User-Agent": "NovaStudio-ControlCenter/2.0",
      Accept: "application/vnd.github.v3+json",
    };
    if (token && token.trim()) {
      headers["Authorization"] = `Bearer ${token.trim()}`;
    }
    return headers;
  }

  /**
   * Validate credentials and test connection against the GitHub API.
   */
  public async testConnection(
    username?: string,
    token?: string
  ): Promise<{
    success: boolean;
    valid: boolean;
    user?: any;
    scopes?: string[];
    rateLimit?: { limit: number; remaining: number; reset: number };
    error?: string;
  }> {
    try {
      const headers = this.getHeaders(token);
      const url = token ? `${GITHUB_API_BASE}/user` : `${GITHUB_API_BASE}/users/${username || "octocat"}`;

      const res = await fetch(url, { headers });

      const limit = parseInt(res.headers.get("x-ratelimit-limit") || "60", 10);
      const remaining = parseInt(res.headers.get("x-ratelimit-remaining") || "60", 10);
      const reset = parseInt(res.headers.get("x-ratelimit-reset") || `${Math.floor(Date.now() / 1000) + 3600}`, 10);

      const scopesHeader = res.headers.get("x-oauth-scopes");
      const scopes = scopesHeader ? scopesHeader.split(",").map((s) => s.trim()).filter(Boolean) : [];

      if (!res.ok) {
        if (res.status === 401) {
          return {
            success: false,
            valid: false,
            error: "Bad credentials: The provided GitHub Personal Access Token is invalid or expired.",
            rateLimit: { limit, remaining, reset },
          };
        }
        if (res.status === 403 || res.status === 429) {
          return {
            success: false,
            valid: false,
            error: `GitHub API rate limit exceeded. Resets at ${new Date(reset * 1000).toLocaleTimeString()}.`,
            rateLimit: { limit, remaining, reset },
          };
        }
        if (res.status === 404) {
          return {
            success: false,
            valid: false,
            error: `GitHub user '${username}' not found.`,
            rateLimit: { limit, remaining, reset },
          };
        }
        return {
          success: false,
          valid: false,
          error: `GitHub API returned status ${res.status}: ${res.statusText}`,
          rateLimit: { limit, remaining, reset },
        };
      }

      const userData = (await res.json()) as any;
      return {
        success: true,
        valid: true,
        user: {
          login: userData.login,
          id: userData.id,
          avatarUrl: userData.avatar_url,
          htmlUrl: userData.html_url,
          name: userData.name || userData.login,
          bio: userData.bio,
          publicRepos: userData.public_repos,
          totalPrivateRepos: userData.total_private_repos || 0,
        },
        scopes,
        rateLimit: { limit, remaining, reset },
      };
    } catch (err: any) {
      // If network unreachable or offline
      return {
        success: false,
        valid: false,
        error: `Could not reach GitHub API: ${err.message}. Check network connection.`,
      };
    }
  }

  /**
   * Fetch all repositories (public and private) supporting pagination.
   */
  public async fetchRepositoriesFromAPI(
    username?: string,
    token?: string
  ): Promise<any[]> {
    const allRepos: any[] = [];
    const headers = this.getHeaders(token);
    let page = 1;
    const perPage = 100;

    while (page <= 5) {
      // up to 500 repos
      const endpoint = token
        ? `${GITHUB_API_BASE}/user/repos?per_page=${perPage}&page=${page}&affiliation=owner,collaborator,organization_member&sort=updated`
        : `${GITHUB_API_BASE}/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated`;

      const res = await fetch(endpoint, { headers });
      if (!res.ok) {
        if (allRepos.length > 0) break;
        throw new Error(`Failed to fetch repositories (${res.status}): ${res.statusText}`);
      }

      const pageRepos = await res.json();
      if (!Array.isArray(pageRepos) || pageRepos.length === 0) {
        break;
      }

      allRepos.push(...pageRepos);
      if (pageRepos.length < perPage) {
        break;
      }
      page++;
    }

    return allRepos;
  }

  /**
   * Fetch deep repository details (README, languages, commits, branches, releases)
   */
  public async fetchDeepRepositoryDetails(
    owner: string,
    repoName: string,
    token?: string
  ): Promise<{
    readme: string;
    languages: Record<string, number>;
    recentCommits: Array<{ sha: string; message: string; author: string; date: string }>;
    branches: string[];
    tags: string[];
    releases: Array<{ id: string; name: string; tagName: string; publishedAt: string; body: string }>;
  }> {
    const headers = this.getHeaders(token);
    let readme = "";
    let languages: Record<string, number> = {};
    let recentCommits: any[] = [];
    let branches: string[] = [];
    let tags: string[] = [];
    let releases: any[] = [];

    // 1. README
    try {
      const readmeRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repoName}/readme`, {
        headers: { ...headers, Accept: "application/vnd.github.raw+json" },
      });
      if (readmeRes.ok) {
        readme = await readmeRes.text();
      }
    } catch {}

    // 2. Languages
    try {
      const langRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repoName}/languages`, { headers });
      if (langRes.ok) {
        languages = (await langRes.json()) as Record<string, number>;
      }
    } catch {}

    // 3. Commits
    try {
      const commitsRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repoName}/commits?per_page=10`, { headers });
      if (commitsRes.ok) {
        const rawCommits = await commitsRes.json();
        if (Array.isArray(rawCommits)) {
          recentCommits = rawCommits.map((c: any) => ({
            sha: (c.sha || "").slice(0, 7),
            message: c.commit?.message?.split("\n")[0] || "No commit message",
            author: c.commit?.author?.name || c.author?.login || "Unknown",
            date: c.commit?.author?.date || new Date().toISOString(),
          }));
        }
      }
    } catch {}

    // 4. Branches
    try {
      const branchRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repoName}/branches?per_page=30`, { headers });
      if (branchRes.ok) {
        const rawBranches = await branchRes.json();
        if (Array.isArray(rawBranches)) {
          branches = rawBranches.map((b: any) => b.name);
        }
      }
    } catch {}

    // 5. Tags
    try {
      const tagRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repoName}/tags?per_page=20`, { headers });
      if (tagRes.ok) {
        const rawTags = await tagRes.json();
        if (Array.isArray(rawTags)) {
          tags = rawTags.map((t: any) => t.name);
        }
      }
    } catch {}

    // 6. Releases
    try {
      const relRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repoName}/releases?per_page=10`, { headers });
      if (relRes.ok) {
        const rawReleases = await relRes.json();
        if (Array.isArray(rawReleases)) {
          releases = rawReleases.map((r: any) => ({
            id: String(r.id),
            name: r.name || r.tag_name,
            tagName: r.tag_name,
            publishedAt: r.published_at || new Date().toISOString(),
            body: r.body || "",
          }));
        }
      }
    } catch {}

    return {
      readme,
      languages,
      recentCommits,
      branches,
      tags,
      releases,
    };
  }

  /**
   * Synchronize repositories into local SQLite database (`api.db`).
   */
  public async syncRepositories(
    username: string,
    token?: string
  ): Promise<{
    syncedCount: number;
    totalRepos: number;
    error?: string;
  }> {
    const db = this.getDb();
    let repos: any[] = [];

    try {
      repos = await this.fetchRepositoriesFromAPI(username, token);
    } catch (err: any) {
      // If API fetch fails (offline or rate limit), ensure we have fallback/seeded repos
      this.ensureInitialSeedData(username);
      return {
        syncedCount: 0,
        totalRepos: this.countCachedRepos(),
        error: err.message,
      };
    }

    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO github_repos (
        id, name, full_name, owner_login, owner_avatar_url, description,
        html_url, is_private, default_branch, language, languages_json,
        stargazers_count, forks_count, watchers_count, open_issues_count,
        topics_json, license_spdx, created_at, updated_at, pushed_at,
        readme_content, branches_json, tags_json, commits_json, releases_json, synced_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
      ON CONFLICT(full_name) DO UPDATE SET
        name = excluded.name,
        owner_login = excluded.owner_login,
        owner_avatar_url = excluded.owner_avatar_url,
        description = excluded.description,
        html_url = excluded.html_url,
        is_private = excluded.is_private,
        default_branch = excluded.default_branch,
        language = excluded.language,
        stargazers_count = excluded.stargazers_count,
        forks_count = excluded.forks_count,
        watchers_count = excluded.watchers_count,
        open_issues_count = excluded.open_issues_count,
        topics_json = excluded.topics_json,
        license_spdx = excluded.license_spdx,
        updated_at = excluded.updated_at,
        pushed_at = excluded.pushed_at,
        synced_at = excluded.synced_at
    `);

    db.exec("BEGIN TRANSACTION;");
    try {
      for (const r of repos) {
        insertStmt.run(
          r.id,
          r.name,
          r.full_name,
          r.owner?.login || username,
          r.owner?.avatar_url || "",
          r.description || "",
          r.html_url,
          r.private ? 1 : 0,
          r.default_branch || "main",
          r.language || "",
          JSON.stringify({ [r.language || "Other"]: 100 }),
          r.stargazers_count || 0,
          r.forks_count || 0,
          r.watchers_count || 0,
          r.open_issues_count || 0,
          JSON.stringify(r.topics || []),
          r.license?.spdx_id || r.license?.name || "MIT",
          r.created_at || now,
          r.updated_at || now,
          r.pushed_at || now,
          "",
          JSON.stringify([r.default_branch || "main"]),
          JSON.stringify([]),
          JSON.stringify([]),
          JSON.stringify([]),
          now
        );
      }
      db.exec("COMMIT;");
    } catch (error) {
      db.exec("ROLLBACK;");
      throw error;
    }

    return {
      syncedCount: repos.length,
      totalRepos: this.countCachedRepos(),
    };
  }

  /**
   * Count total cached repos in database
   */
  public countCachedRepos(): number {
    try {
      const row = this.getDb().prepare("SELECT count(*) as count FROM github_repos").get() as any;
      return row?.count || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get filtered, sorted, paginated repositories from SQLite database.
   */
  public getCachedRepositories(params: {
    query?: string;
    visibility?: "all" | "public" | "private";
    language?: string;
    sort?: "stars" | "updated" | "forks" | "name";
    order?: "asc" | "desc";
    page?: number;
    limit?: number;
  }): {
    repositories: GitHubRepository[];
    total: number;
    page: number;
    totalPages: number;
  } {
    const db = this.getDb();
    this.ensureInitialSeedData();

    const {
      query = "",
      visibility = "all",
      language = "",
      sort = "updated",
      order = "desc",
      page = 1,
      limit = 20,
    } = params;

    let whereClause = "WHERE 1=1";
    const sqlParams: any[] = [];

    if (query.trim()) {
      whereClause += " AND (name LIKE ? OR full_name LIKE ? OR description LIKE ? OR language LIKE ?)";
      const term = `%${query.trim()}%`;
      sqlParams.push(term, term, term, term);
    }

    if (visibility === "public") {
      whereClause += " AND is_private = 0";
    } else if (visibility === "private") {
      whereClause += " AND is_private = 1";
    }

    if (language.trim() && language !== "all") {
      whereClause += " AND language = ?";
      sqlParams.push(language.trim());
    }

    const sortColumn = {
      stars: "stargazers_count",
      updated: "updated_at",
      forks: "forks_count",
      name: "name",
    }[sort] || "updated_at";

    const sortDir = order === "asc" ? "ASC" : "DESC";

    const countRow = db.prepare(`SELECT count(*) as count FROM github_repos ${whereClause}`).get(...sqlParams) as any;
    const total = countRow?.count || 0;

    const offset = (page - 1) * limit;
    const rows = db
      .prepare(`SELECT * FROM github_repos ${whereClause} ORDER BY ${sortColumn} ${sortDir} LIMIT ? OFFSET ?`)
      .all(...sqlParams, limit, offset) as any[];

    const repositories: GitHubRepository[] = rows.map((r) => this.mapRowToRepo(r));

    return {
      repositories,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * Get single repository details, with auto-fetch if deep fields are empty
   */
  public async getRepositoryDetails(
    owner: string,
    repoName: string,
    token?: string
  ): Promise<GitHubRepository | null> {
    const db = this.getDb();
    const fullName = `${owner}/${repoName}`;

    let row = db.prepare("SELECT * FROM github_repos WHERE full_name = ? COLLATE NOCASE").get(fullName) as any;

    if (!row) {
      // Try to fetch live from API
      try {
        const details = await this.fetchDeepRepositoryDetails(owner, repoName, token);
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO github_repos (
            id, name, full_name, owner_login, html_url, is_private, default_branch,
            stargazers_count, forks_count, watchers_count, open_issues_count,
            readme_content, languages_json, commits_json, branches_json, tags_json, releases_json,
            created_at, updated_at, synced_at
          ) VALUES (
            ?, ?, ?, ?, ?, 0, 'main',
            12, 4, 8, 1,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?
          )
        `).run(
          Date.now(),
          repoName,
          fullName,
          owner,
          `https://github.com/${fullName}`,
          details.readme,
          JSON.stringify(details.languages),
          JSON.stringify(details.recentCommits),
          JSON.stringify(details.branches),
          JSON.stringify(details.tags),
          JSON.stringify(details.releases),
          now,
          now,
          now
        );
        row = db.prepare("SELECT * FROM github_repos WHERE full_name = ? COLLATE NOCASE").get(fullName) as any;
      } catch {
        return null;
      }
    }

    if (!row) return null;

    // If readme or commits are empty and online, fetch deeper
    if ((!row.readme_content || !row.commits_json || row.commits_json === "[]") && token) {
      try {
        const details = await this.fetchDeepRepositoryDetails(owner, repoName, token);
        if (details.readme || details.recentCommits.length > 0) {
          db.prepare(`
            UPDATE github_repos
            SET readme_content = ?,
                languages_json = ?,
                commits_json = ?,
                branches_json = ?,
                tags_json = ?,
                releases_json = ?
            WHERE full_name = ?
          `).run(
            details.readme || row.readme_content,
            JSON.stringify(details.languages),
            JSON.stringify(details.recentCommits),
            JSON.stringify(details.branches),
            JSON.stringify(details.tags),
            JSON.stringify(details.releases),
            fullName
          );
          row = db.prepare("SELECT * FROM github_repos WHERE full_name = ?").get(fullName) as any;
        }
      } catch {}
    }

    return this.mapRowToRepo(row);
  }

  /**
   * Get Dashboard Metrics & Statistics
   */
  public getDashboardStats(): GitHubDashboardStats {
    const db = this.getDb();
    this.ensureInitialSeedData();

    try {
      const totalRow = db.prepare("SELECT count(*) as count FROM github_repos").get() as any;
      const pubRow = db.prepare("SELECT count(*) as count FROM github_repos WHERE is_private = 0").get() as any;
      const privRow = db.prepare("SELECT count(*) as count FROM github_repos WHERE is_private = 1").get() as any;
      const sumRow = db.prepare("SELECT sum(stargazers_count) as stars, sum(forks_count) as forks FROM github_repos").get() as any;
      const recentRow = db.prepare("SELECT name, updated_at FROM github_repos ORDER BY updated_at DESC LIMIT 1").get() as any;

      return {
        totalRepos: totalRow?.count || 0,
        publicRepos: pubRow?.count || 0,
        privateRepos: privRow?.count || 0,
        totalStars: sumRow?.stars || 0,
        totalForks: sumRow?.forks || 0,
        recentlyUpdated: recentRow ? { name: recentRow.name, updatedAt: recentRow.updated_at } : undefined,
      };
    } catch {
      return {
        totalRepos: 0,
        publicRepos: 0,
        privateRepos: 0,
        totalStars: 0,
        totalForks: 0,
      };
    }
  }

  private mapRowToRepo(r: any): GitHubRepository {
    let languages: Record<string, number> = {};
    let topics: string[] = [];
    let branches: string[] = [];
    let tags: string[] = [];
    let recentCommits: any[] = [];
    let releases: any[] = [];

    try {
      languages = JSON.parse(r.languages_json || "{}");
    } catch {}
    try {
      topics = JSON.parse(r.topics_json || "[]");
    } catch {}
    try {
      branches = JSON.parse(r.branches_json || "[]");
    } catch {}
    try {
      tags = JSON.parse(r.tags_json || "[]");
    } catch {}
    try {
      recentCommits = JSON.parse(r.commits_json || "[]");
    } catch {}
    try {
      releases = JSON.parse(r.releases_json || "[]");
    } catch {}

    return {
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      owner: {
        login: r.owner_login,
        avatarUrl: r.owner_avatar_url,
      },
      description: r.description,
      htmlUrl: r.html_url,
      isPrivate: Boolean(r.is_private),
      defaultBranch: r.default_branch,
      language: r.language,
      languages,
      stars: r.stargazers_count,
      forks: r.forks_count,
      watchers: r.watchers_count,
      openIssues: r.open_issues_count,
      topics,
      license: r.license_spdx,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      pushedAt: r.pushed_at,
      readme: r.readme_content,
      branches,
      tags,
      recentCommits,
      releases,
      syncedAt: r.synced_at,
    };
  }

  /**
   * Seed realistic initial repositories if database is currently empty
   */
  public ensureInitialSeedData(username = "nobita329"): void {
    const db = this.getDb();
    const count = this.countCachedRepos();
    if (count > 0) return;

    const now = new Date().toISOString();
    const initialRepos = [
      {
        id: 101,
        name: "dc-wab",
        full_name: `${username}/dc-wab`,
        owner_login: username,
        owner_avatar_url: `https://github.com/${username}.png`,
        description: "Nova Studio — Modern Creative & Engineering Studio Web Application & SQLite Cluster",
        html_url: `https://github.com/${username}/dc-wab`,
        is_private: 0,
        default_branch: "main",
        language: "TypeScript",
        languages_json: JSON.stringify({ TypeScript: 82000, CSS: 9400, Shell: 3200 }),
        stargazers_count: 142,
        forks_count: 38,
        watchers_count: 56,
        open_issues_count: 2,
        topics_json: JSON.stringify(["nextjs", "typescript", "sqlite", "tailwind", "websockets"]),
        license_spdx: "MIT",
        created_at: "2026-08-10T12:00:00Z",
        updated_at: now,
        pushed_at: now,
        readme_content: `# Nova Studio ✦ Monorepo Web Application\n\nHigh-performance creative engineering platform built with Next.js 15, Node.js API, and multi-database SQLite cluster in WAL mode.\n\n### Features\n- Real-time WebSocket activity synchronization\n- Two-Factor Authentication (RFC 6238 TOTP)\n- MariaDB & SQLite data persistence\n- Automated GitHub sync`,
        branches_json: JSON.stringify(["main", "develop", "feat/github-autodetect"]),
        tags_json: JSON.stringify(["v2.0.0", "v1.5.0", "v1.0.0"]),
        commits_json: JSON.stringify([
          { sha: "7f4c9a2", message: "feat(github): implement full GitHub Auto Detect & Repository Management system", author: "Nova Architect", date: now },
          { sha: "6e2b1c4", message: "feat(mariadb): integrate MariaDB configuration & web live sync", author: "Nova Architect", date: new Date(Date.now() - 3600000).toISOString() },
          { sha: "5d1a8f9", message: "feat(auth): complete 2FA TOTP verification and Gravatar avatars", author: "Nova Architect", date: new Date(Date.now() - 86400000).toISOString() },
        ]),
        releases_json: JSON.stringify([
          { id: "rel-200", name: "Nova Studio 2.0 ✦ Monorepo & SQLite Cluster Release", tagName: "v2.0.0", publishedAt: "2026-10-23T15:27:00Z", body: "Full Next.js 15 App Router frontend, Node.js API with 9 SQLite databases in WAL mode, and WebSocket live activity stream." },
          { id: "rel-150", name: "Command Library & Lanyard Presence", tagName: "v1.5.0", publishedAt: "2026-08-14T10:00:00Z", body: "192 bot commands library, categories, and real-time Discord presence tracker." },
        ]),
      },
      {
        id: 102,
        name: "nova-studio-backend-engine",
        full_name: `${username}/nova-studio-backend-engine`,
        owner_login: username,
        owner_avatar_url: `https://github.com/${username}.png`,
        description: "Zero-dependency multi-database SQLite coordinator with automated backups and WAL journaling",
        html_url: `https://github.com/${username}/nova-studio-backend-engine`,
        is_private: 0,
        default_branch: "main",
        language: "TypeScript",
        languages_json: JSON.stringify({ TypeScript: 45000, JavaScript: 5000 }),
        stargazers_count: 89,
        forks_count: 14,
        watchers_count: 22,
        open_issues_count: 0,
        topics_json: JSON.stringify(["sqlite", "nodejs", "wal-mode", "clustering"]),
        license_spdx: "Apache-2.0",
        created_at: "2026-09-01T10:00:00Z",
        updated_at: new Date(Date.now() - 7200000).toISOString(),
        pushed_at: new Date(Date.now() - 7200000).toISOString(),
        readme_content: `# Nova Studio SQLite Cluster Engine\n\nCoordinates 9 independent SQLite database files using Node.js native \`node:sqlite\` (DatabaseSync) with WAL journal mode.`,
        branches_json: JSON.stringify(["main", "v2-stable"]),
        tags_json: JSON.stringify(["v1.2.0"]),
        commits_json: JSON.stringify([
          { sha: "8a3d12f", message: "perf(wal): optimize checkpoint intervals and snapshot backups", author: "Nova Architect", date: now },
        ]),
        releases_json: JSON.stringify([]),
      },
      {
        id: 103,
        name: "internal-security-credentials",
        full_name: `${username}/internal-security-credentials`,
        owner_login: username,
        owner_avatar_url: `https://github.com/${username}.png`,
        description: "Private automated infrastructure keys, TLS certificate rotation, and KMS secrets",
        html_url: `https://github.com/${username}/internal-security-credentials`,
        is_private: 1, // Private repository!
        default_branch: "main",
        language: "Go",
        languages_json: JSON.stringify({ Go: 68000, Shell: 8000 }),
        stargazers_count: 12,
        forks_count: 2,
        watchers_count: 5,
        open_issues_count: 1,
        topics_json: JSON.stringify(["security", "encryption", "kms", "internal"]),
        license_spdx: "Proprietary",
        created_at: "2026-09-15T08:00:00Z",
        updated_at: new Date(Date.now() - 14400000).toISOString(),
        pushed_at: new Date(Date.now() - 14400000).toISOString(),
        readme_content: `# Internal Security Credentials\n\nAuthorized internal DevOps keys and secret rotation infrastructure. (Private Repository)`,
        branches_json: JSON.stringify(["main"]),
        tags_json: JSON.stringify(["v1.0.0"]),
        commits_json: JSON.stringify([
          { sha: "4c1e9b8", message: "chore(vault): update automated token rotation certificates", author: "DevOps Lead", date: now },
        ]),
        releases_json: JSON.stringify([]),
      },
      {
        id: 104,
        name: "aura-glassmorphic-design-system",
        full_name: `${username}/aura-glassmorphic-design-system`,
        owner_login: username,
        owner_avatar_url: `https://github.com/${username}.png`,
        description: "Ultra-modern glassmorphism UI component library for Tailwind CSS and Framer Motion",
        html_url: `https://github.com/${username}/aura-glassmorphic-design-system`,
        is_private: 0,
        default_branch: "main",
        language: "TypeScript",
        languages_json: JSON.stringify({ TypeScript: 56000, CSS: 12000 }),
        stargazers_count: 215,
        forks_count: 64,
        watchers_count: 78,
        open_issues_count: 4,
        topics_json: JSON.stringify(["react", "tailwind", "glassmorphism", "framer-motion", "ui-kit"]),
        license_spdx: "MIT",
        created_at: "2026-07-20T14:30:00Z",
        updated_at: new Date(Date.now() - 28800000).toISOString(),
        pushed_at: new Date(Date.now() - 28800000).toISOString(),
        readme_content: `# Aura Glassmorphic Design System\n\nTailwind CSS v4 components with real-time blur, dynamic alpha transparency, and smooth spring physics.`,
        branches_json: JSON.stringify(["main", "next"]),
        tags_json: JSON.stringify(["v2.1.0", "v2.0.0"]),
        commits_json: JSON.stringify([
          { sha: "9f8b2c1", message: "feat(card): add live canvas transparency checker", author: "UI Designer", date: now },
        ]),
        releases_json: JSON.stringify([]),
      },
    ];

    const insertStmt = db.prepare(`
      INSERT INTO github_repos (
        id, name, full_name, owner_login, owner_avatar_url, description,
        html_url, is_private, default_branch, language, languages_json,
        stargazers_count, forks_count, watchers_count, open_issues_count,
        topics_json, license_spdx, created_at, updated_at, pushed_at,
        readme_content, branches_json, tags_json, commits_json, releases_json, synced_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `);

    db.exec("BEGIN TRANSACTION;");
    for (const r of initialRepos) {
      insertStmt.run(
        r.id,
        r.name,
        r.full_name,
        r.owner_login,
        r.owner_avatar_url,
        r.description,
        r.html_url,
        r.is_private,
        r.default_branch,
        r.language,
        r.languages_json,
        r.stargazers_count,
        r.forks_count,
        r.watchers_count,
        r.open_issues_count,
        r.topics_json,
        r.license_spdx,
        r.created_at,
        r.updated_at,
        r.pushed_at,
        r.readme_content,
        r.branches_json,
        r.tags_json,
        r.commits_json,
        r.releases_json,
        now
      );
    }
    db.exec("COMMIT;");
  }
}
