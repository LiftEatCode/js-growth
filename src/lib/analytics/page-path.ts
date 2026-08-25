const REPORT_UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

/** Public commercial share routes — raw tokens must never reach analytics. */
const SECURE_SHARE_PATH_PATTERN = /^(\/(?:proposal|agreement))\/[^/]+(?=\/|$)/i;

/**
 * High-entropy share tokens (base64url from ~32 bytes).
 * Used for negative scans — not as the primary path rewrite rule.
 */
const CAPABILITY_TOKEN_SHAPE_PATTERN =
  /(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{32,})(?=[^A-Za-z0-9_-]|$)/;

/**
 * Static semantic segments under /report and /reports that must remain visible
 * in analytics. Any other segment in those trees is treated as a record ID.
 * Prefer this route-family whitelist over broad “long segment” replacement.
 */
const PUBLIC_REPORT_STATIC_SEGMENTS = new Set([
  "report",
  "purchase",
  "success",
  "cancelled",
  "unavailable",
  "pdf",
  "professional",
]);

const INTERNAL_REPORTS_STATIC_SEGMENTS = new Set([
  "reports",
  "clients",
  "projects",
  "opportunities",
  "scope",
  "pricing",
  "proposal",
  "agreement",
  "prospecting",
  "prospects",
  "discovery",
  "competitors",
  "audits",
  "competitive-report",
  "growth",
  "utm-builder",
  "conversion",
  "attribution",
  "content",
  "follow-up",
  "local",
  "leads",
  "new",
]);

const SENSITIVE_QUERY_PATTERN =
  /session_id|payment_intent|client_reference|share[_-]?token|checkout[_-]?session|cs_(?:test|live)_|pi_(?:test|live)_|report[_-]?id|client[_-]?id|project[_-]?id|opportunity[_-]?id|prospect[_-]?id|campaign[_-]?id|proposal[_-]?id|agreement[_-]?id|payment[_-]?id|scope[_-]?id|pricing[_-]?id|competitor[_-]?id|audit[_-]?id|run[_-]?id|lead[_-]?id|delivery[_-]?id/i;

export function containsReportUuid(value: string): boolean {
  return REPORT_UUID_PATTERN.test(value);
}

/** True when a string still looks like it embeds a raw capability/share token. */
export function containsCapabilityTokenShape(value: string): boolean {
  return CAPABILITY_TOKEN_SHAPE_PATTERN.test(value);
}

/**
 * Redact dynamic record-identity segments under a known route family.
 * Static semantic segments stay intact.
 */
function sanitizeRouteFamilyPath(
  pathname: string,
  rootSegment: "report" | "reports",
  staticSegments: ReadonlySet<string>,
): string {
  const parts = pathname.split("/");
  // parts[0] is "" for absolute paths like "/reports/..."
  if (parts.length < 2 || parts[1] !== rootSegment) {
    return pathname;
  }

  const out = ["", rootSegment];
  for (let i = 2; i < parts.length; i += 1) {
    const segment = parts[i];
    if (!segment) {
      out.push(segment);
      continue;
    }
    if (staticSegments.has(segment)) {
      out.push(segment);
      continue;
    }
    out.push("[id]");
  }

  return out.join("/");
}

/**
 * Redacts capability-bearing and commercial-record URL segments for third-party
 * analytics only. Application routing is unchanged.
 *
 * Public:
 * - `/report/{uuid}` → `/report/[id]`
 * - `/proposal/{token}` → `/proposal/[secure]`
 * - `/agreement/{token}` → `/agreement/[secure]`
 *
 * Internal (route families preserved):
 * - `/reports/clients/{id}/projects/{id}` → `/reports/clients/[id]/projects/[id]`
 * - `/reports/opportunities/{id}/scope/{id}` → `/reports/opportunities/[id]/scope/[id]`
 * - `/reports/prospecting/{id}/prospects/{id}` → `/reports/prospecting/[id]/prospects/[id]`
 */
export function sanitizeAnalyticsPagePath(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (/^\/proposal(\/|$)/i.test(path) || /^\/agreement(\/|$)/i.test(path)) {
    return path.replace(SECURE_SHARE_PATH_PATTERN, "$1/[secure]");
  }

  if (/^\/reports(\/|$)/i.test(path)) {
    return sanitizeRouteFamilyPath(
      path,
      "reports",
      INTERNAL_REPORTS_STATIC_SEGMENTS,
    );
  }

  if (/^\/report(\/|$)/i.test(path)) {
    return sanitizeRouteFamilyPath(
      path,
      "report",
      PUBLIC_REPORT_STATIC_SEGMENTS,
    );
  }

  return path;
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

/** Known static segments for internal /reports analytics (exported for verify). */
export const ANALYTICS_INTERNAL_REPORTS_STATIC_SEGMENTS = [
  ...INTERNAL_REPORTS_STATIC_SEGMENTS,
] as const;
