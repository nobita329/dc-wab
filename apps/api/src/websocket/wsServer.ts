import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import { WsEventType, WsMessage } from "@nova/shared";

export class WebSocketManager {
  private static instance: WebSocketManager;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public init(server: Server): void {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket, req) => {
      this.clients.add(ws);

      // Send initial welcome message
      const welcome: WsMessage<{ clientCount: number }> = {
        type: "connected",
        payload: { clientCount: this.clients.size },
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(welcome));

      ws.on("message", (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.type === "ping") {
            const pong: WsMessage<{}> = {
              type: "pong",
              payload: {},
              timestamp: new Date().toISOString(),
            };
            ws.send(JSON.stringify(pong));
          }
        } catch {
          // ignore invalid json
        }
      });

      ws.on("close", () => {
        this.clients.delete(ws);
      });

      ws.on("error", (err) => {
        console.error("[WebSocket] Client error:", err);
        this.clients.delete(ws);
      });
    });

    // Heartbeat interval to clean up stale connections
    setInterval(() => {
      for (const client of this.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.ping();
        }
      }
    }, 30000);

    console.log("[WebSocket] Server initialized on /ws");
  }

  public broadcast<T>(type: WsEventType, payload: T): void {
    const message: WsMessage<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    const serialized = JSON.stringify(message);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    }
  }

  public getConnectedClientCount(): number {
    return this.clients.size;
  }
}

