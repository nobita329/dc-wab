import { Router, Request, Response } from "express";

const router = Router();

// In-memory cache for Discord widget responses (15s TTL)
interface CacheEntry {
  data: any;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();

router.get("/discord/widget", async (req: Request, res: Response) => {
  const serverId = (req.query.serverId as string) || "1540761150797389915";

  const cached = cache.get(serverId);
  if (cached && Date.now() < cached.expiresAt) {
    res.json({ success: true, data: cached.data, cached: true });
    return;
  }

  try {
    const url = `https://discord.com/api/guilds/${serverId}/widget.json`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "NovaStudio/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Discord API responded with status ${response.status}`);
    }

    const data = await response.json();

    // Cache for 20 seconds
    cache.set(serverId, {
      data,
      expiresAt: Date.now() + 20 * 1000,
    });

    res.json({
      success: true,
      data,
      cached: false,
    });
  } catch (err: any) {
    // If Discord widget API fails (e.g. widget not enabled on guild or rate limit),
    // provide a graceful fallback so the UI never breaks.
    console.warn(`[Discord Route] Could not fetch widget for ${serverId}:`, err.message);

    const fallbackData = {
      id: serverId,
      name: "Nova Studio",
      instant_invite: "https://discord.gg",
      channels: [
        { id: "1558058866883821674", name: "💬・general", position: 0 },
        { id: "1558058854523215985", name: "☕・chat", position: 1 },
      ],
      members: [
        { id: "1", username: "Appy", discriminator: "0000", status: "online", avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png" },
        { id: "2", username: "Arcane", discriminator: "0000", status: "online", avatar_url: "https://cdn.discordapp.com/embed/avatars/1.png" },
        { id: "3", username: "Astro", discriminator: "0000", status: "online", avatar_url: "https://cdn.discordapp.com/embed/avatars/2.png" },
        { id: "4", username: "Dyno", discriminator: "0000", status: "online", avatar_url: "https://cdn.discordapp.com/embed/avatars/3.png", game: { name: "Dungeon crawling" } },
        { id: "5", username: "Krioxtin", discriminator: "0000", status: "dnd", avatar_url: "https://cdn.discordapp.com/embed/avatars/4.png", game: { name: "Minecraft" } },
        { id: "6", username: "WidgetBot", discriminator: "0000", status: "online", avatar_url: "https://cdn.discordapp.com/embed/avatars/5.png" },
      ],
      presence_count: 28,
    };

    res.json({
      success: true,
      data: fallbackData,
      isFallback: true,
    });
  }
});

export default router;

