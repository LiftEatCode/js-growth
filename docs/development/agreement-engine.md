# Agreement Engine (Commercial Sprint 8)

## Purpose

Move from **Proposal commercial intent** to **explicit client acceptance of immutable commercial terms**.

| Layer | Authority |
|-------|-----------|
| Proposal | Client presentation |
| **CommercialAgreement** | Contractual / commercial terms |
| **AgreementAcceptance** | Acceptance evidence |
| Payment (Sprint 9) | Separate from acceptance |

**Accepted Agreement ≠ paid ≠ Opportunity WON.**

## Versions

- `COMMERCIAL_AGREEMENT_VERSION = 1`
- `COMMERCIAL_AGREEMENT_PRESENTATION_VERSION = 1`
- `COMMERCIAL_AGREEMENT_TERMS_VERSION = 1`

## Creation gates

- Approved, current (non-stale) Proposal
- Authoritative Scope + Pricing on Proposal
- Prefer `ProposalDecision = ACCEPTED` on current delivery
- Operator override with bounded reason if intent not recorded
- Human creation only (never automatic)

## Lifecycle

`DRAFT → REVIEWED → APPROVED → (client) ACCEPTED`

Also: `SUPERSEDED`, `VOIDED`

- Editable presentation/terms while `DRAFT` / `REVIEWED`
- `APPROVED` locks commercial snapshot
- `ACCEPTED` permanently immutable

## Snapshot

Built from approved Proposal snapshot + Pricing totals (no recalculation). Includes:

- Business identity, sections/deliverables (client labels only)
- Assumptions, exclusions, considerations
- Investment (included / optional / total, integer cents)
- Payment terms, timeline, responsibilities, disclaimers, acceptance language

Internal keys (`workUnitKey`, `sourceActionKey`, enums) are **not** in client snapshot.

## Payment terms (Agreement-owned)

Types: `FULL_UPFRONT`, `DEPOSIT_AND_BALANCE`, `CUSTOM`

Default: **DEPOSIT_AND_BALANCE** at **50% / 50%**, aligned with website-development docs (deposit before work, balance before handoff).

- Money stored as integer cents
- `deposit + balance = total` (floor deposit, remainder balance)
- Sprint 9 consumes persisted terms without guessing

## Snapshot hashing

SHA-256 over canonical JSON (sorted keys) of `AgreementSnapshot` at acceptance.

Stored on `AgreementAcceptance.agreementSnapshotHash` with version fields and `acceptanceTextSnapshot`.

## Acceptance

Public route: `/agreement/{token}` (token hash stored, revocable)

Explicit: signer name, email, optional title, unchecked checkbox, **Accept Agreement** button.

Idempotent: one acceptance per Agreement; double-submit safe.

No Stripe, no Resend, no auto-WON on acceptance.

## Delivery

Mirror Proposal Delivery: prepare → review → explicit send (max 1 Resend).

View tracking: **Agreement link viewed** (not “read”).

## Staleness

Fingerprint: proposal/scope/pricing revisions, agreement versions, payment terms.

Stale before acceptance blocks client accept; accepted agreements remain historical truth.

## Module layout

```
src/lib/commercialization/agreement/
src/lib/commercialization/agreement-delivery/
```

Verify: `agreement.verify.ts`

Migration: `20260823120000_add_commercial_agreements`

## Legal note

Generated terms are operational workflow boilerplate. Final production legal language should be reviewed by counsel.
