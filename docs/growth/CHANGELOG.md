# Growth Change Log

Dated record of major growth actions. Correlate traffic/funnel changes with real work.

---

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
