-- CreateEnum
CREATE TYPE "AuditReportSource" AS ENUM ('PUBLIC_FUNNEL', 'PROSPECTING');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProspectSourceType" AS ENUM ('MANUAL', 'PROVIDER', 'WEBSITE');

-- CreateEnum
CREATE TYPE "ProspectQualificationStatus" AS ENUM ('DISCOVERED', 'WEBSITE_INVALID', 'AUDITING', 'AUDIT_FAILED', 'QUALIFIED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ProspectOutreachStatus" AS ENUM ('NOT_READY', 'CONTACT_FOUND', 'NO_CONTACT', 'DRAFT_READY', 'APPROVED', 'SENT', 'REPLIED', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "ProspectContactSourceType" AS ENUM ('WEBSITE', 'CONTACT_PAGE', 'PROVIDER', 'MANUAL');

-- CreateEnum
CREATE TYPE "ProspectContactConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "OutreachMessageStatus" AS ENUM ('DRAFT', 'APPROVED', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SuppressionType" AS ENUM ('HOSTNAME', 'EMAIL');

-- CreateEnum
CREATE TYPE "SuppressionReason" AS ENUM ('SENT', 'REPLIED_NOT_INTERESTED', 'CUSTOMER', 'OPTED_OUT', 'BOUNCED', 'MANUAL');

-- AlterTable
ALTER TABLE "AuditReport" ADD COLUMN "source" "AuditReportSource" NOT NULL DEFAULT 'PUBLIC_FUNNEL';

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "locationLabel" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "radiusMiles" INTEGER,
    "industries" TEXT[],
    "desiredQualifiedCount" INTEGER NOT NULL DEFAULT 5,
    "targeting" JSONB,
    "notes" TEXT,
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessName" TEXT NOT NULL,
    "website" TEXT,
    "hostname" TEXT,
    "industry" TEXT,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "sourceType" "ProspectSourceType" NOT NULL DEFAULT 'MANUAL',
    "sourceRef" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualificationStatus" "ProspectQualificationStatus" NOT NULL DEFAULT 'DISCOVERED',
    "outreachStatus" "ProspectOutreachStatus" NOT NULL DEFAULT 'NOT_READY',
    "skipReason" TEXT,
    "notes" TEXT,
    "auditReportId" TEXT,
    "leadId" TEXT,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignProspect" (
    "id" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "discoveryRank" INTEGER,
    "qualificationRank" INTEGER,
    "isSelectedTopN" BOOLEAN NOT NULL DEFAULT false,
    "qualificationJson" JSONB,

    CONSTRAINT "CampaignProspect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectContact" (
    "id" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prospectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sourceType" "ProspectContactSourceType" NOT NULL,
    "sourceUrl" TEXT,
    "confidence" "ProspectContactConfidence" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProspectContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prospectId" TEXT NOT NULL,
    "campaignId" TEXT,
    "toEmail" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "replyTo" TEXT,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "findingIds" TEXT[],
    "status" "OutreachMessageStatus" NOT NULL DEFAULT 'DRAFT',
    "providerMessageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedByEmail" TEXT,

    CONSTRAINT "OutreachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuppressionEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "SuppressionType" NOT NULL,
    "value" TEXT NOT NULL,
    "reason" "SuppressionReason" NOT NULL,

    CONSTRAINT "SuppressionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditReport_source_idx" ON "AuditReport"("source");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_createdAt_idx" ON "Campaign"("createdAt");

-- CreateIndex
CREATE INDEX "Prospect_hostname_idx" ON "Prospect"("hostname");

-- CreateIndex
CREATE INDEX "Prospect_qualificationStatus_idx" ON "Prospect"("qualificationStatus");

-- CreateIndex
CREATE INDEX "Prospect_outreachStatus_idx" ON "Prospect"("outreachStatus");

-- CreateIndex
CREATE INDEX "Prospect_discoveredAt_idx" ON "Prospect"("discoveredAt");

-- CreateIndex
CREATE INDEX "Prospect_auditReportId_idx" ON "Prospect"("auditReportId");

-- CreateIndex
CREATE INDEX "Prospect_leadId_idx" ON "Prospect"("leadId");

-- CreateIndex
CREATE INDEX "CampaignProspect_campaignId_idx" ON "CampaignProspect"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignProspect_prospectId_idx" ON "CampaignProspect"("prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignProspect_campaignId_prospectId_key" ON "CampaignProspect"("campaignId", "prospectId");

-- CreateIndex
CREATE INDEX "ProspectContact_prospectId_idx" ON "ProspectContact"("prospectId");

-- CreateIndex
CREATE INDEX "ProspectContact_email_idx" ON "ProspectContact"("email");

-- CreateIndex
CREATE INDEX "OutreachMessage_prospectId_idx" ON "OutreachMessage"("prospectId");

-- CreateIndex
CREATE INDEX "OutreachMessage_campaignId_idx" ON "OutreachMessage"("campaignId");

-- CreateIndex
CREATE INDEX "OutreachMessage_status_idx" ON "OutreachMessage"("status");

-- CreateIndex
CREATE INDEX "SuppressionEntry_type_value_idx" ON "SuppressionEntry"("type", "value");

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_auditReportId_fkey" FOREIGN KEY ("auditReportId") REFERENCES "AuditReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignProspect" ADD CONSTRAINT "CampaignProspect_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignProspect" ADD CONSTRAINT "CampaignProspect_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectContact" ADD CONSTRAINT "ProspectContact_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
