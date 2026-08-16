import { createFinding, type AuditRule } from "../engine/types";
import {
  BLOCKING_HEAD_SCRIPT_HIGH,
  BLOCKING_HEAD_SCRIPT_MIN,
  COMPRESSION_MIN_HTML_BYTES,
  FONT_FILE_HIGH,
  HTML_SIZE_LARGE_BYTES,
  HTML_SIZE_VERY_LARGE_BYTES,
  IFRAME_OVERHEAD_MIN,
  IMAGE_FORMAT_MIN_LEGACY,
  IMAGE_LAZY_MIN_TOTAL,
  INLINE_CSS_LARGE_BYTES,
  INLINE_JS_LARGE_BYTES,
  INLINE_JS_VERY_LARGE_BYTES,
  PRECONNECT_HINT_MIN_ORIGINS,
  PRELOAD_HIGH,
  SCRIPT_VOLUME_HIGH,
  SCRIPT_VOLUME_VERY_HIGH,
  SLOW_DOCUMENT_FETCH_MS,
  STYLESHEET_VOLUME_HIGH,
  THIRD_PARTY_SCRIPT_ORIGIN_HIGH,
  THIRD_PARTY_SCRIPT_ORIGIN_MODERATE,
} from "../page-performance";
import type { AuditFinding, AuditPerformanceData } from "../types";

function formatKb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

function originList(origins: string[]): string {
  if (origins.length === 0) {
    return "";
  }

  return ` Examples: ${origins.slice(0, 5).join(", ")}.`;
}

function buildWarningFindings(
  performance: AuditPerformanceData,
): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const scripts = performance.scripts;
  const styles = performance.stylesheets;
  const images = performance.images;
  const truncatedNote = performance.truncated
    ? " Analysis stopped after a safety cap because the page referenced a very large number of resources."
    : "";

  if (scripts.blockingHeadCandidates >= BLOCKING_HEAD_SCRIPT_MIN) {
    const high = scripts.blockingHeadCandidates >= BLOCKING_HEAD_SCRIPT_HIGH;

    findings.push(
      createFinding({
        id: "performance-blocking-scripts",
        title: "Several scripts may delay initial rendering",
        description: `${scripts.blockingHeadCandidates} external scripts are loaded from the document head without async or defer.${truncatedNote}`,
        recommendation:
          "Review which scripts are required during the first paint. Defer non-critical scripts when execution order allows it. Do not add async to every script if order matters.",
        status: "warning",
        category: "performance",
        scoreImpact: high ? 5 : 3,
        priority: high ? "high" : "medium",
        businessImpact: "high",
        difficulty: "medium",
        estimatedFixMinutes: high ? 90 : 45,
        quickWin: false,
      }),
    );
  }

  const emitVolume =
    scripts.external + scripts.inline - scripts.jsonLd >= SCRIPT_VOLUME_HIGH &&
    (scripts.blockingHeadCandidates < BLOCKING_HEAD_SCRIPT_HIGH ||
      scripts.external >= SCRIPT_VOLUME_VERY_HIGH);

  if (emitVolume) {
    const veryHigh =
      scripts.external + scripts.inline >= SCRIPT_VOLUME_VERY_HIGH;

    findings.push(
      createFinding({
        id: "performance-script-volume",
        title: "The page loads a large number of scripts",
        description: `${scripts.external} external and ${scripts.inline} inline scripts were referenced. A higher count is not automatically broken, but it often means extra work on slower devices.${truncatedNote}`,
        recommendation:
          "Remove scripts that are no longer needed, combine vendor tags where practical, and keep only tools that clearly support the business.",
        status: "warning",
        category: "performance",
        scoreImpact: veryHigh ? 2 : 1,
        priority: veryHigh ? "medium" : "low",
        businessImpact: "medium",
        difficulty: "medium",
        estimatedFixMinutes: 60,
        quickWin: false,
      }),
    );
  }

  if (scripts.duplicateExternalSources > 0) {
    findings.push(
      createFinding({
        id: "performance-duplicate-scripts",
        title: "The same script file is loaded more than once",
        description: `${scripts.duplicateExternalSources} external script ${
          scripts.duplicateExternalSources === 1 ? "URL appears" : "URLs appear"
        } more than once on the page.`,
        recommendation:
          "Keep a single include for each script file. Duplicate tags usually come from overlapping plugins or tags.",
        status: "warning",
        category: "performance",
        scoreImpact: 2,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 20,
        quickWin: true,
      }),
    );
  }

  if (scripts.inlineBytes >= INLINE_JS_LARGE_BYTES) {
    const veryLarge = scripts.inlineBytes >= INLINE_JS_VERY_LARGE_BYTES;

    findings.push(
      createFinding({
        id: "performance-large-inline-js",
        title: "A large amount of JavaScript is embedded in the page",
        description: `About ${formatKb(scripts.inlineBytes)} of JavaScript is written directly into the HTML. That increases the size of the document browsers have to download and parse.`,
        recommendation:
          "Move large inline scripts into cacheable files where possible, and keep only small critical snippets in the HTML.",
        status: "warning",
        category: "performance",
        scoreImpact: veryLarge ? 3 : 2,
        priority: veryLarge ? "medium" : "low",
        businessImpact: "medium",
        difficulty: "medium",
        estimatedFixMinutes: 60,
        quickWin: false,
      }),
    );
  }

  if (
    styles.blockingCandidates >= STYLESHEET_VOLUME_HIGH ||
    styles.external >= STYLESHEET_VOLUME_HIGH
  ) {
    findings.push(
      createFinding({
        id: "performance-stylesheet-volume",
        title: "The page loads many stylesheets",
        description: `${styles.external} external stylesheets were referenced, including ${styles.blockingCandidates} that can delay first render.`,
        recommendation:
          "Combine or reduce stylesheet files where the theme or platform allows it. Unused CSS cannot be confirmed from this scan.",
        status: "warning",
        category: "performance",
        scoreImpact: 1,
        priority: "low",
        businessImpact: "low",
        difficulty: "medium",
        estimatedFixMinutes: 45,
        quickWin: false,
      }),
    );
  }

  if (styles.duplicateExternalSources > 0) {
    findings.push(
      createFinding({
        id: "performance-duplicate-stylesheets",
        title: "The same stylesheet is loaded more than once",
        description: `${styles.duplicateExternalSources} stylesheet ${
          styles.duplicateExternalSources === 1 ? "URL appears" : "URLs appear"
        } more than once.`,
        recommendation:
          "Remove duplicate stylesheet tags so each CSS file is requested once.",
        status: "warning",
        category: "performance",
        scoreImpact: 2,
        priority: "medium",
        businessImpact: "low",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
      }),
    );
  }

  if (styles.inlineBytes >= INLINE_CSS_LARGE_BYTES) {
    findings.push(
      createFinding({
        id: "performance-large-inline-css",
        title: "Large CSS blocks are embedded in the HTML",
        description: `About ${formatKb(styles.inlineBytes)} of CSS lives in style tags. Modest critical CSS is normal; this amount is large enough to weigh down the document.`,
        recommendation:
          "Keep critical CSS modest and move the rest into cacheable stylesheet files.",
        status: "warning",
        category: "performance",
        scoreImpact: 1,
        priority: "low",
        businessImpact: "low",
        difficulty: "medium",
        estimatedFixMinutes: 40,
        quickWin: false,
      }),
    );
  }

  const lazyRate = images.total > 0 ? images.lazy / images.total : 1;

  if (
    images.total >= IMAGE_LAZY_MIN_TOTAL &&
    lazyRate < 0.25 &&
    images.lazy <= 1
  ) {
    findings.push(
      createFinding({
        id: "performance-image-lazy-loading",
        title: "Many images load without lazy-loading hints",
        description: `${images.total} images were found and ${images.lazy} use loading="lazy". The first images on a page may intentionally load immediately; additional images often benefit from native lazy loading.`,
        recommendation:
          "Add loading=\"lazy\" to images that are not needed in the first screenful. Keep the main hero image eager if it is the first thing visitors should see.",
        status: "warning",
        category: "performance",
        scoreImpact: 3,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 25,
        quickWin: true,
      }),
    );
  }

  if (
    images.total >= 4 &&
    images.missingDimensions / images.total >= 0.4
  ) {
    findings.push(
      createFinding({
        id: "performance-image-dimensions",
        title: "Some images do not declare width and height",
        description: `${images.missingDimensions} of ${images.total} images do not declare dimensions, which can increase the risk of layout shifts while the page loads. This is not a measured Core Web Vitals result.`,
        recommendation:
          "Add width and height attributes (or an equivalent aspect-ratio) to images so the browser can reserve space.",
        status: "warning",
        category: "performance",
        scoreImpact: 2,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 30,
        quickWin: true,
      }),
    );
  }

  if (
    images.legacyRaster >= IMAGE_FORMAT_MIN_LEGACY &&
    images.modernRaster === 0
  ) {
    findings.push(
      createFinding({
        id: "performance-image-formats",
        title: "Photos may not be using modern image formats",
        description: `${images.legacyRaster} JPEG/PNG/GIF images were referenced and no AVIF or WebP images were visible. SVG and PNG remain appropriate for logos and transparency.`,
        recommendation:
          "Serve photos in WebP or AVIF where the platform supports it, with a fallback for older browsers. Do not convert every PNG icon solely for format reasons.",
        status: "warning",
        category: "performance",
        scoreImpact: 1,
        priority: "low",
        businessImpact: "low",
        difficulty: "medium",
        estimatedFixMinutes: 60,
        quickWin: false,
      }),
    );
  }

  if (
    scripts.thirdPartyScriptOriginCount >= THIRD_PARTY_SCRIPT_ORIGIN_MODERATE
  ) {
    const high =
      scripts.thirdPartyScriptOriginCount >= THIRD_PARTY_SCRIPT_ORIGIN_HIGH;
    const kinds = scripts.knownScriptKinds.filter((kind) => kind !== "other");
    const kindNote =
      kinds.length > 0
        ? ` Recognizable tools include: ${kinds.join(", ")}.`
        : "";

    findings.push(
      createFinding({
        id: "performance-third-party-scripts",
        title: "Several outside tools add extra page work",
        description: `Scripts from ${scripts.thirdPartyScriptOriginCount} external origins were found.${kindNote}${originList(scripts.thirdPartyScriptOrigins)} Third-party tools can add useful features, but each one may add network and JavaScript work before the page becomes fully responsive.`,
        recommendation:
          "Review analytics, chat, tracking, advertising, and widget scripts and remove tools that are no longer needed. Keep the analytics you actually use.",
        status: "warning",
        category: "performance",
        scoreImpact: high ? 4 : 3,
        priority: high ? "high" : "medium",
        businessImpact: "high",
        difficulty: "medium",
        estimatedFixMinutes: high ? 90 : 45,
        quickWin: false,
      }),
    );
  }

  const heavyEmbeds =
    performance.iframes.youtube +
    performance.iframes.maps +
    performance.iframes.vimeo;

  if (
    performance.iframes.total >= IFRAME_OVERHEAD_MIN ||
    heavyEmbeds >= 2
  ) {
    findings.push(
      createFinding({
        id: "performance-iframe-overhead",
        title: "Multiple embeds may add extra load",
        description: `${performance.iframes.total} embedded frames were found${originList(performance.iframes.exampleOrigins)} Maps, video players, and booking widgets are useful, but several at once can add extra work.`,
        recommendation:
          "Keep the embeds visitors need. Lazy-load or replace extra maps and videos when they are not essential on this page.",
        status: "warning",
        category: "performance",
        scoreImpact: 2,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "medium",
        estimatedFixMinutes: 40,
        quickWin: false,
      }),
    );
  }

  if (performance.videos.autoplay >= 2) {
    findings.push(
      createFinding({
        id: "performance-video-loading",
        title: "Video autoplay may add extra load",
        description: `${performance.videos.autoplay} video ${
          performance.videos.autoplay === 1 ? "element starts" : "elements start"
        } automatically. A single well-compressed hero video is not automatically a problem.`,
        recommendation:
          "Use a poster image, avoid unnecessary autoplay, and keep preload modest unless the video is the primary content.",
        status: "warning",
        category: "performance",
        scoreImpact: 2,
        priority: "low",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 30,
        quickWin: true,
      }),
    );
  }

  if (performance.htmlBytes >= HTML_SIZE_LARGE_BYTES) {
    const veryLarge = performance.htmlBytes >= HTML_SIZE_VERY_LARGE_BYTES;

    findings.push(
      createFinding({
        id: "performance-html-size",
        title: "The HTML document is unusually large",
        description: `The fetched HTML is about ${formatKb(performance.htmlBytes)}. That is the document size, not the full page weight after images and scripts download.`,
        recommendation:
          "Reduce large inline scripts, duplicated markup, or embedded data in the page HTML.",
        status: "warning",
        category: "performance",
        scoreImpact: veryLarge ? 3 : 2,
        priority: veryLarge ? "medium" : "low",
        businessImpact: "medium",
        difficulty: "medium",
        estimatedFixMinutes: 60,
        quickWin: false,
      }),
    );
  }

  if (
    performance.compressed === false &&
    performance.htmlBytes >= COMPRESSION_MIN_HTML_BYTES
  ) {
    findings.push(
      createFinding({
        id: "performance-document-compression",
        title: "The HTML response did not advertise compression",
        description: `The main HTML response did not advertise gzip or Brotli compression during this audit. This observation applies to the document response, not every file on the website.`,
        recommendation:
          "Enable gzip or Brotli compression on the hosting or CDN configuration for HTML responses.",
        status: "warning",
        category: "performance",
        scoreImpact: 2,
        priority: "medium",
        businessImpact: "medium",
        difficulty: "easy",
        estimatedFixMinutes: 30,
        quickWin: true,
      }),
    );
  }

  if (
    performance.documentFetchDurationMs !== null &&
    performance.documentFetchDurationMs >= SLOW_DOCUMENT_FETCH_MS
  ) {
    findings.push(
      createFinding({
        id: "performance-document-response",
        title: "The HTML document took a long time to arrive",
        description: `The initial HTML response took approximately ${Math.round(performance.documentFetchDurationMs)} ms during this audit. This is a single server-response observation, not a full browser performance measurement, and it is not LCP or TTFB.`,
        recommendation:
          "Ask hosting support to review origin response time if this delay is consistent. One slow fetch is not enough to diagnose the whole website.",
        status: "warning",
        category: "performance",
        scoreImpact: 1,
        priority: "low",
        businessImpact: "medium",
        difficulty: "hard",
        estimatedFixMinutes: 120,
        quickWin: false,
      }),
    );
  }

  if (
    performance.fonts.fileCount >= FONT_FILE_HIGH ||
    (performance.fonts.legacyFormatCount >= 3 &&
      performance.fonts.woff2Count === 0)
  ) {
    findings.push(
      createFinding({
        id: "performance-font-loading",
        title: "Font loading may be heavier than needed",
        description: `${performance.fonts.fileCount} font resources were visible${
          performance.fonts.googleFontsStylesheet
            ? ", including Google Fonts"
            : ""
        }. Legacy formats: ${performance.fonts.legacyFormatCount}. WOFF2 files: ${performance.fonts.woff2Count}.`,
        recommendation:
          "Limit font families and weights to what the design use, and prefer WOFF2 for self-hosted fonts.",
        status: "warning",
        category: "performance",
        scoreImpact: 1,
        priority: "low",
        businessImpact: "low",
        difficulty: "medium",
        estimatedFixMinutes: 40,
        quickWin: false,
      }),
    );
  }

  const matchingPreconnect =
    scripts.thirdPartyScriptOrigins.filter((origin) =>
      performance.hints.preconnectOrigins.some(
        (hint) => hint === origin || hint.endsWith(origin) || origin.endsWith(hint),
      ),
    ).length;

  if (
    scripts.thirdPartyScriptOriginCount >= PRECONNECT_HINT_MIN_ORIGINS &&
    matchingPreconnect === 0 &&
    !findings.some((finding) => finding.id === "performance-third-party-scripts")
  ) {
    findings.push(
      createFinding({
        id: "performance-preconnect-opportunity",
        title: "Early connections to outside tools are not hinted",
        description: `${scripts.thirdPartyScriptOriginCount} external script origins were found and no matching preconnect hints were present. Preconnect is optional, not a requirement.`,
        recommendation:
          "If those tools stay on the page, adding preconnect for one or two important origins can help the browser start those connections sooner.",
        status: "warning",
        category: "performance",
        scoreImpact: 1,
        priority: "low",
        businessImpact: "low",
        difficulty: "easy",
        estimatedFixMinutes: 15,
        quickWin: true,
      }),
    );
  }

  if (performance.hints.preloadCount >= PRELOAD_HIGH) {
    findings.push(
      createFinding({
        id: "performance-preload-volume",
        title: "Many preload hints may compete for bandwidth",
        description: `${performance.hints.preloadCount} preload hints were found. Preload is useful in moderation and can delay other work if overused.`,
        recommendation:
          "Keep preload for a small number of truly critical assets such as the hero image or a primary font.",
        status: "warning",
        category: "performance",
        scoreImpact: 1,
        priority: "low",
        businessImpact: "low",
        difficulty: "easy",
        estimatedFixMinutes: 20,
        quickWin: true,
      }),
    );
  }

  return findings;
}

function buildPositiveFindings(
  performance: AuditPerformanceData,
  warningIds: Set<string>,
): AuditFinding[] {
  const positives: AuditFinding[] = [];

  if (warningIds.size === 0) {
    positives.push(
      createFinding({
        id: "performance-static-healthy",
        title: "No major static performance risks were detected",
        description:
          "From this HTML scan, the page does not show heavy blocking scripts, oversized markup, or crowded third-party tags. This is not a Lighthouse or Core Web Vitals measurement.",
        status: "pass",
        category: "performance",
        scoreImpact: 5,
      }),
    );
  }

  if (
    !warningIds.has("performance-blocking-scripts") &&
    performance.scripts.blockingHeadCandidates === 0
  ) {
    positives.push(
      createFinding({
        id: "performance-blocking-scripts-healthy",
        title: "No obvious render-blocking scripts in the head",
        description:
          "External classic scripts in the document head all use async, defer, module loading, or are absent.",
        status: "pass",
        category: "performance",
        scoreImpact: 3,
      }),
    );
  }

  if (performance.compressed === true) {
    positives.push(
      createFinding({
        id: "performance-html-compressed",
        title: "The HTML response advertised compression",
        description: `The document Content-Encoding was ${performance.contentEncoding}.`,
        status: "pass",
        category: "performance",
        scoreImpact: 3,
      }),
    );
  }

  if (
    !warningIds.has("performance-image-lazy-loading") &&
    !warningIds.has("performance-image-dimensions") &&
    performance.images.total >= 3 &&
    performance.images.missingDimensions / performance.images.total <= 0.25
  ) {
    positives.push(
      createFinding({
        id: "performance-image-loading-healthy",
        title: "Most images include size or loading hints",
        description: `${performance.images.lazy} of ${performance.images.total} images use lazy loading, and ${performance.images.total - performance.images.missingDimensions} declare dimensions.`,
        status: "pass",
        category: "performance",
        scoreImpact: 2,
      }),
    );
  }

  if (
    !warningIds.has("performance-third-party-scripts") &&
    performance.scripts.thirdPartyScriptOriginCount <= 2
  ) {
    positives.push(
      createFinding({
        id: "performance-third-party-limited",
        title: "Outside script origins are limited",
        description:
          performance.scripts.thirdPartyScriptOriginCount === 0
            ? "No external third-party scripts were detected on this page."
            : `${performance.scripts.thirdPartyScriptOriginCount} external script origin was detected, which is a modest amount.`,
        status: "pass",
        category: "performance",
        scoreImpact: 2,
      }),
    );
  }

  return positives.slice(0, 4);
}

export const performanceRule: AuditRule = {
  id: "performance",
  category: "performance",
  title: "Performance intelligence",

  evaluate({ pageData }) {
    const performance = pageData.performance;

    if (!performance) {
      return [];
    }

    const warnings = buildWarningFindings(performance);
    const positives = buildPositiveFindings(
      performance,
      new Set(warnings.map((finding) => finding.id)),
    );

    const findings = [...warnings, ...positives];

    if (findings.length === 0) {
      return createFinding({
        id: "performance-static-healthy",
        title: "No major static performance risks were detected",
        description:
          "From this HTML scan, the page does not show heavy blocking scripts, oversized markup, or crowded third-party tags. This is not a Lighthouse or Core Web Vitals measurement.",
        status: "pass",
        category: "performance",
        scoreImpact: 5,
      });
    }

    return findings;
  },
};
