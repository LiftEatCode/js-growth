# Cross-Channel Growth Intelligence — Research Notes (2026)

**Research date:** 2026-08-25  
**Sprint:** Growth Sprint 13  
**Purpose:** Ground `CROSS_CHANNEL_INTELLIGENCE_VERSION = 1` in first-party / official guidance and JS Solutions operating rules. Do not treat marketing-blog claims as FACT.

Label legend:

| Label | Meaning |
|---|---|
| **FACT** | Observable product or API behavior documented by the vendor or already true in this codebase |
| **OFFICIAL_GUIDANCE** | Vendor help / developer docs recommendation |
| **JS_SOLUTIONS_OPERATING_RULE** | Internal operating choice for dogfood — not industry law |
| **INFERENCE** | Reasonable conclusion from FACT + guidance; still not causation |
| **HYPOTHESIS** | Testable belief; must not be presented as measured outcome |

---

## 1. Attribution boundaries (GA4)

**OFFICIAL_GUIDANCE** — Google Analytics Help (*Get started with attribution*, Advertising workspace): attribution assigns credit for key events to touchpoints along a path. Current Attribution reports expose three models: Data-driven, Paid and organic last click, Google paid channels last click. Older rule-based models (first click, linear, time decay, position-based) are no longer available (deprecated Nov 2023). Direct visits are excluded from credit unless the path is entirely direct.

**OFFICIAL_GUIDANCE** — Google documents assisted / path analysis in Advertising (Conversion attribution analysis): assists are early touchpoints that were not last click; data-driven views may bucket Early / Mid / Late. These are **reporting constructs inside GA4**, not proof that a marketing channel caused revenue in the CRM.

**FACT** — JS Solutions already treats commercial outcomes (Lead, Opportunity, Proposal, Agreement, Payment, Client) as **server-side business metrics**. GA4 holds public analytics events only. Growth Engine first-party `attributionJson` is a bounded UTM/referrer bundle — not a GA4 data-driven model.

**JS_SOLUTIONS_OPERATING_RULE** — Cross-channel intelligence must not equate GA4 last-click (or data-driven fractional credit) with CRM attribution. Prefer:

- **ATTRIBUTED** — first-party tagged journey joins to an audit/contact/inbound lead
- **OBSERVED** — channel metric moved in the same window without join proof
- **INFERRED** — weak join (e.g. inbound without UTM)
- **HYPOTHESIS** — operator belief, never auto-promoted to FACT

**INFERENCE** — Assisted conversions in GA4 can justify *watching* upper-funnel channels; they do not justify claiming “Facebook caused payment” without first-party evidence.

---

## 2. Search Console scope vs website analytics

**OFFICIAL_GUIDANCE** — Search Console Help (*What are impressions, position, and clicks?*):

- Impressions: how often a link to the property appeared on Google (visibility construct; scroll-into-view rules vary by result type)
- Clicks: how often a user clicked from Google to the site
- CTR: clicks ÷ impressions
- Position: relative ranking diagnostic for Search results

**OFFICIAL_GUIDANCE** — Search Central Blog (*Performance data deep dive*, 2022) and Performance report aggregation docs: privacy filtering removes rare queries from tables while chart totals may still include them; property vs page aggregation changes CTR/position totals; UI/API row limits apply. Data is directional, not a precise audit ledger.

**FACT** — GSC does not report CRM leads, opportunities, or Stripe payments. GSC ≠ GBP Insights.

**JS_SOLUTIONS_OPERATING_RULE** — Search visibility (impressions/clicks) is a **LEADING** discovery signal. Landing-path → audit joins may be ATTRIBUTED via first-party capture. Keyword → payment is **not** claimed without an explicit evidence chain.

**JS_SOLUTIONS_OPERATING_RULE** — Title/snippet CTR review requires ≥ **100 impressions** (existing Content Review threshold). Below that: KEEP_MONITORING / WATCH — never “CTR is broken.”

---

## 3. Google Business Profile / Local

**OFFICIAL_GUIDANCE** — Business Profile Performance API exposes daily metrics (e.g. `WEBSITE_CLICKS`, `CALL_CLICKS`, Maps/Search impression families). Access may require Google allowlisting when quota is 0 after enabling the API.

**FACT** — Sprint 12.1 implemented READ-ONLY OAuth sync. Dashboard load must not call GBP APIs. Manual snapshots remain valid. Google project allowlisting for JS Solutions is **pending** (support case tracked internally — not for GA4 or public copy).

**JS_SOLUTIONS_OPERATING_RULE** — Represent pending allowlisting as `GBP_API_APPROVAL_PENDING` (WATCH / dependency), not a daily operator ERROR. Continue manual Local Growth cadence.

**FACT** — Generic `google.com` referrer is **not** GBP. GBP attribution requires canonical UTMs (`google_business_profile` / `organic_local`).

---

## 4. Meta / Facebook organic

**FACT** — JS Solutions Facebook measurement is primarily **manual content records + metric snapshots** plus first-party UTMs on website links. Organic reach/engagement ≠ website conversion ≠ revenue.

**INFERENCE** — Industry Meta Ads attribution window changes in 2026 (vendor reporting for paid) reinforce that platform-reported conversions and first-party website attribution will diverge; for organic dogfood, prefer first-party UTM joins over Meta Ads Manager claims.

**JS_SOLUTIONS_OPERATING_RULE** — Follower gain is not revenue attribution. Experiment 018 (website → Facebook follow) remains click ≠ follower. Active experiments block conflicting experiment recommendations.

**HYPOTHESIS** — Company vs founder track differences may matter for discovery; do not declare a winning format from n &lt; sample floors.

---

## 5. Correlation vs causation

**OFFICIAL_GUIDANCE** — GA4 data-driven attribution uses path models and (for ads) counterfactual-style contribution estimates inside Google’s ecosystem. That is still not a controlled experiment for organic dogfood channels.

**JS_SOLUTIONS_OPERATING_RULE** — Cross-channel intelligence is a **decision layer**, not a causal inference engine. Bottlenecks are “most defensible observations given evidence,” not proven root causes. Language must stay:

- “Visibility is emerging; conversion evidence insufficient.”
- Never: “SEO is working” / “This will generate $X.”

---

## 6. Small-sample safety

**JS_SOLUTIONS_OPERATING_RULE** (reuse Lead Conversion Intelligence):

| n | Label |
|---|---|
| ≤ 4 | INSUFFICIENT_DATA |
| 5–19 | EARLY_DIRECTIONAL |
| ≥ 20 | USABLE |

Rates require denominator ≥ 5. Unknown ≠ zero. Blank ≠ observed zero.

**FACT** — Content Review already uses NONE / WEAK / DIRECTIONAL / MEANINGFUL with impression/click floors. Cross-channel reuses that ladder; it does not invent “statistically significant.”

---

## 7. Leading vs lagging (classification, not causal chain)

**JS_SOLUTIONS_OPERATING_RULE**

| Class | Examples |
|---|---|
| LEADING | Impressions, profile views, Facebook reach, website visits, audit starts, content engagement, GBP website clicks |
| MID_FUNNEL | Audit completion, contact submission, inbound lead, qualified lead, follow-up response |
| LAGGING | Opportunity, proposal, agreement, payment, client |

These classify evidence for priority weighting (commercial proximity). They are **not** a guaranteed sequential funnel for every journey.

---

## 8. Funnel & content distribution measurement

**FACT** — Existing KPI hierarchy (Levels 1–5) forbids celebrating visibility without intent/conversion/business movement.

**JS_SOLUTIONS_OPERATING_RULE** — Content feedback chain for published assets:

Published → Distributed? → Traffic observed? → Conversion observed? → Pipeline signal? → Review due?

Each hop keeps ATTRIBUTED / OBSERVED / INFERRED / HYPOTHESIS. A Facebook derivative with engagement does **not** prove the source SEO asset caused business outcomes.

---

## 9. Channel health without a fake score

**JS_SOLUTIONS_OPERATING_RULE** — No Growth Score / 0–100 composite. Per-channel states only:

`NO_DATA` · `INSUFFICIENT_DATA` · `BASELINE` · `MONITORING` · `NEEDS_ATTENTION` · `DIRECTIONAL_POSITIVE` · `DIRECTIONAL_NEGATIVE` · `ACTION_REQUIRED`

States require justifying evidence. Example: indexed `/seo`, impressions growing, clicks tiny, no attributable leads → `DIRECTIONAL_POSITIVE` with explicit conversion insufficiency — not “SEO is working.”

---

## 10. OpenAI / AI boundary

**JS_SOLUTIONS_OPERATING_RULE** — Sprint 13 V1: **OPENAI CALLS = 0**. Deterministic facts → interpretations → (future) hypotheses interface may later feed advisory AI. Do not ship AI summaries because the API exists.

---

## 11. Privacy

**FACT** — Existing GA4 sanitization forbids PII, commercial IDs, Google account/location IDs, OAuth tokens, review text. Cross-channel dashboard emits counts, public-safe slugs, channel labels, bounded states.

---

## Sources consulted (official / first-party preference)

1. Google Analytics Help — Get started with attribution  
2. Google Analytics Help — Attribution model / key event reporting notes; What’s new (assisted conversion analysis)  
3. Search Console Help — Impressions, clicks, position, CTR  
4. Google Search Central Blog — Performance data filtering and limits  
5. Google Business Profile Performance API reference  
6. Existing JS Growth research: acquisition-capture, lead-conversion, local/GBP, content-performance-review  

Third-party Meta attribution change write-ups (2026) treated as **INFERENCE context only** for paid platform reporting — not as organic measurement authority for this sprint.

---

## Operating conclusions for implementation

1. Derive intelligence from persisted internal evidence; dashboard load external APIs = 0.  
2. Prefer derived report over new Prisma tables unless weekly history cannot be reconstructed.  
3. Consolidate NOW/NEXT/WATCH across subsystems with commercial proximity outranking marketing busywork.  
4. Protect active experiments and review windows.  
5. Surface attribution health as a first-class signal before ranking channels by conversion.  
6. GBP allowlisting pending stays WATCH/dependency until approved.
