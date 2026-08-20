# Cost Controls

Variable cost surfaces and **code-enforced** caps. Values from `src/lib/**/constants.ts` (verify in code if unsure).

---

## Paid / metered APIs

| Service | When cost is incurred | Primary caps |
|---|---|---|
| **Google Places** | Discover businesses; discover competitors | Discovery: `MAX_PROVIDER_REQUESTS_PER_RUN = 3`, `MAX_DISCOVERY_CANDIDATES_PER_RUN = 25`. CI: `MAX_COMPETITOR_PROVIDER_REQUESTS_PER_PROSPECT = 3`, `MAX_COMPETITOR_CANDIDATES_PER_PROSPECT = 10`, discovery TTL 30 days |
| **OpenAI** | Pro audit AI; outreach drafts; CI interpretation; Implementation Plan AI strategy | Audit AI: attempts ≤ 2, persist/reuse. Drafts: `MAX_AI_DRAFTS_PER_RUN = 5`. CI / Implementation strategy: 1 generation + optional 1 repair per click |
| **Resend** | Contact notifications; approved outreach sends | `MAX_OUTREACH_EMAILS_PER_DAY = 10`; suppression |
| **Stripe** | Successful Professional Checkout | One-time Product; no CI SKU |
| **Hosting / DB** | Always-on platform | Vercel + Postgres plan |

---

## Crawl / compute (low or no third-party LLM cost)

| Operation | Notes |
|---|---|
| Deterministic website audit | Bounded crawl (`MAX_CRAWLED_PAGES = 12`, time budgets); hosting egress/CPU |
| Prospect qualification audits | `MAX_PROSPECT_AUDITS_PER_RUN = 10`, concurrency 2, 7-day TTL reuse |
| Competitor audits | `MAX_COMPETITOR_AUDITS_PER_RUN = 3`, concurrency 1, 30-day TTL |
| Competitive comparison | Pure computation over stored audits — **no** Places / OpenAI |
| Competitive report load | DB read — **0** OpenAI / Places / crawl |
| Implementation Plan generate | Deterministic — **0** OpenAI |
| Implementation AI strategy load | DB read / fingerprint reuse — **0** OpenAI unless Generate clicked |
| Contact discovery | Fetch/parse HTML — capped pages/run |

---

## Zero incremental OpenAI by design

- Free Website Growth Audit
- Viewing stored Professional AI interpretation after first generation
- Qualification without draft generation
- Competitor discovery / validation / comparison
- Resend webhook processing
- Stripe webhook processing

---

## Operator discipline

Prefer **Skip** over spending Places/OpenAI/Resend on weak fits. Regenerate AI only when evidence changed. Re-run competitor discovery/audits only when TTL stale or geography changed.

See [external-services.md](external-services.md) and [ai-architecture.md](ai-architecture.md).
