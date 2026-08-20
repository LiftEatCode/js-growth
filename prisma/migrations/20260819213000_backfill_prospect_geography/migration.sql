-- Backfill prospect city/state from linked Google Places discovery imports.
UPDATE "Prospect" AS p
SET
  "city" = c."city",
  "state" = c."state"
FROM "ProspectDiscoveryCandidate" AS c
WHERE c."importedProspectId" = p."id"
  AND p."city" IS NULL
  AND p."state" IS NULL
  AND c."city" IS NOT NULL
  AND c."state" IS NOT NULL;

-- Secondary backfill: match by Place ID when import link is missing.
UPDATE "Prospect" AS p
SET
  "latitude" = COALESCE(p."latitude", c."latitude"),
  "longitude" = COALESCE(p."longitude", c."longitude"),
  "city" = COALESCE(p."city", c."city"),
  "state" = COALESCE(p."state", c."state")
FROM "ProspectDiscoveryCandidate" AS c
WHERE p."sourceRef" IS NOT NULL
  AND (
    c."providerBusinessId" = p."sourceRef"
    OR c."providerBusinessId" = 'places/' || p."sourceRef"
    OR p."sourceRef" = 'places/' || c."providerBusinessId"
  )
  AND c."latitude" IS NOT NULL
  AND c."longitude" IS NOT NULL;
