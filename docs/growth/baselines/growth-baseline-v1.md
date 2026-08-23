# Growth Baseline V1

**Status:** RECORDED  
**Version:** `GROWTH_BASELINE_VERSION = 1`  
**Label:** Growth Baseline V1  
**Recorded:** 2026-08-23  
**Measurement window:** 2026-07-26 → 2026-08-22 (28 days)  
**Code source of truth:** `src/lib/growth/baseline-v1.ts`

This baseline is the initial measurable production state **before Growth Sprint 2** optimization. Future Growth Sprints must compare against it rather than silently replacing it.

**Core rule:** Never improve the appearance of this baseline by estimating, backfilling, converting unknowns to zero, or selecting more favorable windows.

---

## Sources

| Source | Status |
|---|---|
| Google Search Console — property `js-growth.com` | VERIFIED |
| Google Analytics 4 — production `G-0REXF012SK` | Instrumentation VERIFIED WORKING (Realtime) |
| JS Solutions Facebook Professional Dashboard | Manual capture for Page metrics |

No GA4 / GSC / Meta API integrations were used to populate this baseline.

---

## Search Console

**Homepage inspection (`https://js-growth.com/`):** on Google · indexed · eligible to appear · HTTPS valid.

| Metric | Value |
|---|---|
| Total clicks | **0** |
| Total impressions | **2** |
| Average CTR | **0%** |
| Average position | **77** |
| Query-level data | **INSUFFICIENT_DATA** |
| Page-level ranking breakdown | **INSUFFICIENT_DATA** |

**Important:** INSUFFICIENT_DATA must not be converted into “zero queries.” Search volume is too low for GSC to expose meaningful query breakdowns.

**Interpretation:** Early-stage organic visibility baseline. Indexed and eligible — **not** characterized as an indexing problem. Clean starting point for SEO growth measurement.

---

## Google Analytics 4

| Item | Value |
|---|---|
| Measurement ID | `G-0REXF012SK` (ops config; not an analytics event param) |
| Production tracking | VERIFIED WORKING via Realtime (2026-08-23) |
| Historical traffic totals (users/sessions/…) | **NOT_CAPTURED** |

Realtime is evidence that instrumentation works — **not** a historical traffic baseline. Do not manufacture traffic totals from Realtime tests.

### Observed Realtime events

`page_view`, `audit_landing_view`, `audit_started`, `audit_submitted`, `audit_completed`, `first_visit`

### Verified funnel path

`audit_landing_view` → `audit_started` → `audit_submitted` → `audit_completed`

### Key-event candidates (business outcomes)

- `audit_submitted`
- `contact_form_submitted`

### MONITOR_EVENT_CARDINALITY

During initial Realtime validation:

- `audit_submitted` = 1
- `audit_completed` = 2

**Not classified as a confirmed defect.** Sample size is too small to determine whether `audit_completed` can duplicate per audit. Future QA should verify completion-event cardinality before relying heavily on completion-rate calculations.

---

## Facebook (JS Solutions Page)

**Period:** 2026-07-26 → 2026-08-22  
**Property:** JS Solutions Page only (founder/personal kept separate).

| Metric | Value |
|---|---|
| Total followers | **75** |
| Follower change vs previous 28d | **+2.7%** |
| Visits | **9** |
| Visit change vs previous 28d | **−78.6%** |
| Engagements | **5** |
| Engagement change vs previous 28d | **+100%** |
| Views — non-followers | **95.3%** |
| Views — followers | **4.7%** |
| Views — Photo | **90.3%** |
| Views — Text | **7.0%** |
| Views — Link | **2.6%** |
| Engagement — non-followers | **100%** |
| Engagement — followers | **0%** |
| Engagement type — Reactions | **100%** |
| Total Views (headline) | **NOT_CAPTURED** |
| Top fans | **INSUFFICIENT_DATA** |
| Audience demographics | **INSUFFICIENT_DATA** |
| How people find content | **INSUFFICIENT_DATA** |

**Important:** Do **not** estimate Total Views from dashboard graphs. NOT_CAPTURED remains explicit.

**Interpretation / hypothesis (not causation):** Discovery extends beyond followers (95.3% non-follower views), but visits (9) and engagements (5) are low. Test improving:

content exposure → engagement → profile/page visit → website visit → audit start → audit submission → lead → opportunity → client

Photos dominate views/engagement in this window — continue strong visual content while testing formats (e.g. Reels). Insufficient data to conclude Reels perform worse.

---

## Funnel we measure against

```
Facebook / Search / GBP / Direct / Referral
        ↓
Website Session
        ↓
Qualified Visit
        ↓
Audit Landing
        ↓
Audit Started
        ↓
Audit Submitted
        ↓
Audit Completed
        ↓
Professional Audit CTA / Contact
        ↓
Lead / Prospect
        ↓
Opportunity
        ↓
Proposal
        ↓
Agreement
        ↓
Payment
        ↓
Client
```

Growth analytics observe the commercial pipeline; Stripe/database remain commercial/payment authority.

KPI hierarchy (L1 Business → L5 Visibility) from Growth Sprint 1 is unchanged.

---

## Future comparison targets

**Search:** impressions, clicks, CTR, average position, ranking queries, ranking pages  

**Facebook:** views, reach (where available), engagements, visits, followers, follower growth, non-follower distribution, website/link traffic  

**Website:** users, sessions, qualified visits, audit landing views, starts, submissions, completions, contact submissions, professional audit CTA clicks  

**Business:** prospects, opportunities, proposals, accepted agreements, deposits/payments, clients, attributed revenue where authoritative  

Unavailable Baseline V1 values stay NULL / NOT_CAPTURED / INSUFFICIENT_DATA — never fabricated.

---

## Persistence

Canonical constant: `src/lib/growth/baseline-v1.ts`  

Immutable `GrowthSnapshot` rows (SEARCH_CONSOLE, GA4, FACEBOOK) with `baselineVersion: 1` for the same period — created via `ensureGrowthBaselineV1Snapshots` (idempotent; no external APIs).

---

## Limitations

See `GROWTH_BASELINE_V1.limitations` in code. Summary: low GSC volume; Facebook Total Views not captured; GA4 historical totals not captured from Realtime; event cardinality monitoring only.

---

## Next measurement process

Before Growth Sprint reviews, re-pull comparable windows, record new GrowthSnapshots, and compare against **Growth Baseline V1** without backfilling unknowns.

**Next review cadence:** at the start of Growth Sprint 2 planning and after each material growth experiment.
