import type { ServiceCapabilityId } from "@/lib/commercialization/capabilities/types";

import type {
  OpportunityActivityType,
  OpportunityLostReason,
  OpportunityStage,
} from "./constants";

export interface OpportunityCapabilitiesSnapshot {
  capabilityVersion: number;
  sourcePlanId: string | null;
  sourcePlanStatus: string | null;
  snapshottedAt: string;
  capabilities: ServiceCapabilityId[];
  /** True when snapshot was taken with no Implementation Plan available. */
  noPlanAtSnapshot: boolean;
}

export interface OpportunityIntelligenceStaleness {
  planStale: boolean;
  planReasons: string[];
  interpretationStale: boolean;
  interpretationReasons: string[];
  comparisonStale: boolean;
  comparisonReasons: string[];
  overallStale: boolean;
}

export type CreateOpportunityResult =
  | { ok: true; opportunityId: string; reused?: false }
  | {
      ok: false;
      code:
        | "UNAUTHORIZED"
        | "MISSING_PROSPECT"
        | "DUPLICATE_ACTIVE"
        | "INVALID_INPUT";
      message: string;
      existingOpportunityId?: string;
    };

export type OpportunityMutationResult =
  | { ok: true; opportunityId: string }
  | {
      ok: false;
      code:
        | "UNAUTHORIZED"
        | "NOT_FOUND"
        | "INVALID_STAGE"
        | "INVALID_INPUT"
        | "LOST_REASON_REQUIRED"
        | "TERMINAL_STATE";
      message: string;
    };

export interface OpportunityActivityRecord {
  id: string;
  type: OpportunityActivityType;
  actorEmail: string;
  fromValueJson: unknown;
  toValueJson: unknown;
  note: string | null;
  createdAt: Date;
}

export interface OpportunityListFilters {
  stage?: OpportunityStage | "ALL_ACTIVE" | "ALL";
  ownerEmail?: string | null;
  nextActionState?: "overdue" | "upcoming" | "none" | "any";
  capability?: ServiceCapabilityId | null;
}

export type { OpportunityLostReason, OpportunityStage };
