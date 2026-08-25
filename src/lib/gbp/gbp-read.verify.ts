/**
 * Growth Sprint 12.1 — GBP Read Integration verify (no live Google).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  GBP_OAUTH_SCOPE,
  GBP_OAUTH_SCOPE_DEPRECATED,
  GBP_READ_INTEGRATION_VERSION,
  GBP_READ_SIDE_EFFECT_BUDGET,
  GBP_UNSUPPORTED_FOR_V1,
} from "@/lib/gbp/constants";
import {
  compareGbpProfileToFacts,
  normalizeWebsiteBase,
  websiteHasCanonicalGbpUtm,
} from "@/lib/gbp/compare";
import {
  createMockGbpProvider,
  mockJsSolutionsLocation,
} from "@/lib/gbp/mock-provider";
import {
  defaultWeeklyPerformanceWindow,
  normalizeGbpLocation,
  normalizePerformanceWindow,
} from "@/lib/gbp/normalize";
import {
  decryptRefreshToken,
  encryptRefreshToken,
  redactGbpSecrets,
} from "@/lib/gbp/crypto";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`gbp-read.verify failed: ${message}`);
  }
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));

  assert(GBP_READ_INTEGRATION_VERSION === 1, "version 1");
  assert(
    GBP_READ_SIDE_EFFECT_BUDGET.DASHBOARD_LOAD_GBP_API === 0,
    "no API on dashboard load",
  );
  assert(GBP_READ_SIDE_EFFECT_BUDGET.AUTO_WRITE === 0, "no auto write");
  assert(
    GBP_OAUTH_SCOPE === "https://www.googleapis.com/auth/business.manage",
    "canonical scope",
  );
  assert(
    GBP_OAUTH_SCOPE_DEPRECATED.includes("plus.business.manage"),
    "deprecated scope labeled",
  );

  process.env.REPORTS_SESSION_SECRET =
    process.env.REPORTS_SESSION_SECRET || "verify-secret-for-gbp-token-tests";

  const blob = encryptRefreshToken("mock_refresh_token_value");
  assert(blob.ciphertext && blob.iv && blob.authTag, "encrypt produces blob");
  assert(
    decryptRefreshToken(blob) === "mock_refresh_token_value",
    "decrypt roundtrip",
  );

  const redacted = String(
    redactGbpSecrets(
      "Bearer ya29.abc123 refresh_token=1//xyz code=4/abc access_token=tok",
    ),
  );
  assert(!redacted.includes("ya29."), "access token redacted");
  assert(!redacted.includes("1//xyz"), "refresh redacted");

  const provider = createMockGbpProvider();
  const raw = await provider.getLocation("t", "locations/mock");
  const reviews = await provider.getReviewAggregate("t", "a", "l");
  const profile = normalizeGbpLocation(raw, reviews);
  assert(profile.title === "JS Solutions", "normalized title");
  assert(profile.isServiceAreaBusiness, "service area business");
  assert(profile.reviewCount === 4, "review aggregate count");
  assert(profile.averageRating === 5, "rating");

  const comparisons = compareGbpProfileToFacts(profile);
  const websiteUtm = comparisons.find((c) => c.key === "WEBSITE_UTM");
  assert(websiteUtm?.factMatch === "MATCH", "canonical UTM match");

  const noUtmProfile = normalizeGbpLocation(
    mockJsSolutionsLocation({ websiteUri: "https://jsgrowth.com/" }),
    reviews,
  );
  const noUtmCmp = compareGbpProfileToFacts(noUtmProfile).find(
    (c) => c.key === "WEBSITE_UTM",
  );
  assert(noUtmCmp?.factMatch === "MISMATCH", "missing UTM mismatch");
  assert(
    websiteHasCanonicalGbpUtm(
      "https://jsgrowth.com/?utm_content=website&utm_campaign=gbp_profile&utm_medium=organic_local&utm_source=google_business_profile",
    ),
    "utm param order independent",
  );
  assert(
    normalizeWebsiteBase("https://JSGrowth.com/path/") ===
      normalizeWebsiteBase("https://jsgrowth.com/path"),
    "website base normalize",
  );

  const window = defaultWeeklyPerformanceWindow(
    new Date("2026-08-25T12:00:00.000Z"),
  );
  assert(window.periodEnd === "2026-08-24", "window ends yesterday UTC");
  const perf = await provider.fetchPerformance(
    "t",
    "l",
    window.periodStart,
    window.periodEnd,
  );
  const normalizedPerf = normalizePerformanceWindow({
    ...window,
    points: perf.points,
    keywords: perf.keywords,
  });
  assert(normalizedPerf.callClicks === 0, "observed zero calls");
  assert(
    typeof normalizedPerf.websiteClicks === "number" &&
      normalizedPerf.websiteClicks > 0,
    "website clicks captured",
  );

  const missingProvider = createMockGbpProvider({ missingWebsiteClicks: true });
  const missingPerf = await missingProvider.fetchPerformance(
    "t",
    "l",
    window.periodStart,
    window.periodEnd,
  );
  const missingNorm = normalizePerformanceWindow({
    ...window,
    points: missingPerf.points,
    keywords: missingPerf.keywords,
  });
  assert(missingNorm.websiteClicks === null, "missing metric stays null");

  assert(GBP_UNSUPPORTED_FOR_V1.includes("PHOTOS"), "photos unsupported v1");

  const schema = readFileSync(
    join(here, "../../../prisma/schema.prisma"),
    "utf8",
  );
  assert(
    schema.includes("model GoogleBusinessProfileConnection"),
    "connection model",
  );
  assert(
    schema.includes("LocalGbpObservationSource"),
    "observation source enum",
  );

  const research = readFileSync(
    join(here, "../../../docs/research/google-business-profile-api-2026.md"),
    "utf8",
  );
  assert(research.includes("business.manage"), "research oauth scope");
  assert(research.includes("ACCESS DATE"), "research access date");

  const localPage = readFileSync(
    join(here, "../../app/reports/growth/local/page.tsx"),
    "utf8",
  );
  assert(localPage.includes("GbpConnectionPanel"), "connection panel on page");
  assert(
    localPage.includes("GBP_READ_INTEGRATION_VERSION"),
    "read version on page",
  );

  const startRoute = readFileSync(
    join(here, "../../app/api/gbp/oauth/start/route.ts"),
    "utf8",
  );
  assert(startRoute.includes("requireInternalSession"), "oauth start auth");

  // LOCAL_GROWTH_VERSION must remain unchanged by this sprint
  const localGrowth = readFileSync(
    join(here, "../growth/local-growth.ts"),
    "utf8",
  );
  assert(
    /export const LOCAL_GROWTH_VERSION = 1/.test(localGrowth),
    "LOCAL_GROWTH_VERSION unchanged",
  );

  console.log("gbp-read.verify.ts: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
