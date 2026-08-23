# Growth Sprint 5 — Production Acceptance

## Operator workflow

1. Deploy application build.
2. Apply migration `20260823220000_growth_sprint5_search_opportunities`.
3. Open `/reports/growth`.
4. Confirm Search Baseline V1 unchanged (0 clicks, 2 impressions, INSUFFICIENT_DATA).
5. Record/update current Search Console snapshot via GrowthSnapshot (manual) if new data exists.
6. Confirm insufficient query data stays `INSUFFICIENT_DATA` when appropriate.
7. Create/review initial search opportunities (seed concepts in UI/docs).
8. Review priority ordering (NOW / NEXT / LATER).
9. Confirm service/content/local gaps visible on dashboard.
10. Generate/view Sprint 6-compatible content brief preview.
11. Confirm no search volume fabricated.
12. Confirm no ranking promises.
13. Confirm no external Google/Meta/OpenAI/Places API calls from dashboard.
14. Confirm Facebook dashboard section unchanged in behavior.
15. Run `npm run test:verify`, `npm run test:commercial`, `npm run build`.

## Pass criteria

- Search Intelligence panel renders.
- `GrowthSearchOpportunity` CRUD works for internal operators.
- Growth Baseline V1 Search Console totals unchanged in code/docs.
- Side-effect budget held.
