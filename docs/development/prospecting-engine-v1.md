# Prospecting Engine V1

Internal notes for JS Solutions outbound prospecting. This is **not** a customer-facing product.

Current status: **Sprint 1 — Data Foundation + Manual Prospect Workspace**

## Product principle

Optimize for **five credible, qualified prospects**, not five emails sent.

Skip is a success state when:

- audit evidence is weak
- no credible outreach finding exists
- contact information is unreliable
- the business was already contacted or is a customer
- the site audit fails
- findings appear misleading
- the business does not match the campaign

## Prospect ≠ Lead

A `Prospect` is a discovered **business**.

It is not:

- a `Lead` (person + inbound CRM pipeline)
- an `AuditReport`
- the inbound `/reports` concept of an `AuditReport` without a `Lead`

Businesses in `/reports/prospecting` stay out of the inbound audit/lead board until a human converts them later.

## Manual-first strategy

Sprint 1 is operator-driven:

1. Create a campaign (location, industries, desired qualified count).
2. Add businesses by hand.
3. Edit notes and details.
4. Skip poor fits with a reason.
5. Warn on duplicate hostnames.

No Google Places, Maps scraping, website audits, OpenAI, or Resend in this sprint.

## Human approval

Later sprints may discover, audit, qualify, and draft. Sending remains:

**Find → Audit → Qualify → Draft → HUMAN APPROVAL → Send**

V1 is not autonomous outbound.

## Planned stages (not built yet)

| Sprint | Goal |
|---|---|
| 1 | Data foundation + manual prospect UI |
| 2 | Legitimate business discovery provider |
| 3 | Deterministic Website Growth Audit qualification |
| 4 | Public contact discovery + outreach drafts |
| 5 | Approval + Resend sending |
| 6 | Tracking, Lead conversion, hardening |

## Routes

Internal, session-gated, `noindex`:

- `/reports/prospecting`
- `/reports/prospecting/new`
- `/reports/prospecting/[campaignId]`
- `/reports/prospecting/[campaignId]/prospects/new`
- `/reports/prospecting/[campaignId]/prospects/[prospectId]`

## Duplicate hostnames

Normalized hostname is indexed, not globally unique.

Sprint 1 warns the operator (existing Prospect, inbound Lead website, or suppression entry) and requires confirmation before creating another row.

Later sprints should treat prior outreach, customers, and suppression as **hard blocks**.
