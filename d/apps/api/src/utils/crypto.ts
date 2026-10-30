import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getMasterKey(): Buffer {
  const secret =
    process.env.SESSION_SECRET ||
    "nova_studio_secure_jwt_session_secret_change_in_prod_key_778899";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt sensitive tokens (e.g. GitHub Personal Access Tokens) at rest using AES-256-GCM.
 */
export function encryptToken(plaintext: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const iv = crypto.randomBytes(16);
  const key = getMasterKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag,
  };
}

/**
 * Decrypt sensitive token safely for backend GitHub API calls.
 */
export function decryptToken(encrypted: string, ivHex: string, tagHex: string): string {
  try {
    const key = getMasterKey();
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err: any) {
    throw new Error("Failed to decrypt authorization token: " + err.message);
  }
}

/**
 * Creates safe masked token preview: e.g. `ghp_••••••••••••3a9f`
 */
export function maskToken(token?: string | null): string {
  if (!token) return "";
  const trimmed = token.trim();
  if (trimmed.length <= 8) return "••••••••";
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••••••${suffix}`;
}
