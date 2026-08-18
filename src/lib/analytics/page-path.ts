const REPORT_UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const REPORT_PATH_UUID_PATTERN = new RegExp(
  `^(/reports?)/${REPORT_UUID_PATTERN.source}(?=/|$)`,
  "i",
);

const SENSITIVE_QUERY_PATTERN =
  /session_id|payment_intent|client_reference|report[_-]?id/i;

export function containsReportUuid(value: string): boolean {
  return REPORT_UUID_PATTERN.test(value);
}

export function sanitizeAnalyticsPagePath(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return path.replace(REPORT_PATH_UUID_PATTERN, "$1/[id]");
}

export function sanitizeAnalyticsText(value: string): string {
  return value.replace(REPORT_UUID_PATTERN, "[id]");
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
  if (sanitizedPath !== pathname && sanitizedPath !== `/${pathname}`) {
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
