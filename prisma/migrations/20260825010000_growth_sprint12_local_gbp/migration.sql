-- Growth Sprint 12: Local Search / GBP Intelligence V1
-- Additive: GOOGLE_BUSINESS_PROFILE snapshot source + LocalGbpProfileChecklistItem

-- AlterEnum
ALTER TYPE "GrowthSnapshotSource" ADD VALUE 'GOOGLE_BUSINESS_PROFILE';

-- CreateEnum
CREATE TYPE "LocalGbpChecklistStatus" AS ENUM ('NOT_REVIEWED', 'OK', 'NEEDS_ATTENTION', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "LocalGbpFactMatch" AS ENUM ('MATCH', 'MISMATCH', 'NOT_CAPTURED', 'NOT_APPLICABLE');

-- CreateTable
CREATE TABLE "LocalGbpProfileChecklistItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemKey" VARCHAR(80) NOT NULL,
    "status" "LocalGbpChecklistStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
    "observation" VARCHAR(1000),
    "factMatch" "LocalGbpFactMatch" NOT NULL DEFAULT 'NOT_CAPTURED',
    "observedValue" VARCHAR(300),
    "reviewedByEmail" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "LocalGbpProfileChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocalGbpProfileChecklistItem_itemKey_key" ON "LocalGbpProfileChecklistItem"("itemKey");

-- CreateIndex
CREATE INDEX "LocalGbpProfileChecklistItem_status_idx" ON "LocalGbpProfileChecklistItem"("status");

-- CreateIndex
CREATE INDEX "LocalGbpProfileChecklistItem_updatedAt_idx" ON "LocalGbpProfileChecklistItem"("updatedAt");
