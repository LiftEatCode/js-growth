-- AlterEnum
ALTER TYPE "ProspectOutreachStatus" ADD VALUE 'CONTACT_DISCOVERY_FAILED';
ALTER TYPE "ProspectOutreachStatus" ADD VALUE 'DRAFT_GENERATION_FAILED';
ALTER TYPE "ProspectOutreachStatus" ADD VALUE 'SUPPRESSED';

-- AlterEnum
ALTER TYPE "ProspectContactSourceType" ADD VALUE 'WEBSITE_HOMEPAGE';
ALTER TYPE "ProspectContactSourceType" ADD VALUE 'WEBSITE_CONTACT_PAGE';
ALTER TYPE "ProspectContactSourceType" ADD VALUE 'WEBSITE_ABOUT_PAGE';
ALTER TYPE "ProspectContactSourceType" ADD VALUE 'WEBSITE_TEAM_PAGE';
ALTER TYPE "ProspectContactSourceType" ADD VALUE 'WEBSITE_OTHER';

-- AlterEnum
ALTER TYPE "OutreachMessageStatus" ADD VALUE 'NEEDS_REVIEW';
ALTER TYPE "OutreachMessageStatus" ADD VALUE 'REJECTED';

-- CreateEnum
CREATE TYPE "ProspectContactStatus" AS ENUM ('DISCOVERED', 'SELECTED', 'REJECTED', 'SUPPRESSED', 'STALE');

-- AlterTable Prospect
ALTER TABLE "Prospect" ADD COLUMN "lastContactDiscoveryAt" TIMESTAMP(3);

-- AlterTable ProspectContact
ALTER TABLE "ProspectContact" RENAME COLUMN "capturedAt" TO "discoveredAt";
ALTER TABLE "ProspectContact" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ProspectContact" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ProspectContact" ADD COLUMN "lastVerifiedAt" TIMESTAMP(3);
ALTER TABLE "ProspectContact" ADD COLUMN "normalizedEmail" TEXT;
ALTER TABLE "ProspectContact" ADD COLUMN "name" TEXT;
ALTER TABLE "ProspectContact" ADD COLUMN "role" TEXT;
ALTER TABLE "ProspectContact" ADD COLUMN "status" "ProspectContactStatus" NOT NULL DEFAULT 'DISCOVERED';

UPDATE "ProspectContact"
SET "normalizedEmail" = LOWER("email")
WHERE "normalizedEmail" IS NULL;

ALTER TABLE "ProspectContact" ALTER COLUMN "normalizedEmail" SET NOT NULL;

CREATE UNIQUE INDEX "ProspectContact_prospectId_normalizedEmail_key" ON "ProspectContact"("prospectId", "normalizedEmail");
CREATE INDEX "ProspectContact_normalizedEmail_idx" ON "ProspectContact"("normalizedEmail");

-- AlterTable OutreachMessage
ALTER TABLE "OutreachMessage" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "OutreachMessage" ADD COLUMN "contactId" TEXT;
ALTER TABLE "OutreachMessage" ADD COLUMN "auditReportId" TEXT;
ALTER TABLE "OutreachMessage" ADD COLUMN "primaryFindingId" TEXT;
ALTER TABLE "OutreachMessage" ADD COLUMN "secondaryFindingId" TEXT;
ALTER TABLE "OutreachMessage" ADD COLUMN "generationModel" TEXT;
ALTER TABLE "OutreachMessage" ADD COLUMN "generationAttemptCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "OutreachMessage" ADD COLUMN "promptTokens" INTEGER;
ALTER TABLE "OutreachMessage" ADD COLUMN "completionTokens" INTEGER;
ALTER TABLE "OutreachMessage" ADD COLUMN "generationJson" JSONB;

CREATE INDEX "OutreachMessage_contactId_idx" ON "OutreachMessage"("contactId");
CREATE INDEX "OutreachMessage_auditReportId_idx" ON "OutreachMessage"("auditReportId");

ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "ProspectContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_auditReportId_fkey" FOREIGN KEY ("auditReportId") REFERENCES "AuditReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ProspectContactDiscoveryRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,
    "status" "DiscoveryRunStatus" NOT NULL DEFAULT 'RUNNING',
    "requested" INTEGER NOT NULL,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "found" INTEGER NOT NULL DEFAULT 0,
    "noContact" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "reused" INTEGER NOT NULL DEFAULT 0,
    "suppressed" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "ProspectContactDiscoveryRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProspectContactDiscoveryRun_campaignId_status_idx" ON "ProspectContactDiscoveryRun"("campaignId", "status");
CREATE INDEX "ProspectContactDiscoveryRun_campaignId_createdAt_idx" ON "ProspectContactDiscoveryRun"("campaignId", "createdAt");

ALTER TABLE "ProspectContactDiscoveryRun" ADD CONSTRAINT "ProspectContactDiscoveryRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ProspectOutreachDraftRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,
    "status" "DiscoveryRunStatus" NOT NULL DEFAULT 'RUNNING',
    "requested" INTEGER NOT NULL,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "generated" INTEGER NOT NULL DEFAULT 0,
    "reused" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "ProspectOutreachDraftRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProspectOutreachDraftRun_campaignId_status_idx" ON "ProspectOutreachDraftRun"("campaignId", "status");
CREATE INDEX "ProspectOutreachDraftRun_campaignId_createdAt_idx" ON "ProspectOutreachDraftRun"("campaignId", "createdAt");

ALTER TABLE "ProspectOutreachDraftRun" ADD CONSTRAINT "ProspectOutreachDraftRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
