# Opportunity Management V1 (Commercial Sprint 3)

**Status:** Implemented (internal)  
**OpenAI / Places / crawl / contact discovery / Resend / Stripe:** **0**  
**Audience:** Internal operators only

```text
Prospect (identified / qualified)
        ↓  explicit human action
Opportunity (commercial pursuit)
        ↓  future sprints
Scope → Pricing → Proposal → Won/Lost → Client
```

**Prospect ≠ Opportunity**

| Concept | Meaning |
|---|---|
| **Prospect** | Identified/qualified potential business in a campaign |
| **Opportunity** | Human-created record that JS Solutions intends to pursue commercially |

Example: Prospect `QUALIFIED` + Opportunity `NEW` means qualification passed and an operator opened a sales pursuit.

---

## Version

`OPPORTUNITY_MANAGEMENT_VERSION = 1`

Migration: `20260820200000_add_opportunities`

---

## Stages (sales pipeline)

`NEW` → `QUALIFIED` → `DISCOVERY` → `SOLUTION_FIT` → `PROPOSAL_READY` → `WON` / `LOST`

These are **not** Prospect qualification statuses.

Active stages: everything except `WON` / `LOST`.

Reopen: terminal → active records `REOPENED`. Direct `WON` ↔ `LOST` is blocked.

---

## Creation rules

- Requires internal session
- Requires Prospect in campaign
- **At most one active Opportunity per Prospect** (`DUPLICATE_ACTIVE`)
- Implementation Plan **not** required
- Links current Implementation Plan + matching completed AI Strategy when available
- Snapshots recommended capabilities from plan workstreams (active capabilities only)
- **Never** calls OpenAI, Places, crawl, contact discovery, Resend, or Stripe

---

## Capability snapshot semantics

On create (and explicit **Refresh**):

- Derive unique active `ServiceCapabilityId` values from non-removed workstreams
- Persist JSON snapshot with `sourcePlanId`, `snapshottedAt`, `capabilityVersion`
- Inactive capabilities (`AI_AUTOMATION`, etc.) are never auto-mapped

**Not auto-updated** when the Implementation Plan is rebuilt.

Operator must click **Refresh from current Implementation Plan**.

---

## Stale intelligence

Opportunity shows indicators when linked plan / strategy / comparison / capability source diverge.

Does **not** rewrite commercial state automatically.

---

## Activity history

Append-only `OpportunityActivity`:

`OPPORTUNITY_CREATED`, `STAGE_CHANGED`, `NEXT_ACTION_CHANGED`, `NOTE_ADDED`, `CAPABILITIES_UPDATED`, `MARKED_WON`, `MARKED_LOST`, `REOPENED`

---

## Next action

`nextAction` + `nextActionAt` — operator workflow only. Overdue/upcoming classification in UI. No scheduler, no automated follow-up.

---

## Won / Lost

- **WON:** sets `wonAt`. Does **not** create a Client (no Client model in V1).
- **LOST:** requires `lostReason` (`PRICE`, `NO_RESPONSE`, `NOT_READY`, `NO_FIT`, `COMPETITOR`, `DIY`, `TIMING`, `OTHER`) + optional note.

---

## UI

| Route | Purpose |
|---|---|
| `/reports/opportunities` | List + filters |
| `/reports/opportunities/[id]` | Detail workflow |
| Prospect detail → Opportunity card | Create / compact status / link |

---

## Not in scope

Pricing, scope engine, proposals, contracts, invoices, Stripe checkout, automated email/follow-up, calendar, CRM sync, public opportunity pages, client portal.

Code: `src/lib/commercialization/opportunities/`  
Verify: `opportunity.verify.ts`
