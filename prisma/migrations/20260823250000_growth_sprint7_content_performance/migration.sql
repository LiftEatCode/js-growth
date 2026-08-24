-- Sprint 7: publication timestamp + performance evidence on GrowthContentPlan

ALTER TABLE "GrowthContentPlan" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "GrowthContentPlan" ADD COLUMN IF NOT EXISTS "performanceJson" JSONB;
