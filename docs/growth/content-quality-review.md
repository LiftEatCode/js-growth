# Content Quality Review

## Deterministic checks (V1)

| Check | Behavior |
|---|---|
| Helpfulness / intent | Brief validation requires audience, objective, CTA, constraints |
| Business accuracy | Prompts limited to `JS_SOLUTIONS_BUSINESS_FACTS` |
| Claim safety | Regex scan for guarantees / #1 / skyrocket / fake % growth |
| Founder safety | `FACEBOOK_FOUNDER` → `FOUNDER_INPUT_REQUIRED` blocks generation until facts exist |
| Duplication | Collision states: CLEAR / RELATED / REFRESH / CANNIBALIZATION / OVERUSED |
| Privacy | No commercial IDs / PII in prompts |

## Readiness states

- `NEEDS_WORK` — claim flags present
- `REVIEW_REQUIRED` — passed deterministic scan; human still required
- `READY_FOR_HUMAN_APPROVAL` — reserved for future AI review pass

Never emit a fake Google ranking score.

## Optional AI review

`CONTENT_REVIEW_PROMPT_VERSION` reserved. V1 ships deterministic review; AI review may supplement later without replacing claim regexes.
