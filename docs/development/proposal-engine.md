# Commercial Proposal Engine V1 (Commercial Sprint 6)

**Status:** Implemented (internal)  
**OpenAI / Places / crawl / Resend / Stripe / outbound:** **0**  
**Audience:** Internal operators only — no public proposal URL, PDF, email, acceptance, e-sign, or checkout

```text
Approved Commercial Scope  ──┐
                             ├──→  Commercial Proposal (snapshot)
Approved Commercial Pricing ─┘
```

---

## Authority

| Layer | Decides |
|---|---|
| **Scope** | What we are offering (sections, deliverables, assumptions, exclusions) |
| **Pricing** | What we are charging (line totals, base / optional investment) |
| **Proposal** | How approved Scope + Pricing are **presented** to the client |

The Proposal Engine **assembles** approved commercial facts. It does **not** recalculate scope, deliverables, quantities, prices, discounts, guarantees, or payment terms.

Creation snapshots approved data into `snapshotJson`. Historical proposals remain renderable after later Scope/Pricing revisions. Never silently regenerate.

---

## Version

`COMMERCIAL_PROPOSAL_VERSION = 1`  
`COMMERCIAL_PROPOSAL_PRESENTATION_VERSION = 1`  
Migration: `20260821200000_add_commercial_proposals`

Source fingerprint includes opportunity, scope id/revision, pricing id/revision, and both proposal versions.

---

## Creation gates

All required:

1. Opportunity exists (non-terminal stage)
2. `CommercialScope.status === APPROVED`
3. `CommercialPricing.status === APPROVED`
4. Pricing is **COMPLETE** (no unpriced included custom work)
5. Pricing corresponds to that approved Scope
6. Pricing is not stale relative to Scope

Clear operator-facing errors on block. Draft/Reviewed Scope or Pricing cannot create a Proposal.

---

## Status lifecycle

`DRAFT` → `REVIEWED` → `APPROVED` → (via Revise) prior becomes `SUPERSEDED`

| Transition | Rule |
|---|---|
| Create | New row → `DRAFT` |
| Mark Reviewed | Human |
| Approve | Human; then **immutable** |
| Revise | New `DRAFT` from current approved Scope + Pricing; prior active proposals superseded |

Never mutate approved historical proposal content.

---

## Editing rules

**Editable (presentation only)** while `DRAFT` / `REVIEWED`:

- title, executive summary, business context
- approach introduction, timeline note, next-step text

**Not editable via Proposal** (revise Scope/Pricing upstream):

- deliverables, included/optional state, quantities, prices, totals, currency

---

## Snapshot & client presentation

Snapshot includes business identity, included/optional sections and deliverables, assumptions, exclusions, considerations (deduped), and investment lines grouped by primary Scope section.

Deduplicated priced work appears **once**. Multi-section support may show “Also supports …” without duplicating dollars. Client-visible line sums must reconcile to approved Pricing (including engagement adjustment when the minimum engagement lifted the base total).

Optional work and optional dollars stay separate from base investment.

Deterministic executive summary copy — no OpenAI. No traffic/lead/ranking/revenue guarantees. No automatic contractual timelines or payment schedules.

---

## Staleness

UI may mark CURRENT vs STALE when newer approved Scope/Pricing (or proposal version) diverges from the snapshot fingerprint.

Stale ≠ invalid historically. Never auto-regenerate; operator uses **Revise**.

---

## Opportunity integration

Opportunity workspace card: create / edit / preview / review / approve / revise. Activity types: `PROPOSAL_CREATED`, `PROPOSAL_REVIEWED`, `PROPOSAL_APPROVED`, `PROPOSAL_REVISED`, `PROPOSAL_SUPERSEDED`.

No automatic Opportunity stage change to `PROPOSAL_READY` in Sprint 6.

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
