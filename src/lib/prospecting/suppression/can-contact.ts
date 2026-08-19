export type ContactBlockReason =
  | "NO_EMAIL"
  | "HOSTNAME_SUPPRESSED"
  | "EMAIL_SUPPRESSED"
  | "EXISTING_LEAD"
  | "CUSTOMER"
  | "PROSPECT_CONVERTED"
  | "CONTACT_REJECTED"
  | "CONTACT_SUPPRESSED"
  | "CONTACT_STALE";

export interface CanContactProspectInput {
  hostname: string | null;
  email: string | null;
  suppressedHostnames: Set<string>;
  suppressedEmails: Set<string>;
  customerHostnames: Set<string>;
  existingLead: boolean;
  convertedProspect?: boolean;
  contactStatus?: string | null;
}

export interface CanContactProspectResult {
  allowed: boolean;
  reasons: ContactBlockReason[];
}

function normalizeSuppressionValue(value: string): string {
  return value.trim().toLowerCase();
}

export function canContactProspect(
  input: CanContactProspectInput,
): CanContactProspectResult {
  const reasons: ContactBlockReason[] = [];
  const email = input.email?.trim().toLowerCase() ?? "";
  const hostname = input.hostname?.trim().toLowerCase() ?? "";

  if (!email) {
    reasons.push("NO_EMAIL");
  }

  if (hostname && input.suppressedHostnames.has(hostname)) {
    reasons.push("HOSTNAME_SUPPRESSED");
  }

  if (email && input.suppressedEmails.has(email)) {
    reasons.push("EMAIL_SUPPRESSED");
  }

  if (input.existingLead) {
    reasons.push("EXISTING_LEAD");
  }

  if (input.convertedProspect) {
    reasons.push("PROSPECT_CONVERTED");
  }

  if (hostname && input.customerHostnames.has(hostname)) {
    reasons.push("CUSTOMER");
  }

  if (input.contactStatus === "REJECTED") {
    reasons.push("CONTACT_REJECTED");
  }

  if (input.contactStatus === "SUPPRESSED") {
    reasons.push("CONTACT_SUPPRESSED");
  }

  if (input.contactStatus === "STALE") {
    reasons.push("CONTACT_STALE");
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

export function contactBlockLabel(reason: ContactBlockReason): string {
  switch (reason) {
    case "NO_EMAIL":
      return "No public email is available.";
    case "HOSTNAME_SUPPRESSED":
      return "This website hostname is suppressed.";
    case "EMAIL_SUPPRESSED":
      return "This email address is suppressed.";
    case "EXISTING_LEAD":
      return "An inbound lead already uses this website.";
    case "PROSPECT_CONVERTED":
      return "This prospect was converted to a lead.";
    case "CUSTOMER":
      return "This business is marked as a customer.";
    case "CONTACT_REJECTED":
      return "This contact was rejected.";
    case "CONTACT_SUPPRESSED":
      return "This contact is suppressed.";
    case "CONTACT_STALE":
      return "This contact is stale and should be rechecked.";
  }
}

export { normalizeSuppressionValue };
