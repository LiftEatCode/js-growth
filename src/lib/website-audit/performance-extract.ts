import type { CheerioAPI } from "cheerio";

import {
  classifyFontFormat,
  classifyImageFormat,
  classifyKnownEmbed,
  classifyKnownScript,
  classifyOptimizationRisk,
  classifyOriginKind,
  firstSrcsetUrl,
  hasCompressionEncoding,
  hasExplicitDimensions,
  isIgnoredResourceScheme,
  isLegacyRasterFormat,
  isModernRasterFormat,
  originHost,
  resolveHttpResourceUrl,
  resourceIdentity,
  uniqueCapped,
  utf8ByteLength,
  MAX_FONT_SCAN,
  MAX_HINT_SCAN,
  MAX_IFRAME_SCAN,
  MAX_IMAGE_SCAN,
  MAX_ORIGIN_EXAMPLES,
  MAX_SCRIPT_SCAN,
  MAX_STYLESHEET_SCAN,
  MAX_VIDEO_SCAN,
} from "./page-performance";
import type {
  AuditPerformanceData,
  AuditPerformanceDocumentContext,
  AuditKnownScriptKind,
} from "./types";

function splitRelTokens(value: string | undefined): string[] {
  return (
    value
      ?.toLowerCase()
      .split(/\s+/)
      .filter(Boolean) ?? []
  );
}

function isInHead($: CheerioAPI, element: unknown): boolean {
  return $(element as never).closest("head").length > 0;
}

function isJavaScriptType(type: string | undefined): boolean {
  const normalized = type?.trim().toLowerCase() ?? "";

  return (
    normalized === "" ||
    normalized === "text/javascript" ||
    normalized === "application/javascript" ||
    normalized === "module" ||
    normalized === "text/ecmascript"
  );
}

function isJsonLdType(type: string | undefined): boolean {
  return type?.trim().toLowerCase() === "application/ld+json";
}

function isModuleType(type: string | undefined): boolean {
  return type?.trim().toLowerCase() === "module";
}

function hasAttr(
  $element: { attr: (name: string) => string | undefined },
  name: string,
): boolean {
  const value = $element.attr(name);

  if (value === undefined) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized !== "false";
}

function isPrintOnlyMedia(media: string | undefined): boolean {
  const normalized = media?.trim().toLowerCase() ?? "";
  return normalized === "print";
}

function collectImageFormats(
  $: CheerioAPI,
  element: unknown,
  pageUrl: URL,
): Set<ReturnType<typeof classifyImageFormat>> {
  const formats = new Set<ReturnType<typeof classifyImageFormat>>();
  const $img = $(element as never);
  const src = resolveHttpResourceUrl($img.attr("src"), pageUrl);
  const srcset = firstSrcsetUrl($img.attr("srcset"));
  const srcsetUrl = resolveHttpResourceUrl(srcset ?? undefined, pageUrl);

  formats.add(classifyImageFormat(src, $img.attr("type")));

  if (srcsetUrl) {
    formats.add(classifyImageFormat(srcsetUrl));
  }

  const picture = $img.closest("picture");

  if (picture.length > 0) {
    picture.find("source").each((_, source) => {
      const $source = $(source);
      const sourceUrl = resolveHttpResourceUrl(
        $source.attr("src") ?? firstSrcsetUrl($source.attr("srcset")) ?? undefined,
        pageUrl,
      );
      formats.add(classifyImageFormat(sourceUrl, $source.attr("type")));
    });
  }

  return formats;
}

export function extractPerformanceData(
  $: CheerioAPI,
  pageUrl: URL,
  html: string,
  document?: AuditPerformanceDocumentContext,
): AuditPerformanceData {
  const htmlBytes = utf8ByteLength(html);
  const externalOrigins = new Set<string>();
  const thirdPartyScriptOrigins = new Set<string>();
  const knownKinds = new Set<AuditKnownScriptKind>();

  let scriptTotal = 0;
  let scriptExternal = 0;
  let scriptInline = 0;
  let scriptAsync = 0;
  let scriptDefer = 0;
  let scriptModule = 0;
  let scriptJsonLd = 0;
  let blockingHeadCandidates = 0;
  let inlineJsBytes = 0;
  let thirdPartyScriptCount = 0;
  let scriptsTruncated = false;
  const externalScriptSources: string[] = [];

  $("script").each((_, element) => {
    if (scriptTotal >= MAX_SCRIPT_SCAN) {
      scriptsTruncated = true;
      return false;
    }

    scriptTotal += 1;
    const $script = $(element);
    const type = $script.attr("type");

    if (isJsonLdType(type)) {
      scriptJsonLd += 1;
      return;
    }

    if (!isJavaScriptType(type)) {
      return;
    }

    const srcRaw = $script.attr("src")?.trim();
    const isModule = isModuleType(type);
    const hasAsync = hasAttr($script, "async");
    const hasDefer = hasAttr($script, "defer");

    if (isModule) {
      scriptModule += 1;
    }

    if (hasAsync) {
      scriptAsync += 1;
    }

    if (hasDefer) {
      scriptDefer += 1;
    }

    if (!srcRaw) {
      scriptInline += 1;
      inlineJsBytes += utf8ByteLength($script.html() ?? $script.text() ?? "");
      return;
    }

    if (isIgnoredResourceScheme(srcRaw)) {
      scriptInline += 1;
      return;
    }

    const resolved = resolveHttpResourceUrl(srcRaw, pageUrl);

    if (!resolved) {
      return;
    }

    scriptExternal += 1;
    externalScriptSources.push(resourceIdentity(resolved));

    const originKind = classifyOriginKind(resolved, pageUrl);

    if (originKind === "external") {
      const host = originHost(resolved);
      thirdPartyScriptCount += 1;
      thirdPartyScriptOrigins.add(host);
      externalOrigins.add(host);
      knownKinds.add(classifyKnownScript(resolved.hostname));
    } else if (originKind === "related-host") {
      externalOrigins.add(originHost(resolved));
    }

    const classicBlocking =
      !isModule &&
      !hasAsync &&
      !hasDefer &&
      isInHead($, element);

    if (classicBlocking) {
      blockingHeadCandidates += 1;
    }
  });

  const duplicateScriptCounts = new Map<string, number>();

  for (const source of externalScriptSources) {
    duplicateScriptCounts.set(
      source,
      (duplicateScriptCounts.get(source) ?? 0) + 1,
    );
  }

  const duplicateExternalSources = [...duplicateScriptCounts.values()].filter(
    (count) => count > 1,
  ).length;

  let stylesheetTotal = 0;
  let stylesheetExternal = 0;
  let inlineStyleTags = 0;
  let blockingStylesheets = 0;
  let inlineCssBytes = 0;
  let stylesTruncated = false;
  const externalStyleSources: string[] = [];

  $("link").each((_, element) => {
    const rels = splitRelTokens($(element).attr("rel"));

    if (!rels.includes("stylesheet")) {
      return;
    }

    if (stylesheetTotal >= MAX_STYLESHEET_SCAN) {
      stylesTruncated = true;
      return false;
    }

    stylesheetTotal += 1;
    const $link = $(element);
    const href = $link.attr("href");
    const resolved = resolveHttpResourceUrl(href, pageUrl);

    if (resolved) {
      stylesheetExternal += 1;
      externalStyleSources.push(resourceIdentity(resolved));

      const originKind = classifyOriginKind(resolved, pageUrl);

      if (originKind !== "same-origin") {
        externalOrigins.add(originHost(resolved));
      }
    }

    if (!isPrintOnlyMedia($link.attr("media")) && !hasAttr($link, "disabled")) {
      blockingStylesheets += 1;
    }
  });

  $("style").each((_, element) => {
    if (stylesheetTotal + inlineStyleTags >= MAX_STYLESHEET_SCAN + 50) {
      stylesTruncated = true;
      return;
    }

    inlineStyleTags += 1;
    inlineCssBytes += utf8ByteLength($(element).html() ?? $(element).text() ?? "");
  });

  const duplicateStyleCounts = new Map<string, number>();

  for (const source of externalStyleSources) {
    duplicateStyleCounts.set(
      source,
      (duplicateStyleCounts.get(source) ?? 0) + 1,
    );
  }

  const duplicateStylesheets = [...duplicateStyleCounts.values()].filter(
    (count) => count > 1,
  ).length;

  let imageTotal = 0;
  let lazy = 0;
  let eager = 0;
  let unspecifiedLoading = 0;
  let missingDimensions = 0;
  let modernRaster = 0;
  let legacyRaster = 0;
  let svg = 0;
  let imagesTruncated = false;

  $("img").each((_, element) => {
    if (imageTotal >= MAX_IMAGE_SCAN) {
      imagesTruncated = true;
      return false;
    }

    imageTotal += 1;
    const $img = $(element);
    const loading = $img.attr("loading")?.trim().toLowerCase() ?? "";

    if (loading === "lazy") {
      lazy += 1;
    } else if (loading === "eager") {
      eager += 1;
    } else {
      unspecifiedLoading += 1;
    }

    if (
      !hasExplicitDimensions(
        $img.attr("width"),
        $img.attr("height"),
        $img.attr("style"),
      )
    ) {
      missingDimensions += 1;
    }

    const src = resolveHttpResourceUrl($img.attr("src"), pageUrl);

    if (src) {
      const originKind = classifyOriginKind(src, pageUrl);

      if (originKind !== "same-origin") {
        externalOrigins.add(originHost(src));
      }
    }

    const formats = collectImageFormats($, element, pageUrl);

    if ([...formats].some((format) => format === "svg")) {
      svg += 1;
    } else if ([...formats].some(isModernRasterFormat)) {
      modernRaster += 1;
    } else if ([...formats].some(isLegacyRasterFormat)) {
      legacyRaster += 1;
    }
  });

  let iframeTotal = 0;
  let youtube = 0;
  let maps = 0;
  let vimeo = 0;
  let iframesTruncated = false;
  const iframeOrigins: string[] = [];

  $("iframe").each((_, element) => {
    if (iframeTotal >= MAX_IFRAME_SCAN) {
      iframesTruncated = true;
      return false;
    }

    iframeTotal += 1;
    const resolved = resolveHttpResourceUrl($(element).attr("src"), pageUrl);

    if (!resolved) {
      return;
    }

    const host = originHost(resolved);
    iframeOrigins.push(host);
    externalOrigins.add(host);

    const kind = classifyKnownEmbed(resolved);

    if (kind === "youtube") {
      youtube += 1;
    } else if (kind === "google-maps") {
      maps += 1;
    } else if (kind === "vimeo") {
      vimeo += 1;
    }
  });

  let videoTotal = 0;
  let autoplay = 0;
  let preloadAuto = 0;
  let preloadNone = 0;
  let withPoster = 0;
  let videosTruncated = false;

  $("video").each((_, element) => {
    if (videoTotal >= MAX_VIDEO_SCAN) {
      videosTruncated = true;
      return false;
    }

    videoTotal += 1;
    const $video = $(element);

    if (hasAttr($video, "autoplay")) {
      autoplay += 1;
    }

    const preload = $video.attr("preload")?.trim().toLowerCase() ?? "";

    if (preload === "auto" || preload === "") {
      preloadAuto += preload === "auto" ? 1 : 0;
    }

    if (preload === "none") {
      preloadNone += 1;
    }

    if ($video.attr("poster")?.trim()) {
      withPoster += 1;
    }
  });

  const preconnectOrigins: string[] = [];
  const dnsPrefetchOrigins: string[] = [];
  let preloadCount = 0;
  let preloadFontCount = 0;
  let preloadImageCount = 0;
  let preloadStyleCount = 0;
  let preloadScriptCount = 0;
  let modulepreloadCount = 0;
  let hintsTruncated = false;
  let googleFontsStylesheet = false;
  let fontFileCount = 0;
  let woff2Count = 0;
  let legacyFontCount = 0;
  let fontsTruncated = false;

  $("link").each((_, element) => {
    const $link = $(element);
    const rels = splitRelTokens($link.attr("rel"));
    const href = $link.attr("href");
    const resolved = resolveHttpResourceUrl(href, pageUrl);
    const asValue = $link.attr("as")?.trim().toLowerCase() ?? "";

    if (rels.includes("preconnect") || rels.includes("dns-prefetch")) {
      if (
        preconnectOrigins.length + dnsPrefetchOrigins.length >=
        MAX_HINT_SCAN
      ) {
        hintsTruncated = true;
      } else if (resolved) {
        const host = originHost(resolved);

        if (rels.includes("preconnect")) {
          preconnectOrigins.push(host);
        }

        if (rels.includes("dns-prefetch")) {
          dnsPrefetchOrigins.push(host);
        }
      }
    }

    if (rels.includes("preload")) {
      if (preloadCount >= MAX_HINT_SCAN) {
        hintsTruncated = true;
      } else {
        preloadCount += 1;

        if (asValue === "font") {
          preloadFontCount += 1;
        } else if (asValue === "image") {
          preloadImageCount += 1;
        } else if (asValue === "style") {
          preloadStyleCount += 1;
        } else if (asValue === "script") {
          preloadScriptCount += 1;
        }
      }
    }

    if (rels.includes("modulepreload")) {
      modulepreloadCount += 1;
    }

    if (resolved && (rels.includes("stylesheet") || rels.includes("preload"))) {
      if (
        resolved.hostname === "fonts.googleapis.com" ||
        resolved.hostname === "fonts.gstatic.com"
      ) {
        googleFontsStylesheet = true;
        externalOrigins.add(originHost(resolved));
      }

      const fontFormat = classifyFontFormat(resolved);

      if (fontFormat !== "other" || asValue === "font") {
        if (fontFileCount >= MAX_FONT_SCAN) {
          fontsTruncated = true;
        } else {
          fontFileCount += 1;

          if (fontFormat === "woff2" || asValue === "font") {
            if (fontFormat === "woff2") {
              woff2Count += 1;
            } else if (fontFormat === "legacy") {
              legacyFontCount += 1;
            }
          } else if (fontFormat === "legacy") {
            legacyFontCount += 1;
          }
        }
      }
    }
  });

  const contentEncoding = document?.contentEncoding ?? null;
  const compressed = contentEncoding
    ? hasCompressionEncoding(contentEncoding)
    : document
      ? false
      : null;

  const uniqueIframeOrigins = uniqueCapped(
    iframeOrigins,
    MAX_ORIGIN_EXAMPLES,
  );

  const referencedResourceCount =
    scriptExternal +
    stylesheetExternal +
    imageTotal +
    iframeTotal;

  const uniqueExternalOrigins = uniqueCapped(
    externalOrigins,
    MAX_ORIGIN_EXAMPLES,
  );

  const truncated =
    scriptsTruncated ||
    stylesTruncated ||
    imagesTruncated ||
    iframesTruncated ||
    videosTruncated ||
    hintsTruncated ||
    fontsTruncated;

  const thirdPartyOriginList = uniqueCapped(
    thirdPartyScriptOrigins,
    MAX_ORIGIN_EXAMPLES,
  );

  const optimizationRisk = classifyOptimizationRisk({
    htmlBytes,
    blockingHeadCandidates,
    thirdPartyScriptOriginCount: thirdPartyScriptOrigins.size,
    imageCount: imageTotal,
    lazyImageCount: lazy,
    iframeCount: iframeTotal,
    inlineJsBytes,
    compressed,
  });

  return {
    htmlBytes,
    htmlByteSource: "utf8-body",
    advertisedContentLength: document?.advertisedContentLength ?? null,
    compressed,
    contentEncoding,
    cacheControl: document?.cacheControl ?? null,
    documentFetchDurationMs: document?.documentFetchDurationMs ?? null,
    optimizationRisk,
    scripts: {
      total: scriptTotal,
      external: scriptExternal,
      inline: scriptInline,
      async: scriptAsync,
      defer: scriptDefer,
      module: scriptModule,
      jsonLd: scriptJsonLd,
      blockingHeadCandidates,
      duplicateExternalSources,
      inlineBytes: inlineJsBytes,
      thirdPartyScriptCount,
      thirdPartyScriptOriginCount: thirdPartyScriptOrigins.size,
      thirdPartyScriptOrigins: thirdPartyOriginList,
      knownScriptKinds: [...knownKinds],
      truncated: scriptsTruncated,
    },
    stylesheets: {
      total: stylesheetTotal,
      external: stylesheetExternal,
      inlineStyleTags,
      blockingCandidates: blockingStylesheets,
      duplicateExternalSources: duplicateStylesheets,
      inlineBytes: inlineCssBytes,
      truncated: stylesTruncated,
    },
    images: {
      total: imageTotal,
      lazy,
      eager,
      unspecifiedLoading,
      missingDimensions,
      modernRaster,
      legacyRaster,
      svg,
      truncated: imagesTruncated,
    },
    iframes: {
      total: iframeTotal,
      uniqueOrigins: new Set(iframeOrigins).size,
      youtube,
      maps,
      vimeo,
      exampleOrigins: uniqueIframeOrigins,
      truncated: iframesTruncated,
    },
    videos: {
      total: videoTotal,
      autoplay,
      preloadAuto,
      preloadNone,
      withPoster,
      truncated: videosTruncated,
    },
    hints: {
      preconnectOrigins: uniqueCapped(preconnectOrigins, MAX_ORIGIN_EXAMPLES),
      dnsPrefetchOrigins: uniqueCapped(
        dnsPrefetchOrigins,
        MAX_ORIGIN_EXAMPLES,
      ),
      preloadCount,
      preloadFontCount,
      preloadImageCount,
      preloadStyleCount,
      preloadScriptCount,
      modulepreloadCount,
      truncated: hintsTruncated,
    },
    fonts: {
      googleFontsStylesheet,
      fileCount: fontFileCount,
      woff2Count,
      legacyFormatCount: legacyFontCount,
      preloadFontCount,
      truncated: fontsTruncated,
    },
    origins: {
      uniqueExternalOriginCount: externalOrigins.size,
      uniqueExternalOrigins,
      referencedResourceCount,
    },
    truncated,
  };
}
