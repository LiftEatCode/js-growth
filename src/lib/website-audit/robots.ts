import type {
  AuditRobotsData,
  AuditRobotsDirectiveData,
  AuditRobotsEffectiveData,
} from "./types";

function normalizeRobotsRaw(
  rawValue: string | null,
): string | null {
  if (rawValue === null) {
    return null;
  }

  const trimmed = rawValue.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function parseRobotsDirectives(
  rawValue: string | null,
): AuditRobotsDirectiveData {
  const raw = normalizeRobotsRaw(rawValue);

  const directives = raw
    ? raw
        .split(",")
        .map((directive) =>
          directive.trim().toLowerCase(),
        )
        .filter(Boolean)
    : [];

  const directiveSet = new Set(directives);

  const none = directiveSet.has("none");

  const maxSnippet =
    directives.find((directive) =>
      directive.startsWith("max-snippet:"),
    ) ?? null;

  const maxImagePreview =
    directives.find((directive) =>
      directive.startsWith("max-image-preview:"),
    ) ?? null;

  const maxVideoPreview =
    directives.find((directive) =>
      directive.startsWith("max-video-preview:"),
    ) ?? null;

  return {
    raw,
    directives,
    noindex: none || directiveSet.has("noindex"),
    nofollow: none || directiveSet.has("nofollow"),
    none,
    noarchive: directiveSet.has("noarchive"),
    nosnippet: directiveSet.has("nosnippet"),
    maxSnippet,
    maxImagePreview,
    maxVideoPreview,
  };
}

export function combineEffectiveRobots(
  meta: AuditRobotsDirectiveData,
  header: AuditRobotsDirectiveData,
): AuditRobotsEffectiveData {
  return {
    noindex: meta.noindex || header.noindex,
    nofollow: meta.nofollow || header.nofollow,
    noarchive: meta.noarchive || header.noarchive,
    nosnippet: meta.nosnippet || header.nosnippet,
  };
}

export function buildAuditRobotsData(
  metaRaw: string | null,
  headerRaw: string | null,
): AuditRobotsData {
  const meta = parseRobotsDirectives(metaRaw);
  const header = parseRobotsDirectives(headerRaw);

  return {
    meta,
    header,
    effective: combineEffectiveRobots(meta, header),
  };
}

function isCombinedRobotsData(
  robots: AuditRobotsData | AuditRobotsDirectiveData,
): robots is AuditRobotsData {
  return (
    "meta" in robots &&
    "header" in robots &&
    "effective" in robots
  );
}

/**
 * Older stored audits used a flat robots object.
 * Newly generated audits use meta/header/effective.
 */
export function normalizeAuditRobotsData(
  robots: AuditRobotsData | AuditRobotsDirectiveData,
): AuditRobotsData {
  if (isCombinedRobotsData(robots)) {
    return robots;
  }

  return {
    meta: robots,
    header: parseRobotsDirectives(null),
    effective: {
      noindex: robots.noindex,
      nofollow: robots.nofollow,
      noarchive: robots.noarchive,
      nosnippet: robots.nosnippet,
    },
  };
}
