-- Growth Sprint 5: Search Intelligence opportunity backlog
-- CREATE TYPE / TABLE for GrowthSearchOpportunity + enums

CREATE TYPE "GrowthSearchTopic" AS ENUM (
  'WEBSITE_GROWTH',
  'WEB_DEVELOPMENT',
  'SEO',
  'LOCAL_SEO',
  'GBP',
  'CONVERSION',
  'WEBSITE_AUDITS',
  'CONTENT_TRAFFIC',
  'AI_AUTOMATION',
  'BUSINESS_AUTOMATION',
  'CUSTOM_SOFTWARE',
  'ANALYTICS_GROWTH'
);

CREATE TYPE "GrowthSearchIntent" AS ENUM (
  'INFORMATIONAL',
  'COMMERCIAL_INVESTIGATION',
  'SERVICE',
  'LOCAL_SERVICE',
  'TOOL',
  'COMPARISON',
  'PROBLEM_SOLUTION',
  'BRAND'
);

CREATE TYPE "GrowthSearchOpportunitySource" AS ENUM (
  'GSC_QUERY',
  'GSC_PAGE',
  'SERVICE_GAP',
  'CONTENT_GAP',
  'CUSTOMER_QUESTION',
  'COMPETITOR_OBSERVATION',
  'LOCAL_INTENT',
  'AUDIT_INSIGHT',
  'MANUAL_RESEARCH'
);

CREATE TYPE "GrowthSearchOpportunityStatus" AS ENUM (
  'IDEA',
  'VALIDATED',
  'PLANNED',
  'IN_PROGRESS',
  'PUBLISHED',
  'MONITORING',
  'REFRESH',
  'ARCHIVED'
);

CREATE TYPE "GrowthSearchPriorityBand" AS ENUM (
  'NOW',
  'NEXT',
  'LATER'
);

CREATE TYPE "GrowthSearchEvidenceKind" AS ENUM (
  'FIRST_PARTY_DATA',
  'OFFICIAL_GUIDANCE',
  'MANUAL_RESEARCH',
  'INFERENCE',
  'HYPOTHESIS'
);

CREATE TYPE "GrowthSearchPageType" AS ENUM (
  'SERVICE',
  'BLOG',
  'TOOL',
  'LANDING',
  'LOCAL',
  'RESOURCE',
  'ABOUT',
  'OTHER'
);

CREATE TABLE "GrowthSearchOpportunity" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "slug" VARCHAR(80) NOT NULL,
  "topic" "GrowthSearchTopic" NOT NULL,
  "queryConcept" VARCHAR(200) NOT NULL,
  "intent" "GrowthSearchIntent" NOT NULL,
  "pageType" "GrowthSearchPageType" NOT NULL,
  "source" "GrowthSearchOpportunitySource" NOT NULL,
  "evidenceKind" "GrowthSearchEvidenceKind" NOT NULL,
  "status" "GrowthSearchOpportunityStatus" NOT NULL DEFAULT 'IDEA',
  "priorityBand" "GrowthSearchPriorityBand" NOT NULL,
  "priorityScore" INTEGER NOT NULL,
  "currentPagePath" VARCHAR(300),
  "recommendedPath" VARCHAR(300),
  "locationContext" VARCHAR(120),
  "notes" VARCHAR(2000),
  "createdByEmail" TEXT NOT NULL,
  "updatedByEmail" TEXT,

  CONSTRAINT "GrowthSearchOpportunity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GrowthSearchOpportunity_slug_key" ON "GrowthSearchOpportunity"("slug");
CREATE INDEX "GrowthSearchOpportunity_status_priorityBand_idx" ON "GrowthSearchOpportunity"("status", "priorityBand");
CREATE INDEX "GrowthSearchOpportunity_topic_status_idx" ON "GrowthSearchOpportunity"("topic", "status");
CREATE INDEX "GrowthSearchOpportunity_priorityScore_idx" ON "GrowthSearchOpportunity"("priorityScore");
CREATE INDEX "GrowthSearchOpportunity_createdAt_idx" ON "GrowthSearchOpportunity"("createdAt");
