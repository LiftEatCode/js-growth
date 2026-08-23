# Growth Phase — Documentation Index

Growth Sprints 1–3 establish measurement, audit conversion, and the Facebook organic distribution engine.

**Principle:** Do not optimize what we cannot measure. Grow followers and revenue — measure both.

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
| [experiments/](experiments/) | Sprint 2 (001–004) + Sprint 3 Facebook (010–018) |
| [../research/audit-conversion-funnel-2026.md](../research/audit-conversion-funnel-2026.md) | Sprint 2 research |
| [../research/facebook-organic-growth-2026.md](../research/facebook-organic-growth-2026.md) | Sprint 3 Meta research (FACT/HYPOTHESIS/TEST) |

## Internal tools

| Route | Purpose |
|---|---|
| `/reports/growth` | Growth dashboard (baseline, audit funnel, **Facebook panel**, snapshots, content ledger) |
| `/reports/growth/utm-builder` | Consistent campaign URL tagging (company / founder presets) |

## Code

| Path | Role |
|---|---|
| `src/lib/growth/` | Events, UTM, attribution, snapshots, funnel, **facebook-growth-v1**, content ledger |
| `src/lib/analytics/` | GA sanitizer + page path privacy |
| `GrowthSnapshot` (Prisma) | Immutable baseline snapshots |
| `GrowthContentRecord` (Prisma) | Manual Facebook content performance ledger |

## Out of scope (through Growth Sprint 3)

SEO content generation automation, Meta Graph API sync, Meta Pixel/CAPI, paid ads engine, GBP optimizer SaaS, traffic prediction AI, client-facing analytics portal.
