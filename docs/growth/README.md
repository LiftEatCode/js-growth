# Growth Phase — Documentation Index

Growth Sprint 1 establishes a **trustworthy measurement and attribution baseline**.

**Principle:** Do not optimize what we cannot measure.

| Document | Purpose |
|---|---|
| [measurement-framework.md](measurement-framework.md) | Funnel stages, event taxonomy, KPIs, baselines |
| [utm-conventions.md](utm-conventions.md) | Canonical UTM taxonomy + Facebook/GBP conventions |
| [experiment-template.md](experiment-template.md) | Template for future growth experiments |
| [client-talking-points.md](client-talking-points.md) | Client-safe methodology language |
| [CHANGELOG.md](CHANGELOG.md) | Dated log of major growth actions |
| [../research/growth-measurement-attribution.md](../research/growth-measurement-attribution.md) | Research + sources |

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

## Out of scope (Growth Sprint 1)

SEO content generation, Facebook automation, paid ads, GBP optimizer SaaS, traffic prediction AI, client-facing analytics portal.
