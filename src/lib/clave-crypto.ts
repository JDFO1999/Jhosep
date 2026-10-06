import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "crypto";

const SECRET =
  process.env.SESSION_SECRET || "fallback-dev-secret-min-32-characters-long";

const PREFIX = "enc:v1:";
const BCRYPT_RE = /^\$2[aby]\$\d{2}\$/;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (!cachedKey) {
    cachedKey = Buffer.from(
      hkdfSync("sha256", SECRET, "jhosep-clave-v1", "aes-256-gcm", 32)
    );
  }
  return cachedKey;
}

export function isEncryptedClave(stored: string): boolean {
  return stored.startsWith(PREFIX);
}

export function isBcryptClave(stored: string): boolean {
  return BCRYPT_RE.test(stored);
}

export function encryptClave(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptClave(stored: string): string | null {
  if (isEncryptedClave(stored)) {
    try {
      const [iv, tag, data] = stored.slice(PREFIX.length).split(":");
      const decipher = createDecipheriv(
        "aes-256-gcm",
        getKey(),
        Buffer.from(iv, "base64")
      );
      decipher.setAuthTag(Buffer.from(tag, "base64"));
      return Buffer.concat([
        decipher.update(Buffer.from(data, "base64")),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      return null;
    }
  }
  if (isBcryptClave(stored)) return null;
  return stored;
}
