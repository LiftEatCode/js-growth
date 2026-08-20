import type { AuditCategory, AuditPriority } from "@/lib/website-audit/types";
import type { CompetitivePosition } from "@/lib/competitive-intelligence/comparison/types";

import type { ServiceCapabilityId } from "../capabilities/types";
import type { WorkstreamType } from "./constants";

export type ImplementationPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type PlanEvidenceType =
  | "AUDIT_CATEGORY"
  | "AUDIT_FINDING"
  | "COMPETITIVE_CATEGORY_GAP"
  | "COMPETITIVE_FINDING"
  | "COMPETITIVE_ADVANTAGE";

export interface PlanEvidenceItem {
  type: PlanEvidenceType;
  /** Stable provenance key, e.g. category:content, finding:thin-content */
  sourceKey: string;
  category: AuditCategory | null;
  findingId: string | null;
  title: string;
  /** 0–100 category percent when applicable */
  targetScorePercent: number | null;
  competitorAverage: number | null;
  gapVsAverage: number | null;
  position: CompetitivePosition | null;
  competitorsOutperforming: number | null;
  competitorsCompared: number | null;
  auditPriority: AuditPriority | null;
  auditStatus: "pass" | "warning" | "fail" | null;
}

export interface RecommendedAction {
  id: string;
  label: string;
  /**
   * Provenance: every key must exist in the same workstream's evidence
   * (or plan-level preservation evidence for maintenance actions).
   * Alias concept: supportingSourceKeys.
   */
  evidenceSourceKeys: string[];
}

export interface PreservationConstraint {
  id: string;
  category: AuditCategory;
  statement: string;
  evidenceSourceKeys: string[];
  /** Optional minor-finding maintenance under a preserved strength. */
  maintenanceActions?: RecommendedAction[];
}

export interface GeneratedWorkstream {
  workstreamType: WorkstreamType;
  priority: ImplementationPriority;
  priorityScore: number;
  title: string;
  summary: string;
  sortOrder: number;
  capabilities: ServiceCapabilityId[];
  evidence: PlanEvidenceItem[];
  actions: RecommendedAction[];
  preservationConstraints: PreservationConstraint[];
}

export interface GeneratedImplementationPlan {
  planVersion: number;
  mappingVersion: number;
  capabilityVersion: number;
  auditReportId: string;
  comparisonSnapshotId: string | null;
  competitiveEvidenceUsed: boolean;
  workstreams: GeneratedWorkstream[];
  generatedAt: string;
}

export interface ImplementationPlanFingerprint {
  auditReportId: string;
  comparisonSnapshotId: string | null;
  planVersion: number;
  mappingVersion: number;
  capabilityVersion: number;
}
