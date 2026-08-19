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
  | "CONTACT_DISCOVERY_FAILED"
  | "DRAFT_READY"
  | "DRAFT_GENERATION_FAILED"
  | "SUPPRESSED"
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
  NO_CONTACT: "No public email",
  CONTACT_DISCOVERY_FAILED: "Contact discovery failed",
  DRAFT_READY: "Draft ready",
  DRAFT_GENERATION_FAILED: "Draft generation failed",
  SUPPRESSED: "Suppressed",
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

export type QualificationLabelValue =
  | "STRONG"
  | "GOOD"
  | "FAIR"
  | "WEAK"
  | "SKIP";

const QUALIFICATION_LABELS: Record<QualificationLabelValue, string> = {
  STRONG: "Strong",
  GOOD: "Good",
  FAIR: "Fair",
  WEAK: "Weak",
  SKIP: "Skip",
};

export function qualificationLabelText(label: QualificationLabelValue): string {
  return QUALIFICATION_LABELS[label];
}

export type ContactSourceTypeValue =
  | "WEBSITE"
  | "CONTACT_PAGE"
  | "PROVIDER"
  | "MANUAL"
  | "WEBSITE_HOMEPAGE"
  | "WEBSITE_CONTACT_PAGE"
  | "WEBSITE_ABOUT_PAGE"
  | "WEBSITE_TEAM_PAGE"
  | "WEBSITE_OTHER";

const CONTACT_SOURCE_LABELS: Record<ContactSourceTypeValue, string> = {
  WEBSITE: "Website",
  CONTACT_PAGE: "Contact page",
  PROVIDER: "Provider",
  MANUAL: "Manual",
  WEBSITE_HOMEPAGE: "Homepage",
  WEBSITE_CONTACT_PAGE: "Contact page",
  WEBSITE_ABOUT_PAGE: "About page",
  WEBSITE_TEAM_PAGE: "Team page",
  WEBSITE_OTHER: "Website",
};

export function contactSourceLabel(type: ContactSourceTypeValue): string {
  return CONTACT_SOURCE_LABELS[type];
}

export function contactConfidenceLabel(value: "HIGH" | "MEDIUM" | "LOW"): string {
  switch (value) {
    case "HIGH":
      return "High";
    case "MEDIUM":
      return "Medium";
    case "LOW":
      return "Low";
  }
}

export function draftStatusLabel(status: string | null): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "NEEDS_REVIEW":
      return "Needs review";
    case "APPROVED":
      return "Approved";
    case "SENDING":
      return "Sending";
    case "REJECTED":
      return "Rejected";
    case "FAILED":
      return "Failed";
    case "SENT":
      return "Sent";
    case "CANCELLED":
      return "Cancelled";
    case "SUPPRESSED":
      return "Suppressed";
    default:
      return "Missing";
  }
}
