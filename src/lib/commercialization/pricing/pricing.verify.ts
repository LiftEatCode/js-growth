/**
 * Commercial Sprint 5 — Pricing Engine V1 verification.
 * Pure deterministic tests. No OpenAI, Places, crawl, Resend, Stripe, or DB.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";
import { OPPORTUNITY_ACTIVITY_TYPES } from "@/lib/commercialization/opportunities/constants";

import { buildPricingFromScope } from "./build";
import {
  COMMERCIAL_PRICING_CONFIG_VERSION,
  COMMERCIAL_PRICING_CURRENCY,
  COMMERCIAL_PRICING_VERSION,
  EFFORT_BAND_PRICE_CENTS,
  MINIMUM_ENGAGEMENT_CENTS,
} from "./constants";
import { buildPricingSourceFingerprint } from "./fingerprint";
import { evaluatePricingStaleness } from "./staleness";
import { computePricingTotals } from "./totals";
import {
  looksLikeVagueConversionAssessment,
  resolveWorkUnitFromDeliverable,
  WORK_UNIT_CATALOG,
} from "./work-units";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function collectTsFiles(root: string): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(root, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(full));
      continue;
    }
    if (extname(full) === ".ts" || extname(full) === ".tsx") {
      files.push(full);
    }
  }
  return files;
}

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../../..");

assert(COMMERCIAL_PRICING_VERSION === 1, "pricing version 1");
assert(COMMERCIAL_PRICING_CONFIG_VERSION === 1, "pricing config version 1");
assert(COMMERCIAL_PRICING_CURRENCY === "USD", "USD V1");
assert(EFFORT_BAND_PRICE_CENTS.SMALL === 15_000, "SMALL = $150");
assert(EFFORT_BAND_PRICE_CENTS.MEDIUM === 35_000, "MEDIUM = $350");
assert(EFFORT_BAND_PRICE_CENTS.LARGE === 75_000, "LARGE = $750");
assert(EFFORT_BAND_PRICE_CENTS.ASSESSMENT === 20_000, "ASSESSMENT = $200");
assert(MINIMUM_ENGAGEMENT_CENTS === 75_000, "minimum engagement $750");

assert(
  OPPORTUNITY_ACTIVITY_TYPES.includes("PRICING_CREATED"),
  "PRICING_CREATED activity",
);
assert(
  OPPORTUNITY_ACTIVITY_TYPES.includes("PRICING_APPROVED"),
  "PRICING_APPROVED activity",
);

// --- 1st Choice Air Repair style fixture: overlapping heading + linking ---
function makeFirstChoiceScope() {
  return {
    id: "scope-1st-choice",
    revision: 1,
    status: "APPROVED",
    sections: [
      {
        id: "sec-content",
        title: "Content Foundation",
        isIncluded: true,
        isOptional: false,
        sortOrder: 0,
        deliverables: [
          {
            id: "d-heading-content",
            title: "Correct heading hierarchy (H1 and supporting headings)",
            sourceActionKey: "heading-architecture",
            source: "PLAN",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
          {
            id: "d-linking-content",
            title: "Strengthen contextual internal linking between key pages",
            sourceActionKey: "internal-linking",
            source: "PLAN",
            isIncluded: true,
            isOptional: false,
            sortOrder: 1,
          },
          {
            id: "d-content-depth",
            title: "Expand service page content depth",
            sourceActionKey: "content-depth",
            source: "PLAN",
            isIncluded: true,
            isOptional: false,
            sortOrder: 2,
          },
        ],
      },
      {
        id: "sec-search",
        title: "Search Optimization",
        isIncluded: true,
        isOptional: false,
        sortOrder: 1,
        deliverables: [
          {
            id: "d-meta",
            title: "Improve meta descriptions for clarity and uniqueness",
            sourceActionKey: "improve-meta",
            source: "PLAN",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
          {
            id: "d-heading-search",
            title: "Correct heading hierarchy (H1 and supporting headings)",
            sourceActionKey: "heading-architecture",
            source: "PLAN",
            isIncluded: true,
            isOptional: false,
            sortOrder: 1,
          },
          {
            id: "d-linking-search",
            title: "Strengthen contextual internal linking between key pages",
            sourceActionKey: "internal-linking",
            source: "PLAN",
            isIncluded: true,
            isOptional: false,
            sortOrder: 2,
          },
          {
            id: "d-og",
            title: "Complete Open Graph metadata for shared pages",
            sourceActionKey: "open-graph",
            source: "PLAN",
            isIncluded: true,
            isOptional: false,
            sortOrder: 3,
          },
        ],
      },
      {
        id: "sec-conversion",
        title: "Conversion Optimization",
        isIncluded: true,
        isOptional: false,
        sortOrder: 2,
        deliverables: [
          {
            id: "d-vague-conversion",
            title: "Conversion Optimization",
            sourceActionKey: null,
            source: "MANUAL",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
        ],
      },
    ],
  };
}

const firstChoice = buildPricingFromScope({
  opportunityId: "opp-1st-choice",
  scope: makeFirstChoiceScope(),
});

const headingLines = firstChoice.lineItems.filter(
  (l) => l.workUnitKey === "heading-architecture",
);
const linkingLines = firstChoice.lineItems.filter(
  (l) => l.workUnitKey === "internal-linking",
);
assert(headingLines.length === 1, "heading hierarchy priced ONCE");
assert(linkingLines.length === 1, "internal linking priced ONCE");
assert(
  headingLines[0]!.sourceSectionTitles.includes("Content Foundation") &&
    headingLines[0]!.sourceSectionTitles.includes("Search Optimization"),
  "heading multi-section provenance retained",
);
assert(
  linkingLines[0]!.sourceSectionTitles.includes("Content Foundation") &&
    linkingLines[0]!.sourceSectionTitles.includes("Search Optimization"),
  "linking multi-section provenance retained",
);
assert(
  headingLines[0]!.recommendedUnitPriceCents === EFFORT_BAND_PRICE_CENTS.MEDIUM,
  "heading MEDIUM price once",
);
assert(
  linkingLines[0]!.recommendedUnitPriceCents === EFFORT_BAND_PRICE_CENTS.MEDIUM,
  "linking MEDIUM price once",
);

const conversionLine = firstChoice.lineItems.find(
  (l) => l.workUnitKey === "conversion-assessment",
);
assert(conversionLine != null, "vague conversion mapped");
assert(
  conversionLine!.effortBand === "ASSESSMENT",
  "vague Conversion Optimization classified as ASSESSMENT",
);
assert(
  conversionLine!.recommendedUnitPriceCents ===
    EFFORT_BAND_PRICE_CENTS.ASSESSMENT,
  "assessment priced at $200",
);
assert(
  !looksLikeVagueConversionAssessment(
    "Add or strengthen trust signals near conversion points",
  ),
  "concrete trust signals not vague assessment",
);

// Work unit catalog coverage
assert(WORK_UNIT_CATALOG.length >= 10, "catalog has core mappings");
assert(
  resolveWorkUnitFromDeliverable({
    sourceActionKey: "canonical",
    title: "Implement or review canonical URL markup",
    source: "PLAN",
  }).effortBand === "MEDIUM",
  "canonical MEDIUM",
);

// Minimum engagement
const tiny = buildPricingFromScope({
  opportunityId: "opp-tiny",
  scope: {
    id: "scope-tiny",
    revision: 1,
    status: "APPROVED",
    sections: [
      {
        id: "s1",
        title: "Search Optimization",
        isIncluded: true,
        isOptional: false,
        sortOrder: 0,
        deliverables: [
          {
            id: "d1",
            title: "Improve meta descriptions",
            sourceActionKey: "improve-meta",
            source: "PLAN",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
        ],
      },
    ],
  },
});
assert(tiny.recommendedIncludedCents === 15_000, "tiny included $150");
assert(tiny.minimumApplied === true, "minimum engagement applied");
assert(tiny.recommendedTotalCents === 75_000, "total lifted to $750");

// Assessment-only exception
const assessmentOnly = buildPricingFromScope({
  opportunityId: "opp-assess",
  scope: {
    id: "scope-assess",
    revision: 1,
    status: "APPROVED",
    sections: [
      {
        id: "s1",
        title: "Conversion Optimization",
        isIncluded: true,
        isOptional: false,
        sortOrder: 0,
        deliverables: [
          {
            id: "d1",
            title: "Conversion Optimization",
            sourceActionKey: null,
            source: "MANUAL",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
        ],
      },
    ],
  },
});
assert(assessmentOnly.assessmentOnly === true, "assessment-only flag");
assert(
  assessmentOnly.recommendedTotalCents === 20_000,
  "assessment-only minimum exception ($200 not $750)",
);
assert(assessmentOnly.minimumApplied === false, "min not applied for assessment-only");

// Optional work separated
const withOptional = buildPricingFromScope({
  opportunityId: "opp-opt",
  scope: {
    id: "scope-opt",
    revision: 1,
    status: "APPROVED",
    sections: [
      {
        id: "s1",
        title: "Search Optimization",
        isIncluded: true,
        isOptional: false,
        sortOrder: 0,
        deliverables: [
          {
            id: "d1",
            title: "Improve meta descriptions",
            sourceActionKey: "improve-meta",
            source: "PLAN",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
          {
            id: "d2",
            title: "Complete Open Graph metadata",
            sourceActionKey: "open-graph",
            source: "PLAN",
            isIncluded: true,
            isOptional: true,
            sortOrder: 1,
          },
        ],
      },
    ],
  },
});
assert(withOptional.recommendedOptionalCents === 15_000, "optional priced separately");
assert(
  withOptional.lineItems.some((l) => l.workUnitKey === "open-graph" && l.isOptional),
  "optional flag retained",
);

// Custom work
const custom = resolveWorkUnitFromDeliverable({
  sourceActionKey: null,
  title: "Rebuild homepage hero section",
  source: "MANUAL",
});
assert(custom.isCustom === true, "unrecognized manual → CUSTOM");
assert(custom.effortBand === "CUSTOM", "CUSTOM band");

const customBuilt = buildPricingFromScope({
  opportunityId: "opp-custom",
  scope: {
    id: "scope-custom",
    revision: 1,
    status: "APPROVED",
    sections: [
      {
        id: "s1",
        title: "Website Experience",
        isIncluded: true,
        isOptional: false,
        sortOrder: 0,
        deliverables: [
          {
            id: "d1",
            title: "Rebuild homepage hero section",
            sourceActionKey: null,
            source: "MANUAL",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
        ],
      },
    ],
  },
});
assert(
  customBuilt.lineItems[0]!.recommendedUnitPriceCents == null,
  "CUSTOM has no deterministic recommendation",
);
assert(
  customBuilt.lineItems[0]!.finalUnitPriceCents == null,
  "CUSTOM requires human-entered price",
);

// Override preserves recommendation in totals helper
const overridden = computePricingTotals([
  {
    workUnitKey: "improve-meta",
    title: "Improve meta",
    workType: "CONFIGURATION",
    effortBand: "SMALL",
    quantity: 1,
    recommendedUnitPriceCents: 15_000,
    recommendedLineTotalCents: 15_000,
    finalUnitPriceCents: 20_000,
    finalLineTotalCents: 20_000,
    isOptional: false,
    isIncluded: true,
    isCustom: false,
    isOverridden: true,
    overrideReason: "Client urgency",
    sourceDeliverableIds: ["d1"],
    sourceSectionTitles: ["Search Optimization"],
    sortOrder: 0,
  },
]);
assert(overridden.recommendedIncludedCents === 15_000, "recommendation preserved");
assert(overridden.finalIncludedCents === 20_000, "final uses override");

// Staleness
const fp = firstChoice.sourceFingerprint;
assert(
  evaluatePricingStaleness({
    storedFingerprint: fp,
    current: {
      opportunityId: "opp-1st-choice",
      commercialScopeId: "scope-other",
      scopeRevision: 1,
      scopeStatus: "APPROVED",
      pricingVersion: COMMERCIAL_PRICING_VERSION,
      pricingConfigVersion: COMMERCIAL_PRICING_CONFIG_VERSION,
    },
  }).stale,
  "scope change → stale",
);
assert(
  evaluatePricingStaleness({
    storedFingerprint: buildPricingSourceFingerprint({
      opportunityId: "opp-1st-choice",
      commercialScopeId: "scope-1st-choice",
      scopeRevision: 1,
      scopeStatus: "APPROVED",
      pricingVersion: COMMERCIAL_PRICING_VERSION,
      pricingConfigVersion: 0,
    }),
    current: {
      opportunityId: "opp-1st-choice",
      commercialScopeId: "scope-1st-choice",
      scopeRevision: 1,
      scopeStatus: "APPROVED",
      pricingVersion: COMMERCIAL_PRICING_VERSION,
      pricingConfigVersion: COMMERCIAL_PRICING_CONFIG_VERSION,
    },
  }).stale,
  "config version change → stale",
);

// Integer cents only in config
for (const value of Object.values(EFFORT_BAND_PRICE_CENTS)) {
  assert(Number.isInteger(value), "band prices integer cents");
}

// Source scans
const moduleFiles = collectTsFiles(join(here)).filter(
  (f) => !f.endsWith(".verify.ts"),
);
for (const file of moduleFiles) {
  const source = readFileSync(file, "utf8");
  assert(!/openai|OpenAI|responses\.create/i.test(source), `${file}: no OpenAI`);
  assert(!/places\.googleapis|GOOGLE_PLACES/i.test(source), `${file}: no Places`);
  assert(!/resend|Resend\(/i.test(source), `${file}: no Resend`);
  assert(!/stripe|Stripe\(/i.test(source), `${file}: no Stripe`);
  assert(
    !/runDeterministicWebsiteAudit|discoverContacts/i.test(source),
    `${file}: no crawl/contact`,
  );
  assert(!/\bStripe\b|stripe\./i.test(source), `${file}: no Stripe SDK`);
}

const createSource = readFileSync(join(here, "create.ts"), "utf8");
assert(createSource.includes("PRICING_CREATED"), "lifecycle PRICING_CREATED");
assert(createSource.includes("PRICING_REVISED"), "revision");
assert(createSource.includes("SUPERSEDED"), "supersede");
assert(createSource.includes("SCOPE_NOT_APPROVED"), "requires approved scope");

const mutateSource = readFileSync(join(here, "mutate.ts"), "utf8");
assert(mutateSource.includes("IMMUTABLE"), "approved immutable");
assert(mutateSource.includes("OVERRIDE_REASON_REQUIRED"), "override reason");
assert(mutateSource.includes("CUSTOM_PRICE_REQUIRED"), "custom price gate");
assert(mutateSource.includes("PRICING_APPROVED"), "approve activity");

const actionsSource = readFileSync(
  join(repoRoot, "src/app/reports/opportunities/pricing-actions.ts"),
  "utf8",
);
assert(actionsSource.includes("getInternalSession"), "internal session");

const previewPage = readFileSync(
  join(
    repoRoot,
    "src/app/reports/opportunities/[opportunityId]/pricing/[pricingId]/page.tsx",
  ),
  "utf8",
);
assert(previewPage.includes("preview"), "preview mode");
assert(previewPage.includes("Investment summary"), "client-readable preview");
assert(!previewPage.includes("workUnitKey"), "preview hides work unit keys");

const publicFiles = collectTsFiles(join(repoRoot, "src/app/report"));
for (const file of publicFiles) {
  const source = readFileSync(file, "utf8");
  assert(
    !source.includes("CommercialPricing") &&
      !source.includes("loadCommercialPricing") &&
      !source.includes("/pricing/"),
    `${file}: no Pricing on public report routes`,
  );
}

assert(isForbiddenAnalyticsParamKey("pricing_id"), "pricing_id forbidden");
assert(isForbiddenAnalyticsParamKey("pricing_status"), "pricing_status forbidden");
assert(isForbiddenAnalyticsParamKey("pricing_total"), "pricing_total forbidden");
assert(isForbiddenAnalyticsParamKey("commercial_pricing"), "commercial_pricing forbidden");
assert(isForbiddenAnalyticsParamKey("override_reason"), "override_reason forbidden");

const migration = readFileSync(
  join(
    repoRoot,
    "prisma/migrations/20260821120000_add_commercial_pricing/migration.sql",
  ),
  "utf8",
);
assert(migration.includes("CommercialPricing"), "migration adds CommercialPricing");
assert(
  migration.includes("CommercialPricingLineItem"),
  "migration adds line items",
);
assert(migration.includes("PRICING_CREATED"), "migration adds activity enums");

console.log("pricing.verify.ts: PASS");
