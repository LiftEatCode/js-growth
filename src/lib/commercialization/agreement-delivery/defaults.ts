import { getAbsoluteUrl } from "@/lib/seo";

export function recipientFirstName(recipientName: string): string {
  const trimmed = recipientName.trim();
  if (!trimmed) {
    return "there";
  }
  return trimmed.split(/\s+/)[0] ?? "there";
}

export function buildDefaultAgreementEmailSubject(businessName: string): string {
  return `Website Growth Implementation Agreement — ${businessName.trim()}`;
}

export function buildDefaultAgreementEmailBody(options: {
  recipientName: string;
  businessName: string;
  agreementLink: string;
}): string {
  const first = recipientFirstName(options.recipientName);
  return [
    `Hi ${first},`,
    "",
    `I've prepared the implementation agreement for ${options.businessName} based on the scope and investment we've reviewed.`,
    "",
    "You can review the agreement and acceptance terms using the secure link below.",
    "",
    options.agreementLink,
    "",
    "If you have any questions before accepting, reply to this email and I'll be happy to walk through them with you.",
    "",
    "Thanks,",
    "JS Solutions",
  ].join("\n");
}

export function buildAgreementShareUrl(shareToken: string): string {
  return getAbsoluteUrl(`/agreement/${encodeURIComponent(shareToken)}`);
}

export function injectAgreementLinkIntoMessage(
  message: string,
  agreementLink: string,
): string {
  if (message.includes(agreementLink)) {
    return message;
  }
  if (message.includes("{agreement link}")) {
    return message.replaceAll("{agreement link}", agreementLink);
  }
  return `${message.trim()}\n\n${agreementLink}`;
}
