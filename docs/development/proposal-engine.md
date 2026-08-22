# Commercial Proposal Engine V1 (Commercial Sprint 6 / 6.1 / 6.2)

**Status:** Implemented (internal) · Sprint 6.2 financial provenance · **Sprint 7 delivery** (see `proposal-delivery.md`)  
**OpenAI / Places / crawl / Stripe / outbound:** **0** (Resend only via explicit Send in Sprint 7 delivery)  
**Audience:** Internal operators; token-gated client view at `/proposal/{token}` (Sprint 7)

```text
Approved Commercial Scope  ──┐
                             ├──→  Commercial Proposal (snapshot)
Approved Commercial Pricing ─┘
         ↑
   workUnitKey + sourceActionKey provenance (Sprint 6.2)
```

---

## Authority

| Layer | Decides |
|---|---|
| **Scope** | What we are offering — **semantic authority** (sections, deliverables, `sourceActionKey`) |
| **Pricing** | What we are charging — **monetary authority** (line totals, `workUnitKey`, base / optional investment) |
| **Proposal** | How approved Scope + Pricing are **presented** to the client — **presentation authority only** |

The Proposal Engine **assembles** approved commercial facts. It does **not** recalculate scope, deliverables, quantities, prices, discounts, guarantees, or payment terms.

**Core principle (Sprint 6.2):** A proposal may polish the description of authorized work. It may never change what the client is actually buying.

Creation snapshots approved data into `snapshotJson`. Historical proposals remain renderable after later Scope/Pricing revisions. Never silently regenerate.

---

## Version

`COMMERCIAL_PROPOSAL_VERSION = 1`  
`COMMERCIAL_PROPOSAL_PRESENTATION_VERSION = 3` (Sprint 6.2 financial provenance)  
Migration: `20260821200000_add_commercial_proposals` (no Sprint 6.2 schema migration)

Existing proposal snapshots remain historical. Drafts / reviewed rows built under presentation v1 or v2 show **stale** when presentation version diverges — revise to rebuild.

---

## Sprint 6.2 — financial provenance hardening

Production acceptance on Rooftop Solutions exposed semantic mismatches between Recommended Approach and Investment (e.g. trust-signals presented as Conversion Path Assessment, generic structured-data as LocalBusiness, unauthorized script-weight). Sprint 6.2 fixes **provenance architecture**, not Scope or Pricing.

| Area | Behavior |
|---|---|
| Work-unit identity | Known actions use authoritative `workUnitKey` / `sourceActionKey` — **no fuzzy title substitution** |
| Presentation labels | Keyed from `WORK_UNIT_PRESENTATION_LABELS` / `WORK_UNIT_INVESTMENT_INCLUDE_LABELS` |
| Financial groups | Split conversion implementation (`Conversion Optimization`) vs assessment (`Conversion Path Assessment`) |
| Manual/custom work | Human-entered title preserved; section-based group fallback; safe `Additional Implementation Work` when ambiguous |
| Reconciliation | `reconcile.ts` validates lines, groups, totals, and approach ↔ investment consistency before snapshot creation |
| Failure mode | `PROPOSAL_FINANCIAL_RECONCILIATION_FAILED` — bounded internal error; no misleading proposal |

Code: `src/lib/commercialization/proposal/presentation.ts`, `reconcile.ts`

### Known-action identity (examples)

| workUnitKey | Investment include label | Financial group |
|---|---|---|
| improve-meta | Improve meta descriptions | Content & Search Foundation |
| heading-architecture | Page heading structure | Content & Search Foundation |
| structured-data | Structured data markup | Technical SEO |
| local-schema | LocalBusiness structured data | Local Search Foundation |
| trust-signals | Trust signals near conversion points | Conversion Optimization |
| conversion-assessment | Conversion path assessment | Conversion Path Assessment |
| script-weight | Script and third-party weight reduction | Performance Optimization |

**Forbidden substitutions:** trust-signals → assessment; structured-data → LocalBusiness; unauthorized script-weight from group capacity or title regex.

### Reconciliation invariant

Before snapshot creation succeeds:

1. Every included pricing line appears exactly once in client financial lines  
2. Every deterministic line resolves to authorized Scope provenance  
3. Presentation labels match work-unit identity (no semantic substitution)  
4. Group subtotals + engagement adjustment = `includedInvestmentCents`  
5. Optional lines sum to `optionalInvestmentCents`  
6. Investment cannot introduce a known action absent from approved Scope  

---

## Sprint 6.1 — presentation hardening

Presentation-only changes (no Scope/Pricing authority changes):

| Area | Behavior |
|---|---|
| Audit language | Section descriptions with “N supporting audit findings” are **not** shown client-side |
| Client-value taxonomy | Deterministic why-it-matters copy per known Scope section |
| Deliverable labels | Polished presentation titles; authoritative Scope titles retained as `sourceTitle` |
| Conversion assessment | Explained as a path assessment — not sold as full conversion implementation |
| Financial grouping | Grouped commercial areas with include lists + group subtotals (no invoice-style line prices) |
| Dedupe-safe money | Content & Search Foundation owns shared heading/linking dollars once |
| Claim safety | No traffic / ranking / lead / revenue guarantees; no ROI framing |

### Client-value taxonomy (examples)

| Scope section | Client value direction |
|---|---|
| Content Foundation | Clearer content structure for visitors and search engines |
| Search Optimization | Stronger on-page signals and navigational connections |
| Performance Optimization | Reduce delivery overhead while protecting strengths |
| Technical SEO | Stronger technical structure / meaning signals |
| Local Search Foundation | Consistent structured local-business information |
| Conversion Optimization | Improve contact paths / trust signals / conversion support |

### Financial grouping rules (Sprint 6.2)

Financial groups may differ from Scope section titles. Ownership is deterministic by **work-unit key** (manual/custom uses Scope section fallback only):

| Group | Typical work units | 1st Choice example |
|---|---|---|
| Content & Search Foundation | improve-meta, heading, open-graph, internal linking, scanability, content-depth | $1,050 |
| Performance Optimization | inline-css, script-weight | $700 |
| Technical SEO | canonical, structured-data | $350 |
| Local Search Foundation | local-schema, nap | $700 |
| Conversion Optimization | trust-signals, cta-clarity | — |
| Conversion Path Assessment | conversion-assessment | $200 |

Group subtotals must sum (plus engagement adjustment if any) to approved `includedInvestmentCents`. Deduplicated work is never double-charged. Recommended Approach may still list Content and Search as separate Scope sections while Investment combines them financially.

### Claim safety

Allowed: supports, strengthens, designed to, helps communicate, creates a stronger foundation.  
Forbidden in generated copy: will increase traffic/rankings/leads/revenue, guarantees, ROI/payback claims.

---

## Creation gates

All required:

1. Opportunity exists (non-terminal stage)
2. `CommercialScope.status === APPROVED`
3. `CommercialPricing.status === APPROVED`
4. Pricing is **COMPLETE** (no unpriced included custom work)
5. Pricing corresponds to that approved Scope
6. Pricing is not stale relative to Scope
7. **Financial reconciliation passes** (Sprint 6.2)

Clear operator-facing errors on block. Draft/Reviewed Scope or Pricing cannot create a Proposal. Reconciliation failures return `PROPOSAL_FINANCIAL_RECONCILIATION_FAILED` (internal diagnostics only).

---

## Status lifecycle

`DRAFT` → `REVIEWED` → `APPROVED` → (via Revise) prior becomes `SUPERSEDED`

| Transition | Rule |
|---|---|
| Create | New row → `DRAFT` |
| Mark Reviewed | Human |
| Approve | Human (requires REVIEWED); then **immutable** |
| Revise | New `DRAFT` from current approved Scope + Pricing; prior active proposals superseded |

Never mutate approved historical proposal content.

---

## Editing rules

**Editable (presentation only)** while `DRAFT` / `REVIEWED`:

- title, executive summary, business context
- approach introduction, timeline note, next-step text

**Not editable via Proposal** (revise Scope/Pricing upstream):

- deliverables, included/optional state, quantities, prices, totals, currency
- generated presentation mappings (taxonomy / financial groups)

---

## Snapshot & client presentation

Target preview order:

1. JS Solutions / title / location / date  
2. Executive Summary  
3. Business Context  
4. Recommended Approach (why it matters → what we’ll do)  
5. Implementation Considerations  
6. Investment (intro → grouped areas → base total)  
7. Optional Enhancements (if any)  
8. Timeline  
9. Next Step  
10. Methodology / disclaimer footer  

Optional work and optional dollars stay separate from base investment.

---

## Staleness

UI may mark CURRENT vs STALE when newer approved Scope/Pricing or proposal/presentation versions diverge from the snapshot fingerprint.

Stale ≠ invalid historically. Never auto-regenerate; operator uses **Revise**.

---

## Opportunity integration

Opportunity workspace card: create / edit / preview / review / approve / revise. Activity types: `PROPOSAL_CREATED`, `PROPOSAL_REVIEWED`, `PROPOSAL_APPROVED`, `PROPOSAL_REVISED`, `PROPOSAL_SUPERSEDED`.

No automatic Opportunity stage change to `PROPOSAL_READY`.

Routes: `/reports/opportunities/[opportunityId]/proposal/[proposalId]` (+ `?preview=1`). Public `/report/*` must not reference proposals.

---

## Security / privacy

Internal session required. Analytics sanitizer forbids proposal commercial keys (`proposal_id`, `proposal_status`, `proposal_total`, `commercial_proposal`, etc.).

---

## Side-effect budget

| Action | OpenAI | Places | Crawl | Contacts | Resend | Stripe |
|---|---|---|---|---|---|---|
| Create / revise / approve / page load | 0 | 0 | 0 | 0 | 0 | 0 |

DB + deterministic presentation only.

---

## Future boundary (not V1)

Public proposal links, email, PDF generation, acceptance, e-sign, Stripe checkout, payment schedules, contracts, AI-written proposals.

---

## Code

`src/lib/commercialization/proposal/`  
Verify: `proposal.verify.ts`  
UI: `src/components/opportunities/proposal-*.tsx`, Opportunity proposal card
