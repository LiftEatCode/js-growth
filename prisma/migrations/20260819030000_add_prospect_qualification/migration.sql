-- CreateEnum
CREATE TYPE "QualificationRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ProspectQualificationRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,
    "status" "QualificationRunStatus" NOT NULL DEFAULT 'RUNNING',
    "requestedCount" INTEGER NOT NULL,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "qualifiedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "auditsAttempted" INTEGER NOT NULL DEFAULT 0,
    "auditsReused" INTEGER NOT NULL DEFAULT 0,
    "auditsCompleted" INTEGER NOT NULL DEFAULT 0,
    "auditsFailed" INTEGER NOT NULL DEFAULT 0,
    "remainingUnaudited" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "ProspectQualificationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProspectQualificationRun_campaignId_status_idx" ON "ProspectQualificationRun"("campaignId", "status");

-- CreateIndex
CREATE INDEX "ProspectQualificationRun_campaignId_createdAt_idx" ON "ProspectQualificationRun"("campaignId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProspectQualificationRun" ADD CONSTRAINT "ProspectQualificationRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
