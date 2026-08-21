# Commercial Scope Engine V1 (Commercial Sprint 4)

**Status:** Implemented (internal)  
**OpenAI / Places / crawl / Resend / Stripe:** **0**  
**Audience:** Internal operators only

```text
Implementation Plan   = recommendation (facts + workstreams)
        ↓
Commercial Scope      = human-controlled commercial offer definition
        ↓
(Future) Pricing
        ↓
(Future) Proposal
```

AI Implementation Strategy is **not** an input to Scope generation.

---

## Version

`COMMERCIAL_SCOPE_VERSION = 1`  
Migration: `20260821100000_add_commercial_scopes`

---

## Status model

`DRAFT` → `REVIEWED` → `APPROVED`  
`SUPERSEDED` when a revision is created.

**Approved scopes are immutable.** Material changes require **Revise** → new draft snapshot; prior approved row remains historical.

---

## Plan → Scope mapping

When an Opportunity has a current Implementation Plan:

- Non-removed workstreams → Scope sections (title, summary, capabilities)
- Recommended actions → deliverables **except** evidence-only competitive-gap actions (`address-competitive-*` / “Address competitive … gap relative to selected peers”)
- Preservation constraints → `considerationsJson` (not a Performance Optimization section)
- Inactive capabilities never auto-mapped

Scope may also be created with **no** Implementation Plan (empty manual draft).

---

## Operator controls

Include/exclude sections & deliverables · optional/add-on · reorder · edit commercial titles/descriptions · add/remove **manual** deliverables · edit assumptions/exclusions · active capabilities only.

Deterministic audit evidence is not editable via Scope.

---

## Opportunity activity

`SCOPE_CREATED` · `SCOPE_REVIEWED` · `SCOPE_APPROVED` · `SCOPE_REVISED` · `SCOPE_SUPERSEDED`

---

## Staleness

Fingerprint includes opportunity id, plan id, plan/mapping versions, scope version.  
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

Pricing, proposals, PDF, public links, Stripe, e-sign, automatic Opportunity stage changes, AI scope generation, new service capabilities.

Code: `src/lib/commercialization/scope/`  
Verify: `scope.verify.ts`
