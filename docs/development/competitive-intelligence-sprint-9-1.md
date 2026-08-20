# Competitive Intelligence — Sprint 9.1

Geography hardening for Sprint 9 competitive discovery.

## Root cause

Google Places **already returned** candidate coordinates (`places.location` was in the field mask). Candidate normalization preserved them.

The failure was **target prospect coordinates**:

1. `Prospect` did not store latitude/longitude.
2. `loadProspectPlacesCategory()` used a single `findFirst` OR query that could miss the imported discovery row or fail when Place ID formats differed (`places/ChIJ…` vs `ChIJ…`).
3. `normalizeCompetitorCandidate()` required **both** target and candidate coordinates for Haversine. Missing target coords forced `distanceMiles = null` for every candidate.
4. Validation fell back to the unknown geography band (8 points), producing identical **77 · Likely** scores for all same-vertical competitors.

## Coordinate flow (after 9.1)

```text
Google Places Text Search (places.location in field mask)
  → normalizeGooglePlace (lat/lng on DiscoveredBusiness)
  → normalizeCompetitorCandidate (distance when target+candidate coords exist)

Target resolution (priority):
  1. Prospect.latitude / Prospect.longitude (new, backfilled + set on import)
  2. ProspectDiscoveryCandidate via importedProspectId (prefer rows with coords)
  3. Place ID match with normalized variants
  4. Hostname match on discovery candidates
  5. City/state fallback only (no fake coordinates)
```

## Geographic scoring (max 25, unchanged cap)

| Mode | When | Score |
|---|---|---|
| EXACT_DISTANCE | Both coordinate pairs available | 25 / 20 / 10 by band; 0 + reject if distant (>2× radius) |
| SAME_CITY_FALLBACK | Same city + state, no coords | 14 |
| SAME_REGION_FALLBACK | Same state, different city, no coords | 10 |
| UNKNOWN | Insufficient evidence | 8 |

Exact distance remains strongest. Same-city fallback is intentionally below verified very-near (25).

Evidence JSON includes `geography: { mode, distanceMiles, radiusMiles, band, score }`.

## Ranking

Unchanged primary sort: validation score DESC.

Tie-breakers now consider geography mode before distance:

1. EXACT_DISTANCE
2. SAME_CITY_FALLBACK
3. SAME_REGION_FALLBACK
4. UNKNOWN

Then distance ASC (null = last), business name, Place ID.

## Rediscovery

**Re-run Discovery** passes `force = true`, bypassing the 30-day TTL.

On refresh, rows matched by Place ID or hostname **preserve human SELECTED / REJECTED** status (existing Sprint 9 behavior).

## API cost

No new Places requests. Coordinates come from the same Text Search responses (still max 3/prospect).

No Place Details fan-out.

## Migration

`20260819210000_add_prospect_geography` adds `Prospect.latitude` / `Prospect.longitude` and backfills from linked `ProspectDiscoveryCandidate` rows.
