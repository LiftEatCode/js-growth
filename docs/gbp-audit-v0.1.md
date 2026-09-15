# GBP Audit Engine (v0.2)

Deterministic Google Business Profile **optimization** audit for JS Solutions / JS Growth.

Current engine version: **0.2** (calibration). v0.1 established the isolated rules engine; v0.2 adds confidence, profile maturity, calibration fixtures, and reduced duplicate weighting inside Trust.

This is **not** a local-pack rank tracker. It scores how well **available** profile signals are optimized. It does not claim that any checklist item is a Google ranking factor.

Status: engine + fixtures + CLI. No public UI, OAuth, payments, PDFs, or AI interpretation.

## How to interpret the GBP score

The **optimization score** (0–100) measures how well the rules we could actually evaluate were satisfied.

It does **not** directly represent:

- Google Maps ranking position
- guaranteed lead generation
- business quality or food/service quality
- customer satisfaction
- total local marketplace authority
- guaranteed ranking improvement

Read the score with two sibling fields:

| Field | Meaning |
|---|---|
| Optimization score + label | Quality of evaluated setup and hygiene |
| Profile maturity | How far along the listing is in time/history (`new` → `mature`) |
| Confidence | How much of the relevant audit we could evaluate (coverage) |

A new listing can score **Excellent** with maturity **new**. That means the card is well filled, not that it has established authority.

A popular restaurant can score **Needs Improvement** with maturity **mature**. Customers like it; the owner-controlled profile is still sloppy.

A complete listing that went quiet can score **Good Foundation** with maturity **mature**. Setup was done once; freshness was not maintained.

## Purpose

Help operators and (later) customers see what is weak on a Business Profile, what to do next, and how complete the listing looks — using explainable rules.

## Architecture

```
Google API later
        ↓
GBP Adapter / Normalizer
        ↓
Normalized BusinessProfileData
        ↓
Audit rules engine
        ↓
Scoring engine
        ↓
Recommendations
        ↓
Audit result (v0.2: score + maturity + confidence; later: report UI)
```

The engine **never** imports Google API response types. `src/lib/gbp/` (OAuth + read sync) stays separate. A future adapter must emit `BusinessProfileData`.

v0.2 source is still `MockBusinessProfileAdapter` + fictional fixtures. Google is not connected.

## Normalized data

See `src/lib/gbp-audit/types.ts`.

Presence convention:

| Value | Meaning | Typical rule result |
|---|---|---|
| `null` | Unknown / not observed | `insufficient_data` (not a fail) |
| `""`, `[]`, `0`, `false` | Known empty | Fail or warn if the rule evaluates absence |
| Filled value | Known present | Pass / warn on quality |

Field provenance (documented on the type):

- **Expected from GBP** — identity, hours, categories, services, review aggregates, conversion URLs, media when those APIs are wired.
- **Derived** — most-recent post/review dates, owner response counts, new-business flag, category scores.
- **Optional / GBP may omit** — opening date, special hours, attributes, products, messaging, owner vs customer photo split, posts (not in current JS Growth GBP read V1).
- **External** — `localSeoContext` (website NAP, landing page). Never invented from GBP alone.

## Categories and weights

Configured in `src/lib/gbp-audit/constants.ts` (`CATEGORY_WEIGHTS`). Must sum to 100.

| ID | Label | Weight |
|---|---|---|
| `profile_optimization` | Profile Optimization | 25% |
| `reviews_reputation` | Reviews & Reputation | 25% |
| `activity_freshness` | Activity & Freshness | 15% |
| `local_seo` | Local SEO | 15% |
| `trust_authority` | Trust & Authority | 10% |
| `conversion_readiness` | Conversion Readiness | 10% |

## Scoring

1. Each rule returns `pass` / `warning` / `fail` / `not_applicable` / `insufficient_data` with a `maxScore` from `RULE_MAX_SCORES`.
2. Points: pass = 100% of max, warning = 50% (`WARNING_SCORE_RATIO`), fail = 0.
3. **`not_applicable` and `insufficient_data` are excluded from the category denominator.** They do not pull the score toward zero.
4. Category score = round(earned / possible × 100) for scored rules in that category. If possible = 0, the category is not applicable.
5. Overall score = round(Σ (categoryScore × weight) / Σ weights of applicable categories). Remaining weights are renormalized so a fully N/A category does not crush the total.
6. Overall is an integer 0–100.
7. **Confidence and maturity are not mixed into this number.** Low coverage does not discount the score. Being new does not cap the score.

### Score bands

| Band | Label | Range |
|---|---|---|
| `excellent` | Excellent | 90–100 |
| `strong` | Strong | 80–89 |
| `good_foundation` | Good Foundation | 70–79 |
| `needs_improvement` | Needs Improvement | 60–69 |
| `significant_opportunity` | Significant Opportunity | 0–59 |

## How not-applicable works

Used when the rule does not apply to the business model — e.g. service areas for a storefront, public storefront address for a service-area business, booking CTAs when the model does not book online, average rating when there are zero reviews.

Those rules are omitted from points possible. A service-area business is **not** failed for hiding a home address.

## How insufficient-data works

Used when the snapshot did not observe the field (adapter/API gap), including:

- Photo/post APIs not wired
- Individual reviews missing while aggregates exist
- No `localSeoContext` for NAP matching

Unknown is **not** the same as “empty profile.” An otherwise strong listing with `photoCount: null` is not scored as zero photos.

Absence that **is** the thing being checked (e.g. `websiteUrl: ""`) still fails.

If post data is unavailable because an API is not wired, the finding is `insufficient_data` (“could not be evaluated from the available data”), never “no posts found.”

## Confidence (coverage)

`confidence` on the audit result:

```text
evaluatedRules = pass + warning + fail
insufficientDataRules = insufficient_data
applicableRules = evaluatedRules + insufficientDataRules
coveragePercent = round(100 * evaluatedRules / applicableRules)
```

`not_applicable` is omitted from both numerator and denominator. A service-area business does not lose coverage for skipping a storefront-address rule.

Bands (`CONFIDENCE_THRESHOLDS`):

| Level | Coverage |
|---|---|
| high | ≥ 80% |
| medium | 50–79% |
| low | < 50% |

A 95 with 55% coverage is not the same certainty as a 95 with 100% coverage. The UI (later) should show both.

## Profile maturity

`maturity.level`: `new` | `developing` | `established` | `mature` | `unknown`

Opening date is the primary signal (`MATURITY_THRESHOLDS`):

| Level | Opening age |
|---|---|
| new | ≤ 180 days |
| developing | ≤ 540 days (~18 months) |
| established | < ~5 years |
| mature | ≥ ~5 years |

If opening date is missing, the classifier does **not** invent a precise age. It may use oldest observed review + count as a coarse fallback, or return `unknown` when evidence is too thin (zero reviews, or counts without dates).

`isNewBusiness` (opening date ≤ 180 days) still changes **review-volume rule behavior**. Maturity is the product-facing stage label and does not by itself subtract points.

## New-business behavior

- Do not fail review count for lacking years of reviews.
- Zero reviews on a new listing is a **warning**, not a mature-style fail.
- Copy must not scold “poor review history.”
- Early 5.0 ratings can pass optimization while maturity stays `new`.
- Excellent optimization + developing/new maturity is the intended pairing.

## Duplicate-signal philosophy (v0.2)

Some overlap is kept on purpose:

| Signal | Primary category | Echo | Why |
|---|---|---|---|
| Review recency | Reviews | Trust (lighter) | Hygiene vs “does this look current to a stranger” |
| Owner replies | Reviews | Trust (lighter) | Process vs presence |
| Photos / logo / cover | Profile | Trust media | Completeness vs “does the card look real” |
| Identity fields | Profile | Trust completeness | Field-level vs composite impression |
| Phone / website | Profile + Conversion | — | Completeness vs customer action |

v0.2 reduced Trust echo weights (recency/engagement 20→10, completeness/media 15→10) so the same stale review date is not a third full-size penalty. Category **weights were not changed**.

Activity still has a combined rollup plus channel rules. When all three share a status, the category ratio is unchanged; the rollup helps when posts and photos diverge.

## Stale-but-complete vs popular-but-unoptimized

- **complete-but-inactive:** setup can still look Excellent in Profile/Conversion while Activity is ~0 and review recency fails. Calibration target ~70–82.
- **popular-but-poorly-optimized:** high rating and volume do not mint an Excellent optimization score. Missing cover, posts, CTAs, and owner replies still count. Calibration target ~65–82.

## Current rules

Registered in `src/lib/gbp-audit/rules/index.ts`. Thresholds live in `THRESHOLDS`.

### Profile Optimization

Primary category, additional categories (warn if none — never fail), description present, description substance, phone, website, regular hours, service areas (N/A for storefront), services (warn if none unless products exist), logo, cover, photo count, public storefront address (N/A for SAB).

### Reviews & Reputation

Review count (softer for new businesses), average rating, recent review activity, owner response rate, replies to recent low-star reviews (needs individual reviews).

Volume thresholds are heuristics (`reviewCountModest` = 5), not “every business needs 100 reviews.”

### Activity & Freshness

Recent posts, recent owner-uploaded photos, combined recent activity rollup.

### Local SEO

Website URL on the profile; name/phone consistency and landing-page relevance **only when** `localSeoContext` is supplied. Otherwise `insufficient_data`.

### Trust & Authority

Composites of review quality, review recency, owner engagement, profile completeness, media presence.

**Overlap:** Trust reuses rating, recency, replies, and identity fields. v0.2 keeps the questions distinct and lowers echo `maxScore` values. See Duplicate-signal philosophy.

### Conversion Readiness

Phone, website, booking/order/reserve/menu CTA **if the model expects it**, hours, at least one action path. Does not require every GBP feature.

## Recommendations

Deterministic. Fail and warning findings become `priorities`, sorted by severity (high → medium → low) then score impact. Each item has what was found, why it matters, and what to do. No model-generated copy.

## Fixtures

Fictional businesses only (`src/lib/gbp-audit/fixtures/`):

| ID | Intent |
|---|---|
| `excellent-business` | Mature, complete, active, matching NAP context |
| `average-business` | Real but unfinished; no external NAP context |
| `poor-business` | Neglected mature listing |
| `new-business` | Opened within 180 days; must not be scored like a 10-year listing with no reviews |
| `service-area-business` | No public storefront; service areas required |
| `complete-but-inactive-business` | Strong one-time setup, stale reviews/posts/photos |
| `popular-but-poorly-optimized-business` | High review authority, weak owner-controlled fields |

`capturedAt` is fixed (`2026-08-30T12:00:00.000Z`) so recency math is deterministic.

## CLI

```bash
npm run audit:gbp
npm run audit:gbp -- average-business
```

## Assumptions

- Recency uses `profile.capturedAt`, not `Date.now()`.
- New-business **rule** treatment requires `configuration.openingDate`. Missing opening date does not use those softer review rules; maturity may still be `unknown`.
- Additional categories are optional; empty is a warning.
- Phone/website appear in both Profile and Conversion by design (completeness vs action).
- Name matching is fuzzy (legal suffixes stripped); mismatches warn rather than assume spam.

## Known limitations

- No Google API adapter; mocks only.
- Posts, photos, attributes, Q&A, and review replies are often unavailable on the current GBP read integration — adapters should pass `null`, not `0`.
- No Maps performance metrics, keyword volume, or competitor comparison.
- No website crawl inside this engine. Missing `localSeoContext` yields `insufficient_data` for NAP rules, which can leave Local SEO looking like 100% from the website URL alone. Confidence coverage is how that gap is communicated; it does not discount the score.
- Thresholds will change after real customer profiles.
- Trust still echoes Reviews/Profile at reduced weight.
- No UI, persistence, billing, or AI layer.

## Future

1. Google adapter: map Business Information + reviews (+ media/posts when approved) → `BusinessProfileData`.
2. Feed `localSeoContext` from Website Growth Audit NAP/landing-page extractors.
3. Persist audit runs; operator UI; later customer report.
4. Optional AI interpretation **on top of** these findings (same pattern as website-audit AI), never instead of rules.
5. Do not auto-edit GBP.

## Product principles

Do not invent ranking factors. Do not promise traffic or pack placement. Separate completeness from performance. Treat new businesses and service-area businesses fairly. Explain why each recommendation matters. Keep thresholds in constants.
