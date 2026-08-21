/**
 * Commercial Sprint 4 — Scope Engine V1 verification.
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

import { buildScopeFromPlan } from "./build";
import {
  COMMERCIAL_SCOPE_VERSION,
  EVIDENCE_ONLY_ACTION_ID_PREFIX,
} from "./constants";
import { buildScopeSourceFingerprint } from "./fingerprint";
import {
  classifyDeliverableType,
  isEvidenceOnlyPlanAction,
} from "./map-actions";
import { evaluateScopeStaleness } from "./staleness";

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

assert(COMMERCIAL_SCOPE_VERSION === 1, "scope version 1");
assert(
  OPPORTUNITY_ACTIVITY_TYPES.includes("SCOPE_CREATED"),
  "SCOPE_CREATED activity type",
);
assert(
  OPPORTUNITY_ACTIVITY_TYPES.includes("SCOPE_APPROVED"),
  "SCOPE_APPROVED activity type",
);

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
        capabilities: ["SEO", "AI_AUTOMATION"],
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
          {
            id: "address-competitive-seo-gap",
            label:
              "Address competitive Search Optimization gap relative to selected peers",
            evidenceSourceKeys: ["category:seo"],
          },
        ],
        preservationConstraints: [],
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
          {
            id: "address-competitive-content-gap",
            label: "Address competitive Content gap relative to selected peers",
            evidenceSourceKeys: ["category:content"],
          },
        ],
        preservationConstraints: [
          {
            id: "preserve-performance",
            category: "performance",
            statement:
              "Performance is a competitive strength; protect page weight during content work.",
            evidenceSourceKeys: ["category:performance"],
          },
        ],
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
          {
            id: "address-competitive-technical-gap",
            label:
              "Address competitive Technical SEO gap relative to selected peers",
            evidenceSourceKeys: ["category:technical"],
          },
        ],
        preservationConstraints: [],
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
          {
            id: "address-competitive-cro-gap",
            label: "Address competitive Conversion gap relative to selected peers",
            evidenceSourceKeys: ["category:cro"],
          },
        ],
        preservationConstraints: [],
      },
    ],
  };
}

// Manual scope without plan
const manual = buildScopeFromPlan({
  opportunityId: "opp-1",
  businessName: "Manual Co",
  plan: null,
});
assert(manual.sections.length === 0, "scope without plan has no sections");
assert(manual.implementationPlanId === null, "no plan id");
assert(manual.assumptions.length > 0, "assumptions persist templates");
assert(manual.exclusions.length > 0, "exclusions persist templates");

// Rooftop fixture mapping
const rooftop = buildScopeFromPlan({
  opportunityId: "opp-rooftop",
  businessName: "Rooftop Solutions",
  plan: makeRooftopPlan(),
});
assert(rooftop.sections.length === 4, "Rooftop fixture maps expected 4 sections");
assert(
  rooftop.sections[0]?.workstreamType === "SEARCH_OPTIMIZATION",
  "first section Search Optimization",
);
assert(
  rooftop.sections.every((s) => s.workstreamType !== "PERFORMANCE_OPTIMIZATION"),
  "Performance preservation does NOT create Performance section",
);
assert(
  rooftop.considerations.some((c) =>
    c.text.toLowerCase().includes("performance"),
  ),
  "performance preservation as consideration",
);

const search = rooftop.sections.find(
  (s) => s.workstreamType === "SEARCH_OPTIMIZATION",
)!;
assert(search.capabilities.includes("SEO"), "active capabilities inherited");
assert(
  !search.capabilities.includes("AI_AUTOMATION"),
  "inactive capabilities not auto-added",
);
assert(
  search.deliverables.every(
    (d) => !d.title.toLowerCase().includes("competitive"),
  ),
  "competitive gap context action excluded from billable deliverables",
);
assert(
  search.deliverables.some((d) => d.sourceActionKey === "improve-meta"),
  "plan implementation actions map to deliverables",
);
assert(
  search.deliverables.every((d) => d.source === "PLAN"),
  "plan-derived provenance PLAN",
);
assert(
  search.sourceImplementationWorkstreamId === "ws-search",
  "provenance retained",
);

assert(
  isEvidenceOnlyPlanAction({
    id: "address-competitive-seo-gap",
    label:
      "Address competitive Search Optimization gap relative to selected peers",
    evidenceSourceKeys: [],
  }),
  "evidence-only competitive-gap actions NOT mapped",
);
assert(
  !isEvidenceOnlyPlanAction({
    id: "improve-meta",
    label: "Improve meta descriptions",
    evidenceSourceKeys: [],
  }),
  "real actions not evidence-only",
);
assert(
  EVIDENCE_ONLY_ACTION_ID_PREFIX === "address-competitive-",
  "evidence-only prefix",
);

assert(
  classifyDeliverableType({
    workstreamType: "TECHNICAL_SEO",
    actionId: "canonical",
  }) === "TECHNICAL",
  "deliverable type classification",
);

// Fingerprint / staleness — plan change does not mutate built scope object
const fp1 = rooftop.sourceFingerprint;
const fp2 = buildScopeSourceFingerprint({
  opportunityId: "opp-rooftop",
  implementationPlanId: "plan-new",
  planVersion: IMPLEMENTATION_PLAN_VERSION,
  mappingVersion: IMPLEMENTATION_MAPPING_VERSION,
});
assert(fp1 !== fp2, "fingerprint changes when plan id changes");
assert(
  evaluateScopeStaleness({
    storedFingerprint: fp1,
    current: {
      opportunityId: "opp-rooftop",
      implementationPlanId: "plan-new",
      planVersion: IMPLEMENTATION_PLAN_VERSION,
      mappingVersion: IMPLEMENTATION_MAPPING_VERSION,
      scopeVersion: COMMERCIAL_SCOPE_VERSION,
    },
  }).stale,
  "source-plan changes cause stale indicator",
);
assert(rooftop.implementationPlanId === "plan-rooftop", "built scope unchanged");

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
  assert(!/\bpricing\b|\bStripe\b/i.test(source), `${file}: no pricing/Stripe`);
}

const createSource = readFileSync(join(here, "create.ts"), "utf8");
assert(createSource.includes("SCOPE_CREATED"), "lifecycle SCOPE_CREATED");
assert(createSource.includes("SCOPE_REVISED"), "revision creates new scope");
assert(createSource.includes("SUPERSEDED"), "old scope superseded");
assert(createSource.includes("buildScopeFromPlan"), "plan workstreams auto-copied");

const mutateSource = readFileSync(join(here, "mutate.ts"), "utf8");
assert(mutateSource.includes("IMMUTABLE"), "approved scopes immutable");
assert(mutateSource.includes("SCOPE_APPROVED"), "approval activity");
assert(mutateSource.includes("SCOPE_REVIEWED"), "reviewed activity");
assert(mutateSource.includes("INACTIVE_CAPABILITY"), "inactive capability blocked");
assert(mutateSource.includes("source: \"MANUAL\""), "manual deliverables supported");
assert(mutateSource.includes("isOptional"), "optional work supported");
assert(mutateSource.includes("assumptionsJson"), "assumptions supported");
assert(mutateSource.includes("exclusionsJson"), "exclusions supported");

const actionsSource = readFileSync(
  join(repoRoot, "src/app/reports/opportunities/scope-actions.ts"),
  "utf8",
);
assert(actionsSource.includes("getInternalSession"), "internal session required");

const publicFiles = collectTsFiles(join(repoRoot, "src/app/report"));
for (const file of publicFiles) {
  const source = readFileSync(file, "utf8");
  assert(
    !source.includes("CommercialScope") &&
      !source.includes("loadCommercialScope") &&
      !source.includes("/scope/"),
    `${file}: no Scope on public report routes`,
  );
}

assert(isForbiddenAnalyticsParamKey("scope_id"), "scope_id forbidden");
assert(isForbiddenAnalyticsParamKey("scope_status"), "scope_status forbidden");
assert(isForbiddenAnalyticsParamKey("scope_summary"), "scope_summary forbidden");
assert(
  isForbiddenAnalyticsParamKey("scope_deliverables"),
  "scope_deliverables forbidden",
);
assert(
  isForbiddenAnalyticsParamKey("scope_assumptions"),
  "scope_assumptions forbidden",
);
assert(
  isForbiddenAnalyticsParamKey("scope_exclusions"),
  "scope_exclusions forbidden",
);
assert(
  isForbiddenAnalyticsParamKey("commercial_scope"),
  "commercial_scope forbidden",
);

const migration = readFileSync(
  join(
    repoRoot,
    "prisma/migrations/20260821100000_add_commercial_scopes/migration.sql",
  ),
  "utf8",
);
assert(migration.includes("CommercialScope"), "migration adds CommercialScope");
assert(
  migration.includes("CommercialScopeDeliverable"),
  "migration adds deliverables",
);
assert(migration.includes("SCOPE_CREATED"), "migration adds activity enums");

console.log("scope.verify.ts: PASS");
