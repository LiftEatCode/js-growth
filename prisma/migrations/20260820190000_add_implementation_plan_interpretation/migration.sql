-- Commercial Sprint 2: AI Implementation Plan Interpretation (historical)

CREATE TYPE "ImplementationInterpretationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

CREATE TABLE "ImplementationPlanInterpretation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "implementationPlanId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT,
    "status" "ImplementationInterpretationStatus" NOT NULL DEFAULT 'PENDING',
    "model" TEXT,
    "promptVersion" INTEGER NOT NULL,
    "interpretationVersion" INTEGER NOT NULL,
    "planVersion" INTEGER NOT NULL,
    "mappingVersion" INTEGER NOT NULL,
    "inputFingerprint" TEXT NOT NULL,
    "interpretationJson" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "ImplementationPlanInterpretation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImplementationPlanInterpretation_implementationPlanId_createdAt_idx" ON "ImplementationPlanInterpretation"("implementationPlanId", "createdAt");
CREATE INDEX "ImplementationPlanInterpretation_prospectId_campaignId_createdAt_idx" ON "ImplementationPlanInterpretation"("prospectId", "campaignId", "createdAt");
CREATE INDEX "ImplementationPlanInterpretation_status_createdAt_idx" ON "ImplementationPlanInterpretation"("status", "createdAt");
CREATE INDEX "ImplementationPlanInterpretation_inputFingerprint_idx" ON "ImplementationPlanInterpretation"("inputFingerprint");
CREATE INDEX "ImplementationPlanInterpretation_leadId_idx" ON "ImplementationPlanInterpretation"("leadId");

ALTER TABLE "ImplementationPlanInterpretation" ADD CONSTRAINT "ImplementationPlanInterpretation_implementationPlanId_fkey" FOREIGN KEY ("implementationPlanId") REFERENCES "ImplementationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImplementationPlanInterpretation" ADD CONSTRAINT "ImplementationPlanInterpretation_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImplementationPlanInterpretation" ADD CONSTRAINT "ImplementationPlanInterpretation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImplementationPlanInterpretation" ADD CONSTRAINT "ImplementationPlanInterpretation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
