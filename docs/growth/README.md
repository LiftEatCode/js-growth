# Growth Phase — Documentation Index

Growth Sprints 1–6 establish measurement, audit conversion, Facebook organic distribution/execution, Search Intelligence, and **Content Intelligence V1**.

**Principle:** Do not optimize what we cannot measure. For content: decide what the business needs to say next before asking AI to write.

| Document | Purpose |
|---|---|
| [measurement-framework.md](measurement-framework.md) | Funnel stages, event taxonomy, KPIs, baselines |
| [baselines/growth-baseline-v1.md](baselines/growth-baseline-v1.md) | **Growth Baseline V1** verified production numbers (2026-08-23) — **immutable** |
| [utm-conventions.md](utm-conventions.md) | Canonical UTM taxonomy + Facebook company/founder conventions |
| [experiment-template.md](experiment-template.md) | Template for growth experiments |
| [client-talking-points.md](client-talking-points.md) | Client-safe methodology language |
| [CHANGELOG.md](CHANGELOG.md) | Dated log of major growth actions |
| [audit-funnel.md](audit-funnel.md) | **AUDIT_FUNNEL v1** — deterministic step definitions |
| [ga4-audit-funnel.md](ga4-audit-funnel.md) | Operator GA4 Funnel Exploration setup |
| [facebook-organic-playbook.md](facebook-organic-playbook.md) | **INTERNAL** Facebook operating decisions (`facebook-growth-v1`) |
| [facebook-content-operating-system.md](facebook-content-operating-system.md) | Jobs, pillars, formats, cadence, UTM, workflows |
| [facebook-weekly-review.md](facebook-weekly-review.md) | Weekly Facebook review checklist |
| [facebook-30-day-execution-plan.md](facebook-30-day-execution-plan.md) | Sprint 4 experimental 30-day plan + cadence + sequencing |
| [facebook-30-day-review-template.md](facebook-30-day-review-template.md) | Day-30 review template |
| [facebook-sprint4-production-acceptance.md](facebook-sprint4-production-acceptance.md) | Sprint 4 operator acceptance |
| [search-intelligence.md](search-intelligence.md) | **SEARCH_INTELLIGENCE_VERSION = 1** operating system |
| [search-opportunity-model.md](search-opportunity-model.md) | Opportunity fields, status, provenance |
| [search-weekly-review.md](search-weekly-review.md) | Weekly search review (no daily busywork) |
| [content-brief-contract.md](content-brief-contract.md) | Sprint 6 brief handoff contract |
| [search-sprint5-production-acceptance.md](search-sprint5-production-acceptance.md) | Sprint 5 operator acceptance |
| [content-intelligence.md](content-intelligence.md) | **CONTENT_INTELLIGENCE_VERSION = 1** |
| [content-development-workflow.md](content-development-workflow.md) | Brief → draft → approve → publish |
| [content-quality-review.md](content-quality-review.md) | Claim safety + readiness |
| [content-sprint6-production-acceptance.md](content-sprint6-production-acceptance.md) | Sprint 6 acceptance |
| [blog-google-visibility-distribution.md](blog-google-visibility-distribution.md) | FB/GBP/video handoff for visibility article |
| [experiments/](experiments/) | Sprint 2 (001–004) + Sprint 3 Facebook (010–018) |
| [../research/audit-conversion-funnel-2026.md](../research/audit-conversion-funnel-2026.md) | Sprint 2 research |
| [../research/facebook-organic-growth-2026.md](../research/facebook-organic-growth-2026.md) | Sprint 3 Meta research (FACT/HYPOTHESIS/TEST) |
| [../research/seo-search-intelligence-2026.md](../research/seo-search-intelligence-2026.md) | Sprint 5 Google Search research |
| [../research/blog-google-visibility-2026.md](../research/blog-google-visibility-2026.md) | Visibility article research note |

## Internal tools

| Route | Purpose |
|---|---|
| `/reports/growth` | Growth dashboard (baseline, funnel, Search Intelligence, Facebook) |
| `/reports/growth/content` | **Content Intelligence** (plans, briefs, operator-gated drafts) |
| `/reports/growth/utm-builder` | Consistent campaign URL tagging (company / founder presets) |

## Code

| Path | Role |
|---|---|
| `src/lib/growth/` | Events, UTM, attribution, snapshots, funnel, Facebook, **search-intelligence-v1** |
| `src/lib/analytics/` | GA sanitizer + page path privacy |
| `GrowthSnapshot` (Prisma) | Immutable baseline snapshots |
| `GrowthContentRecord` (Prisma) | Manual Facebook content performance ledger |
| `GrowthSearchOpportunity` (Prisma) | Search opportunity backlog + Sprint 6 handoff |
| `GrowthContentPlan` (Prisma) | Content plans, briefs, drafts, human approval |

## Out of scope (through Growth Sprint 6)

Mass SEO content generation, auto-publishing, Facebook/GBP auto-posting, Search Console API OAuth, Meta Graph API sync, Meta Pixel/CAPI, paid ads engine, GBP optimizer SaaS, traffic prediction AI, mass location doorway pages, client-facing analytics portal.
