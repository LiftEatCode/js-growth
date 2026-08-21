import {
  COMMERCIAL_PRICING_CONFIG_VERSION,
  COMMERCIAL_PRICING_CURRENCY,
  COMMERCIAL_PRICING_VERSION,
} from "./constants";
import { buildPricingSourceFingerprint } from "./fingerprint";
import {
  bandUnitPriceCents,
  computePricingTotals,
  lineTotalCents,
} from "./totals";
import type { BuiltCommercialPricing, BuiltPricingLineItem } from "./types";
import { resolveWorkUnitFromDeliverable } from "./work-units";

export interface ScopeDeliverableInput {
  id: string;
  title: string;
  sourceActionKey: string | null;
  source: string;
  isIncluded: boolean;
  isOptional: boolean;
  sortOrder: number;
}

export interface ScopeSectionInput {
  id: string;
  title: string;
  isIncluded: boolean;
  isOptional: boolean;
  sortOrder: number;
  deliverables: ScopeDeliverableInput[];
}

/**
 * Pure deterministic builder: approved Scope → pricing recommendation shape.
 * Deduplicates overlapping deliverables into canonical commercial work units.
 */
export function buildPricingFromScope(options: {
  opportunityId: string;
  scope: {
    id: string;
    revision: number;
    status: string;
    sections: ScopeSectionInput[];
  };
}): BuiltCommercialPricing {
  type Acc = {
    workUnitKey: string;
    title: string;
    workType: BuiltPricingLineItem["workType"];
    effortBand: BuiltPricingLineItem["effortBand"];
    isCustom: boolean;
    isOptional: boolean;
    isIncluded: boolean;
    quantity: number;
    sourceDeliverableIds: Set<string>;
    sourceSectionTitles: Set<string>;
    firstSort: number;
  };

  const byKey = new Map<string, Acc>();

  const sections = [...options.scope.sections].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  for (const section of sections) {
    if (!section.isIncluded) {
      continue;
    }

    const deliverables = [...section.deliverables].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    for (const deliverable of deliverables) {
      if (!deliverable.isIncluded) {
        continue;
      }

      const resolved = resolveWorkUnitFromDeliverable({
        sourceActionKey: deliverable.sourceActionKey,
        title: deliverable.title,
        source: deliverable.source,
      });

      const existing = byKey.get(resolved.key);
      if (!existing) {
        byKey.set(resolved.key, {
          workUnitKey: resolved.key,
          title: resolved.title,
          workType: resolved.workType,
          effortBand: resolved.effortBand,
          isCustom: resolved.isCustom,
          // Optional only if EVERY contributing deliverable/section is optional
          isOptional: deliverable.isOptional || section.isOptional,
          isIncluded: true,
          quantity: 1,
          sourceDeliverableIds: new Set([deliverable.id]),
          sourceSectionTitles: new Set([section.title]),
          firstSort: section.sortOrder * 1000 + deliverable.sortOrder,
        });
        continue;
      }

      existing.sourceDeliverableIds.add(deliverable.id);
      existing.sourceSectionTitles.add(section.title);
      // If any contributing included work is base (non-optional), keep base
      if (!(deliverable.isOptional || section.isOptional)) {
        existing.isOptional = false;
      }
      existing.firstSort = Math.min(
        existing.firstSort,
        section.sortOrder * 1000 + deliverable.sortOrder,
      );
    }
  }

  const sorted = Array.from(byKey.values()).sort(
    (a, b) => a.firstSort - b.firstSort,
  );

  const lineItems: BuiltPricingLineItem[] = sorted.map((row, index) => {
    const unit = bandUnitPriceCents(row.effortBand);
    const line = lineTotalCents(unit, row.quantity);
    return {
      workUnitKey: row.workUnitKey,
      title: row.title,
      workType: row.workType,
      effortBand: row.effortBand,
      quantity: row.quantity,
      recommendedUnitPriceCents: unit,
      recommendedLineTotalCents: line,
      // CUSTOM starts without final price — operator must enter before approval
      finalUnitPriceCents: row.isCustom ? null : unit,
      finalLineTotalCents: row.isCustom ? null : line,
      isOptional: row.isOptional,
      isIncluded: row.isIncluded,
      isCustom: row.isCustom,
      isOverridden: false,
      overrideReason: null,
      sourceDeliverableIds: Array.from(row.sourceDeliverableIds).sort(),
      sourceSectionTitles: Array.from(row.sourceSectionTitles).sort(),
      sortOrder: index,
    };
  });

  const totals = computePricingTotals(lineItems);

  const fingerprint = buildPricingSourceFingerprint({
    opportunityId: options.opportunityId,
    commercialScopeId: options.scope.id,
    scopeRevision: options.scope.revision,
    scopeStatus: options.scope.status,
    pricingVersion: COMMERCIAL_PRICING_VERSION,
    pricingConfigVersion: COMMERCIAL_PRICING_CONFIG_VERSION,
  });

  return {
    commercialScopeId: options.scope.id,
    currency: COMMERCIAL_PRICING_CURRENCY,
    pricingVersion: COMMERCIAL_PRICING_VERSION,
    pricingConfigVersion: COMMERCIAL_PRICING_CONFIG_VERSION,
    sourceFingerprint: fingerprint,
    ...totals,
    lineItems,
  };
}
