-- Commercial Sprint 6: Proposal Engine V1 (no public links / PDF / Stripe / OpenAI)

ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROPOSAL_CREATED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROPOSAL_REVIEWED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROPOSAL_APPROVED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROPOSAL_REVISED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'PROPOSAL_SUPERSEDED';

CREATE TYPE "CommercialProposalStatus" AS ENUM ('DRAFT', 'REVIEWED', 'APPROVED', 'SUPERSEDED');

CREATE TABLE "CommercialProposal" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "commercialScopeId" TEXT NOT NULL,
    "commercialPricingId" TEXT NOT NULL,
    "status" "CommercialProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "businessContext" TEXT,
    "approachIntro" TEXT,
    "timelineNote" TEXT,
    "nextStepText" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "includedInvestmentCents" INTEGER NOT NULL,
    "optionalInvestmentCents" INTEGER NOT NULL,
    "totalInvestmentCents" INTEGER NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "proposalVersion" INTEGER NOT NULL,
    "presentationVersion" INTEGER NOT NULL,
    "sourceFingerprint" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedByEmail" TEXT,
    "supersededAt" TIMESTAMP(3),
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "CommercialProposal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommercialProposal_opportunityId_createdAt_idx" ON "CommercialProposal"("opportunityId", "createdAt");
CREATE INDEX "CommercialProposal_opportunityId_status_idx" ON "CommercialProposal"("opportunityId", "status");
CREATE INDEX "CommercialProposal_commercialScopeId_idx" ON "CommercialProposal"("commercialScopeId");
CREATE INDEX "CommercialProposal_commercialPricingId_idx" ON "CommercialProposal"("commercialPricingId");
CREATE INDEX "CommercialProposal_status_createdAt_idx" ON "CommercialProposal"("status", "createdAt");

ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_commercialScopeId_fkey" FOREIGN KEY ("commercialScopeId") REFERENCES "CommercialScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialProposal" ADD CONSTRAINT "CommercialProposal_commercialPricingId_fkey" FOREIGN KEY ("commercialPricingId") REFERENCES "CommercialPricing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
