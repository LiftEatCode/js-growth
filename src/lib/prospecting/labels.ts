export type CampaignStatusValue =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED";

export type ProspectQualificationStatusValue =
  | "DISCOVERED"
  | "WEBSITE_INVALID"
  | "AUDITING"
  | "AUDIT_FAILED"
  | "QUALIFIED"
  | "SKIPPED";

export type ProspectOutreachStatusValue =
  | "NOT_READY"
  | "CONTACT_FOUND"
  | "NO_CONTACT"
  | "DRAFT_READY"
  | "APPROVED"
  | "SENT"
  | "REPLIED"
  | "INTERESTED"
  | "NOT_INTERESTED"
  | "CONVERTED";

export type ProspectSourceTypeValue =
  | "MANUAL"
  | "PROVIDER"
  | "WEBSITE"
  | "GOOGLE_PLACES";

const CAMPAIGN_STATUS_LABELS: Record<CampaignStatusValue, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

const QUALIFICATION_STATUS_LABELS: Record<
  ProspectQualificationStatusValue,
  string
> = {
  DISCOVERED: "Discovered",
  WEBSITE_INVALID: "Website invalid",
  AUDITING: "Auditing",
  AUDIT_FAILED: "Audit failed",
  QUALIFIED: "Qualified",
  SKIPPED: "Skipped",
};

const OUTREACH_STATUS_LABELS: Record<ProspectOutreachStatusValue, string> = {
  NOT_READY: "Not ready",
  CONTACT_FOUND: "Contact found",
  NO_CONTACT: "No contact",
  DRAFT_READY: "Draft ready",
  APPROVED: "Approved",
  SENT: "Sent",
  REPLIED: "Replied",
  INTERESTED: "Interested",
  NOT_INTERESTED: "Not interested",
  CONVERTED: "Converted",
};

const SOURCE_TYPE_LABELS: Record<ProspectSourceTypeValue, string> = {
  MANUAL: "Manual",
  PROVIDER: "Provider",
  WEBSITE: "Website",
  GOOGLE_PLACES: "Google Places",
};

export function campaignStatusLabel(status: CampaignStatusValue): string {
  return CAMPAIGN_STATUS_LABELS[status];
}

export function qualificationStatusLabel(
  status: ProspectQualificationStatusValue,
): string {
  return QUALIFICATION_STATUS_LABELS[status];
}

export function outreachStatusLabel(
  status: ProspectOutreachStatusValue,
): string {
  return OUTREACH_STATUS_LABELS[status];
}

export function sourceTypeLabel(type: ProspectSourceTypeValue): string {
  return SOURCE_TYPE_LABELS[type];
}

export function formatProspectLocation(input: {
  city: string | null;
  state: string | null;
}): string {
  if (input.city && input.state) {
    return `${input.city}, ${input.state}`;
  }

  return input.city ?? input.state ?? "—";
}

export type DiscoveryCandidateStatusLabel =
  | "ELIGIBLE"
  | "NO_WEBSITE"
  | "INVALID_WEBSITE"
  | "DUPLICATE_PLACE"
  | "DUPLICATE_HOSTNAME"
  | "EXISTING_PROSPECT"
  | "ALREADY_IN_CAMPAIGN"
  | "EXISTING_LEAD"
  | "SUPPRESSED";

const CANDIDATE_STATUS_LABELS: Record<DiscoveryCandidateStatusLabel, string> = {
  ELIGIBLE: "Eligible",
  NO_WEBSITE: "No website",
  INVALID_WEBSITE: "Invalid website",
  DUPLICATE_PLACE: "Duplicate place",
  DUPLICATE_HOSTNAME: "Duplicate hostname",
  EXISTING_PROSPECT: "Existing prospect",
  ALREADY_IN_CAMPAIGN: "Already in campaign",
  EXISTING_LEAD: "Existing lead",
  SUPPRESSED: "Suppressed",
};

export function discoveryCandidateStatusLabel(
  status: DiscoveryCandidateStatusLabel,
): string {
  return CANDIDATE_STATUS_LABELS[status];
}
