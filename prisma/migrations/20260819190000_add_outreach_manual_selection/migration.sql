-- Manual outreach selection: operator override separate from algorithm Top N.
-- Backfill: existing Top N prospects remain outreach-eligible after deploy.
ALTER TABLE "CampaignProspect" ADD COLUMN "isSelectedForOutreach" BOOLEAN NOT NULL DEFAULT false;

UPDATE "CampaignProspect"
SET "isSelectedForOutreach" = true
WHERE "isSelectedTopN" = true;
