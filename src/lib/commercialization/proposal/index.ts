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
  getSectionClientValueExplanation,
  resolveFinancialGroup,
  isInternalAuditFindingLanguage,
} from "./presentation";
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
