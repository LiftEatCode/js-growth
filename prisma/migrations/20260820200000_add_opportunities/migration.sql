-- Commercial Sprint 3: Opportunity Management V1 (sales pipeline; no pricing/proposals)

CREATE TYPE "OpportunityStage" AS ENUM ('NEW', 'QUALIFIED', 'DISCOVERY', 'SOLUTION_FIT', 'PROPOSAL_READY', 'WON', 'LOST');

CREATE TYPE "OpportunityLostReason" AS ENUM ('PRICE', 'NO_RESPONSE', 'NOT_READY', 'NO_FIT', 'COMPETITOR', 'DIY', 'TIMING', 'OTHER');

CREATE TYPE "OpportunityActivityType" AS ENUM ('OPPORTUNITY_CREATED', 'STAGE_CHANGED', 'NEXT_ACTION_CHANGED', 'NOTE_ADDED', 'CAPABILITIES_UPDATED', 'MARKED_WON', 'MARKED_LOST', 'REOPENED');

CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prospectId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT,
    "implementationPlanId" TEXT,
    "implementationInterpretationId" TEXT,
    "name" TEXT NOT NULL,
    "stage" "OpportunityStage" NOT NULL DEFAULT 'NEW',
    "ownerEmail" TEXT NOT NULL,
    "recommendedCapabilitiesJson" JSONB NOT NULL,
    "nextAction" TEXT,
    "nextActionAt" TIMESTAMP(3),
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "lostReason" "OpportunityLostReason",
    "lostNote" TEXT,
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpportunityActivity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opportunityId" TEXT NOT NULL,
    "type" "OpportunityActivityType" NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "fromValueJson" JSONB,
    "toValueJson" JSONB,
    "note" TEXT,

    CONSTRAINT "OpportunityActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Opportunity_prospectId_createdAt_idx" ON "Opportunity"("prospectId", "createdAt");
CREATE INDEX "Opportunity_campaignId_createdAt_idx" ON "Opportunity"("campaignId", "createdAt");
CREATE INDEX "Opportunity_stage_createdAt_idx" ON "Opportunity"("stage", "createdAt");
CREATE INDEX "Opportunity_ownerEmail_stage_idx" ON "Opportunity"("ownerEmail", "stage");
CREATE INDEX "Opportunity_nextActionAt_idx" ON "Opportunity"("nextActionAt");
CREATE INDEX "Opportunity_implementationPlanId_idx" ON "Opportunity"("implementationPlanId");
CREATE INDEX "Opportunity_leadId_idx" ON "Opportunity"("leadId");

CREATE INDEX "OpportunityActivity_opportunityId_createdAt_idx" ON "OpportunityActivity"("opportunityId", "createdAt");
CREATE INDEX "OpportunityActivity_type_createdAt_idx" ON "OpportunityActivity"("type", "createdAt");

ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_implementationPlanId_fkey" FOREIGN KEY ("implementationPlanId") REFERENCES "ImplementationPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_implementationInterpretationId_fkey" FOREIGN KEY ("implementationInterpretationId") REFERENCES "ImplementationPlanInterpretation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OpportunityActivity" ADD CONSTRAINT "OpportunityActivity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
