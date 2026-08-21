import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import {
  MAX_OVERRIDE_REASON_CHARS,
  MAX_PRICING_NOTES_CHARS,
  MAX_QUANTITY,
} from "./constants";
import {
  computePricingTotals,
  lineTotalCents,
} from "./totals";
import type { BuiltPricingLineItem } from "./types";

export type PricingMutationResult =
  | { ok: true; pricingId: string }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "IMMUTABLE"
        | "INVALID_INPUT"
        | "CUSTOM_PRICE_REQUIRED"
        | "OVERRIDE_REASON_REQUIRED";
      message: string;
    };

async function requireEditablePricing(pricingId: string) {
  const pricing = await prisma.commercialPricing.findUnique({
    where: { id: pricingId },
    include: { lineItems: { orderBy: { sortOrder: "asc" } } },
  });
  if (!pricing) {
    return {
      ok: false as const,
      code: "NOT_FOUND" as const,
      message: "Pricing not found.",
    };
  }
  if (pricing.status === "APPROVED" || pricing.status === "SUPERSEDED") {
    return {
      ok: false as const,
      code: "IMMUTABLE" as const,
      message:
        "Approved and superseded Pricing is immutable. Use Revise to create a new draft.",
    };
  }
  return { ok: true as const, pricing };
}

function toBuiltLines(
  rows: Array<{
    workUnitKey: string;
    title: string;
    workType: string;
    effortBand: string;
    quantity: number;
    recommendedUnitPriceCents: number | null;
    recommendedLineTotalCents: number | null;
    finalUnitPriceCents: number | null;
    finalLineTotalCents: number | null;
    isOptional: boolean;
    isIncluded: boolean;
    isCustom: boolean;
    isOverridden: boolean;
    overrideReason: string | null;
    sourceDeliverableIdsJson: unknown;
    sourceSectionTitlesJson: unknown;
    sortOrder: number;
  }>,
): BuiltPricingLineItem[] {
  return rows.map((row) => ({
    workUnitKey: row.workUnitKey,
    title: row.title,
    workType: row.workType as BuiltPricingLineItem["workType"],
    effortBand: row.effortBand as BuiltPricingLineItem["effortBand"],
    quantity: row.quantity,
    recommendedUnitPriceCents: row.recommendedUnitPriceCents,
    recommendedLineTotalCents: row.recommendedLineTotalCents,
    finalUnitPriceCents: row.finalUnitPriceCents,
    finalLineTotalCents: row.finalLineTotalCents,
    isOptional: row.isOptional,
    isIncluded: row.isIncluded,
    isCustom: row.isCustom,
    isOverridden: row.isOverridden,
    overrideReason: row.overrideReason,
    sourceDeliverableIds: Array.isArray(row.sourceDeliverableIdsJson)
      ? (row.sourceDeliverableIdsJson as string[])
      : [],
    sourceSectionTitles: Array.isArray(row.sourceSectionTitlesJson)
      ? (row.sourceSectionTitlesJson as string[])
      : [],
    sortOrder: row.sortOrder,
  }));
}

async function recalculateAndPersist(
  pricingId: string,
  lines: BuiltPricingLineItem[],
  extra?: { notes?: string | null },
) {
  const totals = computePricingTotals(lines);
  await prisma.commercialPricing.update({
    where: { id: pricingId },
    data: {
      recommendedIncludedCents: totals.recommendedIncludedCents,
      recommendedOptionalCents: totals.recommendedOptionalCents,
      recommendedTotalCents: totals.recommendedTotalCents,
      finalIncludedCents: totals.finalIncludedCents,
      finalOptionalCents: totals.finalOptionalCents,
      finalTotalCents: totals.finalTotalCents,
      minimumApplied: totals.minimumApplied,
      assessmentOnly: totals.assessmentOnly,
      ...(extra?.notes !== undefined ? { notes: extra.notes } : {}),
    },
  });
}

export async function updatePricingNotes(options: {
  pricingId: string;
  notes: string | null;
  actorEmail: string;
}): Promise<PricingMutationResult> {
  const gate = await requireEditablePricing(options.pricingId);
  if (!gate.ok) {
    return gate;
  }

  const notes =
    options.notes?.trim().slice(0, MAX_PRICING_NOTES_CHARS) || null;

  await prisma.commercialPricing.update({
    where: { id: options.pricingId },
    data: { notes },
  });

  return { ok: true, pricingId: options.pricingId };
}

export async function updatePricingLineItem(options: {
  pricingId: string;
  lineItemId: string;
  isIncluded?: boolean;
  isOptional?: boolean;
  quantity?: number;
  finalUnitPriceCents?: number | null;
  overrideReason?: string | null;
  actorEmail: string;
}): Promise<PricingMutationResult> {
  const gate = await requireEditablePricing(options.pricingId);
  if (!gate.ok) {
    return gate;
  }

  const line = gate.pricing.lineItems.find((l) => l.id === options.lineItemId);
  if (!line) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Line item not found.",
    };
  }

  let quantity = line.quantity;
  if (options.quantity !== undefined) {
    if (
      !Number.isInteger(options.quantity) ||
      options.quantity < 1 ||
      options.quantity > MAX_QUANTITY
    ) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: `Quantity must be an integer from 1 to ${MAX_QUANTITY}.`,
      };
    }
    quantity = options.quantity;
  }

  let finalUnitPriceCents = line.finalUnitPriceCents;
  let isOverridden = line.isOverridden;
  let overrideReason = line.overrideReason;

  if (options.finalUnitPriceCents !== undefined) {
    const next = options.finalUnitPriceCents;
    if (next != null) {
      if (!Number.isInteger(next) || next < 0) {
        return {
          ok: false,
          code: "INVALID_INPUT",
          message: "Price must be a non-negative integer (cents).",
        };
      }
    }

    const recommended = line.recommendedUnitPriceCents;
    const changingFromRecommended =
      recommended != null && next != null && next !== recommended;
    const clearingCustom = line.isCustom && next == null;
    const settingCustom = line.isCustom && next != null;

    if (changingFromRecommended || (settingCustom && line.isOverridden)) {
      const reason = options.overrideReason?.trim() ?? overrideReason?.trim() ?? "";
      if (!reason && changingFromRecommended) {
        return {
          ok: false,
          code: "OVERRIDE_REASON_REQUIRED",
          message: "Manual price overrides require a reason.",
        };
      }
      if (changingFromRecommended) {
        isOverridden = true;
        overrideReason = reason.slice(0, MAX_OVERRIDE_REASON_CHARS);
      }
    }

    if (settingCustom) {
      // Custom price entry is required pricing, not necessarily an "override"
      isOverridden = recommended != null && next !== recommended;
      if (isOverridden) {
        const reason =
          options.overrideReason?.trim() ?? overrideReason?.trim() ?? "";
        if (!reason) {
          return {
            ok: false,
            code: "OVERRIDE_REASON_REQUIRED",
            message: "Manual price overrides require a reason.",
          };
        }
        overrideReason = reason.slice(0, MAX_OVERRIDE_REASON_CHARS);
      } else {
        overrideReason = options.overrideReason?.trim().slice(0, MAX_OVERRIDE_REASON_CHARS) || null;
      }
    }

    if (clearingCustom) {
      finalUnitPriceCents = null;
      isOverridden = false;
      overrideReason = null;
    } else {
      finalUnitPriceCents = next;
    }
  } else if (options.overrideReason !== undefined) {
    overrideReason =
      options.overrideReason?.trim().slice(0, MAX_OVERRIDE_REASON_CHARS) || null;
  }

  // Quantity change alone: keep override semantics; recompute final line total
  const finalLineTotalCents = lineTotalCents(finalUnitPriceCents, quantity);
  // Recommended line total scales with quantity but unit recommendation stays
  const recommendedLineTotalCents = lineTotalCents(
    line.recommendedUnitPriceCents,
    quantity,
  );

  await prisma.commercialPricingLineItem.update({
    where: { id: options.lineItemId },
    data: {
      ...(options.isIncluded !== undefined
        ? { isIncluded: options.isIncluded }
        : {}),
      ...(options.isOptional !== undefined
        ? { isOptional: options.isOptional }
        : {}),
      quantity,
      recommendedLineTotalCents,
      finalUnitPriceCents,
      finalLineTotalCents,
      isOverridden,
      overrideReason,
    },
  });

  const refreshed = await prisma.commercialPricingLineItem.findMany({
    where: { pricingId: options.pricingId },
    orderBy: { sortOrder: "asc" },
  });
  await recalculateAndPersist(options.pricingId, toBuiltLines(refreshed));

  return { ok: true, pricingId: options.pricingId };
}

export async function addCustomPricingLineItem(options: {
  pricingId: string;
  title: string;
  unitPriceCents: number | null;
  quantity?: number;
  isOptional?: boolean;
  actorEmail: string;
}): Promise<PricingMutationResult> {
  const gate = await requireEditablePricing(options.pricingId);
  if (!gate.ok) {
    return gate;
  }

  const title = options.title.trim().slice(0, 240);
  if (!title) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Custom work title is required.",
    };
  }

  const quantity = options.quantity ?? 1;
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_QUANTITY
  ) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: `Quantity must be an integer from 1 to ${MAX_QUANTITY}.`,
    };
  }

  if (
    options.unitPriceCents != null &&
    (!Number.isInteger(options.unitPriceCents) || options.unitPriceCents < 0)
  ) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Price must be a non-negative integer (cents).",
    };
  }

  const sortOrder =
    gate.pricing.lineItems.reduce(
      (max, row) => Math.max(max, row.sortOrder),
      -1,
    ) + 1;

  const key = `custom:${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}-${sortOrder}`;

  await prisma.commercialPricingLineItem.create({
    data: {
      pricingId: options.pricingId,
      workUnitKey: key,
      title,
      workType: "CUSTOM",
      effortBand: "CUSTOM",
      quantity,
      recommendedUnitPriceCents: null,
      recommendedLineTotalCents: null,
      finalUnitPriceCents: options.unitPriceCents,
      finalLineTotalCents: lineTotalCents(options.unitPriceCents, quantity),
      isOptional: options.isOptional ?? false,
      isIncluded: true,
      isCustom: true,
      isOverridden: false,
      overrideReason: null,
      sourceDeliverableIdsJson: [] as unknown as Prisma.InputJsonValue,
      sourceSectionTitlesJson: ["Manual"] as unknown as Prisma.InputJsonValue,
      sortOrder,
    },
  });

  const refreshed = await prisma.commercialPricingLineItem.findMany({
    where: { pricingId: options.pricingId },
    orderBy: { sortOrder: "asc" },
  });
  await recalculateAndPersist(options.pricingId, toBuiltLines(refreshed));

  return { ok: true, pricingId: options.pricingId };
}

export async function removeCustomPricingLineItem(options: {
  pricingId: string;
  lineItemId: string;
  actorEmail: string;
}): Promise<PricingMutationResult> {
  const gate = await requireEditablePricing(options.pricingId);
  if (!gate.ok) {
    return gate;
  }

  const line = gate.pricing.lineItems.find((l) => l.id === options.lineItemId);
  if (!line) {
    return { ok: false, code: "NOT_FOUND", message: "Line item not found." };
  }
  if (!line.isCustom) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Only custom line items can be removed.",
    };
  }

  await prisma.commercialPricingLineItem.delete({
    where: { id: options.lineItemId },
  });

  const refreshed = await prisma.commercialPricingLineItem.findMany({
    where: { pricingId: options.pricingId },
    orderBy: { sortOrder: "asc" },
  });
  await recalculateAndPersist(options.pricingId, toBuiltLines(refreshed));

  return { ok: true, pricingId: options.pricingId };
}

export async function markPricingReviewed(options: {
  pricingId: string;
  actorEmail: string;
}): Promise<PricingMutationResult> {
  const gate = await requireEditablePricing(options.pricingId);
  if (!gate.ok) {
    return gate;
  }

  if (gate.pricing.status === "REVIEWED") {
    return { ok: true, pricingId: options.pricingId };
  }

  await prisma.$transaction(async (tx) => {
    await tx.commercialPricing.update({
      where: { id: options.pricingId },
      data: { status: "REVIEWED" },
    });
    await tx.opportunityActivity.create({
      data: {
        opportunityId: gate.pricing.opportunityId,
        type: "PRICING_REVIEWED",
        actorEmail: options.actorEmail,
        toValueJson: {
          pricingId: options.pricingId,
          revision: gate.pricing.revision,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, pricingId: options.pricingId };
}

export async function approvePricing(options: {
  pricingId: string;
  actorEmail: string;
}): Promise<PricingMutationResult> {
  const gate = await requireEditablePricing(options.pricingId);
  if (!gate.ok) {
    return gate;
  }

  const missingCustom = gate.pricing.lineItems.filter(
    (l) =>
      l.isIncluded &&
      !l.isOptional &&
      l.isCustom &&
      (l.finalUnitPriceCents == null || l.finalLineTotalCents == null),
  );
  if (missingCustom.length > 0) {
    return {
      ok: false,
      code: "CUSTOM_PRICE_REQUIRED",
      message:
        "Included custom work requires a human-entered price before approval.",
    };
  }

  // Overrides must have reasons
  const badOverride = gate.pricing.lineItems.find(
    (l) =>
      l.isOverridden &&
      (!l.overrideReason || l.overrideReason.trim().length === 0),
  );
  if (badOverride) {
    return {
      ok: false,
      code: "OVERRIDE_REASON_REQUIRED",
      message: "Overridden line items require a reason before approval.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.commercialPricing.update({
      where: { id: options.pricingId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedByEmail: options.actorEmail,
      },
    });
    await tx.opportunityActivity.create({
      data: {
        opportunityId: gate.pricing.opportunityId,
        type: "PRICING_APPROVED",
        actorEmail: options.actorEmail,
        toValueJson: {
          pricingId: options.pricingId,
          revision: gate.pricing.revision,
          finalTotalCents: gate.pricing.finalTotalCents,
        } as Prisma.InputJsonValue,
      },
    });
  });

  return { ok: true, pricingId: options.pricingId };
}
