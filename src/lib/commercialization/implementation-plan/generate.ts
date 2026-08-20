import type { CompetitiveComparison } from "@/lib/competitive-intelligence/comparison/types";
import type { WebsiteAuditResult } from "@/lib/website-audit/types";

import { SERVICE_CAPABILITY_VERSION } from "../capabilities/types";
import {
  assertActionsHaveProvenance,
  buildRecommendedActions,
} from "./actions";
import {
  IMPLEMENTATION_MAPPING_VERSION,
  IMPLEMENTATION_PLAN_VERSION,
  MAX_WORKSTREAMS,
  WORKSTREAM_DEFAULT_CAPABILITIES,
  WORKSTREAM_ORDER,
  WORKSTREAM_TITLES,
  type WorkstreamType,
} from "./constants";
import {
  dedupeEvidenceItems,
  isWeakSupportingFinding,
  isWorkstreamCreatingEvidence,
} from "./dedupe";
import {
  buildAuditEvidence,
  buildCompetitiveEvidence,
  mergeEvidence,
} from "./evidence";
import { assignEvidenceToWorkstreams } from "./mapping";
import {
  buildPreservationConstraints,
  buildStrengthPreservationConstraint,
} from "./preservation";
import {
  applyCriticalCap,
  computeWorkstreamPriorityScore,
  priorityFromScore,
} from "./priority";
import {
  primaryCategoryForWorkstream,
  shouldSuppressStrengthWorkstream,
} from "./strength";
import type {
  GeneratedImplementationPlan,
  GeneratedWorkstream,
  PlanEvidenceItem,
  PreservationConstraint,
} from "./types";

function summarizeWorkstream(
  type: WorkstreamType,
  evidence: PlanEvidenceItem[],
): string {
  const gaps = evidence.filter((item) => item.type === "COMPETITIVE_CATEGORY_GAP");
  const findings = evidence.filter(
    (item) =>
      item.type === "AUDIT_FINDING" && !isWeakSupportingFinding(item),
  );
  const categories = evidence.filter((item) => item.type === "AUDIT_CATEGORY");

  const parts: string[] = [];

  if (gaps[0]) {
    const g = gaps[0];
    parts.push(
      `Competitive gap on ${g.category}: target ${g.targetScorePercent ?? "—"} vs competitor average ${g.competitorAverage ?? "—"} (${g.position ?? "GAP"}).`,
    );
  } else if (categories[0]) {
    parts.push(`Audit category weakness: ${categories[0].title}.`);
  }

  if (findings.length > 0) {
    parts.push(
      `${findings.length} supporting audit finding${findings.length === 1 ? "" : "s"}.`,
    );
  }

  if (parts.length === 0) {
    return `${WORKSTREAM_TITLES[type]} recommended from deterministic audit evidence.`;
  }

  return parts.join(" ");
}

function priorityEvidence(evidence: PlanEvidenceItem[]): PlanEvidenceItem[] {
  // Weak supporting findings (e.g. no-images) must not inflate priority
  return evidence.filter((item) => !isWeakSupportingFinding(item));
}

export function generateImplementationPlanFromEvidence(options: {
  audit: WebsiteAuditResult;
  auditReportId: string;
  comparison: CompetitiveComparison | null;
  comparisonSnapshotId: string | null;
  useCompetitiveEvidence: boolean;
  now?: Date;
}): GeneratedImplementationPlan {
  const auditEvidence = buildAuditEvidence(options.audit);
  const competitiveEvidence =
    options.useCompetitiveEvidence && options.comparison
      ? buildCompetitiveEvidence(options.comparison)
      : [];

  const allEvidence = mergeEvidence(auditEvidence, competitiveEvidence);

  const bags = new Map<WorkstreamType, PlanEvidenceItem[]>();

  for (const item of allEvidence) {
    const targets = assignEvidenceToWorkstreams(item);
    for (const workstream of targets) {
      const list = bags.get(workstream) ?? [];
      list.push(item);
      bags.set(workstream, list);
    }
  }

  for (const [type, list] of bags) {
    bags.set(type, dedupeEvidenceItems(list));
  }

  const suppressedPreservations: PreservationConstraint[] = [];
  let workstreams: GeneratedWorkstream[] = [];

  for (const type of WORKSTREAM_ORDER) {
    let evidence = bags.get(type) ?? [];
    if (evidence.length === 0) {
      continue;
    }

    evidence = dedupeEvidenceItems(evidence);

    const creating = evidence.filter(isWorkstreamCreatingEvidence);
    if (creating.length === 0) {
      // Only weak supporting evidence (e.g. no-images alone) — skip workstream
      continue;
    }

    const primaryCategory = primaryCategoryForWorkstream(type);
    if (
      primaryCategory &&
      shouldSuppressStrengthWorkstream({
        primaryCategory,
        workstreamEvidence: evidence,
        allEvidence,
      })
    ) {
      const advantage = allEvidence.find(
        (item) =>
          item.type === "COMPETITIVE_ADVANTAGE" &&
          item.category === primaryCategory,
      );
      if (advantage) {
        suppressedPreservations.push(
          buildStrengthPreservationConstraint({
            category: primaryCategory,
            advantageSourceKey: advantage.sourceKey,
            minorFindings: evidence.filter(
              (item) =>
                item.type === "AUDIT_FINDING" ||
                item.type === "COMPETITIVE_FINDING",
            ),
          }),
        );
      }
      continue;
    }

    const actions = buildRecommendedActions(type, evidence);
    assertActionsHaveProvenance(actions, evidence);

    if (
      actions.length === 0 &&
      !evidence.some(
        (e) =>
          e.type === "AUDIT_FINDING" ||
          e.type === "COMPETITIVE_CATEGORY_GAP" ||
          e.type === "AUDIT_CATEGORY",
      )
    ) {
      continue;
    }

    const scoredEvidence = priorityEvidence(evidence);
    const priorityScore = computeWorkstreamPriorityScore(scoredEvidence);
    const priority = priorityFromScore(priorityScore);

    const finalActions =
      actions.length > 0
        ? actions
        : [
            {
              id: "review-evidence",
              label: `Review ${WORKSTREAM_TITLES[type].toLowerCase()} evidence and define remediation scope`,
              evidenceSourceKeys: creating.map((e) => e.sourceKey).slice(0, 8),
            },
          ];

    assertActionsHaveProvenance(finalActions, evidence);

    workstreams.push({
      workstreamType: type,
      priority,
      priorityScore,
      title: WORKSTREAM_TITLES[type],
      summary: summarizeWorkstream(type, evidence),
      sortOrder: 0,
      capabilities: [...WORKSTREAM_DEFAULT_CAPABILITIES[type]],
      evidence,
      actions: finalActions,
      preservationConstraints: [], // filled after suppressed list known
    });
  }

  workstreams = workstreams.map((row) => ({
    ...row,
    preservationConstraints: buildPreservationConstraints({
      workstreamType: row.workstreamType,
      audit: options.audit,
      evidence: row.evidence,
      allEvidence,
      suppressedPreservations,
    }),
  }));

  workstreams = applyCriticalCap(workstreams);

  workstreams.sort((a, b) => {
    const priorityRank = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
    const pr = priorityRank[a.priority] - priorityRank[b.priority];
    if (pr !== 0) {
      return pr;
    }
    return b.priorityScore - a.priorityScore;
  });

  workstreams = workstreams.slice(0, MAX_WORKSTREAMS).map((row, index) => ({
    ...row,
    sortOrder: index + 1,
  }));

  return {
    planVersion: IMPLEMENTATION_PLAN_VERSION,
    mappingVersion: IMPLEMENTATION_MAPPING_VERSION,
    capabilityVersion: SERVICE_CAPABILITY_VERSION,
    auditReportId: options.auditReportId,
    comparisonSnapshotId: options.useCompetitiveEvidence
      ? options.comparisonSnapshotId
      : null,
    competitiveEvidenceUsed: Boolean(
      options.useCompetitiveEvidence && options.comparison,
    ),
    workstreams,
    generatedAt: (options.now ?? new Date()).toISOString(),
  };
}
