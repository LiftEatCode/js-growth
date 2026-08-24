# Content Review V1

**CONTENT_REVIEW_VERSION = 1**  
Builds on **CONTENT_PERFORMANCE_VERSION = 1** (unchanged).

## Principle

Prefer **INSUFFICIENT_DATA / KEEP_MONITORING / NO_ACTION** over fabricated confidence.

Operator checkpoints (Day 7 / 28 / 90) are **not** ranking SLAs.

## Review windows

`POST_PUBLISH_QA` · `INDEXING_CHECK` · `DAY_7` · `DAY_28` · `DAY_90` · `MANUAL_REVIEW`

## Decisions

KEEP_MONITORING · NO_CHANGE · DISTRIBUTE_MORE · ADD_INTERNAL_LINKS · IMPROVE_CTA · EXPAND_CONTENT · REFRESH_CONTENT · REPURPOSE · CONSOLIDATE · ARCHIVE · INVESTIGATE

`REFRESH_CONTENT` is blocked when evidence is NONE/WEAK or labels are NO_DATA / INSUFFICIENT_DATA / EARLY_SIGNAL.

## Memory

Append-only `reviewHistory` inside `performanceJson` (bounded). No new Prisma model in V1.

## Human authority

System recommends. Humans decide. AI does not mutate pages in V1 (OpenAI = 0 for record review).

Attributed inbound activity may appear as a **BUSINESS_SIGNAL** fact. That is not “SEO successful” and does not auto-refresh.

## Experiment 018

Remains **QUEUED** — no soft follow CTA without dedicated measurement + UX proof.
