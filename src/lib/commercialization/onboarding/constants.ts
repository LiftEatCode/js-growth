export const CLIENT_PROJECT_ONBOARDING_VERSION = 1;
export const PROJECT_COMMERCIAL_SNAPSHOT_VERSION = 1;
export const ONBOARDING_CHECKLIST_VERSION = 1;

export const CLIENT_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;
export type ClientStatusValue = (typeof CLIENT_STATUSES)[number];

export const CLIENT_PROJECT_STATUSES = [
  "ONBOARDING",
  "READY",
  "ACTIVE",
  "BLOCKED",
  "COMPLETED",
  "CANCELED",
  "ARCHIVED",
] as const;
export type ClientProjectStatusValue = (typeof CLIENT_PROJECT_STATUSES)[number];

export const ONBOARDING_ITEM_KEYS = [
  "CLIENT_CONTACT_CONFIRMED",
  "AGREEMENT_ACCEPTED",
  "INITIAL_PAYMENT_CONFIRMED",
  "WEBSITE_ACCESS_REQUESTED",
  "WEBSITE_ACCESS_RECEIVED",
  "HOSTING_ACCESS_REQUESTED",
  "HOSTING_ACCESS_RECEIVED",
  "DOMAIN_DNS_ACCESS_IF_REQUIRED",
  "GOOGLE_ANALYTICS_ACCESS_IF_REQUIRED",
  "SEARCH_CONSOLE_ACCESS_IF_REQUIRED",
  "GOOGLE_BUSINESS_PROFILE_ACCESS_IF_REQUIRED",
  "CONTENT_ASSETS_REQUESTED",
  "BRAND_ASSETS_REQUESTED",
  "PROJECT_KICKOFF_SCHEDULED",
  "PROJECT_KICKOFF_COMPLETED",
] as const;

export type OnboardingItemKey = (typeof ONBOARDING_ITEM_KEYS)[number];

export const ONBOARDING_ITEM_STATUSES = [
  "NOT_STARTED",
  "REQUESTED",
  "RECEIVED",
  "NOT_REQUIRED",
  "COMPLETED",
] as const;
export type OnboardingItemStatusValue =
  (typeof ONBOARDING_ITEM_STATUSES)[number];

export type DerivedOnboardingState =
  | "NOT_STARTED"
  | "WAITING_ON_CLIENT"
  | "READY_FOR_KICKOFF"
  | "IN_PROGRESS"
  | "COMPLETE"
  | "FINAL_HANDOFF_BLOCKED_BY_BALANCE";

export function clientProjectStatusLabel(
  status: ClientProjectStatusValue,
): string {
  switch (status) {
    case "ONBOARDING":
      return "Onboarding";
    case "READY":
      return "Ready for kickoff";
    case "ACTIVE":
      return "Active";
    case "BLOCKED":
      return "Blocked";
    case "COMPLETED":
      return "Completed";
    case "CANCELED":
      return "Canceled";
    case "ARCHIVED":
      return "Archived";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function derivedOnboardingStateLabel(
  state: DerivedOnboardingState,
): string {
  switch (state) {
    case "NOT_STARTED":
      return "Not started";
    case "WAITING_ON_CLIENT":
      return "Waiting on client";
    case "READY_FOR_KICKOFF":
      return "Ready for kickoff";
    case "IN_PROGRESS":
      return "In progress";
    case "COMPLETE":
      return "Complete";
    case "FINAL_HANDOFF_BLOCKED_BY_BALANCE":
      return "Final handoff blocked — balance due";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
