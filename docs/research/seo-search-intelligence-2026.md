# SEO & Search Intelligence Research — 2026

**Research date:** 2026-08-23  
**Property:** js-growth.com  
**Access date for linked sources:** 2026-08-23  
**Purpose:** Ground Growth Sprint 5 in current Google Search Central / Search Console guidance. Separate official facts from secondary research and our hypotheses.

---

## GOOGLE OFFICIAL GUIDANCE

### 1. Helpful, people-first content

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — Creating helpful, reliable, people-first content |
| **URL** | https://developers.google.com/search/docs/fundamentals/creating-helpful-content |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Ranking systems prioritize helpful, reliable information created for people, not for manipulating rankings. Self-assess originality, completeness, expertise, and page experience. Avoid search-engine-first patterns (mass topics, extensive automation for rankings, thin summaries). E-E-A-T is a conceptual lens; trust is most important. Scaled AI content created primarily to manipulate rankings violates spam policies. |
| **IMPLICATION** | Sprint 5 must invent **topics worth creating**, not a content factory. Sprint 6 must brief people-first pages with clear Who/How/Why. |
| **JS SOLUTIONS DECISION** | No OpenAI content generation in Sprint 5. Opportunities require evidence + commercial fit + intent. |

### 2. Spam policies (incl. generative AI / scaled content)

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — Spam policies |
| **URL** | https://developers.google.com/search/docs/essentials/spam-policies |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Spam includes scaled content abuse (large amounts of unoriginal content for ranking manipulation), including generative AI used that way. Doorway pages and other manipulative patterns remain prohibited. |
| **IMPLICATION** | Mass city doorway pages and AI-scaled posts for “coverage” are out of policy and out of strategy. |
| **JS SOLUTIONS DECISION** | Local pages only when useful and differentiated. No mass location generation. |

### 3. SEO Starter / Search Essentials

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — SEO Starter Guide / Search Essentials |
| **URL** | https://developers.google.com/search/docs/fundamentals/seo-starter-guide |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Fundamentals: crawlable content, clear titles/snippets, helpful structure, internal links, sitemaps, mobile-friendly experience. SEO helps discovery of people-first content; it is not a substitute for substance. |
| **IMPLICATION** | Inventory titles, H1s, sitemaps, and internal links before inventing new keywords. |
| **JS SOLUTIONS DECISION** | Code-side inventory + GSC stages before content volume. |

### 4. AI features on Search (AI Overviews / AI Mode)

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — AI features and your website |
| **URL** | https://developers.google.com/search/docs/appearance/ai-features |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Same foundational SEO applies. No extra technical requirements beyond indexed + snippet-eligible. AI feature traffic is included in Search Console Performance (Web). Google has published guidance mythbusting AEO/GEO ranking guarantees (May 2026 What’s new). |
| **IMPLICATION** | Do not build a separate “GEO ranking engine.” Strengthen helpful pages; measure via GSC when volume exists. |
| **JS SOLUTIONS DECISION** | Document AI Search as fundamentals + manual observation after Stage 2+. No GEO/AEO guarantees. |

### 5. Preferred Sources

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — Preferred sources |
| **URL** | https://developers.google.com/search/docs/appearance/preferred-sources |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Users can set preferred sources; content may get a preferred badge in Top Stories and (rolling) AI Overviews / AI Mode. Domain/subdomain eligible. Custom button / deeplink guidance updated Aug 2026. |
| **IMPLICATION** | Useful for publishers with brand demand; early sites with ~0 clicks gain little from implementing now. |
| **JS SOLUTIONS DECISION** | **FUTURE_EXPERIMENT** — do not implement button/deeplink in Sprint 5. |

### 6. Social & video platform properties in Search Console

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central Blog + Analyze social and video content |
| **URL** | https://developers.google.com/search/blog/2026/07/platform-properties-social-video-guide |
| **URL** | https://developers.google.com/search/docs/monitor-debug/analyze-social-video-content |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Platform properties (Instagram, TikTok, X, YouTube) report how those posts perform on Google Search/Discover/News — not on-platform reach. Separate from website property metrics. |
| **IMPLICATION** | Future YouTube/social search insights must not be blended with Facebook Insights or website GSC. |
| **JS SOLUTIONS DECISION** | **FUTURE_CROSS_CHANNEL**. Facebook Sprint 4 continues independently. |

### 7. Search Console Performance semantics

| Field | Value |
|---|---|
| **SOURCE** | Search Console Help — Performance report / AI Overviews logging clarifications |
| **URL** | https://support.google.com/webmasters/answer/7576553 |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Clicks, impressions, CTR, average position are diagnostic. AI Overviews counted in Performance. Exports can coerce missing values; operators must preserve NOT_CAPTURED / INSUFFICIENT_DATA. |
| **IMPLICATION** | 2 impressions ≠ keyword prioritization. Stage 0 operating model required. |
| **JS SOLUTIONS DECISION** | Conservative GSC stages; never treat export zeros as known zeros without context. |

### 8. FAQ rich results (2026 change)

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central What’s new — May/June 2026 |
| **URL** | https://developers.google.com/search/docs/appearance/structured-data/search-gallery |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | FAQ rich results no longer shown in Google Search (announced May 2026). |
| **IMPLICATION** | Do not prioritize FAQ schema for SERP features. |
| **JS SOLUTIONS DECISION** | Prefer Organization/LocalBusiness/Service-relevant structured data where accurate; skip FAQ-rich-result chasing. |

---

## HIGH-QUALITY SECONDARY RESEARCH

Secondary sources (industry blogs, tools) may inform **hypotheses** only. Prefer Google Search Central when conflicted.

- Industry “GEO/AEO” checklists often overclaim citation guarantees — treat as unverified.
- Keyword-volume tools invent precision we do not have at Stage 0 — **do not integrate paid volume APIs in V1**.

---

## OUR HYPOTHESIS

*(Not Google policy.)*

1. For JS Solutions at 0 clicks / 2 impressions, **service + problem/solution pages tied to the audit funnel** will matter more than long-tail blog volume.
2. A dedicated `/seo` page (distinct from `/local-seo`) will reduce intent overlap and improve commercial clarity.
3. One Magnolia-area local page may help later **if** it contains real local proof — not template doorways for six cities.
4. Strengthening internal links blog→service→audit will compound faster than new thin posts.
5. Preferred Sources and GSC platform properties become relevant after brand demand and/or video publishing exist.

---

## Search Baseline V1 (immutable first-party)

| Metric | Value |
|---|---|
| Property | js-growth.com |
| Baseline date | 2026-08-23 |
| Window | last 28 days (as recorded in Growth Baseline V1) |
| Clicks | 0 |
| Impressions | 2 |
| CTR | 0% |
| Average position | 77 (diagnostic only) |
| Query data | INSUFFICIENT_DATA |

---

## Related internal docs

- `docs/growth/search-intelligence.md` — operating model
- `docs/seo/search-console/README.md` — snapshot procedure
- Empty stubs in `docs/seo/*` (keyword-research, authority-map) are **not** canonical; Growth Sprint 5 docs supersede for strategy.
