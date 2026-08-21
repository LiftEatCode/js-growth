-- Commercial Sprint 4: Commercial Scope Engine V1 (no pricing / proposals / OpenAI)

ALTER TYPE "OpportunityActivityType" ADD VALUE 'SCOPE_CREATED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'SCOPE_REVIEWED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'SCOPE_APPROVED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'SCOPE_REVISED';
ALTER TYPE "OpportunityActivityType" ADD VALUE 'SCOPE_SUPERSEDED';

CREATE TYPE "CommercialScopeStatus" AS ENUM ('DRAFT', 'REVIEWED', 'APPROVED', 'SUPERSEDED');

CREATE TABLE "CommercialScope" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "implementationPlanId" TEXT,
    "implementationInterpretationId" TEXT,
    "status" "CommercialScopeStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "scopeVersion" INTEGER NOT NULL,
    "sourceFingerprint" TEXT NOT NULL,
    "assumptionsJson" JSONB NOT NULL,
    "exclusionsJson" JSONB NOT NULL,
    "considerationsJson" JSONB NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedByEmail" TEXT,
    "supersededAt" TIMESTAMP(3),
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "CommercialScope_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommercialScopeSection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scopeId" TEXT NOT NULL,
    "sourceImplementationWorkstreamId" TEXT,
    "workstreamType" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,
    "capabilitiesJson" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'PLAN',

    CONSTRAINT "CommercialScopeSection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommercialScopeDeliverable" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sectionId" TEXT NOT NULL,
    "sourceActionKey" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deliverableType" TEXT NOT NULL DEFAULT 'IMPLEMENTATION',
    "sortOrder" INTEGER NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'PLAN',

    CONSTRAINT "CommercialScopeDeliverable_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommercialScope_opportunityId_createdAt_idx" ON "CommercialScope"("opportunityId", "createdAt");
CREATE INDEX "CommercialScope_opportunityId_status_idx" ON "CommercialScope"("opportunityId", "status");
CREATE INDEX "CommercialScope_implementationPlanId_idx" ON "CommercialScope"("implementationPlanId");
CREATE INDEX "CommercialScope_status_createdAt_idx" ON "CommercialScope"("status", "createdAt");

CREATE INDEX "CommercialScopeSection_scopeId_sortOrder_idx" ON "CommercialScopeSection"("scopeId", "sortOrder");
CREATE INDEX "CommercialScopeSection_scopeId_isIncluded_idx" ON "CommercialScopeSection"("scopeId", "isIncluded");

CREATE INDEX "CommercialScopeDeliverable_sectionId_sortOrder_idx" ON "CommercialScopeDeliverable"("sectionId", "sortOrder");
CREATE INDEX "CommercialScopeDeliverable_sectionId_isIncluded_idx" ON "CommercialScopeDeliverable"("sectionId", "isIncluded");

ALTER TABLE "CommercialScope" ADD CONSTRAINT "CommercialScope_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialScope" ADD CONSTRAINT "CommercialScope_implementationPlanId_fkey" FOREIGN KEY ("implementationPlanId") REFERENCES "ImplementationPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommercialScope" ADD CONSTRAINT "CommercialScope_implementationInterpretationId_fkey" FOREIGN KEY ("implementationInterpretationId") REFERENCES "ImplementationPlanInterpretation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommercialScopeSection" ADD CONSTRAINT "CommercialScopeSection_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "CommercialScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommercialScopeDeliverable" ADD CONSTRAINT "CommercialScopeDeliverable_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CommercialScopeSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
