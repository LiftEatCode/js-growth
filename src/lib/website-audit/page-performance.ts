import type {
  AuditImageFormat,
  AuditKnownEmbedKind,
  AuditKnownScriptKind,
  AuditPerformanceRiskLevel,
  AuditResourceOriginKind,
} from "./types";

export const MAX_SCRIPT_SCAN = 200;
export const MAX_STYLESHEET_SCAN = 100;
export const MAX_IMAGE_SCAN = 200;
export const MAX_IFRAME_SCAN = 40;
export const MAX_VIDEO_SCAN = 30;
export const MAX_HINT_SCAN = 50;
export const MAX_FONT_SCAN = 40;
export const MAX_ORIGIN_EXAMPLES = 8;

export const HTML_SIZE_LARGE_BYTES = 200_000;
export const HTML_SIZE_VERY_LARGE_BYTES = 500_000;
export const INLINE_JS_LARGE_BYTES = 50_000;
export const INLINE_JS_VERY_LARGE_BYTES = 150_000;
export const INLINE_CSS_LARGE_BYTES = 50_000;
export const COMPRESSION_MIN_HTML_BYTES = 20_000;
export const SLOW_DOCUMENT_FETCH_MS = 8_000;
export const SCRIPT_VOLUME_HIGH = 25;
export const SCRIPT_VOLUME_VERY_HIGH = 40;
export const BLOCKING_HEAD_SCRIPT_MIN = 2;
export const BLOCKING_HEAD_SCRIPT_HIGH = 5;
export const STYLESHEET_VOLUME_HIGH = 10;
export const IMAGE_LAZY_MIN_TOTAL = 8;
export const IMAGE_FORMAT_MIN_LEGACY = 12;
export const THIRD_PARTY_SCRIPT_ORIGIN_MODERATE = 4;
export const THIRD_PARTY_SCRIPT_ORIGIN_HIGH = 7;
export const IFRAME_OVERHEAD_MIN = 3;
export const FONT_FILE_HIGH = 6;
export const PRELOAD_HIGH = 10;
export const PRECONNECT_HINT_MIN_ORIGINS = 5;

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function hasCompressionEncoding(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return /(?:^|[\s,])(?:gzip|br|deflate|zstd)(?:[\s,]|$)/i.test(value);
}

export function stripWww(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
}

export function isRelatedHost(resourceHost: string, pageHost: string): boolean {
  const resource = stripWww(resourceHost);
  const page = stripWww(pageHost);

  if (!resource || !page) {
    return false;
  }

  if (resource === page) {
    return true;
  }

  return resource.endsWith(`.${page}`) || page.endsWith(`.${resource}`);
}

export function classifyOriginKind(
  resourceUrl: URL,
  pageUrl: URL,
): AuditResourceOriginKind {
  if (resourceUrl.origin === pageUrl.origin) {
    return "same-origin";
  }

  if (isRelatedHost(resourceUrl.hostname, pageUrl.hostname)) {
    return "related-host";
  }

  return "external";
}

export function isHttpUrl(url: URL): boolean {
  return url.protocol === "http:" || url.protocol === "https:";
}

export function isIgnoredResourceScheme(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return (
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:") ||
    normalized.startsWith("javascript:") ||
    normalized.startsWith("about:")
  );
}

export function resolveHttpResourceUrl(
  raw: string | undefined,
  pageUrl: URL,
): URL | null {
  const value = raw?.trim();

  if (!value || isIgnoredResourceScheme(value)) {
    return null;
  }

  try {
    const resolved = new URL(value, pageUrl);

    if (!isHttpUrl(resolved)) {
      return null;
    }

    resolved.hash = "";
    return resolved;
  } catch {
    return null;
  }
}

export function resourceIdentity(url: URL): string {
  return url.toString();
}

export function originHost(url: URL): string {
  return url.host.toLowerCase();
}

export function uniqueCapped(
  values: Iterable<string>,
  limit: number,
): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    unique.push(value);

    if (unique.length >= limit) {
      break;
    }
  }

  return unique;
}

function pathnameExtension(url: URL): string {
  const pathname = url.pathname.toLowerCase();
  const last = pathname.split("/").pop() ?? "";
  const dot = last.lastIndexOf(".");

  if (dot <= 0) {
    return "";
  }

  return last.slice(dot + 1).split(/[?#]/)[0] ?? "";
}

export function classifyImageFormat(
  url: URL | null,
  typeHint?: string | null,
): AuditImageFormat {
  const type = typeHint?.toLowerCase() ?? "";

  if (type.includes("image/avif") || type.includes("avif")) {
    return "avif";
  }

  if (type.includes("image/webp") || type.includes("webp")) {
    return "webp";
  }

  if (type.includes("image/svg") || type.includes("svg")) {
    return "svg";
  }

  if (type.includes("image/png") || type.includes("png")) {
    return "png";
  }

  if (type.includes("image/gif") || type.includes("gif")) {
    return "gif";
  }

  if (
    type.includes("image/jpeg") ||
    type.includes("image/jpg") ||
    type.includes("jpeg")
  ) {
    return "jpeg";
  }

  if (!url) {
    return "other";
  }

  const extension = pathnameExtension(url);

  if (extension === "avif") {
    return "avif";
  }

  if (extension === "webp") {
    return "webp";
  }

  if (extension === "svg" || extension === "svgz") {
    return "svg";
  }

  if (extension === "png") {
    return "png";
  }

  if (extension === "gif") {
    return "gif";
  }

  if (extension === "jpg" || extension === "jpeg" || extension === "jfif") {
    return "jpeg";
  }

  return "other";
}

export function isModernRasterFormat(format: AuditImageFormat): boolean {
  return format === "avif" || format === "webp";
}

export function isLegacyRasterFormat(format: AuditImageFormat): boolean {
  return format === "jpeg" || format === "png" || format === "gif";
}

export function classifyFontFormat(
  url: URL,
): "woff2" | "legacy" | "other" {
  const extension = pathnameExtension(url);

  if (extension === "woff2") {
    return "woff2";
  }

  if (extension === "woff" || extension === "ttf" || extension === "otf" || extension === "eot") {
    return "legacy";
  }

  return "other";
}

export function classifyKnownScript(
  hostname: string,
): AuditKnownScriptKind {
  const host = hostname.toLowerCase();

  if (
    host === "www.googletagmanager.com" ||
    host === "googletagmanager.com" ||
    host.endsWith(".googletagmanager.com")
  ) {
    return "google-tag-manager";
  }

  if (
    host.includes("google-analytics.com") ||
    host === "analytics.google.com"
  ) {
    return "google-analytics";
  }

  if (
    host.endsWith("facebook.net") ||
    host.endsWith(".facebook.com") ||
    host === "connect.facebook.net"
  ) {
    return "meta";
  }

  if (host === "hotjar.com" || host.endsWith(".hotjar.com")) {
    return "hotjar";
  }

  if (
    host.includes("hs-scripts.com") ||
    host.includes("hs-analytics.net") ||
    host.includes("hubspot.com") ||
    host.includes("hsforms.net")
  ) {
    return "hubspot";
  }

  if (host.includes("intercom.io") || host.includes("intercomcdn.com")) {
    return "intercom";
  }

  if (
    host.includes("doubleclick.net") ||
    host.includes("googlesyndication.com") ||
    host.includes("googleadservices.com") ||
    host.includes("ads-twitter.com")
  ) {
    return "advertising";
  }

  if (
    host.includes("tawk.to") ||
    host.includes("tidio.co") ||
    host.includes("drift.com") ||
    host.includes("crisp.chat")
  ) {
    return "chat";
  }

  if (
    host === "fonts.googleapis.com" ||
    host === "fonts.gstatic.com"
  ) {
    return "google-fonts";
  }

  return "other";
}

export function classifyKnownEmbed(url: URL): AuditKnownEmbedKind {
  const host = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();

  if (
    host.includes("youtube.com") ||
    host.includes("youtube-nocookie.com") ||
    host === "youtu.be"
  ) {
    return "youtube";
  }

  if (host.includes("vimeo.com") || host.includes("vimeocdn.com")) {
    return "vimeo";
  }

  if (
    host.includes("maps.google.") ||
    host.includes("maps.googleapis.com") ||
    ((host === "www.google.com" || host === "google.com") &&
      pathname.includes("/maps"))
  ) {
    return "google-maps";
  }

  return "other";
}

export function classifyOptimizationRisk(input: {
  htmlBytes: number;
  blockingHeadCandidates: number;
  thirdPartyScriptOriginCount: number;
  imageCount: number;
  lazyImageCount: number;
  iframeCount: number;
  inlineJsBytes: number;
  compressed: boolean | null;
}): AuditPerformanceRiskLevel {
  const lazyRate =
    input.imageCount > 0 ? input.lazyImageCount / input.imageCount : 1;

  if (
    input.blockingHeadCandidates >= BLOCKING_HEAD_SCRIPT_HIGH ||
    input.thirdPartyScriptOriginCount >= THIRD_PARTY_SCRIPT_ORIGIN_HIGH ||
    (input.imageCount >= 25 && input.lazyImageCount === 0) ||
    input.htmlBytes >= HTML_SIZE_VERY_LARGE_BYTES ||
    input.iframeCount >= 5 ||
    input.inlineJsBytes >= INLINE_JS_VERY_LARGE_BYTES
  ) {
    return "high";
  }

  if (
    input.blockingHeadCandidates >= BLOCKING_HEAD_SCRIPT_MIN ||
    input.thirdPartyScriptOriginCount >= THIRD_PARTY_SCRIPT_ORIGIN_MODERATE ||
    (input.imageCount >= IMAGE_LAZY_MIN_TOTAL && lazyRate < 0.2) ||
    input.htmlBytes >= HTML_SIZE_LARGE_BYTES ||
    (input.compressed === false && input.htmlBytes >= COMPRESSION_MIN_HTML_BYTES) ||
    input.iframeCount >= IFRAME_OVERHEAD_MIN ||
    input.inlineJsBytes >= INLINE_JS_LARGE_BYTES
  ) {
    return "moderate";
  }

  return "low";
}

export function hasExplicitDimensions(
  width: string | undefined,
  height: string | undefined,
  style: string | undefined,
): boolean {
  const hasWidth = Boolean(width?.trim());
  const hasHeight = Boolean(height?.trim());

  if (hasWidth && hasHeight) {
    return true;
  }

  const css = style?.toLowerCase() ?? "";

  if (css.includes("aspect-ratio")) {
    return true;
  }

  const hasCssWidth = /(?:^|;)\s*width\s*:/.test(css);
  const hasCssHeight = /(?:^|;)\s*height\s*:/.test(css);

  return hasCssWidth && hasCssHeight;
}

export function firstSrcsetUrl(srcset: string | undefined): string | null {
  if (!srcset) {
    return null;
  }

  const first = srcset.split(",")[0]?.trim();

  if (!first) {
    return null;
  }

  return first.split(/\s+/)[0] || null;
}
