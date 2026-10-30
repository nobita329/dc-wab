import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { DatabaseManager } from "./connection.js";
import { runMigrations } from "./migrations.js";
import { getGravatarUrl } from "../utils/totp.js";

// Load environment variables from repo root or apps/api
const rootEnvPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  const altEnvPath = path.resolve(process.cwd(), "../../.env");
  if (fs.existsSync(altEnvPath)) {
    dotenv.config({ path: altEnvPath });
  } else {
    dotenv.config();
  }
}

// Simple CLI Argument Parser: e.g. --username=admin --password=secret or --username admin
function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const equalIndex = arg.indexOf("=");
      if (equalIndex !== -1) {
        const key = arg.slice(2, equalIndex);
        const val = arg.slice(equalIndex + 1);
        result[key] = val;
      } else if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        const key = arg.slice(2);
        result[key] = args[i + 1];
        i++;
      } else {
        const key = arg.slice(2);
        result[key] = "true";
      }
    }
  }

  return result;
}

async function main() {
  const cliArgs = parseArgs();

  // Ensure migrations are run first so columns exist
  runMigrations();

  const username =
    cliArgs.username ||
    process.env.npm_config_username ||
    process.env.ADMIN_USERNAME ||
    "admin";

  const password =
    cliArgs.password ||
    process.env.npm_config_password ||
    process.env.ADMIN_PASSWORD ||
    "admin";

  const email =
    cliArgs.email ||
    process.env.npm_config_email ||
    process.env.ADMIN_EMAIL ||
    (username === "admin" ? "admin@novastudio.internal" : `${username}@novastudio.internal`);

  const role = cliArgs.role || process.env.npm_config_role || "admin";
  const nameFirst =
    cliArgs.nameFirst ||
    cliArgs["first-name"] ||
    process.env.npm_config_namefirst ||
    (username === "admin" ? "Nova" : username);
  const nameLast =
    cliArgs.nameLast ||
    cliArgs["last-name"] ||
    process.env.npm_config_namelast ||
    (username === "admin" ? "Admin" : "User");

  const dbManager = DatabaseManager.getInstance();
  const userDb = dbManager.getConnection("user");

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const avatarUrl = getGravatarUrl(email);
  const now = new Date().toISOString();

  // Check if user already exists
  const existingUser = userDb
    .prepare("SELECT id, username FROM users WHERE username = ? OR email = ?")
    .get(username, email) as { id: string; username: string } | undefined;

  let userId: string;
  let action: string;

  if (existingUser) {
    userId = existingUser.id;
    action = "Updated Existing Account";

    userDb.prepare(`
      UPDATE users
      SET username = ?,
          password_hash = ?,
          email = ?,
          name_first = ?,
          name_last = ?,
          avatar_url = ?,
          role = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      username,
      passwordHash,
      email,
      nameFirst,
      nameLast,
      avatarUrl,
      role,
      now,
      userId
    );
  } else {
    userId = crypto.randomUUID();
    action = "Created New Account";

    userDb.prepare(`
      INSERT INTO users (
        id, username, password_hash, email, name_first, name_last,
        avatar_url, role, use_totp, is_banned, is_suspended, language,
        country, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, 0, 0, 0, 'en',
        'US', ?, ?
      )
    `).run(
      userId,
      username,
      passwordHash,
      email,
      nameFirst,
      nameLast,
      avatarUrl,
      role,
      now,
      now
    );
  }

  console.log(`
======================================================
👑 Nova Studio — Administrator Account Provisioning
======================================================
Status   : ✅ ${action}
User ID  : ${userId}
Username : ${username}
Email    : ${email}
Role     : ${role}
Gravatar : ${avatarUrl}
Client   : ${nameFirst} ${nameLast}
======================================================
Credentials ready:
  Username : ${username}
  Password : ${"*".repeat(password.length)} (${password})
======================================================
You can now log in at:
  http://localhost:3001/admin/login
======================================================
`);

  dbManager.closeAll();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error provisioning user account:", err);
  process.exit(1);
});
