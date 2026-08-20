-- Sprint 10: internal competitor website audit snapshots (not AuditReport).

CREATE TYPE "CompetitorAuditStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

CREATE TABLE "CompetitorAuditRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT,
    "prospectId" TEXT,
    "status" "DiscoveryRunStatus" NOT NULL DEFAULT 'RUNNING',
    "requestedAudits" INTEGER NOT NULL,
    "processedAudits" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "reusedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "CompetitorAuditRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompetitorAudit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prospectCompetitorId" TEXT NOT NULL,
    "targetProspectId" TEXT NOT NULL,
    "campaignId" TEXT,
    "runId" TEXT,
    "websiteUrl" TEXT NOT NULL,
    "normalizedHostname" TEXT NOT NULL,
    "status" "CompetitorAuditStatus" NOT NULL DEFAULT 'PENDING',
    "overallScore" INTEGER,
    "grade" TEXT,
    "technicalScore" INTEGER,
    "seoScore" INTEGER,
    "contentScore" INTEGER,
    "croScore" INTEGER,
    "accessibilityScore" INTEGER,
    "localScore" INTEGER,
    "performanceScore" INTEGER,
    "criticalIssues" INTEGER,
    "quickWins" INTEGER,
    "pagesScanned" INTEGER,
    "auditResultJson" JSONB,
    "summaryJson" JSONB,
    "auditEngineVersion" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,

    CONSTRAINT "CompetitorAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CompetitorAuditRun_campaignId_status_idx" ON "CompetitorAuditRun"("campaignId", "status");
CREATE INDEX "CompetitorAuditRun_prospectId_createdAt_idx" ON "CompetitorAuditRun"("prospectId", "createdAt");
CREATE INDEX "CompetitorAuditRun_createdAt_idx" ON "CompetitorAuditRun"("createdAt");

CREATE INDEX "CompetitorAudit_prospectCompetitorId_completedAt_idx" ON "CompetitorAudit"("prospectCompetitorId", "completedAt");
CREATE INDEX "CompetitorAudit_targetProspectId_status_idx" ON "CompetitorAudit"("targetProspectId", "status");
CREATE INDEX "CompetitorAudit_campaignId_createdAt_idx" ON "CompetitorAudit"("campaignId", "createdAt");
CREATE INDEX "CompetitorAudit_status_completedAt_idx" ON "CompetitorAudit"("status", "completedAt");
CREATE INDEX "CompetitorAudit_runId_idx" ON "CompetitorAudit"("runId");

ALTER TABLE "CompetitorAuditRun" ADD CONSTRAINT "CompetitorAuditRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitorAuditRun" ADD CONSTRAINT "CompetitorAuditRun_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompetitorAudit" ADD CONSTRAINT "CompetitorAudit_prospectCompetitorId_fkey" FOREIGN KEY ("prospectCompetitorId") REFERENCES "ProspectCompetitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitorAudit" ADD CONSTRAINT "CompetitorAudit_targetProspectId_fkey" FOREIGN KEY ("targetProspectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitorAudit" ADD CONSTRAINT "CompetitorAudit_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CompetitorAudit" ADD CONSTRAINT "CompetitorAudit_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CompetitorAuditRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
