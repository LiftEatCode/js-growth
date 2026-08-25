-- Growth Sprint 11: Follow-up activity history + prospect followUpAt + ContactSubmission.leadId
-- Additive only. Does not synthesize historical activities.

-- CreateEnum
CREATE TYPE "FollowUpActivityType" AS ENUM ('EMAIL', 'PHONE_CALL', 'TEXT_MESSAGE', 'FACEBOOK_MESSAGE', 'IN_PERSON', 'MEETING', 'NOTE', 'FOLLOW_UP', 'OTHER');

-- CreateEnum
CREATE TYPE "FollowUpDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL');

-- CreateEnum
CREATE TYPE "FollowUpOutcome" AS ENUM ('SENT', 'REPLIED', 'CONNECTED', 'NO_ANSWER', 'LEFT_VOICEMAIL', 'BOUNCED', 'INTERESTED', 'NOT_INTERESTED', 'FOLLOW_UP_REQUIRED', 'MEETING_SCHEDULED', 'QUALIFIED', 'DISQUALIFIED', 'DO_NOT_CONTACT', 'NO_RESPONSE', 'OTHER');

-- AlterTable
ALTER TABLE "ContactSubmission" ADD COLUMN "leadId" TEXT;

-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN "followUpAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FollowUpActivity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activityType" "FollowUpActivityType" NOT NULL,
    "direction" "FollowUpDirection" NOT NULL,
    "outcome" "FollowUpOutcome" NOT NULL,
    "summary" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "nextFollowUpAt" TIMESTAMP(3),
    "createdByEmail" TEXT,
    "idempotencyKey" TEXT,
    "leadId" TEXT,
    "prospectId" TEXT,
    "opportunityId" TEXT,

    CONSTRAINT "FollowUpActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpActivity_idempotencyKey_key" ON "FollowUpActivity"("idempotencyKey");

-- CreateIndex
CREATE INDEX "FollowUpActivity_leadId_occurredAt_idx" ON "FollowUpActivity"("leadId", "occurredAt");

-- CreateIndex
CREATE INDEX "FollowUpActivity_prospectId_occurredAt_idx" ON "FollowUpActivity"("prospectId", "occurredAt");

-- CreateIndex
CREATE INDEX "FollowUpActivity_opportunityId_occurredAt_idx" ON "FollowUpActivity"("opportunityId", "occurredAt");

-- CreateIndex
CREATE INDEX "FollowUpActivity_occurredAt_idx" ON "FollowUpActivity"("occurredAt");

-- CreateIndex
CREATE INDEX "FollowUpActivity_createdAt_idx" ON "FollowUpActivity"("createdAt");

-- CreateIndex
CREATE INDEX "ContactSubmission_leadId_idx" ON "ContactSubmission"("leadId");

-- CreateIndex
CREATE INDEX "Prospect_followUpAt_idx" ON "Prospect"("followUpAt");

-- AddForeignKey
ALTER TABLE "ContactSubmission" ADD CONSTRAINT "ContactSubmission_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpActivity" ADD CONSTRAINT "FollowUpActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpActivity" ADD CONSTRAINT "FollowUpActivity_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpActivity" ADD CONSTRAINT "FollowUpActivity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
