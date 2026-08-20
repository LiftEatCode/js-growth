import type { CompetitiveComparison } from "@/lib/competitive-intelligence/comparison/types";
import type { WebsiteAuditResult } from "@/lib/website-audit/types";

import { SERVICE_CAPABILITY_VERSION } from "../capabilities/types";
import { buildRecommendedActions } from "./actions";
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
  buildAuditEvidence,
  buildCompetitiveEvidence,
  mergeEvidence,
} from "./evidence";
import { assignEvidenceToWorkstream } from "./mapping";
import { buildPreservationConstraints } from "./preservation";
import {
  applyCriticalCap,
  computeWorkstreamPriorityScore,
  priorityFromScore,
} from "./priority";
import type {
  GeneratedImplementationPlan,
  GeneratedWorkstream,
  PlanEvidenceItem,
} from "./types";

function summarizeWorkstream(
  type: WorkstreamType,
  evidence: PlanEvidenceItem[],
): string {
  const gaps = evidence.filter((item) => item.type === "COMPETITIVE_CATEGORY_GAP");
  const findings = evidence.filter((item) => item.type === "AUDIT_FINDING");
  const categories = evidence.filter((item) => item.type === "AUDIT_CATEGORY");

  const parts: string[] = [];

  if (gaps[0]) {
    const g = gaps[0];
    parts.push(
      `Competitive gap on ${g.category}: target ${g.targetScorePercent ?? "—"} vs competitor average ${g.competitorAverage ?? "—"} (${g.position ?? "GAP"}).`,
    );
  } else if (categories[0]) {
    parts.push(
      `Audit category weakness: ${categories[0].title}.`,
    );
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

export function generateImplementationPlanFromEvidence(options: {
  audit: WebsiteAuditResult;
  auditReportId: string;
  comparison: CompetitiveComparison | null;
  comparisonSnapshotId: string | null;
  /** When false, competitive evidence is excluded even if comparison is passed. */
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
    const workstream = assignEvidenceToWorkstream(item);
    if (!workstream) {
      continue;
    }
    const list = bags.get(workstream) ?? [];
    list.push(item);
    bags.set(workstream, list);
  }

  let workstreams: GeneratedWorkstream[] = [];

  for (const type of WORKSTREAM_ORDER) {
    const evidence = bags.get(type);
    if (!evidence || evidence.length === 0) {
      continue;
    }

    const priorityScore = computeWorkstreamPriorityScore(evidence);
    const priority = priorityFromScore(priorityScore);
    const actions = buildRecommendedActions(type, evidence);
    const preservationConstraints = buildPreservationConstraints({
      workstreamType: type,
      audit: options.audit,
      evidence,
      allEvidence,
    });

    // Skip workstreams with zero actionable recommendations and only soft evidence
    if (actions.length === 0 && evidence.every((e) => e.type === "AUDIT_CATEGORY")) {
      // Still allow if category is weak — provide a generic action via rebuild of rules
      // Prefer skipping empty action bags only when no findings either
      if (!evidence.some((e) => e.type === "AUDIT_FINDING" || e.type === "COMPETITIVE_CATEGORY_GAP")) {
        continue;
      }
    }

    workstreams.push({
      workstreamType: type,
      priority,
      priorityScore,
      title: WORKSTREAM_TITLES[type],
      summary: summarizeWorkstream(type, evidence),
      sortOrder: 0,
      capabilities: [...WORKSTREAM_DEFAULT_CAPABILITIES[type]],
      evidence,
      actions:
        actions.length > 0
          ? actions
          : [
              {
                id: "review-evidence",
                label: `Review ${WORKSTREAM_TITLES[type].toLowerCase()} evidence and define remediation scope`,
                evidenceSourceKeys: evidence.map((e) => e.sourceKey).slice(0, 8),
              },
            ],
      preservationConstraints,
    });
  }

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
