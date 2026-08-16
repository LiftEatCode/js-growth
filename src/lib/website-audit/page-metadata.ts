import type {
  AuditCanonicalData,
  AuditMetaDescriptionData,
  AuditTitleData,
} from "./types";

export const TITLE_MIN_LENGTH = 15;
export const TITLE_MAX_LENGTH = 60;
export const META_DESCRIPTION_MIN_LENGTH = 50;
export const META_DESCRIPTION_MAX_LENGTH = 160;
export const TITLE_H1_ALIGNMENT_THRESHOLD = 0.3;

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "at",
  "by",
  "with",
  "from",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "our",
  "your",
  "we",
  "you",
  "this",
  "that",
  "into",
  "about",
]);

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function buildTextFieldData(
  values: string[],
): AuditTitleData {
  const normalized = values.map(normalizeWhitespace);
  const value =
    normalized.find((item) => item.length > 0) ?? null;

  return {
    value,
    count: values.length,
    length: value?.length ?? 0,
    isEmpty: value === null,
  };
}

export function buildMetaDescriptionData(
  values: string[],
): AuditMetaDescriptionData {
  return buildTextFieldData(values);
}

function defaultPort(protocol: string): string {
  if (protocol === "https:") {
    return "443";
  }

  if (protocol === "http:") {
    return "80";
  }

  return "";
}

function normalizedHostPort(url: URL): string {
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const port = url.port || defaultPort(url.protocol);
  const usesDefaultPort =
    (url.protocol === "https:" && port === "443") ||
    (url.protocol === "http:" && port === "80");

  return usesDefaultPort ? hostname : `${hostname}:${port}`;
}

export function isSameSiteUrl(left: URL, right: URL): boolean {
  return normalizedHostPort(left) === normalizedHostPort(right);
}

export function isSamePageUrl(left: URL, right: URL): boolean {
  return locationKey(left, true) === locationKey(right, true);
}

export function getPageLocationKey(url: URL): string {
  return locationKey(url, true);
}

function locationKey(
  url: URL,
  includeProtocol: boolean,
): string {
  const host = normalizedHostPort(url);
  const pathname = url.pathname || "/";
  const prefix = includeProtocol ? `${url.protocol}//` : "";

  // Fragments are ignored. Trailing slashes are kept as-is.
  return `${prefix}${host}${pathname}${url.search}`;
}

export function buildCanonicalData(
  rawValues: string[],
  finalUrl: string,
): AuditCanonicalData {
  const count = rawValues.length;
  const trimmedValues = rawValues.map((value) => value.trim());
  const value =
    trimmedValues.find((item) => item.length > 0) ?? null;

  if (!value) {
    return {
      rawValues: trimmedValues,
      count,
      value: null,
      resolvedUrl: null,
      valid: false,
      selfReferencing: false,
      sameOrigin: false,
      protocolMatches: false,
    };
  }

  let resolved: URL;

  try {
    resolved = new URL(value, finalUrl);
  } catch {
    return {
      rawValues: trimmedValues,
      count,
      value,
      resolvedUrl: null,
      valid: false,
      selfReferencing: false,
      sameOrigin: false,
      protocolMatches: false,
    };
  }

  const valid =
    resolved.protocol === "http:" ||
    resolved.protocol === "https:";

  if (!valid) {
    return {
      rawValues: trimmedValues,
      count,
      value,
      resolvedUrl: null,
      valid: false,
      selfReferencing: false,
      sameOrigin: false,
      protocolMatches: false,
    };
  }

  let audited: URL;

  try {
    audited = new URL(finalUrl);
  } catch {
    return {
      rawValues: trimmedValues,
      count,
      value,
      resolvedUrl: resolved.toString(),
      valid: true,
      selfReferencing: false,
      sameOrigin: false,
      protocolMatches: false,
    };
  }

  const protocolMatches = audited.protocol === resolved.protocol;
  const sameOrigin =
    normalizedHostPort(audited) === normalizedHostPort(resolved);
  const selfReferencing =
    locationKey(audited, true) === locationKey(resolved, true);

  return {
    rawValues: trimmedValues,
    count,
    value,
    resolvedUrl: resolved.toString(),
    valid: true,
    selfReferencing,
    sameOrigin,
    protocolMatches,
  };
}

export function tokenizeMeaningfulWords(value: string): string[] {
  const tokens = normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (token) => token.length > 1 && !STOP_WORDS.has(token),
    );

  return [...new Set(tokens)];
}

export function computeTokenOverlap(
  left: string,
  right: string,
): number | null {
  const leftTokens = tokenizeMeaningfulWords(left);
  const rightTokens = tokenizeMeaningfulWords(right);

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return null;
  }

  const rightSet = new Set(rightTokens);
  const sharedCount = leftTokens.filter((token) =>
    rightSet.has(token),
  ).length;

  return sharedCount / Math.min(leftTokens.length, rightTokens.length);
}

export function isAuditTitleData(
  value: unknown,
): value is AuditTitleData {
  return (
    typeof value === "object" &&
    value !== null &&
    "count" in value &&
    "isEmpty" in value &&
    "length" in value
  );
}

export function isAuditMetaDescriptionData(
  value: unknown,
): value is AuditMetaDescriptionData {
  return isAuditTitleData(value);
}

export function isAuditCanonicalData(
  value: unknown,
): value is AuditCanonicalData {
  return (
    typeof value === "object" &&
    value !== null &&
    "rawValues" in value &&
    "count" in value &&
    "valid" in value
  );
}

/**
 * Older stored audits used string fields for title, description,
 * and canonical URL. New audits use structured objects.
 */
export function getAuditTitleText(
  title: AuditTitleData | string | null | undefined,
): string | null {
  if (title == null) {
    return null;
  }

  if (typeof title === "string") {
    return normalizeWhitespace(title) || null;
  }

  return title.value;
}

export function getAuditMetaDescriptionText(
  metaDescription:
    | AuditMetaDescriptionData
    | string
    | null
    | undefined,
): string | null {
  if (metaDescription == null) {
    return null;
  }

  if (typeof metaDescription === "string") {
    return normalizeWhitespace(metaDescription) || null;
  }

  return metaDescription.value;
}

export function getAuditCanonicalUrl(pageData: {
  canonical?: AuditCanonicalData;
  canonicalUrl?: string | null;
}): string | null {
  if (pageData.canonical) {
    return (
      pageData.canonical.resolvedUrl ??
      pageData.canonical.value
    );
  }

  const legacy = pageData.canonicalUrl?.trim();

  return legacy || null;
}
