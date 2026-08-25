/**
 * Canonical follow-up subject routes for the attention queue.
 * Audit/report context lives on Lead detail — never as the primary Open href.
 */

export function followUpLeadHref(leadId: string): string {
  return `/reports/leads/${leadId}`;
}

export function followUpProspectHref(input: {
  prospectId: string;
  campaignId: string | null | undefined;
}): string {
  if (input.campaignId) {
    return `/reports/prospecting/${input.campaignId}/prospects/${input.prospectId}`;
  }
  return `/reports/prospecting`;
}

export function followUpOpportunityHref(opportunityId: string): string {
  return `/reports/opportunities/${opportunityId}`;
}
