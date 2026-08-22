export {
  COMMERCIAL_PROPOSAL_VERSION,
  COMMERCIAL_PROPOSAL_PRESENTATION_VERSION,
  COMMERCIAL_PROPOSAL_STATUSES,
  commercialProposalStatusLabel,
} from "./constants";
export type { CommercialProposalStatus } from "./constants";
export {
  buildProposalFromApprovedSources,
  sumClientVisibleInvestmentCents,
  sumClientVisibleGroupCents,
} from "./build";
export {
  polishDeliverableLabel,
  deliverablePresentationLabel,
  investmentIncludeLabelForLine,
  getSectionClientValueExplanation,
  resolveFinancialGroup,
  isInternalAuditFindingLanguage,
  WORK_UNIT_PRESENTATION_LABELS,
  WORK_UNIT_INVESTMENT_INCLUDE_LABELS,
} from "./presentation";
export {
  PROPOSAL_FINANCIAL_RECONCILIATION_FAILED,
  ProposalFinancialReconciliationError,
} from "./reconcile";
export {
  buildProposalSourceFingerprint,
  parseProposalSourceFingerprint,
} from "./fingerprint";
export { evaluateProposalStaleness } from "./staleness";
export type {
  BuiltCommercialProposal,
  ProposalSnapshot,
  ProposalSourceFingerprint,
} from "./types";
