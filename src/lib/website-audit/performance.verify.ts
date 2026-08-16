import { analyzeHtml } from "./analyze-html";
import {
  classifyKnownEmbed,
  classifyOriginKind,
  isRelatedHost,
  resolveHttpResourceUrl,
  utf8ByteLength,
} from "./page-performance";
import { performanceRule } from "./rules/performance-rule";
import { buildAuditRobotsData } from "./robots";
import { scoreWebsiteAudit } from "./scoring";
import type { AuditFinding, AuditPageData } from "./types";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function pageFromHtml(
  html: string,
  url = "https://example.com/",
  document?: Parameters<typeof analyzeHtml>[2],
): AuditPageData {
  const { robotsMetaRaw, ...htmlPageData } = analyzeHtml(html, url, document);

  return {
    ...htmlPageData,
    robots: buildAuditRobotsData(robotsMetaRaw, null),
  };
}

function evaluate(pageData: AuditPageData): AuditFinding[] {
  const result = performanceRule.evaluate({
    pageData,
    finalUrl: "https://example.com/",
  });

  return Array.isArray(result) ? result : [result];
}

function ids(findings: AuditFinding[]): string[] {
  return findings.map((finding) => finding.id);
}

function finding(
  results: AuditFinding[],
  id: string,
): AuditFinding | undefined {
  return results.find((item) => item.id === id);
}

assert(utf8ByteLength("abc") === 3, "utf8 ascii length");
assert(utf8ByteLength("é") === 2, "utf8 accented length");

const pageUrl = new URL("https://www.example.com/");
assert(
  classifyOriginKind(new URL("https://www.example.com/app.js"), pageUrl) ===
    "same-origin",
  "same origin script",
);
assert(
  isRelatedHost("cdn.example.com", "www.example.com"),
  "cdn subdomain is related",
);
assert(
  classifyOriginKind(new URL("https://cdn.example.com/app.js"), pageUrl) ===
    "related-host",
  "cdn is not third-party vendor language",
);
assert(
  classifyOriginKind(
    new URL("https://www.googletagmanager.com/gtm.js"),
    pageUrl,
  ) === "external",
  "gtm is external",
);
assert(
  resolveHttpResourceUrl("data:image/png;base64,aaa", pageUrl) === null,
  "ignore data urls",
);
assert(
  resolveHttpResourceUrl("javascript:void(0)", pageUrl) === null,
  "ignore javascript urls",
);
assert(
  resolveHttpResourceUrl("https://exa mple.com/x.js", pageUrl) === null,
  "invalid urls do not throw",
);
assert(
  classifyKnownEmbed(new URL("https://www.youtube.com/embed/abc")) ===
    "youtube",
  "youtube embed",
);
assert(
  classifyKnownEmbed(
    new URL("https://www.google.com/maps/embed?pb=1"),
  ) === "google-maps",
  "google maps embed",
);
assert(
  classifyKnownEmbed(new URL("https://www.google.com/search?q=test")) ===
    "other",
  "google search is not a map",
);

const empty = pageFromHtml(`<html><head><title>Home</title></head><body><h1>Hi</h1></body></html>`);
assert(empty.performance?.htmlBytes === utf8ByteLength(`<html><head><title>Home</title></head><body><h1>Hi</h1></body></html>`), "html bytes from body");
assert(empty.performance?.scripts.total === 0, "zero scripts");
assert(empty.performance?.images.total === 0, "zero images");
const emptyIds = ids(evaluate(empty));
assert(emptyIds.includes("performance-static-healthy"), "empty page is healthy");
assert(!emptyIds.includes("performance-blocking-scripts"), "empty page no blocking");
assert(
  !emptyIds.some((id) => id.includes("lcp") || id.includes("cls")),
  "no vitals finding ids",
);

const blocking = pageFromHtml(`
  <html>
    <head>
      <script src="/a.js"></script>
      <script src="/b.js"></script>
      <script src="https://cdn.example.com/c.js"></script>
      <script async src="/async.js"></script>
      <script defer src="/defer.js"></script>
      <script type="module" src="/mod.js"></script>
      <script type="application/ld+json">{"@type":"Organization"}</script>
    </head>
    <body>
      <script src="/footer.js"></script>
    </body>
  </html>
`);
assert(blocking.performance?.scripts.blockingHeadCandidates === 3, "classic head scripts blocking");
assert(blocking.performance?.scripts.async === 1, "async counted");
assert(blocking.performance?.scripts.defer === 1, "defer counted");
assert(blocking.performance?.scripts.module === 1, "module counted");
assert(blocking.performance?.scripts.jsonLd === 1, "jsonld excluded from js loading");
assert(
  ids(evaluate(blocking)).includes("performance-blocking-scripts"),
  "blocking finding fires",
);

const bodyOnly = pageFromHtml(`
  <html>
    <body>
      <script src="/a.js"></script>
      <script src="/b.js"></script>
    </body>
  </html>
`);
assert(bodyOnly.performance?.scripts.blockingHeadCandidates === 0, "body scripts not blocking candidates");
assert(
  !ids(evaluate(bodyOnly)).includes("performance-blocking-scripts"),
  "end-of-body scripts are not penalized as blocking",
);

const duplicates = pageFromHtml(`
  <head>
    <script src="/app.js"></script>
    <script src="/app.js"></script>
    <link rel="stylesheet" href="/theme.css">
    <link rel="stylesheet" href="/theme.css">
  </head>
`);
assert(duplicates.performance?.scripts.duplicateExternalSources === 1, "duplicate script urls");
assert(duplicates.performance?.stylesheets.duplicateExternalSources === 1, "duplicate css urls");
const dupIds = ids(evaluate(duplicates));
assert(dupIds.includes("performance-duplicate-scripts"), "duplicate script finding");
assert(dupIds.includes("performance-duplicate-stylesheets"), "duplicate css finding");
assert(finding(evaluate(duplicates), "performance-duplicate-scripts")?.quickWin === true, "duplicate script is a quick win");

const inlineJs = pageFromHtml(
  `<script>${"x=1;".repeat(20_000)}</script>`,
);
assert((inlineJs.performance?.scripts.inlineBytes ?? 0) > 50_000, "inline js bytes measured");
assert(ids(evaluate(inlineJs)).includes("performance-large-inline-js"), "large inline js finding");

const lazyHealthy = pageFromHtml(`
  <img src="/hero.jpg" width="800" height="400" loading="eager" alt="">
  ${Array.from({ length: 8 }, (_, index) => `<img src="/p${index}.webp" width="400" height="300" loading="lazy" alt="">`).join("")}
`);
assert(lazyHealthy.performance?.images.eager === 1, "one eager hero");
assert(lazyHealthy.performance?.images.lazy === 8, "remaining lazy");
assert(
  !ids(evaluate(lazyHealthy)).includes("performance-image-lazy-loading"),
  "hero eager + lazy rest is not penalized",
);

const noLazy = pageFromHtml(
  Array.from(
    { length: 14 },
    (_, index) => `<img src="/photo${index}.jpg">`,
  ).join(""),
);
assert(ids(evaluate(noLazy)).includes("performance-image-lazy-loading"), "many images without lazy");
assert(ids(evaluate(noLazy)).includes("performance-image-dimensions"), "missing dimensions");
assert(ids(evaluate(noLazy)).includes("performance-image-formats"), "legacy formats without modern");

const svgLogo = pageFromHtml(`
  <img src="/logo.svg" width="120" height="40" alt="">
  <img src="/hero.webp" width="800" height="400" loading="eager" alt="">
`);
const svgIds = ids(evaluate(svgLogo));
assert(!svgIds.includes("performance-image-formats"), "svg + webp is not a format penalty");
assert(!svgIds.includes("performance-image-dimensions"), "explicit dimensions not penalized");

const pngOk = pageFromHtml(`<img src="/icon.png" width="32" height="32" alt="">`);
assert(
  !ids(evaluate(pngOk)).includes("performance-image-formats"),
  "one png does not trigger format finding",
);

const thirdPartyHeavy = pageFromHtml(`
  <script src="https://www.googletagmanager.com/gtm.js"></script>
  <script src="https://www.google-analytics.com/analytics.js"></script>
  <script src="https://connect.facebook.net/en_US/fbevents.js"></script>
  <script src="https://static.hotjar.com/c/hotjar.js"></script>
  <script src="https://js.hs-scripts.com/123.js"></script>
  <script src="https://widget.intercom.io/widget/abc"></script>
  <script src="https://maps.googleapis.com/maps/api/js"></script>
`);
assert(
  (thirdPartyHeavy.performance?.scripts.thirdPartyScriptOriginCount ?? 0) >= 4,
  "third-party origins counted",
);
assert(
  ids(evaluate(thirdPartyHeavy)).includes("performance-third-party-scripts"),
  "third-party overhead finding",
);

const oneAnalytics = pageFromHtml(
  `<script async src="https://www.googletagmanager.com/gtm.js"></script>`,
);
assert(
  !ids(evaluate(oneAnalytics)).includes("performance-third-party-scripts"),
  "one analytics script is not overhead",
);

const oneMap = pageFromHtml(
  `<iframe src="https://www.google.com/maps/embed?pb=1"></iframe>`,
);
assert(oneMap.performance?.iframes.maps === 1, "map iframe classified");
assert(
  !ids(evaluate(oneMap)).includes("performance-iframe-overhead"),
  "one map iframe is not overhead",
);

const manyFrames = pageFromHtml(`
  <iframe src="https://www.youtube.com/embed/a"></iframe>
  <iframe src="https://player.vimeo.com/video/1"></iframe>
  <iframe src="https://www.google.com/maps/embed?pb=1"></iframe>
`);
assert(
  ids(evaluate(manyFrames)).includes("performance-iframe-overhead"),
  "several heavy embeds flagged",
);

const oneVideo = pageFromHtml(
  `<video autoplay muted poster="/still.jpg" src="/hero.mp4"></video>`,
);
assert(
  !ids(evaluate(oneVideo)).includes("performance-video-loading"),
  "single autoplay hero video is not failed",
);

const twoAutoplay = pageFromHtml(`
  <video autoplay src="/a.mp4"></video>
  <video autoplay src="/b.mp4"></video>
`);
assert(
  ids(evaluate(twoAutoplay)).includes("performance-video-loading"),
  "multiple autoplay videos flagged",
);

const hints = pageFromHtml(`
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="dns-prefetch" href="//fonts.gstatic.com">
  <link rel="preload" as="font" href="/font.woff2">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">
`);
assert(hints.performance?.hints.preconnectOrigins.includes("fonts.googleapis.com"), "preconnect extracted");
assert(hints.performance?.fonts.googleFontsStylesheet === true, "google fonts stylesheet");
assert((hints.performance?.fonts.woff2Count ?? 0) >= 1, "woff2 visible");

const compressed = pageFromHtml(
  `<p>${"word ".repeat(6000)}</p>`,
  "https://example.com/",
  {
    advertisedContentLength: 80_000,
    contentEncoding: "br",
    cacheControl: "no-cache",
    expires: null,
    etag: null,
    lastModified: null,
    documentFetchDurationMs: 220,
  },
);
assert(compressed.performance?.compressed === true, "brotli recorded");
assert(ids(evaluate(compressed)).includes("performance-html-compressed"), "compression positive");
assert(
  !ids(evaluate(compressed)).includes("performance-document-response"),
  "normal fetch duration is not a finding",
);
assert(
  compressed.performance?.documentFetchDurationMs === 220,
  "document fetch duration recorded and not labeled ttfb",
);

const uncompressedLarge = pageFromHtml(
  `<p>${"word ".repeat(8000)}</p>`,
  "https://example.com/",
  {
    advertisedContentLength: 40_000,
    contentEncoding: null,
    cacheControl: null,
    expires: null,
    etag: null,
    lastModified: null,
    documentFetchDurationMs: 9_500,
  },
);
assert(uncompressedLarge.performance?.compressed === false, "missing encoding is uncompressed");
const uncompressedIds = ids(evaluate(uncompressedLarge));
assert(
  uncompressedIds.includes("performance-document-compression"),
  "large uncompressed html warned",
);
assert(
  uncompressedIds.includes("performance-document-response"),
  "very slow document fetch warned conservatively",
);
assert(
  finding(evaluate(uncompressedLarge), "performance-document-response")
    ?.description.includes("not LCP or TTFB") === true,
  "slow fetch is not called TTFB",
);

const smallUncompressed = pageFromHtml(
  `<p>Hi</p>`,
  "https://example.com/",
  {
    advertisedContentLength: 20,
    contentEncoding: null,
    cacheControl: null,
    expires: null,
    etag: null,
    lastModified: null,
    documentFetchDurationMs: 80,
  },
);
assert(
  !ids(evaluate(smallUncompressed)).includes("performance-document-compression"),
  "small html without compression is not penalized",
);

const stylesheetOk = pageFromHtml(
  `<link rel="stylesheet" href="/app.css">`,
);
assert(stylesheetOk.performance?.stylesheets.total === 1, "one stylesheet");
assert(
  !ids(evaluate(stylesheetOk)).includes("performance-stylesheet-volume"),
  "one stylesheet is healthy",
);

const volumeScripts = pageFromHtml(
  Array.from(
    { length: 28 },
    (_, index) => `<script defer src="/file-${index}.js"></script>`,
  ).join(""),
);
const volumeIds = ids(evaluate(volumeScripts));
assert(volumeIds.includes("performance-script-volume"), "high script count finding");
assert(
  !volumeIds.includes("performance-blocking-scripts"),
  "deferred body/head scripts with defer are not blocking",
);

const heavy = pageFromHtml(`
  ${Array.from({ length: 6 }, (_, index) => `<script src="/sync-${index}.js"></script>`).join("")}
  ${Array.from({ length: 8 }, (_, index) => `<script src="https://cdn${index}.thirdparty.test/x.js"></script>`).join("")}
  ${Array.from({ length: 30 }, (_, index) => `<img src="/img-${index}.jpg">`).join("")}
  ${Array.from({ length: 3 }, (_, index) => `<iframe src="https://www.youtube.com/embed/${index}"></iframe>`).join("")}
  <script>${"inline();".repeat(20_000)}</script>
`);
const heavyFindings = evaluate(heavy);
const heavyActionable = heavyFindings.filter((item) => item.status !== "pass");
assert(heavyActionable.length >= 4, "weak page has several distinct findings");
assert(
  finding(heavyFindings, "performance-blocking-scripts")?.priority === "high",
  "severe blocking is high priority",
);
assert(
  (finding(heavyFindings, "performance-script-volume")?.scoreImpact ?? 0) <= 2,
  "raw volume does not dwarf blocking",
);
assert(
  heavy.performance?.optimizationRisk === "high",
  "weak page optimization risk high",
);
assert(
  !JSON.stringify(heavyFindings).includes("Largest Contentful Paint"),
  "no fabricated LCP",
);

const capped = pageFromHtml(
  Array.from(
    { length: 220 },
    (_, index) => `<script src="/n-${index}.js"></script><img src="/i-${index}.jpg">`,
  ).join(""),
);
assert(capped.performance?.truncated === true, "resource-heavy page records truncation");
assert(capped.performance?.scripts.truncated === true, "script scan capped");

const missingPerformance = evaluate({
  ...empty,
  performance: undefined,
});
assert(missingPerformance.length === 0, "legacy reports without signals do not crash");

const healthyScore = scoreWebsiteAudit(empty, "https://example.com/");
const performanceScore = healthyScore.categoryScores.find(
  (item) => item.category === "performance",
);
assert(
  (performanceScore?.score ?? 0) === (performanceScore?.maxScore ?? -1),
  "strong static page earns full performance category points",
);
assert(performanceScore?.maxScore === 10, "performance still weighted 10");

const weakScore = scoreWebsiteAudit(heavy, "https://example.com/");
const weakPerf = weakScore.categoryScores.find(
  (item) => item.category === "performance",
);
assert(
  (weakPerf?.score ?? 10) < (weakPerf?.maxScore ?? 0),
  "weak page lowers performance score without inventing pageSpeed",
);

assert(
  !healthyScore.findings.some((item) =>
    /LCP|CLS|INP|TTFB|PageSpeed|Lighthouse Performance Score/i.test(
      `${item.title} ${item.description}`,
    ),
  ),
  "healthy findings do not fabricate vitals",
);

console.log("performance.verify.ts passed");
