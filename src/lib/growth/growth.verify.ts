/**
 * Growth Sprint 1 verification — event taxonomy, UTM, attribution, snapshots,
 * privacy boundary. No external analytics APIs.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";
import {
  ATTRIBUTION_VERSION,
  buildUtmUrl,
  FACEBOOK_FOUNDER_UTM,
  FACEBOOK_PAGE_UTM,
  GBP_UTM,
  GROWTH_EVENT_VERSION,
  GROWTH_EVENTS,
  GROWTH_KEY_EVENT_CANDIDATES,
  isAllowedGrowthEventParamKey,
  isGrowthEventName,
  isKnownUtmMedium,
  isKnownUtmSource,
  isValidUtmValue,
  KPI_HIERARCHY,
  normalizeUtmValue,
  parseCampaignAttribution,
  parseCampaignAttributionFromUnknown,
  QUALIFIED_TRAFFIC_INDICATORS,
  sanitizeGrowthEventParams,
  UTM_STANDARD_VERSION,
  validateGrowthSnapshotMetrics,
} from "@/lib/growth";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(GROWTH_EVENT_VERSION === "growth-events-v1", "growth event version");
assert(ATTRIBUTION_VERSION === "attribution-v1", "attribution version");
assert(UTM_STANDARD_VERSION === "utm-standard-v1", "utm standard version");

assert(
  GROWTH_EVENTS.auditLandingView === "audit_landing_view",
  "audit_landing_view name",
);
assert(GROWTH_EVENTS.auditStarted === "audit_started", "audit_started name");
assert(
  GROWTH_EVENTS.auditSubmitted === "audit_submitted",
  "audit_submitted name",
);
assert(
  GROWTH_EVENTS.contactFormSubmitted === "contact_form_submitted",
  "contact_form_submitted name",
);
assert(isGrowthEventName("audit_completed"), "audit_completed is growth event");
assert(!isGrowthEventName("button_clicked"), "noisy events not in taxonomy");

assert(
  GROWTH_KEY_EVENT_CANDIDATES.includes(GROWTH_EVENTS.auditSubmitted),
  "audit_submitted is key-event candidate",
);
assert(
  GROWTH_KEY_EVENT_CANDIDATES.includes(GROWTH_EVENTS.contactFormSubmitted),
  "contact_form_submitted is key-event candidate",
);

const safe = sanitizeGrowthEventParams({
  placement: "blog",
  cta_kind: "audit",
  pages_scanned: 3,
  report_id: "3ad43538-a0b0-4f39-937b-b119be11f62f",
  prospect_id: "abc",
} as Record<string, string | number | boolean>);
assert(safe?.placement === "blog", "keeps placement");
assert(safe?.pages_scanned === 3, "keeps pages_scanned");
assert(safe && !("report_id" in safe), "strips report_id");
assert(safe && !("prospect_id" in safe), "strips prospect_id");
assert(isAllowedGrowthEventParamKey("placement"), "placement allowed");
assert(!isAllowedGrowthEventParamKey("email"), "email not allowed growth key");

for (const key of [
  "prospect_id",
  "opportunity_id",
  "client_id",
  "project_id",
  "proposal_id",
  "agreement_id",
  "payment_id",
  "email",
  "phone",
]) {
  assert(isForbiddenAnalyticsParamKey(key), `${key} must be forbidden`);
}

assert(isForbiddenAnalyticsParamKey("prospect_id"), "prospect_id forbidden");
assert(isForbiddenAnalyticsParamKey("opportunity_id"), "opportunity_id forbidden");
assert(isForbiddenAnalyticsParamKey("client_id"), "client_id forbidden");
assert(isForbiddenAnalyticsParamKey("project_id"), "project_id forbidden");
assert(isForbiddenAnalyticsParamKey("proposal_id"), "proposal_id forbidden");
assert(isForbiddenAnalyticsParamKey("agreement_id"), "agreement_id forbidden");
assert(isForbiddenAnalyticsParamKey("email"), "email forbidden");

assert(normalizeUtmValue(" FaceBook ") === "facebook", "utm normalize");
assert(isValidUtmValue("website_growth"), "valid campaign");
assert(!isValidUtmValue(""), "empty invalid");
assert(!isValidUtmValue("bad value!"), "special chars invalid");
assert(isKnownUtmSource("facebook"), "facebook source");
assert(isKnownUtmMedium("organic_social"), "organic_social medium");
assert(isKnownUtmMedium("organic_local"), "organic_local medium");

const built = buildUtmUrl({
  destinationUrl: "https://jsgrowth.com/website-audit",
  source: "facebook",
  medium: "organic_social",
  campaign: "website_growth",
  content: "website_leads_post_01",
});
assert(built.ok, "utm builder succeeds");
if (built.ok) {
  assert(
    built.url.includes("utm_source=facebook"),
    "utm_source encoded",
  );
  assert(
    built.url.includes("utm_medium=organic_social"),
    "utm_medium encoded",
  );
  assert(
    built.url.includes("utm_campaign=website_growth"),
    "utm_campaign encoded",
  );
  assert(
    built.url.includes("utm_content=website_leads_post_01"),
    "utm_content encoded",
  );
}

const bad = buildUtmUrl({
  destinationUrl: "not-a-url",
  source: "facebook",
  medium: "organic_social",
  campaign: "x",
});
assert(!bad.ok, "invalid destination rejected");

assert(FACEBOOK_PAGE_UTM.source === "facebook", "fb page source");
assert(FACEBOOK_FOUNDER_UTM.campaign === "founder_content", "founder campaign");
assert(GBP_UTM.source === "google_business_profile", "gbp source");
assert(GBP_UTM.medium === "organic_local", "gbp medium");

const attr = parseCampaignAttribution({
  source: "facebook",
  medium: "organic_social",
  campaign: "website_growth",
  content: "post_01",
  landingPath: "/website-audit",
});
assert(attr?.source === "facebook", "attribution source");
assert(attr?.landingPath === "/website-audit", "attribution landing");

const leaked = parseCampaignAttributionFromUnknown({
  source: "facebook",
  medium: "organic_social",
  campaign: "x",
  content: "y",
  landingPath: "/website-audit",
  prospect_id: "should-not-survive",
  email: "a@b.com",
});
assert(leaked !== null, "bounded attribution parses");
assert(
  leaked && !("prospect_id" in leaked) && !("email" in leaked),
  "attribution omits commercial/PII keys",
);

const invalidAttr = parseCampaignAttribution({
  source: "!!!",
  medium: "organic_social",
  campaign: "ok",
  landingPath: "/website-audit",
});
assert(invalidAttr?.source === null, "invalid source becomes null");

const ga4Snap = validateGrowthSnapshotMetrics("GA4", {
  users: 10,
  sessions: 12,
  organicSearchSessions: 4,
});
assert(ga4Snap.ok, "GA4 snapshot valid");

const badSnap = validateGrowthSnapshotMetrics("GA4", {
  users: -1,
});
assert(!badSnap.ok, "negative users rejected");

const fbSnap = validateGrowthSnapshotMetrics("FACEBOOK", {
  property: "js_solutions_page",
  followers: 100,
  reach: 500,
});
assert(fbSnap.ok, "facebook snapshot valid");

const internalSnap = validateGrowthSnapshotMetrics("INTERNAL", {
  auditsCreated: 3,
  clientsCreated: 1,
});
assert(internalSnap.ok, "internal snapshot valid");

assert(QUALIFIED_TRAFFIC_INDICATORS.length >= 4, "qualified indicators defined");
assert(KPI_HIERARCHY.length === 5, "five KPI levels");
assert(KPI_HIERARCHY[0]?.level === 1, "level 1 business");
assert(KPI_HIERARCHY[4]?.level === 5, "level 5 visibility");

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, "../..");

function walkTsFiles(directory: string, files: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    if (entry === "generated" || entry === "node_modules") {
      continue;
    }
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walkTsFiles(fullPath, files);
      continue;
    }
    if (extname(entry) === ".ts" || extname(entry) === ".tsx") {
      files.push(fullPath);
    }
  }
  return files;
}

for (const file of walkTsFiles(srcRoot).filter((f) => !f.endsWith(".verify.ts"))) {
  const source = readFileSync(file, "utf8");
  if (!source.includes("trackGrowthEvent") && !source.includes("trackCommercialEvent")) {
    continue;
  }
  assert(
    !/trackGrowthEvent\([\s\S]*?prospect_id\s*:/.test(source),
    `${file} must not send prospect_id to trackGrowthEvent`,
  );
  assert(
    !/trackGrowthEvent\([\s\S]*?opportunity_id\s*:/.test(source),
    `${file} must not send opportunity_id to trackGrowthEvent`,
  );
}

const schema = readFileSync(
  join(here, "../../../prisma/schema.prisma"),
  "utf8",
);
assert(schema.includes("model GrowthSnapshot"), "GrowthSnapshot in schema");
assert(schema.includes("attributionJson"), "attributionJson on AuditReport");

console.log("growth measurement verification passed");
process.exit(0);
