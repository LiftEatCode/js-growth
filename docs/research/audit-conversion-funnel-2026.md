# Audit Conversion Funnel Research — 2026

Research supporting Growth Sprint 2 (website audit acquisition funnel optimization).
Growth Baseline V1 remains locked — this document informs Sprint 2+ only.

---

## Official platform guidance

| Source | Date accessed | Finding | Why it matters | How / if we apply |
| --- | --- | --- | --- | --- |
| [GA4 Recommended events — lead generation](https://support.google.com/analytics/answer/9267735) | 2026-08-23 | Google recommends `generate_lead`, `qualify_lead`, `working_lead`, `close_convert_lead` for offline/CRM-heavy funnels | Enables Lead acquisition reports when mapped to real business milestones | Keep Sprint 1 custom events authoritative; fire `generate_lead` only on confirmed contact success as a **non-key** compatibility event |
| [GA4 — report on lead generation form](https://support.google.com/analytics/answer/12944921) | 2026-08-23 | Funnel explorations should use sequential steps (`page_view` → `form_start` → `form_submit` → confirmed lead) | Drop-off analysis requires deterministic step order | Document GA4 funnel using our `audit_*` events + `contact_form_submitted`; see `docs/growth/ga4-audit-funnel.md` |
| [GA4 Funnel exploration (Explore)](https://support.google.com/analytics/answer/9327974) | 2026-08-23 | Closed funnels count users who complete steps in order; open funnels allow skipped intermediate steps | Audit funnel is mostly sequential — use **closed** funnel for strict QA, **open** for campaign diagnostics | Operator guidance in `ga4-audit-funnel.md` |
| [Google Search Central — page experience](https://developers.google.com/search/docs/appearance/page-experience) | 2026-08-23 | Core Web Vitals and mobile usability affect landing quality; avoid intrusive interstitials | Poor LCP/CLS hurts both SEO and conversion | No new third-party widgets in Sprint 2; preserve performance budget |
| [Google Search Central — helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) | 2026-08-23 | People-first content that satisfies intent outperforms SEO-only pages | Audit landing must explain value honestly | Hero + form trust copy clarifies who the audit is for and what they receive |

---

## Established UX research (selected)

| Source | Date accessed | Finding | Why it matters | How / if we apply |
| --- | --- | --- | --- | --- |
| [Nielsen Norman Group — Form design](https://www.nngroup.com/articles/web-form-design/) | 2026-08-23 | Minimize fields; clear labels; inline validation; meaningful defaults | Each extra field reduces completion | Audit form keeps URL required; competitors optional; `audit_started` on first URL focus |
| [Nielsen Norman Group — Progress indicators](https://www.nngroup.com/articles/progress-indicators/) | 2026-08-23 | Users tolerate waits when system status is visible; fake progress erodes trust | Processing gap between submit and report | Rotating **honest stage messages** during audit (no fake percentages) |
| [Baymard Institute — checkout / form friction](https://baymard.com/blog/checkout-flow-average-form-fields) | 2026-08-23 | Unnecessary fields are a top abandonment driver | Pre-audit friction blocks qualified leads | No email gate before free audit; lead capture remains post-report |
| [CXL — landing page clarity](https://cxl.com/blog/landing-page-best-practices/) | 2026-08-23 | Value prop, audience, outcome, and effort should be visible above the fold | Reduces bounce from unclear offers | Hero states time estimate, audience, and no-credit-card promise |

---

## Our hypotheses (not established facts)

| Hypothesis | Change | Primary metric | Guardrail |
| --- | --- | --- | --- |
| H1 — Hero clarity | Add audience + time-to-result copy on landing hero | `audit_started` / `audit_landing_view` | Bounce rate (GA4) |
| H2 — Form friction | Fire `audit_started` on URL focus, not submit | `audit_started` → `audit_submitted` | Invalid URL error rate |
| H3 — Trust near form | Privacy / read-only explanation beside form | `audit_submitted` | Time-on-page (no increase from confusion) |
| H4 — Report CTA clarity | Professional CTA explains what unlock adds + price | `professional_audit_cta_clicked` | Free report engagement (`audit_report_viewed`) |
| H5 — Cardinality fix | Single deduped `audit_completed` per completion | `audit_completed` count ≈ `audit_submitted` | GA4 Realtime QA |

Experiments tracked in `docs/growth/experiments/`.

---

## GA4 recommended lead events — decision

**Decision:** Sprint 1 event names remain authoritative and unchanged. On successful contact form submission we additionally fire GA4 `generate_lead` with `form_name=contact`. It is **not** marked as a duplicate key event — `contact_form_submitted` stays the operator key-event candidate. CRM-stage events (`qualify_lead`, etc.) remain manual/offline until commercial workflow exports exist.

**Cardinality note (Baseline V1):** Realtime showed `audit_submitted=1`, `audit_completed=2`. Root cause: duplicate browser fires (`trackCommercialEvent` + `trackGrowthEvent` both sent `audit_completed`). Sprint 2 consolidates to `trackAuditFunnelEvent` with session dedupe.
