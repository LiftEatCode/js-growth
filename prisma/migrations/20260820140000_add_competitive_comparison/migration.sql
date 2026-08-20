-- Sprint 11: deterministic competitive comparison snapshots (internal only).

CREATE TABLE "CompetitiveComparisonSnapshot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prospectId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "auditReportId" TEXT NOT NULL,
    "auditEngineVersion" INTEGER NOT NULL,
    "comparisonVersion" INTEGER NOT NULL,
    "comparisonJson" JSONB NOT NULL,
    "competitorAuditIdsJson" JSONB NOT NULL,
    "selectedCompetitorIdsJson" JSONB NOT NULL,
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "CompetitiveComparisonSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CompetitiveComparisonSnapshot_prospectId_campaignId_createdAt_idx" ON "CompetitiveComparisonSnapshot"("prospectId", "campaignId", "createdAt");
CREATE INDEX "CompetitiveComparisonSnapshot_auditReportId_idx" ON "CompetitiveComparisonSnapshot"("auditReportId");
CREATE INDEX "CompetitiveComparisonSnapshot_createdAt_idx" ON "CompetitiveComparisonSnapshot"("createdAt");

ALTER TABLE "CompetitiveComparisonSnapshot" ADD CONSTRAINT "CompetitiveComparisonSnapshot_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitiveComparisonSnapshot" ADD CONSTRAINT "CompetitiveComparisonSnapshot_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitiveComparisonSnapshot" ADD CONSTRAINT "CompetitiveComparisonSnapshot_auditReportId_fkey" FOREIGN KEY ("auditReportId") REFERENCES "AuditReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
