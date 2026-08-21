# Commercial Scope Engine V1 (Commercial Sprint 4 / 4.1)

**Status:** Implemented (internal) · Sprint 4.1 quality hardening  
**OpenAI / Places / crawl / Resend / Stripe:** **0**  
**Audience:** Internal operators only

```text
Implementation Plan   = recommendation (facts + workstreams)
        ↓
Commercial Scope      = human-controlled commercial offer definition
        ↓
Commercial Pricing    = deterministic recommendation + human approval
        ↓
(Future) Proposal
```

AI Implementation Strategy is **not** an input to Scope generation.

---

## Version

`COMMERCIAL_SCOPE_VERSION = 1` (persisted Scope document format)  
`COMMERCIAL_SCOPE_MAPPING_VERSION = 2` (Sprint 4.1 plan→scope mapping quality)  
Migration: `20260821100000_add_commercial_scopes` (no Sprint 4.1 schema migration)

Existing approved scopes remain historical. Drafts built before mapping v2 show a **stale** indicator so operators can **Revise** to rebuild polished titles and deduped considerations.

Pricing: see [pricing-engine.md](pricing-engine.md) (Commercial Sprint 5).

---

## Status model

`DRAFT` → `REVIEWED` → `APPROVED`  
`SUPERSEDED` when a revision is created.

**Approved scopes are immutable.** Material changes require **Revise** → new draft snapshot; prior approved row remains historical.

---

## Plan → Scope mapping

When an Opportunity has a current Implementation Plan:

- Non-removed workstreams → Scope sections with **polished titles** (not raw enums)
- Recommended actions → deliverables using **RecommendedAction labels** as titles (**except** evidence-only `address-competitive-*`)
- Section capabilities = **exact active capabilities** from the source workstream (not every opportunity capability)
- Preservation constraints → deduped `considerationsJson` by stable key (`preserve:{category}`), retaining `sourceWorkstreamIds` + deduped `maintenanceActions`
- Assumptions / exclusions start **empty** (operator-added; no auto boilerplate)
- Default title: `{Business} — Implementation Scope`
- Inactive capabilities never auto-mapped

Scope may also be created with **no** Implementation Plan (empty manual draft).

---

## Operator controls

Include/exclude sections & deliverables · optional/add-on · reorder · edit commercial titles/descriptions · add/remove **manual** deliverables · edit assumptions/exclusions · active capabilities only.

Client/commercial text is primary in the UI; internal provenance (`PLAN`, action keys, workstream enums) is not the primary label. Preview (`?preview=1`) hides IDs, enums, and source keys.

Deterministic audit evidence is not editable via Scope.

---

## Opportunity activity

`SCOPE_CREATED` · `SCOPE_REVIEWED` · `SCOPE_APPROVED` · `SCOPE_REVISED` · `SCOPE_SUPERSEDED`

---

## Staleness

Fingerprint includes opportunity id, plan id, plan/mapping versions, `scopeVersion`, and `scopeMappingVersion`.  
Stale indicator only — Scope is never auto-mutated.

---

## UI

| Surface | Route |
|---|---|
| Opportunity card | `/reports/opportunities/[id]` |
| Scope workspace | `/reports/opportunities/[id]/scope/[scopeId]` |
| Client-readable preview | `?preview=1` (internal only) |

---

## Not in scope

Proposals, PDF, public links, Stripe, e-sign, automatic Opportunity stage changes, AI scope generation, new service capabilities.

Code: `src/lib/commercialization/scope/`  
Verify: `scope.verify.ts`
