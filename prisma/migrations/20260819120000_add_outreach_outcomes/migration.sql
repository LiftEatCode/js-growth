-- CreateEnum
CREATE TYPE "OutreachOutcomeType" AS ENUM ('REPLIED', 'INTERESTED', 'NOT_INTERESTED', 'NO_RESPONSE', 'BOUNCED');

-- AlterEnum
ALTER TYPE "SuppressionReason" ADD VALUE 'CONVERTED';

-- CreateTable
CREATE TABLE "OutreachOutcome" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "outreachMessageId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "outcome" "OutreachOutcomeType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "recordedByEmail" TEXT NOT NULL,

    CONSTRAINT "OutreachOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachOutcome_outreachMessageId_idx" ON "OutreachOutcome"("outreachMessageId");

-- CreateIndex
CREATE INDEX "OutreachOutcome_prospectId_idx" ON "OutreachOutcome"("prospectId");

-- CreateIndex
CREATE INDEX "OutreachOutcome_outcome_idx" ON "OutreachOutcome"("outcome");

-- CreateIndex
CREATE INDEX "OutreachOutcome_occurredAt_idx" ON "OutreachOutcome"("occurredAt");

-- AddForeignKey
ALTER TABLE "OutreachOutcome" ADD CONSTRAINT "OutreachOutcome_outreachMessageId_fkey" FOREIGN KEY ("outreachMessageId") REFERENCES "OutreachMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachOutcome" ADD CONSTRAINT "OutreachOutcome_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;
