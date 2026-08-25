# Testing (JS Growth)

## Deploy gate

```bash
npm run test:acceptance
```

This is the single command that answers: **is the current application safe enough to deploy?**

Order:

1. `prisma validate` (+ non-destructive migration drift check when available)
2. `npm run test:verify`
3. Commercial domain/integration + Playwright (verifies skipped if already run)
4. Growth domain/integration + Playwright (verifies skipped if already run)
5. `npm run build`

Required Playwright tests must **not** skip for missing test DB. Unexpected skips fail acceptance.

## Individual suites

| Script | Scope |
|---|---|
| `test:verify` | All `*.verify.ts` |
| `test:commercial` | Commercial verifies + DB integration + E2E |
| `test:growth` | Growth verifies + integration + E2E |
| `test:growth:e2e` | Growth Playwright only |
| `test:acceptance:fast` | No browsers (not a deploy gate) |

## Database

Never production.

Preferred:

```bash
export ACCEPTANCE_TEST_DATABASE_URL="postgres://..."
```

Also accepted: `GROWTH_TEST_DATABASE_URL`, `COMMERCIAL_TEST_DATABASE_URL`, `TEST_DATABASE_URL`.

Local override:

```bash
export ACCEPTANCE_E2E_USE_DEV_DB=1   # or GROWTH_E2E_USE_DEV_DB / COMMERCIAL_E2E_USE_DEV_DB
```

Prints a strong warning. Refused when `NODE_ENV=production` or URL looks production-like.

## Playwright

```bash
npx playwright install chromium
```

Missing Chromium fails clearly (does not silently skip).

Reuse existing Playwright config (`playwright.config.ts`). Suites live under:

- `tests/commercial/e2e/**`
- `tests/growth/e2e/**` — includes Sprint 11 follow-up (`follow-up.spec.ts`), Sprint 12 local/GBP (`local-growth.spec.ts`), and Sprint 12.1 GBP Read (`gbp-read.spec.ts`)

Growth follow-up E2E covers attention queue, activity recording, nurture scheduling, suppression, contact→lead idempotency, and GA4 privacy on `/reports/growth/follow-up` and `/reports/leads/[leadId]`.

Growth local/GBP E2E covers `/reports/growth/local` auth, blank vs zero snapshot honesty, checklist persistence without mutating business facts, canonical GBP UTMs, GBP vs ORGANIC_SEARCH attribution, GBP_POST plan without auto-publish, GBP-001 active, and static-route privacy smoke. Runs as part of `npm run test:acceptance` via `test:growth`.

GBP Read E2E (`gbp-read.spec.ts`) uses `GROWTH_TEST_MOCK_GBP=1` so live Google = 0. Covers connection panel, mock OAuth → location → Sync Profile / Sync Performance, UTM detection without auto-write, disconnect preserving history, and no tokens/ciphertext in HTML.

If `npm run dev` is already on `:3000`, runners attach to it. For contact/audit acceptance, start that server with mocks:

```bash
COMMERCIAL_TEST_MOCK_RESEND=1 \
COMMERCIAL_TEST_MOCK_STRIPE=1 \
COMMERCIAL_TEST_MOCK_EXTERNALS=1 \
GROWTH_TEST_MOCK_AUDIT=1 \
GROWTH_TEST_MOCK_GBP=1 \
npm run dev
```

Otherwise the runner starts `next dev` on `:3100` with mocks.

## External side effects

Acceptance forces:

- LIVE OpenAI = 0
- LIVE Resend = 0 (mocked)
- LIVE Stripe = 0 (mocked / no `sk_live_`)
- LIVE Meta / GSC / Places / GBP API = 0
- LIVE crawl = 0 for allowlisted growth audit hosts under `GROWTH_TEST_MOCK_AUDIT=1`

## Failure artifacts

On Playwright failure: `test-results/`, traces/screenshots per Playwright config.
Acceptance summary + Playwright JSON counts: `acceptance-results/` (kept outside Playwright’s cleaned `test-results/` dir).
