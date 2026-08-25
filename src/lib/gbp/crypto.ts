import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * AES-256-GCM for GBP refresh tokens at rest.
 * Key: GOOGLE_GBP_TOKEN_ENCRYPTION_KEY (32-byte hex or passphrase)
 *   or derived from REPORTS_SESSION_SECRET when unset (dev-friendly).
 * Tokens never logged or sent to the client.
 */

function resolveEncryptionKey(): Buffer {
  const explicit = process.env.GOOGLE_GBP_TOKEN_ENCRYPTION_KEY?.trim();
  if (explicit) {
    if (/^[0-9a-fA-F]{64}$/.test(explicit)) {
      return Buffer.from(explicit, "hex");
    }
    return createHash("sha256").update(explicit).digest();
  }
  const fallback = process.env.REPORTS_SESSION_SECRET?.trim();
  if (!fallback) {
    throw new Error(
      "GOOGLE_GBP_TOKEN_ENCRYPTION_KEY or REPORTS_SESSION_SECRET required to encrypt GBP tokens",
    );
  }
  return createHash("sha256")
    .update(`gbp-token-v1:${fallback}`)
    .digest();
}

export type EncryptedTokenBlob = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

export function encryptRefreshToken(plaintext: string): EncryptedTokenBlob {
  const key = resolveEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptRefreshToken(blob: EncryptedTokenBlob): string {
  const key = resolveEncryptionKey();
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(blob.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(blob.authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(blob.ciphertext, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/** Redact secrets from any string/object for logs. */
export function redactGbpSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/ya29\.[A-Za-z0-9._-]+/g, "[REDACTED_ACCESS_TOKEN]")
      .replace(/1\/\/[A-Za-z0-9_\-]+/g, "[REDACTED_REFRESH_TOKEN]")
      .replace(/code=[^&\s]+/gi, "code=[REDACTED]")
      .replace(/access_token=[^&\s]+/gi, "access_token=[REDACTED]")
      .replace(/refresh_token=[^&\s]+/gi, "refresh_token=[REDACTED]");
  }
  if (Array.isArray(value)) {
    return value.map(redactGbpSecrets);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (
        /token|secret|authorization|code|password|ciphertext/i.test(k)
      ) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = redactGbpSecrets(v);
      }
    }
    return out;
  }
  return value;
}
