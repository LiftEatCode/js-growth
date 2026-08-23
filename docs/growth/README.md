# Growth Phase — Documentation Index

Growth Sprint 1 establishes a **trustworthy measurement and attribution baseline**.

**Principle:** Do not optimize what we cannot measure.

| Document | Purpose |
|---|---|
| [measurement-framework.md](measurement-framework.md) | Funnel stages, event taxonomy, KPIs, baselines |
| [baselines/growth-baseline-v1.md](baselines/growth-baseline-v1.md) | **Growth Baseline V1** verified production numbers (2026-08-23) |
| [utm-conventions.md](utm-conventions.md) | Canonical UTM taxonomy + Facebook/GBP conventions |
| [experiment-template.md](experiment-template.md) | Template for future growth experiments |
| [client-talking-points.md](client-talking-points.md) | Client-safe methodology language |
| [CHANGELOG.md](CHANGELOG.md) | Dated log of major growth actions |
| [audit-funnel.md](audit-funnel.md) | **AUDIT_FUNNEL v1** — deterministic step definitions |
| [ga4-audit-funnel.md](ga4-audit-funnel.md) | Operator GA4 Funnel Exploration setup |
| [experiments/](experiments/) | Sprint 2 sequential experiments (001–004) |
| [../research/audit-conversion-funnel-2026.md](../research/audit-conversion-funnel-2026.md) | Sprint 2 research + GA4 lead-event decision |

## Internal tools

| Route | Purpose |
|---|---|
| `/reports/growth` | Growth dashboard (internal aggregates + snapshots) |
| `/reports/growth/utm-builder` | Consistent campaign URL tagging |

## Code

| Path | Role |
|---|---|
| `src/lib/growth/` | Events, UTM, attribution, snapshots, funnel metrics |
| `src/lib/analytics/` | GA sanitizer + page path privacy |
| `GrowthSnapshot` (Prisma) | Immutable baseline snapshots |

## Out of scope (Growth Sprint 1–2)

SEO content generation, Facebook Growth Engine, paid ads, Meta Pixel, GBP optimizer SaaS, traffic prediction AI, client-facing analytics portal.
