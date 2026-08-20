# Competitive Intelligence — Sprint 11

> **HISTORICAL sprint record.** Prefer [`competitive-intelligence.md`](competitive-intelligence.md).

Deterministic competitive comparison between a prospect’s Website Growth Audit
and human-selected competitors’ Sprint 10 `CompetitorAudit` snapshots.

## Goal

Answer, without AI:

1. How does this prospect compare to selected local competitors?
2. Where is the prospect ahead / behind?
3. Which gaps are largest?
4. Which deterministic findings explain those gaps?
5. What should be prioritized?

Sprint 12 may explain these facts. Sprint 11 calculates them.

## Architecture

```text
Prospect.auditReport (AuditReport)
SELECTED ProspectCompetitor + latest compatible COMPLETED CompetitorAudit
        ↓
loadComparisonInputs()  (DB only — no network)
        ↓
buildCompetitiveComparison()
        ↓
CompetitiveComparisonSnapshot (historical JSON)
        ↓
Competitive Comparison UI
```

Cost during comparison:

- OpenAI: 0
- Google Places: 0
- Website audits: 0
- Contact discovery: 0
- Resend: 0

## Comparison version

`COMPETITIVE_COMPARISON_VERSION = 1`

Stored on each snapshot. Algorithm changes mark prior snapshots stale.

## Inputs

**Target:** `Prospect.auditReportId` → `AuditReport` with `version === AUDIT_REPORT_VERSION`.

**Competitors:** up to 3 `SELECTED` rows with a latest COMPLETED `CompetitorAudit`
where `auditEngineVersion` matches the target. A newer FAILED attempt does not
hide an older COMPLETED snapshot.

Missing / incompatible competitors are skipped and listed in the UI.

## Overall comparison

- competitor average / median / best / worst
- gap vs average / gap vs leader
- competition ranking (ties share rank; next rank skips)
- display rounding: one decimal (`87.333…` → `87.3`)

## Category comparison

Canonical categories from the audit engine:

`technical` · `seo` · `content` · `cro` · `accessibility` · `local` · `performance`

Raw category points are normalized to 0–100 percentages.
Non-applicable categories are excluded (never treated as 0).

Position vs competitor average:

| Gap | Position |
|---|---|
| ≥ +15 | MAJOR_ADVANTAGE |
| ≥ +5 | ADVANTAGE |
| −5 &lt; gap &lt; +5 | PARITY |
| ≤ −5 | GAP |
| ≤ −15 | MAJOR_GAP |

## Finding / rule comparison

Matched by stable `finding.id` (not prose).

Patterns:

- TARGET_ONLY_WEAKNESS — target fails; 0 competitors fail
- COMMON_MARKET_WEAKNESS — target fails; ≥ 2/3 competitors fail
- COMPETITIVE_ADVANTAGE — target passes; ≥ 2/3 competitors fail
- MARKET_STANDARD — target passes; ≤ 1/3 competitors fail
- MIXED — otherwise

## Opportunities & advantages

Deterministic priority scores from gap magnitude, outperform counts, and finding
severity. No fabricated revenue/traffic impact.

## Snapshot persistence

`CompetitiveComparisonSnapshot` stores:

- `comparisonJson`
- `competitorAuditIdsJson`
- `selectedCompetitorIdsJson`
- engine + comparison versions
- createdByEmail

Generate / Rebuild creates a **new** historical row. Page loads the latest
snapshot and computes staleness against current inputs.

## Staleness

Stale when any of:

- prospect audit report id changes
- selected competitor set changes
- competitor audit ids change
- audit engine version changes
- comparison algorithm version changes

## Security

Internal only. Mutations require `getInternalSession()`.
Not exposed on public `/report/*`, PDF, Stripe, or AI Interpretation.
Analytics forbids comparison identifiers and gap payloads.

## Sprint 12 handoff

Send `CompetitiveComparison` JSON as factual input to AI interpretation.
Do not let the model recalculate averages, ranks, or gap classifications.

Implemented in Sprint 12 — see `docs/development/competitive-intelligence-sprint-12.md`.
