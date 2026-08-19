import type { Prospect, ProspectContact, Campaign, OutreachMessage } from "@/generated/prisma/client";

import { canContactProspect } from "@/lib/prospecting/suppression/can-contact";
import type { ContactBlockReason } from "@/lib/prospecting/suppression/can-contact";

export type SendBlockReason =
  | "NOT_APPROVED"
  | "MISSING_APPROVAL_METADATA"
  | "CAMPAIGN_NOT_ACTIVE"
  | "PROSPECT_NOT_QUALIFIED"
  | "PROSPECT_SUPPRESSED"
  | "CONTACT_NOT_SELECTED"
  | "CONTACT_EMAIL_MISMATCH"
  | "DUPLICATE_SENT"
  | "DAILY_SEND_CAP_REACHED"
  | ContactBlockReason[];

export interface CanSendOutreachMessageInput {
  message: Pick<
    OutreachMessage,
    | "status"
    | "approvedAt"
    | "approvedByEmail"
    | "toEmail"
    | "subject"
    | "bodyText"
    | "contactId"
    | "prospectId"
    | "campaignId"
  >;
  prospect: Pick<Prospect, "qualificationStatus" | "outreachStatus" | "hostname">;
  contact: Pick<ProspectContact, "id" | "isPrimary" | "status" | "email" | "normalizedEmail" | "prospectId">;
  campaign: Pick<Campaign, "status">;

  suppressedHostnames: Set<string>;
  suppressedEmails: Set<string>;
  customerHostnames: Set<string>;
  existingLead: boolean;

  priorSentExists: boolean;
  sentTodayCount: number;

  maxEmailsPerDay: number;
}

export function canSendOutreachMessage(
  input: CanSendOutreachMessageInput,
): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (input.message.status !== "APPROVED") {
    reasons.push("NOT_APPROVED");
  }

  if (!input.message.approvedAt || !input.message.approvedByEmail) {
    reasons.push("MISSING_APPROVAL_METADATA");
  }

  if (input.campaign.status !== "ACTIVE") {
    reasons.push("CAMPAIGN_NOT_ACTIVE");
  }

  if (input.prospect.qualificationStatus !== "QUALIFIED") {
    reasons.push("PROSPECT_NOT_QUALIFIED");
  }

  if (input.prospect.outreachStatus === "SUPPRESSED") {
    reasons.push("PROSPECT_SUPPRESSED");
  }

  if (!input.contact.isPrimary) {
    reasons.push("CONTACT_NOT_SELECTED");
  }

  if (
    input.message.toEmail.trim().toLowerCase() !==
    input.contact.email.trim().toLowerCase()
  ) {
    reasons.push("CONTACT_EMAIL_MISMATCH");
  }

  const contactStatus = input.contact.status;
  const contactResult = canContactProspect({
    hostname: input.prospect.hostname,
    email: input.contact.normalizedEmail ?? input.contact.email,
    suppressedHostnames: input.suppressedHostnames,
    suppressedEmails: input.suppressedEmails,
    customerHostnames: input.customerHostnames,
    existingLead: input.existingLead,
    contactStatus,
  });

  if (!contactResult.allowed) {
    // canContactProspect already encodes safe reason codes.
    reasons.push(...contactResult.reasons);
  }

  if (input.priorSentExists) {
    reasons.push("DUPLICATE_SENT");
  }

  if (input.sentTodayCount >= input.maxEmailsPerDay) {
    reasons.push("DAILY_SEND_CAP_REACHED");
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

