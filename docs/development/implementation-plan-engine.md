# Implementation Plan Engine (Commercial Sprint 1)

**Status:** Implemented  
**OpenAI / Places / crawl / Resend on generate:** **0**  
**Audience:** Internal operators only

Deterministic bridge from Website Growth Audit (+ optional current competitive comparison) to JS Solutions service workstreams.

```text
Audit facts (+ optional CURRENT CompetitiveComparisonSnapshot)
        ↓
Normalized evidence
        ↓
Capability + workstream mapping rules
        ↓
Priority + actions + preservation constraints
        ↓
Persisted ImplementationPlan snapshot
        ↓
Human review / approve
        ↓
(Future) Opportunity / Proposal  — NOT implemented
```

---

## Versions

| Constant | Value |
|---|---|
| `IMPLEMENTATION_PLAN_VERSION` | 1 |
| `IMPLEMENTATION_MAPPING_VERSION` | 1 |
| `SERVICE_CAPABILITY_VERSION` | 1 |

---

## Service capabilities (code-defined)

Active (auto-mapped when evidence supports):

- `WEBSITE_DEVELOPMENT`
- `SEO`
- `LOCAL_SEO`
- `CONTENT`
- `CONVERSION_OPTIMIZATION`

Present but **inactive** (never auto-mapped in V1):

- `AI_AUTOMATION`
- `MARKETING_AUTOMATION`
- `CUSTOM_SOFTWARE`

---

## Workstreams

- `CONTENT_FOUNDATION` → Content, SEO
- `SEARCH_OPTIMIZATION` → SEO
- `TECHNICAL_SEO` → SEO, Website Development
- `LOCAL_SEARCH_FOUNDATION` → Local SEO
- `CONVERSION_OPTIMIZATION` → Conversion Optimization, Website Development
- `WEBSITE_EXPERIENCE` → Website Development
- `PERFORMANCE_OPTIMIZATION` → Website Development

---

## Priority algorithm (deterministic)

Score from audit finding priorities, category weakness percent, competitive GAP/MAJOR_GAP magnitude, competitors outperforming, and audit+competitive reinforcement.

Bands: CRITICAL ≥ 80 · HIGH ≥ 55 · MEDIUM ≥ 30 · LOW otherwise.

At most **2** CRITICAL workstreams (extras demoted to HIGH).

---

## Competitive evidence

Optional. Used only when a **current** (non-stale) `CompetitiveComparisonSnapshot` exists.

Stale comparisons are **excluded** (not fabricated). Sprint 12 AI interpretation is **not** an input.

---

## Snapshot semantics

- Generate / Rebuild → new row; prior DRAFT/REVIEWED/APPROVED → `SUPERSEDED`
- Page refresh → load only (no regenerate)
- Staleness via fingerprint: auditReportId, comparisonSnapshotId (or null), plan/mapping/capability versions
- Explicit Approve records `approvedAt` + `approvedByEmail`
- Material workstream edits on APPROVED → revert to DRAFT and clear approval

---

## Not in this sprint

Pricing, proposals, opportunities, public plans, AI explanation, outreach.

Code: `src/lib/commercialization/`  
UI: prospect detail → Implementation Plan panel  
SOP acceptance: generate on audited prospect; confirm internal-only.
