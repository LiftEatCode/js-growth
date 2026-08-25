# Cross-Channel Growth Intelligence V1

**CROSS_CHANNEL_INTELLIGENCE_VERSION = 1**  
Dashboard: `/reports/growth` (compact) · Detail: `/reports/growth/intelligence`

## Principle

Answer: **What should JS Solutions work on next to improve growth, based on evidence we actually have across channels?**

This is a deterministic decision layer — not a fake Growth Score, not an AI executive summary, not a vanity dashboard of disconnected metrics.

## Authority

| Layer | Authority |
|---|---|
| Channel snapshots (GA4 / GSC / Facebook / GBP / INTERNAL) | `GrowthSnapshot` (manual + API provenance where applicable) |
| Content / search plans & reviews | Content Intelligence + Search Intelligence |
| Inbound/outbound conversion | Lead Conversion Intelligence (observe-only) |
| Follow-up queue | `FollowUpActivity` + `followUpAt` / `nextActionAt` |
| Commercial pipeline | Opportunity · Proposal · Agreement · Payment · Client |

Growth Intelligence **reads** commercial facts. It does not mutate CRM, publish content, send outreach, or charge payments.

## Evidence domains

WEBSITE · SEARCH · FACEBOOK · GBP · CONTENT · AUDIT · CONTACT · INBOUND_LEAD · OUTBOUND_PROSPECT · OPPORTUNITY · FOLLOW_UP · PROPOSAL · AGREEMENT · PAYMENT · CLIENT

Bounded `CrossChannelEvidence` objects preserve:

`UNKNOWN` · `NOT_CAPTURED` · `INSUFFICIENT_DATA` · `OBSERVED_ZERO` · `OBSERVED`

Unknown ≠ zero.

## Evidence strength

`NONE` · `WEAK` · `DIRECTIONAL` · `MEANINGFUL`

Sample labels reuse Lead Conversion rules: ≤4 INSUFFICIENT_DATA · 5–19 EARLY_DIRECTIONAL · ≥20 USABLE. No “statistically significant” without methodology.

## Leading / mid / lagging

Classification for priority weighting — **not** a causal chain:

| Class | Examples |
|---|---|
| LEADING | Impressions, profile views, reach, sessions, audit starts, GBP website clicks |
| MID_FUNNEL | Audit complete, contact, inbound lead, follow-up response |
| LAGGING | Opportunity, proposal, agreement, payment, client |

## Channel states (no composite score)

`NO_DATA` · `INSUFFICIENT_DATA` · `BASELINE` · `MONITORING` · `NEEDS_ATTENTION` · `DIRECTIONAL_POSITIVE` · `DIRECTIONAL_NEGATIVE` · `ACTION_REQUIRED`

Example: indexed `/seo`, impressions growing, clicks tiny, no attributable leads → `DIRECTIONAL_POSITIVE` with “conversion evidence insufficient” — not “SEO is working.”

## Signals & bottlenecks

Signals carry source, evidence, window, strength, interpretation, provenance, limitations.

Bottlenecks only surface when required evidence exists (e.g. `AUDITS_WITHOUT_LEADS`, `LEADS_WITHOUT_FOLLOW_UP`, `LOW_ATTRIBUTION_COVERAGE`, `GBP_PROFILE_INCOMPLETE`).

## Priority engine (NOW / NEXT / WATCH)

| Cap | Max |
|---|---|
| NOW | 3 |
| NEXT | 5 |
| WATCH | 5 |

### Competing priorities (JS_SOLUTIONS_OPERATING_RULE)

Commercial proximity outranks marketing busywork:

1. Pending payment / agreement / proposal
2. Overdue inbound follow-up (DNC excluded)
3. Attribution coverage repair when LOW
4. Usable-sample funnel drop-offs
5. Search CTR review only at ≥100 impressions
6. Content distribution / gaps
7. GBP checklist (below overdue leads)
8. Active experiment respect / wait for data / GBP API allowlisting pending

Every NOW/NEXT item includes **Why**, **Evidence**, and **Strength**.

## Attribution health

`GOOD_COVERAGE` · `PARTIAL_COVERAGE` · `LOW_COVERAGE` · `INSUFFICIENT_DATA`

Historical UNKNOWN is never rewritten. Prefer FIX_ATTRIBUTION before ranking channels by conversion when coverage is poor.

## Subsystem feedback

- **Content** — Published → Distributed? → Traffic? → Conversion? → Pipeline? → Review due? (ATTRIBUTED / OBSERVED / INFERRED / HYPOTHESIS)
- **Search** — Early evidence → WATCH; CTR review gated; no duplicate opportunities
- **Facebook** — Records/snapshots; Experiment 018 ACTIVE blocks conflicting experiments; followers ≠ revenue
- **Local/GBP** — Manual + API historical evidence; `GBP_API_APPROVAL_PENDING` is WATCH/dependency, not daily ERROR
- **Follow-up** — Overdue / aging / opportunity next actions; suppression respected
- **Commercial** — Read-only; ROI_NOT_AVAILABLE without cost

## Persistence

**DERIVED_ONLY_NO_NEW_TABLE_V1** — no new Prisma table for Sprint 13. Reconstruct from commercial DB + existing snapshots/plans. Optional future INTERNAL weekly summary may store channel summaries (never a score).

## Side-effect budget (dashboard load)

OPENAI = 0 · META = 0 · GSC = 0 · GBP = 0 · PLACES = 0 · CRAWL = 0 · RESEND = 0 · STRIPE mutations = 0

## AI boundary

Sprint 13 V1 is deterministic. Future advisory may consume FACTS / INTERPRETATIONS / HYPOTHESES — not shipped here.

## Code

- `src/lib/growth/cross-channel-intelligence.ts` — pure engine
- `src/lib/growth/cross-channel-metrics.ts` — server assembler
- `src/lib/growth/cross-channel-intelligence.verify.ts` — deterministic asserts
- `src/app/reports/growth/intelligence/page.tsx` — operator UI

## Related

- Research: [`docs/research/cross-channel-growth-intelligence-2026.md`](../research/cross-channel-growth-intelligence-2026.md)
- Weekly review: [`weekly-review.md`](weekly-review.md)
- Acceptance: [`growth-sprint13-production-acceptance.md`](growth-sprint13-production-acceptance.md)
