# Facebook Organic Playbook (INTERNAL) — `facebook-growth-v1`

**Audience:** JS Solutions operators only.  
**Client-facing principles:** `docs/growth/client-talking-points.md`  
**Research:** `docs/research/facebook-organic-growth-2026.md`  
**Baseline:** Growth Baseline V1 (immutable) — 75 followers, 9 visits, 5 engagements, 95.3% non-follower views.

---

## WHAT WE KNOW

1. Meta ranks Feed with inventory → signals → predictions → relevance score; mixes connected + recommended content.
2. Engagement bait and repeatedly unoriginal content are demoted.
3. Our Page already shows high non-follower exposure (hypothesis-generating, not proof).
4. First-party UTMs can separate company vs founder website outcomes without Meta API.
5. Manual Facebook Insights + first-party DB is V1 measurement (Meta API = later).

## WHAT WE THINK

1. Dual distribution (Page + founder) can cover different inventory and trust jobs.
2. Native educational/proof content will outperform bare link dumps for reach.
3. Soft, non-bait CTAs can convert discovery → Page visits → follows.
4. Audience size/engagement contribute to perceived legitimacy for a small service business — without replacing commercial metrics.

## WHAT WE ARE TESTING

Experiments A–H + website→Facebook follow loop (see `docs/growth/experiments/`).

Primary decision rule: move layer-by-layer on the scorecard — do not celebrate reach that never produces follows, traffic, audits, or opportunities.

## WHAT THE DATA CURRENTLY SAYS

As of Baseline V1 (2026-07-26 → 2026-08-22):

| Metric | Value |
|---|---|
| Followers | 75 |
| Visits | 9 |
| Engagements | 5 |
| Non-follower views | 95.3% |
| Photo views | 90.3% |
| Total views | NOT_CAPTURED |
| Top fans / demographics | INSUFFICIENT_DATA |

Until post-baseline snapshots and content ledger rows accumulate, treat format winners as **unknown**.

---

## Operating decisions (V1)

| Decision | Choice |
|---|---|
| Measurement | Manual FB metrics + automatic first-party attribution |
| Publishers | COMPANY Page + FOUNDER personal (separate jobs/UTMs) |
| Primary job per post | Required (`GrowthContentRecord.contentJob`) |
| Link strategy | Native first; UTM when linking off-platform |
| Engagement bait | Forbidden |
| Meta API on dashboard | Forbidden (0 side effects) |
| North Star | Balanced scorecard (not followers-only, not revenue-only) |
| Follower targets | Experimental TARGET framework — not forecasts |

## Scorecard layers

1. Distribution → 2. Engagement → 3. Audience/social proof → 4. Traffic → 5. Business

See `src/lib/growth/facebook-growth.ts`.

## Privacy

`utm_content` examples: `company_seo_mistakes_001`, `founder_lessons_001`.  
Never: client names, emails, opportunity IDs, secure tokens.
