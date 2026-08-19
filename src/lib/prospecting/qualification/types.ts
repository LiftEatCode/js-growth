import type { AuditCategory } from "@/lib/website-audit/types";

export type QualificationLabel =
  | "STRONG"
  | "GOOD"
  | "FAIR"
  | "WEAK"
  | "SKIP";

export interface QualificationFactor {
  id: string;
  label: string;
  delta: number;
  detail: string;
}

export interface StoredQualification {
  version: 1;
  score: number;
  label: QualificationLabel;
  factors: QualificationFactor[];
  primaryFindingId: string | null;
  primaryFindingTitle: string | null;
  secondaryFindingId: string | null;
  secondaryFindingTitle: string | null;
  skipReason: string | null;
  overallScore: number;
  scoreBandId: string;
  weakestRelevantCategory: AuditCategory | null;
  auditedAt: string;
  reusedAudit: boolean;
}

export interface QualificationContext {
  hostname: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  campaignCity: string | null;
  campaignState: string | null;
  suppressed: boolean;
  customerSuppressed: boolean;
  existingLead: boolean;
  reusedAudit?: boolean;
  auditedAt?: string;
}

export interface RankableProspect {
  prospectId: string;
  businessName: string;
  qualificationStatus: string;
  score: number | null;
}
