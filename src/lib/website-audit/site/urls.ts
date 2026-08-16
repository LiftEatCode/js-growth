import {
  FILE_EXTENSIONS_TO_SKIP,
  LANGUAGE_PATH_SEGMENTS,
  MAX_DISCOVERED_URLS,
  MAX_QUERY_PARAMS,
  PAGINATION_QUERY_PARAMS,
  SESSION_OR_FACET_QUERY_PARAMS,
  TRACKING_QUERY_PARAMS,
  UTILITY_PATH_SEGMENTS,
} from "./constants";
import type { AuditSiteSkipReason } from "./types";

export interface NormalizedCrawlUrl {
  href: string;
  identity: string;
  path: string;
  hostname: string;
  queryParamCount: number;
}

export interface CrawlUrlDecision {
  ok: true;
  url: NormalizedCrawlUrl;
}

export interface CrawlUrlSkip {
  ok: false;
  href: string;
  reason: AuditSiteSkipReason;
}

const UNSAFE_SCHEMES = /^(mailto:|tel:|javascript:|data:|blob:|about:)/i;

export function siteHostKey(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
}

/**
 * Exact hostname plus www / non-www are same-site.
 * Other subdomains (cdn., blog., app.) are not crawled.
 */
export function isSameCrawlSite(left: URL, right: URL): boolean {
  return siteHostKey(left.hostname) === siteHostKey(right.hostname);
}

export function normalizePathname(pathname: string): string {
  const decoded = pathname || "/";
  const collapsed = decoded.replace(/\/{2,}/g, "/");

  if (collapsed.length > 1 && collapsed.endsWith("/")) {
    return collapsed.slice(0, -1);
  }

  return collapsed || "/";
}

function stripTrackingParams(searchParams: URLSearchParams): URLSearchParams {
  const kept = new URLSearchParams();

  for (const [key, value] of searchParams.entries()) {
    if (TRACKING_QUERY_PARAMS.has(key.toLowerCase())) {
      continue;
    }

    kept.append(key, value);
  }

  kept.sort();
  return kept;
}

function searchString(params: URLSearchParams): string {
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export function crawlIdentity(url: URL): string {
  const host = siteHostKey(url.hostname);
  const path = normalizePathname(url.pathname).toLowerCase();
  const query = searchString(stripTrackingParams(url.searchParams));

  return `${host}${path}${query}`;
}

export function crawlPath(url: URL): string {
  return normalizePathname(url.pathname);
}

export function tryParseHttpUrl(
  value: string,
  base?: string,
): URL | null {
  const trimmed = value.trim();

  if (!trimmed || UNSAFE_SCHEMES.test(trimmed)) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, base);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    parsed.hash = "";
    return parsed;
  } catch {
    return null;
  }
}

export function normalizeCrawlUrl(
  value: string,
  base: string,
): NormalizedCrawlUrl | null {
  const parsed = tryParseHttpUrl(value, base);

  if (!parsed) {
    return null;
  }

  parsed.hash = "";
  parsed.search = searchString(stripTrackingParams(parsed.searchParams));
  parsed.pathname = normalizePathname(parsed.pathname);

  return {
    href: parsed.toString(),
    identity: crawlIdentity(parsed),
    path: crawlPath(parsed),
    hostname: parsed.hostname,
    queryParamCount: [...parsed.searchParams.keys()].length,
  };
}

export function fileExtension(pathname: string): string | null {
  const lastSegment = pathname.split("/").filter(Boolean).at(-1);

  if (!lastSegment || !lastSegment.includes(".")) {
    return null;
  }

  const extension = lastSegment.split(".").pop()?.toLowerCase();
  return extension || null;
}

export function firstPathSegment(pathname: string): string | null {
  const segment = normalizePathname(pathname)
    .split("/")
    .filter(Boolean)[0];

  return segment ? segment.toLowerCase() : null;
}

export function isUtilityPath(pathname: string): boolean {
  const segments = normalizePathname(pathname)
    .toLowerCase()
    .split("/")
    .filter(Boolean);

  return segments.some((segment) => UTILITY_PATH_SEGMENTS.has(segment));
}

export function isLanguageAlternatePath(
  pathname: string,
  seedPathname: string,
): boolean {
  const candidateLang = firstPathSegment(pathname);
  const seedLang = firstPathSegment(seedPathname);

  if (!candidateLang || !LANGUAGE_PATH_SEGMENTS.has(candidateLang)) {
    return false;
  }

  return candidateLang !== seedLang;
}

export function isPaginationQuery(params: URLSearchParams): boolean {
  for (const key of params.keys()) {
    const lower = key.toLowerCase();

    if (!PAGINATION_QUERY_PARAMS.has(lower)) {
      continue;
    }

    const raw = params.get(key)?.trim() ?? "";
    const numeric = Number(raw);

    if (raw === "1") {
      continue;
    }

    if (Number.isFinite(numeric) && numeric > 1) {
      return true;
    }

    if (raw && raw !== "0") {
      return true;
    }
  }

  return false;
}

export function hasSessionOrFacetQuery(params: URLSearchParams): boolean {
  for (const key of params.keys()) {
    if (SESSION_OR_FACET_QUERY_PARAMS.has(key.toLowerCase())) {
      return true;
    }
  }

  return false;
}

export function classifySkipReason(options: {
  href: string;
  baseUrl: string;
  seedUrl: string;
  isSeed?: boolean;
  discoveredCount: number;
}): CrawlUrlDecision | CrawlUrlSkip {
  const { href, baseUrl, seedUrl, isSeed = false, discoveredCount } = options;

  if (UNSAFE_SCHEMES.test(href.trim())) {
    return { ok: false, href, reason: "unsupported-protocol" };
  }

  const parsed = tryParseHttpUrl(href, baseUrl);

  if (!parsed) {
    return { ok: false, href, reason: "unsupported-protocol" };
  }

  let seed: URL;

  try {
    seed = new URL(seedUrl);
  } catch {
    return { ok: false, href, reason: "unsupported-protocol" };
  }

  if (!isSameCrawlSite(parsed, seed)) {
    return { ok: false, href: parsed.toString(), reason: "off-site" };
  }

  const extension = fileExtension(parsed.pathname);

  if (extension && FILE_EXTENSIONS_TO_SKIP.has(extension)) {
    return { ok: false, href: parsed.toString(), reason: "file-type" };
  }

  if (!isSeed && isUtilityPath(parsed.pathname)) {
    return { ok: false, href: parsed.toString(), reason: "utility-path" };
  }

  if (!isSeed && isLanguageAlternatePath(parsed.pathname, seed.pathname)) {
    return {
      ok: false,
      href: parsed.toString(),
      reason: "language-alternate",
    };
  }

  const remainingParams = stripTrackingParams(parsed.searchParams);

  if (!isSeed && remainingParams.size > MAX_QUERY_PARAMS) {
    return { ok: false, href: parsed.toString(), reason: "query-explosion" };
  }

  if (!isSeed && isPaginationQuery(remainingParams)) {
    return { ok: false, href: parsed.toString(), reason: "pagination" };
  }

  if (!isSeed && hasSessionOrFacetQuery(remainingParams)) {
    return { ok: false, href: parsed.toString(), reason: "session-or-facet" };
  }

  const normalized = normalizeCrawlUrl(parsed.toString(), baseUrl);

  if (!normalized) {
    return { ok: false, href, reason: "unsupported-protocol" };
  }

  if (!isSeed && discoveredCount >= MAX_DISCOVERED_URLS) {
    return { ok: false, href: normalized.href, reason: "max-discovered" };
  }

  return { ok: true, url: normalized };
}
