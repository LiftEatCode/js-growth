const REPORT_UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const REPORT_PATH_UUID_PATTERN = new RegExp(
  `^(/reports?)/${REPORT_UUID_PATTERN.source}(?=/|$)`,
  "i",
);

/** Public commercial share routes — raw tokens must never reach analytics. */
const SECURE_SHARE_PATH_PATTERN = /^(\/(?:proposal|agreement))\/[^/]+(?=\/|$)/i;

/**
 * High-entropy share tokens (base64url from ~32 bytes) and Stripe session-like
 * values. Used for negative scans — not as the primary path rewrite rule.
 */
const CAPABILITY_TOKEN_SHAPE_PATTERN =
  /(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{32,})(?=[^A-Za-z0-9_-]|$)/;

const SENSITIVE_QUERY_PATTERN =
  /session_id|payment_intent|client_reference|report[_-]?id|share[_-]?token|checkout[_-]?session|cs_(?:test|live)_|pi_(?:test|live)_/i;

export function containsReportUuid(value: string): boolean {
  return REPORT_UUID_PATTERN.test(value);
}

/** True when a string still looks like it embeds a raw capability/share token. */
export function containsCapabilityTokenShape(value: string): boolean {
  return CAPABILITY_TOKEN_SHAPE_PATTERN.test(value);
}

/**
 * Redacts capability-bearing URL segments for third-party analytics only.
 * Application routing is unchanged.
 *
 * - `/report/{uuid}` → `/report/[id]`
 * - `/proposal/{token}` → `/proposal/[secure]`
 * - `/agreement/{token}` → `/agreement/[secure]`
 */
export function sanitizeAnalyticsPagePath(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return path
    .replace(REPORT_PATH_UUID_PATTERN, "$1/[id]")
    .replace(SECURE_SHARE_PATH_PATTERN, "$1/[secure]");
}

export function sanitizeAnalyticsText(value: string): string {
  return value
    .replace(REPORT_UUID_PATTERN, "[id]")
    .replace(SECURE_SHARE_PATH_PATTERN, "$1/[secure]");
}

function normalizeSearch(search: string | undefined): string {
  if (!search) {
    return "";
  }

  return search.startsWith("?") ? search : `?${search}`;
}

export function shouldIncludeAnalyticsSearch(
  pathname: string,
  search: string | undefined,
): boolean {
  const sanitizedPath = sanitizeAnalyticsPagePath(pathname);
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (sanitizedPath !== normalizedPath) {
    return false;
  }

  const query = normalizeSearch(search);
  if (!query || query === "?") {
    return false;
  }

  return !SENSITIVE_QUERY_PATTERN.test(query);
}

export function buildAnalyticsPageViewParams(input: {
  origin: string;
  pathname: string;
  search?: string;
  title?: string;
  referrer?: string;
}): {
  page_path: string;
  page_location: string;
  page_title: string;
  page_referrer: string;
} {
  const pagePath = sanitizeAnalyticsPagePath(input.pathname);
  const includeSearch = shouldIncludeAnalyticsSearch(
    input.pathname,
    input.search,
  );
  const locationPath = includeSearch
    ? `${pagePath}${normalizeSearch(input.search)}`
    : pagePath;
  const origin = input.origin.replace(/\/+$/, "");

  return {
    page_path: pagePath,
    page_location: `${origin}${locationPath}`,
    page_title: sanitizeAnalyticsText(input.title ?? ""),
    page_referrer: input.referrer
      ? sanitizeAnalyticsUrl(input.referrer, origin)
      : "",
  };
}

export function sanitizeAnalyticsUrl(url: string, fallbackOrigin: string): string {
  try {
    const parsed = new URL(url, fallbackOrigin);
    const params = buildAnalyticsPageViewParams({
      origin: parsed.origin,
      pathname: parsed.pathname,
      search: parsed.search,
    });
    return params.page_location;
  } catch {
    return sanitizeAnalyticsPagePath(url);
  }
}

/**
 * Assert-friendly: serialized analytics payloads must not contain the raw token.
 */
export function analyticsPayloadExposesToken(
  payload: unknown,
  rawToken: string,
): boolean {
  if (!rawToken) {
    return false;
  }
  return JSON.stringify(payload).includes(rawToken);
}
