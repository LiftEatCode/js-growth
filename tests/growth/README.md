# Growth E2E & Integration Tests

## Isolation

- Prefer `ACCEPTANCE_TEST_DATABASE_URL` or `GROWTH_TEST_DATABASE_URL`.
- Falls back to `COMMERCIAL_TEST_DATABASE_URL` / `TEST_DATABASE_URL`.
- `GROWTH_E2E_USE_DEV_DB=1` (or `ACCEPTANCE_E2E_USE_DEV_DB=1`) allows local `DATABASE_URL` with a strong warning; production-like URLs are refused.

## Mocks

Set by growth / acceptance runners:

- `COMMERCIAL_TEST_MOCK_RESEND=1` — no live email
- `COMMERCIAL_TEST_MOCK_STRIPE=1` — no live Stripe
- `COMMERCIAL_TEST_MOCK_EXTERNALS=1` / `GROWTH_TEST_MOCK_AUDIT=1` — fixture audit for `example.com` (no live crawl)

## Commands

```bash
npm run test:growth          # verifies + integration + e2e
npm run test:growth:e2e      # Playwright only
npm run test:acceptance      # full gate including growth
```

Install browsers:

```bash
npx playwright install chromium
```

## Coverage

- Facebook company / founder → audit (+ internal navigation)
- GBP → audit / contact
- Direct / organic search referrer / external referral → audit
- ContactSubmission persistence + attribution privacy
- First-observed / session storage
- Experiment 018 soft CTA event (no follower fabrication)
- Historical UNKNOWN immutability
- Sprint 9/10 dashboard smoke
