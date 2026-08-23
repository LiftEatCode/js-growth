-- Growth Sprint 1 — measurement baselines + first-party audit attribution

CREATE TYPE "GrowthSnapshotSource" AS ENUM ('GA4', 'SEARCH_CONSOLE', 'FACEBOOK', 'INTERNAL');

ALTER TABLE "AuditReport" ADD COLUMN "attributionJson" JSONB;

CREATE TABLE "GrowthSnapshot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "source" "GrowthSnapshotSource" NOT NULL,
    "metricsJson" JSONB NOT NULL,
    "createdByEmail" TEXT NOT NULL,

    CONSTRAINT "GrowthSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GrowthSnapshot_source_periodStart_idx" ON "GrowthSnapshot"("source", "periodStart");
CREATE INDEX "GrowthSnapshot_periodStart_periodEnd_idx" ON "GrowthSnapshot"("periodStart", "periodEnd");
CREATE INDEX "GrowthSnapshot_createdAt_idx" ON "GrowthSnapshot"("createdAt");
