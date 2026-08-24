# Commercial E2E & Integration Tests

## Isolation

- Prefer `COMMERCIAL_TEST_DATABASE_URL` (dedicated Neon branch / test DB).
- Never point these tests at production.
- `COMMERCIAL_E2E_USE_DEV_DB=1` allows using local `DATABASE_URL` when a separate test DB is unavailable; production-like URLs are still refused.

## Mocks

Set automatically by commercial runners:

- `COMMERCIAL_TEST_MOCK_RESEND=1` — Resend send is in-memory (no paid email)
- `COMMERCIAL_TEST_MOCK_STRIPE=1` — commercial Checkout uses mock adapter (no LIVE Stripe)
- Automated paths refuse `sk_live_` and production-like database URLs

## Commands

```bash
npm run test:verify          # all src/**/*.verify.ts
npm run test:commercial:integration  # pure commercial integration
npm run test:commercial:db   # DB-backed integration (requires test DB)
npm run test:e2e             # Playwright (all e2e under tests/**/e2e)
npm run test:commercial      # verifies + integration + commercial e2e
npm run test:acceptance      # full deploy gate (commercial + growth + build)
```

Install browsers once:

```bash
npx playwright install chromium
```

## Recommended local run

```bash
# Dedicated test DB (preferred)
export COMMERCIAL_TEST_DATABASE_URL="postgres://..."

# Or allow local/dev DATABASE_URL (never production)
export COMMERCIAL_E2E_USE_DEV_DB=1

# If `next dev` is already running:
export COMMERCIAL_E2E_SKIP_WEBSERVER=1
export COMMERCIAL_E2E_BASE_URL=http://127.0.0.1:3000

npm run test:commercial
```

`npm run test:commercial` auto-enables `COMMERCIAL_E2E_USE_DEV_DB=1` when a
non-production `DATABASE_URL` / `DIRECT_URL` is present and no dedicated test URL
is set. That makes Playwright `hasTestDb` true so `seed-cli` runs in `beforeAll`
and writes `tests/commercial/.e2e-fixture.json` / `.e2e-payment-fixture.json`.
Without that (or an explicit flag/URL), seeded suites skip and fixtures are never
created — public-token smoke tests still run.

Playwright `test.skip(!hasTestDb)` guards are intentional and unchanged.

## Coverage notes (Sprint 9–10)

- True browser Agreement acceptance via native form submit (checkbox gated)
- Dedicated payment lifecycle DB acceptance: `tests/commercial/integration/payment-lifecycle.integration.ts` ($2,050 / 50–50)
- Playwright UI: `tests/commercial/e2e/payment-lifecycle.spec.ts`
- Operator-created mocked deposit checkout → public Pay Deposit CTA
- Simulated webhook → Deposit Paid / Balance Remaining → Paid in Full
- Opportunity not auto-WON
