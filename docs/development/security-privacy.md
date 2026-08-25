# Security & Privacy Inventory

Based on **implemented** code. This is not a compliance certification.

**Do not claim** HIPAA, SOC 2, GDPR certification, or similar unless separately established outside this inventory.

---

## Access boundaries

| Surface | Protection |
|---|---|
| Public marketing + free audit | Open |
| Public report `/report/[id]` | Knowledge of UUID; no customer login |
| Professional PDF / full Pro content | Entitlement via `ReportPurchase` |
| Internal `/reports/**`, prospecting, CI report, opportunities | `requireInternalSession()` / session cookie |
| Stripe webhook | Stripe signature secret |
| Resend webhook | Webhook secret verification |

Competitive Growth Analysis is **internal-only** (`noindex`). Not exposed on public `/report/*`.

---

## Data classes

| Class | Examples | Handling |
|---|---|---|
| Public site HTML fetch | Crawl targets | SSRF-aware fetch constraints in audit crawl |
| Audit evidence | Scores, findings, URLs | Stored on `AuditReport` / competitor snapshots |
| Buyer payment (audit) | Stripe customer/payment refs | Stripe + `ReportPurchase`; no card storage in app DB |
| Buyer payment (agreement) | Checkout session / payment intent refs | Stripe + `CommercialPayment`; amounts from ACCEPTED Agreement; no card storage |
| Public commercial tokens | Proposal/agreement share hashes | Token hash stored; raw token not logged to analytics |
| Prospect / contact PII | Emails, phones, form URLs | Internal workspace; suppression list |
| Outreach content | Draft/sent bodies | Internal; delivery events append-only |
| Competitor business data | Places candidates, audits | Internal CI; not public product surface |
| Opportunity commercial notes / stages | Pipeline + next actions | Internal only; analytics keys forbidden |
| Client / Project / onboarding | Contact, checklist status, delivery notes | Internal `/reports/clients/*` only; no passwords in notes; analytics forbids `client_id`, `project_id`, credentials keys |
| Commercial Scope / Pricing / Proposal | Offer, prices, proposal snapshots | Internal `/reports/**` only; analytics keys forbidden; not on `/report/*` |
| OpenAI prompts | Bounded audit/outreach/CI inputs | Server-only API; treat as confidential |

---

## Hard product safety rules (implemented intent)

- **No automatic bulk email sending** — human approval before Resend
- **No automated contact-form submission** — operators submit manually
- **No CAPTCHA bypass**
- Daily outreach email cap (`MAX_OUTREACH_EMAILS_PER_DAY = 10`)
- Suppression, bounce, and complaint paths must be respected
- Existing customer / lead / prior-contact protections in prospecting flows
- Free audits: **zero** OpenAI
- Analytics events sanitized — avoid PII and commercial IDs in GA payloads
- Capability-bearing public URLs redacted in analytics only (`/proposal/[secure]`, `/agreement/[secure]`, `/report/[id]`); raw share tokens and Stripe session IDs must never appear in `page_path` / `page_location`
- Internal commercial `/reports/**` paths send **route families** to GA4 (e.g. `/reports/clients/[id]/projects/[id]`), never concrete client/prospect/opportunity/project/proposal/agreement/payment record IDs
- Growth Sprint 1: first-party attribution stores only bounded marketing fields (`source` / `medium` / `campaign` / `content` / `landingPath`); never commercial record IDs
- Growth Sprint 10: Acquisition Capture V1 adds first-observed (localStorage, 90-day TTL) + sessionStorage current session + `ContactSubmission.attributionJson`. No PII/tokens in attribution storage. Attribution failure must not block contact/audit success. No fingerprinting / cross-device identity.
- Growth dashboard (`/reports/growth`) exposes aggregate counts only; attribution debug view shows no PII
- Growth Sprint 11: **`FollowUpActivity`** summaries, operator emails, and commercial record IDs are internal-only — never GA4 params. `/reports/leads/[id]` and `/reports/growth/follow-up` use sanitized route-family paths (same pattern as other `/reports/**` routes)
- Growth Sprint 12: GBP snapshots store **aggregate** Insights only — no reviewer names, review text, or customer PII. `/reports/growth/local` is a static analytics path (preserved as-is). No GBP internal IDs in GA4. Dashboard load: GBP API = 0

---

## Website fetch / SSRF

Audit and contact discovery fetch public HTTP(S) resources under crawl budgets and URL normalization. Do not treat the fetch layer as a general-purpose proxy. Operators should not point audits at internal network targets.

---

## Public vs competitive isolation

| | Public Website Growth Audit | Prospecting Competitive Intelligence |
|---|---|---|
| Competitor source | Optional **explicit URLs** on audit | Places discovery + human select |
| Audience | Report UUID holders / buyers | Internal operators |
| Share product | Public report + Pro PDF | Internal preview only (V1) |

---

## Legal pages

Published routes include Privacy, Terms, Refund Policy. Treat as operational drafts pending counsel review as the business scales (`docs/legal-data-inventory.md`, commercial launch notes).

---

## Related

- [external-services.md](external-services.md)
- [ai-architecture.md](ai-architecture.md)
- [../sops/operations/outreach-safety.md](../sops/operations/outreach-safety.md)
