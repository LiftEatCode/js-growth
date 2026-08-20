# Competitive Intelligence V1 (public Website Growth Audit)

> **Scope notice:** This document describes **optional explicit competitor URLs** on the public Website Growth Audit.  
> For Prospecting Engine Places-based Competitive Intelligence (Sprints 9–13.1), see [`competitive-intelligence.md`](competitive-intelligence.md).

Internal notes for optional competitor comparison in the Website Growth Audit.

Competitive Intelligence V1 answers **observable website differences** between the audited business and up to three **explicitly supplied** competitor URLs.

It is **deterministic**, **evidence-based**, **bounded**, **safe**, and **low-cost**. It is **not AI**.

## What this is not

V1 does **not** include:

- Automatic competitor discovery
- Google/Bing search or SERP scraping
- Keyword rankings or estimated traffic
- Backlinks or domain authority
- Market share
- Google Business Profile / review-rating comparison
- Lighthouse or Core Web Vitals (LCP, CLS, INP)
- AI interpretation
- Recrawling after Professional payment

## Input model

```
CompetitorInput[]  // 0–3 explicit URLs
MAX_COMPETITORS = 3
```

Competitors are optional. An audit without competitor URLs behaves exactly as before: no competitor fetch, no competitive section, no competitive error.

The comparison engine accepts `CompetitorInput[]` regardless of whether a later milestone feeds those URLs from the form, admin selection, sales workflow, or automatic discovery. V1 only accepts manual entry.

## Architecture

```
CUSTOMER SITE
    → existing bounded Multi-Page crawl (12 pages)
    → normalized customer site profile (from siteData)

COMPETITOR A/B/C (optional)
    → same secure-fetch + analyzeHtml + crawlSite
    → smaller competitor crawl (6 pages)
    → compact competitor profile

            → median/benchmark comparison
            → competitive gaps / strengths / opportunities
            → stored as competitiveData on the audit JSON
            → Professional report visibility
```

Do **not** duplicate the Multi-Page engine. Competitor crawls reuse `fetchSitePage` / `fetchPublicHttpResource`, `analyzeHtml`, `discoverSite`, `crawlSite`, page classification, and site aggregation.

Compact profiles are stored. Full competitor `WebsiteAuditResult` objects and raw HTML are **not** persisted.

## Scoring decision

The **Website Growth Score** measures the customer's website only.

Competitive findings are **not** merged into `scoreWebsiteAudit`. Supplying different competitors must not collapse or inflate the core score. Competitive Intelligence influences:

- Professional Competitive section
- Top competitive opportunities
- Priority context in that section

not the numeric Website Growth Score.

## Crawl limits

Customer scan: existing Multi-Page V1 (`src/lib/website-audit/site/constants.ts`).

Each competitor (`src/lib/website-audit/competitive/constants.ts`):

| Limit | V1 value |
|---|---|
| Max competitors | 3 |
| Max crawled pages | 6 including seed |
| Max depth | 2 |
| Max discovered URLs | 50 |
| Max blog/article pages | 1 |
| Fetch concurrency | 2 |
| Per-competitor time budget | 8 seconds |
| Total competitive time budget | 25 seconds |

Competitor crawls use the `competitor-commercial` priority preset: homepage → services index → service pages → location/service-area → contact → about → other nav → at most one article.

## Validation and security

Every competitor URL uses the same public-HTTP parser as the customer URL, then **secure-fetch** (no raw `fetch`).

Rejected / skipped:

- localhost, private IPs, cloud-metadata-style link-local addresses
- credentials in the URL
- non-HTTP(S) protocols
- same site as the customer (www/non-www, http/https, trailing slash)
- duplicate competitors (www/non-www)

Invalid competitor URLs **do not fail** the customer audit. They are recorded as skipped.

After redirects, competitors are also deduplicated by final hostname.

## Failure behavior

- Partial competitor failure: customer audit succeeds; comparison uses successful competitors; report discloses “N of M analyzed.”
- All competitors fail: customer audit succeeds; no fake findings; Professional section says comparison could not be completed.
- Time budget reached: remaining competitors marked unavailable.

## Comparison metrics

Prefer **median** across successful competitors (not average). One competitor uses “Compared competitor,” not “competitor median.”

Metrics are normalized where sample sizes differ (percentages, medians, presence). Page counts mean **found in the representative scan**, not “every page on the website.”

Compared when facts exist:

- Dedicated service-page count (quality gate so thin spam does not automatically win)
- Substantive location / service-area pages (word count ≥ 200)
- Median service-page word count (depth signal, not a ranking rule)
- Thin commercial-page percentage
- Unique title / description / H1 percentages on commercial pages
- Internal-link support on scanned service pages
- Key-page CTA / click-to-call coverage
- On-page trust-signal coverage
- Local relevance on key pages (website signals only)
- Useful schema families on the seed page (supporting evidence)
- Indexability issues and verified broken-link rate
- Static Performance V2 risk on the seed document (secondary)

Gap thresholds are conservative. Example: 7 vs competitor 8 service pages is **similar**, not a major weakness. 3 vs 11 is a **large** gap.

Only **moderate** and **large** gaps/strengths are surfaced (max 8 gaps, 5 strengths, 5 opportunities). “About the same” is stored as facts but not turned into 20 findings.

## Language rules

Never claim rankings, Google preference, traffic, leads, revenue, or market share.

Use scan wording: “The competitor sites scanned provide broader dedicated service-page coverage.”

## Free vs Professional

The comparison is generated **once** during audit creation and stored. Payment changes **visibility**, not facts. Unlocking Professional does not recrawl.

- **Free + successful comparison:** locked teaser only (count of meaningful weaker areas). No metric table.
- **Professional + successful comparison:** overview, comparison table, behind/stronger, top opportunities, compact competitor cards, disclosure.
- **Professional without competitors:** no empty competitive section.
- **Old reports** without `competitiveData`: render as before.

## Data storage

`WebsiteAuditResult.competitiveData` in the existing audit JSON. **No Prisma schema change.**

Approximate serialized size: compact profiles for 3 competitors should stay well under a few hundred KB; one-competitor fixtures in tests stay under 80 KB of competitive JSON. Raw HTML is not stored.

## Runtime

Competitive work is sequential across competitors so the total 25s budget can stop remaining crawls.

Expected ballpark (public, unnamed, and heavily site-dependent):

- Customer only: existing Multi-Page V1 (~10–25s)
- Customer + 1 competitor: customer crawl plus up to ~8s extra
- Customer + 3 competitors: customer crawl plus up to ~25s extra, often less if sites are fast or some fail

If three competitors make audits unacceptably slow, reduce `MAX_COMPETITOR_PAGES` or `MAX_COMPETITOR_DEPTH` before adding infrastructure.

## Analytics

`competitive_audit_completed` with **counts only**: `competitor_count`, `successful_competitor_count`. Competitor URLs are not sent.

## Known limitations

- Competitors are manually supplied
- Scans are representative, not complete
- Page counts mean pages found within the bounded scan
- No ranking, keyword, backlink, traffic, revenue, or GBP data
- No AI interpretation
- Competitor crawl may miss commercially important pages because of the 6-page cap
- Different site architectures make raw page counts imperfect
- Performance comparison is static HTML/resource risk, not browser-measured
- Different crawl budgets for customer vs competitor; metrics are normalized for fairness where possible

## Files

- `src/lib/website-audit/competitive/` — comparison engine
- `src/lib/website-audit/competitive.verify.ts` — mocked tests (no live internet)
- `src/components/website-audit/report-competitive.tsx` — Free teaser / Professional section
- `src/components/website-audit/audit-form.tsx` — optional competitor URLs
