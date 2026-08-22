export const PROPOSAL_DELIVERY_VERSION = 1;

export const PROPOSAL_DELIVERY_STATUSES = [
  "DRAFT",
  "READY",
  "SENDING",
  "SENT",
  "FAILED",
] as const;

export type ProposalDeliveryStatus =
  (typeof PROPOSAL_DELIVERY_STATUSES)[number];

export const PROPOSAL_DECISIONS = [
  "PENDING",
  "INTERESTED",
  "CHANGES_REQUESTED",
  "DECLINED",
  "ACCEPTED",
] as const;

export type ProposalDecision = (typeof PROPOSAL_DECISIONS)[number];

export const MAX_RECIPIENT_NAME_CHARS = 200;
export const MAX_RECIPIENT_EMAIL_CHARS = 320;
export const MAX_DELIVERY_SUBJECT_CHARS = 200;
export const MAX_DELIVERY_MESSAGE_CHARS = 8_000;
export const MAX_DECISION_NOTE_CHARS = 500;

export const PROPOSAL_SHARE_TOKEN_BYTES = 32;

export function proposalDeliveryStatusLabel(
  status: ProposalDeliveryStatus,
): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "READY":
      return "Ready";
    case "SENDING":
      return "Sending";
    case "SENT":
      return "Sent";
    case "FAILED":
      return "Failed";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function proposalDecisionLabel(decision: ProposalDecision): string {
  switch (decision) {
    case "PENDING":
      return "Pending";
    case "INTERESTED":
      return "Interested";
    case "CHANGES_REQUESTED":
      return "Changes requested";
    case "DECLINED":
      return "Declined";
    case "ACCEPTED":
      return "Accepted (intent only)";
    default: {
      const _exhaustive: never = decision;
      return _exhaustive;
    }
  }
}

export function isValidRecipientEmail(email: string): boolean {
  const trimmed = email.trim();
  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_RECIPIENT_EMAIL_CHARS ||
    trimmed.includes(" ")
  ) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function normalizeRecipientEmail(email: string): string {
  return email.trim().toLowerCase();
}
