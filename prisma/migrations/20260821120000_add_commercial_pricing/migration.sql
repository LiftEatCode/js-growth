-- Commercial Sprint 5: Pricing Engine V1 (no proposals / Stripe / OpenAI)

ALTER TYPE "OpportunityActivityType" ADD VALUE 'PRICING_CREATED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PRICING_REVIEWED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PRICING_APPROVED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PRICING_REVISED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PRICING_SUPERSEDED';

CREATE TYPE "CommercialPricingStatus" AS ENUM ('DRAFT', 'REVIEWED', 'APPROVED', 'SUPERSEDED');

CREATE TABLE "CommercialPricing" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "commercialScopeId" TEXT NOT NULL,
    "status" "CommercialPricingStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "pricingVersion" INTEGER NOT NULL,
    "pricingConfigVersion" INTEGER NOT NULL,
    "sourceFingerprint" TEXT NOT NULL,
    "recommendedIncludedCents" INTEGER NOT NULL,
    "recommendedOptionalCents" INTEGER NOT NULL,
    "recommendedTotalCents" INTEGER NOT NULL,
    "finalIncludedCents" INTEGER NOT NULL,
    "finalOptionalCents" INTEGER NOT NULL,
    "finalTotalCents" INTEGER NOT NULL,
    "minimumEngagementCents" INTEGER NOT NULL,
    "minimumApplied" BOOLEAN NOT NULL DEFAULT false,
    "assessmentOnly" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedByEmail" TEXT,
    "supersededAt" TIMESTAMP(3),
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "CommercialPricing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommercialPricingLineItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pricingId" TEXT NOT NULL,
    "workUnitKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "effortBand" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "recommendedUnitPriceCents" INTEGER,
    "recommendedLineTotalCents" INTEGER,
    "finalUnitPriceCents" INTEGER,
    "finalLineTotalCents" INTEGER,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "sourceDeliverableIdsJson" JSONB NOT NULL,
    "sourceSectionTitlesJson" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "CommercialPricingLineItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommercialPricing_opportunityId_createdAt_idx" ON "CommercialPricing"("opportunityId", "createdAt");
CREATE INDEX "CommercialPricing_opportunityId_status_idx" ON "CommercialPricing"("opportunityId", "status");
CREATE INDEX "CommercialPricing_commercialScopeId_idx" ON "CommercialPricing"("commercialScopeId");
CREATE INDEX "CommercialPricing_status_createdAt_idx" ON "CommercialPricing"("status", "createdAt");

CREATE INDEX "CommercialPricingLineItem_pricingId_sortOrder_idx" ON "CommercialPricingLineItem"("pricingId", "sortOrder");
CREATE INDEX "CommercialPricingLineItem_pricingId_workUnitKey_idx" ON "CommercialPricingLineItem"("pricingId", "workUnitKey");
CREATE INDEX "CommercialPricingLineItem_pricingId_isIncluded_idx" ON "CommercialPricingLineItem"("pricingId", "isIncluded");

ALTER TABLE "CommercialPricing" ADD CONSTRAINT "CommercialPricing_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialPricing" ADD CONSTRAINT "CommercialPricing_commercialScopeId_fkey" FOREIGN KEY ("commercialScopeId") REFERENCES "CommercialScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialPricingLineItem" ADD CONSTRAINT "CommercialPricingLineItem_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "CommercialPricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
