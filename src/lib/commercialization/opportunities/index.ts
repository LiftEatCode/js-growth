export {
  OPPORTUNITY_MANAGEMENT_VERSION,
  OPPORTUNITY_STAGES,
  OPPORTUNITY_LOST_REASONS,
  ACTIVE_OPPORTUNITY_STAGES,
  opportunityStageLabel,
  opportunityLostReasonLabel,
  isTerminalOpportunityStage,
  isActiveOpportunityStage,
} from "./constants";
export type {
  OpportunityStage,
  OpportunityLostReason,
  OpportunityActivityType,
} from "./constants";
export { snapshotCapabilitiesFromPlan, parseCapabilitiesSnapshot } from "./capabilities";
export { evaluateOpportunityIntelligenceStaleness } from "./staleness";
export {
  canTransitionOpportunityStage,
  classifyNextActionState,
} from "./workflow";

// Server-only create/mutate/load: import those modules directly from server code.
// Do not re-export them here — client components must not pull server-only graphs.
