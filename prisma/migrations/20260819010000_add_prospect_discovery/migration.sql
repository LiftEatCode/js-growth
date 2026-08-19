-- AlterEnum
ALTER TYPE "ProspectSourceType" ADD VALUE 'GOOGLE_PLACES';

-- AlterTable
CREATE INDEX "Prospect_sourceRef_idx" ON "Prospect"("sourceRef");

-- CreateEnum
CREATE TYPE "DiscoveryRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DiscoveryCandidateStatus" AS ENUM ('ELIGIBLE', 'NO_WEBSITE', 'INVALID_WEBSITE', 'DUPLICATE_PLACE', 'DUPLICATE_HOSTNAME', 'EXISTING_PROSPECT', 'ALREADY_IN_CAMPAIGN', 'EXISTING_LEAD', 'SUPPRESSED');

-- CreateTable
CREATE TABLE "ProspectDiscoveryRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "DiscoveryRunStatus" NOT NULL DEFAULT 'RUNNING',
    "requestedIndustries" TEXT[],
    "requestedLocation" TEXT NOT NULL,
    "radiusMiles" INTEGER,
    "requestedLimit" INTEGER NOT NULL,
    "providerRequestCount" INTEGER NOT NULL DEFAULT 0,
    "returnedCount" INTEGER NOT NULL DEFAULT 0,
    "eligibleCount" INTEGER NOT NULL DEFAULT 0,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedDuplicateCount" INTEGER NOT NULL DEFAULT 0,
    "skippedSuppressedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedNoWebsiteCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "ProspectDiscoveryRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectDiscoveryCandidate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discoveryRunId" TEXT NOT NULL,
    "providerBusinessId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "website" TEXT,
    "hostname" TEXT,
    "formattedAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "phone" TEXT,
    "category" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "DiscoveryCandidateStatus" NOT NULL,
    "exclusionReason" TEXT,
    "importedProspectId" TEXT,

    CONSTRAINT "ProspectDiscoveryCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProspectDiscoveryRun_campaignId_status_idx" ON "ProspectDiscoveryRun"("campaignId", "status");

-- CreateIndex
CREATE INDEX "ProspectDiscoveryRun_campaignId_createdAt_idx" ON "ProspectDiscoveryRun"("campaignId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProspectDiscoveryCandidate_discoveryRunId_providerBusinessId_key" ON "ProspectDiscoveryCandidate"("discoveryRunId", "providerBusinessId");

-- CreateIndex
CREATE INDEX "ProspectDiscoveryCandidate_discoveryRunId_status_idx" ON "ProspectDiscoveryCandidate"("discoveryRunId", "status");

-- CreateIndex
CREATE INDEX "ProspectDiscoveryCandidate_hostname_idx" ON "ProspectDiscoveryCandidate"("hostname");

-- CreateIndex
CREATE INDEX "ProspectDiscoveryCandidate_importedProspectId_idx" ON "ProspectDiscoveryCandidate"("importedProspectId");

-- AddForeignKey
ALTER TABLE "ProspectDiscoveryRun" ADD CONSTRAINT "ProspectDiscoveryRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectDiscoveryCandidate" ADD CONSTRAINT "ProspectDiscoveryCandidate_discoveryRunId_fkey" FOREIGN KEY ("discoveryRunId") REFERENCES "ProspectDiscoveryRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectDiscoveryCandidate" ADD CONSTRAINT "ProspectDiscoveryCandidate_importedProspectId_fkey" FOREIGN KEY ("importedProspectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;
