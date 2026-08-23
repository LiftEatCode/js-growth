# Content Brief Contract (Sprint 6 handoff)

Sprint 5 prepares intelligence. Sprint 6 consumes briefs. **OPENAI = 0 in Sprint 5.**

## Required fields

| Field | Description |
|---|---|
| topic | Bounded SearchTopic |
| primaryIntent | Bounded SearchIntent |
| audience | Who the page is for |
| businessObjective | Funnel goal (no rank promises) |
| targetServicePath | Primary commercial URL |
| recommendedFormat | Article / service / tool / local |
| recommendedPageType | Bounded page type |
| primaryQuestion | Main query concept |
| supportingQuestions | Outline prompts |
| internalLinkTargets | Paths to link |
| cta | Honest next step |
| evidence | Evidence kind |
| researchRequirements | What to verify before draft |
| localContext | Null unless genuinely local |
| avoidClaimConstraints | Hard bans (guarantees, doorways, spam) |

## Generator

`buildContentBriefFromSeed()` in `src/lib/growth/search-intelligence.ts`.

## Sprint 6 will

- Expand briefs into drafts with editorial review (`ContentBriefV1` extends this contract)
- Operator-initiated AI drafting under people-first + spam policy constraints
- Not invent search volume or ranking guarantees
- Human approval required; no auto-publish / mass generation

See also: [content-intelligence.md](content-intelligence.md).