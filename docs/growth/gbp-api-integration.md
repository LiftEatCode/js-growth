# Google Business Profile Read Integration V1

**GBP_READ_INTEGRATION_VERSION = 1**  
Dashboard: `/reports/growth/local`  
Research: [`../research/google-business-profile-api-2026.md`](../research/google-business-profile-api-2026.md)  
Setup: [`../development/google-business-profile.md`](../development/google-business-profile.md)

## Principle

**READ FIRST. COMPARE SECOND. OPERATOR DECIDES.**

- Read profile, Performance metrics, and review **aggregates** from Google.
- Compare to `JS_SOLUTIONS_LOCAL_FACTS` / business facts.
- Surface exceptions; humans decide what to change **in Google’s UI**.
- **No automatic GBP writes** (posts, profile patches, review replies, media uploads).

OAuth scope is `https://www.googleapis.com/auth/business.manage` (write-capable). App enforces **READ-ONLY** method allowlist.

## Operator workflow

```
Open /reports/growth/local
        ↓
Connect Google Business Profile (once)
        ↓
Select managed location
        ↓
Sync Profile
        ↓
Sync Performance
        ↓
Review checklist exceptions / subjective fields
        ↓
Act in Google UI if needed
```

Do **not** copy/paste dozens of Insights fields by hand when connected. Manual snapshot form remains for fallback / gaps.

## Sync operations

| Action | Calls Google? | Effect |
|---|---|---|
| Page load (`/reports/growth`, `/local`) | **No** | Reads stored connection + snapshots only |
| Sync Profile | Yes (explicit) | Business Information (+ review aggregates) → checklist observations |
| Sync Performance | Yes (explicit) | Performance API → `GrowthSnapshot` with `provenance: API` |
| Disconnect | No live Google revoke required | Clears tokens; history preserved |

No scheduled auto-sync in V1.

## What syncs vs stays manual

| Area | V1 |
|---|---|
| Name, website, phone, hours summaries, categories, description, service area, serviceItems | Profile sync (API) |
| Objective fact-match (name, website, phone, address/service-area, UTM presence) | Auto where fields exist |
| Subjective checklist (category relevance, description quality, hours accuracy, services completeness, reviews workflow) | Human review after sync |
| Photos / logo / cover / posts / Q&A / social / attributes / review responses | **UNSUPPORTED_FOR_V1** — manual |
| Review count / average rating | Aggregates only — no reviewer names or review text |
| Performance daily metrics + monthly search keywords | Sync Performance |
| Manual Insights form | Preserved; historical MANUAL snapshots never rewritten |

## Snapshots

- API Performance sync writes `GrowthSnapshot` source `GOOGLE_BUSINESS_PROFILE` with `provenance: API` and window identity for idempotency.
- Blank / missing API values → **NOT_CAPTURED**, not coerced to `0`.
- Entered / observed `0` remains observed zero.
- Prior **MANUAL** baselines stay intact.

## Security

- Refresh tokens: AES-GCM on `GoogleBusinessProfileConnection` (`encryptedRefreshToken` + IV + auth tag).
- Never render refresh/access tokens, `client_secret`, or ciphertext fields to the client.
- GA4: no Google account/location IDs or tokens; `/reports/growth/local` stays a static analytics path.
- Places API is separate (prospecting) — do not mix credentials.

## Side-effect budget

| Path | GBP API | Writes to Google |
|---|---|---|
| Dashboard / local load | **0** | 0 |
| Explicit Sync Profile / Performance | Allowed | 0 |
| OpenAI / Meta / GSC / Places / Crawl / Resend / Stripe | 0 on load | — |

## Code

- `src/lib/gbp/*` — OAuth, crypto, providers, normalize, sync, compare
- `src/app/api/gbp/oauth/start` · `callback`
- Prisma: `GoogleBusinessProfileConnection`; migration `20260825120000_growth_sprint12_1_gbp_read`
- E2E: `tests/growth/e2e/gbp-read.spec.ts` (`GROWTH_TEST_MOCK_GBP=1`)

## Docs

- [growth-sprint12-1-production-acceptance.md](growth-sprint12-1-production-acceptance.md)
- [local-growth-intelligence.md](local-growth-intelligence.md)
