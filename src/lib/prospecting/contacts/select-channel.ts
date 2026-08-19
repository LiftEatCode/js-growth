import type { ProspectContact } from "@/generated/prisma/client";

import { canContactProspect } from "@/lib/prospecting/suppression/can-contact";

export type ProspectOutreachChannel =
  | {
      type: "EMAIL";
      contactId: string;
      email: string;
    }
  | {
      type: "CONTACT_FORM";
      contactFormId: string;
      url: string;
    }
  | {
      type: "NONE";
      reason: string;
    };

export interface SelectProspectOutreachChannelInput {
  hostname: string | null;
  leadId: string | null;
  outreachStatus: string;
  contacts: Array<
    Pick<
      ProspectContact,
      "id" | "email" | "normalizedEmail" | "status" | "isPrimary"
    >
  >;
  contactForms: Array<{
    id: string;
    url: string;
    normalizedUrl: string;
    status: string;
    isPrimary: boolean;
  }>;
  suppressedHostnames: Set<string>;
  suppressedEmails: Set<string>;
  customerHostnames: Set<string>;
  existingLead: boolean;
}

function isUsableContactStatus(status: string): boolean {
  return status === "DISCOVERED" || status === "SELECTED";
}

function isHostnameBlocked(input: SelectProspectOutreachChannelInput): string | null {
  if (input.leadId || input.outreachStatus === "CONVERTED") {
    return "PROSPECT_CONVERTED";
  }

  if (input.existingLead) {
    return "EXISTING_LEAD";
  }

  if (
    input.hostname &&
    input.customerHostnames.has(input.hostname.trim().toLowerCase())
  ) {
    return "CUSTOMER";
  }

  if (
    input.hostname &&
    input.suppressedHostnames.has(input.hostname.trim().toLowerCase())
  ) {
    return "HOSTNAME_SUPPRESSED";
  }

  if (input.outreachStatus === "SUPPRESSED") {
    return "PROSPECT_SUPPRESSED";
  }

  return null;
}

export function selectProspectOutreachChannel(
  input: SelectProspectOutreachChannelInput,
): ProspectOutreachChannel {
  const hostnameBlock = isHostnameBlocked(input);

  if (hostnameBlock) {
    return {
      type: "NONE",
      reason: hostnameBlock,
    };
  }

  const emailCandidates = input.contacts.filter(
    (contact) => isUsableContactStatus(contact.status) && contact.isPrimary,
  );
  const email =
    emailCandidates[0] ??
    input.contacts.find((contact) => isUsableContactStatus(contact.status));

  if (email) {
    const decision = canContactProspect({
      hostname: input.hostname,
      email: email.normalizedEmail,
      suppressedHostnames: input.suppressedHostnames,
      suppressedEmails: input.suppressedEmails,
      customerHostnames: input.customerHostnames,
      existingLead: input.existingLead,
      convertedProspect: Boolean(input.leadId),
      contactStatus: email.status,
    });

    if (decision.allowed) {
      return {
        type: "EMAIL",
        contactId: email.id,
        email: email.email,
      };
    }
  }

  const formCandidates = input.contactForms.filter(
    (form) => isUsableContactStatus(form.status) && form.isPrimary,
  );
  const form =
    formCandidates[0] ??
    input.contactForms.find((row) => isUsableContactStatus(row.status));

  if (form) {
    return {
      type: "CONTACT_FORM",
      contactFormId: form.id,
      url: form.url,
    };
  }

  return {
    type: "NONE",
    reason: email ? "EMAIL_BLOCKED" : "NO_OUTREACH_CHANNEL",
  };
}

export function isProspectContactable(
  input: SelectProspectOutreachChannelInput,
): boolean {
  return selectProspectOutreachChannel(input).type !== "NONE";
}
