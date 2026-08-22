import { getAbsoluteUrl } from "@/lib/seo";

export function recipientFirstName(recipientName: string): string {
  const trimmed = recipientName.trim();
  if (!trimmed) {
    return "there";
  }
  return trimmed.split(/\s+/)[0] ?? "there";
}

export function buildDefaultProposalEmailSubject(businessName: string): string {
  return `Website Growth Implementation Proposal — ${businessName.trim()}`;
}

export function buildDefaultProposalEmailBody(options: {
  recipientName: string;
  businessName: string;
  proposalLink: string;
}): string {
  const first = recipientFirstName(options.recipientName);
  return [
    `Hi ${first},`,
    "",
    `I've put together the Website Growth Implementation Proposal we discussed for ${options.businessName}.`,
    "",
    "It outlines the recommended website improvements, implementation scope, and investment based on the analysis we've completed.",
    "",
    "You can review the proposal using the link below.",
    "",
    options.proposalLink,
    "",
    "If you'd like to walk through the recommendations together, reply to this email and we'll find a time that works.",
    "",
    "Thanks,",
    "JS Solutions",
  ].join("\n");
}

export function buildProposalShareUrl(shareToken: string): string {
  return getAbsoluteUrl(`/proposal/${encodeURIComponent(shareToken)}`);
}

export function injectProposalLinkIntoMessage(
  message: string,
  proposalLink: string,
): string {
  if (message.includes(proposalLink)) {
    return message;
  }
  if (message.includes("{proposal link}")) {
    return message.replaceAll("{proposal link}", proposalLink);
  }
  return `${message.trim()}\n\n${proposalLink}`;
}
