import type { WebhookEventPayload } from "resend";

export type ResendEmailWebhookEventType =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.failed"
  | "email.bounced"
  | "email.complained"
  | "email.suppressed";

export const RESEND_EMAIL_WEBHOOK_EVENTS: ResendEmailWebhookEventType[] = [
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.failed",
  "email.bounced",
  "email.complained",
  "email.suppressed",
];

export type OutreachDeliveryEventTypeValue =
  | "SENT"
  | "DELIVERED"
  | "DELIVERY_DELAYED"
  | "FAILED"
  | "BOUNCED"
  | "COMPLAINED"
  | "SUPPRESSED";

export type ProviderDeliveryStatusValue =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "DELAYED"
  | "FAILED"
  | "BOUNCED"
  | "COMPLAINED"
  | "SUPPRESSED";

export interface ParsedResendEmailWebhookEvent {
  resendType: ResendEmailWebhookEventType;
  eventType: OutreachDeliveryEventTypeValue;
  providerMessageId: string;
  occurredAt: Date;
  providerEventId: string | null;
  safeMetadata: Record<string, string | boolean>;
}

export function isResendEmailWebhookEventType(
  value: string,
): value is ResendEmailWebhookEventType {
  return RESEND_EMAIL_WEBHOOK_EVENTS.includes(value as ResendEmailWebhookEventType);
}

export function mapResendEventType(
  type: ResendEmailWebhookEventType,
): OutreachDeliveryEventTypeValue {
  switch (type) {
    case "email.sent":
      return "SENT";
    case "email.delivered":
      return "DELIVERED";
    case "email.delivery_delayed":
      return "DELIVERY_DELAYED";
    case "email.failed":
      return "FAILED";
    case "email.bounced":
      return "BOUNCED";
    case "email.complained":
      return "COMPLAINED";
    case "email.suppressed":
      return "SUPPRESSED";
  }
}

export function mapEventTypeToProviderStatus(
  eventType: OutreachDeliveryEventTypeValue,
): ProviderDeliveryStatusValue {
  switch (eventType) {
    case "SENT":
      return "SENT";
    case "DELIVERED":
      return "DELIVERED";
    case "DELIVERY_DELAYED":
      return "DELAYED";
    case "FAILED":
      return "FAILED";
    case "BOUNCED":
      return "BOUNCED";
    case "COMPLAINED":
      return "COMPLAINED";
    case "SUPPRESSED":
      return "SUPPRESSED";
  }
}

export function parseResendEmailWebhookEvent(
  event: WebhookEventPayload,
): ParsedResendEmailWebhookEvent | null {
  if (!isResendEmailWebhookEventType(event.type)) {
    return null;
  }

  const emailId = "data" in event && event.data && "email_id" in event.data
    ? String(event.data.email_id)
    : "";

  if (!emailId) {
    return null;
  }

  const safeMetadata: Record<string, string | boolean> = {};

  if (event.type === "email.failed" && "failed" in event.data && event.data.failed) {
    safeMetadata.failureReason = String(event.data.failed.reason ?? "");
  }

  if (event.type === "email.bounced" && "bounce" in event.data && event.data.bounce) {
    safeMetadata.bounceType = String(event.data.bounce.type ?? "");
    safeMetadata.bounceSubType = String(event.data.bounce.subType ?? "");
  }

  if (
    event.type === "email.suppressed" &&
    "suppressed" in event.data &&
    event.data.suppressed
  ) {
    safeMetadata.suppressedType = String(event.data.suppressed.type ?? "");
  }

  return {
    resendType: event.type,
    eventType: mapResendEventType(event.type),
    providerMessageId: emailId,
    occurredAt: new Date(event.created_at),
    providerEventId: null,
    safeMetadata,
  };
}

export function buildDeliveryEventFingerprint(input: {
  providerEventId: string | null;
  providerMessageId: string;
  eventType: OutreachDeliveryEventTypeValue;
  occurredAt: Date;
}): string {
  if (input.providerEventId) {
    return `resend:${input.providerEventId}`;
  }

  return `resend:${input.providerMessageId}:${input.eventType}:${input.occurredAt.toISOString()}`;
}

export function outreachSendIdempotencyKey(messageId: string): string {
  return `prospecting-outreach/${messageId}`;
}
