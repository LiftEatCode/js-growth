# Competitive Intelligence V1

**Status:** Implemented through Sprint 13.1 (production accepted / hardened).  
**Audience:** Internal operators and developers.  
**Public share / PDF / paid standalone CI:** **Not implemented** (planned).

This document describes the **coherent product**. Historical sprint notes remain under `competitive-intelligence-sprint-*.md` for build history.

> **Do not confuse** this pipeline with [public Website Growth Audit competitor URLs](competitive-intelligence-v1.md) (explicit URLs on a public audit; no Places discovery).

---

## Purpose

Help JS Solutions operators (and later clients) understand how a prospect’s **website** compares to selected local competitors’ websites — using the same deterministic Website Growth Audit engine.

---

## Pipeline

```text
Prospect
  → Competitive profile + vertical normalization
  → Google Places competitor candidate discovery (bounded)
  → Deterministic validation + geographic relevance
  → Human select ≤ 3 competitors
  → Competitor Website Growth Audits (historical CompetitorAudit)
  → Deterministic CompetitiveComparisonSnapshot
  → AI CompetitiveInterpretation (explanation only)
  → Competitive Website Growth Analysis (presentation)
```

---

## Two different scores

| Score | Meaning |
|---|---|
| **Website Growth Score** | Deterministic audit quality of a website (0–100) |
| **Competitive relevance** | How well a Places candidate fits as a local competitor for this prospect |

Never treat relevance as website quality, and never treat Website Growth Score as business quality, revenue, traffic, or rankings.

---

## Authority chain

```text
Website Audit Engine (deterministic)
        ↓
Competitive Comparison (deterministic facts)
        ↓
AI Interpretation (explains; may not invent facts)
        ↓
Client Presentation (Sprint 13 view model)
```

Sprint 11 numbers always win. The UI renders scores/gaps from the comparison snapshot; AI prose references evidence via `sourceKey` validation.

---

## Key capabilities (implemented)

- Vertical normalization and candidate discovery via Places
- Deduplication, validation scoring, geography (exact distance when possible; city/region fallback)
- Human select/reject (max **3** selected)
- Competitor audits reuse `runDeterministicWebsiteAudit()`; 30-day TTL reuse; concurrency 1; max 3 per run
- Comparison: overall / category / finding gaps, advantages, opportunities, ranking, historical snapshots, staleness
- AI interpretation: bounded input, structured output, source-key provenance, commercial-claim guards, English-script validation (13.1), 1 repair retry
- Client report: readiness gate (current comparison + current interpretation), print-friendly internal preview, no OpenAI on load

---

## Important limits (code)

| Limit | Value |
|---|---|
| Selected competitors / prospect | 3 |
| Competitor Places requests / prospect | 3 |
| Competitor candidates stored / prospect | 10 |
| Competitor audits / run | 3 |
| Interpretations / button click | 1 (+ optional 1 repair) |
| Report OpenAI / Places / crawl | 0 |

---

## Operator path

See SOP: [`../sops/operations/competitive-analysis.md`](../sops/operations/competitive-analysis.md)

Preview route (internal):

`/reports/prospecting/[campaignId]/prospects/[prospectId]/competitive-report`

---

## Explicitly not in V1

- Public share links / tokens
- Competitive PDF product
- Stripe competitive SKU
- Automatic competitor monitoring / re-audit schedules
- Keyword / backlink / traffic / rank APIs
- Automatic interpretation after comparison

---

## Historical sprint docs

Preserved for development history. Prefer this file for product understanding:

- Sprint 9 / 9.1 discovery & geography
- Sprint 10 competitor audits
- Sprint 11 comparison
- Sprint 12 / 12.1 interpretation
- Sprint 13 / 13.1 client report + language hardening
