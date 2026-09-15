import type { BusinessProfileData } from "../types";
import { averageBusiness } from "./average-business";
import { completeButInactiveBusiness } from "./complete-but-inactive-business";
import { excellentBusiness } from "./excellent-business";
import { newBusiness } from "./new-business";
import { poorBusiness } from "./poor-business";
import { popularButPoorlyOptimizedBusiness } from "./popular-but-poorly-optimized-business";
import { serviceAreaBusiness } from "./service-area-business";

export const GBP_AUDIT_FIXTURE_IDS = [
  "excellent-business",
  "average-business",
  "poor-business",
  "new-business",
  "service-area-business",
  "complete-but-inactive-business",
  "popular-but-poorly-optimized-business",
] as const;

export type GbpAuditFixtureId = (typeof GBP_AUDIT_FIXTURE_IDS)[number];

export const gbpAuditFixtures: Record<GbpAuditFixtureId, BusinessProfileData> = {
  "excellent-business": excellentBusiness,
  "average-business": averageBusiness,
  "poor-business": poorBusiness,
  "new-business": newBusiness,
  "service-area-business": serviceAreaBusiness,
  "complete-but-inactive-business": completeButInactiveBusiness,
  "popular-but-poorly-optimized-business": popularButPoorlyOptimizedBusiness,
};

export function getGbpAuditFixture(id: string): BusinessProfileData {
  const fixture = gbpAuditFixtures[id as GbpAuditFixtureId];
  if (!fixture) {
    throw new Error(
      `Unknown GBP audit fixture "${id}". Expected one of: ${GBP_AUDIT_FIXTURE_IDS.join(", ")}`,
    );
  }
  return fixture;
}

export {
  averageBusiness,
  completeButInactiveBusiness,
  excellentBusiness,
  newBusiness,
  poorBusiness,
  popularButPoorlyOptimizedBusiness,
  serviceAreaBusiness,
};
