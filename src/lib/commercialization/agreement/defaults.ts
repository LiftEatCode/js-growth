export const DEFAULT_AGREEMENT_TITLE = "Website Growth Implementation Agreement";

export const DEFAULT_ENGAGEMENT_OVERVIEW_TEMPLATE =
  "This Agreement defines the website improvement services JS Solutions will provide to {businessName} based on the approved implementation scope and investment.";

export const DEFAULT_CLIENT_RESPONSIBILITIES = [
  "Provide reasonable access to required website, hosting, and platform accounts when requested.",
  "Provide accurate business information, content, and approvals when needed for implementation.",
  "Review requested materials and provide feedback within a reasonable timeframe.",
  "Maintain necessary third-party accounts and subscriptions unless explicitly included in this Agreement.",
] as const;

export const DEFAULT_JS_RESPONSIBILITIES = [
  "Perform the included services with reasonable professional care.",
  "Communicate material implementation issues discovered during the work.",
  "Avoid material out-of-scope work without client approval.",
  "Protect provided credentials and access according to normal operational security practices.",
] as const;

export const DEFAULT_TIMELINE_TERMS =
  "Implementation scheduling and milestones will be confirmed after the required agreement acceptance and initial payment requirements are completed.";

export const DEFAULT_CHANGE_REQUEST_TERMS =
  "Work requested outside the included services may require a revised scope and additional approval before implementation.";

export const DEFAULT_THIRD_PARTY_COST_TERMS =
  "Third-party software, hosting, subscriptions, advertising spend, or other external service fees are not included unless explicitly stated in this Agreement.";

export const DEFAULT_RESULTS_DISCLAIMER =
  "JS Solutions does not guarantee specific search rankings, website traffic, leads, revenue, or other business outcomes.";

export const DEFAULT_ACCEPTANCE_LANGUAGE =
  "I have reviewed this Agreement and agree to the scope, investment, payment terms, and conditions shown above.";

export function buildEngagementOverview(businessName: string): string {
  return DEFAULT_ENGAGEMENT_OVERVIEW_TEMPLATE.replace(
    "{businessName}",
    businessName.trim(),
  );
}

export function buildProposalReference(options: {
  proposalRevision: number;
  proposalVersion: number;
  presentationVersion: number;
}): string {
  return `Proposal revision ${options.proposalRevision} (v${options.proposalVersion}.${options.presentationVersion})`;
}
