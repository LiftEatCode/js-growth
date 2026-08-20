# Competitive Intelligence — Sprint 10

> **HISTORICAL sprint record.** Prefer [`competitive-intelligence.md`](competitive-intelligence.md).

Internal competitor **Website Growth Auditing**. This is not a customer-facing product.

## Goal

Run the existing deterministic Website Growth Audit engine against
**human-selected** competitor websites and persist results as internal
competitive intelligence snapshots.

Sprint 10 answers:

> How does each selected competitor's website perform according to our
> existing audit engine?

Sprint 10 does **not** compare prospect vs competitor. That is Sprint 11.

## Architecture

```text
SELECTED ProspectCompetitor
        ↓
competitor.website (server-loaded)
        ↓
runDeterministicWebsiteAudit()
        ↓
secure fetch → crawl → rules → scoring
        ↓
CompetitorAudit snapshot
        ↓
Internal Competitive Landscape UI
```

Reuse the **audit engine**. Do not reuse the public `AuditReport` lifecycle.

`CompetitorAudit` never enters:

- `/report/[id]` public routes
- Free/Professional listings
- Stripe checkout
- PDF generation
- AI Interpretation
- Leads
- outreach / contacts / Resend

## Audit engine reuse

Same entry point as prospect audits and the public funnel:

- `runDeterministicWebsiteAudit`
- `fetchWebsitePage` / secure fetch (SSRF protections)
- `crawlSite`
- `scoreWebsiteAudit` / `runAuditRules`
- `getAuditGrade` / score bands

Categories (exact keys):

`technical` · `seo` · `content` · `cro` · `accessibility` · `local` · `performance`

`auditEngineVersion` matches `AUDIT_REPORT_VERSION` so Sprint 11 can refuse
incompatible comparisons.

## Data model

### CompetitorAudit

Historical snapshot per audit attempt:

- links: `prospectCompetitorId`, `targetProspectId`, optional `campaignId` / `runId`
- website URL + normalized hostname
- status: PENDING → RUNNING → COMPLETED | FAILED
- overall score, grade, per-category score columns
- `auditResultJson` (full `WebsiteAuditResult`)
- `summaryJson` (counts + top finding ids)
- `auditEngineVersion`
- started/completed/failed timestamps + bounded failure reason

### CompetitorAuditRun

Operational batch metadata (same pattern as CompetitorDiscoveryRun):

- requested / processed / completed / reused / failed / skipped
- initiated by email
- duration

## Snapshot semantics

Re-runs **create new rows**. Prior COMPLETED snapshots remain.
Failed attempts do not delete prior successful audits.

Latest COMPLETED within TTL is reused by default.

## Selection gate

Only `ProspectCompetitor.status === SELECTED` may be audited.

Maximum: **3** selected competitors per prospect (unchanged from Sprint 9).

## TTL / cost

| Limit | Value |
|---|---|
| MAX_COMPETITOR_AUDITS_PER_PROSPECT | 3 |
| MAX_COMPETITOR_AUDITS_PER_RUN | 3 |
| COMPETITOR_AUDIT_CONCURRENCY | 1 |
| COMPETITOR_AUDIT_TTL | 30 days |
| OpenAI | 0 |
| Google Places during auditing | 0 |
| Contact discovery | 0 |
| Resend | 0 |

Human **Re-run Audit** bypasses TTL and creates a new snapshot.

## UI

Competitive Landscape clearly separates:

- **Competitive relevance** — Sprint 9 Places validation score
- **Website Growth Score** — deterministic audit engine score

Actions:

- Audit Selected Competitors
- Run Audit / View Audit / Re-run Audit

Detail route (internal, `noindex`):

`/reports/prospecting/[campaignId]/prospects/[prospectId]/competitors/[competitorId]/audits/[auditId]`

## Security / privacy

- Website URL comes from the persisted competitor record, never trusted client input
- Existing SSRF protections via the shared audit fetch path
- Analytics forbids competitor audit identifiers / names / hostnames / URLs

## Sprint 11 boundary

Do **not** implement here:

- prospect vs competitor gap scores
- finding overlap
- AI competitive narratives
- competitive PDFs
- automatic audits or selection
- outreach personalization from competitor audits
