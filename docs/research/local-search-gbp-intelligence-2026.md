# Local Search / Google Business Profile Intelligence Research — 2026

**Research date / ACCESS DATE:** 2026-08-24  
**Property / operator:** JS Solutions (js-growth)  
**Sprint:** Growth Sprint 12 — Local Search / GBP Intelligence V1  
**LOCAL_GROWTH_VERSION:** `1`  
**Purpose:** Ground Local Search / GBP Intelligence V1 in current Google Business Profile Help, Maps UGC policies, Search Central structured-data guidance, and (for future) Business Profile Performance API references. Separate official facts from first-party conventions, inferences, and hypotheses.

**Provenance labels used throughout:**

| Label | Meaning |
|---|---|
| `OFFICIAL_GOOGLE` | Stated in Google Help / Search Central / Google for Developers docs as of ACCESS DATE |
| `FIRST_PARTY` | Observed in JS Solutions codebase, docs, or baselines |
| `MANUAL` | Operator-captured UI/export observation (not automated API) |
| `INFERENCE` | Reasonable operational conclusion from official + first-party facts; not a Google claim |
| `HYPOTHESIS` | Testable belief; not Google-documented as a ranking factor |
| `JS_SOLUTIONS_OPERATING_RULE` | Internal process decision for V1 |

Prefer `OFFICIAL_GOOGLE` when conflicted. Do **not** invent Google ranking or product facts. When uncertain, mark `HYPOTHESIS` or `INFERENCE`.

---

## Executive summary

**LOCAL_GROWTH_VERSION = 1** intent: establish a **manual, measurement-honest** local/GBP operating layer for JS Solutions — profile hygiene, review policy compliance, lightweight performance snapshots, canonical GBP UTMs, and clear separation from Search Console — **without** GBP Performance API, Places API, ranking guarantees, doorway local pages, or cluttering conversion pages with website→GBP experiments.

Google officially acknowledges three primary local ranking factors: **relevance**, **distance**, and **prominence** (intro text on the same page also says “popularity”). Profile completeness and accurate NAP/hours/category improve match quality; reviews and web mentions contribute to prominence. Performance Insights expose Views (Search/Maps), Searches, Directions, Calls, Website clicks, Messages, Bookings, Products, Menus, Offers — **only metrics that apply appear**; Searches update monthly. Structured data (`LocalBusiness`) and GBP are **complementary**, not substitutes. Search Console measures **website** Search performance, not Maps/GBP profile actions.

V1 is **manual capture only** (`FUTURE_GBP_API = 0`, `FUTURE_PLACES_API = 0`). Blank metrics = `NOT_CAPTURED`; entered `0` = observed zero. Client language stays policy-safe and non-guaranteeing.

---

## 1. Local ranking factors Google acknowledges

| Field | Value |
|---|---|
| **SOURCE** | Google Business Profile Help — Tips to improve your local ranking on Google |
| **URL** | https://support.google.com/business/answer/7091 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Local results are mainly based on **relevance**, **distance**, and **popularity** (page intro). The same article’s factor sections are titled **Relevance**, **Distance**, and **Prominence**. **Relevance** = how well a Business Profile matches the search. **Distance** = how far the business is from the searcher (or inferred location). **Prominence** = how well-known a business is; based on info such as how many websites link to the business and how many reviews it has; more reviews and positive ratings can help local ranking. There is no way to request or pay for a better local ranking; algorithm details are kept confidential. Completeness/accuracy of business info, verification, photos/videos, and review replies are recommended operational practices on the same page (replies “can help your business stand out” — not stated as an independent ranking weight). |
| **IMPLICATION** | V1 optimizes for accurate, complete, policy-compliant profiles and honest review solicitation — not rank-buying, keyword stuffing, or unverified “ranking hacks.” |
| **JS SOLUTIONS DECISION** | Document R/D/P (prominence) as the official triad. Treat photo cadence, reply cadence, and post volume as **hypotheses** (see §12), not guaranteed levers. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` |

Related official hygiene on the same page (not separate ranking weights): verify the business; keep info up to date (address if customers visit, hours, category, attributes); respond to reviews; add photos & videos; retail in-store products where eligible.

---

## 2. GBP performance metrics (Insights UI)

| Field | Value |
|---|---|
| **SOURCE** | Google Business Profile Help — Understand your Business Profile performance & insights |
| **URL** | https://support.google.com/business/answer/9918094 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Performance data requires a **verified** Business Profile and the Google Account associated with the profile. Only metrics that apply to the business appear; not all metrics are available to every profile. Data includes views, searches, and actions from organic results and Google Ads. Documented metrics include: **Interactions** (summary); **Searches** (terms used to find the business — updated at the start of each month; may take up to 5 days to appear; queries appear when the profile shows for a search; you cannot directly manage these queries); **Views** (people who viewed the profile on Search and Maps — unique visitors; limited multi-device counting; once per person per day; counts profile views, not overall Google business views); **Directions**; **Calls** (call-button clicks; needs phone number); **Website clicks**; **Messages** (distinct conversations); **Bookings** (via booking provider); **Booking clicks** (hotels); **Products** (in-store product views at the profile location, not online-only); **Menus**; **Offers**. |
| **IMPLICATION** | Manual V1 snapshots must allow missing columns (`NOT_CAPTURED`) when a metric does not apply or was not recorded. Do not expect daily Searches refresh. |
| **JS SOLUTIONS DECISION** | Capture applicable core actions for JS Solutions when present: Views (Search/Maps if broken out in UI), Searches (monthly), Directions, Calls, Website clicks, Messages. Treat Bookings/Products/Menus/Offers as N/A unless the profile uses those features. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` |

---

## 3. Business Profile Performance API — `DailyMetric` (`FUTURE_GBP_API`)

| Field | Value |
|---|---|
| **SOURCE** | Google Business Profile APIs — DailyMetric / Performance API |
| **URL** | https://developers.google.com/my-business/reference/performance/rest/v1/DailyMetric |
| **URL** | https://developers.google.com/my-business/reference/performance/rest |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | The Performance API exposes daily time-series metrics for locations (service: `businessprofileperformance.googleapis.com`). Documented `DailyMetric` enums include: `DAILY_METRIC_UNKNOWN`; `BUSINESS_IMPRESSIONS_DESKTOP_MAPS`; `BUSINESS_IMPRESSIONS_DESKTOP_SEARCH`; `BUSINESS_IMPRESSIONS_MOBILE_MAPS`; `BUSINESS_IMPRESSIONS_MOBILE_SEARCH`; `BUSINESS_CONVERSATIONS`; `BUSINESS_DIRECTION_REQUESTS`; `CALL_CLICKS`; `WEBSITE_CLICKS`; `BUSINESS_BOOKINGS`; `BUSINESS_FOOD_ORDERS`; `BUSINESS_FOOD_MENU_CLICKS`. Impression enums count multiple impressions by a unique user within a single day as one impression. Access may require GBP API quota/access (quota 0 after enable → request access). |
| **IMPLICATION** | Useful for automated dashboards later; not required to operate V1 manually from Insights UI/exports. |
| **JS SOLUTIONS DECISION** | **`FUTURE_GBP_API = 0` for V1.** No Performance API client, OAuth, or automated pull in Sprint 12. Map future enum names to UI metrics only in docs. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` (API surface) + `JS_SOLUTIONS_OPERATING_RULE` (defer = 0) |

---

## 4. Profile completeness / accurate business information

| Field | Value |
|---|---|
| **SOURCE** | Google Business Profile Help — Tips to improve your local ranking on Google |
| **URL** | https://support.google.com/business/answer/7091 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Businesses with complete and accurate info are more likely to show up in local search results. Incomplete/inaccurate info may prevent showing for relevant local searches. Provide full address if customers can visit; hours (including special hours); business category; attributes (e.g. parking, Wi-Fi). Verify ownership. |
| **IMPLICATION** | First V1 workstream is NAP/hours/category/attributes accuracy and verification — before content experiments. |
| **JS SOLUTIONS DECISION** | Maintain a checklist: verified · primary category correct · hours current · phone · website URI (UTM per §10) · service area vs storefront correct (§7) · description truthful. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` |

| Field | Value |
|---|---|
| **SOURCE** | Google Business Profile Help — Guidelines for representing your business on Google |
| **URL** | https://support.google.com/business/answer/3038177 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Use a precise, accurate address and/or service area. P.O. boxes or remote mailboxes are not acceptable. Representation must match how the business actually operates (storefront vs service-area rules — see §7). |
| **IMPLICATION** | Misrepresenting location type risks suspension / policy issues and bad distance matching. |
| **JS SOLUTIONS DECISION** | Align GBP representation with real customer-visit behavior; never invent a storefront for ranking. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` |

---

## 5. Reviews — honest solicitation vs prohibited practices

| Field | Value |
|---|---|
| **SOURCE** | Google Maps User Generated Content Policy — Prohibited & restricted content (Fake & Misleading / Rating Manipulation) |
| **URL** | https://support.google.com/contributionpolicy/answer/7400114 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Reviews/ratings must reflect a genuine, unbiased experience. Prohibited: fake engagement; paid reviews; multi-account posting; incentives (payment, discounts, free goods/services) for posting, revising, or removing negative reviews; competitor-undermining reviews; selectively soliciting only positive reviews or discouraging/prohibiting negative reviews; pressuring on-premises ratings or requesting specific review content. Allowed: solicit/encourage genuine experience content **without** incentives or attempts to influence rating/content. |
| **IMPLICATION** | “Review gating” (filter for 5-star only / suppress negatives) and incentivized review campaigns are policy violations — not growth tactics. |
| **JS SOLUTIONS DECISION** | Ask customers for honest Google reviews via shareable link/QR; never gate, never incentivize, never script star ratings. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` |

| Field | Value |
|---|---|
| **SOURCE** | Google Business Profile Help — Tips to get more reviews |
| **URL** | https://support.google.com/business/answer/3474122 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Remind customers to leave reviews (Google link / QR). Reply to reviews. Value all reviews; honest/balanced mixes often feel more trustworthy. Incentives for posting/changing/removing reviews are fake & misleading and prohibited. Reply guidance: professional, short, conversational (not promotional deals in replies); constructive negative-review replies; flag policy-violating reviews. |
| **IMPLICATION** | Replies are customer-experience and trust signals Google encourages; they are **not** documented here as a discrete ranking weight (see §12 hypothesis). |
| **JS SOLUTIONS DECISION** | Reply thoughtfully when useful; never offer deals in exchange for review changes. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` |

---

## 6. Posts / updates — supported formats

| Field | Value |
|---|---|
| **SOURCE** | Google Business Profile Help — Create & manage posts on your Business Profile |
| **URL** | https://support.google.com/business/answer/7342169 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Creatable post types documented: **Update**, **Offer**, **Event**. Updates: description, photo, video, action button+link. Offers: title, dates/time required; auto “View Offer”; optional description, photo, video, coupon, link, terms. Events: title, start/end dates and times; optional description, photo, video, action button. Posts may show text, photos, or videos. Posts older than 6 months are archived unless a date range is set. Phone numbers in post description may get rejected. |
| **IMPLICATION** | Media (photo/video) attaches to post types; “Photo” is **not** listed as a separate post type in this Help article as of ACCESS DATE. Profile photos/videos are a separate media management surface. |
| **JS SOLUTIONS DECISION** | V1 post vocabulary = Update / Offer / Event only. Do not plan a distinct “Photo post” type unless Google docs change. Prefer Updates for educational/local proof; use Offer/Event only when factually true. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` |

**Clarification (not a post type):** Profile logo/cover/business photos are managed separately (e.g. https://support.google.com/business/answer/6103862) — `OFFICIAL_GOOGLE` for photo management; do not conflate with post types.

If industry blogs still list a standalone “Photo” post type: treat as **outdated / unverified** unless Google Help confirms — default `HYPOTHESIS` / ignore for V1 planning.

---

## 7. Service-area businesses vs storefront address

| Field | Value |
|---|---|
| **SOURCE** | Google Business Profile Help — Manage your service areas for service-area & hybrid businesses |
| **URL** | https://support.google.com/business/answer/9157481 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | **Service-area business (SAB):** visits/delivers to customers; does **not** serve customers at the business address — hide/remove address; one profile for the whole served area. **Hybrid:** serves at address **and** visits/delivers — may show storefront address, hours, and service area; needs permanent on-site signage eligibility for storefront. If you don’t serve at the address, remove address and enter service area only. |
| **IMPLICATION** | Wrong model breaks guidelines and confuses distance/relevance. |
| **JS SOLUTIONS DECISION** | Classify JS Solutions (and client profiles) correctly before optimizing. Prefer honest SAB/hybrid over fake storefronts. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` |

| Field | Value |
|---|---|
| **SOURCE** | Google Business Profile Help — Guidelines for representing your business on Google |
| **URL** | https://support.google.com/business/answer/3038177 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | SABs should have one profile for the central office/location with a designated service area; hide address from customers when SAB. Virtual offices not staffed during business hours are not acceptable. Hybrid examples (e.g. shop + roadside) may show address + service area if staffed and able to receive customers during stated hours. Overall service area generally shouldn’t extend farther than about 2 hours driving time (larger may be appropriate for some businesses). |
| **IMPLICATION** | Multi-city “coverage” via duplicate profiles or inflated service areas risks policy issues. |
| **JS SOLUTIONS DECISION** | One honest service footprint; no duplicate metro profiles. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` |

---

## 8. `LocalBusiness` structured data vs GBP

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — Local business (`LocalBusiness`) structured data |
| **URL** | https://developers.google.com/search/docs/appearance/structured-data/local-business |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | LocalBusiness structured data helps tell Google about hours, departments, reviews (when the site captures reviews about other businesses), etc., and may support knowledge-panel / local-related Search presentations. It is website markup guidance in Search Central — distinct from Business Profile owner tools. |
| **IMPLICATION** | Markup does not replace verifying/managing a Google Business Profile. Inconsistent NAP/hours/URL between site schema and GBP creates trust/quality risk. |
| **JS SOLUTIONS DECISION** | Treat schema and GBP as **complementary**. Keep factual consistency (name, address/service area story, phone, hours, website). Schema ≠ Maps ranking substitute. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` (schema purpose) + `INFERENCE` (complementary / consistency — not phrased as “substitute” on the LocalBusiness page itself) |

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — Spam policies (doorway pages) — Sprint 5 carry-forward |
| **URL** | https://developers.google.com/search/docs/essentials/spam-policies |
| **ACCESS DATE** | 2026-08-24 (reconfirmed for this doc) |
| **FACT** | Doorway pages and other manipulative patterns remain prohibited under spam policies. |
| **IMPLICATION** | Thin city landing pages “for local SEO” can violate Search spam policy even if GBP is healthy. |
| **JS SOLUTIONS DECISION** | See §13 Magnolia page stance. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` |

---

## 9. Search Console ≠ Maps / GBP performance

| Field | Value |
|---|---|
| **SOURCE** | Search Console Help — Performance report (Search results) |
| **URL** | https://support.google.com/webmasters/answer/7576553 |
| **URL** | https://support.google.com/webmasters/answer/17011364 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Search Console Performance reports website/property Search performance (impressions, clicks, CTR, position) for Search results properties — not Business Profile Insights metrics (calls, directions, profile views on Maps). |
| **IMPLICATION** | GSC and GBP Insights answer different questions; never blend totals. |
| **JS SOLUTIONS DECISION** | Separate panels/snapshots: `SEARCH_CONSOLE` vs `GBP` / local Insights. Google organic referrer ≠ GBP channel (requires GBP UTMs — §10). |
| **PROVENANCE** | `OFFICIAL_GOOGLE` (GSC scope) + `OFFICIAL_GOOGLE` (GBP Insights scope via answer/9918094) + `FIRST_PARTY` (attribution rules) |

| Field | Value |
|---|---|
| **SOURCE** | Google Business Profile Help — Understand your Business Profile performance & insights |
| **URL** | https://support.google.com/business/answer/9918094 |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | GBP performance is accessed from Business Profile / Maps Business tools for verified profiles; metrics are profile interactions on Search and Maps. |
| **IMPLICATION** | Operators must open GBP Insights (or future API), not GSC, for local profile actions. |
| **JS SOLUTIONS DECISION** | V1 = manual Insights / download when needed. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` |

---

## 10. UTM for GBP (canonical)

| Field | Value |
|---|---|
| **SOURCE** | JS Solutions `utm-standard-v1` / `docs/growth/utm-conventions.md` + `GBP_WEBSITE_UTM` / `GBP_POST_UTM` |
| **URL** | Internal: `docs/growth/utm-conventions.md`; code: `src/lib/growth/acquisition-capture.ts`, `src/lib/growth/utm.ts` |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Canonical GBP website link: `utm_source=google_business_profile&utm_medium=organic_local&utm_campaign=gbp_profile&utm_content=website`. Post content values: `post_<slug>` (via `buildGbpPostContent`). Do not classify Google organic referrer as GBP. Historical GBP remains `NOT_CAPTURED` until tagged evidence exists. |
| **IMPLICATION** | Website clicks in GBP Insights ≠ first-party attributed GBP conversions unless the website URL uses these UTMs. |
| **JS SOLUTIONS DECISION** | **Canonical locked:** `source=google_business_profile` · `medium=organic_local` · `campaign=gbp_profile` · `content=website` \| `post_<slug>`. Use `/reports/growth/utm-builder` presets. No competing GBP UTM schemes. |
| **PROVENANCE** | `FIRST_PARTY` + `JS_SOLUTIONS_OPERATING_RULE` |

Supporting official context (UTM mechanics generally): Google Analytics Help URL builders — https://support.google.com/analytics/answer/10917952 (`OFFICIAL_GOOGLE` for campaign-parameter practice; values above are JS Solutions taxonomy).

---

## 11. Operating cadence

| Field | Value |
|---|---|
| **SOURCE** | JS Solutions Local Growth V1 process |
| **URL** | This research doc / Sprint 12 implementation notes |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | *(Internal rule — not a Google requirement.)* |
| **IMPLICATION** | Sustains measurement without API automation. |
| **JS SOLUTIONS DECISION** | **Weekly:** lightweight GBP Insights snapshot (applicable views/actions + review/reply triage + profile accuracy spot-check). **Monthly:** deeper review (Searches metric when available, category/attributes audit, post/review quality, UTM evidence check). **Posts:** experimental cadence of **1–2 posts/week** (Updates preferred); pause if quality drops. |
| **PROVENANCE** | `JS_SOLUTIONS_OPERATING_RULE` |

---

## 12. Ranking hypotheses (explicitly not Google claims)

These are **not** documented by Google as independent ranking weights on answer/7091. Prominence mentions reviews/links; replies/photos/posts are recommended for customer experience / completeness, not specified as rank formulas.

| Hypothesis | Label | Notes |
|---|---|---|
| Higher **photo upload frequency** improves local ranking | `HYPOTHESIS` | Photos recommended for customer understanding; frequency→rank unproven officially |
| **Review replies** improve local ranking | `HYPOTHESIS` | Replies help stand out / trust; reply→rank weight not stated |
| Higher **post volume** improves local ranking | `HYPOTHESIS` | Posts share timely info; volume→rank unproven officially |

**JS SOLUTIONS DECISION:** May test for **engagement / website clicks / branded search** outcomes; never sell as guaranteed ranking levers. Client language: experience and completeness, not “algorithm boosts.”

**PROVENANCE:** `HYPOTHESIS`

---

## 13. Magnolia local page

| Field | Value |
|---|---|
| **SOURCE** | Sprint 5 SEO research + Google spam policies (doorways) |
| **URL** | `docs/research/seo-search-intelligence-2026.md`; https://developers.google.com/search/docs/essentials/spam-policies |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Doorway pages are prohibited. Sprint 5 hypothesis allowed one Magnolia-area page **only if** it contains real local proof — not template multi-city doorways. |
| **IMPLICATION** | Thin `/magnolia` or city-factory pages conflict with anti-doorway stance and client-safe messaging. |
| **JS SOLUTIONS DECISION** | Magnolia local page = **`TEST_LATER` / `NOT_JUSTIFIED`** for V1 without differentiated, useful local proof. Prefer strengthening `/local-seo` + accurate GBP over doorway expansion. |
| **PROVENANCE** | `OFFICIAL_GOOGLE` (anti-doorway) + `JS_SOLUTIONS_OPERATING_RULE` (defer) + prior `HYPOTHESIS` from Sprint 5 |

---

## 14. Website → GBP link placement

| Field | Value |
|---|---|
| **SOURCE** | JS Solutions conversion / UX operating judgment |
| **URL** | n/a (process) |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | *(Not a Google requirement to place GBP widgets on conversion pages.)* |
| **IMPLICATION** | Footer/about NAP consistency can help users; aggressive GBP CTAs on audit/contact heroes may dilute conversion. |
| **JS SOLUTIONS DECISION** | Website→GBP surface = **`EXPERIMENT` or `DEFER`**. Do **not** clutter primary conversion pages (`/website-audit`, contact) with GBP chrome in V1. Prefer NAP consistency in footer/Organization schema and outbound UTM on the GBP website field. |
| **PROVENANCE** | `JS_SOLUTIONS_OPERATING_RULE` + `INFERENCE` |

---

## 15. Future APIs — V1 zeros

| Capability | V1 status | Notes |
|---|---|---|
| Business Profile Performance API / related GBP APIs | **`FUTURE_GBP_API = 0`** | Manual Insights only |
| Places API (Maps Platform place data) | **`FUTURE_PLACES_API = 0`** | Not used for owner Insights or V1 intelligence |
| GBP Audit/Optimizer SaaS | Out of scope | Already noted in UTM conventions |

| Field | Value |
|---|---|
| **SOURCE** | Sprint 12 scope lock |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | V1 does not integrate these APIs. |
| **IMPLICATION** | No OAuth scopes, quota requests, or Places lookups in Sprint 12 deliverables. |
| **JS SOLUTIONS DECISION** | Keep automation debt explicit; revisit when manual capture is a bottleneck **and** access is approved. |
| **PROVENANCE** | `JS_SOLUTIONS_OPERATING_RULE` |

Places API overview (Maps Platform product surface, distinct from Business Profile owner Insights): https://developers.google.com/maps/documentation/places/web-service/overview — treat as future research if needed; **not** required to operate V1.

---

## 16. Zero vs blank (metric honesty)

| Field | Value |
|---|---|
| **SOURCE** | First-party growth measurement conventions (Facebook / GSC / acquisition carry-forward) |
| **URL** | e.g. `docs/growth/facebook-content-operating-system.md`, `docs/growth/measurement-framework.md` |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Across growth modules, blank/omitted metrics stay `null` → **`NOT_CAPTURED`**. An explicitly entered **`0`** means an **observed zero** for that period. |
| **IMPLICATION** | Coercing missing GBP Insights fields to `0` fabricates history and corrupts baselines. |
| **JS SOLUTIONS DECISION** | Same rule for GBP snapshots: blank = `NOT_CAPTURED`; `0` = observed zero. Searches not yet monthly-updated → `NOT_CAPTURED` / wait, not `0`. |
| **PROVENANCE** | `FIRST_PARTY` + `JS_SOLUTIONS_OPERATING_RULE` |

---

## 17. Client-safe vs unsafe language

| Field | Value |
|---|---|
| **SOURCE** | `docs/growth/client-talking-points.md` + this research |
| **ACCESS DATE** | 2026-08-24 |
| **FACT** | Client-safe local language already includes preferring useful local information over thin doorway pages; not promising rankings/timelines; keeping incomplete data explicit. |
| **IMPLICATION** | Local/GBP sales and content must stay consistent with measurement honesty and Google policies. |
| **JS SOLUTIONS DECISION** | See table below. |
| **PROVENANCE** | `FIRST_PARTY` + `JS_SOLUTIONS_OPERATING_RULE` |

### Client-safe (examples)

- “We keep Business Profile information accurate and complete so customers and Google can understand what you do and where you serve.”
- “We ask for honest Google reviews and reply thoughtfully; we do not incentivize or filter reviews.”
- “We measure profile interactions (views, calls, directions, website clicks) separately from website Search Console metrics.”
- “When local search is relevant, we prefer useful, distinct local information over thin city doorway pages.”
- “We do not promise Map pack rankings, timelines, or guaranteed call volume.”

### Unsafe (do not say)

- Guaranteed #1 / Map pack / “we control Google’s local algorithm”
- “Post X times/week to rank” / “reply to every review to rank” as certainty
- Incentivized or gated review programs framed as “best practice”
- Equating Search Console clicks with GBP directions/calls
- Claiming Performance API / Places API insights we do not operate (`FUTURE_* = 0`)
- Inventing zeros for missing Insights periods
- Doorway/multi-city thin pages as “local SEO coverage”
- Perfect attribution from untagged GBP website links

---

## Decision register (Sprint 12 / LOCAL_GROWTH_VERSION = 1)

| ID | Decision | Status |
|---|---|---|
| D1 | Manual Insights snapshots; no GBP Performance API | `FUTURE_GBP_API = 0` |
| D2 | No Places API | `FUTURE_PLACES_API = 0` |
| D3 | Canonical GBP UTMs locked | `google_business_profile` / `organic_local` / `gbp_profile` / `website` \| `post_<slug>` |
| D4 | Weekly light + monthly deep review; experimental 1–2 posts/week | `JS_SOLUTIONS_OPERATING_RULE` |
| D5 | Photo frequency / review replies / post volume → ranking | `HYPOTHESIS` only |
| D6 | Magnolia local page | `TEST_LATER` / `NOT_JUSTIFIED` without anti-doorway-safe proof |
| D7 | Website→GBP UI on conversion pages | `EXPERIMENT` or `DEFER` — don’t clutter |
| D8 | Blank vs zero | `NOT_CAPTURED` vs observed `0` |
| D9 | GSC ≠ GBP Insights; organic Google ≠ GBP channel without UTMs | Hard rule |
| D10 | Post types = Update / Offer / Event (not Photo-as-type) | Per Help as of 2026-08-24 |

---

## Source index (prefer these)

| Topic | URL | Provenance |
|---|---|---|
| Local ranking factors | https://support.google.com/business/answer/7091 | `OFFICIAL_GOOGLE` |
| Performance Insights metrics | https://support.google.com/business/answer/9918094 | `OFFICIAL_GOOGLE` |
| Performance API DailyMetric | https://developers.google.com/my-business/reference/performance/rest/v1/DailyMetric | `OFFICIAL_GOOGLE` |
| Representation guidelines | https://support.google.com/business/answer/3038177 | `OFFICIAL_GOOGLE` |
| Service areas | https://support.google.com/business/answer/9157481 | `OFFICIAL_GOOGLE` |
| Posts | https://support.google.com/business/answer/7342169 | `OFFICIAL_GOOGLE` |
| Review tips | https://support.google.com/business/answer/3474122 | `OFFICIAL_GOOGLE` |
| Maps UGC / fake & incentivized reviews | https://support.google.com/contributionpolicy/answer/7400114 | `OFFICIAL_GOOGLE` |
| LocalBusiness structured data | https://developers.google.com/search/docs/appearance/structured-data/local-business | `OFFICIAL_GOOGLE` |
| Spam / doorways | https://developers.google.com/search/docs/essentials/spam-policies | `OFFICIAL_GOOGLE` |
| Search Console Performance | https://support.google.com/webmasters/answer/7576553 | `OFFICIAL_GOOGLE` |
| UTM conventions | `docs/growth/utm-conventions.md` | `FIRST_PARTY` |
| Client language | `docs/growth/client-talking-points.md` | `FIRST_PARTY` |

---

*End of Local Search / GBP Intelligence research — ACCESS DATE 2026-08-24. Re-verify Google Help URLs before changing operating rules if product UI/docs change.*
