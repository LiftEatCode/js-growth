# Content Performance V1

**CONTENT_PERFORMANCE_VERSION = 1**

## Principle

Sprint 6 answered what to say and how to develop it.  
Sprint 7 answers: we published it — what happened, and what should that evidence change?

Observed performance informs deterministic recommendations. It does **not** auto-modify production content.

## Publication model

One content plan → zero or one primary published asset in V1.

Stored on `GrowthContentPlan`:

- `status` → `PUBLISHED` (operator only; requires prior `APPROVED` + URL + canonical draft)
- `publishedUrl`, `publishedAt`
- `performanceJson` (`ContentPerformanceStateV1`)

No separate `GrowthPublishedAsset` table in V1.

Canonical draft authority: `humanDraftJson` > `generationJson`. AI candidate is never publication authority.

## Measurement lifecycle

`NOT_PUBLISHED` → `PUBLISHED_AWAITING_DATA` → `EARLY_DATA` → `MEASURING` → `ENOUGH_DATA_FOR_REVIEW` → optional `REFRESH_CANDIDATE`

Indexing states: `PUBLISHED_NOT_VERIFIED` | `INDEXING_REQUESTED` | `INDEXED` | `INDEXING_ISSUE` | …

Pre-measurement metrics use **NO_DATA**, not fabricated historical zeros.

## Review (Sprint 8)

See [content-review.md](content-review.md). Reviews append to `performanceJson.reviewHistory` and never auto-mutate production pages.

## Evidence kinds

ATTRIBUTED · OBSERVED · INFERRED · HYPOTHESIS

Never treat Search impressions as proof of business causation.

## Public-safe analytics slug

`seo_service_page` — never GrowthContentPlan cuid in GA4/UTM.

## Code

- `src/lib/growth/content-performance.ts`
- `src/lib/growth/content-distribution.ts`
- `/seo` production page
