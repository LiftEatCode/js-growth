/**
 * Growth Sprint 11 — Lead Follow-up & Nurture Operations V1
 *
 * Capture what operators do. Preserve acquisition separately from activity channel.
 * No autonomous outreach. No AI qualification.
 */

export const LEAD_FOLLOWUP_VERSION = 1 as const;

/** JS Solutions ops calendar (documented Sprint 1+). */
export const FOLLOW_UP_OPERATOR_TIMEZONE = "America/Chicago" as const;

export const FOLLOW_UP_ACTIVITY_TYPES = [
  "EMAIL",
  "PHONE_CALL",
  "TEXT_MESSAGE",
  "FACEBOOK_MESSAGE",
  "IN_PERSON",
  "MEETING",
  "NOTE",
  "FOLLOW_UP",
  "OTHER",
] as const;
export type FollowUpActivityTypeValue =
  (typeof FOLLOW_UP_ACTIVITY_TYPES)[number];

export const FOLLOW_UP_DIRECTIONS = [
  "INBOUND",
  "OUTBOUND",
  "INTERNAL",
] as const;
export type FollowUpDirectionValue = (typeof FOLLOW_UP_DIRECTIONS)[number];

export const FOLLOW_UP_OUTCOMES = [
  "SENT",
  "REPLIED",
  "CONNECTED",
  "NO_ANSWER",
  "LEFT_VOICEMAIL",
  "BOUNCED",
  "INTERESTED",
  "NOT_INTERESTED",
  "FOLLOW_UP_REQUIRED",
  "MEETING_SCHEDULED",
  "QUALIFIED",
  "DISQUALIFIED",
  "DO_NOT_CONTACT",
  "NO_RESPONSE",
  "OTHER",
] as const;
export type FollowUpOutcomeValue = (typeof FOLLOW_UP_OUTCOMES)[number];

export const FOLLOW_UP_SUBJECT_KINDS = [
  "LEAD",
  "PROSPECT",
  "OPPORTUNITY",
] as const;
export type FollowUpSubjectKind = (typeof FOLLOW_UP_SUBJECT_KINDS)[number];

export const FOLLOW_UP_DUE_STATES = [
  "OVERDUE",
  "DUE_TODAY",
  "UPCOMING",
  "NONE",
] as const;
export type FollowUpDueState = (typeof FOLLOW_UP_DUE_STATES)[number];

export const FOLLOW_UP_PRIORITY_BANDS = ["NOW", "NEXT", "WATCH"] as const;
export type FollowUpPriorityBand = (typeof FOLLOW_UP_PRIORITY_BANDS)[number];

/** JS_SOLUTIONS_OPERATING_RULE — lead age bands (days from createdAt). */
export const FOLLOW_UP_AGE_THRESHOLDS = {
  NEW_MAX_DAYS: 3,
  ACTIVE_MAX_DAYS: 14,
  AGING_MAX_DAYS: 30,
} as const;

export const FOLLOW_UP_ATTENTION_LIMIT = 40 as const;

export function isFollowUpActivityType(
  value: string,
): value is FollowUpActivityTypeValue {
  return (FOLLOW_UP_ACTIVITY_TYPES as readonly string[]).includes(value);
}

export function isFollowUpDirection(
  value: string,
): value is FollowUpDirectionValue {
  return (FOLLOW_UP_DIRECTIONS as readonly string[]).includes(value);
}

export function isFollowUpOutcome(value: string): value is FollowUpOutcomeValue {
  return (FOLLOW_UP_OUTCOMES as readonly string[]).includes(value);
}
