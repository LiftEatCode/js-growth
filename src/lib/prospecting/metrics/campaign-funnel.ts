import type { OutreachOutcomeValue } from "@/lib/prospecting/outreach/outcome-types";

export interface CampaignFunnelProspectRow {
  prospectId: string;
  qualificationStatus: string;
  outreachStatus: string;
  isSelectedTopN: boolean;
  auditReportId: string | null;
  leadId: string | null;
  hasPrimaryContact: boolean;
  hasDraft: boolean;
  hasApprovedDraft: boolean;
  hasSentMessage: boolean;
  outcomes: OutreachOutcomeValue[];
}

export interface CampaignFunnelCounts {
  discovered: number;
  imported: number;
  audited: number;
  qualified: number;
  selectedTopN: number;
  contactsFound: number;
  draftsGenerated: number;
  approved: number;
  sent: number;
  replied: number;
  interested: number;
  notInterested: number;
  convertedToLead: number;
}

export interface CampaignFunnelRates {
  contactRate: number | null;
  sendRate: number | null;
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
  const sentProspects = uniqueProspectsMatching(
    rows,
    (row) => row.hasSentMessage,
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
  const contactsFound = uniqueProspectsMatching(
    selectedRows,
    (row) => row.hasPrimaryContact,
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
    contactsFound,
    draftsGenerated: uniqueProspectsMatching(rows, (row) => row.hasDraft),
    approved: uniqueProspectsMatching(rows, (row) => row.hasApprovedDraft),
    sent: sentProspects,
    replied: repliedProspects,
    interested: interestedProspects,
    notInterested: notInterestedProspects,
    convertedToLead: convertedProspects,
  };

  const rates: CampaignFunnelRates = {
    contactRate: rate(contactsFound, counts.selectedTopN),
    sendRate: rate(sentProspects, contactsFound),
    replyRate: rate(repliedProspects, sentProspects),
    interestRate: rate(interestedProspects, sentProspects),
    leadConversionRate: rate(convertedProspects, sentProspects),
  };

  return { counts, rates };
}

export function formatFunnelRate(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}
