-- Commercial Sprint 1: Implementation Plan foundation (deterministic, internal-only)

CREATE TYPE "ImplementationPlanStatus" AS ENUM ('DRAFT', 'REVIEWED', 'APPROVED', 'SUPERSEDED');

CREATE TABLE "ImplementationPlan" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prospectId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT,
    "auditReportId" TEXT NOT NULL,
    "comparisonSnapshotId" TEXT,
    "status" "ImplementationPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "planVersion" INTEGER NOT NULL,
    "mappingVersion" INTEGER NOT NULL,
    "capabilityVersion" INTEGER NOT NULL,
    "inputFingerprint" TEXT NOT NULL,
    "competitiveEvidenceUsed" BOOLEAN NOT NULL DEFAULT false,
    "operatorNotes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedByEmail" TEXT,
    "supersededAt" TIMESTAMP(3),
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "ImplementationPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImplementationPlanWorkstream" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "implementationPlanId" TEXT NOT NULL,
    "workstreamType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "priorityScore" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "removed" BOOLEAN NOT NULL DEFAULT false,
    "operatorNote" TEXT,
    "capabilitiesJson" JSONB NOT NULL,
    "evidenceJson" JSONB NOT NULL,
    "actionsJson" JSONB NOT NULL,
    "preservationConstraintsJson" JSONB NOT NULL,

    CONSTRAINT "ImplementationPlanWorkstream_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImplementationPlan_prospectId_campaignId_createdAt_idx" ON "ImplementationPlan"("prospectId", "campaignId", "createdAt");
CREATE INDEX "ImplementationPlan_auditReportId_idx" ON "ImplementationPlan"("auditReportId");
CREATE INDEX "ImplementationPlan_comparisonSnapshotId_idx" ON "ImplementationPlan"("comparisonSnapshotId");
CREATE INDEX "ImplementationPlan_status_createdAt_idx" ON "ImplementationPlan"("status", "createdAt");
CREATE INDEX "ImplementationPlan_leadId_idx" ON "ImplementationPlan"("leadId");

CREATE INDEX "ImplementationPlanWorkstream_implementationPlanId_sortOrder_idx" ON "ImplementationPlanWorkstream"("implementationPlanId", "sortOrder");
CREATE INDEX "ImplementationPlanWorkstream_implementationPlanId_removed_idx" ON "ImplementationPlanWorkstream"("implementationPlanId", "removed");

ALTER TABLE "ImplementationPlan" ADD CONSTRAINT "ImplementationPlan_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImplementationPlan" ADD CONSTRAINT "ImplementationPlan_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImplementationPlan" ADD CONSTRAINT "ImplementationPlan_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ImplementationPlan" ADD CONSTRAINT "ImplementationPlan_auditReportId_fkey" FOREIGN KEY ("auditReportId") REFERENCES "AuditReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImplementationPlan" ADD CONSTRAINT "ImplementationPlan_comparisonSnapshotId_fkey" FOREIGN KEY ("comparisonSnapshotId") REFERENCES "CompetitiveComparisonSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ImplementationPlanWorkstream" ADD CONSTRAINT "ImplementationPlanWorkstream_implementationPlanId_fkey" FOREIGN KEY ("implementationPlanId") REFERENCES "ImplementationPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
