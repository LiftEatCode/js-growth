import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACQUISITION_CAPTURE_VERSION,
  FIRST_OBSERVED_RETENTION_DAYS,
  GBP_WEBSITE_UTM,
  buildAcquisitionContext,
  buildGbpPostContent,
  channelFromAcquisition,
  classifyReferrerHost,
  computeAttributionCoverage,
  inferUtmFromReferrerClass,
  normalizeAcquisitionForPersistence,
  strengthFromAcquisition,
} from "@/lib/growth/acquisition-capture";
import {
  ATTRIBUTION_VERSION,
  GROWTH_BASELINE_VERSION,
  GROWTH_EVENTS,
} from "@/lib/growth";
import { CONTENT_REVIEW_VERSION } from "@/lib/growth/content-review";
import { LEAD_CONVERSION_INTELLIGENCE_VERSION } from "@/lib/growth/lead-conversion-intelligence";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const here = dirname(fileURLToPath(import.meta.url));

assert(ACQUISITION_CAPTURE_VERSION === 1, "acquisition capture version");
assert(FIRST_OBSERVED_RETENTION_DAYS === 90, "90d retention rule");
assert(ATTRIBUTION_VERSION === "attribution-v1", "utm contract unchanged");
assert(LEAD_CONVERSION_INTELLIGENCE_VERSION === 1, "sprint 9 version");
assert(CONTENT_REVIEW_VERSION === 1, "content review unchanged");
assert(GROWTH_BASELINE_VERSION === 1, "baseline unchanged");

assert(classifyReferrerHost("") === "DIRECT", "empty referrer direct");
assert(
  classifyReferrerHost("https://www.google.com/search?q=test") === "GOOGLE",
  "google referrer",
);
assert(
  classifyReferrerHost("https://l.facebook.com/l.php") === "FACEBOOK",
  "facebook referrer",
);
assert(
  classifyReferrerHost("https://js-growth.com/seo") === "DIRECT",
  "same-site referrer is not external referral",
);
assert(
  classifyReferrerHost("https://partner.example.com/page") === "REFERRAL",
  "external referral",
);
assert(
  inferUtmFromReferrerClass("GOOGLE").source === "google",
  "google inference",
);
assert(
  inferUtmFromReferrerClass("GOOGLE").medium === "organic",
  "google organic medium",
);
assert(
  channelFromAcquisition(
    buildAcquisitionContext({
      source: "google",
      medium: "organic",
      landingPath: "/website-audit",
      entryType: "REFERRER",
      referrerClass: "GOOGLE",
    }),
  ) === "ORGANIC_SEARCH",
  "google organic channel",
);
assert(
  channelFromAcquisition(
    buildAcquisitionContext({
      source: "google_business_profile",
      medium: "organic_local",
      campaign: "gbp_profile",
      landingPath: "/",
      entryType: "UTM",
    }),
  ) === "GBP",
  "gbp requires gbp evidence",
);
assert(
  channelFromAcquisition(
    buildAcquisitionContext({
      source: "google",
      medium: "organic",
      landingPath: "/seo",
      entryType: "REFERRER",
      referrerClass: "GOOGLE",
    }),
  ) !== "GBP",
  "google organic is not gbp",
);
assert(
  channelFromAcquisition(
    buildAcquisitionContext({
      landingPath: "/website-audit",
      entryType: "DIRECT",
      referrerClass: "DIRECT",
    }),
  ) === "DIRECT",
  "direct is direct",
);
assert(channelFromAcquisition(null) === "UNKNOWN", "null unknown");

const fb = buildAcquisitionContext({
  source: "facebook",
  medium: "organic_social",
  campaign: "page_organic",
  content: "company_audit",
  landingPath: "/website-audit",
  entryType: "UTM",
});
assert(fb != null, "fb context");
assert(channelFromAcquisition(fb) === "FACEBOOK", "facebook channel");
assert(
  strengthFromAcquisition(fb) === "DIRECT_FIRST_PARTY",
  "utm strong first party",
);

const normalized = normalizeAcquisitionForPersistence({
  source: "facebook",
  medium: "organic_social",
  campaign: "page_organic",
  content: "company_seo_mistakes_001",
  landingPath: "/website-audit",
  entryType: "UTM",
  acquisitionCaptureVersion: 1,
  email: "leak@example.com",
  reportId: "should-not-persist",
});
assert(normalized?.content === "company_seo_mistakes_001", "content kept");
assert(
  normalized && !("email" in normalized) && !("reportId" in normalized),
  "pii keys not persisted",
);

assert(
  normalizeAcquisitionForPersistence("not-json") === null,
  "invalid returns null",
);
assert(normalizeAcquisitionForPersistence(null) === null, "null returns null");
assert(
  normalizeAcquisitionForPersistence([]) === null,
  "array returns null",
);

const coverage = computeAttributionCoverage([
  "FACEBOOK",
  "DIRECT",
  "UNKNOWN",
  "UNKNOWN",
]);
assert(coverage.knownChannel === 1, "known channel count");
assert(coverage.direct === 1, "direct counts as classified");
assert(coverage.unknown === 2, "unknown count");
assert(coverage.knownRate === 50, "known rate includes direct");

assert(GBP_WEBSITE_UTM.campaign === "gbp_profile", "gbp campaign");
assert(GBP_WEBSITE_UTM.content === "website", "gbp website content");
assert(buildGbpPostContent("tips_001") === "post_tips_001", "gbp post content");

assert(
  GROWTH_EVENTS.facebookFollowCtaClicked === "facebook_follow_cta_clicked",
  "018 event exists",
);

const core = readFileSync(join(here, "acquisition-capture.ts"), "utf8");
assert(!/canvas|webgl|audioFingerprint|getBattery|deviceMemory/i.test(core), "no fingerprinting APIs");
assert(core.includes("FIRST_OBSERVED_RETENTION_DAYS"), "retention documented");
assert(core.includes("90"), "90 day rule");
assert(core.includes("No fingerprinting"), "documents no fingerprinting");

const contactStore = readFileSync(
  join(here, "contact-submission-store.ts"),
  "utf8",
);
assert(contactStore.includes("normalizeAcquisitionForPersistence"), "normalize");
assert(!contactStore.includes("prisma.lead.create"), "no auto lead");
assert(!contactStore.includes("prisma.opportunity"), "no opportunity create");

const contactActions = readFileSync(
  join(here, "../../app/contact/actions.ts"),
  "utf8",
);
assert(contactActions.includes("createContactSubmission"), "persists contact");
assert(
  contactActions.includes("Contact attribution persist error"),
  "attribution failure does not block",
);

const auditActions = readFileSync(
  join(here, "../../app/website-audit/actions.ts"),
  "utf8",
);
assert(
  auditActions.includes("normalizeAcquisitionForPersistence"),
  "audit normalizes",
);

const attrPage = readFileSync(
  join(here, "../../app/reports/growth/attribution/page.tsx"),
  "utf8",
);
assert(attrPage.includes("ACQUISITION_CAPTURE_VERSION"), "attr page version");
assert(!/openai|OpenAI|graph\.facebook\.com/i.test(attrPage), "no apis");

const softCta = readFileSync(
  join(here, "../../components/growth/soft-facebook-follow-cta.tsx"),
  "utf8",
);
assert(softCta.includes("facebook_follow_cta_clicked") || softCta.includes("facebookFollowCtaClicked"), "cta event");
assert(softCta.includes("does not mean a follower"), "follower safety");
assert(softCta.includes("JS_SOLUTIONS_FACEBOOK_PAGE_URL"), "canonical url");

const migration = readFileSync(
  join(
    here,
    "../../../prisma/migrations/20260824120000_growth_sprint10_contact_submission/migration.sql",
  ),
  "utf8",
);
assert(migration.includes("ContactSubmission"), "migration table");
assert(!migration.includes("UPDATE \"AuditReport\""), "no historical audit rewrite");

const research = readFileSync(
  join(here, "../../../docs/research/acquisition-capture-attribution-2026.md"),
  "utf8",
);
assert(research.includes("JS SOLUTIONS DECISION"), "research decisions");

console.log("acquisition capture verification passed");
