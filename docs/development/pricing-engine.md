# Commercial Pricing Engine V1 (Commercial Sprint 5)

**Status:** Implemented (internal)  
**OpenAI / Places / crawl / Resend / Stripe:** **0**  
**Audience:** Internal operators only

```text
Commercial Scope (approved)
        ↓
Canonical commercial work units (deduped)
        ↓
Deterministic pricing recommendation
        ↓
Human review / overrides
        ↓
Approved historical pricing snapshot
        ↓
(Future) Proposal
```

---

## Version

`COMMERCIAL_PRICING_VERSION = 1`  
`COMMERCIAL_PRICING_CONFIG_VERSION = 1`  
Currency: **USD** · money stored as **integer cents**  
Migration: `20260821120000_add_commercial_pricing`

---

## V1 pricing configuration

| Effort band | Price |
|---|---|
| SMALL | $150 |
| MEDIUM | $350 |
| LARGE | $750 |
| ASSESSMENT | $200 |
| CUSTOM | no auto price (human-entered) |

Minimum engagement: **$750**  
Assessment-only exception: when every included base line is `ASSESSMENT`, minimum is **not** applied.

---

## Work-unit normalization

Scope deliverables map to canonical work-unit keys (e.g. `heading-architecture`, `internal-linking`).  
Overlapping deliverables across sections **collapse to one priced line**, retaining multi-section provenance (`sourceSectionTitles`).

Vague Conversion Optimization wording maps to **ASSESSMENT**, not full conversion implementation.

---

## Lifecycle

`DRAFT` → `REVIEWED` → `APPROVED`  
`SUPERSEDED` on revise.

Approved pricing is immutable. Revise rebuilds from the current **approved** Scope.

Requires approved Commercial Scope to create.

---

## Operator controls

Include/exclude · optional · quantity · manual price override (reason required) · add/remove CUSTOM work · notes · review · approve.

CUSTOM included work requires a human-entered price before approval.  
Original deterministic recommendation is always preserved on the line.

---

## Opportunity activity

`PRICING_CREATED` · `PRICING_REVIEWED` · `PRICING_APPROVED` · `PRICING_REVISED` · `PRICING_SUPERSEDED`

---

## UI

| Surface | Route |
|---|---|
| Opportunity card | `/reports/opportunities/[id]` |
| Pricing workspace | `/reports/opportunities/[id]/pricing/[pricingId]` |
| Client-readable preview | `?preview=1` (internal only) |

---

## Not in scope

Proposals, PDFs, public links, Stripe, invoices, retainers, automatic discounts, AI pricing, e-sign, outbound email.

Code: `src/lib/commercialization/pricing/`  
Verify: `pricing.verify.ts`
