import { computeCampaignFunnelMetrics } from "./campaign-funnel";
import type { CampaignFunnelProspectRow } from "./campaign-funnel";
import type { OutreachOutcomeValue } from "@/lib/prospecting/outreach/outcome-types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const rows: CampaignFunnelProspectRow[] = [
  {
    prospectId: "p1",
    qualificationStatus: "QUALIFIED",
    outreachStatus: "INTERESTED",
    isSelectedTopN: true,
    isSelectedForOutreach: true,
    auditReportId: "audit-1",
    leadId: null,
    hasPrimaryEmail: true,
    hasPrimaryContactForm: false,
    hasDraft: true,
    hasApprovedDraft: true,
    hasEmailSent: true,
    hasFormSubmitted: false,
    outcomes: ["REPLIED", "INTERESTED"] satisfies OutreachOutcomeValue[],
  },
  {
    prospectId: "p2",
    qualificationStatus: "QUALIFIED",
    outreachStatus: "SENT",
    isSelectedTopN: true,
    isSelectedForOutreach: true,
    auditReportId: "audit-2",
    leadId: null,
    hasPrimaryEmail: false,
    hasPrimaryContactForm: true,
    hasDraft: true,
    hasApprovedDraft: true,
    hasEmailSent: false,
    hasFormSubmitted: true,
    outcomes: [] satisfies OutreachOutcomeValue[],
  },
  {
    prospectId: "p3",
    qualificationStatus: "QUALIFIED",
    outreachStatus: "CONVERTED",
    isSelectedTopN: true,
    isSelectedForOutreach: true,
    auditReportId: "audit-3",
    leadId: "lead-3",
    hasPrimaryEmail: true,
    hasPrimaryContactForm: false,
    hasDraft: true,
    hasApprovedDraft: true,
    hasEmailSent: true,
    hasFormSubmitted: false,
    outcomes: ["INTERESTED"] satisfies OutreachOutcomeValue[],
  },
  {
    prospectId: "p4",
    qualificationStatus: "QUALIFIED",
    outreachStatus: "NOT_READY",
    isSelectedTopN: false,
    isSelectedForOutreach: true,
    auditReportId: "audit-4",
    leadId: null,
    hasPrimaryEmail: true,
    hasPrimaryContactForm: false,
    hasDraft: false,
    hasApprovedDraft: false,
    hasEmailSent: false,
    hasFormSubmitted: false,
    outcomes: [] satisfies OutreachOutcomeValue[],
  },
];

const metrics = computeCampaignFunnelMetrics({
  discovered: 10,
  rows,
});

assert(metrics.counts.selectedTopN === 3, "selected top N stays algorithm-only");
assert(
  metrics.counts.selectedForOutreach === 4,
  "selected for outreach includes manual non-Top-N",
);
assert(metrics.counts.emailSent === 2, "email sent counts correctly");
assert(metrics.counts.formsSubmitted === 1, "form submitted counts correctly");
assert(
  metrics.counts.outreachCompleted === 3,
  "outreach completed dedupes by prospect",
);
assert(metrics.counts.replied === 2, "replied prospects counted uniquely");
assert(metrics.counts.interested === 2, "interested prospects counted uniquely");
assert(metrics.counts.convertedToLead === 1, "converted prospects counted uniquely");
assert(
  metrics.rates.replyRate === 2 / 3,
  "reply rate uses outreach completed denominator",
);
assert(
  metrics.rates.interestRate === 2 / 3,
  "interest rate uses outreach completed denominator",
);
assert(
  metrics.rates.leadConversionRate === 1 / 3,
  "conversion rate uses outreach completed denominator",
);

console.log("campaign-funnel.verify.ts passed");
