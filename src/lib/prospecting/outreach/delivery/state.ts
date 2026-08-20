import type { ProviderDeliveryStatusValue } from "./types";

const DELIVERY_STATUS_RANK: Record<ProviderDeliveryStatusValue, number> = {
  PENDING: 0,
  SENT: 1,
  DELAYED: 2,
  DELIVERED: 3,
  FAILED: 4,
  SUPPRESSED: 5,
  BOUNCED: 6,
  COMPLAINED: 7,
};

export interface DeliveryStateInput {
  channel: string;
  status: string;
  approvedAt: Date | null;
  sentAt: Date | null;
  submittedAt: Date | null;
  providerDeliveryStatus: ProviderDeliveryStatusValue | null;
  deliveredAt: Date | null;
  deliveryDelayedAt: Date | null;
  failedAt: Date | null;
  bouncedAt: Date | null;
  complainedAt: Date | null;
  providerSuppressedAt: Date | null;
}

export interface OutreachDeliveryTimelineStep {
  label: string;
  at: Date | null;
}

export function providerDeliveryStatusRank(
  status: ProviderDeliveryStatusValue | null | undefined,
): number {
  if (!status) {
    return DELIVERY_STATUS_RANK.PENDING;
  }

  return DELIVERY_STATUS_RANK[status];
}

export function mergeProviderDeliveryStatus(
  current: ProviderDeliveryStatusValue | null | undefined,
  next: ProviderDeliveryStatusValue,
): ProviderDeliveryStatusValue {
  if (!current) {
    return next;
  }

  return providerDeliveryStatusRank(next) >= providerDeliveryStatusRank(current)
    ? next
    : current;
}

export function getOutreachDeliveryState(
  input: DeliveryStateInput,
): ProviderDeliveryStatusValue | null {
  if (input.channel !== "EMAIL") {
    return null;
  }

  if (input.providerDeliveryStatus) {
    return input.providerDeliveryStatus;
  }

  if (input.status === "SENT" || input.status === "SENDING") {
    return "SENT";
  }

  return input.status === "APPROVED" ? "PENDING" : null;
}

export function providerDeliveryStatusLabel(
  status: ProviderDeliveryStatusValue | null,
): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "SENT":
      return "Sent";
    case "DELIVERED":
      return "Delivered";
    case "DELAYED":
      return "Delivery delayed";
    case "FAILED":
      return "Failed";
    case "BOUNCED":
      return "Bounced";
    case "COMPLAINED":
      return "Complained";
    case "SUPPRESSED":
      return "Suppressed";
    default:
      return "—";
  }
}

export function buildEmailDeliveryTimeline(
  input: DeliveryStateInput,
): OutreachDeliveryTimelineStep[] {
  if (input.channel !== "EMAIL") {
    return [];
  }

  const steps: OutreachDeliveryTimelineStep[] = [
    { label: "Approved", at: input.approvedAt },
    { label: "Sent", at: input.sentAt },
  ];

  const state = getOutreachDeliveryState(input);

  if (state === "DELIVERED" || input.deliveredAt) {
    steps.push({ label: "Delivered", at: input.deliveredAt });
  } else if (state === "DELAYED" || input.deliveryDelayedAt) {
    steps.push({ label: "Delivery delayed", at: input.deliveryDelayedAt });
  } else if (state === "FAILED" || input.failedAt) {
    steps.push({ label: "Failed", at: input.failedAt });
  } else if (state === "BOUNCED" || input.bouncedAt) {
    steps.push({ label: "Bounced", at: input.bouncedAt });
  } else if (state === "COMPLAINED" || input.complainedAt) {
    steps.push({ label: "Complained", at: input.complainedAt });
  } else if (state === "SUPPRESSED" || input.providerSuppressedAt) {
    steps.push({ label: "Suppressed", at: input.providerSuppressedAt });
  }

  return steps.filter((step) => step.at);
}
