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
- Forbidden keys include prospect/opportunity/client/project/proposal/agreement/payment/campaign IDs, emails, phones.
- **Third-party analytics records commercial route families, never commercial record identity.**
- Capability-bearing and internal dynamic URLs are redacted before analytics (application routes unchanged):
  - `/report/{uuid}` → `/report/[id]`
  - `/proposal/{shareToken}` → `/proposal/[secure]`
  - `/agreement/{shareToken}` → `/agreement/[secure]`
  - `/reports/clients/{clientId}/projects/{projectId}` → `/reports/clients/[id]/projects/[id]`
  - `/reports/opportunities/{id}/scope/{id}` → `/reports/opportunities/[id]/scope/[id]`
  - `/reports/prospecting/{campaignId}/prospects/{prospectId}` → `/reports/prospecting/[id]/prospects/[id]`
  - Static feature paths preserved: `/reports/growth`, `/reports/growth/utm-builder`, `/reports/growth/conversion`, `/reports/growth/attribution`, `/reports/growth/content`, `/reports/clients`, `/reports/opportunities`, `/reports/prospecting`
  - `/payment/return?session_id=…` → path kept; Stripe session / payment_intent query stripped
- Public/private boundary documented in growth measurement framework.
- Acquisition Capture V1 stores bounded marketing fields in first-party DB / browser storage only — never PII, commercial IDs, or secure tokens in attribution JSON or GA4.

## Authority boundaries

| Concern | Authority |
|---|---|
| Marketing behavior / funnel events | GA4 (observational) |
| Professional audit payment | Stripe + `ReportPurchase` |
| Commercial payments / agreements | Stripe + commercial tables |
| Opportunity / client counts | First-party DB aggregates |

## Internal tools

- `/reports/growth` — funnel aggregates + manual baseline snapshots + acquisition coverage
- `/reports/growth/utm-builder` — campaign URL tagging (Facebook / GBP / generic)
- `/reports/growth/attribution` — privacy-safe recent acquisition observations
- `/reports/growth/conversion` — Lead Conversion Intelligence detail
