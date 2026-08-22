export const COMMERCIAL_AGREEMENT_VERSION = 1;
export const COMMERCIAL_AGREEMENT_PRESENTATION_VERSION = 1;
export const COMMERCIAL_AGREEMENT_TERMS_VERSION = 1;

export const COMMERCIAL_AGREEMENT_STATUSES = [
  "DRAFT",
  "REVIEWED",
  "APPROVED",
  "ACCEPTED",
  "SUPERSEDED",
  "VOIDED",
] as const;

export type CommercialAgreementStatus =
  (typeof COMMERCIAL_AGREEMENT_STATUSES)[number];

export const AGREEMENT_PAYMENT_TERM_TYPES = [
  "FULL_UPFRONT",
  "DEPOSIT_AND_BALANCE",
  "CUSTOM",
] as const;

export type AgreementPaymentTermType =
  (typeof AGREEMENT_PAYMENT_TERM_TYPES)[number];

export const DEFAULT_DEPOSIT_PERCENT = 50;

export const MAX_AGREEMENT_TITLE_CHARS = 200;
export const MAX_AGREEMENT_OVERVIEW_CHARS = 2_000;
export const MAX_AGREEMENT_TERM_CHARS = 2_000;
export const MAX_AGREEMENT_RESPONSIBILITY_ITEMS = 12;
export const MAX_AGREEMENT_RESPONSIBILITY_ITEM_CHARS = 500;
export const MAX_AGREEMENT_CUSTOM_PAYMENT_CHARS = 2_000;
export const MAX_AGREEMENT_OVERRIDE_REASON_CHARS = 500;
export const MAX_SIGNER_NAME_CHARS = 200;
export const MAX_SIGNER_EMAIL_CHARS = 320;
export const MAX_SIGNER_TITLE_CHARS = 200;

export function commercialAgreementStatusLabel(
  status: CommercialAgreementStatus,
): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "REVIEWED":
      return "Reviewed";
    case "APPROVED":
      return "Approved";
    case "ACCEPTED":
      return "Accepted";
    case "SUPERSEDED":
      return "Superseded";
    case "VOIDED":
      return "Voided";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function agreementPaymentTermTypeLabel(
  type: AgreementPaymentTermType,
): string {
  switch (type) {
    case "FULL_UPFRONT":
      return "Full upfront";
    case "DEPOSIT_AND_BALANCE":
      return "Deposit and balance";
    case "CUSTOM":
      return "Custom";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function isValidSignerEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeSignerEmail(email: string): string {
  return email.trim().toLowerCase();
}
