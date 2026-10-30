import crypto from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateBase32Secret(length = 20): string {
  const bytes = crypto.randomBytes(length);
  let secret = "";
  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

export function base32Decode(str: string): Buffer {
  let bits = "";
  for (const c of str.toUpperCase().replace(/=/g, "")) {
    const val = BASE32_ALPHABET.indexOf(c);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTOTP(secret: string, timeStep = 30, offset = 0): string {
  const counter = Math.floor(Date.now() / 1000 / timeStep) + offset;
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));
  const key = base32Decode(secret);
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const hmacOffset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(hmacOffset) & 0x7fffffff) % 1000000;
  return code.toString().padStart(6, "0");
}

export function verifyTOTP(token: string, secret: string, window = 1): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.trim();
  for (let offset = -window; offset <= window; offset++) {
    if (cleanToken === generateTOTP(secret, 30, offset)) {
      return true;
    }
  }
  return false;
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const p1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const p2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    codes.push(`${p1}-${p2}`);
  }
  return codes;
}

export function getOtpAuthUrl(issuer: string, accountName: string, secret: string): string {
  const encIssuer = encodeURIComponent(issuer);
  const encAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encIssuer}:${encAccount}?secret=${secret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

export function getGravatarUrl(email?: string): string {
  if (!email || !email.trim()) {
    return "https://www.gravatar.com/avatar/00000000000000000000000000000000?s=200&d=mp";
  }
  const clean = email.trim().toLowerCase();
  const hash = crypto.createHash("md5").update(clean).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
}
