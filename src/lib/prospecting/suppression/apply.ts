import type { SuppressionReason, SuppressionType } from "@/generated/prisma/client";

import { normalizeSuppressionValue } from "@/lib/prospecting/suppression/can-contact";

export interface SuppressionTarget {
  type: SuppressionType;
  value: string;
  reason: SuppressionReason;
}

export interface ApplySuppressionInput {
  hostname: string | null;
  email: string | null;
  reason: SuppressionReason;
  suppressHostname: boolean;
  suppressEmail: boolean;
}

export function buildSuppressionTargets(
  input: ApplySuppressionInput,
): SuppressionTarget[] {
  const targets: SuppressionTarget[] = [];

  if (input.suppressHostname && input.hostname) {
    targets.push({
      type: "HOSTNAME",
      value: normalizeSuppressionValue(input.hostname),
      reason: input.reason,
    });
  }

  if (input.suppressEmail && input.email) {
    targets.push({
      type: "EMAIL",
      value: normalizeSuppressionValue(input.email),
      reason: input.reason,
    });
  }

  return targets;
}

export function suppressionReasonForNotInterested(input: {
  explicitOptOut: boolean;
  suppressFutureOutreach: boolean;
}): SuppressionReason | null {
  if (input.explicitOptOut) {
    return "OPTED_OUT";
  }

  if (input.suppressFutureOutreach) {
    return "REPLIED_NOT_INTERESTED";
  }

  return null;
}

export function suppressionReasonForBounce(): SuppressionReason {
  return "BOUNCED";
}

export function suppressionReasonForConversion(): SuppressionReason {
  return "CONVERTED";
}
