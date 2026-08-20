-- Persist Google Places coordinates on Prospects for competitive geography.
ALTER TABLE "Prospect" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "Prospect" ADD COLUMN "longitude" DOUBLE PRECISION;

UPDATE "Prospect" AS p
SET
  "latitude" = c."latitude",
  "longitude" = c."longitude"
FROM "ProspectDiscoveryCandidate" AS c
WHERE c."importedProspectId" = p."id"
  AND c."latitude" IS NOT NULL
  AND c."longitude" IS NOT NULL
  AND p."latitude" IS NULL
  AND p."longitude" IS NULL;
