# Growth Change Log

Dated record of major growth actions. Correlate traffic/funnel changes with real work.

---

## 2026-08-24 — Growth Sprint 10 (Acquisition Capture & Attribution Completion V1)

- Research: `docs/research/acquisition-capture-attribution-2026.md`
- `ACQUISITION_CAPTURE_VERSION = 1`: first-observed (localStorage 90d) + session (sessionStorage) + conversion persistence
- Extends `attribution-v1` (no v2); no historical UNKNOWN backfill
- `ContactSubmission` model for durable contact attribution (no auto-Lead)
- `/reports/growth/attribution` debug view + Acquisition Coverage card
- GBP canonical UTMs (`gbp_profile`); Facebook company/founder presets preserved
- Experiment 018 ACTIVE — soft follow CTA + `facebook_follow_cta_clicked` (click ≠ follower)
- Baseline V1 unchanged; OpenAI/Meta/GSC/Places/Crawl = 0 on dashboard load

## 2026-08-24 — Growth Sprint 9 (Lead Conversion Intelligence V1)

- Research: `docs/research/lead-conversion-intelligence-2026.md`
- `LEAD_CONVERSION_INTELLIGENCE_VERSION = 1`: inbound vs outbound funnel, attribution strength, attention queue, pipeline value semantics, ROI_NOT_AVAILABLE
- `/reports/growth/conversion` + compact indicators on `/reports/growth`
- Commercial models remain authoritative (observe-only). No auto-email / auto-status / auto-opportunity
- Business signals may appear on content review; `/seo` gets no invented outcomes
- Baseline V1 unchanged; OpenAI/Meta/GSC API = 0 on dashboard load

## 2026-08-23 — Growth Sprint 8 (Content Performance Review & Optimization Engine V1)

- Research: `docs/research/content-performance-review-2026.md`
- `CONTENT_REVIEW_VERSION = 1` on existing performance contract (no Baseline rewrite)
- Review windows, evidence strength, decisions, due queue, CTR validation, refresh-plan workflow
- Append-only review history in `performanceJson`; UI on `/reports/growth/content`
- Prefer KEEP_MONITORING / INSUFFICIENT_DATA; block weak REFRESH
- Experiment 018 remains QUEUED
- OpenAI/Meta/GSC API = 0 on dashboard + record review

## 2026-08-23 — Growth Sprint 7 (Content Publishing, Distribution & Performance Feedback V1)

- Research: `docs/research/content-publishing-performance-2026.md`
- `CONTENT_PERFORMANCE_VERSION = 1`: measurement lifecycle, evidence kinds, learning (INSUFFICIENT_DATA for n=1)
- Production `/seo` service page + sitemap/nav/internal links; Service + BreadcrumbList schema (no FAQ rich-result schema)
- `GrowthContentPlan.publishedAt` + `performanceJson`; publish requires APPROVED; opportunity preserved as acted-on
- Recommendation feedback: `/seo` no longer “missing page”; collision `RELATED_EXISTING_CONTENT`
- Deterministic distribution plan + Facebook company derivative plans (no GrowthContentRecord / no auto-post)
- Experiment 018 remains QUEUED
- Baseline V1 unchanged; OpenAI/Meta/GSC API = 0 on dashboard load

## 2026-08-23 — Sprint 6 hardening: AI candidate vs human canonical draft

- Human drafts remain protected from silent overwrite.
- After human edit: **Regenerate from Brief** / **Revise with AI** write `candidateDraftJson` only.
- Explicit **Apply AI Revision** / **Discard Candidate**; Apply/Discard/save = 0 OpenAI.
- Persisted candidate + `aiBusyUntil` concurrency lock; APPROVED requires reopen before AI mutate.
- History ops: `INITIAL_GENERATE`, `REGENERATE_FROM_BRIEF`, `REVISE_CURRENT_DRAFT`, `APPLY_CANDIDATE`, `DISCARD_CANDIDATE`, `REOPEN_FOR_REVIEW`.
- Principle: **AI MAY PROPOSE. HUMANS CONTROL THE CANONICAL DRAFT.**
- Migration `20260823240000_growth_sprint6_candidate_draft`. Baseline V1 unchanged.

## 2026-08-23 — Growth Sprint 6 (Content Intelligence & Development Engine V1)

- Research: `docs/research/content-intelligence-ai-2026.md`.
- `CONTENT_INTELLIGENCE_VERSION = 1` + prompt versions; planner, collision, claim safety, business facts.
- Prisma `GrowthContentPlan`; `/reports/growth/content` operator UI.
- OpenAI draft path (Responses + zodTextFormat) — operator-initiated only; skeleton mode = 0 OpenAI.
- Initial five plans from Sprint 5; acceptance focus `seo-service-page-v1`.
- No auto-publish / mass generation / Facebook ledger before publish.
- Baseline V1 unchanged.

## 2026-08-23 — Blog: Small business not showing up on Google

- Published `/blog/small-business-not-showing-up-on-google` (PROBLEM_SOLUTION / SEO).
- Optional `seoTitle` on BlogPost for distinct document title vs H1.
- Cross-link with leads article; audit CTAs use `blog_cta_clicked`.
- Search Intelligence inventory + seed opportunity registered (MONITORING / Stage 0).
- Distribution ideas: `docs/growth/blog-google-visibility-distribution.md`.
- Research note: `docs/research/blog-google-visibility-2026.md`.
- No migration; Baseline V1 unchanged.

## 2026-08-23 — Growth Sprint 5 (SEO & Search Intelligence Engine V1)

- Research: `docs/research/seo-search-intelligence-2026.md` (Google Search Central / GSC 2026 guidance).
- Model `SEARCH_INTELLIGENCE_VERSION = 1`: intents, topics, capability tiers, GSC stages, priority bands, provenance, inventories, gaps, seed backlog, content brief contract.
- Prisma `GrowthSearchOpportunity` for operator backlog (no fabricated volumes).
- `/reports/growth` Search Intelligence panel (baseline preserved, opportunities UI, gaps, brief preview).
- Docs: search-intelligence, opportunity model, weekly review, brief contract, Sprint 5 acceptance.
- Preferred Sources + social/video GSC = FUTURE. OpenAI/GSC API/Meta = 0. Baseline V1 unchanged.
- Facebook Sprint 4 execution continues in parallel.

## 2026-08-23 — Growth Sprint 4 (30-day Facebook execution engine)

- `facebook-execution-v1`: experimental cadence, 30-day TARGET bands, schedule, experiment sequencing.
- Metric checkpoints: `GrowthContentMetricSnapshot` (INITIAL / HOURS_72 / DAYS_7) on canonical content records.
- Dashboard: edit metrics UI, due-for-measurement queue, daily operator view, follower + company/founder scorecards, experiment decisions.
- Docs: 30-day plan, review template, Sprint 4 acceptance; research refresh appendix.
- Website→Facebook (018) remains QUEUED.
- Baseline V1 unchanged; Meta/OpenAI = 0.

## 2026-08-23 — Facebook content ledger submit hardening

- Client pending lock on content form (`Saving…` / disabled / accessible status).
- Server: 120s rapid-submit idempotency + reject recreate of existing `utm_content`.
- Store helper `updateGrowthContentManualMetrics` for same-record 72h/7d maturity (UI edit still Sprint 4 gap).
- Cleaned accidental duplicate rows for `company_seo_mistakes_001` (kept earliest canonical `cmt660oeg000004k3ucbxv5yr`; deleted two rapid-click duplicates).

## 2026-08-23 — Growth Sprint 3 (Facebook Organic Growth & Distribution Engine)

- Research: `docs/research/facebook-organic-growth-2026.md` (official Meta sources prioritized).
- Model `facebook-growth-v1`: metric layers, balanced scorecard, company/founder separation, jobs/pillars/formats.
- UTM: `page_organic` + `company_*` vs `founder_content` + `founder_*` (`utm-standard-v1` preserved).
- Prisma `GrowthContentRecord` ledger (manual FB metrics + first-party bridge via utm_content).
- `/reports/growth` Facebook panel: baseline vs snapshot, content ledger, publisher split, FB-attributed audits.
- Docs: playbook, content OS, weekly review, Page checklist, experiments 010–018.
- No Meta Graph API; dashboard side-effect budget Meta/OpenAI/Places/crawl/Resend/Stripe = 0.
- Growth Baseline V1 Facebook totals **unchanged**.

## 2026-08-23 — Growth Sprint 2 (Audit Conversion Funnel)

- Defined `AUDIT_FUNNEL_VERSION = 1` contract (`docs/growth/audit-funnel.md`).
- Fixed `audit_completed` cardinality — single deduped fire per completion (was duplicate commercial+growth gtag).
- `audit_started` now fires on first URL focus; funnel milestones persist in `attributionJson.funnel`.
- Extended `/reports/growth` with audit funnel counts, conversion rates, and INSUFFICIENT DATA semantics.
- GA4 operator guide: `docs/growth/ga4-audit-funnel.md`; research: `docs/research/audit-conversion-funnel-2026.md`.
- UX: landing hero clarity, form trust copy, honest processing stages, inline report view beacon.
- GA4 `generate_lead` compatibility on contact success (non-key; `contact_form_submitted` remains authoritative).
- Experiments GROWTH-EXP-2026-001 through 004 documented (sequential — low traffic).

## 2026-08-23 — Growth Baseline V1 recorded

- Recorded verified production baseline (`GROWTH_BASELINE_VERSION = 1`).
- Window: 2026-07-26 → 2026-08-22.
- GSC: 0 clicks, 2 impressions, 0% CTR, avg position 77; query data INSUFFICIENT_DATA.
- GA4: production Realtime instrumentation verified; historical traffic totals NOT_CAPTURED.
- Facebook Page: 75 followers, 9 visits, 5 engagements; Total Views NOT_CAPTURED.
- Docs: `docs/growth/baselines/growth-baseline-v1.md`; code: `src/lib/growth/baseline-v1.ts`.

## 2026-08-23 — Growth Sprint 1 (Measurement & Attribution V1)

- Established measurement framework, event taxonomy (`growth-events-v1`), UTM standard (`utm-standard-v1`).
- Shipped internal `/reports/growth` dashboard + UTM builder.
- Added `GrowthSnapshot` model and first-party bounded audit attribution.
- Instrumented public audit/contact funnel events (no commercial IDs in GA4).
- Documented baselines methodology for GA4, Search Console, Facebook (manual snapshots initially).

---

<!-- Future entries:

## YYYY-MM-DD — Title

- SEO change / landing page / campaign / Facebook experiment / GBP / paid
- Expected KPI impact
- Experiment ID (if any)

-->
