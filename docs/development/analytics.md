# Analytics

**Growth Sprint 1** established the measurement baseline. Details: [`docs/growth/`](../growth/README.md).

## Current implementation

| Item | Status |
|---|---|
| GA4 | Custom sanitized gtag (`src/components/analytics/google-analytics.tsx`) |
| Measurement ID | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| GTM container | Not used |
| Vercel Analytics | Not installed |
| Duplicate GA tags | Avoided (single root mount; `send_page_view: false`) |
| Custom events | Commercial + growth taxonomies (`src/lib/analytics/`, `src/lib/growth/`) |
| Server-side GA / Measurement Protocol | Not used |
| Search Console verification | Ops checklist (not automated in app) |
| Sitemap / robots | `src/app/sitemap.ts`, `src/app/robots.ts` |

## Privacy

- Event + page-path sanitizers strip commercial IDs, UUIDs, Stripe IDs, PII keys.
- Forbidden keys include prospect/opportunity/client/project/proposal/agreement/payment IDs, emails, phones.
- Public/private boundary documented in growth measurement framework.

## Authority boundaries

| Concern | Authority |
|---|---|
| Marketing behavior / funnel events | GA4 (observational) |
| Professional audit payment | Stripe + `ReportPurchase` |
| Commercial payments / agreements | Stripe + commercial tables |
| Opportunity / client counts | First-party DB aggregates |

## Internal tools

- `/reports/growth` — funnel aggregates + manual baseline snapshots
- `/reports/growth/utm-builder` — campaign URL tagging
