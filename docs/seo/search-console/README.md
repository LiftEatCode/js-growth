# Search Console — JS Growth property

## Status (Growth Sprint 1)

- Sitemap: `/sitemap.xml` (App Router `src/app/sitemap.ts`)
- robots: `src/app/robots.ts` declares sitemap
- **Property verification:** operator checklist (DNS / HTML meta / file) — not automated in app code yet
- Baseline methodology: record clicks, impressions, CTR, average position (diagnostic), top queries/pages into a `GrowthSnapshot` with source `SEARCH_CONSOLE` via `/reports/growth`

## Repeatable baseline procedure

1. Open Search Console → Performance → Search results.
2. Date range: last 28 days; optionally compare previous 28 days.
3. Export or note: total clicks, impressions, average CTR, average position.
4. Capture top queries and top pages.
5. Classify queries where reasonable: brand / non-brand / local-intent / service-intent / audit-tool-intent.
6. Save as GrowthSnapshot JSON matching `searchConsoleSnapshotMetricsSchema`.

Primary SEO growth outcomes remain: qualified impressions, qualified clicks, landing-page traffic, audit starts, leads — not average position alone.

See [`docs/growth/measurement-framework.md`](../../growth/measurement-framework.md).
