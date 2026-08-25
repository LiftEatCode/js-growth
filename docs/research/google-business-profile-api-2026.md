# Google Business Profile API Research — 2026 (Growth Sprint 12.1)

**ACCESS DATE:** 2026-08-25  
**Property / operator:** JS Solutions (js-growth)  
**Sprint:** Growth Sprint 12.1 — GBP READ integration into Local Growth  
**GBP_READ_INTEGRATION_VERSION:** `1`  
**Intent:** **READ-ONLY** sync of account/location profile data, Performance metrics, and review **aggregates** into Local Growth. No write/publish in V1. Places API is out of scope.

**Provenance labels:**

| Label | Meaning |
|---|---|
| `OFFICIAL_GOOGLE` | Stated in Google for Developers Business Profile API docs as of ACCESS DATE |
| `JS_SOLUTIONS_OPERATING_RULE` | Internal product/enforcement decision for this integration |

Prefer `OFFICIAL_GOOGLE` for API facts. Do **not** invent ranking, SEO, or undocumented product behavior.

---

## Executive summary

Google Business Profile (GBP) APIs require OAuth 2.0 with `https://www.googleapis.com/auth/business.manage`. That scope **can** authorize write operations; JS Solutions **enforces READ-ONLY** usage in app code for `GBP_READ_INTEGRATION_VERSION = 1`.

Current surface for Local Growth sync:

| Priority | API | Host | Role in V1 |
|---|---|---|---|
| Required | My Business Account Management | `mybusinessaccountmanagement.googleapis.com` | List accounts |
| Required | My Business Business Information | `mybusinessbusinessinformation.googleapis.com` | List/get locations + profile fields |
| Required | Business Profile Performance | `businessprofileperformance.googleapis.com` | Daily metrics + monthly search keywords |
| Optional aggregates | Google My Business API v4 | `mybusiness.googleapis.com` | Reviews list → persist `averageRating` / `totalReviewCount` only |
| Deferred | Google My Business API v4 | `mybusiness.googleapis.com` | Local Posts CRUD; Media list (presence only) |

Legacy `accounts.locations.reportInsights` was replaced by the Performance API (discontinued **2023-03-30**). `localPosts.reportInsights` has **no replacement** (discontinued **2023-02-20**). `plus.business.manage` is deprecated for new apps.

**V1 product rules:** no dashboard-load live API calls; sync is offline/job-driven; write/publish deferred; Places API separate.

---

## Sources (official)

| Topic | URL |
|---|---|
| Implement OAuth | https://developers.google.com/my-business/content/implement-oauth |
| Basic setup | https://developers.google.com/my-business/content/basic-setup |
| Deprecation / sunset schedule | https://developers.google.com/my-business/content/sunset-dates |
| Work with location data | https://developers.google.com/my-business/content/location-data |
| Location resource (Business Information) | https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations |
| Account Management `accounts.list` | https://developers.google.com/my-business/reference/accountmanagement/rest/v1/accounts/list |
| Performance API overview | https://developers.google.com/my-business/reference/performance/rest |
| `DailyMetric` | https://developers.google.com/my-business/reference/performance/rest/v1/DailyMetric |
| `fetchMultiDailyMetricsTimeSeries` | https://developers.google.com/my-business/reference/performance/rest/v1/locations/fetchMultiDailyMetricsTimeSeries |
| Search keywords monthly | https://developers.google.com/my-business/reference/performance/rest/v1/locations.searchkeywords.impressions.monthly/list |
| Performance API change log | https://developers.google.com/my-business/content/performance/change-log |
| Reviews `list` (v4) | https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list |
| Work with review data | https://developers.google.com/my-business/content/review-data |
| Local Posts (v4) | https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts |
| Media (v4) | https://developers.google.com/my-business/reference/rest/v4/accounts.locations.media |

All facts below: **ACCESS DATE 2026-08-25** unless noted.

---

## 1. OAuth

| Field | Value |
|---|---|
| **API** | OAuth 2.0 for Business Profile APIs |
| **ENDPOINT** | Authorization / token exchange per Google Identity (web server / offline). Sample Account Management call after token: `GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts` |
| **CURRENT STATUS** | Required for every Business Profile API request |
| **AUTH SCOPE** | **Required for new apps:** `https://www.googleapis.com/auth/business.manage`. Also documented: `https://www.googleapis.com/auth/plus.business.manage` — **deprecated**; kept for backward compatibility with existing implementations |
| **READ/WRITE** | Scope allows access **and** modification of location data (reviews replies, posts, menu updates, etc. are explicitly called out as offline actions). App must still choose which methods to call |
| **FIELDS AVAILABLE** | Access token + (for offline) refresh token after consent |
| **LIMITATIONS** | Project must be configured; consent screen + OAuth client; user can revoke at Account Settings |
| **DEPRECATED ALTERNATIVE IF RELEVANT** | `plus.business.manage` — do not use for new apps |
| **JS SOLUTIONS DECISION** | Request **only** `business.manage`. Store refresh tokens server-side. **Enforce READ-ONLY** method allowlist in app despite write-capable scope |
| **PROVENANCE** | `OFFICIAL_GOOGLE` + `JS_SOLUTIONS_OPERATING_RULE` |

**Source:** https://developers.google.com/my-business/content/implement-oauth

---

## 2. Basic setup / APIs to enable

| Field | Value |
|---|---|
| **API** | Business Profile APIs (project enablement) |
| **ENDPOINT** | Google Cloud API Library (enable per service) |
| **CURRENT STATUS** | Project must complete Prerequisites and be **approved** for Business Profile APIs access before use |
| **AUTH SCOPE** | N/A (enablement); runtime calls use `business.manage` |
| **READ/WRITE** | N/A |
| **FIELDS AVAILABLE** | N/A |
| **LIMITATIONS** | No sandbox; use `validateOnly` where supported for write validation without mutation. Workspace orgs with GBP turned off get `403 PERMISSION DENIED`. **Performance API:** if quota is **0** after enable, **request GBP API access** (stated on Performance API overview) |
| **DEPRECATED ALTERNATIVE IF RELEVANT** | N/A |
| **JS SOLUTIONS DECISION** | Enable Account Management + Business Information + Performance for V1 READ sync; also enable **Google My Business API** (v4) if Reviews (and later Posts/Media) are used. Lodging / Place Actions / Notifications / Verifications / Q&A are not required for V1 Local Growth sync |
| **PROVENANCE** | `OFFICIAL_GOOGLE` + `JS_SOLUTIONS_OPERATING_RULE` |

Official basic-setup list of **eight** APIs to enable in API Console:

1. Google My Business API  
2. My Business Account Management API  
3. My Business Lodging API  
4. My Business Place Actions API  
5. My Business Notifications API  
6. My Business Verifications API  
7. My Business Business Information API  
8. My Business Q&A API  

**Also required for Performance sync (separate service):** Business Profile Performance API — `businessprofileperformance.googleapis.com` (not named in the eight-item list; documented on the Performance API reference with the quota-0 → request access note).

**v4 still used for:** reviews, localPosts, media (Google My Business API / `mybusiness.googleapis.com`).

**Source:** https://developers.google.com/my-business/content/basic-setup · https://developers.google.com/my-business/reference/performance/rest

---

## 3. Account Management API

| Field | Value |
|---|---|
| **API** | My Business Account Management API |
| **ENDPOINT** | `GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts` |
| **CURRENT STATUS** | Current (v1) |
| **AUTH SCOPE** | `https://www.googleapis.com/auth/business.manage` |
| **READ/WRITE** | **READ** (`list`) |
| **FIELDS AVAILABLE** | Response: `accounts[]` (`Account` objects); `nextPageToken`. Personal account is first unless filtered. Query params: `parentAccount`, `pageSize` (default/max **20**), `pageToken`, `filter` (only `type` supported, e.g. `type=USER_GROUP`) |
| **LIMITATIONS** | Paginated; max page size 20 |
| **DEPRECATED ALTERNATIVE IF RELEVANT** | N/A |
| **JS SOLUTIONS DECISION** | First step of READ sync: list accounts for the connected Google user, then list locations per account |
| **PROVENANCE** | `OFFICIAL_GOOGLE` |

**Source:** https://developers.google.com/my-business/reference/accountmanagement/rest/v1/accounts/list

---

## 4. Business Information API (locations)

| Field | Value |
|---|---|
| **API** | My Business Business Information API |
| **ENDPOINT** | List: `GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations?readMask=...` · Wildcard list (incl. indirect via group): `GET .../v1/accounts/-/locations?readMask=...` · Get: `GET https://mybusinessbusinessinformation.googleapis.com/v1/locations/{locationId}?readMask=...` · Google Maps version: `GET .../locations/{locationId}:googleUpdated?readMask=...` |
| **CURRENT STATUS** | Current (v1) |
| **AUTH SCOPE** | `https://www.googleapis.com/auth/business.manage` (same family as other GBP APIs) |
| **READ/WRITE** | API supports create / patch / delete; **V1 app uses READ only** (`list` / `get`) |
| **FIELDS AVAILABLE (Location — V1 readMask focus)** | `title`, `phoneNumbers`, `categories`, `storefrontAddress`, `websiteUri`, `regularHours`, `specialHours`, `serviceArea`, `profile`, `serviceItems`, `metadata` (also present on resource: `name`, `languageCode`, `storeCode`, `labels`, `latlng`, `openInfo`, `relationshipData`, `moreHours`, etc.) |
| **LIMITATIONS** | `list` / `get` **require `readMask`**. `storefrontAddress` must **not** be set for `CUSTOMER_LOCATION_ONLY`; if set, value is **discarded**. `serviceArea.regionCode` is **required** for `CUSTOMER_LOCATION_ONLY`. `specialHours` cannot be set without `regularHours`. `profile` required for all categories except lodging |
| **DEPRECATED ALTERNATIVE IF RELEVANT** | Older v4 location naming (`locationName` → `title`, `websiteUrl` → `websiteUri`, `address` → `storefrontAddress`) — use Business Information v1 |
| **JS SOLUTIONS DECISION** | Sync NAP/hours/categories/website/`serviceArea`/`profile`/`serviceItems`/`metadata` into Local Growth. Prefer profile + performance first. No location create/patch/delete in V1 |
| **PROVENANCE** | `OFFICIAL_GOOGLE` + `JS_SOLUTIONS_OPERATING_RULE` |

**Service-area note (`OFFICIAL_GOOGLE`):** For `businessType` `CUSTOMER_LOCATION_ONLY`, do not set `storefrontAddress` (discarded if provided). When updating from `CUSTOMER_AND_BUSINESS_LOCATION` to `CUSTOMER_LOCATION_ONLY`, update must include field mask `storefrontAddress` set empty.

**Sources:** https://developers.google.com/my-business/content/location-data · https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations · https://developers.google.com/my-business/content/businessinformation/change-log

---

## 5. Business Profile Performance API

| Field | Value |
|---|---|
| **API** | Business Profile Performance API |
| **ENDPOINT** | Service: `https://businessprofileperformance.googleapis.com` · Multi metrics: `GET /v1/{location=locations/*}:fetchMultiDailyMetricsTimeSeries` · Single metric: `GET /v1/{name=locations/*}:getDailyMetricsTimeSeries` · Keywords: `GET /v1/{parent=locations/*}/searchkeywords/impressions/monthly` |
| **CURRENT STATUS** | Current (v1). Replaces v4 `accounts.locations.reportInsights` |
| **AUTH SCOPE** | `https://www.googleapis.com/auth/business.manage` (change log: OAuth scope remains the same) |
| **READ/WRITE** | **READ only** |
| **FIELDS AVAILABLE — `DailyMetric` enums** | `DAILY_METRIC_UNKNOWN`; `BUSINESS_IMPRESSIONS_DESKTOP_MAPS`; `BUSINESS_IMPRESSIONS_DESKTOP_SEARCH`; `BUSINESS_IMPRESSIONS_MOBILE_MAPS`; `BUSINESS_IMPRESSIONS_MOBILE_SEARCH`; `BUSINESS_CONVERSATIONS`; `BUSINESS_DIRECTION_REQUESTS`; `CALL_CLICKS`; `WEBSITE_CLICKS`; `BUSINESS_BOOKINGS`; `BUSINESS_FOOD_ORDERS`; `BUSINESS_FOOD_MENU_CLICKS` |
| **FIELDS AVAILABLE — keywords** | `searchKeywordsCounts[]` with `searchKeyword` + `insightsValue` (`value` **or** `threshold`); monthly range; pagination (`pageSize` default/max **100**) |
| **LIMITATIONS** | Quota **0** after enable → **request GBP API access**. Impression metrics: multiple impressions by a unique user in one day count as **one**. Food menu clicks: multiple clicks by unique user in one day count as **1**. Keyword impressions may return a **threshold** instead of exact value. Batch multi-location via old `locationNames` body was **removed** |
| **DEPRECATED ALTERNATIVE IF RELEVANT** | `POST .../v4/{name=accounts/*}/locations:reportInsights` — Support ended **2022-11-21**, Discontinuation **2023-03-30** → use `fetchMultiDailyMetricsTimeSeries` |
| **JS SOLUTIONS DECISION** | Primary automated Insights path for Local Growth. Prefer `fetchMultiDailyMetricsTimeSeries` for core action/impression enums; use monthly keyword list for search-term aggregates. No live calls on dashboard page load |
| **PROVENANCE** | `OFFICIAL_GOOGLE` + `JS_SOLUTIONS_OPERATING_RULE` |

**Sources:** https://developers.google.com/my-business/reference/performance/rest · https://developers.google.com/my-business/reference/performance/rest/v1/DailyMetric · https://developers.google.com/my-business/content/performance/change-log · https://developers.google.com/my-business/content/sunset-dates

---

## 6. Reviews (Google My Business API v4)

| Field | Value |
|---|---|
| **API** | Google My Business API (v4) — Reviews |
| **ENDPOINT** | `GET https://mybusiness.googleapis.com/v4/{parent=accounts/*/locations/*}/reviews` |
| **CURRENT STATUS** | Still on v4 (`mybusiness.googleapis.com`); list is valid only for **verified** locations |
| **AUTH SCOPE** | `business.manage` or deprecated `plus.business.manage` |
| **READ/WRITE** | List/get are READ; reply/updateReply/deleteReply are WRITE — **not used in V1** |
| **FIELDS AVAILABLE** | Response includes `reviews[]`, **`averageRating`** (1–5), **`totalReviewCount`**, `nextPageToken`. Individual `Review` objects can include comment, reviewer, star rating, reply, etc. (see review-data guide / client fields) |
| **LIMITATIONS** | Max `pageSize` **50**. Verified location required |
| **DEPRECATED ALTERNATIVE IF RELEVANT** | N/A for list itself; do not use `plus.business.manage` for new OAuth |
| **JS SOLUTIONS DECISION** | **V1: persist aggregates only** (`averageRating`, `totalReviewCount`). **Do not persist** reviewer PII or review text |
| **PROVENANCE** | `OFFICIAL_GOOGLE` + `JS_SOLUTIONS_OPERATING_RULE` |

**Sources:** https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list · https://developers.google.com/my-business/content/review-data

---

## 7. Local Posts (v4)

| Field | Value |
|---|---|
| **API** | Google My Business API (v4) — Local Posts |
| **ENDPOINT** | Resource under `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/localPosts` — methods: `create`, `delete`, `get`, `list`, `patch` |
| **CURRENT STATUS** | CRUD **still exists** on v4 |
| **AUTH SCOPE** | `business.manage` / deprecated `plus.business.manage` |
| **READ/WRITE** | Full CRUD available on API; insights reporting **gone** |
| **FIELDS AVAILABLE** | `LocalPost` metadata (summary, call to action, event, offer, media, state, topic type, etc.) |
| **LIMITATIONS** | **`accounts.locations.localPosts.reportInsights`:** Support ended **2022-11-21**, Discontinuation **2023-02-20**, **Replacement: None** |
| **DEPRECATED ALTERNATIVE IF RELEVANT** | Post insights report — **sunset; no Performance API equivalent** |
| **JS SOLUTIONS DECISION** | **Optional / deferred** for posts metadata. Prioritize profile + Performance. No post publish in V1 |
| **PROVENANCE** | `OFFICIAL_GOOGLE` + `JS_SOLUTIONS_OPERATING_RULE` |

**Sources:** https://developers.google.com/my-business/reference/rest/v4/accounts.locations.localPosts · https://developers.google.com/my-business/content/sunset-dates

---

## 8. Media (v4)

| Field | Value |
|---|---|
| **API** | Google My Business API (v4) — Media |
| **ENDPOINT** | `https://mybusiness.googleapis.com/v4/.../media` — methods: `create`, `delete`, `get`, `list`, `patch`, `startUpload` |
| **CURRENT STATUS** | Exists on v4 |
| **AUTH SCOPE** | `business.manage` / deprecated `plus.business.manage` |
| **READ/WRITE** | Full media management available; **V1 READ optional** |
| **FIELDS AVAILABLE** | `MediaItem`: `name`, `mediaFormat`, `locationAssociation`, `googleUrl`, `thumbnailUrl`, `createTime`, `dimensions`, `insights.viewCount`, `attribution`, `description`, etc. Categories include COVER, PROFILE, LOGO, EXTERIOR, … |
| **LIMITATIONS** | Upload size/format rules; attribution must be displayed as provided for customer media; `googleUrl` is not static |
| **DEPRECATED ALTERNATIVE IF RELEVANT** | N/A |
| **JS SOLUTIONS DECISION** | **V1 optional: presence only** (e.g. counts / categories). **No photo/binary storage** in JS Solutions systems |
| **PROVENANCE** | `OFFICIAL_GOOGLE` + `JS_SOLUTIONS_OPERATING_RULE` |

**Source:** https://developers.google.com/my-business/reference/rest/v4/accounts.locations.media

---

## 9. Deprecated / sunset (relevant to Sprint 12.1)

| Deprecated resource | Type | Replacement | Support ended | Discontinuation |
|---|---|---|---|---|
| `accounts.locations.reportInsights` (GMB v4.9) | Method | `locations.fetchMultiDailyMetricsTimeSeries` (Performance API v1) | 2022-11-21 | **2023-03-30** |
| `accounts.locations.localPosts.reportInsights` (GMB v4.9) | Method | **None** | 2022-11-21 | **2023-02-20** |
| Driving direction metrics objects on reportInsights | Object | **None** | 2022-11-21 | 2023-03-30 |
| Several v4.9 reportInsights metrics (`ALL`, `QUERIES_*`, mapped view/action metrics) | Metric | Mapped to Performance `DailyMetric` where documented; some **None** | 2022-11-21 | 2023-03-30 |
| `plus.business.manage` OAuth scope | Scope | `business.manage` | Deprecated (backward compat only) | N/A (still listed for some v4 methods) |

**Sources:** https://developers.google.com/my-business/content/sunset-dates · https://developers.google.com/my-business/content/implement-oauth · https://developers.google.com/my-business/content/performance/change-log

---

## 10. Capability matrix (quick reference)

| API | ENDPOINT (representative) | CURRENT STATUS | AUTH SCOPE | READ/WRITE | FIELDS / DATA | LIMITATIONS | DEPRECATED ALTERNATIVE | JS SOLUTIONS DECISION |
|---|---|---|---|---|---|---|---|---|
| OAuth | Google OAuth 2.0 | Required | `business.manage` (required); `plus.business.manage` deprecated | Token grants manage access | Tokens | Consent + project approval | `plus.business.manage` | New apps: `business.manage` only; app READ-ONLY |
| Account Management | `GET .../v1/accounts` | Current | `business.manage` | READ | Accounts list | pageSize ≤ 20 | — | Sync entrypoint |
| Business Information | `GET .../v1/accounts/{id}/locations` / `GET .../v1/locations/{id}` | Current | `business.manage` | API R/W; app READ | title, phones, categories, address, website, hours, serviceArea, profile, serviceItems, metadata | `readMask` required; SAB address rules | Legacy v4 location fields | Profile sync; no writes |
| Performance | `GET ...:fetchMultiDailyMetricsTimeSeries`; keywords monthly list | Current | `business.manage` | READ | DailyMetric enums + keyword impressions | Quota 0 → request access | v4 `reportInsights` (sunset 2023-03-30) | Primary metrics sync; no UI live calls |
| Reviews v4 | `GET .../v4/.../reviews` | Current on v4 | `business.manage` | List READ; reply WRITE | averageRating, totalReviewCount (+ full reviews in payload) | Verified only; pageSize ≤ 50 | — | Aggregates only; no PII/text persist |
| Local Posts v4 | CRUD under `.../localPosts` | CRUD current; insights gone | `business.manage` | R/W | Post metadata | Insights sunset **2023-02-20**, no replacement | `localPosts.reportInsights` | Deferred / optional metadata |
| Media v4 | `.../media` list/get/… | Current | `business.manage` | R/W | MediaItem metadata / URLs | No local binary store in V1 | — | Optional presence only |

---

## 11. JS Solutions operating rules (`GBP_READ_INTEGRATION_VERSION = 1`)

| Rule | Decision |
|---|---|
| Integration intent | **READ-ONLY** sync into Local Growth |
| OAuth scope requested | `https://www.googleapis.com/auth/business.manage` only |
| Write / publish | **Deferred** (even though scope allows writes) |
| App enforcement | Method allowlist: GET/list/getDaily*/fetchMulti*/accounts.list — **reject** create/patch/delete/reply/upload in application layer |
| Dashboard | **No** GBP API calls on dashboard page load; use stored sync snapshots |
| Reviews persistence | Aggregates only |
| Local Posts | Optional/deferred; profile + Performance first |
| Media | Optional presence metadata; **no** photo storage |
| Places API | **Separate** product / out of scope for this integration version |

**Provenance:** `JS_SOLUTIONS_OPERATING_RULE`

---

## 12. Google Cloud operator setup checklist

Use this when provisioning a Cloud project for GBP READ sync.

### A. Project access

- [ ] Create or select a Google Cloud project  
- [ ] Complete Business Profile APIs **Prerequisites** and obtain **project approval** for GBP API access (basic-setup requirement)  
- [ ] If Performance API shows **quota 0** after enable → **request GBP API access**  

### B. Enable APIs (API Library)

Minimum for Sprint 12.1 READ sync:

- [ ] **My Business Account Management API**  
- [ ] **My Business Business Information API**  
- [ ] **Business Profile Performance API**  
- [ ] **Google My Business API** (v4 — reviews; later posts/media)  

Optional / not required for V1 Local Growth sync (listed in official eight): Lodging, Place Actions, Notifications, Verifications, Q&A — enable only if a later sprint needs them.

### C. OAuth consent + credentials

- [ ] Configure OAuth consent screen (app name, logo, ToS, privacy policy links as applicable)  
- [ ] Create **OAuth client ID** → Application type **Web application**  
- [ ] Authorized redirect URIs:  
  - **Production:** `{SITE_URL}/api/gbp/oauth/callback`  
  - **Local:** `http://localhost:3000/api/gbp/oauth/callback`  
- [ ] Scope to request in app: `https://www.googleapis.com/auth/business.manage`  
- [ ] Prefer **offline** access (refresh token) so sync jobs can run without interactive session  
- [ ] Store `client_secret` and refresh tokens **server-side only** (never in browser)  

### D. Smoke test (OAuth Playground or first sync job)

Official Playground check from basic-setup:

- [ ] Add Playground redirect if experimenting: `https://developers.google.com/oauthplayground`  
- [ ] Authorize scope `https://www.googleapis.com/auth/business.manage`  
- [ ] `GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts` → expect `200 OK`  

### E. Workspace note

- [ ] If using Google Workspace: confirm Google Business Profile is enabled for the org account (else `403 PERMISSION DENIED`)  

### F. Product guardrails (JS Solutions)

- [ ] Confirm app method allowlist is READ-ONLY  
- [ ] Confirm sync path is job/offline — not report page render  
- [ ] Confirm review text / reviewer PII are not written to DB  
- [ ] Confirm Places API credentials are **not** mixed into this OAuth client / sync  

---

## 13. Suggested V1 sync order

1. OAuth (offline) → store refresh token  
2. `accounts.list`  
3. `accounts.locations.list` with explicit `readMask` (profile fields in §4)  
4. `locations.fetchMultiDailyMetricsTimeSeries` for applicable `DailyMetric`s  
5. `searchkeywords.impressions.monthly.list` (monthly)  
6. Optional: `reviews.list` → store **only** `averageRating` + `totalReviewCount`  
7. Deferred: localPosts / media presence  

---

## Document control

| Item | Value |
|---|---|
| Filename | `docs/research/google-business-profile-api-2026.md` |
| ACCESS DATE | 2026-08-25 |
| GBP_READ_INTEGRATION_VERSION | 1 |
| Speculative SEO / ranking content | **None** — API capability research only |
