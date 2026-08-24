# Content Publishing & Performance Research — 2026

**Research date:** 2026-08-23  
**Access date:** 2026-08-23  
**Purpose:** Ground Growth Sprint 7 (Content Publishing, Distribution & Performance Feedback V1) in official Google Search and Analytics guidance.

Separate layers: **OFFICIAL** · **INFERENCE** · **HYPOTHESIS**

---

## OFFICIAL GUIDANCE

### 1. People-first helpful content

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — Creating helpful, reliable, people-first content |
| **URL** | https://developers.google.com/search/docs/fundamentals/creating-helpful-content |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Ranking systems prioritize helpful, reliable, people-first content. Search-engine-first production, scaled automation for rankings, and empty “freshness” churn are misaligned. E-E-A-T concepts (especially trust) inform how systems evaluate helpfulness; they are not a single ranking factor to game. |
| **IMPLICATION** | `/seo` must teach and convert honestly — diagnose-first, no ranking guarantees, no mass pages. |
| **JS SOLUTIONS DECISION** | Publish one approved human-canonical service page. No auto-publish. No fabricated proof. |

### 2. Title links

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — Title links / Influencing title links (incl. og:title as a source) |
| **URL** | https://developers.google.com/search/docs/appearance/title-link |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Title links are primarily influenced by page titles and on-page headings. Google may rewrite titles. Documentation updates in 2025–2026 include `og:title` among title-link sources. |
| **IMPLICATION** | Set a clear, non-shocking `<title>` and H1 aligned to the service intent; do not keyword-stuff. |
| **JS SOLUTIONS DECISION** | Use approved metadata from the canonical draft; keep title descriptive and honest. |

### 3. Snippets / meta descriptions

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — Control your snippets |
| **URL** | https://developers.google.com/search/docs/appearance/snippet |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Snippets are primarily created from page content; meta descriptions may be used when they better describe the page. Descriptions are not a direct ranking factor. |
| **IMPLICATION** | Write a useful meta description for `/seo`; do not treat it as a ranking lever. |
| **JS SOLUTIONS DECISION** | Ship a people-first description; never invent metrics in the snippet. |

### 4. Structured data — general + FAQ deprecation

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — Structured data / FAQ documentation updates |
| **URL** | https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data · https://developers.google.com/search/updates |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Structured data enables eligible rich results when it accurately describes visible content. FAQ rich results are no longer appearing in Google Search (documented deprecation timeline through mid/late 2026 for reports/API). Fabricated ratings, reviews, offers, or prices violate guidelines. |
| **IMPLICATION** | Do **not** add FAQPage schema merely because FAQs exist on `/seo`. Prefer accurate Organization (sitewide) + optional Service/BreadcrumbList only if accurate. |
| **JS SOLUTIONS DECISION** | No FAQ rich-result chasing. Optional Service + BreadcrumbList without offers/ratings/reviews. |

### 5. Sitemaps & discovery

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — Build and submit a sitemap |
| **URL** | https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Sitemaps help discovery of URLs you want crawled; inclusion does not guarantee indexing or ranking. |
| **IMPLICATION** | `/seo` belongs in the public sitemap; tokenized commercial routes must stay excluded. |
| **JS SOLUTIONS DECISION** | Add `/seo` to `sitemap.ts`. Keep `/reports`, `/proposal/{token}`, `/agreement/{token}` out. |

### 6. URL Inspection / indexing

| Field | Value |
|---|---|
| **SOURCE** | Google Search Console Help — URL Inspection |
| **URL** | https://support.google.com/webmasters/answer/9012288 |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | URL Inspection reports Google’s current indexed status for a URL. Operators may request indexing; indexing is not instant or guaranteed. |
| **IMPLICATION** | Track `PUBLISHED_NOT_VERIFIED` / `INDEXING_REQUESTED` / `INDEXED` as operator states — never claim INDEXED without GSC confirmation. |
| **JS SOLUTIONS DECISION** | Manual indexing workflow in Sprint 7 acceptance. No fake INDEXED default. |

### 7. Measuring Search performance

| Field | Value |
|---|---|
| **SOURCE** | Search Console — Performance report |
| **URL** | https://support.google.com/webmasters/answer/7576553 |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Performance reports expose clicks, impressions, CTR, and average position for queries/pages when data exists. New pages may show little or no data initially. |
| **IMPLICATION** | Use NOT_CAPTURED / INSUFFICIENT_DATA / NO_DATA before inventing zeros as “history.” Observed zeros after measurement starts are valid. |
| **JS SOLUTIONS DECISION** | Manual page-level GSC capture in V1 (API deferred). Pre-publish metrics = NO_DATA, not 0. |

### 8. Content updates / refreshes

| Field | Value |
|---|---|
| **SOURCE** | Google Search Central — helpful content / SEO starter guidance |
| **URL** | https://developers.google.com/search/docs/fundamentals/creating-helpful-content |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | Changing dates without substantive updates, or churning content primarily to appear “fresh,” is discouraged. Refresh when content is outdated or improved for users. |
| **IMPLICATION** | Do not recommend refresh solely because 30 days passed. |
| **JS SOLUTIONS DECISION** | Refresh candidates require material evidence (outdated claims, intent mismatch, sustained decline, offering change). |

### 9. Analytics (GA4) — page engagement & key events

| Field | Value |
|---|---|
| **SOURCE** | Google Analytics Help — [GA4] About events / key events |
| **URL** | https://support.google.com/analytics/answer/9322688 |
| **ACCESS DATE** | 2026-08-23 |
| **FACT** | GA4 measures page views/sessions and key events. Attribution is model-dependent; last-click-style certainty is not assumed. |
| **IMPLICATION** | Distinguish page views from qualified visits / CTAs. Never send private DB IDs as event params. |
| **JS SOLUTIONS DECISION** | Reuse `service_cta_clicked` + qualified-traffic-v1. Public-safe slug `seo_service_page` for UTM content when distributing externally — never GrowthContentPlan cuid. |

---

## INFERENCE

| Topic | Statement | Why inference |
|---|---|---|
| Internal links | Contextual links from related service/blog pages help discovery and user journeys more than sitewide spam links. | Official guidance emphasizes useful links; exact link graph is site-specific. |
| Measurement windows | Early (~7–14d), ~28d, ~90d reviews are **operational** checkpoints, not ranking SLAs. | Common operating practice; Google does not promise results by calendar. |
| Service schema | Service JSON-LD can clarify entity type without guaranteeing rich results. | Eligible ≠ guaranteed. |

---

## HYPOTHESIS

| Hypothesis | Status |
|---|---|
| Publishing `/seo` will increase branded + service-intent impressions over 90 days. | HYPOTHESIS — measure; do not claim causation of revenue. |
| Company Facebook educational posts about SEO misconceptions will drive attributed audit starts when UTM-tagged. | HYPOTHESIS — test via Facebook ledger + first-party attribution. |
| Soft Website→Facebook follow on thank-you pages outperforms sitewide CTAs. | HYPOTHESIS — Experiment 018 remains queued pending design proof. |

---

## JS SOLUTIONS SPRINT 7 DECISIONS (SUMMARY)

1. Human publish only; growth engine prepares handoff, never deploys silently.  
2. Extend `GrowthContentPlan` with `publishedAt` + `performanceJson` — no new `GrowthPublishedAsset` table in V1.  
3. No FAQ structured data for rich results.  
4. Manual Search evidence; GSC API stays deferred.  
5. Observation ≠ causation; INSUFFICIENT_DATA dominates learning with n=1.  
6. After `/seo` exists: stop recommending “create missing SEO page.”  
7. Experiment 018 stays queued (no intrusive follow CTAs this sprint).
