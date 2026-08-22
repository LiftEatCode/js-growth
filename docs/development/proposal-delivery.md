# Commercial Proposal Delivery V1 (Commercial Sprint 7)

**Status:** Implemented (internal operator + token-gated client view)  
**OpenAI / Places / crawl / contact discovery / Stripe:** **0**  
**Resend:** **MAX 1 per explicit Send Proposal action**

```text
APPROVED current CommercialProposal
  → ProposalDelivery (human-prepared, snapshotted recipient + message)
  → secure share token (/proposal/{token})
  → optional explicit Resend send
  → operator-recorded client decision
```

---

## Authority

| Layer | Decides |
|---|---|
| **Proposal** | Commercial document content (Scope + Pricing snapshot) |
| **Proposal Delivery** | Who receives it, message copy, send state, share access |
| **Client decision** | Operator-recorded commercial state after delivery |

Nothing sends automatically. Nothing marks Won automatically. **ACCEPTED ≠ signed, paid, or Won.**

---

## Version

`PROPOSAL_DELIVERY_VERSION = 1`  
Migration: `20260822120000_add_proposal_delivery`

---

## Delivery lifecycle

1. Operator **Prepare Delivery** on an APPROVED, **current** (non-stale) Proposal  
2. Review/edit recipient, subject, body (deterministic defaults, no OpenAI)  
3. **Mark Ready** when reviewed  
4. **Copy Secure Link** (high-entropy token; hash stored server-side)  
5. **Send Proposal** — explicit action, **one Resend call**  
6. Track **Proposal link viewed** (server-side; not “email opened” or “client read”)  
7. **Revoke Link** if needed  
8. **Record Decision** (INTERESTED / CHANGES_REQUESTED / DECLINED / ACCEPTED)

Statuses: `DRAFT` → `READY` → `SENDING` → `SENT` | `FAILED`

---

## Share security

- 32-byte random token, base64url, stored as SHA-256 hash only  
- Route: `/proposal/{token}` — `noindex`, not in sitemap  
- Revoked deliveries return not-found  
- No internal IDs, provenance, or workspace chrome on public view  
- Reuses `ProposalDocument` renderer (same as internal `?preview=1`)

---

## Decision semantics

| Decision | Meaning |
|---|---|
| PENDING | No operator-recorded outcome yet |
| INTERESTED | Positive signal; follow up manually |
| CHANGES_REQUESTED | Revise Scope/Pricing/Proposal upstream — **never mutate sent proposal** |
| DECLINED | Operator-recorded pass; does **not** auto-mark Opportunity LOST |
| ACCEPTED | Prospect communicated intent to proceed — **not** e-sign, contract, or payment |

---

## Activity types

`PROPOSAL_DELIVERY_PREPARED`, `PROPOSAL_SENT`, `PROPOSAL_SEND_FAILED`, `PROPOSAL_LINK_VIEWED`, `PROPOSAL_ACCESS_REVOKED`, `PROPOSAL_DECISION_RECORDED`

Activity metadata excludes full email body.

---

## Analytics / privacy

Forbidden keys include: `proposal_delivery_id`, `share_token`, `recipient_email`, `proposal_email_body`, `proposal_decision_note`, etc.

---

## Code

`src/lib/commercialization/proposal-delivery/`  
Verify: `proposal-delivery.verify.ts`  
UI: `opportunity-proposal-delivery-card.tsx`  
Public: `src/app/proposal/[token]/page.tsx`

**Sprint 8 handoff:** Proposal `ACCEPTED` decision is preferred before Agreement creation; Agreement acceptance is separate and does not collect payment (see `agreement-engine.md`).
