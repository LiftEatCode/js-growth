# Content Performance Review Research — 2026

**Research date:** 2026-08-23  
**Access date:** 2026-08-23  
**Purpose:** Ground Growth Sprint 8 (Content Performance Review & Optimization Engine V1) in official Search Console guidance.

Layers: **OFFICIAL** · **INFERENCE** · **HYPOTHESIS**

---

## OFFICIAL GUIDANCE

### 1. Performance metrics definitions

| Field | Value |
|---|---|
| **SOURCE** | Search Console Help — Performance report overview |
| **URL** | https://support.google.com/webmasters/answer/7576553 |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Clicks = clicks from Search to the property. Impressions = times the site appeared in results. CTR = clicks ÷ impressions. Average position = average topmost result position for the property/row. Newest chart data can be **preliminary** (dotted line) and may change. |
| **IMPLICATION** | Treat early/recent data carefully. Prefer comparable completed windows for decisions. |
| **JS SOLUTIONS DECISION** | Manual capture stores OBSERVED values; preliminary notes allowed; do not invent metrics. |

### 2. Page vs property aggregation

| Field | Value |
|---|---|
| **SOURCE** | Search Console Help — Performance report overview |
| **URL** | https://support.google.com/webmasters/answer/7576553 |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Chart totals are often property-aggregated; Pages / Search appearance table rows are page-aggregated. Chart and table totals can disagree for that reason. |
| **IMPLICATION** | Page-level `/seo` evidence must not be mixed into site Baseline V1 totals as if identical. |
| **JS SOLUTIONS DECISION** | Page captures live on `GrowthContentPlan.performanceJson`; Baseline V1 remains site-level and immutable. |

### 3. Comparing date ranges

| Field | Value |
|---|---|
| **SOURCE** | Search Console Help — Advanced filtering and comparison |
| **URL** | https://support.google.com/webmasters/answer/17011165 |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Operators can compare two date ranges (and other dimensions). Weekly/monthly granularity reduces day-of-week noise. |
| **IMPLICATION** | Reviews should compare like windows (7d vs prior 7d, 28d vs prior 28d) and label mismatches. |
| **JS SOLUTIONS DECISION** | Comparison helpers require matching window lengths; otherwise TREND = UNKNOWN. |

### 4. Position is diagnostic

| Field | Value |
|---|---|
| **SOURCE** | Search Console Help — Common tasks / position guidance |
| **URL** | https://support.google.com/webmasters/answer/17010961 |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Focus more on trends in impressions and clicks than on position alone. |
| **IMPLICATION** | Do not rewrite pages solely because average position ≈ 30. |
| **JS SOLUTIONS DECISION** | POSITION alone never triggers REFRESH_CONTENT; CTR/title review requires minimum impression evidence. |

### 5. CTR interpretation caution

| Field | Value |
|---|---|
| **SOURCE** | Search Console Help — Performance metrics |
| **URL** | https://support.google.com/webmasters/answer/7576553 |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | CTR is clicks/impressions when both exist. Tiny impression samples make CTR noisy. |
| **IMPLICATION** | No universal CTR benchmark; avoid title/snippet recommendations on tiny samples. |
| **JS SOLUTIONS DECISION** | TITLE_SNIPPET_REVIEW only when impressions ≥ internal minimum (documented in CONTENT_REVIEW_VERSION). |

### 6. Indexing / URL Inspection

| Field | Value |
|---|---|
| **SOURCE** | Search Console Help — URL Inspection |
| **URL** | https://support.google.com/webmasters/answer/9012288 |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Indexed status comes from Google’s crawl/index view for a URL; request indexing does not guarantee indexing. |
| **IMPLICATION** | Operator must record INDEXED only after confirmation. |
| **JS SOLUTIONS DECISION** | States: PUBLISHED_NOT_VERIFIED / INDEXING_REQUESTED / INDEXED / INDEXING_ISSUE / UNKNOWN. |

### 7. Content updates

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — Creating helpful, people-first content |
| **URL** | https://developers.google.com/search/docs/fundamentals/creating-helpful-content |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Do not change dates without substantive updates; refresh when content is outdated or improved for people. |
| **IMPLICATION** | Calendar alone ≠ refresh candidate. |
| **JS SOLUTIONS DECISION** | REFRESH_CONTENT requires human review decision + evidence — never automatic. |

---

## INFERENCE

| Topic | Statement |
|---|---|
| Review windows | Day 7 / 28 / 90 are **operator checkpoints**, not ranking SLAs. |
| Evidence strength | NONE → WEAK → DIRECTIONAL → MEANINGFUL based on sample + maturity + attribution quality — not “statistical significance.” |
| No data ≠ zero demand | Missing GSC rows mean NOT_CAPTURED / NO_DATA, not proof of zero search interest. |

---

## HYPOTHESIS

| Hypothesis | Status |
|---|---|
| Supporting blogs + internal links will lift `/seo` impressions after indexing. | HYPOTHESIS — test after INDEXED + enough windows. |
| Soft Website→Facebook follow (018) converts post-audit visitors. | HYPOTHESIS — remains QUEUED pending measurement-ready placement. |

---

## JS SOLUTIONS SPRINT 8 DECISIONS

1. `CONTENT_REVIEW_VERSION = 1` on top of existing `CONTENT_PERFORMANCE_VERSION = 1`.  
2. Persist append-only review history inside `performanceJson` (bounded) — no new table unless history outgrows safety.  
3. Prefer KEEP_MONITORING / NO_CHANGE / INSUFFICIENT_DATA over confident actions.  
4. Experiment 018 stays **QUEUED** (still no dedicated follow CTA event + UX proof).  
5. AI review optional later; V1 ships deterministic human-recorded reviews only (OpenAI = 0 on dashboard/review record).
