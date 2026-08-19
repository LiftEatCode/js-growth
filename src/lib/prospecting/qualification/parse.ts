import { QUALIFICATION_JSON_VERSION } from "./constants";
import type { StoredQualification } from "./types";

export function parseStoredQualification(
  value: unknown,
): StoredQualification | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Partial<StoredQualification>;
  if (record.version !== QUALIFICATION_JSON_VERSION) {
    return null;
  }

  if (typeof record.score !== "number" || typeof record.label !== "string") {
    return null;
  }

  return record as StoredQualification;
}
