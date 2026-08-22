import { createHash } from "node:crypto";

import type { AgreementSnapshot } from "./types";

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = sortValue(record[key]);
    }
    return sorted;
  }
  return value;
}

export function canonicalizeAgreementSnapshot(
  snapshot: AgreementSnapshot,
): string {
  return JSON.stringify(sortValue(snapshot));
}

export function hashAgreementSnapshot(snapshot: AgreementSnapshot): string {
  return createHash("sha256")
    .update(canonicalizeAgreementSnapshot(snapshot))
    .digest("hex");
}
