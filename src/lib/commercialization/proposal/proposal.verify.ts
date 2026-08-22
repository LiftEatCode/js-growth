/**
 * Commercial Sprint 6 — Proposal Engine V1 verification.
 * Pure deterministic tests. No OpenAI, Places, crawl, Resend, Stripe, or DB.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";
import { OPPORTUNITY_ACTIVITY_TYPES } from "@/lib/commercialization/opportunities/constants";
import { EFFORT_BAND_PRICE_CENTS } from "@/lib/commercialization/pricing/constants";

import {
  buildProposalFromApprovedSources,
  sumClientVisibleInvestmentCents,
} from "./build";
import {
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  COMMERCIAL_PROPOSAL_VERSION,
} from "./constants";
import { buildProposalSourceFingerprint } from "./fingerprint";
import { evaluateProposalStaleness } from "./staleness";
import type { ProposalPricingInput, ProposalScopeInput } from "./build";

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

assert(COMMERCIAL_PROPOSAL_VERSION === 1, "proposal version 1");
assert(
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION === 1,
  "presentation version 1",
);
assert(
  OPPORTUNITY_ACTIVITY_TYPES.includes("PROPOSAL_CREATED"),
  "PROPOSAL_CREATED",
);
assert(
  OPPORTUNITY_ACTIVITY_TYPES.includes("PROPOSAL_APPROVED"),
  "PROPOSAL_APPROVED",
);

function makeFirstChoiceScope(): ProposalScopeInput {
  return {
    id: "scope-1st",
    revision: 2,
    status: "APPROVED",
    title: "1st Choice Air Repair — Implementation Scope",
    summary:
      "Recommended implementation scope based on the current approved website growth recommendations for 1st Choice Air Repair.",
    assumptions: [{ text: "Client will provide timely access credentials." }],
    exclusions: [{ text: "Paid advertising management is not included." }],
    considerations: [
      {
        key: "preserve:performance",
        text: "Preserve the site's current Performance advantage while implementing changes.",
      },
      {
        key: "preserve:performance",
        text: "Preserve the site's current Performance advantage while implementing changes.",
      },
    ],
    sections: [
      {
        id: "sec-content",
        title: "Content Foundation",
        description: "Strengthen content structure and scanability.",
        sortOrder: 0,
        isIncluded: true,
        isOptional: false,
        capabilities: ["CONTENT", "SEO"],
        deliverables: [
          {
            id: "d1",
            title: "Correct heading hierarchy (H1 and supporting headings)",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
          {
            id: "d2",
            title: "Strengthen contextual internal linking between key pages",
            isIncluded: true,
            isOptional: false,
            sortOrder: 1,
          },
          {
            id: "d3",
            title:
              "Improve content structure for scanability (headings, sections)",
            isIncluded: true,
            isOptional: false,
            sortOrder: 2,
          },
        ],
      },
      {
        id: "sec-search",
        title: "Search Optimization",
        description: "Improve on-page search foundations.",
        sortOrder: 1,
        isIncluded: true,
        isOptional: false,
        capabilities: ["SEO"],
        deliverables: [
          {
            id: "d4",
            title: "Correct heading hierarchy (H1 and supporting headings)",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
          {
            id: "d5",
            title: "Strengthen contextual internal linking between key pages",
            isIncluded: true,
            isOptional: false,
            sortOrder: 1,
          },
        ],
      },
      {
        id: "sec-tech",
        title: "Technical SEO",
        description: null,
        sortOrder: 2,
        isIncluded: true,
        isOptional: false,
        capabilities: ["SEO", "WEBSITE_DEVELOPMENT"],
        deliverables: [
          {
            id: "d6",
            title: "Implement or review canonical URL markup",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
          {
            id: "d7",
            title: "Implement or correct LocalBusiness schema",
            isIncluded: true,
            isOptional: false,
            sortOrder: 1,
          },
          {
            id: "d8",
            title: "Review and reduce excessive inline CSS in the document",
            isIncluded: true,
            isOptional: false,
            sortOrder: 2,
          },
          {
            id: "d9",
            title:
              "Reduce blocking script and third-party weight where evidenced",
            isIncluded: true,
            isOptional: false,
            sortOrder: 3,
          },
        ],
      },
      {
        id: "sec-local",
        title: "Local Search Foundation",
        description: null,
        sortOrder: 3,
        isIncluded: true,
        isOptional: false,
        capabilities: ["LOCAL_SEO"],
        deliverables: [
          {
            id: "d10",
            title: "Align NAP (name, address, phone) consistency on-site",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
        ],
      },
      {
        id: "sec-conversion",
        title: "Conversion Optimization",
        description: null,
        sortOrder: 4,
        isIncluded: true,
        isOptional: false,
        capabilities: ["CONVERSION_OPTIMIZATION"],
        deliverables: [
          {
            id: "d11",
            title: "Conversion Optimization assessment",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
        ],
      },
      {
        id: "sec-excluded",
        title: "Excluded Section",
        description: "Should not appear",
        sortOrder: 5,
        isIncluded: false,
        isOptional: false,
        capabilities: ["SEO"],
        deliverables: [
          {
            id: "dx",
            title: "Hidden deliverable",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
        ],
      },
    ],
  };
}

function makeFirstChoicePricing(): ProposalPricingInput {
  const m = EFFORT_BAND_PRICE_CENTS.MEDIUM;
  const a = EFFORT_BAND_PRICE_CENTS.ASSESSMENT;
  return {
    id: "pricing-1st",
    revision: 1,
    status: "APPROVED",
    currency: "USD",
    commercialScopeId: "scope-1st",
    finalIncludedCents: 300_000,
    finalOptionalCents: 0,
    finalTotalCents: 300_000,
    minimumApplied: false,
    minimumEngagementCents: 75_000,
    lineItems: [
      {
        id: "l1",
        title: "Correct heading hierarchy (H1 and supporting headings)",
        quantity: 1,
        recommendedUnitPriceCents: m,
        finalUnitPriceCents: m,
        finalLineTotalCents: m,
        isIncluded: true,
        isOptional: false,
        isCustom: false,
        isOverridden: false,
        effortBand: "MEDIUM",
        sortOrder: 0,
        sourceSectionTitles: ["Content Foundation", "Search Optimization"],
      },
      {
        id: "l2",
        title: "Strengthen contextual internal linking between key pages",
        quantity: 1,
        recommendedUnitPriceCents: m,
        finalUnitPriceCents: m,
        finalLineTotalCents: m,
        isIncluded: true,
        isOptional: false,
        isCustom: false,
        isOverridden: false,
        effortBand: "MEDIUM",
        sortOrder: 1,
        sourceSectionTitles: ["Content Foundation", "Search Optimization"],
      },
      {
        id: "l3",
        title:
          "Improve content structure for scanability (headings, sections)",
        quantity: 1,
        recommendedUnitPriceCents: m,
        finalUnitPriceCents: m,
        finalLineTotalCents: m,
        isIncluded: true,
        isOptional: false,
        isCustom: false,
        isOverridden: false,
        effortBand: "MEDIUM",
        sortOrder: 2,
        sourceSectionTitles: ["Content Foundation"],
      },
      {
        id: "l4",
        title: "Implement or review canonical URL markup",
        quantity: 1,
        recommendedUnitPriceCents: m,
        finalUnitPriceCents: m,
        finalLineTotalCents: m,
        isIncluded: true,
        isOptional: false,
        isCustom: false,
        isOverridden: false,
        effortBand: "MEDIUM",
        sortOrder: 3,
        sourceSectionTitles: ["Technical SEO"],
      },
      {
        id: "l5",
        title: "Implement or correct LocalBusiness schema",
        quantity: 1,
        recommendedUnitPriceCents: m,
        finalUnitPriceCents: m,
        finalLineTotalCents: m,
        isIncluded: true,
        isOptional: false,
        isCustom: false,
        isOverridden: false,
        effortBand: "MEDIUM",
        sortOrder: 4,
        sourceSectionTitles: ["Technical SEO"],
      },
      {
        id: "l6",
        title: "Review and reduce excessive inline CSS in the document",
        quantity: 1,
        recommendedUnitPriceCents: m,
        finalUnitPriceCents: m,
        finalLineTotalCents: m,
        isIncluded: true,
        isOptional: false,
        isCustom: false,
        isOverridden: false,
        effortBand: "MEDIUM",
        sortOrder: 5,
        sourceSectionTitles: ["Technical SEO"],
      },
      {
        id: "l7",
        title:
          "Reduce blocking script and third-party weight where evidenced",
        quantity: 1,
        recommendedUnitPriceCents: m,
        finalUnitPriceCents: m,
        finalLineTotalCents: m,
        isIncluded: true,
        isOptional: false,
        isCustom: false,
        isOverridden: false,
        effortBand: "MEDIUM",
        sortOrder: 6,
        sourceSectionTitles: ["Technical SEO"],
      },
      {
        id: "l8",
        title: "Align NAP (name, address, phone) consistency on-site",
        quantity: 1,
        recommendedUnitPriceCents: m,
        finalUnitPriceCents: m,
        finalLineTotalCents: m,
        isIncluded: true,
        isOptional: false,
        isCustom: false,
        isOverridden: false,
        effortBand: "MEDIUM",
        sortOrder: 7,
        sourceSectionTitles: ["Local Search Foundation"],
      },
      {
        id: "l9",
        title: "Conversion Optimization assessment",
        quantity: 1,
        recommendedUnitPriceCents: a,
        finalUnitPriceCents: a,
        finalLineTotalCents: a,
        isIncluded: true,
        isOptional: false,
        isCustom: false,
        isOverridden: false,
        effortBand: "ASSESSMENT",
        sortOrder: 8,
        sourceSectionTitles: ["Conversion Optimization"],
      },
    ],
  };
}

const scope = makeFirstChoiceScope();
const pricing = makeFirstChoicePricing();

const built = buildProposalFromApprovedSources({
  opportunityId: "opp-1st",
  businessName: "1st Choice Air Repair",
  locationLabel: "Magnolia, TX",
  scope,
  pricing,
});

assert(built.totalInvestmentCents === 300_000, "1st Choice base $3,000");
assert(built.includedInvestmentCents === 300_000, "included base $3,000");
assert(built.optionalInvestmentCents === 0, "no optional dollars in base");
assert(
  sumClientVisibleInvestmentCents(built.snapshot.includedLines) === 300_000,
  "client-visible pricing sum matches approved Pricing",
);
assert(
  built.snapshot.includedLines.filter((l) =>
    l.title.toLowerCase().includes("heading hierarchy"),
  ).length === 1,
  "heading priced once",
);
assert(
  built.snapshot.includedLines.filter((l) =>
    l.title.toLowerCase().includes("internal linking"),
  ).length === 1,
  "internal linking priced once",
);
const heading = built.snapshot.includedLines.find((l) =>
  l.title.toLowerCase().includes("heading hierarchy"),
)!;
assert(
  heading.alsoSupports.includes("Search Optimization") ||
    heading.groupTitle === "Content Foundation",
  "multi-section support without duplicate dollars",
);
assert(
  built.snapshot.sections.every((s) => s.title !== "Excluded Section"),
  "excluded sections do not appear",
);
assert(
  built.snapshot.sections.some((s) => s.title === "Content Foundation"),
  "included sections appear",
);
assert(
  built.snapshot.sections
    .find((s) => s.title === "Content Foundation")!
    .deliverables.some((d) => d.title.includes("scanability")),
  "included deliverables appear",
);
assert(built.snapshot.optionalSections.length === 0, "no optional when none");
assert(
  built.snapshot.assumptions.includes(
    "Client will provide timely access credentials.",
  ),
  "assumptions copied",
);
assert(
  built.snapshot.exclusions.includes(
    "Paid advertising management is not included.",
  ),
  "exclusions copied",
);
assert(built.snapshot.considerations.length === 1, "considerations deduped");
assert(
  !JSON.stringify(built.snapshot).includes("heading-architecture"),
  "no source keys in snapshot",
);
assert(
  !JSON.stringify(built.snapshot).includes("MEDIUM"),
  "no pricing enums in snapshot",
);
assert(
  !JSON.stringify(built.snapshot).includes("CONFIGURATION"),
  "no work type enums required in client snapshot lines",
);
assert(
  !JSON.stringify(built).includes("overrideReason"),
  "no override reasons",
);

// Snapshot frozen: changing catalog prices would not affect built totals
assert(built.includedInvestmentCents === 300_000, "does not recalculate pricing");

// Gates via builder throws
let threw = false;
try {
  buildProposalFromApprovedSources({
    opportunityId: "opp",
    businessName: "X",
    locationLabel: null,
    scope: { ...scope, status: "DRAFT" },
    pricing,
  });
} catch {
  threw = true;
}
assert(threw, "draft scope blocked");

threw = false;
try {
  buildProposalFromApprovedSources({
    opportunityId: "opp",
    businessName: "X",
    locationLabel: null,
    scope,
    pricing: {
      ...pricing,
      lineItems: [
        ...pricing.lineItems,
        {
          id: "custom",
          title: "Custom rebuild",
          quantity: 1,
          recommendedUnitPriceCents: null,
          finalUnitPriceCents: null,
          finalLineTotalCents: null,
          isIncluded: true,
          isOptional: false,
          isCustom: true,
          isOverridden: false,
          effortBand: "CUSTOM",
          sortOrder: 99,
          sourceSectionTitles: [],
        },
      ],
    },
  });
} catch {
  threw = true;
}
assert(threw, "incomplete pricing blocked");

threw = false;
try {
  buildProposalFromApprovedSources({
    opportunityId: "opp",
    businessName: "X",
    locationLabel: null,
    scope,
    pricing: { ...pricing, commercialScopeId: "other-scope" },
  });
} catch {
  threw = true;
}
assert(threw, "mismatched pricing blocked");

// Optional work separated from base investment
const withOptional = buildProposalFromApprovedSources({
  opportunityId: "opp-opt",
  businessName: "Optional Co",
  locationLabel: null,
  scope: {
    ...scope,
    id: "scope-opt",
    sections: [
      ...scope.sections.filter((s) => s.isIncluded),
      {
        id: "sec-opt",
        title: "Optional Content Expansion",
        description: null,
        sortOrder: 9,
        isIncluded: true,
        isOptional: true,
        capabilities: ["CONTENT"],
        deliverables: [
          {
            id: "d-opt",
            title: "Optional blog content package",
            isIncluded: true,
            isOptional: true,
            sortOrder: 0,
          },
        ],
      },
    ],
  },
  pricing: {
    ...pricing,
    id: "pricing-opt",
    commercialScopeId: "scope-opt",
    finalIncludedCents: 300_000,
    finalOptionalCents: 35_000,
    finalTotalCents: 300_000,
    lineItems: [
      ...pricing.lineItems,
      {
        id: "l-opt",
        title: "Optional blog content package",
        quantity: 1,
        recommendedUnitPriceCents: 35_000,
        finalUnitPriceCents: 35_000,
        finalLineTotalCents: 35_000,
        isIncluded: true,
        isOptional: true,
        isCustom: false,
        isOverridden: false,
        effortBand: "MEDIUM",
        sortOrder: 99,
        sourceSectionTitles: ["Optional Content Expansion"],
      },
    ],
  },
});
assert(
  withOptional.includedInvestmentCents === 300_000,
  "optional dollars not in base investment",
);
assert(
  withOptional.optionalInvestmentCents === 35_000,
  "optional dollars separated",
);
assert(
  withOptional.totalInvestmentCents === 335_000,
  "potential total includes options",
);
assert(withOptional.snapshot.optionalSections.length === 1, "optional section");
assert(withOptional.snapshot.optionalLines.length === 1, "optional line");

// Staleness
const fp = built.sourceFingerprint;
assert(
  evaluateProposalStaleness({
    storedFingerprint: fp,
    current: {
      opportunityId: "opp-1st",
      commercialScopeId: "scope-new",
      scopeRevision: 3,
      commercialPricingId: "pricing-1st",
      pricingRevision: 1,
      proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
      presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
    },
  }).stale,
  "staleness after scope change",
);
assert(
  buildProposalSourceFingerprint({
    opportunityId: "opp-1st",
    commercialScopeId: "scope-1st",
    scopeRevision: 2,
    commercialPricingId: "pricing-1st",
    pricingRevision: 1,
    proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
    presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  }) === fp,
  "fingerprint stable for same inputs",
);

// Source scans
const moduleFiles = collectTsFiles(join(here)).filter(
  (f) => !f.endsWith(".verify.ts"),
);
for (const file of moduleFiles) {
  const source = readFileSync(file, "utf8");
  assert(!/openai|OpenAI|responses\.create/i.test(source), `${file}: no OpenAI`);
  assert(!/places\.googleapis|GOOGLE_PLACES/i.test(source), `${file}: no Places`);
  assert(!/resend|Resend\(/i.test(source), `${file}: no Resend`);
  assert(!/\bstripe\b|Stripe\(/i.test(source), `${file}: no Stripe`);
  assert(
    !/runDeterministicWebsiteAudit|discoverContacts/i.test(source),
    `${file}: no crawl/contact`,
  );
}

const createSource = readFileSync(join(here, "create.ts"), "utf8");
assert(createSource.includes("PROPOSAL_CREATED"), "lifecycle create");
assert(createSource.includes("PROPOSAL_REVISED"), "lifecycle revise");
assert(createSource.includes("SCOPE_NOT_APPROVED"), "scope gate");
assert(createSource.includes("PRICING_NOT_APPROVED"), "pricing gate");
assert(createSource.includes("PRICING_INCOMPLETE"), "complete gate");
assert(createSource.includes("PRICING_STALE"), "stale pricing gate");

const mutateSource = readFileSync(join(here, "mutate.ts"), "utf8");
assert(mutateSource.includes("IMMUTABLE"), "approved immutable");
assert(mutateSource.includes("PROPOSAL_APPROVED"), "approve activity");
assert(mutateSource.includes("PROPOSAL_REVIEWED"), "reviewed activity");
assert(
  mutateSource.includes("Mark the Proposal reviewed before approving"),
  "approve requires REVIEWED",
);
assert(
  !mutateSource.includes("finalUnitPriceCents"),
  "commercial facts not editable in proposal mutate",
);

const actionsSource = readFileSync(
  join(repoRoot, "src/app/reports/opportunities/proposal-actions.ts"),
  "utf8",
);
assert(actionsSource.includes("getInternalSession"), "internal session");

const docSource = readFileSync(
  join(repoRoot, "src/components/opportunities/proposal-document.tsx"),
  "utf8",
);
assert(!docSource.includes("sourceActionKey"), "preview hides action keys");
assert(!docSource.includes("workUnitKey"), "preview hides work unit keys");
assert(!docSource.includes("effortBand"), "preview hides effort bands");
assert(!docSource.includes("overrideReason"), "preview hides override reasons");
assert(docSource.includes("Base Implementation Investment"), "investment section");

const publicFiles = collectTsFiles(join(repoRoot, "src/app/report"));
for (const file of publicFiles) {
  const source = readFileSync(file, "utf8");
  assert(
    !source.includes("CommercialProposal") &&
      !source.includes("loadCommercialProposal") &&
      !source.includes("/proposal/"),
    `${file}: no Proposal on public report routes`,
  );
}

assert(isForbiddenAnalyticsParamKey("proposal_id"), "proposal_id forbidden");
assert(
  isForbiddenAnalyticsParamKey("proposal_status"),
  "proposal_status forbidden",
);
assert(
  isForbiddenAnalyticsParamKey("proposal_total"),
  "proposal_total forbidden",
);
assert(
  isForbiddenAnalyticsParamKey("commercial_proposal"),
  "commercial_proposal forbidden",
);

const migration = readFileSync(
  join(
    repoRoot,
    "prisma/migrations/20260821200000_add_commercial_proposals/migration.sql",
  ),
  "utf8",
);
assert(migration.includes("CommercialProposal"), "migration adds proposal");
assert(migration.includes("PROPOSAL_CREATED"), "migration activity enums");

console.log("proposal.verify.ts: PASS");
