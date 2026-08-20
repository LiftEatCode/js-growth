import type { Prisma, SuppressionReason } from "@/generated/prisma/client";

import {
  buildSuppressionTargets,
  type SuppressionTarget,
} from "@/lib/prospecting/suppression/apply";

const SUPPRESSION_REASON_RANK: Record<SuppressionReason, number> = {
  COMPLAINT: 7,
  OPTED_OUT: 6,
  CONVERTED: 5,
  CUSTOMER: 4,
  BOUNCED: 3,
  REPLIED_NOT_INTERESTED: 2,
  MANUAL: 1,
  SENT: 0,
};

export function suppressionReasonRank(reason: SuppressionReason): number {
  return SUPPRESSION_REASON_RANK[reason];
}

export function shouldReplaceSuppressionReason(
  existing: SuppressionReason | null | undefined,
  next: SuppressionReason,
): boolean {
  if (!existing) {
    return true;
  }

  return suppressionReasonRank(next) > suppressionReasonRank(existing);
}

export async function persistSuppressionTargets(
  transaction: Prisma.TransactionClient,
  targets: SuppressionTarget[],
): Promise<void> {
  for (const target of targets) {
    const existing = await transaction.suppressionEntry.findFirst({
      where: {
        type: target.type,
        value: target.value,
      },
      select: {
        id: true,
        reason: true,
      },
    });

    if (!existing) {
      await transaction.suppressionEntry.create({ data: target });
      continue;
    }

    if (shouldReplaceSuppressionReason(existing.reason, target.reason)) {
      await transaction.suppressionEntry.update({
        where: { id: existing.id },
        data: { reason: target.reason },
      });
    }
  }
}

export function suppressionReasonForComplaint(): SuppressionReason {
  return "COMPLAINT";
}

export function suppressionReasonForProviderSuppressed(): SuppressionReason {
  return "BOUNCED";
}

export { buildSuppressionTargets };
