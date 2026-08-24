# Testing

## Commands

| Command | Purpose |
|---|---|
| `npm run test:verify` | All `src/**/*.verify.ts` domain suites |
| `npm run test:commercial` | Commercial verifies + integration + Playwright |
| `npm run test:growth` | Growth verifies + integration + Playwright |
| `npm run test:growth:e2e` | Growth Playwright only |
| `npm run test:acceptance` | **Full deploy gate** (Prisma → verify → commercial → growth → build) |
| `npm run test:acceptance:fast` | Prisma + verify + growth integration + build (no browsers) |

## Full acceptance

```bash
npx playwright install chromium   # once

# Preferred: dedicated test DB
export ACCEPTANCE_TEST_DATABASE_URL="postgres://..."
# or COMMERCIAL_TEST_DATABASE_URL / GROWTH_TEST_DATABASE_URL

# Or explicit local override (never production)
export ACCEPTANCE_E2E_USE_DEV_DB=1

# If next already running, restart it WITH mocks for contact/audit E2E:
# COMMERCIAL_TEST_MOCK_RESEND=1 COMMERCIAL_TEST_MOCK_STRIPE=1 \
# COMMERCIAL_TEST_MOCK_EXTERNALS=1 GROWTH_TEST_MOCK_AUDIT=1 npm run dev

npm run test:acceptance
```

Acceptance **fails** if required Playwright tests skip due to missing DB/env.

## Safety

- Production-like DB URLs refused
- `sk_live_` refused
- Resend / Stripe / audit crawl mocked under acceptance env
- No Selenium

See [docs/development/testing.md](../docs/development/testing.md), [commercial/README.md](commercial/README.md), [growth/README.md](growth/README.md).
