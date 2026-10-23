import { Router, Request, Response } from "express";
import { TeamRepository } from "../repositories/teamRepository.js";
import { ActivityRepository } from "../repositories/activityRepository.js";
import { WebSocketManager } from "../websocket/wsServer.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { TeamPageDataSchema, TeamMemberSchema } from "@nova/shared";

export const teamRoutes = Router();
const teamRepo = new TeamRepository();
const activityRepo = new ActivityRepository();
const wsManager = WebSocketManager.getInstance();

// 1. PUBLIC: GET /api/team
teamRoutes.get("/team", (_req: Request, res: Response) => {
  try {
    const data = teamRepo.getTeamData();
    res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to retrieve team data",
    });
  }
});

// 2. ADMIN: GET /api/admin/team
teamRoutes.get("/admin/team", requireAuth, (_req: Request, res: Response) => {
  try {
    const data = teamRepo.getTeamData();
    res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to load team data from team.db",
    });
  }
});

// 3. ADMIN: PUT /api/admin/team
teamRoutes.put("/admin/team", requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = TeamPageDataSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid team data payload",
        details: parsed.error.issues,
      });
    }

    const username = (req as any).user?.username || "admin";
    const updated = teamRepo.saveTeamData(parsed.data, username);

    // Audit log
    activityRepo.log(
      "UPDATE_TEAM",
      "content",
      `Admin ${username} updated team settings and ${parsed.data.members.length} members in team.db`,
      {
        userId: (req as any).user?.id,
        username,
      }
    );

    // Real-time broadcast
    wsManager.broadcast("team_updated" as any, updated);

    res.json({
      success: true,
      message: "Team successfully updated and persisted in team.db",
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to save team data to team.db",
    });
  }
});

// 4. ADMIN: POST /api/admin/team/member (Add or Edit single member)
teamRoutes.post("/admin/team/member", requireAuth, (req: Request, res: Response) => {
  try {
    const parsed = TeamMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid team member format",
        details: parsed.error.issues,
      });
    }

    const username = (req as any).user?.username || "admin";
    const saved = teamRepo.addOrUpdateMember(parsed.data, username);

    activityRepo.log(
      "SET_TEAM_MEMBER",
      "content",
      `Admin ${username} saved team member ${saved.name} (${saved.roleShort}) in team.db`,
      {
        userId: (req as any).user?.id,
        username,
      }
    );

    const fullTeam = teamRepo.getTeamData();
    wsManager.broadcast("team_updated" as any, fullTeam);

    res.json({
      success: true,
      message: `Team member ${saved.name} saved in team.db`,
      member: saved,
      data: fullTeam,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to save team member to team.db",
    });
  }
});

// 5. ADMIN: DELETE /api/admin/team/member/:id
teamRoutes.delete("/admin/team/member/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const username = (req as any).user?.username || "admin";
    const success = teamRepo.deleteMember(id);

    if (!success) {
      return res.status(404).json({ success: false, error: "Member not found" });
    }

    activityRepo.log(
      "DELETE_TEAM_MEMBER",
      "content",
      `Admin ${username} removed member ${id} from team.db`,
      {
        userId: (req as any).user?.id,
        username,
      }
    );

    const fullTeam = teamRepo.getTeamData();
    wsManager.broadcast("team_updated" as any, fullTeam);

    res.json({
      success: true,
      message: "Member removed from team.db",
      data: fullTeam,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to delete team member",
    });
  }
});

// 6. ADMIN: GET /api/admin/team/discord-members
// Detects users directly from Discord widget API: https://discord.com/api/guilds/{$serverid}/widget.json
teamRoutes.get("/admin/team/discord-members", requireAuth, async (req: Request, res: Response) => {
  try {
    const serverId = (req.query.serverId as string) || "1540761150797389915";
    const url = `https://discord.com/api/guilds/${serverId}/widget.json`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "NovaStudio-DiscordDetector/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Discord API returned ${response.status}: Widget is disabled or server ID is invalid.`,
      });
    }

    const discordData = (await response.json()) as any;
    res.json({
      success: true,
      serverId,
      name: discordData.name || "Discord Server",
      instant_invite: discordData.instant_invite || null,
      presence_count: discordData.presence_count ?? 0,
      members: discordData.members || [],
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Failed to detect Discord users: ${err.message}`,
    });
  }
});

// ==========================================
// 7. PUBLIC / LANYARD PROXY & CACHE ENDPOINTS
// ==========================================
interface LanyardCacheEntry {
  data: any;
  timestamp: number;
}
const lanyardCache = new Map<string, LanyardCacheEntry>();
const LANYARD_CACHE_TTL_MS = 6000; // 6 seconds in-memory cache

// GET /api/lanyard/:id
// Proxies single user presence from Lanyard API
teamRoutes.get("/lanyard/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({ success: false, error: "Invalid Discord user ID" });
    }

    const cached = lanyardCache.get(id);
    if (cached && Date.now() - cached.timestamp < LANYARD_CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const response = await fetch(`https://api.lanyard.rest/v1/users/${id}`, {
      headers: {
        "User-Agent": "NovaStudio-LanyardProxy/1.0",
        Accept: "application/json",
      },
    });

    const body = (await response.json()) as any;
    lanyardCache.set(id, {
      data: body,
      timestamp: Date.now(),
    });

    return res.status(response.ok ? 200 : response.status).json(body);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Failed to fetch Lanyard presence: ${err.message}`,
    });
  }
});

// GET /api/lanyard?ids=123,456
// Bulk fetch multiple discord presence in parallel
teamRoutes.get("/lanyard", async (req: Request, res: Response) => {
  try {
    let ids: string[] = [];
    if (typeof req.query.ids === "string") {
      ids = req.query.ids.split(",").map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
    } else {
      // Default: fetch all team members that have discordId
      const teamData = teamRepo.getTeamData();
      ids = teamData.members
        .map((m) => m.discordId)
        .filter((d): d is string => !!d && /^\d+$/.test(d));
    }

    // Deduplicate
    const uniqueIds = Array.from(new Set(ids));
    const results: Record<string, any> = {};

    await Promise.all(
      uniqueIds.map(async (userId) => {
        try {
          const cached = lanyardCache.get(userId);
          if (cached && Date.now() - cached.timestamp < LANYARD_CACHE_TTL_MS) {
            results[userId] = cached.data;
            return;
          }

          const response = await fetch(`https://api.lanyard.rest/v1/users/${userId}`, {
            headers: {
              "User-Agent": "NovaStudio-LanyardProxy/1.0",
              Accept: "application/json",
            },
          });
          const body = (await response.json()) as any;
          lanyardCache.set(userId, { data: body, timestamp: Date.now() });
          results[userId] = body;
        } catch (subErr: any) {
          results[userId] = { success: false, error: { message: subErr.message } };
        }
      })
    );

    res.json({
      success: true,
      users: results,
      count: uniqueIds.length,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Failed to fetch multi-user Lanyard presence: ${err.message}`,
    });
  }
});
