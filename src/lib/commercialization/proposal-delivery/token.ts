import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { PROPOSAL_SHARE_TOKEN_BYTES } from "./constants";

export function generateProposalShareToken(): string {
  return randomBytes(PROPOSAL_SHARE_TOKEN_BYTES).toString("base64url");
}

export function hashProposalShareToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyProposalShareToken(
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

export function proposalDeliverySendIdempotencyKey(deliveryId: string): string {
  return `proposal-delivery:${deliveryId}`;
}
