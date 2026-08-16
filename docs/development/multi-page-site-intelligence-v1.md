# Multi-Page Site Intelligence V1

Internal notes for the Website Growth Audit bounded same-site crawl.

This is a **representative / prioritized multi-page scan**, not a complete crawler, not competitor analysis, not monitoring, and not AI.

## Architecture

```
SECURE FETCH
  → PAGE EXTRACTION (analyzeHtml + existing extractors)
  → PAGE-LEVEL FACTS (seed)
  → BOUNDED SITE CRAWL (same secure-fetch, same analyzers)
  → SITE-LEVEL AGGREGATION
  → SITE-LEVEL RULES
  → FINDINGS
  → SCORING (existing Website Growth Score)
  → REPORT (visibility gated by Free vs Professional)
```

Extraction stores facts. Aggregation compares facts. Rules interpret facts.

The submitted URL remains the seed. The product does not silently switch to the homepage.

Free and Professional run the **same crawl once**. Payment only changes report capability. Unlocking Professional does not recrawl.

## Crawl limits

Centralized in `src/lib/website-audit/site/constants.ts`:

| Limit | V1 value |
|---|---|
| Max crawled pages | 12 (including seed) |
| Max crawl depth | 2 |
| Max discovered URLs | 100 |
| Max blog/article pages | 2 |
| Fetch concurrency | 3 |
| Time budget | 25 seconds |
| Evidence examples | 5 per finding |

If the page cap, discovery cap, or time budget is hit, `truncated = true`. That is intentional product behavior, not a failed audit.

A single page timeout or 500 does not fail the audit.

## What “pages scanned” means

`pages scanned` is the number of HTML pages that were **successfully fetched and analyzed** in this representative scan.

`URLs discovered` is the number of same-site injectable HTML candidates found from seed links, subsequent crawled pages, and sitemap `<loc>` values, after normalization and skip rules, capped at 100.

This is **not** “every URL on the website.”

## Selection strategy

Priority, highest first:

1. Seed page
2. Homepage if discovered
3. Contact
4. About
5. Services overview
6. Individual service pages
7. Location / service-area pages
8. Other primary navigation pages
9. Remaining internal content

Header / `nav` / `main` links outrank footer links. Sitemap URLs are discovery candidates and are then prioritized — the crawler does **not** blindly take the first 12 sitemap entries.

## Same-site rules

- Crawl exact hostname and www / non-www equivalents.
- Do **not** automatically crawl other subdomains (`cdn.`, `blog.`, `app.`).
- Do not crawl `mailto:`, `tel:`, `javascript:`, `data:`, or `blob:`.
- Do not crawl competitor sites or search-engine result pages.

## URL normalization

- Resolve relative and root-relative URLs
- Strip fragments
- Strip tracking parameters (`utm_*`, `gclid`, `fbclid`, and similar)
- Treat trailing-slash variants as the same page
- Do **not** strip arbitrary query parameters that may change content
- Skip remaining URLs with more than 3 query parameters (except the seed)
- Skip pagination after page 1 (`page`, `paged`, `start`, `offset`)
- Skip session IDs and common filter/sort facet queries

After redirects, snapshots are deduplicated by normalized **final URL**.

## Exclusions

Utility-ish paths (privacy, terms, login, cart, checkout, search, tag, author, feed, wp-json, wp-admin, account, and similar) are skipped.

File types such as PDF, Office documents, archives, images, audio, and video are skipped. Non-HTML responses are skipped, not parsed.

Language alternate prefixes (`/es/`, `/fr/`, …) are skipped when the seed is not already in that prefix. The crawl does not translate or fetch every hreflang version.

WordPress/Shopify paths are treated as heuristics, not as a CMS-specific engine.

## Security

Every fetched page uses `fetchPublicHttpResource` / the existing secure-fetch path:

- SSRF / private IP / localhost / metadata protection
- Redirect checks
- Timeouts
- Response size caps
- HTML content-type enforcement

There is no raw `fetch()` path for crawled pages. No headless browser. No external SEO APIs.

## Robots and sitemaps

The existing robots.txt parser (`User-agent: *` prefix rules) is reused. Disallowed URLs are skipped and recorded when useful.

Accessible sitemaps listed during site discovery may be fetched **with a body cap** to collect `<loc>` URLs. Sitemap indexes are not recursively crawled. Media/feed/XML nested sitemaps are ignored.

## Site-level data

Stored in the existing audit JSON as optional `siteData`. No Prisma migration. Raw HTML is never persisted for the crawl.

Each scanned page keeps a compact snapshot: URL, type, title, H1, word count, conversion/indexability flags, bounded outgoing paths, and a small content token set for conservative Jaccard similarity.

## Site-level findings

Findings use the existing `AuditFinding` model and Website Growth Score categories (no new “Site” category):

| Finding | Category |
|---|---|
| Duplicate titles / descriptions / H1s | Search |
| Indexability pattern (important noindex pages) | Technical |
| Canonical pattern (e.g. services → homepage) | Technical |
| Verified broken internal links | Technical |
| Thin service pages | Content |
| Thin location pages | Local |
| Highly similar pages | Content |
| Weak internal-link support | Search |
| Conversion coverage / click-to-call consistency | Conversion |
| Local contact consistency / limited local pages | Local |

Only **verified fetch failures** (including 404/410) are broken links. URLs skipped because of the page cap are not marked broken.

Weak-link wording is limited to “within the pages scanned.” Pages are not labeled orphaned.

Score impact is capped on the **pattern**, not multiplied per page. Extra crawled pages do not run the full page-level rule set (seed page still does).

## Report experience

- **Free:** representative scan line + disclosure. Site findings may appear inside existing Free priority caps. No full page inventory.
- **Professional:** Site Overview (discovered / scanned / failed / cap / truncated), site-wide issues, responsive page inventory cards, PDF summary.

Customer-facing disclosure:

> This audit scans a prioritized sample of important pages and may not include every URL on the website.

Old reports without `siteData` continue to render and do not invent multi-page metrics.

## Known limitations

- Not a complete crawl of every URL
- Not competitive intelligence
- Not monitoring, history, or diffs
- Not AI classification or generative summaries
- Not Lighthouse / Core Web Vitals
- Not Google/Bing index checks
- Not NAP citation audits
- Language versions are not all crawled
- Internal-link depth is from this sample, not the entire public graph
- Jaccard similarity is a conservative token-set heuristic
- Article URLs that do not look like `/blog`, `/news`, `/articles`, or `/category` may still consume crawl slots as `other`
- Nested `/about/*` pages are treated as other content so they do not fill the scan like a dedicated about page

## Intentionally deferred

Competitive Intelligence, monitoring, subscriptions, customer accounts, agency features, interactive site graphs, ecommerce intelligence, and per-page category score matrices.
