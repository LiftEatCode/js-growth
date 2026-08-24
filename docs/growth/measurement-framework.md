# Growth Measurement Framework

**Versions:** `growth-events-v1` · `attribution-v1` · `qualified-traffic-v1` · `kpi-hierarchy-v1` · `acquisition-capture-v1`  
**Dashboard:** `/reports/growth`

---

## Canonical funnel

```
Facebook / Search / GBP / Direct / Referral
        ↓
Website Session
        ↓
Qualified Visit
        ↓
AUDIT LANDING PAGE
        ↓
AUDIT START
        ↓
AUDIT SUBMITTED
        ↓
AUDIT COMPLETED
        ↓
REPORT VIEWED / PROFESSIONAL AUDIT CTA / CONTACT
        ↓
LEAD / PROSPECT
        ↓
OPPORTUNITY
        ↓
PROPOSAL
        ↓
AGREEMENT
        ↓
PAYMENT
        ↓
CLIENT
```

Historical alias (Growth Sprint 1 wording): VISITOR → ENGAGED VISITOR → … remains equivalent for public analytics stages.

### Growth Baseline V1

Verified production baseline recorded **2026-08-23** (`GROWTH_BASELINE_VERSION = 1`).

See [`baselines/growth-baseline-v1.md`](baselines/growth-baseline-v1.md) and `src/lib/growth/baseline-v1.ts`.

Unknown metrics remain `NOT_CAPTURED` / `INSUFFICIENT_DATA` — never estimated zeros.

### Stage ownership

| Stage | Classification |
|---|---|
| Visitor → Report viewed, CTAs, contact form | **PUBLIC ANALYTICS EVENTS** (GA4) |
| Audits created, purchases, inbound leads, outbound prospects, opportunities, proposals, agreements, clients | **SERVER-SIDE BUSINESS METRICS** (DB aggregates) |
| Record-level prospect/opportunity/client/payment IDs, notes, pricing | **PRIVATE COMMERCIAL METRICS** (never in GA4) |

Inbound `Lead` and outbound `Prospect` are separate acquisition systems (Lead Conversion Intelligence V1). Do not add them together.

See [`lead-conversion-intelligence.md`](lead-conversion-intelligence.md). **LEAD_CONVERSION_INTELLIGENCE_VERSION = 1**.

---

## Public growth events (`growth-events-v1`)

| Event | When |
|---|---|
| `audit_landing_view` | `/website-audit` mount |
| `audit_started` | User first focuses the audit URL field (meaningful form interaction) |
| `audit_submitted` | Audit server success returned |
| `audit_completed` | Results rendered |
| `audit_report_viewed` | `/report/[id]` mount |
| `professional_audit_cta_clicked` | Pro unlock / get-report CTA |
| `contact_cta_clicked` | Tracked contact CTA |
| `contact_form_started` | First focus on contact form |
| `contact_form_submitted` | Contact form success |
| `blog_cta_clicked` | Tracked blog CTA (when wired) |
| `service_cta_clicked` | Tracked service CTA (when wired) |
| `professional_checkout_started` | Checkout form submit (existing) |

Allowed params (bounded): `placement`, `cta_kind`, crawl count flags. No commercial IDs / PII.

### GA4 key-event candidates

- `audit_submitted`
- `contact_form_submitted`

**Revenue authority:** Stripe + `ReportPurchase` / commercial payments. Analytics observes marketing behavior only. Do not create a contradictory browser purchase revenue authority.

---

## Attribution

Prefer GA4-native Session source / medium / campaign / landing page for analytics observation.

First-party Acquisition Capture V1 (new journeys):

- Browser: first-observed (localStorage, 90-day TTL) + current session (sessionStorage)
- Conversion: `source`, `medium`, `campaign`, `content`, `landingPath`, `capturedAt`, `referrerClass`, `entryType`, `acquisitionCaptureVersion`

Stored as `AuditReport.attributionJson` and `ContactSubmission.attributionJson`. No query-string dump. No PII. No commercial IDs. No historical UNKNOWN backfill.

---

## Qualified traffic

Traffic showing meaningful intent (audit start/completion, service pages, Pro CTA, contact action, multi-page intent) — **not** raw sessions alone. See `src/lib/growth/qualified-traffic.ts`.

---

## KPI hierarchy

| Level | Focus |
|---|---|
| 1 Business | New clients, qualified opportunities, revenue |
| 2 Conversion | Agreements, proposals, audit purchases, qualified leads |
| 3 Intent | Audit starts/completions, contact, service engagement |
| 4 Acquisition | Qualified traffic, organic clicks, Facebook/GBP link traffic |
| 5 Visibility | Search impressions, Facebook reach, video views, GBP visibility |

Do not celebrate Level 5 growth if Levels 3–1 do not improve.

---

## Baseline windows

- Last 28 days vs previous 28 days (primary)
- 7-day directional
- 90-day context when available

Do not fabricate historical values.

### Website (GA4 + internal)

Users, new users, sessions, engaged sessions, engagement rate, channel sessions, audit starts/submissions, contact submissions, paid audit purchases (authoritative), opportunities (private).

### Search Console

Clicks, impressions, CTR, average position (diagnostic), top queries/pages, brand vs non-brand, local/service/audit-tool intent where classifiable.

### Facebook

Separate **JS Solutions Page** vs **founder/personal**. Followers, reach, views/impressions, engagement, link clicks, page visits, top posts.

---

## Side-effect budget

Page load / growth events: OpenAI 0 · Places 0 · crawl 0 · Resend 0 · Stripe 0.
