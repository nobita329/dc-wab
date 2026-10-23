import { DatabaseManager } from "../database/connection.js";
import { User } from "@nova/shared";

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  email: string | null;
  role: "admin" | "editor" | "viewer";
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export class UserRepository {
  private getDb() {
    return DatabaseManager.getInstance().getConnection("user");
  }

  public findByUsername(username: string): (UserRow & { password_hash: string }) | null {
    const row = this.getDb().prepare(`
      SELECT id, username, password_hash, email, role, created_at, updated_at, last_login_at
      FROM users WHERE username = ?
    `).get(username) as UserRow | undefined;

    return row || null;
  }

  public findById(id: string): User | null {
    const row = this.getDb().prepare(`
      SELECT id, username, email, role, created_at, last_login_at
      FROM users WHERE id = ?
    `).get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      email: row.email ?? undefined,
      role: row.role,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at ?? undefined,
    };
  }

  public createSession(
    sessionId: string,
    userId: string,
    token: string,
    expiresAt: string,
    userAgent?: string,
    ipAddress?: string
  ): void {
    const now = new Date().toISOString();
    this.getDb().prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at, user_agent, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(sessionId, userId, token, expiresAt, now, userAgent ?? null, ipAddress ?? null);
  }

  public findSession(token: string): { userId: string; expiresAt: string } | null {
    const row = this.getDb().prepare(`
      SELECT user_id, expires_at FROM sessions WHERE token = ?
    `).get(token) as { user_id: string; expires_at: string } | undefined;

    if (!row) return null;
    return {
      userId: row.user_id,
      expiresAt: row.expires_at,
    };
  }

  public deleteSession(token: string): void {
    this.getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }

  public updateLastLogin(id: string): void {
    const now = new Date().toISOString();
    this.getDb().prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(now, id);
  }

  public countActiveSessions(): number {
    const now = new Date().toISOString();
    const row = this.getDb().prepare(`
      SELECT count(*) as count FROM sessions WHERE expires_at > ?
    `).get(now) as { count: number };
    return row.count;
  }
}

