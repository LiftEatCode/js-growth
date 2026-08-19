import type { OutreachChannelValue } from "@/lib/prospecting/outreach/types";
import type { OutreachOutcomeValue } from "@/lib/prospecting/outreach/outcome-types";

export interface CampaignFunnelProspectRow {
  prospectId: string;
  qualificationStatus: string;
  outreachStatus: string;
  isSelectedTopN: boolean;
  auditReportId: string | null;
  leadId: string | null;
  hasPrimaryEmail: boolean;
  hasPrimaryContactForm: boolean;
  hasDraft: boolean;
  hasApprovedDraft: boolean;
  hasEmailSent: boolean;
  hasFormSubmitted: boolean;
  outcomes: OutreachOutcomeValue[];
}

export interface CampaignFunnelCounts {
  discovered: number;
  imported: number;
  audited: number;
  qualified: number;
  selectedTopN: number;
  contactable: number;
  emailContacts: number;
  contactForms: number;
  draftsGenerated: number;
  approved: number;
  emailSent: number;
  formsSubmitted: number;
  outreachCompleted: number;
  replied: number;
  interested: number;
  notInterested: number;
  convertedToLead: number;
}

export interface CampaignFunnelRates {
  contactRate: number | null;
  outreachRate: number | null;
  replyRate: number | null;
  interestRate: number | null;
  leadConversionRate: number | null;
}

export interface CampaignFunnelMetrics {
  counts: CampaignFunnelCounts;
  rates: CampaignFunnelRates;
}

function uniqueProspectsMatching(
  rows: CampaignFunnelProspectRow[],
  predicate: (row: CampaignFunnelProspectRow) => boolean,
): number {
  return new Set(
    rows.filter(predicate).map((row) => row.prospectId),
  ).size;
}

function uniqueProspectsWithOutcome(
  rows: CampaignFunnelProspectRow[],
  outcomes: OutreachOutcomeValue[],
): number {
  return uniqueProspectsMatching(rows, (row) =>
    row.outcomes.some((outcome) => outcomes.includes(outcome)),
  );
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }

  return numerator / denominator;
}

export function computeCampaignFunnelMetrics(input: {
  discovered: number;
  rows: CampaignFunnelProspectRow[];
}): CampaignFunnelMetrics {
  const rows = input.rows;
  const selectedRows = rows.filter((row) => row.isSelectedTopN);

  const emailContacts = uniqueProspectsMatching(
    selectedRows,
    (row) => row.hasPrimaryEmail,
  );
  const contactForms = uniqueProspectsMatching(
    selectedRows,
    (row) => row.hasPrimaryContactForm,
  );
  const contactable = uniqueProspectsMatching(
    selectedRows,
    (row) => row.hasPrimaryEmail || row.hasPrimaryContactForm,
  );
  const emailSentProspects = uniqueProspectsMatching(
    rows,
    (row) => row.hasEmailSent,
  );
  const formsSubmittedProspects = uniqueProspectsMatching(
    rows,
    (row) => row.hasFormSubmitted,
  );
  const outreachCompletedProspects = uniqueProspectsMatching(
    rows,
    (row) => row.hasEmailSent || row.hasFormSubmitted,
  );
  const repliedProspects = uniqueProspectsWithOutcome(rows, [
    "REPLIED",
    "INTERESTED",
  ]);
  const interestedProspects = uniqueProspectsWithOutcome(rows, ["INTERESTED"]);
  const notInterestedProspects = uniqueProspectsWithOutcome(rows, [
    "NOT_INTERESTED",
  ]);
  const convertedProspects = uniqueProspectsMatching(
    rows,
    (row) => Boolean(row.leadId) || row.outreachStatus === "CONVERTED",
  );

  const counts: CampaignFunnelCounts = {
    discovered: input.discovered,
    imported: rows.length,
    audited: uniqueProspectsMatching(rows, (row) => Boolean(row.auditReportId)),
    qualified: uniqueProspectsMatching(
      rows,
      (row) => row.qualificationStatus === "QUALIFIED",
    ),
    selectedTopN: selectedRows.length,
    contactable,
    emailContacts,
    contactForms,
    draftsGenerated: uniqueProspectsMatching(rows, (row) => row.hasDraft),
    approved: uniqueProspectsMatching(rows, (row) => row.hasApprovedDraft),
    emailSent: emailSentProspects,
    formsSubmitted: formsSubmittedProspects,
    outreachCompleted: outreachCompletedProspects,
    replied: repliedProspects,
    interested: interestedProspects,
    notInterested: notInterestedProspects,
    convertedToLead: convertedProspects,
  };

  const rates: CampaignFunnelRates = {
    contactRate: rate(contactable, counts.selectedTopN),
    outreachRate: rate(outreachCompletedProspects, contactable),
    replyRate: rate(repliedProspects, outreachCompletedProspects),
    interestRate: rate(interestedProspects, outreachCompletedProspects),
    leadConversionRate: rate(convertedProspects, outreachCompletedProspects),
  };

  return { counts, rates };
}

export function formatFunnelRate(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

export function outreachChannelLabel(channel: OutreachChannelValue): string {
  return channel === "CONTACT_FORM" ? "Contact form" : "Email";
}
