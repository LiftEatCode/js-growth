export {
  CLIENT_PROJECT_ONBOARDING_VERSION,
  PROJECT_COMMERCIAL_SNAPSHOT_VERSION,
  ONBOARDING_CHECKLIST_VERSION,
  CLIENT_STATUSES,
  CLIENT_PROJECT_STATUSES,
  ONBOARDING_ITEM_KEYS,
  ONBOARDING_ITEM_STATUSES,
  clientProjectStatusLabel,
  derivedOnboardingStateLabel,
} from "./constants";
export type {
  ClientStatusValue,
  ClientProjectStatusValue,
  OnboardingItemKey,
  OnboardingItemStatusValue,
  DerivedOnboardingState,
} from "./constants";

export type {
  OnboardingEligibilityResult,
  ProjectCommercialSnapshot,
  ChecklistTemplateItem,
  LoadedProjectSummary,
  OnboardingItemView,
} from "./types";

export { getOnboardingEligibility } from "./eligibility";
export {
  buildOnboardingChecklistTemplate,
  isOnboardingItemSatisfied,
} from "./checklist";
export {
  buildProjectCommercialSnapshot,
  parseProjectCommercialSnapshot,
} from "./snapshot";
export {
  mapScopeSnapshotToDelivery,
  deliveryTaskKeyFor,
  collectSnapshotCapabilities,
} from "./map-delivery";
export {
  deriveOnboardingState,
  canStartProject,
  canCompleteProject,
} from "./derive";
export {
  convertOpportunityToClientProject,
} from "./convert";
export type { ConvertToClientResult } from "./convert";
export {
  normalizeHostname,
  resolveInitialClientContact,
} from "./identity";
export {
  loadOnboardingEligibilityForOpportunity,
  loadProjectForOpportunity,
  loadClientList,
  loadClientDetail,
  loadProjectDetail,
} from "./load";
export {
  updateOnboardingItemStatus,
  startClientProject,
  updateDeliveryTaskStatus,
  completeClientProject,
} from "./mutate";
export type { OnboardingMutationResult } from "./mutate";
