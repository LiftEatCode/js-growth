# Implementation Plan Engine (Commercial Sprint 1 / 1.1)

**Status:** Implemented (Sprint 1.1 quality hardening)  
**OpenAI / Places / crawl / Resend on generate:** **0**  
**Audience:** Internal operators only

Deterministic bridge from Website Growth Audit (+ optional current competitive comparison) to JS Solutions service workstreams.

```text
Audit facts (+ optional CURRENT CompetitiveComparisonSnapshot)
        ↓
Normalized evidence (deduped)
        ↓
Capability + workstream mapping rules
        ↓
Strength-aware suppression / preservation
        ↓
Priority + provenance-traced actions
        ↓
Persisted ImplementationPlan snapshot
        ↓
Human review / approve
        ↓
(Future) Opportunity / Proposal / AI explanation — NOT implemented
```

---

## Versions

| Constant | Value | Notes |
|---|---|---|
| `IMPLEMENTATION_PLAN_VERSION` | 1 | Unchanged |
| `IMPLEMENTATION_MAPPING_VERSION` | **2** | Sprint 1.1 (dedupe, provenance, suppression) |
| `SERVICE_CAPABILITY_VERSION` | 1 | Unchanged |

Existing plans fingerprint on mapping version → become **stale** until Rebuild. Historical rows are not mutated.

---

## Sprint 1.1 quality invariants

### Evidence deduplication

Identity: `finding:{findingId}` for findings (AUDIT + COMPETITIVE collapsed); otherwise `{type}:{sourceKey}`.

Deduped before persistence and rendering.

### Action provenance

Every `RecommendedAction.evidenceSourceKeys` must:

1. Have length ≥ 1  
2. Reference sourceKeys present on **that** workstream’s evidence  

No robots/indexability action without robots/indexability findings. Heading actions require heading evidence on that workstream (headings may be cross-assigned to Content + Search).

### Strength-aware workstream suppression

If a category is competitive `ADVANTAGE` or `MAJOR_ADVANTAGE`, do **not** create a normal improvement workstream from isolated LOW/MEDIUM findings.

Instead: preservation + optional `maintenanceActions` (e.g. Performance MAJOR_ADVANTAGE + `performance-large-inline-css`).

### Material-risk exception

Despite competitive strength, allow an improvement workstream when:

1. Any **CRITICAL** finding, OR  
2. **≥ 2 HIGH** findings, OR  
3. Robots/indexability **fail/high** that can block visibility (`robots-noindex`, `robots-none`, `*indexability*` fail/high, etc.)

### `no-images` handling

Audit rule is a **low** warning (photos helpful, not required). Commercial mapping treats it as **weak supporting** evidence only — cannot independently create Content Foundation. Does not change Website Growth Audit scoring.

---

## Service capabilities (code-defined)

Active: `WEBSITE_DEVELOPMENT`, `SEO`, `LOCAL_SEO`, `CONTENT`, `CONVERSION_OPTIMIZATION`  

Inactive: `AI_AUTOMATION`, `MARKETING_AUTOMATION`, `CUSTOM_SOFTWARE`

---

## Workstreams

Same V1 families: Content Foundation, Search Optimization, Technical SEO, Local Search Foundation, Conversion Optimization, Website Experience, Performance Optimization.

---

## Priority algorithm (deterministic)

Unchanged bands: CRITICAL ≥ 80 · HIGH ≥ 55 · MEDIUM ≥ 30 · LOW; max **2** CRITICAL.

Weak supporting findings (e.g. `no-images`) excluded from priority scoring. Suppressed strength workstreams do not compete for ranking.

---

## Competitive evidence

Optional. Current comparison only. Stale excluded. Sprint 12 AI interpretation is not an input.

---

## Snapshot semantics

- Generate / Rebuild → new row; prior → `SUPERSEDED`  
- Refresh → load only  
- Staleness fingerprint includes mapping version  
- Explicit Approve required  

---

## Not in scope

Pricing, proposals, opportunities, public plans, AI explanation (Commercial Sprint 2), outreach.

Code: `src/lib/commercialization/`  
UI: prospect detail → Implementation Plan  
