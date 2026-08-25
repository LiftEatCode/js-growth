# Lead Conversion Intelligence V1

**LEAD_CONVERSION_INTELLIGENCE_VERSION = 1**  
Dashboard: `/reports/growth` (compact) · Detail: `/reports/growth/conversion`

## Principle

Traffic, followers, and clicks are not the goal. This layer **observes** the path from marketing activity to pipeline outcomes **where attribution supports it**.

It is not an autonomous sales agent. It does not email, mutate commercial status, create opportunities, or charge payments.

## Authority

| Layer | Authority |
|---|---|
| Session / key-event acquisition | GA4 |
| Public-audit UTM bundle | First-party `AuditReport.attributionJson` |
| Prospect / Opportunity / Proposal / Agreement / Payment / Client | Commercial database |

Growth Intelligence **reads** commercial facts. It does not become the CRM.

## Canonical funnel (observation labels)

VISITOR → QUALIFIED_VISIT → AUDIT_STARTED → AUDIT_SUBMITTED → AUDIT_COMPLETED → CONTACT → **INBOUND_LEAD** / **OUTBOUND_PROSPECT** → OPPORTUNITY → PROPOSAL → AGREEMENT → PAYMENT → CLIENT

Inbound `Lead` and outbound `Prospect` are never summed into one “leads” KPI.

QUALIFIED_VISIT remains **NOT_CAPTURED** in this first-party join (GA4).

**CONTACT** attributions are persisted on `ContactSubmission` (Sprint 10). Contact does not auto-create CRM `Lead`.

## Sample safety (JS Solutions operating rules)

| n | Label |
|---|---|
| ≤ 4 | INSUFFICIENT_DATA |
| 5–19 | EARLY_DIRECTIONAL |
| ≥ 20 | USABLE |

Rates require denominator ≥ 5. Unknown ≠ zero.

## Attribution

Reuse `attribution-v1` + Acquisition Capture V1. Strength: DIRECT_FIRST_PARTY · STRONG · DIRECTIONAL · INFERRED · UNKNOWN.

First-observed (localStorage 90d) and current-session (sessionStorage) are modeled going forward. Cross-device remains **NOT_MODELED**. Do not backfill historical journeys.

GBP: classify only when `google_business_profile` / `organic_local` UTMs exist; historical GBP stays **NOT_CAPTURED** without evidence.

## Money

- Pipeline value = latest **APPROVED** proposal `totalInvestmentCents` per **active** opportunity (no superseded double-count).
- Accepted agreement value = `totalInvestmentCents` where `status=ACCEPTED` and `acceptedAt` in window.
- Observed revenue = `CommercialPayment.amountPaidCents` where `PAID` and `paidAt` in window.
- Attributed revenue = observed payment joined to `opportunity.lead` → public audit UTM.
- Organic ROI = **ROI_NOT_AVAILABLE** (cost not represented; do not invent $0).

## Human authority

System recommends NOW / NEXT / WATCH. Operator acts in commercial pages.

## Snapshots

Optional INTERNAL snapshot fields may record inbound/outbound/attribution coverage. No new `LEAD_CONVERSION` source in V1.

## Sprint 11 — Follow-up operations (commercial)

Lead Conversion Intelligence **observes** pipeline facts; Sprint 11 adds **operator follow-up capture**:

- Append-only **`FollowUpActivity`** on Lead / Prospect / Opportunity (not GrowthSnapshot)
- Attention queue **V2** on `/reports/growth/follow-up` — deterministic NOW / NEXT / WATCH ordering
- Follow-up authority: `Lead.followUpAt`, `Prospect.followUpAt`, `Opportunity.nextActionAt`
- Templates are copy helpers only; **no auto-send**. Nurture ≠ drip.
- ContactSubmission → explicit Create Lead (no auto-Lead)

See [`lead-followup-operations.md`](lead-followup-operations.md). **LEAD_FOLLOWUP_VERSION = 1**.
