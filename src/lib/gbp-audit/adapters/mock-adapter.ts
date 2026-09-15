import {
  getGbpAuditFixture,
  gbpAuditFixtures,
  type GbpAuditFixtureId,
} from "../fixtures";
import type { BusinessProfileData } from "../types";
import type { BusinessProfileAdapter } from "./types";

function isBusinessProfileData(value: unknown): value is BusinessProfileData {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.capturedAt === "string" && typeof record.identity === "object";
}

/**
 * v0.1 source: in-memory fixtures or already-normalized profiles.
 * Does not speak Google's API shape.
 */
export class MockBusinessProfileAdapter implements BusinessProfileAdapter {
  readonly source = "mock" as const;

  toBusinessProfileData(input: unknown): BusinessProfileData {
    if (typeof input === "string") {
      return getGbpAuditFixture(input);
    }
    if (isBusinessProfileData(input)) {
      return input;
    }
    throw new Error(
      "Mock adapter accepts a fixture id or a BusinessProfileData object.",
    );
  }
}

export function listMockFixtureIds(): GbpAuditFixtureId[] {
  return Object.keys(gbpAuditFixtures) as GbpAuditFixtureId[];
}
