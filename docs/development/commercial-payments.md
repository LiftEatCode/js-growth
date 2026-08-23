# Commercial Payments (Commercial Sprint 9)

## Purpose

Collect money owed under an **ACCEPTED** `CommercialAgreement` via Stripe Checkout.

| Layer | Authority |
|-------|-----------|
| CommercialScope | What is sold |
| CommercialPricing | Approved investment |
| CommercialAgreement | Accepted commercial + payment terms |
| **CommercialPayment** | Money actually collected |
| Stripe | Processor only |

**Accepted ≠ paid. Paid ≠ Opportunity WON.**

**Deposit paid (DEPOSIT_AND_BALANCE) = eligible for onboarding** (Sprint 10). Balance may remain due before final handoff. Paid in full is not required to start.

Sprint 10 owns Client/Project/onboarding and WON transition policy — see [`client-project-onboarding.md`](client-project-onboarding.md).

## Version

- `COMMERCIAL_PAYMENT_VERSION = 1`

## Migration

`prisma/migrations/20260823180000_add_commercial_payments`

## Domain module

`src/lib/commercialization/payments/`

Reuses shared Stripe client + webhook signature verification from `src/lib/payments/`.

Does **not** share authority/data models with Professional Audit `ReportPurchase`.

Stripe metadata `product = commercial-agreement-payment` routes webhook fulfillment.

## Payment requirement derivation

Only from ACCEPTED Agreement persisted fields:

| Term type | Checkout |
|-----------|----------|
| `FULL_UPFRONT` | one `FULL` = `totalInvestmentCents` |
| `DEPOSIT_AND_BALANCE` | `DEPOSIT` = `depositCents`, then `BALANCE` = `balanceCents` |
| `CUSTOM` | **blocked** — manual / future enhancement |

Never recalculate deposit from Pricing. Never accept amount from the browser.

## Human checkout gate

Agreement Accepted → operator sees Payment Pending → **Create Deposit / Full / Balance Checkout**.

- No automatic checkout on acceptance
- No automatic email on create
- Operator may **Copy Payment Link** or explicitly **Send Payment Link** (Resend max 1 per send)

## Stripe Checkout strategy

Dynamic `price_data` line items (no permanent Stripe Product/Price per agreement).

Line description example: `JS Solutions — {Business} Implementation Deposit`

Success/cancel URLs: `/payment/return` — **not** payment authority.

## Webhook authority

Handled in `POST /api/stripe/webhook` alongside Professional Audit:

- `checkout.session.completed` / `async_payment_succeeded`
- `checkout.session.expired`
- `charge.refunded` / `refund.created` → `REFUNDED` + `PAYMENT_REVIEW_REQUIRED` (no Agreement mutation)

Invalid signature → reject, no DB mutation.

Completion reconciles amount/currency to persisted `CommercialPayment`; mismatch → reconciliation failure, requirement **not** satisfied.

## Duplicate / race safety

1. Partial unique index: at most one `PAID` per `(agreementId, type)`
2. Partial unique index: at most one active (`PENDING`|`CHECKOUT_CREATED`) per `(agreementId, type)`
3. Unique `(agreementId, type, paymentSequence)` for history/regeneration
4. Stripe idempotency key `commercial-payment-checkout:{paymentId}`
5. Webhook `updateMany` where status ≠ `PAID` (idempotent)

## Derived overall states

Examples: `DEPOSIT_DUE`, `DEPOSIT_CHECKOUT_CREATED`, `DEPOSIT_PAID_BALANCE_PENDING`, `BALANCE_CHECKOUT_CREATED`, `PAID_IN_FULL`, `PAYMENT_REVIEW_REQUIRED`, `CUSTOM_TERMS_MANUAL`.

Paid in full surfaces: **Payment complete — ready for onboarding** (still not auto-WON).

## Public UX

- `/agreement/{token}`: after accept, Payment status Pending; Pay CTA only if operator-created active checkout exists (0 Stripe calls on load)
- `/payment/return`: confirmation-pending / deposit received / cancelled — no Stripe calls; no internal IDs

## Exclusions (V1)

- No tax engine / no `automatic_tax` for commercial checkouts
- No invoices / AR / QuickBooks
- No subscriptions / saved cards / metered billing
- No automatic Client/Project creation
- No automatic Opportunity WON

## LIVE / TEST isolation

- Production LIVE vs Preview TEST conventions preserved
- `COMMERCIAL_TEST_MOCK_STRIPE=1` for automated commercial tests
- Automated tests refuse `sk_live_`
- Prefer `COMMERCIAL_TEST_DATABASE_URL`; refuse production-like DB URLs

## Tests

- `src/lib/commercialization/payments/payments.verify.ts`
- `npm run test:commercial` includes payment verify + Playwright browser Accept + mock deposit/balance webhooks

## Related

- [agreement-engine.md](./agreement-engine.md)
- [stripe-paid-audit.md](./stripe-paid-audit.md) (audit product — separate domain)
- [opportunity-management.md](./opportunity-management.md)
