import type { ProspectOutreachStatusValue } from "@/lib/prospecting/labels";
import type { OutreachOutcomeValue } from "@/lib/prospecting/outreach/outcome-types";

const OUTREACH_STATUS_RANK: Record<ProspectOutreachStatusValue, number> = {
  NOT_READY: 0,
  CONTACT_FOUND: 1,
  NO_CONTACT: 1,
  CONTACT_DISCOVERY_FAILED: 1,
  DRAFT_READY: 2,
  DRAFT_GENERATION_FAILED: 2,
  APPROVED: 3,
  SENT: 4,
  REPLIED: 5,
  INTERESTED: 6,
  NOT_INTERESTED: 6,
  SUPPRESSED: 7,
  CONVERTED: 8,
};

export function outreachStatusForOutcome(
  outcome: OutreachOutcomeValue,
): ProspectOutreachStatusValue | null {
  switch (outcome) {
    case "REPLIED":
      return "REPLIED";
    case "INTERESTED":
      return "INTERESTED";
    case "NOT_INTERESTED":
      return "NOT_INTERESTED";
    case "NO_RESPONSE":
    case "BOUNCED":
      return null;
  }
}

export function mergeProspectOutreachStatus(
  current: ProspectOutreachStatusValue,
  next: ProspectOutreachStatusValue,
): ProspectOutreachStatusValue {
  if (current === "CONVERTED" || next === "CONVERTED") {
    return "CONVERTED";
  }

  return OUTREACH_STATUS_RANK[next] >= OUTREACH_STATUS_RANK[current]
    ? next
    : current;
}

export function canRecordOutcomeForMessageStatus(
  status: string,
  channel: string,
): boolean {
  if (channel === "CONTACT_FORM") {
    return status === "SUBMITTED";
  }

  return status === "SENT";
}

export function isBounceOutcomeAllowed(channel: string): boolean {
  return channel === "EMAIL";
}

export function canConvertProspect(input: {
  outreachStatus: ProspectOutreachStatusValue;
  leadId: string | null;
  hasCompletedOutreach: boolean;
  latestOutcome: OutreachOutcomeValue | null;
}): boolean {
  if (input.leadId || input.outreachStatus === "CONVERTED") {
    return false;
  }

  if (!input.hasCompletedOutreach) {
    return false;
  }

  return (
    input.outreachStatus === "INTERESTED" ||
    input.outreachStatus === "REPLIED" ||
    input.latestOutcome === "INTERESTED" ||
    input.latestOutcome === "REPLIED"
  );
}
