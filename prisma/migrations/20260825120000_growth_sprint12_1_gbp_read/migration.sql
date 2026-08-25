-- Growth Sprint 12.1: GBP Read Integration V1
-- Additive: observationSource on checklist + GoogleBusinessProfileConnection

-- CreateEnum
CREATE TYPE "LocalGbpObservationSource" AS ENUM ('API', 'MANUAL');

-- CreateEnum
CREATE TYPE "GbpConnectionStatus" AS ENUM ('CONNECTED', 'SYNCING', 'SYNCED', 'AUTH_EXPIRED', 'ERROR', 'DISCONNECTED');

-- AlterTable
ALTER TABLE "LocalGbpProfileChecklistItem" ADD COLUMN "observationSource" "LocalGbpObservationSource";

-- CreateTable
CREATE TABLE "GoogleBusinessProfileConnection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "GbpConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "googleAccountResourceName" VARCHAR(120),
    "googleAccountDisplayName" VARCHAR(200),
    "locationResourceName" VARCHAR(120),
    "locationTitle" VARCHAR(200),
    "googleAccountId" VARCHAR(80),
    "googleLocationId" VARCHAR(80),
    "scopesJson" JSONB,
    "encryptedRefreshToken" TEXT,
    "tokenIv" VARCHAR(64),
    "tokenAuthTag" VARCHAR(64),
    "connectedByEmail" TEXT,
    "connectedAt" TIMESTAMP(3),
    "lastProfileSyncAt" TIMESTAMP(3),
    "lastPerformanceSyncAt" TIMESTAMP(3),
    "lastSyncOperation" VARCHAR(40),
    "lastSyncStatus" VARCHAR(40),
    "lastSyncError" VARCHAR(500),
    "lastSyncSummaryJson" JSONB,
    "syncLockUntil" TIMESTAMP(3),
    "syncLockOperation" VARCHAR(40),

    CONSTRAINT "GoogleBusinessProfileConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoogleBusinessProfileConnection_status_idx" ON "GoogleBusinessProfileConnection"("status");

-- CreateIndex
CREATE INDEX "GoogleBusinessProfileConnection_updatedAt_idx" ON "GoogleBusinessProfileConnection"("updatedAt");
