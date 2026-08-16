# Stripe Paid Audit (V1)

One-time Stripe Checkout for the **Professional Website Growth Audit**.

This is not a subscription. Checkout uses `mode: "payment"` only.

## Product

- Product name: `Professional Website Growth Audit`
- Stripe Price ID env: `STRIPE_PROFESSIONAL_AUDIT_PRICE_ID`
- Display price env: `NEXT_PUBLIC_PROFESSIONAL_AUDIT_PRICE_LABEL`

The Stripe Dashboard is the source of truth for the charged amount. The display label must be kept in sync with that Price. The checkout API never accepts a client-supplied amount or Price ID.

## Required environment variables

| Variable | Browser? | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | No | Server Stripe API |
| `STRIPE_WEBHOOK_SECRET` | No | Webhook signature verification |
| `STRIPE_PROFESSIONAL_AUDIT_PRICE_ID` | No | Professional Audit Price |
| `NEXT_PUBLIC_SITE_URL` | Yes | Success/cancel URLs |
| `NEXT_PUBLIC_PROFESSIONAL_AUDIT_PRICE_LABEL` | Yes | Display price on the upgrade CTA |

Copy `.env.example` to `.env.local`. Never commit secrets.

`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` must never be prefixed with `NEXT_PUBLIC_`.

The Stripe webhook verifies payment and grants Professional entitlement. It does **not** call OpenAI. AI Interpretation is generated later on the first entitled Professional report view.

## Create the Stripe product (test mode)

1. Open the Stripe Dashboard in **Test mode**.
2. Create a Product named `Professional Website Growth Audit`.
3. Create a one-time Price (not recurring).
4. Copy the Price ID (`price_...`) into `STRIPE_PROFESSIONAL_AUDIT_PRICE_ID`.
5. Set `NEXT_PUBLIC_PROFESSIONAL_AUDIT_PRICE_LABEL` to the same amount, for example `$99`.

## Create the database table

Apply the Prisma migration (does not reset existing reports):

```bash
npx prisma migrate dev
```

This adds `ReportPurchase` and the `PurchaseStatus` enum. Existing `AuditReport` rows are unchanged.

## Local webhook forwarding

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) if it is not already installed.
2. `stripe login`
3. Start the app: `npm run dev`
4. Forward events:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

5. Copy the printed webhook signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.
6. Restart the Next.js server after changing env vars.

Do not hard-code webhook secrets.

## Test a purchase

Use Stripe test cards from the official Stripe documentation. Do not invent payment data.

Expected path:

1. Run a website audit and open the saved `/report/[id]` page.
2. Confirm the free preview, upgrade CTA, and display price.
3. Click **Unlock Full Report**.
4. Complete Checkout with a Stripe test card.
5. Land on `/report/[id]/purchase/success`.
6. Confirm Professional content is visible and the unlock CTA is gone.
7. Refresh and reopen the report URL later — access remains.
8. Confirm a `ReportPurchase` row exists with `status = PAID`.

```sql
SELECT id, "reportId", status, "paidAt", "amountTotal", currency, "stripeCheckoutSessionId"
FROM "ReportPurchase"
ORDER BY "createdAt" DESC;
```

Cancel path: abandon Checkout and confirm the free report still works.

## Switching to live mode

Production needs all of the following, in **Live** mode:

- Live `STRIPE_SECRET_KEY`
- Live `STRIPE_PROFESSIONAL_AUDIT_PRICE_ID`
- Production webhook endpoint: `https://<domain>/api/stripe/webhook`
- Production `STRIPE_WEBHOOK_SECRET`
- Production `NEXT_PUBLIC_SITE_URL`
- Production `NEXT_PUBLIC_PROFESSIONAL_AUDIT_PRICE_LABEL` matching the live Price

Do not mix test Price IDs with live keys. The app does not switch itself to live mode.

The commercial launch checklist is in `docs/commercial-launch-v1.md`.

## Entitlement

Professional access is stored in PostgreSQL on `ReportPurchase` with `status = PAID`. Query parameters such as `?paid=true` are ignored.

Internal `consultation` and `client` reports remain Professional without payment.

Refunds are not automated in V1. The `REFUNDED` status exists for later use and does not currently revoke access.

## Deferred

- Subscriptions, customer accounts, coupons, receipts, email automation, and refund UI
- Usage credits, agency plans, and monitoring products
