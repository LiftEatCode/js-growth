export const OPPORTUNITY_MANAGEMENT_VERSION = 1;

export const OPPORTUNITY_STAGES = [
  "NEW",
  "QUALIFIED",
  "DISCOVERY",
  "SOLUTION_FIT",
  "PROPOSAL_READY",
  "WON",
  "LOST",
] as const;

export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const ACTIVE_OPPORTUNITY_STAGES = [
  "NEW",
  "QUALIFIED",
  "DISCOVERY",
  "SOLUTION_FIT",
  "PROPOSAL_READY",
] as const satisfies readonly OpportunityStage[];

export const TERMINAL_OPPORTUNITY_STAGES = ["WON", "LOST"] as const satisfies readonly OpportunityStage[];

export const OPPORTUNITY_LOST_REASONS = [
  "PRICE",
  "NO_RESPONSE",
  "NOT_READY",
  "NO_FIT",
  "COMPETITOR",
  "DIY",
  "TIMING",
  "OTHER",
] as const;

export type OpportunityLostReason = (typeof OPPORTUNITY_LOST_REASONS)[number];

export const OPPORTUNITY_ACTIVITY_TYPES = [
  "OPPORTUNITY_CREATED",
  "STAGE_CHANGED",
  "NEXT_ACTION_CHANGED",
  "NOTE_ADDED",
  "CAPABILITIES_UPDATED",
  "MARKED_WON",
  "MARKED_LOST",
  "REOPENED",
  "SCOPE_CREATED",
  "SCOPE_REVIEWED",
  "SCOPE_APPROVED",
  "SCOPE_REVISED",
  "SCOPE_SUPERSEDED",
  "PRICING_CREATED",
  "PRICING_REVIEWED",
  "PRICING_APPROVED",
  "PRICING_REVISED",
  "PRICING_SUPERSEDED",
] as const;

export type OpportunityActivityType = (typeof OPPORTUNITY_ACTIVITY_TYPES)[number];

export const MAX_OPPORTUNITY_NOTE_CHARS = 4_000;
export const MAX_NEXT_ACTION_CHARS = 280;
export const MAX_LOST_NOTE_CHARS = 1_000;

export function isTerminalOpportunityStage(stage: OpportunityStage): boolean {
  return stage === "WON" || stage === "LOST";
}

export function isActiveOpportunityStage(stage: OpportunityStage): boolean {
  return !isTerminalOpportunityStage(stage);
}

export function opportunityStageLabel(stage: OpportunityStage): string {
  switch (stage) {
    case "NEW":
      return "New";
    case "QUALIFIED":
      return "Qualified";
    case "DISCOVERY":
      return "Discovery";
    case "SOLUTION_FIT":
      return "Solution fit";
    case "PROPOSAL_READY":
      return "Proposal ready";
    case "WON":
      return "Won";
    case "LOST":
      return "Lost";
    default: {
      const _exhaustive: never = stage;
      return _exhaustive;
    }
  }
}

export function opportunityLostReasonLabel(reason: OpportunityLostReason): string {
  switch (reason) {
    case "PRICE":
      return "Price";
    case "NO_RESPONSE":
      return "No response";
    case "NOT_READY":
      return "Not ready";
    case "NO_FIT":
      return "No fit";
    case "COMPETITOR":
      return "Chose competitor";
    case "DIY":
      return "DIY / in-house";
    case "TIMING":
      return "Timing";
    case "OTHER":
      return "Other";
    default: {
      const _exhaustive: never = reason;
      return _exhaustive;
    }
  }
}
