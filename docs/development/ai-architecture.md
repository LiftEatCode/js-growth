# AI Architecture

Canonical inventory of **all OpenAI usage** in JS Growth.

**Model env:** `OPENAI_API_KEY` (server-only), optional `OPENAI_AUDIT_MODEL` (default `gpt-4.1-mini`).

There are **exactly four** OpenAI call paths. Everything else is deterministic or third-party non-LLM.

---

## 1. Professional Website Growth Audit — AI Interpretation

| Field | Detail |
|---|---|
| **Purpose** | Executive Growth Analysis / strategist layer over stored deterministic audit evidence |
| **Code** | `src/lib/website-audit/ai-interpretation/` |
| **Trigger** | First Professional view after entitlement (`ensure`), or regenerate when implemented for entitled users |
| **Not triggered by** | Free audits, PDF-only views without entitlement path, public crawl |
| **Input** | Bounded subset of persisted audit findings / scores / competitive teaser facts — not a live recrawl |
| **Output** | Structured JSON validated in-module; persisted on the report |
| **Retries** | Up to `MAX_AI_GENERATION_ATTEMPTS = 2` |
| **Cost** | One generation per entitled report (reuse persisted result) |
| **Privacy** | Server-only; never expose API key to client |

Deterministic scores and findings are **not** produced by this path.

---

## 2. Prospecting — Outreach Draft Generation

| Field | Detail |
|---|---|
| **Purpose** | Draft email / contact-form message copy for human review |
| **Code** | `src/lib/prospecting/outreach/` (`openai-provider.ts`, `create-draft.ts`, `generate.ts`) |
| **Trigger** | Explicit **Generate Missing Drafts** (or equivalent) by authenticated internal operator |
| **Cap** | `MAX_AI_DRAFTS_PER_RUN = 5`, concurrency 1 |
| **Input** | Bounded prospect + audit evidence snippets |
| **Output** | Structured draft fields; persisted as `OutreachMessage` drafts |
| **Human gate** | Drafts are **not** sent automatically; approval required before Resend |
| **Privacy** | Internal-only; contact PII may be included in prompts — treat as confidential |

---

## 3. Competitive Intelligence — Competitive Interpretation

| Field | Detail |
|---|---|
| **Purpose** | Explain a specific `CompetitiveComparisonSnapshot` for operators / client-ready narrative |
| **Code** | `src/lib/competitive-intelligence/interpretation/` |
| **Trigger** | Explicit Generate / Regenerate on prospect detail (never on page load, never after comparison alone) |
| **Cap** | `MAX_COMPETITIVE_INTERPRETATIONS_PER_ACTION = 1` + optional `MAX_COMPETITIVE_INTERPRETATION_REPAIR_ATTEMPTS = 1` (max 2 OpenAI calls per click) |
| **Input** | Bounded comparison facts + source keys; English-only prose constraints (prompt v4+) |
| **Output** | Zod-validated structured interpretation; historical rows retained |
| **Validation** | Source-key provenance, commercial-claim safeguards, language/script checks |
| **Authority** | Sprint 11 comparison numbers always win; AI must not invent competitive facts |

Client Competitive Growth Analysis **loads** interpretation from DB — **0 OpenAI** on report view.

---

## 4. Commercialization — Implementation Plan AI Strategy

| Field | Detail |
|---|---|
| **Purpose** | Explain a deterministic `ImplementationPlan` for operators (client-readable strategy prose) |
| **Code** | `src/lib/commercialization/implementation-interpretation/` |
| **Trigger** | Explicit Generate / Regenerate under Implementation Plan on prospect detail (never on page load) |
| **Cap** | `MAX_IMPLEMENTATION_INTERPRETATIONS_PER_ACTION = 1` + optional `MAX_IMPLEMENTATION_INTERPRETATION_REPAIR_ATTEMPTS = 1` (max 2 OpenAI calls per click) |
| **Input** | Bounded plan workstreams / actions / evidence / preservation + source keys |
| **Output** | Zod-validated structured strategy; historical rows retained |
| **Validation** | Exact workstream set, action/preservation source keys, commercial claims, English/script |
| **Authority** | Implementation Plan facts always win; AI must not add/remove workstreams or invent actions/pricing |

Canonical doc: [implementation-plan-ai-strategy.md](implementation-plan-ai-strategy.md)

---

## Where OpenAI is explicitly NOT used

| Area | Notes |
|---|---|
| Deterministic Website Growth Audit scoring / findings / crawl | `runDeterministicWebsiteAudit` |
| Free public audit | Zero AI |
| Qualification scoring (deterministic) | Prospecting Sprint 3 |
| Google Places discovery / competitor discovery | Places API only |
| Competitor validation / geographic relevance | Deterministic |
| Competitor website audits | Same deterministic audit engine |
| Deterministic Implementation Plan generation | Commercial Sprint 1 / 1.1 — zero OpenAI |
| Contact discovery (email / forms from HTML) | Fetch + parse |
| Resend send / webhooks / suppression | Email infrastructure |
| Stripe checkout / webhooks | Payments |
| Report HTML / PDF rendering | Presentation |
| Competitive report presentation | DB read only |

---

## Shared configuration

- Never prefix OpenAI secrets with `NEXT_PUBLIC_`
- Free public audits must not call OpenAI
- Prefer reuse of persisted AI artifacts over regeneration
- Operators should not treat AI prose as audited facts without checking deterministic evidence

See also: [cost-controls.md](cost-controls.md), [security-privacy.md](security-privacy.md), [competitive-intelligence.md](competitive-intelligence.md).
