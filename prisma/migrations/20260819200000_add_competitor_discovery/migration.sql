-- CreateEnum
CREATE TYPE "ProspectCompetitorStatus" AS ENUM ('CANDIDATE', 'VALIDATED', 'SELECTED', 'REJECTED', 'STALE');

-- CreateEnum
CREATE TYPE "ProspectCompetitorValidationLabel" AS ENUM ('STRONG', 'LIKELY', 'WEAK', 'REJECTED');

-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN "lastCompetitorDiscoveryAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProspectCompetitor" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "prospectId" TEXT NOT NULL,
    "competitorProspectId" TEXT,
    "provider" TEXT NOT NULL,
    "providerBusinessId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "website" TEXT,
    "normalizedHostname" TEXT,
    "formattedAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "primaryType" TEXT,
    "normalizedVerticalsJson" JSONB,
    "distanceMiles" DOUBLE PRECISION,
    "validationScore" INTEGER NOT NULL,
    "validationLabel" "ProspectCompetitorValidationLabel" NOT NULL,
    "evidenceJson" JSONB NOT NULL,
    "status" "ProspectCompetitorStatus" NOT NULL DEFAULT 'CANDIDATE',
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastValidatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProspectCompetitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorDiscoveryRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT,
    "prospectId" TEXT,
    "status" "DiscoveryRunStatus" NOT NULL DEFAULT 'RUNNING',
    "requestedProspects" INTEGER NOT NULL,
    "processedProspects" INTEGER NOT NULL DEFAULT 0,
    "providerRequests" INTEGER NOT NULL DEFAULT 0,
    "candidatesReturned" INTEGER NOT NULL DEFAULT 0,
    "validatedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "recommendedCount" INTEGER NOT NULL DEFAULT 0,
    "selectedCount" INTEGER NOT NULL DEFAULT 0,
    "reusedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "CompetitorDiscoveryRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProspectCompetitor_prospectId_provider_providerBusinessId_key" ON "ProspectCompetitor"("prospectId", "provider", "providerBusinessId");

-- CreateIndex
CREATE INDEX "ProspectCompetitor_prospectId_status_idx" ON "ProspectCompetitor"("prospectId", "status");

-- CreateIndex
CREATE INDEX "ProspectCompetitor_prospectId_isRecommended_idx" ON "ProspectCompetitor"("prospectId", "isRecommended");

-- CreateIndex
CREATE INDEX "ProspectCompetitor_normalizedHostname_idx" ON "ProspectCompetitor"("normalizedHostname");

-- CreateIndex
CREATE INDEX "ProspectCompetitor_competitorProspectId_idx" ON "ProspectCompetitor"("competitorProspectId");

-- CreateIndex
CREATE INDEX "CompetitorDiscoveryRun_campaignId_status_idx" ON "CompetitorDiscoveryRun"("campaignId", "status");

-- CreateIndex
CREATE INDEX "CompetitorDiscoveryRun_prospectId_createdAt_idx" ON "CompetitorDiscoveryRun"("prospectId", "createdAt");

-- CreateIndex
CREATE INDEX "CompetitorDiscoveryRun_createdAt_idx" ON "CompetitorDiscoveryRun"("createdAt");

-- AddForeignKey
ALTER TABLE "ProspectCompetitor" ADD CONSTRAINT "ProspectCompetitor_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectCompetitor" ADD CONSTRAINT "ProspectCompetitor_competitorProspectId_fkey" FOREIGN KEY ("competitorProspectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorDiscoveryRun" ADD CONSTRAINT "CompetitorDiscoveryRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorDiscoveryRun" ADD CONSTRAINT "CompetitorDiscoveryRun_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
