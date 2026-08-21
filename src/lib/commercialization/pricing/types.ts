import type {
  CommercialPricingStatus,
  PricingEffortBand,
  PricingWorkType,
} from "./constants";

export interface BuiltPricingLineItem {
  workUnitKey: string;
  title: string;
  workType: PricingWorkType;
  effortBand: PricingEffortBand;
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
  sourceDeliverableIds: string[];
  sourceSectionTitles: string[];
  sortOrder: number;
}

export interface BuiltCommercialPricing {
  commercialScopeId: string;
  currency: string;
  pricingVersion: number;
  pricingConfigVersion: number;
  sourceFingerprint: string;
  recommendedIncludedCents: number;
  recommendedOptionalCents: number;
  recommendedTotalCents: number;
  finalIncludedCents: number;
  finalOptionalCents: number;
  finalTotalCents: number;
  minimumEngagementCents: number;
  minimumApplied: boolean;
  assessmentOnly: boolean;
  lineItems: BuiltPricingLineItem[];
}

export interface PricingSourceFingerprint {
  opportunityId: string;
  commercialScopeId: string;
  scopeRevision: number;
  scopeStatus: string;
  pricingVersion: number;
  pricingConfigVersion: number;
}

export type { CommercialPricingStatus, PricingEffortBand, PricingWorkType };
