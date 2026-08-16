# Performance Intelligence V2

Internal notes for the Website Growth Audit performance category.

These policies/docs are operational. This is **static performance intelligence**, not a substitute for Lighthouse.

## What V2 measures

From the fetched HTML document and its resource **references**:

- HTML document size (UTF-8 byte length of the fetched body)
- Script inventory (async, defer, module, inline vs external, JSON-LD excluded from loader behavior)
- Potentially parser-blocking classic scripts in `head` (no async/defer, not module)
- Duplicate external script and stylesheet URLs
- Inline JS/CSS approximate byte size
- Stylesheet count and likely render-blocking stylesheets
- Image loading attributes, missing width/height, recognizable formats
- External vs related-host vs same-origin resource hosts
- Third-party/external script origins, with a small known-tool classifier
- iframe/embed counts (YouTube, Vimeo, Google Maps when recognizable)
- `video` autoplay/preload/poster attributes
- Resource hints: preconnect, dns-prefetch, preload, modulepreload
- Observable font files / Google Fonts stylesheets
- Whether the **HTML response** advertised gzip/Brotli/deflate/zstd
- Document fetch duration (request start through completed HTML body)

## What V2 does not measure

It does **not** produce:

- LCP, CLS, INP, FCP
- Speed Index, Total Blocking Time
- Lighthouse Performance score
- PageSpeed Insights score
- Total page weight
- True request count / network waterfall
- Unused CSS/JS
- Image or video file sizes (resource bodies are not downloaded)
- Cache behavior of static assets

Document fetch duration is **not** TTFB. TTFB requires time-to-first-byte measurement.

Referenced resource counts are **not** “Total Requests.” A browser may load more, skip some, or request CSS-imported files that never appear in the HTML.

## Architecture

```
HTML fetch (secure-fetch)
  → extraction (performance-extract.ts)
  → AuditPerformanceData on pageData.performance
  → performanceRule findings
  → existing scoring / report view
```

No Prisma schema changes. `pageData.performance` is stored in the existing audit JSON snapshot. Older reports omit it; rendering and the rule treat it as optional.

## Security and cost

V2 does not fetch scripts, images, fonts, or videos. Caps stop analysis of thousands of tags. URL resolution reuses public-http handling conceptually (`data:`, `blob:`, `javascript:` ignored). No extra per-audit vendor API cost.

## Future milestone

**Core Web Vitals / PageSpeed Integration V1** can later attach lab/field metrics. Do not bolt a fake Lighthouse score onto this extractor.

If added, keep a separate measured object such as source + LCP/CLS/INP rather than overwriting static signals.
