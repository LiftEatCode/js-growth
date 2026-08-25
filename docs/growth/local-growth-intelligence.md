# Local Search / Google Business Profile Intelligence V1

**LOCAL_GROWTH_VERSION = 1**  
Dashboard: `/reports/growth/local` · Compact card: `/reports/growth`

Research: [`../research/local-search-gbp-intelligence-2026.md`](../research/local-search-gbp-intelligence-2026.md)

## Principle

Measurement-honest local/GBP operations. Keep evidence layers separate. **No fake GBP score. No ranking guarantees.**

Sprint 12 established manual Insights + checklist. **Sprint 12.1** adds READ-ONLY API sync (`GBP_READ_INTEGRATION_VERSION = 1`) — see [`gbp-api-integration.md`](gbp-api-integration.md).
## Evidence layers

Never collapse into one score:

| Layer | Role |
|---|---|
| PROFILE | Checklist accuracy vs `JS_SOLUTIONS_LOCAL_FACTS` |
| VISIBILITY | Profile / Search / Maps views (when captured) |
| ENGAGEMENT | Website clicks, calls, directions, messages |
| REPUTATION | Review count, rating, observational velocity |
| WEBSITE_TRAFFIC | First-party GBP-tagged sessions/conversions |
| CONVERSION | GBP-attributed audits / contacts / leads (read-only) |
| LOCAL_SEARCH | Search Intelligence local opportunities (anti-doorway) |
| CONTENT | GBP_POST plans + experimental post cadence |

Performance states: `NO_DATA` · `BASELINE_ONLY` · `EARLY_SIGNAL` · `MONITORING` · `DIRECTIONAL_IMPROVEMENT` · `DIRECTIONAL_DECLINE` · `REVIEW_REQUIRED`.  
Evidence strength (Sprint 8 vocabulary): `NONE` · `WEAK` · `DIRECTIONAL` · `MEANINGFUL`.

## Snapshots — `GrowthSnapshot` source `GOOGLE_BUSINESS_PROFILE`

Manual Insights capture via operator form. Schema: `gbpSnapshotMetricsSchema` (`src/lib/growth/snapshot.ts`).

| Rule | Meaning |
|---|---|
| Blank / omitted | `null` → **NOT_CAPTURED** |
| Entered `0` | Observed zero |
| Like windows only | Mismatched windows → UNKNOWN |

Do not coerce blank form fields to `0`. Do not invent metrics Google does not show. Searches update monthly — wait or leave NOT_CAPTURED; do not invent zeros.

Provenance: `MANUAL` (operator form) · `API` (Sync Performance). Interpretation ignores capture path once validated. Never rewrite historical MANUAL rows.

Migration (Sprint 12): `prisma/migrations/20260825010000_growth_sprint12_local_gbp`.  
Migration (Sprint 12.1): `prisma/migrations/20260825120000_growth_sprint12_1_gbp_read` (`GoogleBusinessProfileConnection`).
## Profile checklist — `LocalGbpProfileChecklistItem`

Durable rows keyed by checklist item (`BUSINESS_NAME`, `PRIMARY_CATEGORY`, `WEBSITE_UTM`, …).

| Field | Values |
|---|---|
| `status` | `NOT_REVIEWED` · `OK` · `NEEDS_ATTENTION` · `NOT_APPLICABLE` |
| `factMatch` | `MATCH` · `MISMATCH` · `NOT_CAPTURED` · `NOT_APPLICABLE` |

Compares observed GBP config to `JS_SOLUTIONS_LOCAL_FACTS` / `JS_SOLUTIONS_BUSINESS_FACTS`. **Growth Engine does not mutate business facts.**

## Cadence

**`JS_SOLUTIONS_OPERATING_RULE`** (not Google ranking advice):

- **Weekly:** Sync Profile + Sync Performance (when connected) · review/reply triage · accuracy spot-check on exceptions  
- **Monthly:** deeper review (Searches when available, categories/attributes, post/review quality, UTM evidence)  
- **Posts:** experimental **1–2 Updates/week** (`EXPERIMENTAL_OPERATING_CADENCE`) — pause if quality drops · still **manual** in Google (unsupported for V1 API write)

Post formats modeled: `UPDATE` · `OFFER` · `EVENT` (photo is media on an Update, not a separate post type).

## Experiments GBP-001 … GBP-010

IDs use `GBP-NNN` on existing experiment decision architecture. Default: **only GBP-001 ACTIVE**; others QUEUED.

| ID | Title |
|---|---|
| GBP-001 | Profile completeness / accuracy review (**ACTIVE**) — Sync Profile → review exceptions only || GBP-002 | UTM website link |
| GBP-003 | GBP content cadence |
| GBP-004 | Photo / content mix |
| GBP-005 | Service inventory clarity |
| GBP-006 | Review response workflow |
| GBP-007 | Site → GBP follow path |
| GBP-008 | GBP post → audit CTA |
| GBP-009 | Local service content |
| GBP-010 | Magnolia local landing evaluation |

Recommended sequence: **GBP-001 → GBP-002 → GBP-003 → GBP-008 → GBP-004 → GBP-006** (profile + attribution before volume).

## Magnolia / doorway

`MAGNOLIA_LOCAL_PAGE_DECISION = TEST_LATER` with doorway protection. Thin city pages (`/seo-magnolia`, multi-city factories) blocked. Revisit only with `DISTINCT_USER_VALUE` + intent + collision + business relevance.

## Website → GBP

`WEBSITE_TO_GBP_DECISION = DEFER`. Do not clutter audit/contact conversion pages. Evaluate as GBP-007 after profile + UTM hygiene.

## Attribution / UTMs

Canonical (Acquisition Capture V1):

| Surface | source | medium | campaign | content |
|---|---|---|---|---|
| Website link | `google_business_profile` | `organic_local` | `gbp_profile` | `website` |
| Post | same | same | same | `post_<slug>` |

Tagged GBP → first-party GBP channel. Generic Google referrer → **ORGANIC_SEARCH**, not GBP. Historical UNKNOWN stays UNKNOWN.

## Sprint 12.1 — GBP Read Integration

When connected:

1. **Pause** bulk manual typing for GBP-001 profile fields the API can observe.
2. **Sync Profile** → checklist auto-populates objective fields; subjective / unsupported stay for human review.
3. **Sync Performance** → API snapshot for the sync window (idempotent).
4. Review **exceptions** only; change Google in Google’s UI (no app writes).

Unsupported V1 (manual): photos, logo, cover, posts, Q&A, social, attributes, review responses. Reviews: **aggregates only**.

| Integration | Status |
|---|---|
| `GBP_READ_INTEGRATION_VERSION` | **1** — READ-ONLY OAuth sync |
| Dashboard-load GBP API | **0** |
| Places / GSC / Meta / OpenAI on load | **0** |
| Write / publish / scheduled sync | Deferred |

## Side-effect budget

Dashboard / local page load:

OpenAI 0 · Meta 0 · GSC API 0 · GBP API 0 · Places 0 · Crawl 0 · Resend 0 · Stripe 0 · Twilio 0

Explicit Sync Profile / Sync Performance may call Google; never on render.

## Privacy

Aggregate snapshot metrics only. No reviewer names/review text. Refresh tokens encrypted server-side — never client-exposed. No GBP internal IDs in GA4. `/reports/growth/local` is a **static** analytics path.

## Code

- `src/lib/growth/local-growth.ts`
- `src/lib/growth/local-growth-store.ts`
- `src/lib/growth/local-growth-metrics.ts`
- `src/lib/gbp/*` · `/api/gbp/oauth/*`
- `/reports/growth/local` · compact card on `/reports/growth`

## Docs

- [gbp-api-integration.md](gbp-api-integration.md)
- [growth-sprint12-production-acceptance.md](growth-sprint12-production-acceptance.md)
- [growth-sprint12-1-production-acceptance.md](growth-sprint12-1-production-acceptance.md)
- [../research/local-search-gbp-intelligence-2026.md](../research/local-search-gbp-intelligence-2026.md)
- [../research/google-business-profile-api-2026.md](../research/google-business-profile-api-2026.md)
