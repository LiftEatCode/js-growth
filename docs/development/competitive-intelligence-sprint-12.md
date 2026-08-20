# Competitive Intelligence — Sprint 12

AI Competitive Interpretation for a specific Sprint 11
`CompetitiveComparisonSnapshot`.

## Goal

Explain what the deterministic comparison means for the business — without
recalculating scores, inventing competitors, or becoming the source of truth.

Sprint 11 = fact engine  
Sprint 12 = interpretation engine

## Architecture

```text
CompetitiveComparisonSnapshot (Sprint 11)
        ↓
buildCompetitiveAiInput()   bounded facts + allowedSourceKeys
        ↓
OpenAI (OPENAI_AUDIT_MODEL) structured output
        ↓
Zod schema + source-key / claim validation
        ↓
CompetitiveInterpretation (historical row)
        ↓
Internal prospect UI (numbers from Sprint 11, prose from AI)
```

## Fact vs interpretation boundary

The model may summarize, explain, prioritize presentation, and recommend
evidence-grounded actions.

The model may **not** recalculate scores/rankings/gaps, invent findings, or
claim traffic, rankings, backlinks, revenue, leads, market share, or guaranteed
ROI.

UI always renders authoritative numbers from the Sprint 11 snapshot via
`sourceKey` resolution.

## Structured AI input

Module: `src/lib/competitive-intelligence/interpretation/`

Caps:

- `MAX_AI_COMPETITORS = 3`
- `MAX_AI_OPPORTUNITIES = 8`
- `MAX_AI_ADVANTAGES = 6`
- `MAX_AI_FINDING_EVIDENCE_PER_ITEM = 5`
- `MAX_COMPETITIVE_INTERPRETATIONS_PER_ACTION = 1`

No raw HTML, contacts, emails, or outreach bodies are sent.

## Source-key provenance

Allowed keys are derived from the snapshot:

- `overall`
- `category:<id>`
- `opportunity:<id>`
- `advantage:<id>`
- `finding:<id>`

Unknown keys are rejected. Risks/priorities must reference gaps/opportunities;
advantages must reference strengths.

## Versions

- `COMPETITIVE_INTERPRETATION_VERSION = 1`
- `COMPETITIVE_INTERPRETATION_PROMPT_VERSION = 2` (Sprint 12.1 hardening)

Also stored: model, `comparisonSnapshotId`, comparison version, audit engine
version, input fingerprint.

### Sprint 12.1 hardening

- Primary priority `sourceKey` must be overall / opportunity / GAP|MAJOR_GAP.
- Optional `supportingSourceKeys` may cite advantages (e.g. preserve performance).
- Commercial-claim validation is contextual (causal/guarantee rules), not a
  bare keyword blacklist for words like “leads” or “conversion”.
- One bounded validation repair retry (`MAX_COMPETITIVE_INTERPRETATION_REPAIR_ATTEMPTS = 1`).
- One-competitor comparisons must use directional language, not “market” claims.
- Failure messages include a safe rule code for internal debugging.

## Model configuration

Reuses `OPENAI_API_KEY` + `OPENAI_AUDIT_MODEL` (same stack as Website Growth
Audit AI Interpretation / outreach drafting). No new required env var.

## Historical persistence

Each generation creates a new `CompetitiveInterpretation` row.

Regenerate does not overwrite prior COMPLETED rows.

Failed generations stay FAILED and do not remove older completed
interpretations.

## Staleness

An interpretation is stale when:

- a newer comparison snapshot is current
- interpretation version changes
- prompt version changes
- configured model changes
- input fingerprint no longer matches

Stale UI prompts explicit “Generate New Interpretation” — never auto OpenAI.

## Cost behavior

- Exactly one OpenAI call per successful generation action
- Page load / refresh reuses matching COMPLETED interpretation
- No campaign-wide batch, no auto-generate after comparison

## Security / privacy

- Mutations require `getInternalSession()`
- Internal reporting routes only
- Not exposed on `/report/*`, public audit, Professional PDF, or Stripe flows
- Analytics forbidden keys include interpretation id/json, fingerprint,
  comparison snapshot id, internal talking points, competitive AI summary

## Prompt injection protection

System prompt treats business/site/audit strings as DATA and forbids following
instructions embedded in those strings. Input is structured JSON.

## Failure handling

Statuses: `PENDING` | `RUNNING` | `COMPLETED` | `FAILED`

Failure codes include `MODEL_ERROR`, `TIMEOUT`, `INVALID_OUTPUT`,
`VALIDATION_FAILED`, `MISSING_COMPARISON`, `UNSUPPORTED_COMPARISON_VERSION`,
`NOT_CONFIGURED`.

## Sprint 13 handoff

Sprint 13 can consume:

`CompetitiveComparisonSnapshot` + `CompetitiveInterpretation`

without re-running audits, comparison, or AI. Keep generation logic in the
domain module — not tightly coupled to the prospect page.

Do **not** implement public competitive reports, competitive PDF, Stripe
competitive product, or automatic monitoring in Sprint 12.
