import type { Campaign, OutreachMessage, Prospect, ProspectContactForm } from "@/generated/prisma/client";

export type SubmitBlockReason =
  | "NOT_APPROVED"
  | "MISSING_APPROVAL_METADATA"
  | "WRONG_CHANNEL"
  | "CAMPAIGN_NOT_ACTIVE"
  | "PROSPECT_NOT_QUALIFIED"
  | "PROSPECT_SUPPRESSED"
  | "PROSPECT_NOT_ELIGIBLE"
  | "FORM_NOT_SELECTED"
  | "DUPLICATE_SUBMITTED"
  | "HOSTNAME_SUPPRESSED"
  | "EXISTING_LEAD"
  | "CUSTOMER"
  | "PROSPECT_CONVERTED"
  | "FORM_REJECTED"
  | "FORM_SUPPRESSED"
  | "FORM_STALE";

export interface CanSubmitContactFormMessageInput {
  message: Pick<
    OutreachMessage,
    | "status"
    | "channel"
    | "approvedAt"
    | "approvedByEmail"
    | "bodyText"
    | "contactFormId"
    | "prospectId"
    | "campaignId"
  >;
  prospect: Pick<
    Prospect,
    "qualificationStatus" | "outreachStatus" | "hostname" | "leadId"
  >;
  contactForm: Pick<
    ProspectContactForm,
    "id" | "isPrimary" | "status" | "url" | "prospectId"
  >;
  campaign: Pick<Campaign, "status">;

  suppressedHostnames: Set<string>;
  customerHostnames: Set<string>;
  existingLead: boolean;

  priorSubmittedExists: boolean;
}

export function canSubmitContactFormMessage(
  input: CanSubmitContactFormMessageInput,
): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (input.message.channel !== "CONTACT_FORM") {
    reasons.push("WRONG_CHANNEL");
  }

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

  if (
    input.prospect.outreachStatus === "NOT_INTERESTED" ||
    input.prospect.outreachStatus === "CONVERTED" ||
    input.prospect.leadId
  ) {
    reasons.push("PROSPECT_NOT_ELIGIBLE");
  }

  if (!input.contactForm.isPrimary) {
    reasons.push("FORM_NOT_SELECTED");
  }

  const hostname = input.prospect.hostname?.trim().toLowerCase() ?? "";

  if (hostname && input.suppressedHostnames.has(hostname)) {
    reasons.push("HOSTNAME_SUPPRESSED");
  }

  if (input.existingLead || input.prospect.leadId) {
    reasons.push("EXISTING_LEAD");
  }

  if (hostname && input.customerHostnames.has(hostname)) {
    reasons.push("CUSTOMER");
  }

  if (input.prospect.leadId) {
    reasons.push("PROSPECT_CONVERTED");
  }

  if (input.contactForm.status === "REJECTED") {
    reasons.push("FORM_REJECTED");
  }

  if (input.contactForm.status === "SUPPRESSED") {
    reasons.push("FORM_SUPPRESSED");
  }

  if (input.contactForm.status === "STALE") {
    reasons.push("FORM_STALE");
  }

  if (!input.message.bodyText.trim()) {
    reasons.push("NOT_APPROVED");
  }

  if (input.priorSubmittedExists) {
    reasons.push("DUPLICATE_SUBMITTED");
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}
