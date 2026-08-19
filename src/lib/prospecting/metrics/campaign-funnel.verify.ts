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
    auditReportId: "audit-1",
    leadId: null,
    hasPrimaryContact: true,
    hasDraft: true,
    hasApprovedDraft: true,
    hasSentMessage: true,
    outcomes: ["REPLIED", "INTERESTED"] satisfies OutreachOutcomeValue[],
  },
  {
    prospectId: "p2",
    qualificationStatus: "QUALIFIED",
    outreachStatus: "SENT",
    isSelectedTopN: true,
    auditReportId: "audit-2",
    leadId: null,
    hasPrimaryContact: true,
    hasDraft: true,
    hasApprovedDraft: true,
    hasSentMessage: true,
    outcomes: [] satisfies OutreachOutcomeValue[],
  },
  {
    prospectId: "p3",
    qualificationStatus: "QUALIFIED",
    outreachStatus: "CONVERTED",
    isSelectedTopN: true,
    auditReportId: "audit-3",
    leadId: "lead-3",
    hasPrimaryContact: true,
    hasDraft: true,
    hasApprovedDraft: true,
    hasSentMessage: true,
    outcomes: ["INTERESTED"] satisfies OutreachOutcomeValue[],
  },
];

const metrics = computeCampaignFunnelMetrics({
  discovered: 10,
  rows,
});

assert(metrics.counts.sent === 3, "sent prospects counted uniquely");
assert(metrics.counts.replied === 2, "replied prospects counted uniquely");
assert(metrics.counts.interested === 2, "interested prospects counted uniquely");
assert(metrics.counts.convertedToLead === 1, "converted prospects counted uniquely");
assert(metrics.rates.replyRate === 2 / 3, "reply rate uses sent denominator");
assert(
  metrics.rates.interestRate === 2 / 3,
  "interest rate uses sent denominator",
);
assert(
  metrics.rates.leadConversionRate === 1 / 3,
  "conversion rate uses sent denominator",
);

console.log("campaign-funnel.verify.ts passed");
