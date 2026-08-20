# Competitive Intelligence — Sprint 13

Client-ready **Competitive Growth Analysis** presentation over persisted
Sprint 11 + Sprint 12 data.

## Goal

Present a polished internal preview that a business owner could understand,
without recalculating facts or calling OpenAI.

Sprint 11 = authoritative quantitative facts  
Sprint 12 = bounded explanatory interpretation  
Sprint 13 = presentation / productization

## Architecture

```text
Prospect + AuditReport
  + CompetitiveComparisonSnapshot
  + CompetitiveInterpretation (COMPLETED, current)
        ↓
getCompetitiveReportReadiness()
        ↓
buildCompetitiveGrowthReport()   pure view model
        ↓
/reports/prospecting/.../competitive-report
```

Loading the report is **DB-only**. No audits, Places, comparison generation,
AI generation, contacts, or outreach.

## Internal vs client analysis

| Surface | Purpose |
|---|---|
| Internal Competitive Intelligence | Operator tooling: discovery, selection, audits, comparison, AI generate/regenerate |
| Client Competitive Growth Analysis | Finished-feeling analysis preview for business owners |

Sprint 13 remains **internal-only** (session required, noindex). No public
share tokens, PDF product, Stripe, or email delivery.

## Report readiness

`READY` requires:

- target Website Growth Audit present
- current (non-stale) CompetitiveComparisonSnapshot
- current COMPLETED CompetitiveInterpretation for that snapshot

Otherwise show guidance such as rebuild comparison / regenerate interpretation.
No automatic regeneration.

## Presentation version

`COMPETITIVE_REPORT_VERSION = 1`

No additional database snapshot — the report is a deterministic view over
existing Sprint 11/12 rows.

## Cost

- OpenAI: 0
- Google Places: 0
- Website crawls: 0
- Contact discovery: 0
- Resend / outbound: 0

## Print

Browser print is supported for document testing. Navigation chrome is
`print:hidden`. Final PDF remains Sprint 14+.

## Sprint 14 boundary

Do **not** implement public links, tokens, PDF download, emailed reports,
client auth, or paid competitive checkout in Sprint 13.
