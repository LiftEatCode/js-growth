# External Services & APIs

Inventory of production dependencies used by JS Growth. **Never commit secret values.**

---

## OpenAI

| | |
|---|---|
| **Purpose** | Professional audit AI interpretation; outreach drafts; competitive interpretation |
| **Usage** | Server-only |
| **Env** | `OPENAI_API_KEY`, optional `OPENAI_AUDIT_MODEL` |
| **Cost exposure** | Per generation; capped by product triggers and run limits |
| **Safeguards** | No Free-audit calls; human triggers for CI/outreach; reuse persisted results |
| **Docs** | [ai-architecture.md](ai-architecture.md) |

---

## Google Places API (New)

| | |
|---|---|
| **Purpose** | Prospect business discovery; competitor candidate discovery |
| **Usage** | Server-only |
| **Env** | `GOOGLE_PLACES_API_KEY` |
| **Cost exposure** | Per Places request |
| **Safeguards** | Discovery: max 3 provider requests / run, 25 candidates / run. CI: max 3 Places requests / prospect, 10 candidates stored, 30-day discovery TTL |
| **Not used for** | Rankings, reviews scraping product, traffic estimates |

---

## Resend

| | |
|---|---|
| **Purpose** | Contact form notifications; approved outreach email send; delivery webhooks |
| **Usage** | Server-only |
| **Env** | `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` |
| **Cost exposure** | Per email |
| **Safeguards** | Human approval; `MAX_OUTREACH_EMAILS_PER_DAY = 10`; suppression; bounce/complaint handling; **no** auto bulk send; **no** automated contact-form POST |
| **Webhook** | `/api/resend/webhook` — authenticated via webhook secret |

---

## Stripe

| | |
|---|---|
| **Purpose** | (1) One-time Professional Website Growth Audit purchase; (2) Commercial Agreement deposit/full/balance Checkout (Sprint 9) |
| **Usage** | Server Checkout session + shared webhook route; audit uses Price ID; agreement payments use dynamic `price_data` |
| **Env** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PROFESSIONAL_AUDIT_PRICE_ID`, `NEXT_PUBLIC_PROFESSIONAL_AUDIT_PRICE_LABEL` |
| **Cost exposure** | Stripe fees on paid checkouts |
| **Safeguards** | `mode: "payment"` only; webhook is payment authority; test/live keys isolated; commercial amounts from ACCEPTED Agreement only |
| **Not implemented** | Subscriptions, invoices, tax engine for commercial agreements |

Canonical commercial payment doc: [commercial-payments.md](commercial-payments.md)

---

## Vercel / hosting

| | |
|---|---|
| **Purpose** | Host Next.js app, CI deploy from Git |
| **Env** | Platform project env vars (mirror `.env.example` categories) |
| **Cost exposure** | Hosting / function / bandwidth plan |
| **Notes** | Prefer Fluid Compute / Node; no Edge-required streaming for current product |

---

## Database (Prisma / Postgres)

| | |
|---|---|
| **Purpose** | Persist audits, leads, prospecting, CI, purchases, suppression |
| **Env** | `DATABASE_URL`, `DIRECT_URL` |
| **Cost exposure** | DB plan storage/compute |
| **Docs** | [database-guide.md](database-guide.md) |

---

## Internal authentication

| | |
|---|---|
| **Purpose** | Gate `/reports/**` and prospecting |
| **Env** | `REPORTS_ADMIN_EMAIL`, `REPORTS_ADMIN_PASSWORD`, `REPORTS_SESSION_SECRET` |
| **Notes** | Simple internal session — not end-customer accounts |

---

## Analytics (optional)

| | |
|---|---|
| **Purpose** | Public site GA when configured |
| **Env** | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| **Safeguards** | Event sanitization in `src/lib/analytics/` — avoid PII in event payloads |
| **Docs** | [analytics.md](analytics.md) |

---

## Site URL / fonts / static

| | |
|---|---|
| **Purpose** | Absolute URLs for emails/checkout; UI fonts as used by the app |
| **Env** | `NEXT_PUBLIC_SITE_URL` |
| **Notes** | Google Fonts or similar may load on public pages — treat as public CDN dependency, not a secret |

---

## Explicit non-integrations (not implemented)

- CAPTCHA bypass services
- Automatic contact-form submission bots
- Rank / backlink / traffic APIs
- Multi-tenant customer auth providers (Clerk/Auth0) for audit buyers
- Reply-ingestion CRM sync

See [cost-controls.md](cost-controls.md) and [security-privacy.md](security-privacy.md).
