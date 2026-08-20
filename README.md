# JS Growth

Next.js application for **JS Solutions** (`js-growth.com`): marketing site, commercial **Website Growth Audit**, and internal growth tools (leads, Prospecting Engine, Competitive Intelligence).

**JS Solutions** = the company. **JS Growth** = this product platform.

> Implementation under `src/` and `prisma/` is the source of truth. Prefer [`docs/README.md`](docs/README.md) over outdated sprint notes when status conflicts.

---

## Major systems

| System | Audience | Summary |
|---|---|---|
| Marketing site | Public | Company presence, content, contact |
| Free Website Growth Audit | Public | Deterministic scan; no OpenAI |
| Professional Website Growth Audit | Public (paid) | Stripe entitlement, PDF, AI interpretation |
| Lead / report workspace | Internal | Session-gated `/reports` |
| Prospecting Engine V1 | Internal | Discover → qualify → human-approved outreach |
| Competitive Intelligence V1 | Internal | Competitors → audits → comparison → AI → analysis preview |

Details: [`docs/development/platform-architecture.md`](docs/development/platform-architecture.md), [`docs/development/product-catalog.md`](docs/development/product-catalog.md).

---

## Tech stack

- Next.js (App Router) · React · TypeScript
- Prisma · PostgreSQL
- Vercel hosting
- Stripe · Resend · OpenAI · Google Places API (New)

---

## Local setup

1. Clone the repo and install dependencies: `npm install`
2. Copy `.env.example` → `.env.local` and fill **non-secret placeholders** with real local values (never commit secrets)
3. Ensure Postgres is reachable via `DATABASE_URL` / `DIRECT_URL`
4. Apply migrations for local DB: `npx prisma migrate deploy` (or project-standard local migrate workflow)
5. Generate client if needed: `npx prisma generate`
6. Start: `npm run dev`

### Environment variable categories

See `.env.example`. Groups:

- Database
- Site URL
- Internal reports session (`REPORTS_*`)
- Resend / contact emails
- Stripe (test keys locally)
- Optional Google Analytics
- OpenAI (server-only; never `NEXT_PUBLIC_`)
- Google Places (server-only)

---

## Validation

```bash
npx prisma validate
npx tsc --noEmit
npm run lint
npm run build
```

Product logic: run the repository `*.verify.ts` suite (see existing npm/tsx scripts used in development docs).

---

## Deployment

GitHub → Vercel. **Not every deploy needs a Prisma migration.**

1. `npx prisma migrate status`
2. If pending: `npx prisma migrate deploy` on the target DB
3. Push / deploy; run [production acceptance](docs/sops/operations/production-acceptance.md) for touched areas

Full SOP: [`docs/sops/development/deployment.md`](docs/sops/development/deployment.md).

---

## Documentation map

| Need | Go to |
|---|---|
| Doc index | [`docs/README.md`](docs/README.md) |
| Architecture | [`docs/development/platform-architecture.md`](docs/development/platform-architecture.md) |
| Website Audit launch | [`docs/commercial-launch-v1.md`](docs/commercial-launch-v1.md) |
| Prospecting | [`docs/development/prospecting-engine-v1.md`](docs/development/prospecting-engine-v1.md) |
| Competitive Intelligence | [`docs/development/competitive-intelligence.md`](docs/development/competitive-intelligence.md) |
| AI / APIs / DB / security / cost | [`docs/development/`](docs/development/) |
| Operator SOPs | [`docs/sops/README.md`](docs/sops/README.md) |
| Service playbooks | [`docs/services/`](docs/services/) |
| Roadmap | [`ROADMAP.md`](ROADMAP.md) |
| Company handbook-style docs | [`docs/company/`](docs/company/), marketing, sales, playbooks |

---

## Safety product rules (do not “fix” in code or ops)

- No automatic bulk email sending
- No automated contact-form submission
- No CAPTCHA bypass
- Competitive Intelligence V1 is internal-only

---

## License / ownership

Private JS Solutions repository. All rights reserved unless otherwise noted.
