"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { LanyardData, LanyardWsHello, LanyardWsEvent } from "@nova/shared";

const LANYARD_WS_URL = "wss://api.lanyard.rest/socket";

export interface UseLanyardReturn {
  data: Record<string, LanyardData>;
  status: "idle" | "connecting" | "connected" | "disconnected" | "error";
  getPresence: (userId?: string) => LanyardData | undefined;
  isMonitored: (userId?: string) => boolean;
}

/**
 * useLanyard hook
 * Connects directly to Lanyard WebSocket for zero-latency Discord presence updates
 * (Spotify live tracks, VS Code / game activity, custom status, active devices)
 * Includes REST fallback and heartbeat management.
 */
export function useLanyard(userIds: string | string[]): UseLanyardReturn {
  const [data, setData] = useState<Record<string, LanyardData>>({});
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "disconnected" | "error"
  >("idle");

  const normalizedIds = Array.isArray(userIds)
    ? Array.from(new Set(userIds.filter((id) => !!id && /^\d+$/.test(id))))
    : userIds && /^\d+$/.test(userIds)
    ? [userIds]
    : [];

  const idsKey = normalizedIds.sort().join(",");
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // REST Fallback fetch on initial load
  useEffect(() => {
    if (normalizedIds.length === 0) return;

    let isMounted = true;
    async function fetchInitialRest() {
      try {
        const query = normalizedIds.join(",");
        const res = await fetch(`/api/lanyard?ids=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.users && isMounted) {
          setData((prev) => {
            const next = { ...prev };
            for (const [uid, result] of Object.entries<any>(json.users)) {
              if (result && result.success && result.data) {
                next[uid] = result.data;
              }
            }
            return next;
          });
        }
      } catch {
        // Silent fallback - WebSocket will still connect
      }
    }

    fetchInitialRest();

    return () => {
      isMounted = false;
    };
  }, [idsKey]);

  // WebSocket Connection
  useEffect(() => {
    if (normalizedIds.length === 0) {
      setStatus("idle");
      return;
    }

    let isMounted = true;
    let socket: WebSocket | null = null;

    function cleanupHeartbeat() {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    }

    function connect() {
      if (!isMounted) return;
      cleanupHeartbeat();

      try {
        setStatus("connecting");
        socket = new WebSocket(LANYARD_WS_URL);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          // Wait for Hello (op 1) from Lanyard before subscribing
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(event.data);

            // 1. OP 1: Hello from server with heartbeat_interval
            if (msg.op === 1) {
              const hello = msg as LanyardWsHello;
              const interval = hello.d?.heartbeat_interval || 30000;

              // Send subscribe message (op 2)
              if (normalizedIds.length === 1) {
                socket?.send(
                  JSON.stringify({
                    op: 2,
                    d: {
                      subscribe_to_id: normalizedIds[0],
                    },
                  })
                );
              } else {
                socket?.send(
                  JSON.stringify({
                    op: 2,
                    d: {
                      subscribe_to_ids: normalizedIds,
                    },
                  })
                );
              }

              // Start heartbeat loop (op 3)
              heartbeatTimerRef.current = setInterval(() => {
                if (socket?.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify({ op: 3 }));
                }
              }, interval);

              setStatus("connected");
              return;
            }

            // 2. OP 0: Events (INIT_STATE or PRESENCE_UPDATE)
            if (msg.op === 0) {
              const ev = msg as LanyardWsEvent;
              if (ev.t === "INIT_STATE") {
                if (normalizedIds.length === 1) {
                  // Single user subscription returns LanyardData directly
                  const singleData = ev.d as LanyardData;
                  if (singleData?.discord_user?.id) {
                    setData((prev) => ({
                      ...prev,
                      [singleData.discord_user.id]: singleData,
                    }));
                  }
                } else {
                  // Multi user subscription returns map
                  const multiData = ev.d as Record<string, LanyardData>;
                  setData((prev) => ({
                    ...prev,
                    ...multiData,
                  }));
                }
              } else if (ev.t === "PRESENCE_UPDATE") {
                const updated = ev.d as LanyardData;
                if (updated?.discord_user?.id) {
                  setData((prev) => ({
                    ...prev,
                    [updated.discord_user.id]: updated,
                  }));
                }
              }
            }
          } catch {
            // Ignore non-json frames
          }
        };

        socket.onerror = () => {
          if (!isMounted) return;
          setStatus("error");
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setStatus("disconnected");
          cleanupHeartbeat();
          // Auto reconnect after 5 seconds
          reconnectTimerRef.current = setTimeout(() => {
            if (isMounted) {
              connect();
            }
          }, 5000);
        };
      } catch {
        setStatus("error");
      }
    }

    connect();

    return () => {
      isMounted = false;
      cleanupHeartbeat();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [idsKey]);

  const getPresence = useCallback(
    (userId?: string) => {
      if (!userId) return undefined;
      return data[userId];
    },
    [data]
  );

  const isMonitored = useCallback(
    (userId?: string) => {
      if (!userId) return false;
      return !!data[userId];
    },
    [data]
  );

  return {
    data,
    status,
    getPresence,
    isMonitored,
  };
}

// ==========================================
// Lanyard Display Helper Functions
// ==========================================

export function getLanyardAvatarUrl(
  presence?: LanyardData,
  fallbackUrl?: string
): string {
  if (presence?.discord_user) {
    const user = presence.discord_user;
    if (user.avatar) {
      const ext = user.avatar.startsWith("a_") ? "gif" : "webp";
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
    }
  }
  return fallbackUrl || "https://cdn.discordapp.com/embed/avatars/0.png";
}

export function getLanyardAvatarDecorationUrl(
  presence?: LanyardData
): string | null {
  const asset = presence?.discord_user?.avatar_decoration_data?.asset;
  if (!asset) return null;
  return `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png?size=160&passthrough=true`;
}

export function getLanyardActivityAssetUrl(
  applicationId?: string,
  assetKey?: string
): string | null {
  if (!assetKey) return null;
  if (assetKey.startsWith("mp:external/")) {
    return `https://media.discordapp.net/${assetKey.replace(/^mp:/, "")}`;
  }
  if (assetKey.startsWith("spotify:")) {
    return `https://i.scdn.co/image/${assetKey.replace("spotify:", "")}`;
  }
  if (applicationId) {
    return `https://cdn.discordapp.com/app-assets/${applicationId}/${assetKey}.png`;
  }
  return null;
}

