-- Growth Sprint 4: content metric checkpoints + experiment decisions
CREATE TYPE "GrowthContentMetricCheckpoint" AS ENUM ('INITIAL', 'HOURS_72', 'DAYS_7');
CREATE TYPE "GrowthExperimentDecisionKind" AS ENUM ('CONTINUE', 'ITERATE', 'PROMOTE', 'STOP', 'INCONCLUSIVE');

CREATE TABLE "GrowthContentMetricSnapshot" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "contentRecordId" TEXT NOT NULL,
  "checkpoint" "GrowthContentMetricCheckpoint" NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fbViews" INTEGER,
  "fbReach" INTEGER,
  "fbEngagements" INTEGER,
  "fbReactions" INTEGER,
  "fbComments" INTEGER,
  "fbShares" INTEGER,
  "fbPageVisits" INTEGER,
  "fbFollowersGained" INTEGER,
  "fbLinkClicks" INTEGER,
  "notes" VARCHAR(2000),
  "capturedByEmail" TEXT NOT NULL,
  CONSTRAINT "GrowthContentMetricSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GrowthContentMetricSnapshot_contentRecordId_checkpoint_key"
  ON "GrowthContentMetricSnapshot"("contentRecordId", "checkpoint");
CREATE INDEX "GrowthContentMetricSnapshot_checkpoint_capturedAt_idx"
  ON "GrowthContentMetricSnapshot"("checkpoint", "capturedAt");
CREATE INDEX "GrowthContentMetricSnapshot_capturedAt_idx"
  ON "GrowthContentMetricSnapshot"("capturedAt");

ALTER TABLE "GrowthContentMetricSnapshot"
  ADD CONSTRAINT "GrowthContentMetricSnapshot_contentRecordId_fkey"
  FOREIGN KEY ("contentRecordId") REFERENCES "GrowthContentRecord"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GrowthExperimentDecision" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "experimentId" VARCHAR(40) NOT NULL,
  "hypothesis" VARCHAR(1000),
  "primaryMetric" VARCHAR(120),
  "secondaryMetrics" VARCHAR(500),
  "observations" VARCHAR(4000) NOT NULL,
  "sampleSize" INTEGER,
  "result" VARCHAR(2000),
  "confidence" VARCHAR(20),
  "decision" "GrowthExperimentDecisionKind" NOT NULL,
  "createdByEmail" TEXT NOT NULL,
  CONSTRAINT "GrowthExperimentDecision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GrowthExperimentDecision_experimentId_createdAt_idx"
  ON "GrowthExperimentDecision"("experimentId", "createdAt");
CREATE INDEX "GrowthExperimentDecision_createdAt_idx"
  ON "GrowthExperimentDecision"("createdAt");
