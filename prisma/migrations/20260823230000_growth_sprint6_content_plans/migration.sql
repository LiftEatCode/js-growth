-- Growth Sprint 6: Content Intelligence plans

CREATE TYPE "GrowthContentPlanType" AS ENUM (
  'SERVICE_PAGE',
  'BLOG',
  'FACEBOOK_COMPANY',
  'FACEBOOK_FOUNDER',
  'GBP_POST',
  'VIDEO_BRIEF'
);

CREATE TYPE "GrowthContentPlanSourceType" AS ENUM (
  'SEARCH_OPPORTUNITY',
  'CONTENT_GAP',
  'SERVICE_GAP',
  'CONTENT_REFRESH',
  'FACEBOOK_LEARNING',
  'CUSTOMER_QUESTION',
  'AUDIT_INSIGHT',
  'LOCAL_OPPORTUNITY',
  'EXPERIMENT',
  'MANUAL_OPERATOR',
  'REPURPOSE'
);

CREATE TYPE "GrowthContentPlanStatus" AS ENUM (
  'IDEA',
  'RESEARCHING',
  'BRIEF_READY',
  'READY_TO_GENERATE',
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'MONITORING',
  'REFRESH',
  'ARCHIVED'
);

CREATE TYPE "GrowthContentPlanPriority" AS ENUM (
  'NOW',
  'NEXT',
  'LATER'
);

CREATE TYPE "GrowthContentPlanPublisher" AS ENUM (
  'COMPANY',
  'FOUNDER',
  'NONE'
);

CREATE TABLE "GrowthContentPlan" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "slug" VARCHAR(80) NOT NULL,
  "contentType" "GrowthContentPlanType" NOT NULL,
  "sourceType" "GrowthContentPlanSourceType" NOT NULL,
  "status" "GrowthContentPlanStatus" NOT NULL DEFAULT 'IDEA',
  "priorityBand" "GrowthContentPlanPriority" NOT NULL,
  "publisher" "GrowthContentPlanPublisher" NOT NULL DEFAULT 'NONE',
  "topic" VARCHAR(40) NOT NULL,
  "workingTitle" VARCHAR(200) NOT NULL,
  "audience" VARCHAR(300) NOT NULL,
  "primaryObjective" VARCHAR(40) NOT NULL,
  "searchIntent" VARCHAR(40),
  "pageType" VARCHAR(40),
  "targetServicePath" VARCHAR(300),
  "searchOpportunitySlug" VARCHAR(80),
  "whyRecommendedJson" JSONB NOT NULL,
  "briefJson" JSONB,
  "generationJson" JSONB,
  "humanDraftJson" JSONB,
  "reviewJson" JSONB,
  "generationHistoryJson" JSONB,
  "publishedUrl" VARCHAR(500),
  "sourceAssetSlug" VARCHAR(80),
  "plannerPromptVersion" INTEGER NOT NULL DEFAULT 1,
  "developerPromptVersion" INTEGER,
  "reviewPromptVersion" INTEGER,
  "lastModel" VARCHAR(80),
  "lastInputTokens" INTEGER,
  "lastOutputTokens" INTEGER,
  "createdByEmail" TEXT NOT NULL,
  "updatedByEmail" TEXT,

  CONSTRAINT "GrowthContentPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GrowthContentPlan_slug_key" ON "GrowthContentPlan"("slug");
CREATE INDEX "GrowthContentPlan_status_priorityBand_idx" ON "GrowthContentPlan"("status", "priorityBand");
CREATE INDEX "GrowthContentPlan_contentType_status_idx" ON "GrowthContentPlan"("contentType", "status");
CREATE INDEX "GrowthContentPlan_searchOpportunitySlug_idx" ON "GrowthContentPlan"("searchOpportunitySlug");
CREATE INDEX "GrowthContentPlan_createdAt_idx" ON "GrowthContentPlan"("createdAt");
