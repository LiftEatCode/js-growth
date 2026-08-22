# Commercial Proposal Engine V1 (Commercial Sprint 6 / 6.1)

**Status:** Implemented (internal) · Sprint 6.1 presentation hardening  
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
`COMMERCIAL_PROPOSAL_PRESENTATION_VERSION = 2` (Sprint 6.1 client presentation)  
Migration: `20260821200000_add_commercial_proposals` (no Sprint 6.1 schema migration)

Existing proposal snapshots remain historical. Drafts / reviewed rows built under presentation v1 show **stale** when presentation version diverges — revise to rebuild.

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

Code: `src/lib/commercialization/proposal/presentation.ts`

### Client-value taxonomy (examples)

| Scope section | Client value direction |
|---|---|
| Content Foundation | Clearer content structure for visitors and search engines |
| Search Optimization | Stronger on-page signals and navigational connections |
| Performance Optimization | Reduce delivery overhead while protecting strengths |
| Technical SEO | Stronger technical structure / meaning signals |
| Local Search Foundation | Consistent structured local-business information |
| Conversion Optimization | Review contact paths / CTAs / trust (assessment language) |

### Deliverable presentation mapping

Exact Scope deliverable text is unchanged in persistence. Client preview uses polished labels (e.g. heading hierarchy → “Improve page heading structure and hierarchy”). Unknown / manual titles fall back to the human-entered title.

### Financial grouping rules

Financial groups may differ from Scope section titles. Ownership is deterministic by work-unit key (title inference fallback):

| Group | Typical work units | 1st Choice example |
|---|---|---|
| Content & Search Foundation | heading, internal linking, scanability | $1,050 |
| Performance Optimization | inline CSS, script weight | $700 |
| Technical SEO | canonical | $350 |
| Local Search Foundation | LocalBusiness schema, NAP | $700 |
| Conversion Path Assessment | conversion assessment | $200 |

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

Clear operator-facing errors on block. Draft/Reviewed Scope or Pricing cannot create a Proposal.

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
