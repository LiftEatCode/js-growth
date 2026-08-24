# Content Development Workflow

1. **Intelligence** — Search opportunity / gap / refresh recommendation with WHY.
2. **Plan** — `GrowthContentPlan` with provenance (`searchOpportunitySlug`).
3. **Brief** — Validated `ContentBriefV1` (extends Sprint 5 contract).
4. **Generate** — Operator click only. One plan at a time.
   - No human draft → `INITIAL_GENERATE` → `generationJson`
   - Human draft exists → **Regenerate from Brief** or **Revise with AI** → `candidateDraftJson` only
5. **Review candidate** — Operator inspects AI candidate separately from the canonical draft.
6. **Apply or Discard** — Explicit **Apply AI Revision** copies candidate → `humanDraftJson`. Discard clears candidate. Neither auto-approves or publishes. **0 OpenAI**.
7. **Human edit** — Canonical `humanDraftJson` always wins until explicit Apply.
8. **Approve** — Operator sets `APPROVED` (AI never does this).
9. **Publish** — Code/deploy the approved asset (e.g. `/seo`). Requires `APPROVED`. Then mark `PUBLISHED` with URL + `publishedAt`.
10. **Measure** — Lifecycle starts `PUBLISHED_AWAITING_DATA` / `NO_DATA` (not fabricated zeros). Manual Search + GA4 + first-party when available.
11. **Distribute** — Deterministic recommendations; optional Facebook derivative **plans** (ledger only after real posts).
12. **Learn / recommend** — Feedback into Recommended Next Content; published gaps stop screaming “missing page.”

## Core principles

**AI MAY PROPOSE. HUMANS CONTROL THE CANONICAL DRAFT.**  
**WE PUBLISHED IT. NOW WHAT ACTUALLY HAPPENED?** (observation ≠ causation)

- AI call → `candidateDraftJson` (after a human draft exists) → human review → explicit Apply → `humanDraftJson`
- Never: AI call → automatically replace `humanDraftJson`

## AI after human edit

| Action | Input | Writes | Overwrites human? |
|---|---|---|---|
| Generate (no human yet) | Brief | `generationJson` | N/A |
| Regenerate from Brief | Brief | `candidateDraftJson` | No |
| Revise with AI | Brief + human draft + untrusted revision instruction | `candidateDraftJson` | No |
| Apply AI Revision | — | `humanDraftJson` ← candidate | Yes (explicit only) |
| Discard Candidate | — | clears candidate | No |

Revision instructions are **UNTRUSTED OPERATOR DATA**. They may request editorial changes but must not override business facts, claim safety, privacy, content type, publication boundary, or commercial authority.

## APPROVED content

If status is `APPROVED`, reopen for review before AI regenerate/revise/apply or further human edits. Never silently mutate approved content.

## Prohibited

- Auto-publish
- Mass generation
- Silent AI overwrite of human drafts
- Inventing founder stories (`FOUNDER_INPUT_REQUIRED`)
- Ranking / traffic / lead guarantees
- Creating `GrowthContentRecord` before Facebook publish
- Mutating commercial authority objects
