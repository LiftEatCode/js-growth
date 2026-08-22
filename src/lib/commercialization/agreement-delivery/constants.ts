export const AGREEMENT_DELIVERY_VERSION = 1;

export const AGREEMENT_DELIVERY_STATUSES = [
  "DRAFT",
  "READY",
  "SENDING",
  "SENT",
  "FAILED",
] as const;

export type AgreementDeliveryStatus =
  (typeof AGREEMENT_DELIVERY_STATUSES)[number];

export const MAX_RECIPIENT_NAME_CHARS = 200;
export const MAX_RECIPIENT_EMAIL_CHARS = 320;
export const MAX_DELIVERY_SUBJECT_CHARS = 200;
export const MAX_DELIVERY_MESSAGE_CHARS = 8_000;

export const AGREEMENT_SHARE_TOKEN_BYTES = 32;

export function agreementDeliveryStatusLabel(
  status: AgreementDeliveryStatus,
): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "READY":
      return "Ready";
    case "SENDING":
      return "Sending";
    case "SENT":
      return "Sent";
    case "FAILED":
      return "Failed";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function isValidRecipientEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeRecipientEmail(email: string): string {
  return email.trim().toLowerCase();
}
