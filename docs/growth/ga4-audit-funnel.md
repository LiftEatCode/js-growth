# GA4 Audit Funnel — Operator Guide

Build a Funnel Exploration for the free Website Growth Audit using Sprint 1/2 custom events.
Do **not** put commercial IDs or report UUIDs in GA4.

---

## Prerequisites

1. GA4 property with production stream (verified at Baseline V1).
2. Custom events appearing in **Admin → Events** (may take up to 24h for Explorations).
3. Mark key events in GA Admin (recommended): `audit_submitted`, `contact_form_submitted`.

---

## Recommended funnel steps

Create **Explore → Funnel exploration**. Remove default steps. Add:

| Step | Label | Event condition |
| --- | --- | --- |
| 1 | Audit landing | Event = `audit_landing_view` |
| 2 | Audit started | Event = `audit_started` |
| 3 | Audit submitted | Event = `audit_submitted` |
| 4 | Audit completed | Event = `audit_completed` |
| 5 | Report viewed | Event = `audit_report_viewed` |
| 6 | Professional CTA | Event = `professional_audit_cta_clicked` |
| 7 | Contact submitted | Event = `contact_form_submitted` |

Optional parallel branch: step 6 alt = `contact_cta_clicked` for consultation links.

---

## Open vs closed funnel

| Mode | Use when |
| --- | --- |
| **Closed** | Strict QA — user must complete prior steps in order (good for single landing path) |
| **Open** | Campaign diagnostics — user may return directly to report URL |

Start with **closed** for Sprint 2 baseline comparisons; switch to **open** when analyzing returning visitors.

---

## Breakdowns

Add dimensions in the exploration tab:

| Breakdown | GA4 dimension |
| --- | --- |
| Source / medium | Session source/medium |
| Campaign | Session campaign |
| Device | Device category |
| Landing page | Landing page path |

For Facebook Sprint 3 readiness, filter campaigns:

- Company page: `utm_source=facebook`, `utm_medium=organic_social`, `utm_campaign=page`
- Founder/personal: `utm_source=facebook`, `utm_medium=organic_social`, `utm_campaign=founder_content`

See `docs/growth/utm-conventions.md`.

---

## Date ranges

| Range | Purpose |
| --- | --- |
| Last 7 days | Early Sprint 3 traffic tests |
| Last 28 days | Align with internal growth dashboard |
| Baseline window 2026-07-26 → 2026-08-22 | Compare to Growth Baseline V1 (low traffic — interpret cautiously) |

---

## Recommended lead events (compatibility)

| GA4 recommended | Our authoritative event | When |
| --- | --- | --- |
| `generate_lead` | `contact_form_submitted` | Contact form success only |
| `qualify_lead` | — | Manual / CRM future |
| `close_convert_lead` | Stripe + Client record | Not browser events |

`generate_lead` is fired in-app for GA4 Lead reports but is **not** a substitute key event for `contact_form_submitted`.

---

## Cardinality QA

After Sprint 2 deploy, Realtime should show **one** `audit_completed` per successful audit (deduped). If `audit_completed` exceeds `audit_submitted` in the same session, investigate duplicate instrumentation before trusting completion rates.
