import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { AGREEMENT_SHARE_TOKEN_BYTES } from "./constants";

export function generateAgreementShareToken(): string {
  return randomBytes(AGREEMENT_SHARE_TOKEN_BYTES).toString("base64url");
}

export function hashAgreementShareToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyAgreementShareToken(
  token: string,
  storedHash: string,
): boolean {
  if (!token || !storedHash) {
    return false;
  }
  try {
    const left = createHash("sha256").update(token).digest();
    const right = Buffer.from(storedHash, "hex");
    if (left.length !== right.length) {
      return false;
    }
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function agreementDeliverySendIdempotencyKey(deliveryId: string): string {
  return `agreement-delivery:${deliveryId}`;
}
