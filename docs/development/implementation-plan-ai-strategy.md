# Implementation Plan AI Strategy (Commercial Sprint 2)

**Status:** Implemented (internal)  
**OpenAI calls per explicit Generate:** 1 initial + max 1 semantic repair  
**Places / crawl / contact discovery / Resend / outbound:** **0**  
**Audience:** Internal operators only — not a proposal, not public

AI explains an authoritative deterministic `ImplementationPlan`. AI does **not** decide what JS Solutions should sell.

```text
Audit / Competitive facts
        ↓
Deterministic Implementation Plan  (Commercial Sprint 1 / 1.1 — SOURCE OF TRUTH)
        ↓
AI Implementation Strategy         (Commercial Sprint 2 — INTERPRETATION ONLY)
        ↓
Human review / plan approval       (unchanged; AI does not approve)
        ↓
(Future) Opportunity / Proposal    — NOT implemented
```

---

## Versions

| Constant | Value |
|---|---|
| `IMPLEMENTATION_INTERPRETATION_VERSION` | 1 |
| `IMPLEMENTATION_INTERPRETATION_PROMPT_VERSION` | 1 |
| Model | `OPENAI_AUDIT_MODEL` (shared with other internal AI paths) |

Persisted on every row: model, plan version, mapping version, interpretation version, prompt version, input fingerprint.

---

## Authority rules

| Rule | Enforced |
|---|---|
| Source of truth | `ImplementationPlan` snapshot referenced by id |
| AI may add workstreams | **No** |
| AI may remove workstreams | **No** |
| AI may change priorities | **No** |
| AI may change capabilities | **No** |
| AI may invent actions | **No** |
| AI may invent pricing / hours / deadlines / outcomes | **No** |
| AI may create a proposal | **No** |

UI renders priorities, capabilities, actions, evidence, and preservation from the plan. AI adds explanatory prose only.

---

## Module

`src/lib/commercialization/implementation-interpretation/`

Patterns reused from Competitive Interpretation (Sprint 12 / 12.1 / 13.1):

- OpenAI Structured Outputs + Zod
- sourceKey validation
- commercial claim validation
- English-language / script validation
- fingerprint + historical persistence + staleness
- one semantic repair retry
- recursive required-field schema regression helper

---

## Persistence

Model: `ImplementationPlanInterpretation`

Statuses: `PENDING` | `RUNNING` | `COMPLETED` | `FAILED`

- Generate / Regenerate → new historical row when OpenAI runs  
- Matching COMPLETED fingerprint → reuse (0 OpenAI)  
- Failed regenerate does **not** delete prior COMPLETED rows  
- Bound to exact `implementationPlanId` — never “latest plan” after generation

---

## Staleness (human regenerate only)

Stale when plan id / plan version / mapping version / interpretation version / prompt version / model / input fingerprint diverge. No auto-regenerate.

---

## Caps

- Max 7 workstreams, 6 actions / workstream, 8 evidence / workstream, 4 preservation notes  
- Concurrency 1; max 1 repair; max 2 OpenAI calls per explicit generation  

---

## Security

- Mutations require `getInternalSession()`  
- No contacts, outreach, lead notes, Stripe, or provider secrets in prompts  
- Analytics forbids `implementation_interpretation_id`, `implementation_strategy_json`, `input_fingerprint`, `internal_talking_points`, etc.  
- Internal talking points marked **INTERNAL ONLY** — not on public report surfaces  

---

## Not in scope

Pricing, estimates, hours, opportunities, proposal builder / PDF, public plan sharing, emailing plans, automatic approval, automatic generation on page load, new service capabilities.

---

## Verification

`src/lib/commercialization/implementation-interpretation/implementation-interpretation.verify.ts`

Related: [Implementation Plan Engine](implementation-plan-engine.md) · [AI architecture](ai-architecture.md)
