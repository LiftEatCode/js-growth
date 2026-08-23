# Audit Funnel Contract — AUDIT_FUNNEL v1

Deterministic specification for the free Website Growth Audit acquisition funnel.
**Growth Baseline V1 event names are unchanged.** This document defines when each event fires.

```
AUDIT_FUNNEL_VERSION = 1
```

---

## Expected sequence

```
audit_landing_view
  → audit_started
  → audit_submitted
  → audit_completed
  → audit_report_viewed
  → professional_audit_cta_clicked OR contact_cta_clicked / contact_form_submitted
  → prospect / lead outcome (commercial DB — not GA4 authority)
```

---

## Step definitions

| Event | Fires when | Does NOT fire when |
| --- | --- | --- |
| `audit_landing_view` | One meaningful `/website-audit` landing view per tab session | React Strict Mode remount (deduped via ref + session key) |
| `audit_started` | User first focuses the URL field (meaningful form interaction) | Every keystroke; duplicate focus in same session |
| `audit_submitted` | Audit request passes client/server boundary successfully | Validation failure; fetch/analysis failure |
| `audit_completed` | Audit processing reaches completed state and results are returned | Duplicate commercial+growth fires; second tab with same report |
| `audit_report_viewed` | Completed report UI is presented (`inline_landing` or `dedicated_report`) | Preview placeholder before audit |
| `professional_audit_cta_clicked` | User intentionally starts professional checkout / upgrade | Accidental double-click (deduped per session) |
| `contact_form_submitted` | Contact form server action succeeds | Validation errors |
| `contact_cta_clicked` | User clicks a tracked consultation link | Internal navigation without click |

---

## Bounded parameters

| Parameter | Values | Notes |
| --- | --- | --- |
| `cta_location` | `audit_landing`, `report_upgrade`, `report_implementation`, … | No UUIDs |
| `cta_type` | `professional_audit`, `contact`, `audit`, `consultation` | Mirrors `cta_kind` |
| `report_context` | `inline_landing`, `dedicated_report` | Where report rendered |
| `placement` | Sprint 1 values | Backward compatible |

**Never include:** email, phone, report UUIDs, commercial IDs, Stripe IDs, raw URLs.

---

## First-party persistence

Funnel milestones (`landingViewAt`, `startedAt`, `submittedAt`) are stored in tab `sessionStorage` and posted with the audit form as `growth_funnel`. Server merges into `AuditReport.attributionJson.funnel` for aggregate dashboard counts.

Browser-only steps (report view, CTA clicks) remain in GA4 unless future first-party logging is added.

---

## Counting semantics

| Metric | Authority |
| --- | --- |
| Submissions / completions | Database (`PUBLIC_FUNNEL` audits) |
| Landing / starts (first-party) | `attributionJson.funnel` milestones when present |
| Report views / CTA / contact | GA4 (dashboard shows NOT CAPTURED) |
| Prospects / opportunities | Commercial DB (growth observes, does not own) |

When sample size is below 5 in the denominator, internal dashboard shows **INSUFFICIENT DATA** — not 0%.

---

## Implementation

- `src/lib/growth/audit-funnel.ts` — contract constants, dedupe, milestones
- `src/lib/growth/audit-funnel-metrics.ts` — server aggregates
- `src/components/growth/growth-page-beacon.tsx` — landing / report beacons
- `docs/growth/ga4-audit-funnel.md` — operator GA4 setup
