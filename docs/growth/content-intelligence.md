# Content Intelligence Operating System

**CONTENT_INTELLIGENCE_VERSION = 1**

Prompt versions:

- `CONTENT_PLANNER_PROMPT_VERSION = 1` (deterministic planner)
- `CONTENT_DEVELOPER_PROMPT_VERSION = 2` (OpenAI draft + revise)
- `CONTENT_REVIEW_PROMPT_VERSION = 1` (reserved; deterministic claim scan ships in V1)

## Principle

Business need + Search Intelligence + inventory → content decision → brief → optional AI draft → human review → human publish → measure.

**AI MAY PROPOSE. HUMANS CONTROL THE CANONICAL DRAFT.**

AI helps develop the answer. It does not decide what is true, and it never silently replaces human work.

## Supported content types V1

SERVICE_PAGE · BLOG · FACEBOOK_COMPANY · FACEBOOK_FOUNDER · GBP_POST · VIDEO_BRIEF

## Draft layers on `GrowthContentPlan`

| Field | Role |
|---|---|
| `generationJson` | Original / initial AI draft |
| `humanDraftJson` | Canonical human draft (authoritative) |
| `candidateDraftJson` | Pending AI proposal (persisted; survives reload) |

History operations in `generationHistoryJson`: `INITIAL_GENERATE`, `REGENERATE_FROM_BRIEF`, `REVISE_CURRENT_DRAFT`, `APPLY_CANDIDATE`, `DISCARD_CANDIDATE`, `REOPEN_FOR_REVIEW`.

## Workflow

1. Seed / create `GrowthContentPlan` (often from `GrowthSearchOpportunity`)
2. Deterministic brief (`BRIEF_READY`)
3. Operator generates draft (OpenAI **or** skeleton) → `generationJson` when no human draft
4. Deterministic claim scan
5. Human edit → `humanDraftJson`
6. Further AI: **Regenerate from Brief** / **Revise with AI** → `candidateDraftJson` only (human preserved)
7. Explicit **Apply** or **Discard** candidate (0 OpenAI)
8. Human approve → `APPROVED` (reopen required before more AI/edits)
9. Human implements asset in code/deploy; marks `PUBLISHED` with URL + `publishedAt` (Sprint 7)
10. Performance lifecycle + distribution recommendations (Sprint 7)
11. Facebook `GrowthContentRecord` only after actual Facebook publish

See also: [content-performance.md](content-performance.md), [content-distribution.md](content-distribution.md).

## Side-effect budget

| Surface | OpenAI |
|---|---|
| `/reports/growth` load | 0 |
| `/reports/growth/content` load | 0 |
| Generate / Regenerate / Revise click | 1 (explicit) |
| Skeleton draft / candidate | 0 |
| Apply candidate | 0 |
| Discard candidate | 0 |
| Save human edits | 0 |

Meta / GSC API / Places / crawl / Resend / Stripe = 0

## Concurrency

`aiBusyUntil` + `updateMany` lock prevents double-submit races on candidate writes. UI disables AI actions while pending.

## Code

- `src/lib/growth/content-intelligence.ts`
- `src/lib/growth/content-plan-revision.ts`
- `src/lib/growth/content-plan-store.ts`
- `src/lib/growth/content-ai/*` (Responses API + zodTextFormat)
- `/reports/growth/content`

## Docs

- [content-development-workflow.md](content-development-workflow.md)
- [content-quality-review.md](content-quality-review.md)
- [content-sprint6-production-acceptance.md](content-sprint6-production-acceptance.md)
- [../research/content-intelligence-ai-2026.md](../research/content-intelligence-ai-2026.md)
