# Commercial Launch Readiness V1

Internal launch document for putting the Website Growth Audit in front of real small-business owners.

This is a commercial readiness pass. It does **not** switch Stripe to live mode.

## Product

- **Free Website Growth Audit** — score, category scores, limited top priorities, limited quick wins, methodology
- **Professional Website Growth Audit** — full recommendations, 30–90 day action plan, technical evidence, category deep dives, complete findings, PDF

## Current price

Display price is centralized in `src/lib/payments/product.ts` via `NEXT_PUBLIC_PROFESSIONAL_AUDIT_PRICE_LABEL`.

Default display fallback: `$99`

Presentation: **one-time** (not monthly)

Stripe Price ID (`STRIPE_PROFESSIONAL_AUDIT_PRICE_ID`) remains the charged amount. Keep the display label in sync.

## Payment type

One-time Stripe Checkout (`mode: "payment"`). No subscriptions.

## Funnel

Landing / homepage → Run Free Audit → Free report → Professional upgrade CTA → Stripe Checkout → Professional report → Consultation CTA

## Tested

Completed in this pass:

- Typecheck, lint, production build (see validation output)
- Capability / comparison verification scripts
- Paid Audit V1 Stripe TEST MODE purchase was previously completed before this copy/UX pass

Not completed in this pass:

- Repeat Stripe TEST MODE purchase after these UX changes
- Direct visual QA of five real businesses through the UI
- Live-mode payment
- Browser mobile/desktop visual QA by this coding pass

## Stripe live requirements

Do not mix test Price IDs with live keys.

1. Activate/verify the Stripe account as required
2. Create/confirm the live Product: Professional Website Growth Audit
3. Create a live one-time Price
4. Set live `STRIPE_PROFESSIONAL_AUDIT_PRICE_ID`
5. Set live `STRIPE_SECRET_KEY`
6. Configure production webhook: `https://<domain>/api/stripe/webhook`
7. Set production `STRIPE_WEBHOOK_SECRET`
8. Set production `NEXT_PUBLIC_SITE_URL`
9. Set production `NEXT_PUBLIC_PROFESSIONAL_AUDIT_PRICE_LABEL` to match the live Price
10. Verify the live webhook with a test event
11. Perform a controlled live transaction
12. Verify `ReportPurchase.status = PAID`
13. Verify the receipt in Stripe
14. Verify Professional report access on refresh / later return

Local Stripe testing: `docs/development/stripe-paid-audit.md`

## Policy / legal readiness

| Policy | Status |
|---|---|
| Privacy Policy | **Published** — `/privacy` |
| Terms of Service | **Published** — `/terms` |
| Refund Policy | **Published** — `/refund-policy` (Professional Audit digital-product terms only) |

These pages are operational drafts based on current application behavior. They should be reviewed by qualified legal counsel as the business scales or data practices change. Internal inventory: `docs/legal-data-inventory.md`.

Contact path: `/contact` and published email `jssolutions.tx@gmail.com`

Payments: Stripe Checkout

Analytics: Google Analytics may load when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. No cookie-consent banner is implemented.

## Known limitations

- Representative multi-page scan of the submitted URL — not a complete crawl of every page
- No competitor data
- No Google Business Profile data
- No rank tracking
- No recurring monitoring / historical scores
- No AI interpretation
- No customer accounts — access is by report URL
- Professional PDF is gated to paid/internal/admin access
- Refunds are not automated

## Recommended funnel events

The site already uses Google Analytics. Wired in this pass if `gtag` is present:

- `audit_completed`
- `professional_checkout_started`

Recommended next analytics milestone:

- `audit_started`
- `free_report_viewed`
- `professional_purchase_completed`
- `professional_report_viewed`
- `consultation_requested`

## Next recommended product milestone

Performance Intelligence V2, or Multi-Page Intelligence — not started here.

## Checklist

### Product

- [x] Product name consistent: Free / Professional Website Growth Audit
- [x] Display price centralized and labeled one-time
- [x] Free vs Professional difference shown on the audit page
- [x] Professional value listed from actual capabilities

### Funnel

- [x] Audit entry copy and CTA clarified
- [x] Audit loading state clarified (rotating status, no fake %)
- [x] Free report still shows score / categories / priorities / quick wins
- [x] Upgrade CTA moved earlier and explains one-time Stripe checkout
- [ ] Checkout after this UX pass — re-test in Stripe TEST MODE
- [x] Success / cancel / unavailable copy polished
- [x] Already-purchased routes send customers to the Professional report
- [x] Implementation CTA shown on Professional reports only

### Payments

- [x] Stripe TEST MODE previously verified (Paid Audit V1)
- [x] Webhook / entitlement architecture left intact
- [ ] Repeat TEST MODE transaction after this pass
- [x] Duplicate purchase still blocked by existing checkout logic
- [x] Live Stripe configuration documented above

### Trust

- [x] Contact path (`/contact`, footer)
- [x] Privacy Policy
- [x] Terms of Service
- [x] Refund policy (Professional Audit digital-product terms)

### UX

- [ ] Desktop funnel visually verified in browser
- [ ] Mobile funnel visually verified in browser
- [ ] Print/PDF visually verified after Professional unlock
- [x] Error messages stay business-owner friendly (fetch / checkout)

### QA

- [ ] Strong site tested this pass
- [ ] Weak site tested this pass
- [ ] Local business tested this pass
- [ ] Service-area business tested this pass
