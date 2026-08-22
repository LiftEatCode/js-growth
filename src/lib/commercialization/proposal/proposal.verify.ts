/**
 * Commercial Sprint 6 / 6.1 / 6.2 — Proposal Engine verification.
 * Pure deterministic tests. No OpenAI, Places, crawl, Resend, Stripe, or DB.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";
import {
  IMPLEMENTATION_MAPPING_VERSION,
  IMPLEMENTATION_PLAN_VERSION,
} from "@/lib/commercialization/implementation-plan/constants";
import type { LoadedImplementationPlan } from "@/lib/commercialization/implementation-plan/load";
import { OPPORTUNITY_ACTIVITY_TYPES } from "@/lib/commercialization/opportunities/constants";
import { buildPricingFromScope } from "@/lib/commercialization/pricing/build";
import { EFFORT_BAND_PRICE_CENTS } from "@/lib/commercialization/pricing/constants";
import { buildScopeFromPlan } from "@/lib/commercialization/scope/build";
import type { PreservationConstraint } from "@/lib/commercialization/implementation-plan/types";

import {
  buildProposalFromApprovedSources,
  sumClientVisibleGroupCents,
  sumClientVisibleInvestmentCents,
} from "./build";
import {
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  COMMERCIAL_PROPOSAL_VERSION,
} from "./constants";
import { buildProposalSourceFingerprint } from "./fingerprint";
import {
  deliverablePresentationLabel,
  getSectionClientValueExplanation,
  investmentIncludeLabelForLine,
  isInternalAuditFindingLanguage,
  polishDeliverableLabel,
  resolveFinancialGroup,
  WORK_UNIT_INVESTMENT_INCLUDE_LABELS,
} from "./presentation";
import {
  __testLabelLooksLikeWrongAction,
  ProposalFinancialReconciliationError,
} from "./reconcile";
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
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION === 3,
  "presentation version 3",
);
assert(
  OPPORTUNITY_ACTIVITY_TYPES.includes("PROPOSAL_CREATED"),
  "PROPOSAL_CREATED",
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
        key: "preserve:accessibility",
        text: "Preserve current Accessibility strength while implementing changes.",
      },
    ],
    sections: [
      {
        id: "sec-content",
        title: "Content Foundation",
        description: "3 supporting audit findings",
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
        description: "4 supporting audit findings",
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
        id: "sec-perf",
        title: "Performance Optimization",
        description: "1 supporting audit finding",
        sortOrder: 2,
        isIncluded: true,
        isOptional: false,
        capabilities: ["WEBSITE_DEVELOPMENT"],
        deliverables: [
          {
            id: "d-css",
            title: "Review and reduce excessive inline CSS in the document",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
          {
            id: "d-script",
            title:
              "Reduce blocking script and third-party weight where evidenced",
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
        sortOrder: 3,
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
        ],
      },
      {
        id: "sec-local",
        title: "Local Search Foundation",
        description: null,
        sortOrder: 4,
        isIncluded: true,
        isOptional: false,
        capabilities: ["LOCAL_SEO"],
        deliverables: [
          {
            id: "d7",
            title: "Implement or correct LocalBusiness schema",
            isIncluded: true,
            isOptional: false,
            sortOrder: 0,
          },
          {
            id: "d10",
            title: "Align NAP (name, address, phone) consistency on-site",
            isIncluded: true,
            isOptional: false,
            sortOrder: 1,
          },
        ],
      },
      {
        id: "sec-conversion",
        title: "Conversion Optimization",
        description: null,
        sortOrder: 5,
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
        sortOrder: 6,
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
        workUnitKey: "heading-architecture",
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
        workUnitKey: "internal-linking",
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
        workUnitKey: "scanability",
      },
      {
        id: "l4",
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
        sortOrder: 3,
        sourceSectionTitles: ["Performance Optimization"],
        workUnitKey: "inline-css",
      },
      {
        id: "l5",
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
        sortOrder: 4,
        sourceSectionTitles: ["Performance Optimization"],
        workUnitKey: "script-weight",
      },
      {
        id: "l6",
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
        sortOrder: 5,
        sourceSectionTitles: ["Technical SEO"],
        workUnitKey: "canonical",
      },
      {
        id: "l7",
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
        sortOrder: 6,
        sourceSectionTitles: ["Local Search Foundation"],
        workUnitKey: "local-schema",
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
        workUnitKey: "nap",
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
        workUnitKey: "conversion-assessment",
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
  overallScore: 79,
  scope,
  pricing,
});

assert(built.presentationVersion === 3, "built presentation version 3");
assert(built.totalInvestmentCents === 300_000, "1st Choice base $3,000");
assert(built.includedInvestmentCents === 300_000, "included $3,000");
assert(built.optionalInvestmentCents === 0, "no optional dollars");

const clientJson = JSON.stringify({
  summary: built.executiveSummary,
  context: built.businessContext,
  snapshot: built.snapshot,
  next: built.nextStepText,
  timeline: built.timelineNote,
});

assert(!/supporting audit finding/i.test(clientJson), "no audit finding counts");
assert(!clientJson.includes("MEDIUM"), "no effort bands");
assert(
  !clientJson.includes('"ASSESSMENT"') &&
    !/\beffortBand\b/.test(clientJson),
  "no ASSESSMENT enum / effortBand fields",
);
assert(!clientJson.includes("CONFIGURATION"), "no work type enums");
assert(!clientJson.includes("heading-architecture"), "no work unit keys");
assert(!clientJson.includes("sourceActionKey"), "no source keys");
assert(!clientJson.includes("overrideReason"), "no override reasons");
assert(!/will increase (traffic|rankings|leads|revenue)/i.test(clientJson), "no outcome guarantees");
assert(!/\bguarantee(s|d)?\b/i.test(built.executiveSummary), "summary no guarantee");
assert(!/\bROI\b|\bpayback\b/i.test(clientJson), "no ROI framing");

assert(
  built.businessContext?.includes("Website Growth Score of 79/100"),
  "polished score language",
);
assert(
  !built.businessContext?.includes("is the focus of this implementation"),
  "no mechanical focus boilerplate",
);
assert(
  !built.businessContext?.includes(scope.summary!),
  "does not paste raw scope summary",
);

const noScore = buildProposalFromApprovedSources({
  opportunityId: "opp-1st",
  businessName: "1st Choice Air Repair",
  locationLabel: "Magnolia, TX",
  overallScore: null,
  scope,
  pricing,
});
assert(
  !noScore.businessContext?.includes("Website Growth Score"),
  "score omitted when unavailable",
);

assert(
  getSectionClientValueExplanation("Content Foundation")?.includes(
    "content foundation",
  ),
  "content client value",
);
assert(
  getSectionClientValueExplanation("Search Optimization")?.includes(
    "search engines",
  ),
  "search client value",
);
assert(
  getSectionClientValueExplanation("Performance Optimization")?.includes(
    "performance",
  ),
  "performance client value",
);
assert(
  getSectionClientValueExplanation("Technical SEO")?.includes("technical"),
  "technical client value",
);
assert(
  getSectionClientValueExplanation("Local Search Foundation")?.includes(
    "local",
  ),
  "local client value",
);
assert(
  getSectionClientValueExplanation("Conversion Optimization", {
    assessmentSection: true,
  })?.includes("contact paths"),
  "conversion assessment value",
);

for (const section of built.snapshot.sections) {
  assert(section.clientValueExplanation, `${section.title} has why-it-matters`);
  assert(
    !isInternalAuditFindingLanguage(section.clientValueExplanation ?? ""),
    `${section.title} no audit counts`,
  );
}

const conversion = built.snapshot.sections.find(
  (s) => s.title === "Conversion Optimization",
)!;
assert(
  conversion.clientValueExplanation?.includes("identify"),
  "conversion explains assessment",
);
assert(
  conversion.deliverables.some((d) => d.title === "Conversion Path Assessment"),
  "conversion label polished",
);
assert(
  !conversion.deliverables.some((d) =>
    /full conversion implementation|rebuild conversion/i.test(d.title),
  ),
  "assessment not sold as implementation",
);

assert(
  polishDeliverableLabel(
    "Correct heading hierarchy (H1 and supporting headings)",
    { workUnitKey: "heading-architecture" },
  ).includes("heading structure"),
  "heading label polished",
);
assert(
  polishDeliverableLabel("Custom rebuild of booking flow", { isCustom: true }) ===
    "Custom rebuild of booking flow",
  "unknown manual deliverable falls back",
);

// Authoritative Scope titles preserved on snapshot sourceTitle
assert(
  built.snapshot.sections
    .flatMap((s) => s.deliverables)
    .some(
      (d) =>
        d.sourceTitle ===
        "Correct heading hierarchy (H1 and supporting headings)",
    ),
  "authoritative Scope titles retained as sourceTitle",
);

assert(
  built.snapshot.includedLines.filter((l) =>
    l.includeLabel.toLowerCase().includes("heading"),
  ).length === 1,
  "heading priced once",
);
assert(
  built.snapshot.includedLines.filter((l) =>
    l.includeLabel.toLowerCase().includes("internal linking"),
  ).length === 1,
  "internal linking priced once",
);

const groups = built.snapshot.includedInvestmentGroups;
const byTitle = (title: string) => groups.find((g) => g.title === title);

assert(byTitle("Content & Search Foundation")?.subtotalCents === 105_000, "Content+Search $1,050");
assert(byTitle("Performance Optimization")?.subtotalCents === 70_000, "Performance $700");
assert(byTitle("Technical SEO")?.subtotalCents === 35_000, "Technical $350");
assert(byTitle("Local Search Foundation")?.subtotalCents === 70_000, "Local $700");
assert(byTitle("Conversion Path Assessment")?.subtotalCents === 20_000, "Conversion $200");

assert(
  !groups.some((g) => g.title === "Search Optimization"),
  "Search not a separate $0 financial group",
);
assert(
  sumClientVisibleGroupCents(groups) === 300_000,
  "group totals sum to $3,000",
);
assert(
  sumClientVisibleGroupCents(groups) === built.includedInvestmentCents,
  "groups equal approved includedInvestmentCents",
);
assert(
  sumClientVisibleInvestmentCents(built.snapshot.includedLines) === 300_000,
  "line sum matches",
);

assert(
  built.snapshot.considerations.some((c) =>
    c.includes("Protect the site's existing performance strengths"),
  ),
  "considerations polished",
);
assert(
  built.snapshot.considerations.some((c) =>
    c.includes("accessibility strengths"),
  ),
  "accessibility consideration polished",
);

assert(!/\b\d+\s*days?\b/i.test(built.timelineNote), "timeline no duration");
assert(!/accept|payment|checkout|sign/i.test(built.nextStepText), "next step no acceptance/payment");

assert(
  resolveFinancialGroup({
    sourceSectionTitles: ["Content Foundation", "Search Optimization"],
    workUnitKey: "heading-architecture",
  }).title === "Content & Search Foundation",
  "financial ownership content+search",
);
assert(
  resolveFinancialGroup({
    sourceSectionTitles: ["Conversion Optimization"],
    workUnitKey: "trust-signals",
  }).title === "Conversion Optimization",
  "trust-signals maps to Conversion Optimization group",
);
assert(
  resolveFinancialGroup({
    sourceSectionTitles: ["Conversion Optimization"],
    workUnitKey: "conversion-assessment",
  }).title === "Conversion Path Assessment",
  "conversion-assessment maps to assessment group",
);

// Historical presentation v1 fingerprint is stale vs current version
const v1Fingerprint = buildProposalSourceFingerprint({
  opportunityId: "opp-1st",
  commercialScopeId: "scope-1st",
  scopeRevision: 2,
  commercialPricingId: "pricing-1st",
  pricingRevision: 1,
  proposalVersion: 1,
  presentationVersion: 1,
});
assert(
  evaluateProposalStaleness({
    storedFingerprint: v1Fingerprint,
    current: {
      opportunityId: "opp-1st",
      commercialScopeId: "scope-1st",
      scopeRevision: 2,
      commercialPricingId: "pricing-1st",
      pricingRevision: 1,
      proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
      presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
    },
  }).stale,
  "v1 proposal stale under presentation v3",
);

const v2Fingerprint = buildProposalSourceFingerprint({
  opportunityId: "opp-1st",
  commercialScopeId: "scope-1st",
  scopeRevision: 2,
  commercialPricingId: "pricing-1st",
  pricingRevision: 1,
  proposalVersion: 1,
  presentationVersion: 2,
});
assert(
  evaluateProposalStaleness({
    storedFingerprint: v2Fingerprint,
    current: {
      opportunityId: "opp-1st",
      commercialScopeId: "scope-1st",
      scopeRevision: 2,
      commercialPricingId: "pricing-1st",
      pricingRevision: 1,
      proposalVersion: COMMERCIAL_PROPOSAL_VERSION,
      presentationVersion: COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
    },
  }).stale,
  "v2 proposal stale under presentation v3",
);

assert(
  built.sourceFingerprint ===
    buildProposalSourceFingerprint({
      opportunityId: "opp-1st",
      commercialScopeId: "scope-1st",
      scopeRevision: 2,
      commercialPricingId: "pricing-1st",
      pricingRevision: 1,
      proposalVersion: 1,
      presentationVersion: 3,
    }),
  "fingerprint uses presentation v3",
);

// Gates still enforced
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
    pricing: { ...pricing, commercialScopeId: "other" },
  });
} catch {
  threw = true;
}
assert(threw, "mismatched pricing blocked");

// Optional dollars remain separate
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
        isCustom: true,
        isOverridden: false,
        effortBand: "CUSTOM",
        sortOrder: 99,
        sourceSectionTitles: ["Optional Content Expansion"],
      },
    ],
  },
});
assert(withOptional.includedInvestmentCents === 300_000, "optional not in base");
assert(withOptional.optionalInvestmentCents === 35_000, "optional separated");

// --- Sprint 6.2: authoritative work-unit provenance ---

const SHARED_PERFORMANCE_CONSTRAINT: PreservationConstraint = {
  id: "preserve-performance",
  category: "performance",
  statement:
    "Preserve the site's current Performance advantage while reviewing the identified maintenance issue without introducing heavier page delivery or regressions.",
  evidenceSourceKeys: ["category:performance"],
  maintenanceActions: [
    {
      id: "css-delivery",
      label: "Review CSS delivery / unused styles for maintainability",
      evidenceSourceKeys: ["finding:css"],
    },
  ],
};

function makeRooftopPlan(): LoadedImplementationPlan {
  return {
    id: "plan-rooftop",
    status: "APPROVED",
    createdAt: new Date("2026-08-20T12:00:00.000Z"),
    updatedAt: new Date("2026-08-20T12:00:00.000Z"),
    auditReportId: "audit-1",
    comparisonSnapshotId: "cmp-1",
    competitiveEvidenceUsed: true,
    planVersion: IMPLEMENTATION_PLAN_VERSION,
    mappingVersion: IMPLEMENTATION_MAPPING_VERSION,
    capabilityVersion: 1,
    inputFingerprint: "fp",
    approvedAt: new Date(),
    approvedByEmail: "ops@example.com",
    createdByEmail: "ops@example.com",
    operatorNotes: null,
    workstreams: [
      {
        id: "ws-search",
        workstreamType: "SEARCH_OPTIMIZATION",
        priority: "CRITICAL",
        priorityScore: 90,
        title: "Search Optimization",
        summary: "SEO trails peers.",
        sortOrder: 0,
        removed: false,
        operatorNote: null,
        capabilities: ["SEO"],
        evidence: [],
        actions: [
          {
            id: "improve-meta",
            label: "Improve meta descriptions for clarity and uniqueness",
            evidenceSourceKeys: ["category:seo"],
          },
          {
            id: "heading-architecture",
            label: "Correct heading hierarchy (H1 and supporting headings)",
            evidenceSourceKeys: ["category:seo"],
          },
          {
            id: "open-graph",
            label: "Complete Open Graph metadata for shared pages",
            evidenceSourceKeys: ["category:seo"],
          },
          {
            id: "internal-linking",
            label: "Strengthen contextual internal linking between key pages",
            evidenceSourceKeys: ["category:seo"],
          },
        ],
        preservationConstraints: [SHARED_PERFORMANCE_CONSTRAINT],
      },
      {
        id: "ws-content",
        workstreamType: "CONTENT_FOUNDATION",
        priority: "CRITICAL",
        priorityScore: 88,
        title: "Content Foundation",
        summary: "Content trails peers.",
        sortOrder: 1,
        removed: false,
        operatorNote: null,
        capabilities: ["CONTENT", "SEO"],
        evidence: [],
        actions: [
          {
            id: "content-depth",
            label: "Expand service page content depth",
            evidenceSourceKeys: ["category:content"],
          },
        ],
        preservationConstraints: [SHARED_PERFORMANCE_CONSTRAINT],
      },
      {
        id: "ws-technical",
        workstreamType: "TECHNICAL_SEO",
        priority: "HIGH",
        priorityScore: 70,
        title: "Technical SEO",
        summary: "Technical gaps.",
        sortOrder: 2,
        removed: false,
        operatorNote: null,
        capabilities: ["SEO", "WEBSITE_DEVELOPMENT"],
        evidence: [],
        actions: [
          {
            id: "canonical",
            label: "Implement or review canonical URL markup",
            evidenceSourceKeys: ["finding:canonical"],
          },
          {
            id: "structured-data",
            label: "Implement or repair structured data markup",
            evidenceSourceKeys: ["finding:schema"],
          },
        ],
        preservationConstraints: [SHARED_PERFORMANCE_CONSTRAINT],
      },
      {
        id: "ws-conversion",
        workstreamType: "CONVERSION_OPTIMIZATION",
        priority: "MEDIUM",
        priorityScore: 40,
        title: "Conversion Optimization",
        summary: "Trust signals.",
        sortOrder: 3,
        removed: false,
        operatorNote: null,
        capabilities: ["CONVERSION_OPTIMIZATION", "WEBSITE_DEVELOPMENT"],
        evidence: [],
        actions: [
          {
            id: "trust-signals",
            label: "Strengthen trust signals near conversion points",
            evidenceSourceKeys: ["finding:trust"],
          },
        ],
        preservationConstraints: [SHARED_PERFORMANCE_CONSTRAINT],
      },
    ],
  };
}

function makeRooftopInputs(): {
  scope: ProposalScopeInput;
  pricing: ProposalPricingInput;
} {
  const builtScope = buildScopeFromPlan({
    opportunityId: "opp-rooftop",
    businessName: "Rooftop Solutions",
    plan: makeRooftopPlan(),
  });
  const builtPricing = buildPricingFromScope({
    opportunityId: "opp-rooftop",
    scope: {
      id: "scope-rooftop",
      revision: 1,
      status: "APPROVED",
      sections: builtScope.sections.map((section) => ({
        id: section.sourceImplementationWorkstreamId ?? section.title,
        title: section.title,
        isIncluded: section.isIncluded,
        isOptional: section.isOptional,
        sortOrder: section.sortOrder,
        deliverables: section.deliverables.map((d, index) => ({
          id: `${section.sourceImplementationWorkstreamId}-${index}`,
          title: d.title,
          sourceActionKey: d.sourceActionKey,
          source: d.source,
          isIncluded: d.isIncluded,
          isOptional: d.isOptional,
          sortOrder: d.sortOrder,
        })),
      })),
    },
  });

  return {
    scope: {
      id: "scope-rooftop",
      revision: 1,
      status: "APPROVED",
      title: builtScope.title,
      summary: builtScope.summary,
      assumptions: [],
      exclusions: [],
      considerations: builtScope.considerations.map((c) => ({
        text: c.text,
        key: c.key,
      })),
      sections: builtScope.sections.map((section) => ({
        id: section.sourceImplementationWorkstreamId ?? section.title,
        title: section.title,
        description: section.description,
        sortOrder: section.sortOrder,
        isIncluded: section.isIncluded,
        isOptional: section.isOptional,
        capabilities: section.capabilities,
        deliverables: section.deliverables.map((d, index) => ({
          id: `${section.sourceImplementationWorkstreamId}-${index}`,
          title: d.title,
          sourceActionKey: d.sourceActionKey,
          isCustom: d.source === "MANUAL",
          isIncluded: d.isIncluded,
          isOptional: d.isOptional,
          sortOrder: d.sortOrder,
        })),
      })),
    },
    pricing: {
      id: "pricing-rooftop",
      revision: 1,
      status: "APPROVED",
      currency: builtPricing.currency,
      commercialScopeId: "scope-rooftop",
      finalIncludedCents: builtPricing.finalTotalCents,
      finalOptionalCents: builtPricing.finalOptionalCents,
      finalTotalCents: builtPricing.finalTotalCents,
      minimumApplied: builtPricing.minimumApplied,
      minimumEngagementCents: builtPricing.minimumEngagementCents,
      lineItems: builtPricing.lineItems.map((line, index) => ({
        id: `line-rooftop-${line.workUnitKey}-${index}`,
        title: line.title,
        quantity: line.quantity,
        recommendedUnitPriceCents: line.recommendedUnitPriceCents,
        finalUnitPriceCents: line.finalUnitPriceCents,
        finalLineTotalCents: line.finalLineTotalCents,
        isIncluded: line.isIncluded,
        isOptional: line.isOptional,
        isCustom: line.isCustom,
        isOverridden: line.isOverridden,
        effortBand: line.effortBand,
        sortOrder: line.sortOrder,
        sourceSectionTitles: line.sourceSectionTitles,
        workUnitKey: line.workUnitKey,
      })),
    },
  };
}

const rooftopInputs = makeRooftopInputs();
const rooftopBuilt = buildProposalFromApprovedSources({
  opportunityId: "opp-rooftop",
  businessName: "Rooftop Solutions",
  locationLabel: "Austin, TX",
  scope: rooftopInputs.scope,
  pricing: rooftopInputs.pricing,
});

assert(
  rooftopBuilt.includedInvestmentCents === rooftopInputs.pricing.finalTotalCents,
  "Rooftop total matches approved Pricing",
);
assert(
  rooftopBuilt.totalInvestmentCents === rooftopInputs.pricing.finalTotalCents,
  "Rooftop total unchanged",
);

const rooftopGroups = rooftopBuilt.snapshot.includedInvestmentGroups;
const rooftopByTitle = (title: string) =>
  rooftopGroups.find((g) => g.title === title);

assert(
  !rooftopByTitle("Performance Optimization"),
  "Rooftop has no Performance financial group",
);
assert(
  rooftopByTitle("Conversion Optimization") != null,
  "Rooftop trust-signals under Conversion Optimization",
);
assert(
  !rooftopByTitle("Conversion Path Assessment"),
  "Rooftop has no Conversion Path Assessment group",
);

const rooftopIncludes = rooftopGroups.flatMap((g) => g.includeLabels);
assert(
  !rooftopIncludes.some((l) =>
    /script and third-party|blocking script|third-party weight/i.test(l),
  ),
  "Rooftop has no unauthorized script-weight",
);
assert(
  rooftopIncludes.some((l) => l.includes("Structured data markup")),
  "Rooftop structured-data stays generic",
);
assert(
  !rooftopIncludes.some((l) => /localbusiness/i.test(l)),
  "Rooftop has no LocalBusiness schema label",
);
assert(
  rooftopIncludes.some((l) => /trust signals/i.test(l)),
  "Rooftop trust-signals stays implementation",
);

const rooftopTechnical = rooftopBuilt.snapshot.sections.find(
  (s) => s.title === "Technical SEO",
)!;
assert(
  rooftopTechnical.deliverables.some((d) =>
    d.title.includes("structured data markup"),
  ),
  "Rooftop approach structured-data generic",
);
assert(
  !rooftopTechnical.deliverables.some((d) =>
    /localbusiness/i.test(d.title),
  ),
  "Rooftop approach has no LocalBusiness wording",
);

const rooftopConversion = rooftopBuilt.snapshot.sections.find(
  (s) => s.title === "Conversion Optimization",
)!;
assert(
  rooftopConversion.deliverables.some((d) =>
    d.title.includes("trust signals"),
  ),
  "Rooftop approach trust-signals implementation",
);

// Known action identity matrix (tests 1–12)
assert(
  investmentIncludeLabelForLine({
    workUnitKey: "trust-signals",
    sourceTitle: "ignored",
  }) !== WORK_UNIT_INVESTMENT_INCLUDE_LABELS["conversion-assessment"],
  "trust-signals never maps to conversion-assessment",
);
assert(
  investmentIncludeLabelForLine({
    workUnitKey: "conversion-assessment",
    sourceTitle: "ignored",
  }).includes("assessment"),
  "conversion-assessment remains assessment",
);
assert(
  !investmentIncludeLabelForLine({
    workUnitKey: "structured-data",
    sourceTitle: "ignored",
  }).includes("LocalBusiness"),
  "structured-data never maps to local-schema",
);
assert(
  investmentIncludeLabelForLine({
    workUnitKey: "local-schema",
    sourceTitle: "ignored",
  }).includes("LocalBusiness"),
  "local-schema remains LocalBusiness structured data",
);
assert(
  investmentIncludeLabelForLine({
    workUnitKey: "script-weight",
    sourceTitle: "ignored",
  }).includes("Script"),
  "script-weight label preserved when authorized",
);
assert(
  investmentIncludeLabelForLine({
    workUnitKey: "inline-css",
    sourceTitle: "ignored",
  }).includes("CSS"),
  "inline-css label preserved when authorized",
);
assert(
  deliverablePresentationLabel({
    workUnitKey: "canonical",
    sourceTitle: "ignored",
  }).includes("canonical"),
  "canonical identity preserved",
);
assert(
  deliverablePresentationLabel({
    workUnitKey: "heading-architecture",
    sourceTitle: "ignored",
  }).includes("heading"),
  "heading identity preserved",
);
assert(
  deliverablePresentationLabel({
    workUnitKey: "internal-linking",
    sourceTitle: "ignored",
  }).includes("internal linking"),
  "internal-linking identity preserved",
);
assert(
  deliverablePresentationLabel({
    workUnitKey: "improve-meta",
    sourceTitle: "ignored",
  }).includes("meta"),
  "improve-meta identity preserved",
);
assert(
  deliverablePresentationLabel({
    workUnitKey: "open-graph",
    sourceTitle: "ignored",
  }).includes("Open Graph"),
  "Open Graph identity preserved",
);
assert(
  deliverablePresentationLabel({
    sourceTitle: "Custom operator deliverable",
    isCustom: true,
  }) === "Custom operator deliverable",
  "manual work title preserved",
);
assert(
  deliverablePresentationLabel({
    sourceTitle: "Custom trust signal refresh",
    isCustom: true,
  }) === "Custom trust signal refresh",
  "manual work does not fuzzy-map into known deterministic action",
);

// Reconciliation invariants on 1st Choice (tests 14–18)
assert(
  built.snapshot.includedLines.length === pricing.lineItems.length,
  "every included pricing line represented once",
);
assert(
  built.snapshot.includedLines.length ===
    new Set(
      pricing.lineItems
        .filter((l) => l.isIncluded && !l.isOptional)
        .map((l) => l.workUnitKey),
    ).size,
  "no duplicate financial line by work unit",
);
assert(
  sumClientVisibleGroupCents(groups) === built.includedInvestmentCents,
  "financial group subtotal reconciliation",
);
assert(
  sumClientVisibleInvestmentCents(built.snapshot.includedLines) ===
    built.includedInvestmentCents,
  "total reconciliation",
);
assert(withOptional.optionalInvestmentCents === 35_000, "optional reconciliation");

// 1st Choice regression (tests 25–27)
const firstChoiceIncludes = groups.flatMap((g) => g.includeLabels);
assert(
  firstChoiceIncludes.some((l) => l.includes("Script and third-party")),
  "1st Choice script-weight remains Performance when authorized",
);
assert(
  firstChoiceIncludes.some((l) => l.includes("LocalBusiness")),
  "1st Choice local-schema still renders LocalBusiness correctly",
);
assert(
  byTitle("Conversion Path Assessment")?.includeLabels.some((l) =>
    l.includes("assessment"),
  ),
  "1st Choice conversion-assessment still renders assessment correctly",
);

// Semantic substitution guard unit tests
assert(
  __testLabelLooksLikeWrongAction({
    workUnitKey: "trust-signals",
    includeLabel: "Conversion path assessment",
    title: "Conversion Path Assessment",
  }) != null,
  "trust-signals assessment substitution detected",
);
assert(
  __testLabelLooksLikeWrongAction({
    workUnitKey: "structured-data",
    includeLabel: "LocalBusiness structured data",
    title: "LocalBusiness structured data",
  }) != null,
  "structured-data local substitution detected",
);

// Reconciliation failure path
let reconcileThrew = false;
try {
  buildProposalFromApprovedSources({
    opportunityId: "opp-bad",
    businessName: "Bad Co",
    locationLabel: null,
    scope: rooftopInputs.scope,
    pricing: {
      ...rooftopInputs.pricing,
      lineItems: rooftopInputs.pricing.lineItems.map((line) =>
        line.workUnitKey === "trust-signals"
          ? { ...line, workUnitKey: "conversion-assessment" }
          : line,
      ),
    },
  });
} catch (error) {
  reconcileThrew =
    error instanceof ProposalFinancialReconciliationError ||
    (error instanceof Error &&
      error.message.includes("PROPOSAL_FINANCIAL_RECONCILIATION_FAILED"));
}
assert(reconcileThrew, "semantic pricing mismatch fails reconciliation");

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
assert(createSource.includes("PRICING_STALE"), "stale pricing gate");
assert(
  createSource.includes("PROPOSAL_FINANCIAL_RECONCILIATION_FAILED"),
  "reconciliation gate in create",
);

const mutateSource = readFileSync(join(here, "mutate.ts"), "utf8");
assert(mutateSource.includes("IMMUTABLE"), "approved immutable");
assert(
  mutateSource.includes("Mark the Proposal reviewed before approving"),
  "approve requires REVIEWED",
);

const docSource = readFileSync(
  join(repoRoot, "src/components/opportunities/proposal-document.tsx"),
  "utf8",
);
assert(docSource.includes("What we"), "what we'll do section");
assert(docSource.includes("Base Implementation Investment"), "investment section");
assert(!docSource.includes("effortBand"), "preview hides effort bands");
assert(!docSource.includes("sourceActionKey"), "preview hides action keys");
assert(docSource.includes("includeLabels"), "grouped includes list");

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
assert(migration.includes("CommercialProposal"), "migration exists from Sprint 6");

console.log("proposal.verify.ts: PASS");
