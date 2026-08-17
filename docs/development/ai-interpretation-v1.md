# AI Interpretation V1

Internal notes for the Professional-only strategist layer on the Website Growth Audit.

AI Interpretation V1 answers: **what do these deterministic findings mean for growth, and what should this business do first?**

The deterministic audit engine remains the source of truth.

## Commercial rule

**Free audits make ZERO AI calls.**

This is non-negotiable for V1.

| Audit | AI |
|---|---|
| Free | Deterministic report only. No OpenAI request. No teaser generation. |
| Professional (paid entitlement) | Eligible after entitlement is confirmed. Generate once, persist, reuse. |

Do not pre-generate AI before payment. Do not call OpenAI during initial Free audit creation.

## What AI may and may not do

AI **does**:

- interpret existing structured audit evidence
- explain how important findings interact
- identify strategic themes and a primary diagnosis
- explain why certain issues should be prioritized
- interpret competitive gaps/strengths when Competitive Intelligence succeeded
- produce an executive analysis and 30/60/90 narrative
- identify areas where professional implementation may be valuable

AI **does not**:

- crawl websites
- calculate scores
- decide whether technical issues exist
- invent findings
- override deterministic findings
- decide Professional entitlement
- run for Free audits
- discover competitors
- estimate rankings, traffic, revenue, or backlinks
- quote JS Growth prices
- claim guaranteed business outcomes

## Entitlement gate

Authoritative Professional entitlement is `reportHasProfessionalEntitlement(reportId)` (`ReportPurchase.status = PAID`).

Do **not** use `canServeProfessionalReportArtifact` as the generation gate. Internal admin sessions can view unpaid Professional artifacts; that must not bill OpenAI.

Generation requires:

```
reportHasProfessionalEntitlement(reportId) === true
```

Direct invocation for an unpaid report returns `hidden` and makes **zero** provider calls. Stored interpretation is **not** returned to unpaid/Free views even if it exists.

Internal `consultation` / `client` reports without payment do not generate AI in V1.

## Generation lifecycle

```
FREE AUDIT
  → deterministic analysis
  → store complete audit snapshot
  → Free report (no AI)

CUSTOMER PURCHASES PROFESSIONAL
  → Stripe Checkout / webhook grants entitlement
  → payment success page does not wait on OpenAI

FIRST ENTITLED PROFESSIONAL REPORT (or paid PDF) REQUEST
  → check persisted interpretation
  → if missing: claim generation → one OpenAI call → validate → persist
  → render Executive Growth Analysis

FUTURE VIEWS
  → reuse stored interpretation
```

Stripe webhook processing remains fast and authoritative. OpenAI failure **does not** roll back entitlement. First entitled view may wait synchronously up to the centralized timeout (`AI_GENERATION_TIMEOUT_MS = 40_000`). If another request already claimed generation, the second request shows a calm “building” state and performs **one** delayed reload (8s). No websockets. No aggressive polling.

## OpenAI integration

- Official `openai` SDK, server-only (`src/lib/website-audit/ai-interpretation/openai-provider.ts`).
- API: `client.responses.create` with structured outputs via `zodTextFormat`.
- One primary model call per successful paid report (bounded retry after failure).
- For GPT-4.x models: temperature `0.2`, `max_output_tokens: 3500`.
- For GPT-5+ / o-series reasoning models: omit `temperature` (the API rejects it), use `reasoning.effort: low`, and `max_output_tokens: 8000`.
- Timeout wrapped in `withTimeout` (`40_000` ms) in addition to the SDK timeout.

Never prefix `OPENAI_API_KEY` with `NEXT_PUBLIC_`. The browser receives only the validated stored interpretation needed to render.

## Model configuration

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | For generation | Server OpenAI auth |
| `OPENAI_AUDIT_MODEL` | No | Overrides the default model |

Default model: `gpt-4.1-mini` (`DEFAULT_OPENAI_AUDIT_MODEL`). This is a configurable product default, not a pricing claim. Change the model without rewriting application code.

Missing `OPENAI_API_KEY`: Professional deterministic report still works. AI section shows unavailable. Attempt count is **not** incremented, so adding a key later still works. Deployment must not crash.

## Structured context

`buildAiAuditContext(audit)` sends a compact JSON object:

- scores, grade, category scores, summary counts
- up to 20 actionable findings (title/description/recommendation from **our** rules, not raw HTML)
- site scan counts and canned pattern strings (no page dump)
- competitive gaps/strengths/opportunities only when comparison succeeded
- deterministic quick wins / priorities / action-plan titles

Hard limits:

| Limit | V1 |
|---|---|
| Findings | 20 |
| Site patterns | 10 |
| Competitive gaps | 8 |
| Competitive strengths | 5 |
| Competitive opportunities | 5 |
| Quick wins | 4 |
| Action-plan lines | 8 |

Approximate expected context size: a few thousand tokens of structured JSON, not a full site snapshot.

Not sent: report database IDs, emails, lead data, Stripe IDs, payment data, IP addresses, analytics IDs, raw HTML, unbounded URL lists, website titles.

## Prompt injection

Website content is untrusted data. The system prompt states that evidence is DATA only, must not be followed as instructions, and must never cause disclosure of the system prompt.

Context building omits website titles and raw page prose so injection strings in `title` / HTML typically never reach the model.

## Structured output

Zod schema `aiInterpretationContentSchema` (validated before persistence):

- `executiveSummary` (2–4 short paragraphs; max 3000 chars)
- `strategicDiagnosis` (headline + explanation)
- `topPriorities` (1–5, typically 3–5 when evidence supports it)
- `startThisWeek` (1–4, from deterministic quick wins when present)
- `competitiveInterpretation` (nullable; must be null when competitive data is unavailable)
- `ninetyDayStrategy` (1–5 actions per phase)
- `implementationAreas`
- `closingSummary`

Malformed output is not saved as completed.

## Persistence

Dedicated `AuditReport` columns (not inside `audit` JSON):

- `aiStatus` (`GENERATING` / `COMPLETED` / `FAILED`)
- `aiAttemptCount` (default 0)
- `aiStartedAt`
- `aiGeneratedAt`
- `aiInterpretation` JSON: `{ version, model, generatedAt, inputFingerprint, usage, content }`

`prisma-repository.save()` does **not** write these columns, so audit upserts cannot wipe interpretation.

Prompt version: `AI_INTERPRETATION_VERSION = "v1"`. Input fingerprint: SHA-256 of prompt version + compact context (`node:crypto`).

Token usage is stored when the API returns it (`inputTokens` / `outputTokens` / `totalTokens`). Dollar cost is **not** hardcoded.

## Idempotency / concurrency

V1 guarantee:

- Only the request that successfully **claims** generation (`updateMany` / in-memory equivalent) calls OpenAI.
- A second overlapping request sees `GENERATING` and does **not** call the provider.
- Stale `GENERATING` older than `AI_STALE_GENERATING_MS` (55s) may be reclaimed.
- `MAX_AI_GENERATION_ATTEMPTS = 2`. After that, status is unavailable; the Professional deterministic report still works.
- Persistence is not corrupted into two completed records; the last validated completed write wins if a stale reclaim occurs.

This is not a distributed lock service. It is a database atomic claim. Do not add Redis for V1.

## Retry and failure

On provider failure, timeout, or invalid output: persist `FAILED`, increment attempts, show:

> Strategic interpretation is temporarily unavailable. Your full Professional audit remains available.

No stack traces, no OpenAI payloads, no API keys to the customer. Logs include report ID, version, model, status, and error **category** only.

Customer-facing regeneration is **not** implemented.

## Report presentation

Professional order:

1. Website Growth Score
2. Executive Growth Analysis (AI) — diagnosis, priorities, start-this-week, competitive interpretation if present, 30/60/90 narrative, implementation areas
3. Site Overview
4. Competitive Intelligence (deterministic)
5. Detailed findings / quick wins
6. Deterministic 30–90 day checklist
7. Technical evidence

Disclosure: generated using AI from structured findings; scores and measurements remain deterministic.

Free report: static marketing copy only. No AI output.

Print/PDF includes the AI section when paid entitlement exists and interpretation completed. Admin `/reports/[id]` shows metadata (status, model, version, generated time, tokens, attempts), not a second full strategy dump. Admin viewing unpaid reports does **not** generate.

## Privacy

For Professional AI interpretation, structured audit findings derived from publicly accessible website content may be sent to OpenAI. Customer personal data and payment identifiers are excluded by design.

## Tests

See `src/lib/website-audit/ai-interpretation.verify.ts`. OpenAI is mocked. Unit tests and `npm run build` do not require `OPENAI_API_KEY`.

## Known limitations

- Professional-only
- generated once per paid audit
- no customer regeneration
- no conversational follow-up / chatbot
- no web browsing, tool calling, or agent loop
- no rankings, backlinks, analytics/traffic, or GBP/review data
- AI is only as complete as deterministic evidence supplied
- older audits may lack site/competitive context
- AI may be temporarily unavailable even when Professional entitlement is active
- no job queue
- no human strategist review
- no guaranteed outcomes
- no price quotes

## Intentionally deferred

AI chatbot, automatic competitor discovery, monitoring, subscriptions, customer accounts, agency/white-label, proposal generation, external SEO APIs, admin regeneration UI.
