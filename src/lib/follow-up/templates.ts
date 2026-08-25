/**
 * Human-controlled follow-up message templates.
 * Starting points only — never auto-send. No fabricated tracking claims.
 */

export const FOLLOW_UP_TEMPLATE_CATEGORIES = [
  "INITIAL_INBOUND_RESPONSE",
  "AUDIT_FOLLOW_UP",
  "CONTACT_FOLLOW_UP",
  "OUTBOUND_PROSPECT_FOLLOW_UP",
  "PROPOSAL_FOLLOW_UP",
  "AGREEMENT_FOLLOW_UP",
  "NURTURE_CHECK_IN",
] as const;

export type FollowUpTemplateCategory =
  (typeof FOLLOW_UP_TEMPLATE_CATEGORIES)[number];

export type FollowUpTemplate = {
  id: string;
  category: FollowUpTemplateCategory;
  label: string;
  subject: string;
  body: string;
};

export const FOLLOW_UP_TEMPLATES: FollowUpTemplate[] = [
  {
    id: "inbound_initial_v1",
    category: "INITIAL_INBOUND_RESPONSE",
    label: "Initial inbound response",
    subject: "Thanks for reaching out — JS Solutions",
    body: `Hi {{firstName}},

Thanks for contacting JS Solutions. I reviewed your note and would like to learn a bit more about what you're trying to improve.

If helpful, we can schedule a short call this week.

Best,
{{operatorName}}
JS Solutions`,
  },
  {
    id: "audit_followup_v1",
    category: "AUDIT_FOLLOW_UP",
    label: "Website audit follow-up",
    subject: "Quick follow-up on your Website Growth Audit",
    body: `Hi {{firstName}},

I wanted to follow up on the Website Growth Audit for {{businessName}}. Happy to walk through the highest-priority findings and what a practical next step could look like.

Would a brief call work this week?

Best,
{{operatorName}}
JS Solutions`,
  },
  {
    id: "contact_followup_v1",
    category: "CONTACT_FOLLOW_UP",
    label: "Contact form follow-up",
    subject: "Following up on your inquiry",
    body: `Hi {{firstName}},

Following up on the message you sent through our contact form. I want to make sure we understand your goals before recommending next steps.

When is a good time to connect?

Best,
{{operatorName}}
JS Solutions`,
  },
  {
    id: "outbound_prospect_v1",
    category: "OUTBOUND_PROSPECT_FOLLOW_UP",
    label: "Outbound prospect follow-up",
    subject: "Quick question about {{businessName}}",
    body: `Hi {{firstName}},

I am following up on my earlier note about {{businessName}}. If website clarity, local visibility, or lead follow-up is on your plate, I am happy to share a short observation.

No pressure either way.

Best,
{{operatorName}}
JS Solutions`,
  },
  {
    id: "proposal_followup_v1",
    category: "PROPOSAL_FOLLOW_UP",
    label: "Proposal follow-up",
    subject: "Checking in on the proposal",
    body: `Hi {{firstName}},

Checking in on the proposal we shared. Happy to answer questions or adjust scope if priorities shifted.

Best,
{{operatorName}}
JS Solutions`,
  },
  {
    id: "agreement_followup_v1",
    category: "AGREEMENT_FOLLOW_UP",
    label: "Agreement follow-up",
    subject: "Agreement follow-up",
    body: `Hi {{firstName}},

Following up on the agreement. Let me know if you need anything clarified before moving forward.

Best,
{{operatorName}}
JS Solutions`,
  },
  {
    id: "nurture_checkin_v1",
    category: "NURTURE_CHECK_IN",
    label: "Nurture check-in",
    subject: "Checking back in",
    body: `Hi {{firstName}},

Checking back in to see whether website growth priorities for {{businessName}} have changed. Happy to reconnect when timing is better.

Best,
{{operatorName}}
JS Solutions`,
  },
];

export function getFollowUpTemplate(id: string): FollowUpTemplate | undefined {
  return FOLLOW_UP_TEMPLATES.find((t) => t.id === id);
}

export function listFollowUpTemplates(
  category?: FollowUpTemplateCategory,
): FollowUpTemplate[] {
  if (!category) {
    return [...FOLLOW_UP_TEMPLATES];
  }
  return FOLLOW_UP_TEMPLATES.filter((t) => t.category === category);
}

export function fillFollowUpTemplate(
  template: FollowUpTemplate,
  vars: Record<string, string>,
): { subject: string; body: string } {
  const replace = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
  return {
    subject: replace(template.subject),
    body: replace(template.body),
  };
}
