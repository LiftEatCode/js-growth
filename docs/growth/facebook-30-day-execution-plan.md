# Facebook 30-Day Execution Plan

**Version:** facebook-execution-v1  
**Execution window:** 2026-08-24 → 2026-09-22  
**Baseline anchor:** Growth Baseline V1 (immutable) — 75 followers  
**Label:** EXPERIMENTAL OPERATING CADENCE (not optimal)

Research refresh (2026-08-23): Meta still does not publish a universal organic posting quota. Business Suite Insights remains the source for audience activity timing. Industry “3–5 posts/week” figures are **hypothesis**, used only as capacity guidance.

---

## FACT / HYPOTHESIS / TEST (execution additions)

**FACT:** Meta documents Feed ranking + engagement-bait demotion; Insights exist in Business Suite.  
**HYPOTHESIS:** For JS Solutions at ~75 followers, 3–5 company + 2–4 founder posts/week balances observation volume with quality/reply capacity.  
**TEST:** Hold experimental cadence for 30 days; recalibrate after Week 2 if fatigue or unused capacity appears.

**FACT:** Recommended/non-follower content is part of Feed.  
**HYPOTHESIS:** Soft follow CTAs on high-reach posts improve follower conversion from discovery.  
**TEST:** Experiment 2026-016 after publisher/link lessons.

---

## 30-day TARGET bands (goals, not forecasts)

| Metric | Floor | Target | Stretch | Why |
|---|---|---|---|---|
| Followers (absolute gain from 75) | +5 | +10 | +18 | Floor proves loop; target meaningful social proof; stretch strong conversion |
| Page visits (period) | 12 | 20 | 35 | Baseline period had 9 |
| Engagements (period) | 12 | 25 | 45 | Baseline period had 5; prefer comments over bait |
| Non-follower % | observe | observe | observe | Track direction — do not maximize vanity discovery |
| FB-attributed audit starts | 1 | 3 | 6 | Proves attribution path |

No revenue forecasts.

---

## Experimental operating cadence

| Publisher | Floor | Target | Stretch |
|---|---|---|---|
| COMPANY Page | 3/wk | 4/wk | 5/wk |
| FOUNDER | 2/wk | 3/wk | 4/wk |

Rules: quality + replies &gt; volume; no engagement bait; isolate experiments; weekly Monday FACEBOOK GrowthSnapshot.

---

## Company vs founder tracks

**COMPANY:** authority, proof, education, resources, audits, professional credibility.  
**FOUNDER:** trust, lessons, opinions, BTS, SMB observations, conversations.  
No exact duplicate posts. Cross-post only with reframing + separate ledger/UTM.

---

## Experiment sequencing

| Slot | ID | Focus |
|---|---|---|
| CURRENT | 2026-012 | Company vs founder |
| NEXT | 2026-011 | Native vs link |
| BACKLOG | 017 → 016 → 010 → 015 → 013 → 014 → 018 | Discussion, follow CTA, formats, CTAs, edu/proof, website→FB |

Do not run all at once.

---

## Content schedule

Authoritative code schedule: `FACEBOOK_30_DAY_SCHEDULE` in `src/lib/growth/facebook-execution.ts` (also rendered on `/reports/growth` “today” view).

Measurement checkpoints per post: INITIAL (if metrics at create) → HOURS_72 → DAYS_7 via `GrowthContentMetricSnapshot`.

---

## Operator lifecycle

PLAN → CREATE → UTM IF NEEDED → PUBLISH → RECORD CONTENT → INITIAL METRICS → 72H → 7D → WEEKLY REVIEW → EXPERIMENT DECISION → ITERATE

Checklist: `docs/growth/facebook-weekly-review.md` + dashboard due queue.

---

## Website → Facebook

Experiment 018 **QUEUED**. Reason: stabilize ledger/checkpoints first. Candidate later: single soft follow on audit thank-you (not sitewide).

---

## Week 1 exact actions

1. Complete Page optimization checklist items marked NEEDS ACTION.  
2. Monday: FACEBOOK GrowthSnapshot.  
3. Publish scheduled company/founder posts; record ledger rows.  
4. Start 2026-012 (matched topic, different publishers).  
5. Capture 72h metrics for early posts via Edit / Record Metrics.  
6. Do not start additional experiments until 012 has directional notes.
