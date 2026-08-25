import {
  FOLLOW_UP_AGE_THRESHOLDS,
  type FollowUpDueState,
  type FollowUpPriorityBand,
  type FollowUpSubjectKind,
} from "./constants";
import { classifyFollowUpDueState, daysBetweenCalendar } from "./timezone";

export type LeadAgeBand = "NEW" | "ACTIVE" | "AGING" | "STALE";

export function classifyLeadAgeBand(
  createdAt: Date,
  now: Date = new Date(),
): LeadAgeBand {
  const days = daysBetweenCalendar(createdAt, now);
  if (days <= FOLLOW_UP_AGE_THRESHOLDS.NEW_MAX_DAYS) {
    return "NEW";
  }
  if (days <= FOLLOW_UP_AGE_THRESHOLDS.ACTIVE_MAX_DAYS) {
    return "ACTIVE";
  }
  if (days <= FOLLOW_UP_AGE_THRESHOLDS.AGING_MAX_DAYS) {
    return "AGING";
  }
  return "STALE";
}

export type FollowUpAttentionItem = {
  subjectKind: FollowUpSubjectKind;
  subjectId: string;
  title: string;
  href: string;
  priority: FollowUpPriorityBand;
  reason: string;
  dueState: FollowUpDueState;
  followUpAt: string | null;
  ageBand: LeadAgeBand | null;
  acquisitionChannel: string | null;
  doNotContact: boolean;
  /** Sort weight — lower = higher priority */
  sortWeight: number;
};

/**
 * Deterministic priority weights (lower first).
 * DO_NOT_CONTACT never queued (filtered before sort).
 */
export function attentionSortWeight(input: {
  inboundReplyAwaiting: boolean;
  dueState: FollowUpDueState;
  isNewInbound: boolean;
  qualifiedWithoutOpportunity: boolean;
  opportunityOverdue: boolean;
  ageBand: LeadAgeBand | null;
  nurtureUpcoming: boolean;
}): number {
  if (input.inboundReplyAwaiting) {
    return 10;
  }
  if (input.dueState === "OVERDUE") {
    return 20;
  }
  if (input.isNewInbound) {
    return 30;
  }
  if (input.dueState === "DUE_TODAY") {
    return 40;
  }
  if (input.qualifiedWithoutOpportunity) {
    return 50;
  }
  if (input.opportunityOverdue) {
    return 60;
  }
  if (input.ageBand === "STALE" || input.ageBand === "AGING") {
    return 70;
  }
  if (input.dueState === "UPCOMING") {
    return 80;
  }
  if (input.nurtureUpcoming) {
    return 90;
  }
  return 100;
}

export function bandFromWeight(weight: number): FollowUpPriorityBand {
  if (weight <= 60) {
    return "NOW";
  }
  if (weight <= 80) {
    return "NEXT";
  }
  return "WATCH";
}

export function dueStateForAuthority(
  followUpAt: Date | null | undefined,
  now?: Date,
): FollowUpDueState {
  return classifyFollowUpDueState(followUpAt, now);
}

/**
 * A scheduled follow-up is completed only when a real FollowUpActivity
 * occurs at/after the previous due moment (or operator records activity
 * that clears/reschedules). Editing followUpAt alone is NOT completion.
 */
export function isFollowUpCompletionEvent(input: {
  hadDueFollowUp: boolean;
  recordedActivity: boolean;
}): boolean {
  return input.hadDueFollowUp && input.recordedActivity;
}
