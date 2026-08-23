-- Growth Sprint 3: Facebook content performance ledger
CREATE TYPE "GrowthContentPlatform" AS ENUM ('FACEBOOK');
CREATE TYPE "GrowthContentPublisherType" AS ENUM ('COMPANY', 'FOUNDER');
CREATE TYPE "GrowthContentJob" AS ENUM (
  'REACH',
  'ENGAGEMENT',
  'FOLLOWER_GROWTH',
  'AUTHORITY',
  'TRUST',
  'TRAFFIC',
  'AUDIT_CONVERSION',
  'LEAD_GENERATION',
  'PROOF',
  'COMMUNITY'
);
CREATE TYPE "GrowthContentPillar" AS ENUM (
  'WEBSITE_CONVERSION',
  'SEO',
  'LOCAL_SEO',
  'GBP',
  'SMALL_BUSINESS_GROWTH',
  'WEBSITE_AUDITS',
  'CASE_STUDIES',
  'COMMON_MISTAKES',
  'BEHIND_THE_SCENES',
  'BUILDING_JS_SOLUTIONS',
  'AI_AUTOMATION',
  'RESOURCES'
);
CREATE TYPE "GrowthContentFormat" AS ENUM (
  'PHOTO',
  'TEXT',
  'LINK',
  'REEL',
  'VIDEO',
  'CAROUSEL',
  'LIVE'
);

CREATE TABLE "GrowthContentRecord" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "platform" "GrowthContentPlatform" NOT NULL DEFAULT 'FACEBOOK',
  "publisherType" "GrowthContentPublisherType" NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL,
  "contentJob" "GrowthContentJob" NOT NULL,
  "contentPillar" "GrowthContentPillar" NOT NULL,
  "contentFormat" "GrowthContentFormat" NOT NULL,
  "campaign" VARCHAR(80) NOT NULL,
  "utmContent" VARCHAR(80) NOT NULL,
  "postUrl" VARCHAR(500),
  "title" VARCHAR(200) NOT NULL,
  "notes" VARCHAR(2000),
  "fbViews" INTEGER,
  "fbReach" INTEGER,
  "fbEngagements" INTEGER,
  "fbReactions" INTEGER,
  "fbComments" INTEGER,
  "fbShares" INTEGER,
  "fbPageVisits" INTEGER,
  "fbFollowersGained" INTEGER,
  "fbLinkClicks" INTEGER,
  "createdByEmail" TEXT NOT NULL,

  CONSTRAINT "GrowthContentRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GrowthContentRecord_platform_publishedAt_idx" ON "GrowthContentRecord"("platform", "publishedAt");
CREATE INDEX "GrowthContentRecord_publisherType_publishedAt_idx" ON "GrowthContentRecord"("publisherType", "publishedAt");
CREATE INDEX "GrowthContentRecord_contentJob_publishedAt_idx" ON "GrowthContentRecord"("contentJob", "publishedAt");
CREATE INDEX "GrowthContentRecord_contentPillar_publishedAt_idx" ON "GrowthContentRecord"("contentPillar", "publishedAt");
CREATE INDEX "GrowthContentRecord_contentFormat_publishedAt_idx" ON "GrowthContentRecord"("contentFormat", "publishedAt");
CREATE INDEX "GrowthContentRecord_utmContent_idx" ON "GrowthContentRecord"("utmContent");
CREATE INDEX "GrowthContentRecord_createdAt_idx" ON "GrowthContentRecord"("createdAt");
