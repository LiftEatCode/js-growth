-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM (
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL',
  'WON',
  'LOST'
);

-- AlterTable
ALTER TABLE "Lead"
ADD COLUMN "followUpAt" TIMESTAMP(3),
ADD COLUMN "notes" TEXT,
ADD COLUMN "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Backfill existing rows
UPDATE "Lead"
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;

-- Make updatedAt required after existing rows have values
ALTER TABLE "Lead"
ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Lead_status_idx"
ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_followUpAt_idx"
ON "Lead"("followUpAt");