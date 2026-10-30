"use client";

import { useEffect, useRef } from "react";
import { useWsStore } from "@/lib/store";
import { queryClient } from "@/lib/queryClient";
import { WsMessage } from "@nova/shared";
import { toast } from "sonner";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setConnected, setLastMessage, isConnected } = useWsStore();

  useEffect(() => {
    let isMounted = true;

    function getWsUrl(): string {
      if (typeof window === "undefined") {
        return "ws://localhost:3002/ws";
      }

      const isHttps = window.location.protocol === "https:";
      const wsProto = isHttps ? "wss:" : "ws:";
      const hostname = window.location.hostname;

      // Localhost environment
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return `${wsProto}//${hostname}:3002/ws`;
      }

      // Codespaces or reverse-proxy environment where ports are mapped to subdomains:
      // e.g. hostname: xxx-3001.app.github.dev -> xxx-3002.app.github.dev
      if (window.location.host.includes("-3001.")) {
        const host3002 = window.location.host.replace("-3001.", "-3002.");
        return `${wsProto}//${host3002}/ws`;
      }

      // Fallback
      return `${wsProto}//${window.location.host}/ws`;
    }

    function connect() {
      if (!isMounted) return;

      try {
        const wsUrl = getWsUrl();
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          setConnected(true);
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data) as WsMessage;
            setLastMessage(data);

            switch (data.type) {
              case "content_published":
                queryClient.invalidateQueries({ queryKey: ["homeContent"] });
                queryClient.invalidateQueries({ queryKey: ["adminHome"] });
                queryClient.invalidateQueries({ queryKey: ["analytics"] });
                toast.success(`Home page v${data.payload.version} published!`);
                break;
              case "draft_saved":
                queryClient.invalidateQueries({ queryKey: ["adminHome"] });
                break;
              case "settings_updated":
                queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
                toast.info("Website settings updated");
                break;
              case "database_backed_up":
                queryClient.invalidateQueries({ queryKey: ["databaseStatus"] });
                queryClient.invalidateQueries({ queryKey: ["databaseBackups"] });
                toast.success("Database backup completed");
                break;
              case "database_restored":
                queryClient.invalidateQueries({ queryKey: ["databaseStatus"] });
                toast.warning("Database restored from backup");
                break;
              case "team_updated":
                queryClient.invalidateQueries({ queryKey: ["teamPageData"] });
                queryClient.invalidateQueries({ queryKey: ["adminTeamData"] });
                break;
              case "tutorial_updated":
                queryClient.invalidateQueries({ queryKey: ["tutorialPageData"] });
                queryClient.invalidateQueries({ queryKey: ["adminTutorialData"] });
                break;
              case "command_updated":
                queryClient.invalidateQueries({ queryKey: ["commandPageData"] });
                queryClient.invalidateQueries({ queryKey: ["adminCommandData"] });
                break;
              case "activity_logged":
                queryClient.invalidateQueries({ queryKey: ["activityLogs"] });
                break;
            }
          } catch {
            // ignore non-json messages
          }
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setConnected(false);
          // Try reconnecting after 5 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };

        socket.onerror = () => {
          if (!isMounted) return;
          // Graceful silent handling of WS errors so UI never throws unhandled errors
          socket.close();
        };
      } catch {
        if (!isMounted) return;
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [setConnected, setLastMessage]);

  return { isConnected };
}
