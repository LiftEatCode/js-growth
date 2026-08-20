# Sprint 9.1 — Production geography fix

## Root cause (confirmed)

All production candidates scoring **77 · Likely** with **location unknown** means
`scoreGeography()` received **no target state**. Same-region fallback is 10
points (total 79). UNKNOWN is 8 points (total 77). Every listed competitor is
in Texas, so if `profile.state` had been `"TX"`, none of them could have stayed
UNKNOWN.

Campaigns store `locationLabel` (e.g. `"Spring, TX"`) while `campaign.city` /
`campaign.state` are often null. Prospects imported before city backfill may
also have null `city`/`state`.

`buildCompetitiveProfile()` previously set `city`/`state` only from those
nullable columns and never parsed `locationLabel`. Candidates still showed
`Spring, TX` in the UI because Google Places `formattedAddress` was parsed
onto **candidate** rows.

Re-run persistence already overwrote scores and `evidenceJson`. The recomputed
values stayed UNKNOWN because the target profile had no city/state.

A second hole: `loadProspectGeography()` returned early when prospect
coordinates existed and dropped discovery city/state.

## Fix

1. Parse `campaign.locationLabel` / prospect address into target city/state
2. `scoreGeography()` also reads `profile.locationLabel` and candidate
   `formattedAddress` so Spring, TX vs Spring, TX cannot become UNKNOWN
3. `loadProspectGeography()` merges coords with discovery city/state
4. Short `City, ST` addresses parse (not only street-style `…, City, ST`)
5. Re-run keeps human SELECTED/REJECTED and replaces machine geography
6. Migration `20260819213000_backfill_prospect_geography`

## Production retest

1. Deploy + `npx prisma migrate deploy`
2. Happy Plumbing → **Re-run Discovery**
3. Bear's Plumbing (Spring, TX) → **Same city** or **X mi**, score **≠ 77**
4. Other TX cities → **Same region** or distance, not identical 77
