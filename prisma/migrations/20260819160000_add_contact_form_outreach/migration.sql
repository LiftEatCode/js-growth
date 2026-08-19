-- CreateEnum
CREATE TYPE "OutreachChannel" AS ENUM ('EMAIL', 'CONTACT_FORM');

-- AlterEnum
ALTER TYPE "OutreachMessageStatus" ADD VALUE 'SUBMITTED';

-- AlterTable
ALTER TABLE "OutreachMessage" ADD COLUMN "contactFormId" TEXT;
ALTER TABLE "OutreachMessage" ADD COLUMN "channel" "OutreachChannel" NOT NULL DEFAULT 'EMAIL';
ALTER TABLE "OutreachMessage" ADD COLUMN "submittedAt" TIMESTAMP(3);
ALTER TABLE "OutreachMessage" ADD COLUMN "submittedByEmail" TEXT;
ALTER TABLE "OutreachMessage" ALTER COLUMN "toEmail" DROP NOT NULL;
ALTER TABLE "OutreachMessage" ALTER COLUMN "fromEmail" DROP NOT NULL;
ALTER TABLE "OutreachMessage" ALTER COLUMN "subject" SET DEFAULT '';

-- CreateTable
CREATE TABLE "ProspectContactForm" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3),
    "prospectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "sourcePageUrl" TEXT NOT NULL,
    "formMethod" TEXT,
    "formAction" TEXT,
    "detectedFieldsJson" JSONB,
    "confidence" "ProspectContactConfidence" NOT NULL,
    "status" "ProspectContactStatus" NOT NULL DEFAULT 'DISCOVERED',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProspectContactForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProspectContactForm_prospectId_normalizedUrl_key" ON "ProspectContactForm"("prospectId", "normalizedUrl");

-- CreateIndex
CREATE INDEX "ProspectContactForm_prospectId_idx" ON "ProspectContactForm"("prospectId");

-- CreateIndex
CREATE INDEX "ProspectContactForm_normalizedUrl_idx" ON "ProspectContactForm"("normalizedUrl");

-- CreateIndex
CREATE INDEX "OutreachMessage_contactFormId_idx" ON "OutreachMessage"("contactFormId");

-- CreateIndex
CREATE INDEX "OutreachMessage_channel_idx" ON "OutreachMessage"("channel");

-- AddForeignKey
ALTER TABLE "ProspectContactForm" ADD CONSTRAINT "ProspectContactForm_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachMessage" ADD CONSTRAINT "OutreachMessage_contactFormId_fkey" FOREIGN KEY ("contactFormId") REFERENCES "ProspectContactForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
