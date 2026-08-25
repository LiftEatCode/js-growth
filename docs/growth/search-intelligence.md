# Search Intelligence Operating System

**SEARCH_INTELLIGENCE_VERSION = 1**

Goal: decide **what content should exist** so Sprint 6 can create it. Priorities ≠ ranking guarantees.

## Principle

SEARCH VISIBILITY → QUALIFIED TRAFFIC → ENGAGEMENT → AUDIT/CONTACT → OPPORTUNITY → CLIENT

Do not build an SEO content factory before demand, intent, and page inventory are understood.

## Capability investment tiers

| Category | Tier |
|---|---|
| Website Development | CORE_COMMERCIAL |
| SEO | CORE_COMMERCIAL |
| Local SEO | CORE_COMMERCIAL |
| GBP / Local Visibility | CORE_COMMERCIAL |
| Website Growth Audits | CORE_COMMERCIAL |
| Conversion Optimization | SUPPORTING_AUTHORITY |
| AI Automation | SUPPORTING_AUTHORITY |
| Business Automation | SUPPORTING_AUTHORITY |
| Analytics / Growth | SUPPORTING_AUTHORITY |
| Custom Software | FUTURE_PRODUCT |

## Taxonomies

- **Intents:** INFORMATIONAL, COMMERCIAL_INVESTIGATION, SERVICE, LOCAL_SERVICE, TOOL, COMPARISON, PROBLEM_SOLUTION, BRAND
- **Topics:** WEBSITE_GROWTH, WEB_DEVELOPMENT, SEO, LOCAL_SEO, GBP, CONVERSION, WEBSITE_AUDITS, CONTENT_TRAFFIC, AI_AUTOMATION, BUSINESS_AUTOMATION, CUSTOM_SOFTWARE, ANALYTICS_GROWTH
- **Evidence:** FIRST_PARTY_DATA, OFFICIAL_GUIDANCE, MANUAL_RESEARCH, INFERENCE, HYPOTHESIS
- **Sources:** GSC_QUERY, GSC_PAGE, SERVICE_GAP, CONTENT_GAP, CUSTOMER_QUESTION, COMPETITOR_OBSERVATION, LOCAL_INTENT, AUDIT_INSIGHT, MANUAL_RESEARCH

## Priority bands

Deterministic score → **NOW / NEXT / LATER** from commercial relevance, intent strength, content gap, audit funnel relevance, GSC evidence, effort.

Do **not** use fabricated search volumes. Do **not** promise rankings.

## Search Console stages

| Stage | Name | Enter when |
|---|---|---|
| 0 | INSUFFICIENT_DATA | Impressions &lt; 50 or query data insufficient |
| 1 | INITIAL_IMPRESSIONS | Impressions ≥ 50, thin queries |
| 2 | QUERY_DISCOVERY | Meaningful query rows (~20+) |
| 3 | CTR_OPTIMIZATION | ~100+ impressions per query/page |
| 4 | POSITION_CONTENT | Stable queries + click signal |
| 5 | COMPOUNDING_REFRESH | Repeat winners |

Baseline V1 = Stage 0.

## Snapshots

Manual `GrowthSnapshot` source `SEARCH_CONSOLE`. Preserve NOT_CAPTURED / INSUFFICIENT_DATA. No GSC API until collection is a bottleneck.

## Persistence

`GrowthSearchOpportunity` stores backlog status, priority, provenance for Sprint 6 handoff.

## Side-effect budget (dashboard)

Google APIs: 0 · Meta: 0 · OpenAI: 0 · Places: 0 · GBP API: 0 · paid crawl: 0 · Resend: 0 · Stripe: 0

## Local search + anti-doorway (Sprint 12)

Local / GBP Intelligence extends Search with **LOCAL_SEARCH** evidence separate from GSC. Magnolia-specific page decision: **`TEST_LATER`** with doorway protection — no thin city factories (`/seo-magnolia`, multi-city clones). Local opportunities must pass DISTINCT_USER_VALUE · INTENT · COLLISION · BUSINESS_RELEVANCE. Prefer strengthening `/local-seo` + accurate GBP over doorway expansion.

GSC measures website Search performance — **not** Maps/GBP profile actions. Do not infer Map pack rank from Search Console.

See [`local-growth-intelligence.md`](local-growth-intelligence.md). **LOCAL_GROWTH_VERSION = 1**.

## Code

- `src/lib/growth/search-intelligence.ts`
- `src/lib/growth/search-opportunity-store.ts`
- `/reports/growth` → Search Intelligence panel

## Docs

- [search-opportunity-model.md](search-opportunity-model.md)
- [search-weekly-review.md](search-weekly-review.md)
- [content-brief-contract.md](content-brief-contract.md)
- [search-sprint5-production-acceptance.md](search-sprint5-production-acceptance.md)
- [local-growth-intelligence.md](local-growth-intelligence.md)
- [../research/seo-search-intelligence-2026.md](../research/seo-search-intelligence-2026.md)
- [../research/local-search-gbp-intelligence-2026.md](../research/local-search-gbp-intelligence-2026.md)
