/**
 * Commercial Sprint 3 — Opportunity Management V1 verification.
 * Pure deterministic tests. No OpenAI, Places, crawl, Resend, Stripe, or DB.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { isForbiddenAnalyticsParamKey } from "@/lib/analytics/commercial-events";
import {
  IMPLEMENTATION_MAPPING_VERSION,
  IMPLEMENTATION_PLAN_VERSION,
} from "@/lib/commercialization/implementation-plan/constants";
import type { LoadedImplementationPlan } from "@/lib/commercialization/implementation-plan/load";

import {
  parseCapabilitiesSnapshot,
  snapshotCapabilitiesFromPlan,
} from "./capabilities";
import {
  ACTIVE_OPPORTUNITY_STAGES,
  OPPORTUNITY_LOST_REASONS,
  OPPORTUNITY_MANAGEMENT_VERSION,
  OPPORTUNITY_STAGES,
  isTerminalOpportunityStage,
} from "./constants";
import { evaluateOpportunityIntelligenceStaleness } from "./staleness";
import {
  canTransitionOpportunityStage,
  classifyNextActionState,
} from "./workflow";

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

assert(OPPORTUNITY_MANAGEMENT_VERSION === 1, "opportunity management version 1");
assert(OPPORTUNITY_STAGES.length === 7, "seven stages");
assert(ACTIVE_OPPORTUNITY_STAGES.length === 5, "five active stages");
assert(OPPORTUNITY_LOST_REASONS.includes("PRICE"), "lost reason PRICE");
assert(OPPORTUNITY_LOST_REASONS.includes("NO_RESPONSE"), "lost reason NO_RESPONSE");

function makePlan(options?: {
  withInactive?: boolean;
  planId?: string;
}): LoadedImplementationPlan {
  return {
    id: options?.planId ?? "plan-1",
    status: "DRAFT",
    createdAt: new Date("2026-08-20T12:00:00.000Z"),
    updatedAt: new Date("2026-08-20T12:00:00.000Z"),
    auditReportId: "audit-1",
    comparisonSnapshotId: "cmp-1",
    competitiveEvidenceUsed: true,
    planVersion: IMPLEMENTATION_PLAN_VERSION,
    mappingVersion: IMPLEMENTATION_MAPPING_VERSION,
    capabilityVersion: 1,
    inputFingerprint: "fp",
    approvedAt: null,
    approvedByEmail: null,
    createdByEmail: "ops@example.com",
    operatorNotes: null,
    workstreams: [
      {
        id: "ws-1",
        workstreamType: "SEARCH_OPTIMIZATION",
        priority: "CRITICAL",
        priorityScore: 90,
        title: "Search Optimization",
        summary: "SEO gap",
        sortOrder: 0,
        removed: false,
        operatorNote: null,
        capabilities: options?.withInactive
          ? ["SEO", "AI_AUTOMATION"]
          : ["SEO"],
        evidence: [],
        actions: [],
        preservationConstraints: [],
      },
      {
        id: "ws-2",
        workstreamType: "CONTENT_FOUNDATION",
        priority: "CRITICAL",
        priorityScore: 88,
        title: "Content Foundation",
        summary: "Content gap",
        sortOrder: 1,
        removed: false,
        operatorNote: null,
        capabilities: ["CONTENT", "SEO"],
        evidence: [],
        actions: [],
        preservationConstraints: [],
      },
      {
        id: "ws-3",
        workstreamType: "TECHNICAL_SEO",
        priority: "HIGH",
        priorityScore: 70,
        title: "Technical SEO",
        summary: "Technical",
        sortOrder: 2,
        removed: false,
        operatorNote: null,
        capabilities: ["SEO", "WEBSITE_DEVELOPMENT"],
        evidence: [],
        actions: [],
        preservationConstraints: [],
      },
      {
        id: "ws-4",
        workstreamType: "CONVERSION_OPTIMIZATION",
        priority: "MEDIUM",
        priorityScore: 40,
        title: "Conversion",
        summary: "CRO",
        sortOrder: 3,
        removed: false,
        operatorNote: null,
        capabilities: ["CONVERSION_OPTIMIZATION", "WEBSITE_DEVELOPMENT"],
        evidence: [],
        actions: [],
        preservationConstraints: [],
      },
    ],
  };
}

// 1–5 capability snapshot
const noPlanSnap = snapshotCapabilitiesFromPlan(null);
assert(noPlanSnap.noPlanAtSnapshot, "opportunity without plan allowed");
assert(noPlanSnap.capabilities.length === 0, "no capabilities without plan");
assert(noPlanSnap.sourcePlanId === null, "no plan id without plan");

const withPlan = snapshotCapabilitiesFromPlan(makePlan());
assert(!withPlan.noPlanAtSnapshot, "with plan snapshot");
assert(withPlan.sourcePlanId === "plan-1", "plan id snapshotted");
assert(withPlan.capabilities.includes("SEO"), "SEO snapshotted");
assert(withPlan.capabilities.includes("CONTENT"), "CONTENT snapshotted");
assert(
  withPlan.capabilities.includes("WEBSITE_DEVELOPMENT"),
  "WEBSITE_DEVELOPMENT snapshotted",
);
assert(
  withPlan.capabilities.includes("CONVERSION_OPTIMIZATION"),
  "CONVERSION_OPTIMIZATION snapshotted",
);

const withInactive = snapshotCapabilitiesFromPlan(
  makePlan({ withInactive: true }),
);
assert(
  !withInactive.capabilities.includes("AI_AUTOMATION"),
  "inactive capabilities never automatically mapped",
);

const parsed = parseCapabilitiesSnapshot(withPlan);
assert(parsed?.capabilities.length === withPlan.capabilities.length, "parse snapshot");

// Stage transitions / WON / LOST
assert(
  canTransitionOpportunityStage({ from: "NEW", to: "DISCOVERY" }).ok,
  "stage transition NEW→DISCOVERY",
);
assert(
  !canTransitionOpportunityStage({ from: "NEW", to: "NEW" }).ok,
  "same stage rejected",
);
assert(
  canTransitionOpportunityStage({ from: "NEW", to: "WON" }).ok,
  "WON allowed from active",
);
assert(
  canTransitionOpportunityStage({ from: "NEW", to: "LOST" }).ok,
  "LOST allowed from active",
);
assert(
  canTransitionOpportunityStage({ from: "LOST", to: "DISCOVERY" }).ok,
  "reopen supported",
);
assert(
  !canTransitionOpportunityStage({ from: "WON", to: "LOST" }).ok,
  "WON→LOST requires reopen",
);
assert(isTerminalOpportunityStage("WON"), "WON terminal");
assert(isTerminalOpportunityStage("LOST"), "LOST terminal");
assert(!isTerminalOpportunityStage("NEW"), "NEW active");

// Next action
assert(
  classifyNextActionState({ nextAction: null, nextActionAt: null }) === "none",
  "next action none",
);
assert(
  classifyNextActionState({
    nextAction: "Call",
    nextActionAt: new Date("2099-01-01"),
  }) === "upcoming",
  "next action upcoming",
);
assert(
  classifyNextActionState({
    nextAction: "Call",
    nextActionAt: new Date("2000-01-01"),
    now: new Date("2026-08-20"),
  }) === "overdue",
  "next action overdue",
);

// Stale source detection — plan rebuild does not auto-mutate snapshot equality
const snapA = snapshotCapabilitiesFromPlan(makePlan({ planId: "plan-1" }));
const snapB = snapshotCapabilitiesFromPlan(makePlan({ planId: "plan-2" }));
assert(
  JSON.stringify(snapA.capabilities) === JSON.stringify(snapB.capabilities),
  "same capabilities from equivalent workstreams",
);
assert(snapA.sourcePlanId !== snapB.sourcePlanId, "source plan ids differ");

const stale = evaluateOpportunityIntelligenceStaleness({
  linkedPlanId: "plan-1",
  linkedInterpretationId: "interp-1",
  capabilitiesSnapshot: snapA,
  currentPlanId: "plan-2",
  currentPlanStale: false,
  currentPlanStaleReasons: [],
  currentInterpretationId: "interp-2",
  currentInterpretationStale: false,
  currentInterpretationStaleReasons: [],
  currentComparisonStale: true,
  currentComparisonStaleReasons: ["Comparison fingerprint changed."],
});
assert(stale.overallStale, "stale source detection");
assert(stale.planStale, "plan id change → plan stale indicator");
assert(
  stale.capabilitiesSourceStale,
  "capability snapshot source stale when plan changes",
);
assert(
  snapA.sourcePlanId === "plan-1",
  "no automatic capability mutation when plan changes (snapshot immutable)",
);

// Analytics privacy
assert(isForbiddenAnalyticsParamKey("opportunity_id"), "opportunity_id forbidden");
assert(isForbiddenAnalyticsParamKey("opportunity_stage"), "opportunity_stage forbidden");
assert(isForbiddenAnalyticsParamKey("opportunity_owner"), "opportunity_owner forbidden");
assert(isForbiddenAnalyticsParamKey("next_action"), "next_action forbidden");
assert(isForbiddenAnalyticsParamKey("lost_reason"), "lost_reason forbidden");
assert(isForbiddenAnalyticsParamKey("commercial_notes"), "commercial_notes forbidden");

// Public isolation + no external APIs in module
const moduleFiles = collectTsFiles(join(here)).filter(
  (file) => !file.endsWith(".verify.ts"),
);
for (const file of moduleFiles) {
  const source = readFileSync(file, "utf8");
  assert(!/openai|OpenAI|responses\.create/i.test(source), `${file}: no OpenAI`);
  assert(!/places\.googleapis|GOOGLE_PLACES/i.test(source), `${file}: no Places`);
  assert(!/resend|Resend\(/i.test(source), `${file}: no Resend`);
  assert(!/stripe|Stripe\(/i.test(source), `${file}: no Stripe`);
  assert(
    !/runDeterministicWebsiteAudit|discoverContacts/i.test(source),
    `${file}: no crawl/contact discovery`,
  );
}

const publicFiles = collectTsFiles(join(repoRoot, "src/app/report")).concat(
  collectTsFiles(join(repoRoot, "src/components/website-audit")).filter(
    (file) => file.includes("professional") || file.includes("public"),
  ),
);
for (const file of publicFiles) {
  const source = readFileSync(file, "utf8");
  assert(
    !source.includes("OpportunityActivity") &&
      !source.includes("loadOpportunity") &&
      !source.includes("createOpportunity") &&
      !source.includes("/reports/opportunities"),
    `${file}: no Opportunity management on public surfaces`,
  );
}

const actionsSource = readFileSync(
  join(repoRoot, "src/app/reports/opportunities/actions.ts"),
  "utf8",
);
assert(
  actionsSource.includes("getInternalSession"),
  "mutations require internal session",
);

const createSource = readFileSync(join(here, "create.ts"), "utf8");
assert(
  createSource.includes("DUPLICATE_ACTIVE"),
  "duplicate active opportunity prevention",
);
assert(
  createSource.includes("ACTIVE_OPPORTUNITY_STAGES"),
  "active stage set used for duplicate check",
);
assert(
  createSource.includes("snapshotCapabilitiesFromPlan"),
  "capabilities snapshotted on create",
);

const mutateSource = readFileSync(join(here, "mutate.ts"), "utf8");
assert(
  mutateSource.includes("LOST_REASON_REQUIRED"),
  "lost reason requirement",
);
assert(mutateSource.includes("MARKED_WON"), "WON activity");
assert(mutateSource.includes("MARKED_LOST"), "LOST activity");
assert(mutateSource.includes("NOTE_ADDED"), "notes activity");
assert(mutateSource.includes("NEXT_ACTION_CHANGED"), "next action activity");
assert(
  mutateSource.includes("CAPABILITIES_UPDATED"),
  "explicit capability refresh",
);
assert(mutateSource.includes("REOPENED"), "reopen supported");

const migration = readFileSync(
  join(
    repoRoot,
    "prisma/migrations/20260820200000_add_opportunities/migration.sql",
  ),
  "utf8",
);
assert(migration.includes("Opportunity"), "migration adds Opportunity");
assert(migration.includes("OpportunityActivity"), "migration adds activity");

// Ensure Sprint 1 verify still excludes opportunities from OpenAI ban incorrectly
const sprint1Verify = readFileSync(
  join(
    repoRoot,
    "src/lib/commercialization/implementation-plan/implementation-plan.verify.ts",
  ),
  "utf8",
);
assert(
  sprint1Verify.includes(`implementation-interpretation${sep}`) ||
    sprint1Verify.includes("implementation-interpretation"),
  "sprint 1 verify excludes AI interpretation module",
);

console.log("opportunity.verify.ts: PASS");
