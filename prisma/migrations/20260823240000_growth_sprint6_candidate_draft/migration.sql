-- Sprint 6 hardening: AI candidate draft + busy lock (never silent human overwrite)

ALTER TABLE "GrowthContentPlan" ADD COLUMN IF NOT EXISTS "candidateDraftJson" JSONB;
ALTER TABLE "GrowthContentPlan" ADD COLUMN IF NOT EXISTS "aiBusyUntil" TIMESTAMP(3);
