-- Sprint 12: AI competitive interpretation snapshots (internal only).

CREATE TYPE "CompetitiveInterpretationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

CREATE TABLE "CompetitiveInterpretation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prospectId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "comparisonSnapshotId" TEXT NOT NULL,
    "status" "CompetitiveInterpretationStatus" NOT NULL DEFAULT 'PENDING',
    "model" TEXT,
    "promptVersion" INTEGER NOT NULL,
    "interpretationVersion" INTEGER NOT NULL,
    "comparisonVersion" INTEGER NOT NULL,
    "auditEngineVersion" INTEGER NOT NULL,
    "inputFingerprint" TEXT NOT NULL,
    "interpretationJson" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "CompetitiveInterpretation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CompetitiveInterpretation_prospectId_campaignId_createdAt_idx" ON "CompetitiveInterpretation"("prospectId", "campaignId", "createdAt");
CREATE INDEX "CompetitiveInterpretation_comparisonSnapshotId_createdAt_idx" ON "CompetitiveInterpretation"("comparisonSnapshotId", "createdAt");
CREATE INDEX "CompetitiveInterpretation_status_createdAt_idx" ON "CompetitiveInterpretation"("status", "createdAt");
CREATE INDEX "CompetitiveInterpretation_inputFingerprint_idx" ON "CompetitiveInterpretation"("inputFingerprint");

ALTER TABLE "CompetitiveInterpretation" ADD CONSTRAINT "CompetitiveInterpretation_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitiveInterpretation" ADD CONSTRAINT "CompetitiveInterpretation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompetitiveInterpretation" ADD CONSTRAINT "CompetitiveInterpretation_comparisonSnapshotId_fkey" FOREIGN KEY ("comparisonSnapshotId") REFERENCES "CompetitiveComparisonSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
