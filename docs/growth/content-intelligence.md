# Content Intelligence Operating System

**CONTENT_INTELLIGENCE_VERSION = 1**

Prompt versions:

- `CONTENT_PLANNER_PROMPT_VERSION = 1` (deterministic planner)
- `CONTENT_DEVELOPER_PROMPT_VERSION = 1` (OpenAI draft)
- `CONTENT_REVIEW_PROMPT_VERSION = 1` (reserved; deterministic claim scan ships in V1)

## Principle

Business need + Search Intelligence + inventory → content decision → brief → optional AI draft → human review → human publish → measure.

AI helps develop the answer. It does not decide what is true.

## Supported content types V1

SERVICE_PAGE · BLOG · FACEBOOK_COMPANY · FACEBOOK_FOUNDER · GBP_POST · VIDEO_BRIEF

## Workflow

1. Seed / create `GrowthContentPlan` (often from `GrowthSearchOpportunity`)
2. Deterministic brief (`BRIEF_READY`)
3. Operator generates draft (OpenAI **or** skeleton)
4. Deterministic claim scan
5. Human edit (`humanDraftJson` preserved; regenerate blocked while human draft exists)
6. Human approve → `APPROVED`
7. Human marks `PUBLISHED` with URL after real publish
8. Facebook `GrowthContentRecord` only after actual Facebook publish (not from this engine)

## Side-effect budget

| Surface | OpenAI |
|---|---|
| `/reports/growth` load | 0 |
| `/reports/growth/content` load | 0 |
| Generate draft click | 1 (explicit) |
| Skeleton draft | 0 |

Meta / GSC API / Places / crawl / Resend / Stripe = 0

## Code

- `src/lib/growth/content-intelligence.ts`
- `src/lib/growth/content-plan-store.ts`
- `src/lib/growth/content-ai/*` (Responses API + zodTextFormat)
- `/reports/growth/content`

## Docs

- [content-development-workflow.md](content-development-workflow.md)
- [content-quality-review.md](content-quality-review.md)
- [content-sprint6-production-acceptance.md](content-sprint6-production-acceptance.md)
- [../research/content-intelligence-ai-2026.md](../research/content-intelligence-ai-2026.md)
