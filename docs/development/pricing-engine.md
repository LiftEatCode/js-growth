# Commercial Pricing Engine V1 (Commercial Sprint 5 / 5.1)

**Status:** Implemented (internal) · Sprint 5.1 catalog + incomplete-price safety  
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
Commercial Proposal (Sprint 6 — presentation only)
```

---

## Version

`COMMERCIAL_PRICING_VERSION = 1` (persisted pricing document format)  
`COMMERCIAL_PRICING_CONFIG_VERSION = 2` (Sprint 5.1 catalog + completeness)  
Currency: **USD** · money stored as **integer cents**  
Migration: `20260821120000_add_commercial_pricing` (no Sprint 5.1 schema migration)

Existing pricing snapshots remain historical. Drafts built under config v1 show **stale** when config version diverges — revise to rebuild.

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

## Known deterministic vs CUSTOM

**Known** Implementation Plan / Scope `sourceActionKey` values map through the versioned work-unit catalog (exact key match preferred).

**Unknown / manual** deliverables remain:

- work type `CUSTOM`
- effort `CUSTOM`
- no deterministic recommendation

Do not fuzzy-match or AI-price unknown work.

### Sprint 5.1 catalog additions (stable keys)

| Key | Type | Band |
|---|---|---|
| `scanability` | OPTIMIZATION | MEDIUM |
| `inline-css` | TECHNICAL | MEDIUM |
| `script-weight` | TECHNICAL | MEDIUM |
| `local-schema` | CONFIGURATION | MEDIUM |
| `nap` | OPTIMIZATION | MEDIUM |

---

## Work-unit normalization

Scope deliverables map to canonical work-unit keys. Overlapping deliverables across sections **collapse to one priced line**, retaining multi-section provenance (`sourceSectionTitles`).

Vague Conversion Optimization wording maps to **ASSESSMENT**, not full conversion implementation.

---

## Pricing completeness

| State | Meaning |
|---|---|
| `COMPLETE` | Every included non-optional line has a final price |
| `INCOMPLETE_CUSTOM_PRICING` | ≥1 included non-optional line still needs a human-entered price |

Optional custom work does **not** make base pricing incomplete.

When incomplete:

- Operator UI shows **Known priced work** subtotal + unpriced count
- Primary **Recommended / Final investment** reads **Incomplete** (not a faux-complete dollar total)
- Client preview (`?preview=1`) shows “Pricing is not complete.” / investment pending — never a partial total as the investment
- **Approve** is blocked

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

Proposals (see Proposal Engine V1), PDFs, public links, Stripe, invoices, retainers, automatic discounts, AI pricing, e-sign, outbound email.

Code: `src/lib/commercialization/pricing/`  
Verify: `pricing.verify.ts`
