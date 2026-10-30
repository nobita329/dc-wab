import { DatabaseManager } from "../database/connection.js";
import { User } from "@nova/shared";
import { getGravatarUrl } from "../utils/totp.js";

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  email: string | null;
  name_first: string | null;
  name_last: string | null;
  avatar_url: string | null;
  role: "admin" | "editor" | "viewer";
  use_totp: number;
  totp_secret: string | null;
  totp_backup_codes: string | null;
  reset_token: string | null;
  reset_token_expires_at: string | null;
  is_banned: number;
  is_suspended: number;
  suspended_until: string | null;
  language: string;
  country: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  last_login_ip: string | null;
}

export class UserRepository {
  private getDb() {
    return DatabaseManager.getInstance().getConnection("user");
  }

  private mapUser(row: any): User {
    const avatar = row.avatar_url || getGravatarUrl(row.email);
    return {
      id: row.id,
      username: row.username,
      email: row.email ?? undefined,
      nameFirst: row.name_first ?? undefined,
      nameLast: row.name_last ?? undefined,
      avatarUrl: avatar,
      role: row.role,
      useTotp: Boolean(row.use_totp),
      isBanned: Boolean(row.is_banned),
      isSuspended: Boolean(row.is_suspended),
      suspendedUntil: row.suspended_until ?? undefined,
      language: row.language ?? "en",
      country: row.country ?? undefined,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at ?? undefined,
      lastLoginIp: row.last_login_ip ?? undefined,
    };
  }

  public findByUsername(username: string): (UserRow & { password_hash: string }) | null {
    const row = this.getDb()
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username) as UserRow | undefined;
    return row || null;
  }

  public findByEmail(email: string): (UserRow & { password_hash: string }) | null {
    const row = this.getDb()
      .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
      .get(email.trim().toLowerCase()) as UserRow | undefined;
    return row || null;
  }

  public findByUsernameOrEmail(identifier: string): (UserRow & { password_hash: string }) | null {
    const clean = identifier.trim();
    const row = this.getDb()
      .prepare("SELECT * FROM users WHERE username = ? OR email = ? COLLATE NOCASE")
      .get(clean, clean.toLowerCase()) as UserRow | undefined;
    return row || null;
  }

  public findById(id: string): User | null {
    const row = this.getDb().prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!row) return null;
    return this.mapUser(row);
  }

  public findRawById(id: string): UserRow | null {
    const row = this.getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
    return row || null;
  }

  public findByResetToken(token: string): UserRow | null {
    const now = new Date().toISOString();
    const row = this.getDb()
      .prepare("SELECT * FROM users WHERE reset_token = ? AND reset_token_expires_at > ?")
      .get(token, now) as UserRow | undefined;
    return row || null;
  }

  public setResetToken(userId: string, token: string, expiresAt: string): void {
    const now = new Date().toISOString();
    this.getDb().prepare(`
      UPDATE users SET reset_token = ?, reset_token_expires_at = ?, updated_at = ? WHERE id = ?
    `).run(token, expiresAt, now, userId);
  }

  public clearResetToken(userId: string): void {
    const now = new Date().toISOString();
    this.getDb().prepare(`
      UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL, updated_at = ? WHERE id = ?
    `).run(now, userId);
  }

  public setTwoFactor(userId: string, enabled: boolean, secret?: string, backupCodes?: string[]): void {
    const now = new Date().toISOString();
    this.getDb().prepare(`
      UPDATE users SET
        use_totp = ?,
        totp_secret = ?,
        totp_backup_codes = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      enabled ? 1 : 0,
      enabled ? (secret ?? null) : null,
      enabled ? JSON.stringify(backupCodes || []) : "[]",
      now,
      userId
    );
  }

  public verifyAndConsumeBackupCode(userId: string, code: string): boolean {
    const raw = this.findRawById(userId);
    if (!raw || !raw.totp_backup_codes) return false;

    let codes: string[] = [];
    try {
      codes = JSON.parse(raw.totp_backup_codes);
    } catch {
      return false;
    }

    const cleanCode = code.trim().toUpperCase();
    const index = codes.findIndex((c) => c === cleanCode);
    if (index === -1) return false;

    // Remove used code
    codes.splice(index, 1);
    const now = new Date().toISOString();
    this.getDb().prepare(`
      UPDATE users SET totp_backup_codes = ?, updated_at = ? WHERE id = ?
    `).run(JSON.stringify(codes), now, userId);

    return true;
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

  public revokeUserSession(sessionId: string): boolean {
    const res = this.getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return (res.changes ?? 0) > 0;
  }

  public updateLastLogin(id: string, ipAddress?: string): void {
    const now = new Date().toISOString();
    this.getDb().prepare(`
      UPDATE users SET last_login_at = ?, last_login_ip = ? WHERE id = ?
    `).run(now, ipAddress || "", id);
  }

  public logLoginHistory(userId: string, ipAddress?: string, userAgent?: string): void {
    const now = new Date().toISOString();
    const ua = userAgent || "";
    let browser = "Chrome";
    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    let platform = "Linux";
    if (ua.includes("Windows")) platform = "Windows";
    else if (ua.includes("Mac")) platform = "macOS";
    else if (ua.includes("Android")) platform = "Android";
    else if (ua.includes("iPhone")) platform = "iOS";

    const deviceType = ua.includes("Mobile") ? "Mobile" : "Desktop";

    this.getDb().prepare(`
      INSERT INTO user_login_history (user_id, ip_address, device_type, platform, browser, city, country, created_at)
      VALUES (?, ?, ?, ?, ?, 'Local', 'Cloud', ?)
    `).run(userId, ipAddress || "127.0.0.1", deviceType, platform, browser, now);
  }

  public getLoginHistory(userId: string, limit = 50): any[] {
    return this.getDb()
      .prepare("SELECT * FROM user_login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(userId, limit);
  }

  public getUserSessions(userId: string): any[] {
    return this.getDb()
      .prepare("SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId);
  }

  public countActiveSessions(): number {
    const now = new Date().toISOString();
    const row = this.getDb().prepare(`
      SELECT count(*) as count FROM sessions WHERE expires_at > ?
    `).get(now) as { count: number };
    return row.count;
  }

  public getAllUsers(): User[] {
    const rows = this.getDb().prepare("SELECT * FROM users ORDER BY created_at ASC").all();
    return rows.map((r) => this.mapUser(r));
  }

  public createUser(data: {
    id: string;
    username: string;
    passwordHash: string;
    email?: string;
    nameFirst?: string;
    nameLast?: string;
    avatarUrl?: string;
    role: "admin" | "editor" | "viewer";
    useTotp?: boolean;
    totpSecret?: string;
  }): User {
    const now = new Date().toISOString();
    const avatar = data.avatarUrl || getGravatarUrl(data.email);

    this.getDb().prepare(`
      INSERT INTO users (
        id, username, password_hash, email, name_first, name_last, avatar_url,
        role, use_totp, totp_secret, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.username,
      data.passwordHash,
      data.email || null,
      data.nameFirst || null,
      data.nameLast || null,
      avatar,
      data.role,
      data.useTotp ? 1 : 0,
      data.totpSecret || null,
      now,
      now
    );

    return this.findById(data.id)!;
  }

  public updateUser(
    id: string,
    data: {
      username?: string;
      email?: string;
      nameFirst?: string;
      nameLast?: string;
      avatarUrl?: string;
      role?: "admin" | "editor" | "viewer";
      passwordHash?: string;
      useTotp?: boolean;
      totpSecret?: string;
      isBanned?: boolean;
      isSuspended?: boolean;
      suspendedUntil?: string;
      language?: string;
      country?: string;
    }
  ): User | null {
    const current = this.findRawById(id);
    if (!current) return null;

    const now = new Date().toISOString();
    const username = data.username !== undefined ? data.username : current.username;
    const email = data.email !== undefined ? data.email : current.email;
    const nameFirst = data.nameFirst !== undefined ? data.nameFirst : current.name_first;
    const nameLast = data.nameLast !== undefined ? data.nameLast : current.name_last;
    const avatarUrl =
      data.avatarUrl !== undefined
        ? data.avatarUrl
        : email
        ? getGravatarUrl(email)
        : current.avatar_url;
    const role = data.role !== undefined ? data.role : current.role;
    const isBanned = data.isBanned !== undefined ? (data.isBanned ? 1 : 0) : current.is_banned;
    const isSuspended = data.isSuspended !== undefined ? (data.isSuspended ? 1 : 0) : current.is_suspended;
    const language = data.language !== undefined ? data.language : current.language;
    const country = data.country !== undefined ? data.country : current.country;

    if (data.passwordHash) {
      this.getDb().prepare(`
        UPDATE users
        SET username = ?, email = ?, name_first = ?, name_last = ?, avatar_url = ?, role = ?,
            password_hash = ?, is_banned = ?, is_suspended = ?, language = ?, country = ?, updated_at = ?
        WHERE id = ?
      `).run(username, email || null, nameFirst, nameLast, avatarUrl, role, data.passwordHash, isBanned, isSuspended, language, country, now, id);
    } else {
      this.getDb().prepare(`
        UPDATE users
        SET username = ?, email = ?, name_first = ?, name_last = ?, avatar_url = ?, role = ?,
            is_banned = ?, is_suspended = ?, language = ?, country = ?, updated_at = ?
        WHERE id = ?
      `).run(username, email || null, nameFirst, nameLast, avatarUrl, role, isBanned, isSuspended, language, country, now, id);
    }

    return this.findById(id);
  }

  public deleteUser(id: string): boolean {
    const res = this.getDb().prepare("DELETE FROM users WHERE id = ?").run(id);
    return (res.changes ?? 0) > 0;
  }
}
