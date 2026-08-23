# Search Opportunity Model

**Version:** search-intelligence-v1

## Purpose

Represent opportunities with provenance so Sprint 6 can generate briefs without inventing demand.

## Fields (persisted + seed)

| Field | Notes |
|---|---|
| slug | Unique kebab-case id |
| topic | Bounded topic enum |
| queryConcept | Concept / query theme (not volume) |
| intent | Bounded intent |
| pageType | SERVICE, BLOG, TOOL, LOCAL, … |
| source | Provenance enum |
| evidenceKind | FIRST_PARTY / OFFICIAL / MANUAL / INFERENCE / HYPOTHESIS |
| status | IDEA → … → MONITORING / ARCHIVED |
| priorityBand | NOW / NEXT / LATER |
| priorityScore | Diagnostic only |
| currentPagePath | Existing URL if any |
| recommendedPath | Proposed URL if any |
| locationContext | Optional local context |
| notes | Operator notes |

## Status flow

`IDEA` → `VALIDATED` → `PLANNED` → `IN_PROGRESS` → `PUBLISHED` → `MONITORING` → `REFRESH` or `ARCHIVED`

## What we never store

- Fabricated monthly search volume
- Guaranteed rank / traffic / lead forecasts
- Arbitrary PII from sensitive query strings without review
- Commercial/client/project IDs

## Seed backlog (code)

See `SEARCH_OPPORTUNITY_SEEDS` in `src/lib/growth/search-intelligence.ts`. Operators persist via `/reports/growth`.

## Website vs search competitors

Competitive Intelligence website scores ≠ search SERP competitors. Document search competitors manually; do not scrape against provider terms.
